import asyncio
import json
import uuid
import socket
from datetime import datetime
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, asdict, field
import websockets
from websockets.server import WebSocketServerProtocol


@dataclass
class NodeInfo:
    node_id: str
    node_type: str  # 'master' or 'edge'
    hostname: str
    ip: str
    port: int
    camera_id: str
    region: str  # 覆盖区域标识
    status: str  # 'online', 'offline', 'busy'
    last_heartbeat: float
    capabilities: Dict = field(default_factory=dict)
    position: Dict = field(default_factory=lambda: {'x': 0, 'y': 0, 'angle': 0})


@dataclass
class TrackMessage:
    message_id: str
    source_node: str
    timestamp: float
    track_id: int
    global_id: Optional[int]
    class_id: int
    class_name: str
    bbox: List[float]
    confidence: float
    feature_vector: List[float]
    camera_id: str
    position_3d: Optional[List[float]] = None


class NodeManager:
    def __init__(self, config_path: str = "config/config.yaml"):
        import yaml
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.dist_config = self.config.get('distributed', {})
        self.node_id = str(uuid.uuid4())[:8]
        self.hostname = socket.gethostname()
        self.ip = self._get_local_ip()
        
        self.nodes: Dict[str, NodeInfo] = {}
        self.connections: Dict[str, WebSocketServerProtocol] = {}
        self.master_node: Optional[str] = None
        
        self.is_master = self.dist_config.get('is_master', False)
        self.port = self.dist_config.get('port', 8765)
        self.camera_id = self.dist_config.get('camera_id', f'cam_{self.node_id}')
        self.region = self.dist_config.get('region', 'default')
        
        self.heartbeat_interval = self.dist_config.get('heartbeat_interval', 2.0)
        self.node_timeout = self.dist_config.get('node_timeout', 10.0)
        
        self.message_handlers = {}
        self._setup_message_handlers()
        
        self.running = False
    
    def _get_local_ip(self) -> str:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def _setup_message_handlers(self):
        self.message_handlers = {
            'heartbeat': self._handle_heartbeat,
            'node_discovery': self._handle_node_discovery,
            'track_update': self._handle_track_update,
            'global_id_assignment': self._handle_global_id,
            'handshake': self._handle_handshake,
        }
    
    async def start(self):
        self.running = True
        
        if self.is_master:
            asyncio.create_task(self._start_master_server())
        else:
            asyncio.create_task(self._connect_to_master())
        
        asyncio.create_task(self._heartbeat_loop())
        asyncio.create_task(self._cleanup_dead_nodes())
    
    async def _start_master_server(self):
        print(f"[Master {self.node_id}] Starting server on port {self.port}")
        
        async def handle_client(websocket: WebSocketServerProtocol):
            try:
                async for message in websocket:
                    await self._process_message(message, websocket)
            except websockets.exceptions.ConnectionClosed:
                pass
            finally:
                for node_id, conn in list(self.connections.items()):
                    if conn == websocket:
                        del self.connections[node_id]
                        if node_id in self.nodes:
                            self.nodes[node_id].status = 'offline'
                        print(f"[Master] Node {node_id} disconnected")
        
        server = await websockets.serve(handle_client, "0.0.0.0", self.port)
        await server.wait_closed()
    
    async def _connect_to_master(self):
        master_host = self.dist_config.get('master_host', 'localhost')
        master_port = self.dist_config.get('master_port', 8765)
        retry_interval = 5
        
        while self.running:
            try:
                print(f"[Edge {self.node_id}] Connecting to master at {master_host}:{master_port}")
                async with websockets.connect(f"ws://{master_host}:{master_port}") as websocket:
                    self.connections['master'] = websocket
                    
                    handshake = {
                        'type': 'handshake',
                        'node_id': self.node_id,
                        'node_type': 'edge',
                        'hostname': self.hostname,
                        'ip': self.ip,
                        'port': self.port,
                        'camera_id': self.camera_id,
                        'region': self.region,
                        'timestamp': datetime.now().timestamp()
                    }
                    await websocket.send(json.dumps(handshake))
                    
                    async for message in websocket:
                        await self._process_message(message, websocket)
                        
            except Exception as e:
                print(f"[Edge {self.node_id}] Connection failed: {e}, retrying in {retry_interval}s")
                await asyncio.sleep(retry_interval)
    
    async def _heartbeat_loop(self):
        while self.running:
            heartbeat = {
                'type': 'heartbeat',
                'node_id': self.node_id,
                'status': 'online',
                'timestamp': datetime.now().timestamp()
            }
            
            if self.is_master:
                for conn in self.connections.values():
                    try:
                        await conn.send(json.dumps(heartbeat))
                    except:
                        pass
            elif 'master' in self.connections:
                try:
                    await self.connections['master'].send(json.dumps(heartbeat))
                except:
                    pass
            
            await asyncio.sleep(self.heartbeat_interval)
    
    async def _cleanup_dead_nodes(self):
        while self.running:
            now = datetime.now().timestamp()
            dead_nodes = []
            
            for node_id, node in self.nodes.items():
                if now - node.last_heartbeat > self.node_timeout:
                    dead_nodes.append(node_id)
            
            for node_id in dead_nodes:
                if node_id in self.nodes:
                    self.nodes[node_id].status = 'offline'
                    print(f"[NodeManager] Node {node_id} marked as offline (timeout)")
            
            await asyncio.sleep(self.node_timeout / 2)
    
    async def _process_message(self, message: str, websocket: WebSocketServerProtocol):
        try:
            data = json.loads(message)
            msg_type = data.get('type')
            
            if msg_type in self.message_handlers:
                await self.message_handlers[msg_type](data, websocket)
        except json.JSONDecodeError:
            print(f"[NodeManager] Invalid JSON message")
    
    async def _handle_handshake(self, data: Dict, websocket: WebSocketServerProtocol):
        if self.is_master:
            node_id = data['node_id']
            self.connections[node_id] = websocket
            
            node_info = NodeInfo(
                node_id=node_id,
                node_type=data['node_type'],
                hostname=data['hostname'],
                ip=data['ip'],
                port=data['port'],
                camera_id=data['camera_id'],
                region=data['region'],
                status='online',
                last_heartbeat=datetime.now().timestamp()
            )
            self.nodes[node_id] = node_info
            
            print(f"[Master] Node {node_id} registered from {data['ip']}")
            
            response = {
                'type': 'handshake_ack',
                'master_id': self.node_id,
                'node_id': node_id,
                'assigned_id': node_id,
                'timestamp': datetime.now().timestamp()
            }
            await websocket.send(json.dumps(response))
    
    async def _handle_heartbeat(self, data: Dict, websocket: WebSocketServerProtocol):
        node_id = data['node_id']
        if node_id in self.nodes:
            self.nodes[node_id].last_heartbeat = datetime.now().timestamp()
            self.nodes[node_id].status = data.get('status', 'online')
    
    async def _handle_node_discovery(self, data: Dict, websocket: WebSocketServerProtocol):
        if self.is_master:
            response = {
                'type': 'node_list',
                'nodes': [asdict(node) for node in self.nodes.values()],
                'timestamp': datetime.now().timestamp()
            }
            await websocket.send(json.dumps(response))
    
    async def _handle_track_update(self, data: Dict, websocket: WebSocketServerProtocol):
        pass
    
    async def _handle_global_id(self, data: Dict, websocket: WebSocketServerProtocol):
        pass
    
    async def send_track_update(self, track_message: TrackMessage):
        message = {
            'type': 'track_update',
            **asdict(track_message)
        }
        
        if self.is_master:
            for conn in self.connections.values():
                try:
                    await conn.send(json.dumps(message))
                except:
                    pass
        elif 'master' in self.connections:
            try:
                await self.connections['master'].send(json.dumps(message))
            except:
                pass
    
    async def broadcast_to_nodes(self, message: Dict, target_nodes: Optional[List[str]] = None):
        if not self.is_master:
            return
        
        message['timestamp'] = datetime.now().timestamp()
        
        for node_id, conn in self.connections.items():
            if target_nodes is None or node_id in target_nodes:
                try:
                    await conn.send(json.dumps(message))
                except:
                    pass
    
    def get_online_nodes(self) -> List[NodeInfo]:
        return [node for node in self.nodes.values() if node.status == 'online']
    
    def get_nodes_by_region(self, region: str) -> List[NodeInfo]:
        return [node for node in self.nodes.values() 
                if node.region == region and node.status == 'online']
    
    async def stop(self):
        self.running = False
        
        for conn in self.connections.values():
            await conn.close()
        self.connections.clear()
