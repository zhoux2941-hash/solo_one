import asyncio
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from collections import deque

from .reid.feature_extractor import CrossCameraMatcher, AppearanceFeature


@dataclass
class GlobalTrack:
    global_id: int
    class_id: int
    class_name: str
    first_seen: float
    last_seen: float
    cameras_seen: List[str] = field(default_factory=list)
    current_camera: str = ""
    position_history: Dict[str, List[Tuple[float, float, float]]] = field(default_factory=dict)
    feature_history: List[np.ndarray] = field(default_factory=list)
    bbox: List[float] = field(default_factory=list)
    confidence: float = 0.0
    active: bool = True
    
    def add_observation(self, camera_id: str, bbox: List[float], 
                        confidence: float, timestamp: float,
                        feature: Optional[np.ndarray] = None,
                        position_3d: Optional[List[float]] = None):
        if camera_id not in self.cameras_seen:
            self.cameras_seen.append(camera_id)
        
        self.current_camera = camera_id
        self.bbox = bbox
        self.confidence = max(self.confidence, confidence)
        self.last_seen = timestamp
        
        if camera_id not in self.position_history:
            self.position_history[camera_id] = []
        
        center_x = (bbox[0] + bbox[2]) / 2
        center_y = (bbox[1] + bbox[3]) / 2
        self.position_history[camera_id].append((center_x, center_y, timestamp))
        
        if feature is not None:
            self.feature_history.append(feature)
            if len(self.feature_history) > 20:
                self.feature_history.pop(0)
    
    def get_average_feature(self) -> Optional[np.ndarray]:
        if not self.feature_history:
            return None
        return np.mean(self.feature_history, axis=0)


@dataclass
class TrackAssociation:
    local_track_id: int
    camera_id: str
    global_track_id: Optional[int]
    confidence: float
    method: str  # 'feature', 'spatial', 'temporal', 'new'


