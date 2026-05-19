import asyncio
import cv2
import json
import time
import yaml
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.yolov5_trt import YOLOv5TRT
from tracking.deepsort import DeepSORT
from distributed import DistributedTracker, DistributedTrackerService


class DetectionResult(BaseModel):
    track_id: int
    global_id: Optional[int]
    bbox: List[int]
    confidence: float
    class_id: int
    class_name: str
    timestamp: float


class HistoryRecord(BaseModel):
    timestamp: str
    detections: List[DetectionResult]


app = FastAPI(title="Real-time Object Detection & Tracking - Distributed")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("config/config.yaml", 'r') as f:
    config = yaml.safe_load(f)

detector = YOLOv5TRT("config/config.yaml")
tracker = DeepSORT("config/config.yaml")

distributed_enabled = config.get('distributed', {}).get('enabled', False)
distributed_tracker = None
distributed_service = None

if distributed_enabled:
    distributed_tracker = DistributedTracker("config/config.yaml")
    distributed_service = DistributedTrackerService(distributed_tracker)

active_connections: List[WebSocket] = []
detection_history: List[Dict[str, Any]] = []
max_history_size = 1000

frame_buffer = []
batch_size = config['detector']['max_batch_size']
processing = False
rtsp_url = config['stream']['rtsp_url']


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


async def process_frames():
    global frame_buffer, processing
    
    while True:
        if len(frame_buffer) >= batch_size or (len(frame_buffer) > 0 and not processing):
            processing = True
            
            batch_frames = frame_buffer[:batch_size]
            frame_buffer = frame_buffer[batch_size:]
            
            start_time = time.time()
            
            batch_detections = detector.detect_batch([f['frame'] for f in batch_frames])
            
            all_results = []
            
            for idx, detections in enumerate(batch_detections):
                tracker.predict()
                tracked_objects = tracker.update(detections)
                
                if distributed_enabled and distributed_tracker:
                    tracked_objects = await distributed_tracker.process_local_tracks(
                        tracked_objects, batch_frames[idx]['frame']
                    )
                
                result = {
                    'frame_id': batch_frames[idx]['frame_id'],
                    'timestamp': batch_frames[idx]['timestamp'],
                    'detections': tracked_objects
                }
                all_results.append(result)
                
                history_entry = {
                    'timestamp': datetime.fromtimestamp(batch_frames[idx]['timestamp']).isoformat(),
                    'detections': tracked_objects
                }
                detection_history.append(history_entry)
                if len(detection_history) > max_history_size:
                    detection_history.pop(0)
            
            inference_time = (time.time() - start_time) / len(batch_frames)
            fps = 1.0 / inference_time if inference_time > 0 else 0
            
            for result in all_results:
                result['fps'] = fps
                result['distributed_enabled'] = distributed_enabled
                await manager.broadcast(result)
            
            processing = False
        
        await asyncio.sleep(0.001)


async def read_rtsp_stream():
    global frame_buffer
    
    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        print(f"Failed to open RTSP stream: {rtsp_url}")
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Failed to open camera")
            return
    
    frame_id = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            await asyncio.sleep(0.1)
            continue
        
        frame_id += 1
        timestamp = time.time()
        
        frame_buffer.append({
            'frame_id': frame_id,
            'frame': frame,
            'timestamp': timestamp
        })
        
        if len(frame_buffer) > batch_size * 4:
            frame_buffer = frame_buffer[-batch_size * 2:]
        
        await asyncio.sleep(0.001)


@app.on_event("startup")
async def startup_event():
    if distributed_enabled and distributed_service:
        await distributed_service.start()
        print("[Distributed] Distributed tracking service started")
    
    asyncio.create_task(read_rtsp_stream())
    asyncio.create_task(process_frames())


@app.get("/")
async def get():
    with open("frontend/index.html", 'r') as f:
        return HTMLResponse(f.read())


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get('type') == 'get_history':
                    await websocket.send_json({
                        'type': 'history',
                        'data': detection_history[-100:]
                    })
            except:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/api/history")
async def get_history(limit: int = 100):
    return {
        'success': True,
        'data': detection_history[-limit:]
    }


@app.get("/api/status")
async def get_status():
    return {
        'success': True,
        'connected_clients': len(manager.active_connections),
        'buffer_size': len(frame_buffer),
        'history_size': len(detection_history),
        'config': config
    }


@app.post("/api/config")
async def update_config(new_config: Dict[str, Any]):
    global config, rtsp_url, batch_size
    
    try:
        if 'stream' in new_config and 'rtsp_url' in new_config['stream']:
            rtsp_url = new_config['stream']['rtsp_url']
        
        if 'detector' in new_config and 'max_batch_size' in new_config['detector']:
            batch_size = new_config['detector']['max_batch_size']
        
        config.update(new_config)
        
        with open("config/config.yaml", 'w') as f:
            yaml.dump(config, f)
        
        return {'success': True, 'message': 'Config updated'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reset")
async def reset_tracker():
    tracker.reset()
    return {'success': True, 'message': 'Tracker reset'}


@app.get("/api/distributed/status")
async def get_distributed_status():
    if not distributed_enabled or not distributed_tracker:
        return {
            'success': True,
            'enabled': False,
            'message': 'Distributed tracking not enabled'
        }
    
    stats = distributed_tracker.get_statistics()
    return {
        'success': True,
        'enabled': True,
        **stats
    }


@app.get("/api/distributed/nodes")
async def get_nodes():
    if not distributed_enabled or not distributed_tracker:
        return {
            'success': False,
            'message': 'Distributed tracking not enabled'
        }
    
    return {
        'success': True,
        'nodes': distributed_tracker.get_nodes_info()
    }


@app.get("/api/distributed/global_tracks")
async def get_global_tracks():
    if not distributed_enabled or not distributed_tracker:
        return {
            'success': False,
            'message': 'Distributed tracking not enabled'
        }
    
    return {
        'success': True,
        'tracks': distributed_tracker.get_global_tracks()
    }


@app.get("/api/distributed/cross_camera_stats")
async def get_cross_camera_stats():
    if not distributed_enabled or not distributed_tracker or not distributed_tracker.is_master:
        return {
            'success': False,
            'message': 'Only master node provides cross camera statistics'
        }
    
    return {
        'success': True,
        **distributed_tracker.global_tracker.get_cross_camera_statistics()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config['server']['host'], port=config['server']['port'])
