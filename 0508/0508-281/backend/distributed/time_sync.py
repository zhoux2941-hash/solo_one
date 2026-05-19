import asyncio
import time
import numpy as np
from typing import Optional, Deque
from collections import deque
from dataclasses import dataclass


@dataclass
class TimeMeasurement:
    sent_time: float
    received_time: float
    round_trip: float
    offset: float


class TimeSynchronizer:
    def __init__(self, node_manager):
        self.node_manager = node_manager
        self.is_master = node_manager.is_master
        
        self.offsets: Deque[float] = deque(maxlen=50)
        self.measurements: Deque[TimeMeasurement] = deque(maxlen=100)
        
        self.sync_interval = 1.0
        self.max_offset = 0.1
        
        self.base_time = time.time()
        self.local_offset = 0.0
        
        self.lock = asyncio.Lock()
    
    async def start(self):
        if not self.is_master:
            asyncio.create_task(self._sync_loop())
        asyncio.create_task(self._measure_loop())
    
    async def _sync_loop(self):
        while self.node_manager.running:
            await self._request_sync()
            await asyncio.sleep(self.sync_interval)
    
    async def _measure_loop(self):
        while self.node_manager.running:
            if self.is_master:
                await self._broadcast_time()
            await asyncio.sleep(self.sync_interval * 2)
    
    async def _request_sync(self):
        if 'master' not in self.node_manager.connections:
            return
        
        t1 = time.time()
        request = {
            'type': 'time_sync_request',
            'node_id': self.node_manager.node_id,
            't1': t1
        }
        
        try:
            await self.node_manager.connections['master'].send(str(request))
        except:
            pass
    
    async def _broadcast_time(self):
        current_time = time.time()
        message = {
            'type': 'time_sync',
            'master_id': self.node_manager.node_id,
            'master_time': current_time,
            'timestamp': current_time
        }
        
        await self.node_manager.broadcast_to_nodes(message)
    
    async def handle_time_request(self, data: dict):
        if not self.is_master:
            return
        
        t2 = time.time()
        response = {
            'type': 'time_sync_response',
            'master_id': self.node_manager.node_id,
            't1': data['t1'],
            't2': t2,
            't3': time.time()
        }
        
        if data['node_id'] in self.node_manager.connections:
            try:
                await self.node_manager.connections[data['node_id']].send(str(response))
            except:
                pass
    
    async def handle_time_response(self, data: dict):
        t4 = time.time()
        t1 = data['t1']
        t2 = data['t2']
        t3 = data['t3']
        
        round_trip = (t4 - t1) - (t3 - t2)
        offset = ((t2 - t1) + (t3 - t4)) / 2
        
        async with self.lock:
            if abs(offset) < 0.5:
                self.offsets.append(offset)
                self.measurements.append(TimeMeasurement(t1, t2, round_trip, offset))
                self._update_offset()
    
    def _update_offset(self):
        if len(self.offsets) < 3:
            return
        
        offsets_array = np.array(self.offsets)
        
        median = np.median(offsets_array)
        mad = np.median(np.abs(offsets_array - median))
        
        if mad > 0:
            z_scores = 0.6745 * (offsets_array - median) / mad
            valid_mask = np.abs(z_scores) < 2.0
            valid_offsets = offsets_array[valid_mask]
            
            if len(valid_offsets) > 0:
                self.local_offset = float(np.mean(valid_offsets))
            else:
                self.local_offset = float(median)
        else:
            self.local_offset = float(median)
    
    def get_synced_time(self) -> float:
        return time.time() + self.local_offset
    
    def get_offset_stats(self) -> dict:
        if not self.measurements:
            return {}
        
        offsets = [m.offset for m in self.measurements]
        rtts = [m.round_trip for m in self.measurements]
        
        return {
            'current_offset_ms': self.local_offset * 1000,
            'mean_offset_ms': float(np.mean(offsets)) * 1000,
            'std_offset_ms': float(np.std(offsets)) * 1000,
            'mean_rtt_ms': float(np.mean(rtts)) * 1000,
            'samples': len(self.measurements)
        }
    
    def sync_timestamp(self, timestamp: float) -> float:
        return timestamp + self.local_offset
    
    def is_synchronized(self) -> bool:
        return len(self.offsets) >= 5 and abs(self.local_offset) < self.max_offset


class LatencyEstimator:
    def __init__(self):
        self.node_latencies: dict[str, Deque[float]] = {}
        self.max_samples = 100
    
    def add_measurement(self, node_id: str, latency: float):
        if node_id not in self.node_latencies:
            self.node_latencies[node_id] = deque(maxlen=self.max_samples)
        
        self.node_latencies[node_id].append(latency)
    
    def get_latency_stats(self, node_id: str) -> Optional[dict]:
        if node_id not in self.node_latencies or not self.node_latencies[node_id]:
            return None
        
        latencies = list(self.node_latencies[node_id])
        
        return {
            'mean_ms': float(np.mean(latencies)) * 1000,
            'median_ms': float(np.median(latencies)) * 1000,
            'p95_ms': float(np.percentile(latencies, 95)) * 1000,
            'std_ms': float(np.std(latencies)) * 1000,
            'samples': len(latencies)
        }
    
    def get_all_node_stats(self) -> dict:
        return {
            node_id: self.get_latency_stats(node_id)
            for node_id in self.node_latencies
        }