class GlobalTracker:
    def __init__(self, node_manager):
        self.node_manager = node_manager
        self.tracks: Dict[int, GlobalTrack] = {}
        self.local_to_global: Dict[Tuple[str, int], int] = {}
        self.global_to_local: Dict[int, Dict[str, int]] = {}
        
        self.reid_matcher = CrossCameraMatcher()
        
        self.max_track_age = 300.0
        self.association_threshold = 0.45
        self.feature_weight = 0.6
        self.spatial_weight = 0.3
        self.temporal_weight = 0.1
        
        self.id_counter = 1
        self.lock = asyncio.Lock()
    
    async def update(self, camera_id: str, local_tracks: List[Dict]) -> List[TrackAssociation]:
        async with self.lock:
            associations = []
            
            current_time = datetime.now().timestamp()
            
            for local_track in local_tracks:
                local_id = local_track['track_id']
                bbox = local_track['bbox']
                class_id = local_track['class_id']
                class_name = local_track['class_name']
                confidence = local_track['confidence']
                
                feature = local_track.get('feature_vector')
                position_3d = local_track.get('position_3d')
                
                key = (camera_id, local_id)
                
                if key in self.local_to_global:
                    global_id = self.local_to_global[key]
                    if global_id in self.tracks:
                        track = self.tracks[global_id]
                        track.add_observation(
                            camera_id, bbox, confidence, current_time,
                            feature, position_3d
                        )
                        associations.append(TrackAssociation(
                            local_track_id=local_id,
                            camera_id=camera_id,
                            global_track_id=global_id,
                            confidence=1.0,
                            method='existing'
                        ))
                        continue
                
                global_id, match_score = self._find_matching_track(
                    camera_id, local_id, class_id, bbox, feature
                )
                
                if global_id is not None and match_score >= self.association_threshold:
                    self.local_to_global[key] = global_id
                    if global_id not in self.global_to_local:
                        self.global_to_local[global_id] = {}
                    self.global_to_local[global_id][camera_id] = local_id
                    
                    track = self.tracks[global_id]
                    track.add_observation(
                        camera_id, bbox, confidence, current_time,
                        feature, position_3d
                    )
                    
                    associations.append(TrackAssociation(
                        local_track_id=local_id,
                        camera_id=camera_id,
                        global_track_id=global_id,
                        confidence=match_score,
                        method='matched'
                    ))
                else:
                    new_global_id = self._create_new_track(
                        camera_id, local_id, class_id, class_name,
                        bbox, confidence, current_time, feature, position_3d
                    )
                    
                    associations.append(TrackAssociation(
                        local_track_id=local_id,
                        camera_id=camera_id,
                        global_track_id=new_global_id,
                        confidence=1.0,
                        method='new'
                    ))
            
            await self._cleanup_old_tracks()
            
            return associations
    
    def _find_matching_track(self, camera_id: str, local_id: int,
                             class_id: int, bbox: List[float],
                             feature: Optional[np.ndarray]) -> Tuple[Optional[int], float]:
        best_score = 0.0
        best_global_id = None
        
        center_x = (bbox[0] + bbox[2]) / 2
        center_y = (bbox[1] + bbox[3]) / 2
        
        for global_id, track in self.tracks.items():
            if track.class_id != class_id:
                continue
            
            if not track.active:
                continue
            
            score = 0.0
            weight_sum = 0.0
            
            if feature is not None:
                avg_feature = track.get_average_feature()
                if avg_feature is not None:
                    feat_sim = np.dot(feature, avg_feature) / (
                        np.linalg.norm(feature) * np.linalg.norm(avg_feature) + 1e-8
                    )
                    score += self.feature_weight * feat_sim
                    weight_sum += self.feature_weight
            
            other_camera_positions = []
            for cam, positions in track.position_history.items():
                if cam != camera_id and positions:
                    other_camera_positions.extend(positions)
            
            if other_camera_positions:
                other_positions = [(p[0], p[1]) for p in other_camera_positions]
                min_dist = min(np.sqrt((x - center_x)**2 + (y - center_y)**2) 
                               for x, y, t in other_camera_positions)
                spatial_sim = np.exp(-min_dist / 200.0)
                score += self.spatial_weight * spatial_sim
                weight_sum += self.spatial_weight
            
            if weight_sum > 0:
                score /= weight_sum
            
            if score > best_score:
                best_score = score
                best_global_id = global_id
        
        return best_global_id, best_score
    
    def _create_new_track(self, camera_id: str, local_id: int,
                          class_id: int, class_name: str,
                          bbox: List[float], confidence: float,
                          timestamp: float,
                          feature: Optional[np.ndarray] = None,
                          position_3d: Optional[List[float]] = None) -> int:
        new_id = self.id_counter
        self.id_counter += 1
        
        track = GlobalTrack(
            global_id=new_id,
            class_id=class_id,
            class_name=class_name,
            first_seen=timestamp,
            last_seen=timestamp,
            cameras_seen=[camera_id],
            current_camera=camera_id,
            bbox=bbox,
            confidence=confidence,
            active=True
        )
        
        if feature is not None:
            track.feature_history.append(feature)
        
        center_x = (bbox[0] + bbox[2]) / 2
        center_y = (bbox[1] + bbox[3]) / 2
        track.position_history[camera_id] = [(center_x, center_y, timestamp)]
        
        self.tracks[new_id] = track
        
        key = (camera_id, local_id)
        self.local_to_global[key] = new_id
        
        if new_id not in self.global_to_local:
            self.global_to_local[new_id] = {}
        self.global_to_local[new_id][camera_id] = local_id
        
        return new_id
    
    async def _cleanup_old_tracks(self):
        current_time = datetime.now().timestamp()
        
        old_tracks = []
        for global_id, track in self.tracks.items():
            if current_time - track.last_seen > self.max_track_age:
                old_tracks.append(global_id)
        
        for global_id in old_tracks:
            track = self.tracks[global_id]
            track.active = False
            
            for camera_id in track.cameras_seen:
                if camera_id in self.global_to_local.get(global_id, {}):
                    local_id = self.global_to_local[global_id][camera_id]
                    key = (camera_id, local_id)
                    if key in self.local_to_global:
                        del self.local_to_global[key]
            
            if global_id in self.global_to_local:
                del self.global_to_local[global_id]
        
        for global_id in old_tracks:
            del self.tracks[global_id]
    
    def get_global_track(self, global_id: int) -> Optional[GlobalTrack]:
        return self.tracks.get(global_id)
    
    def get_global_id(self, camera_id: str, local_id: int) -> Optional[int]:
        return self.local_to_global.get((camera_id, local_id))
    
    def get_all_active_tracks(self) -> List[GlobalTrack]:
        return [t for t in self.tracks.values() if t.active]
    
    def get_tracks_by_camera(self, camera_id: str) -> List[GlobalTrack]:
        return [t for t in self.tracks.values() 
                if t.active and camera_id in t.cameras_seen]
    
    def get_track_count(self) -> int:
        return len([t for t in self.tracks.values() if t.active])
    
    def get_cross_camera_statistics(self) -> Dict:
        stats = {
            'total_tracks': self.get_track_count(),
            'multi_camera_tracks': 0,
            'camera_distribution': {}
        }
        
        for track in self.tracks.values():
            if not track.active:
                continue
            
            if len(track.cameras_seen) > 1:
                stats['multi_camera_tracks'] += 1
            
            for camera_id in track.cameras_seen:
                if camera_id not in stats['camera_distribution']:
                    stats['camera_distribution'][camera_id] = 0
                stats['camera_distribution'][camera_id] += 1
        
        return stats
    
    async def handle_track_message(self, data: Dict):
        camera_id = data.get('camera_id', 'unknown')
        track = {
            'track_id': data.get('track_id'),
            'bbox': data.get('bbox', []),
            'class_id': data.get('class_id', 0),
            'class_name': data.get('class_name', ''),
            'confidence': data.get('confidence', 0.0),
            'feature_vector': np.array(data.get('feature_vector', [])) if data.get('feature_vector') else None,
            'position_3d': data.get('position_3d')
        }
        
        associations = await self.update(camera_id, [track])
        
        if associations:
            assoc = associations[0]
            response = {
                'type': 'global_id_assignment',
                'camera_id': camera_id,
                'local_track_id': assoc.local_track_id,
                'global_track_id': assoc.global_track_id,
                'confidence': assoc.confidence,
                'method': assoc.method
            }
            await self.node_manager.broadcast_to_nodes(response)
        
        return associations
