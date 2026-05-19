import numpy as np
import cv2
from typing import List, Tuple, Optional
from dataclasses import dataclass
from collections import deque


@dataclass
class AppearanceFeature:
    feature_vector: np.ndarray
    class_id: int
    class_name: str
    camera_id: str
    timestamp: float
    bbox: List[float]


class AppearanceFeatureExtractor:
    def __init__(self, feature_dim: int = 128):
        self.feature_dim = feature_dim
        self.color_bins = 32
        self.hog_bins = 9
        
    def extract(self, image: np.ndarray, bbox: List[float], 
                class_id: int, class_name: str, camera_id: str) -> AppearanceFeature:
        x1, y1, x2, y2 = [int(v) for v in bbox]
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(image.shape[1], x2)
        y2 = min(image.shape[0], y2)
        
        if x2 <= x1 or y2 <= y1:
            return self._get_dummy_feature(class_id, class_name, camera_id, bbox)
        
        patch = image[y1:y2, x1:x2]
        
        color_hist = self._compute_color_histogram(patch)
        texture_hist = self._compute_texture_feature(patch)
        shape_feature = self._compute_shape_feature(patch)
        class_feature = self._compute_class_encoding(class_id, class_name)
        
        feature = np.concatenate([color_hist, texture_hist, shape_feature, class_feature])
        
        if len(feature) < self.feature_dim:
            feature = np.pad(feature, (0, self.feature_dim - len(feature)))
        else:
            feature = feature[:self.feature_dim]
        
        feature = feature / (np.linalg.norm(feature) + 1e-8)
        
        return AppearanceFeature(
            feature_vector=feature,
            class_id=class_id,
            class_name=class_name,
            camera_id=camera_id,
            timestamp=0.0,
            bbox=bbox
        )
    
    def _compute_color_histogram(self, patch: np.ndarray) -> np.ndarray:
        if len(patch.shape) == 3:
            hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
            
            hist_h = cv2.calcHist([hsv], [0], None, [self.color_bins], [0, 180])
            hist_s = cv2.calcHist([hsv], [1], None, [self.color_bins], [0, 256])
            hist_v = cv2.calcHist([hsv], [2], None, [self.color_bins], [0, 256])
            
            hist_h = hist_h.flatten() / (hist_h.sum() + 1e-8)
            hist_s = hist_s.flatten() / (hist_s.sum() + 1e-8)
            hist_v = hist_v.flatten() / (hist_v.sum() + 1e-8)
            
            return np.concatenate([hist_h, hist_s, hist_v])
        else:
            return np.zeros(self.color_bins * 3)
    
    def _compute_texture_feature(self, patch: np.ndarray) -> np.ndarray:
        if patch.shape[0] < 16 or patch.shape[1] < 16:
            return np.zeros(36)
        
        gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY) if len(patch.shape) == 3 else patch
        
        gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        
        magnitude, angle = cv2.cartToPolar(gx, gy, angleInDegrees=True)
        
        bin_width = 360 / self.hog_bins
        bins = (angle / bin_width).astype(int) % self.hog_bins
        
        cell_size = 8
        cells_x = gray.shape[1] // cell_size
        cells_y = gray.shape[0] // cell_size
        
        hog_features = []
        for i in range(min(2, cells_y)):
            for j in range(min(2, cells_x)):
                cell_mag = magnitude[i*cell_size:(i+1)*cell_size, j*cell_size:(j+1)*cell_size]
                cell_bin = bins[i*cell_size:(i+1)*cell_size, j*cell_size:(j+1)*cell_size]
                
                hist = np.bincount(cell_bin.flatten(), weights=cell_mag.flatten(), minlength=self.hog_bins)
                hist = hist / (hist.sum() + 1e-8)
                hog_features.extend(hist)
        
        return np.array(hog_features if hog_features else np.zeros(36))
    
    def _compute_shape_feature(self, patch: np.ndarray) -> np.ndarray:
        h, w = patch.shape[:2]
        
        aspect_ratio = w / max(h, 1)
        area = w * h
        perimeter = 2 * (w + h)
        
        if h > 20 and w > 20:
            gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY) if len(patch.shape) == 3 else patch
            edges = cv2.Canny(gray, 50, 150)
            edge_density = edges.sum() / (area * 255 + 1e-8)
        else:
            edge_density = 0
        
        return np.array([aspect_ratio / 5.0, min(area / 10000.0, 1.0), edge_density])
    
    def _compute_class_encoding(self, class_id: int, class_name: str) -> np.ndarray:
        encoding = np.zeros(20)
        encoding[class_id % 20] = 1.0
        
        name_hash = hash(class_name) % (1 << 16)
        encoding[10 + (name_hash % 10)] = 0.5
        
        return encoding
    
    def _get_dummy_feature(self, class_id: int, class_name: str, 
                           camera_id: str, bbox: List[float]) -> AppearanceFeature:
        return AppearanceFeature(
            feature_vector=np.zeros(self.feature_dim),
            class_id=class_id,
            class_name=class_name,
            camera_id=camera_id,
            timestamp=0.0,
            bbox=bbox
        )


