import asyncio
import json
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import asdict

from .node_manager import NodeManager, TrackMessage
from .global_tracker import GlobalTracker
from .time_sync import TimeSynchronizer, LatencyEstimator
from .reid.feature_extractor import AppearanceFeatureExtractor


class DistributedTracker:
    def __init__(self, config_path: str = "config/config.yaml"):
        self.config_path = config_path
        import yaml
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.node_manager = NodeManager(config_path)
        self.global_tracker = GlobalTracker(self.node_manager)
        self.time_synchronizer = TimeSynchronizer(self.node_manager)
        self.latency_estimator = LatencyEstimator()
        self.feature_extractor = AppearanceFeatureExtractor()
        
        self.is_master = self.node_manager.is_master
        self.camera_id = self.node_manager.camera_id
        
        self.local_tracks = {}
        self.frame_count = 0
        
        self._setup_message_handlers()
        
        self.running = False
    
    def _setup_message_handlers(self):
        self.node_manager.message_handlers['track_update'] = self._handle_track_update
        self.node_manager.message_handlers['time_sync_request'] = self._handle_time_sync_request
        self.node_manager.message_handlers['time_sync_response'] = self._handle_time_sync_response
        self.node_manager.message_handlers['time_sync'] = self._handle_time_sync
        self.node_manager.message_handlers['global_id_request'] = self._handle_global_id_request
    
    async def start(self):
        self.running = True
        
        await self.node_manager.start()
        await self.time_synchronizer.start()
        
        print(f"[DistributedTracker] Node {self.node_manager.node_id} started")
        print(f"  Type: {'MASTER' if self.is_master else 'EDGE'}")
        print(f"  Camera ID: {self.camera_id}")
        print(f"  Region: {self.node_manager.region}")
    
    async def stop(self):
        self.running = False
        await self.node_manager.stop()
    
    async def process_local_tracks(self, tracks: List[Dict], frame: Optional[np.ndarray] = None):
        self.frame_count += 1
        synced_time = self.time_synchronizer.get_synced_time()
        
        enhanced_tracks = []
        
        for track in tracks:
            bbox = track['bbox']
            class_id = track['class_id']
            class_name = track['class_name']
            
            feature = None
            if frame is not None:
                appearance = self.feature_extractor.extract(
                    frame, bbox, class_id, class_name, self.camera_id
                )
                feature = appearance.feature_vector
            
            enhanced_track = {
                **track,
                'feature_vector': feature.tolist() if feature is not None else None,
                'timestamp': synced_time
            }
            enhanced_tracks.append(enhanced_track)
            
            if feature is not None:
                track_msg = TrackMessage(
                    message_id=f"{self.node_manager.node_id}_{self.frame_count}_{track['track_id']}",
                    source_node=self.node_manager.node_id,
                    timestamp=synced_time,
                    track_id=track['track_id'],
                    global_id=None,
                    class_id=class_id,
                    class_name=class_name,
                    bbox=bbox,
                    confidence=track['confidence'],
                    feature_vector=feature.tolist(),
                    camera_id=self.camera_id
                )
                await self.node_manager.send_track_update(track_msg)
        
        if self.is_master:
            associations = await self.global_tracker.update(
                self.camera_id, enhanced_tracks
            )
            
            results = []
            for track, assoc in zip(tracks, associations):
                results.append({
                    **track,
                    'global_id': assoc.global_track_id,
                    'assoc_confidence': assoc.confidence,
                    'assoc_method': assoc.method
                })
            
            return results
        
        return tracks
    
    async def _handle_track_update(self, data: Dict, websocket):
        if not self.is_master:
            return
        
        receive_time = datetime.now().timestamp()
        send_time = data.get('timestamp', receive_time)
        latency = receive_time - send_time
        
        self.latency_estimator.add_measurement(data['source_node'], latency)
        
        await self.global_tracker.handle_track_message(data)
    
    async def _handle_time_sync_request(self, data: Dict, websocket):
        await self.time_synchronizer.handle_time_request(data)
    
    async def _handle_time_sync_response(self, data: Dict, websocket):
        await self.time_synchronizer.handle_time_response(data)
    
    async def _handle_time_sync(self, data: Dict, websocket):
        pass
    
    async def _handle_global_id_request(self, data: Dict, websocket):
        if not self.is_master:
            return
        
        camera_id = data.get('camera_id')
        local_ids = data.get('local_track_ids', [])
        
        mappings = {}
        for local_id in local_ids:
            global_id = self.global_tracker.get_global_id(camera_id, local_id)
            mappings[local_id] = global_id
        
        response = {
            'type': 'global_id_response',
            'camera_id': camera_id,
            'mappings': mappings,
            'timestamp': self.time_synchronizer.get_synced_time()
        }
        await websocket.send(json.dumps(response))
    
    def get_global_id(self, local_track_id: int) -> Optional[int]:
        return self.global_tracker.get_global_id(self.camera_id, local_track_id)
    
    def get_global_tracks(self) -> List[Dict]:
        tracks = self.global_tracker.get_all_active_tracks()
        return [asdict(t) for t in tracks]
    
    def get_statistics(self) -> Dict:
        stats = {
            'node_id': self.node_manager.node_id,
            'is_master': self.is_master,
            'camera_id': self.camera_id,
            'online_nodes': len(self.node_manager.get_online_nodes()),
            'global_tracks': self.global_tracker.get_track_count(),
            'local_tracks': len(self.local_tracks),
            'time_sync': self.time_synchronizer.get_offset_stats()
        }
        
        if self.is_master:
            stats['cross_camera'] = self.global_tracker.get_cross_camera_statistics()
            stats['latencies'] = self.latency_estimator.get_all_node_stats()
        
        return stats
    
    def get_nodes_info(self) -> List[Dict]:
        return [asdict(node) for node in self.node_manager.get_online_nodes()]


class DistributedTrackerService:
    def __init__(self, tracker: DistributedTracker):
        self.tracker = tracker
        self.running = False
    
    async def start(self):
        self.running = True
        await self.tracker.start()
        
        asyncio.create_task(self._status_monitor())
    
    async def stop(self):
        self.running = False
        await self.tracker.stop()
    
    async def _status_monitor(self):
        while self.running:
            await asyncio.sleep(30)
            
            stats = self.tracker.get_statistics()
            print(f"[Status] Global tracks: {stats['global_tracks']}, "
                  f"Online nodes: {stats['online_nodes']}")
            
            if stats.get('time_sync'):
                print(f"  Time offset: {stats['time_sync'].get('current_offset_ms', 0):.2f}ms")
