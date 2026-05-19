import numpy as np
import yaml
from typing import List, Dict, Any, Tuple
from collections import deque
from .kalman_filter import KalmanBoxTracker


class DeepSORT:
    def __init__(self, config_path: str = "config/config.yaml"):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.max_cosine_distance = self.config['tracker']['max_cosine_distance']
        self.nn_budget = self.config['tracker']['nn_budget']
        self.max_iou_distance = self.config['tracker']['max_iou_distance']
        self.max_age = self.config['tracker']['max_age']
        self.n_init = self.config['tracker']['n_init']
        
        self.tracks: List[KalmanBoxTracker] = []
        self._next_id = 1
        
        self.feature_history = {}
        self.max_feature_history = 100
        self.class_penalty = 1000.0
        
        self.position_weight = 2.0
        self.size_weight = 1.0
        self.aspect_ratio_weight = 1.0
        self.class_weight = 5.0
        self.confidence_weight = 1.0
    
    def predict(self):
        for track in self.tracks:
            track.predict()
    
    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if len(detections) == 0:
            self.tracks = [t for t in self.tracks if t.time_since_update <= self.max_age]
            return self._get_results()
        
        features = self._extract_features(detections)
        
        matches, unmatched_tracks, unmatched_detections = self._match(detections, features)
        
        for track_idx, detection_idx in matches:
            self.tracks[track_idx].update(detections[detection_idx])
            track_id = self.tracks[track_idx].id
            if track_id not in self.feature_history:
                self.feature_history[track_id] = deque(maxlen=self.max_feature_history)
            self.feature_history[track_id].append(features[detection_idx])
        
        for detection_idx in unmatched_detections:
            self._initiate_track(detections[detection_idx])
        
        for track_idx in unmatched_tracks:
            pass
        
        old_tracks = [t for t in self.tracks if t.time_since_update <= self.max_age]
        dead_track_ids = [t.id for t in self.tracks if t.time_since_update > self.max_age]
        for track_id in dead_track_ids:
            if track_id in self.feature_history:
                del self.feature_history[track_id]
        
        self.tracks = old_tracks
        
        return self._get_results()
    
    def _get_results(self) -> List[Dict[str, Any]]:
        results = []
        for track in self.tracks:
            if track.time_since_update == 0 and track.hit_streak >= self.n_init:
                bbox = track.get_state()[0].tolist()
                results.append({
                    'track_id': track.id,
                    'bbox': [int(x) for x in bbox],
                    'confidence': track.confidence,
                    'class_id': track.class_id,
                    'class_name': track.class_name,
                    'age': track.age
                })
        return results
    
    def _match(self, detections: List[Dict[str, Any]], features: np.ndarray):
        if len(self.tracks) == 0:
            return [], [], list(range(len(detections)))
        
        cost_matrix = self._compute_cost_matrix(detections, features)
        
        matches = []
        unmatched_tracks = list(range(len(self.tracks)))
        unmatched_detections = list(range(len(detections)))
        
        matched_rows, matched_cols = self._hungarian_match(cost_matrix)
        
        for row, col in zip(matched_rows, matched_cols):
            if cost_matrix[row, col] < self.max_iou_distance:
                matches.append((row, col))
                if row in unmatched_tracks:
                    unmatched_tracks.remove(row)
                if col in unmatched_detections:
                    unmatched_detections.remove(col)
        
        matches = self._filter_matches_by_class(matches, detections)
        
        return matches, unmatched_tracks, unmatched_detections
    
    def _compute_cost_matrix(self, detections: List[Dict[str, Any]], features: np.ndarray) -> np.ndarray:
        num_tracks = len(self.tracks)
        num_dets = len(detections)
        cost_matrix = np.zeros((num_tracks, num_dets))
        
        for i, track in enumerate(self.tracks):
            track_bbox = track.get_state()[0]
            track_class = track.class_id
            track_conf = track.confidence
            
            for j, det in enumerate(detections):
                det_bbox = det['bbox']
                det_class = det.get('class_id', -1)
                det_conf = det.get('confidence', 0.0)
                
                if track_class != det_class:
                    cost_matrix[i, j] = self.class_penalty
                    continue
                
                iou = self._iou(track_bbox, det_bbox)
                iou_cost = 1.0 - iou
                
                motion_cost = self._compute_motion_cost(track, det)
                
                feature_cost = 0.0
                if track.id in self.feature_history and len(self.feature_history[track.id]) > 0:
                    history_features = np.array(self.feature_history[track.id])
                    feature_dist = np.min(np.linalg.norm(history_features - features[j], axis=1))
                    feature_cost = feature_dist * 0.5
                
                time_penalty = min(track.time_since_update * 0.02, 0.3)
                
                conf_bonus = (1.0 - det_conf) * 0.1
                
                cost_matrix[i, j] = iou_cost + motion_cost + feature_cost + time_penalty + conf_bonus
        
        return cost_matrix
    
    def _compute_motion_cost(self, track: KalmanBoxTracker, detection: Dict[str, Any]) -> float:
        track_bbox = track.get_state()[0]
        det_bbox = detection['bbox']
        
        t_cx = (track_bbox[0] + track_bbox[2]) / 2.0
        t_cy = (track_bbox[1] + track_bbox[3]) / 2.0
        t_w = track_bbox[2] - track_bbox[0]
        t_h = track_bbox[3] - track_bbox[1]
        
        d_cx = (det_bbox[0] + det_bbox[2]) / 2.0
        d_cy = (det_bbox[1] + det_bbox[3]) / 2.0
        d_w = det_bbox[2] - det_bbox[0]
        d_h = det_bbox[3] - det_bbox[1]
        
        norm = max(t_w + t_h, 1.0)
        pos_dist = np.sqrt((t_cx - d_cx)**2 + (t_cy - d_cy)**2) / norm
        
        size_dist = abs((t_w * t_h) - (d_w * d_h)) / max(t_w * t_h, 1.0)
        
        t_ar = t_w / max(t_h, 1.0)
        d_ar = d_w / max(d_h, 1.0)
        ar_dist = abs(t_ar - d_ar)
        
        cost = (self.position_weight * pos_dist + 
                self.size_weight * size_dist + 
                self.aspect_ratio_weight * ar_dist) * 0.3
        
        return min(cost, 1.0)
    
    def _hungarian_match(self, cost_matrix: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        from scipy.optimize import linear_sum_assignment
        
        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        return row_ind, col_ind
    
    def _filter_matches_by_class(self, matches: List[Tuple[int, int]], 
                                  detections: List[Dict[str, Any]]) -> List[Tuple[int, int]]:
        filtered = []
        for track_idx, det_idx in matches:
            track = self.tracks[track_idx]
            det = detections[det_idx]
            if track.class_id == det.get('class_id', -1):
                filtered.append((track_idx, det_idx))
        return filtered
    
    def _initiate_track(self, detection: Dict[str, Any]):
        new_track = KalmanBoxTracker(detection)
        self.tracks.append(new_track)
    
    def _extract_features(self, detections: List[Dict[str, Any]]) -> np.ndarray:
        features = []
        for det in detections:
            bbox = det['bbox']
            center_x = (bbox[0] + bbox[2]) / 2.0
            center_y = (bbox[1] + bbox[3]) / 2.0
            width = bbox[2] - bbox[0]
            height = bbox[3] - bbox[1]
            area = width * height
            aspect_ratio = width / max(height, 1.0)
            class_id = det.get('class_id', 0)
            confidence = det.get('confidence', 0.0)
            
            feature = [
                center_x * 0.01,
                center_y * 0.01,
                width * 0.01,
                height * 0.01,
                area * 0.0001,
                aspect_ratio,
                class_id * 0.1,
                confidence
            ]
            
            feature = np.array(feature)
            norm = np.linalg.norm(feature)
            if norm > 0:
                feature = feature / norm
            
            features.append(feature)
        
        return np.array(features)
    
    def _iou(self, bbox1: List[float], bbox2: List[float]) -> float:
        x1 = max(bbox1[0], bbox2[0])
        y1 = max(bbox1[1], bbox2[1])
        x2 = min(bbox1[2], bbox2[2])
        y2 = min(bbox1[3], bbox2[3])
        
        if x2 <= x1 or y2 <= y1:
            return 0.0
        
        intersection = (x2 - x1) * (y2 - y1)
        area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
        area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def reset(self):
        self.tracks = []
        self.feature_history.clear()
        KalmanBoxTracker.count = 0