class FeatureMatcher:
    def __init__(self, threshold: float = 0.6):
        self.threshold = threshold
        self.feature_history = {}
        self.max_history = 50
    
    def compute_similarity(self, feat1: np.ndarray, feat2: np.ndarray) -> float:
        cosine_sim = np.dot(feat1, feat2) / (np.linalg.norm(feat1) * np.linalg.norm(feat2) + 1e-8)
        
        euclid_dist = np.linalg.norm(feat1 - feat2)
        euclid_sim = 1.0 / (1.0 + euclid_dist)
        
        return 0.7 * cosine_sim + 0.3 * euclid_sim
    
    def match(self, query_feature: np.ndarray, candidates: List[np.ndarray]) -> Tuple[int, float]:
        if not candidates:
            return -1, 0.0
        
        similarities = [self.compute_similarity(query_feature, cand) for cand in candidates]
        best_idx = int(np.argmax(similarities))
        best_score = similarities[best_idx]
        
        return best_idx, best_score
    
    def match_with_rerank(self, query_feature: np.ndarray, 
                          query_class: int,
                          candidate_features: List[np.ndarray],
                          candidate_classes: List[int]) -> Tuple[int, float]:
        class_mask = np.array([c == query_class for c in candidate_classes])
        
        if not np.any(class_mask):
            return -1, 0.0
        
        valid_indices = np.where(class_mask)[0]
        valid_features = [candidate_features[i] for i in valid_indices]
        
        if not valid_features:
            return -1, 0.0
        
        best_valid_idx, score = self.match(query_feature, valid_features)
        
        if best_valid_idx >= 0:
            return valid_indices[best_valid_idx], score
        
        return -1, 0.0
    
    def add_to_history(self, track_id: int, feature: np.ndarray):
        if track_id not in self.feature_history:
            self.feature_history[track_id] = deque(maxlen=self.max_history)
        self.feature_history[track_id].append(feature)
    
    def get_history_feature(self, track_id: int) -> Optional[np.ndarray]:
        if track_id not in self.feature_history or not self.feature_history[track_id]:
            return None
        
        return np.mean(self.feature_history[track_id], axis=0)


class CrossCameraMatcher:
    def __init__(self):
        self.camera_tracks = {}
        self.matcher = FeatureMatcher(threshold=0.55)
        self.global_id_counter = 1
        self.id_mapping = {}
        
        self.spatial_weight = 0.3
        self.appearance_weight = 0.5
        self.temporal_weight = 0.2
    
    def register_track(self, camera_id: str, local_id: int, 
                       feature: np.ndarray, class_id: int,
                       position: Optional[Tuple[float, float]] = None):
        key = (camera_id, local_id)
        self.camera_tracks[key] = {
            'feature': feature,
            'class_id': class_id,
            'position': position,
            'last_seen': 0.0
        }
    
    def find_match(self, camera_id: str, local_id: int,
                   feature: np.ndarray, class_id: int,
                   position: Optional[Tuple[float, float]] = None) -> Tuple[Optional[int], float]:
        query_key = (camera_id, local_id)
        
        candidates = []
        candidate_keys = []
        
        for key, data in self.camera_tracks.items():
            if key[0] != camera_id and data['class_id'] == class_id:
                candidates.append(data)
                candidate_keys.append(key)
        
        if not candidates:
            return None, 0.0
        
        scores = []
        for cand in candidates:
            app_score = self.matcher.compute_similarity(feature, cand['feature'])
            
            spatial_score = 1.0
            if position and cand['position']:
                dist = np.sqrt((position[0] - cand['position'][0])**2 + 
                               (position[1] - cand['position'][1])**2)
                spatial_score = np.exp(-dist / 100.0)
            
            total_score = (self.appearance_weight * app_score + 
                           self.spatial_weight * spatial_score)
            scores.append(total_score)
        
        best_idx = int(np.argmax(scores))
        best_score = scores[best_idx]
        best_key = candidate_keys[best_idx]
        
        if best_score > 0.4:
            if best_key in self.id_mapping:
                global_id = self.id_mapping[best_key]
                self.id_mapping[query_key] = global_id
                return global_id, best_score
        
        return None, best_score
    
    def assign_global_id(self, camera_id: str, local_id: int) -> int:
        key = (camera_id, local_id)
        if key in self.id_mapping:
            return self.id_mapping[key]
        
        new_id = self.global_id_counter
        self.global_id_counter += 1
        self.id_mapping[key] = new_id
        return new_id
    
    def get_global_id(self, camera_id: str, local_id: int) -> Optional[int]:
        return self.id_mapping.get((camera_id, local_id))
    
    def cleanup_old_tracks(self, max_age: float = 300.0):
        current_time = 0.0
        old_keys = []
        for key, data in self.camera_tracks.items():
            if current_time - data['last_seen'] > max_age:
                old_keys.append(key)
        
        for key in old_keys:
            del self.camera_tracks[key]
            if key in self.id_mapping:
                del self.id_mapping[key]
