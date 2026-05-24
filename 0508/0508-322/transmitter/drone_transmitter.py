import asyncio
import json
import time
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass

try:
    from aiortc import RTCPeerConnection, RTCSessionDescription, MediaStreamTrack
    from av import VideoFrame
    import cv2
    import numpy as np
except ImportError as e:
    print(f"Missing dependencies: {e}")
    print("Install with: pip install aiortc opencv-python av")
    exit(1)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TelemetryData:
    altitude: float = 0.0
    speed: float = 0.0
    battery: float = 12.6
    satellites: int = 8
    pitch: float = 0.0
    roll: float = 0.0
    yaw: float = 0.0


class CameraVideoTrack(MediaStreamTrack):
    kind = "video"

    def __init__(self, camera_id: int = 0, width: int = 640, height: int = 480, fps: int = 30):
        super().__init__()
        self.camera_id = camera_id
        self.width = width
        self.height = height
        self.fps = fps
        self.cap: Optional[cv2.VideoCapture] = None
        self.frame_count = 0
        self.start_time = time.time()

    async def start(self):
        self.cap = cv2.VideoCapture(self.camera_id)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        self.cap.set(cv2.CAP_PROP_FPS, self.fps)
        
        if not self.cap.isOpened():
            raise RuntimeError(f"Failed to open camera {self.camera_id}")
        
        logger.info(f"Camera started: {self.width}x{self.height} @ {self.fps}fps")

    async def recv(self) -> VideoFrame:
        if not self.cap or not self.cap.isOpened():
            raise RuntimeError("Camera not initialized")

        ret, frame = self.cap.read()
        if not ret:
            logger.warning("Failed to read frame")
            await asyncio.sleep(0.01)
            return await self.recv()

        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        video_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        video_frame.pts = int((time.time() - self.start_time) * 90000)
        video_frame.time_base = (1, 90000)
        
        self.frame_count += 1
        return video_frame

    def stop(self):
        if self.cap:
            self.cap.release()
            logger.info("Camera stopped")


class DroneController:
    def __init__(self):
        self.pc: Optional[RTCPeerConnection] = None
        self.video_track: Optional[CameraVideoTrack] = None
        self.data_channel = None
        self.telemetry = TelemetryData()
        self.control_commands: Dict[str, float] = {
            'throttle': 0,
            'yaw': 0,
            'pitch': 0,
            'roll': 0
        }
        self.running = False
        self.telemetry_task: Optional[asyncio.Task] = None
        self.is_returning = False
        self.return_start_time = 0.0
        
        self.follow_mode = False
        self.follow_altitude = 2.0
        self.follow_distance = 3.0
        self.target_position = {'x': 0.0, 'y': 0.0}
        self.drone_position = {'x': 0.0, 'y': 0.0}
        self.position_error = 0.0
        self.kP = 20.0

    async def start(self):
        self.pc = RTCPeerConnection()
        self.setup_peer_connection()
        
        self.video_track = CameraVideoTrack()
        await self.video_track.start()
        self.pc.addTrack(self.video_track)
        
        self.running = True
        self.telemetry_task = asyncio.create_task(self.send_telemetry_loop())
        
        logger.info("Drone controller started")

    def setup_peer_connection(self):
        @self.pc.on("icecandidate")
        async def on_icecandidate(candidate):
            if candidate:
                logger.info(f"ICE Candidate: {candidate}")

        @self.pc.on("iceconnectionstatechange")
        async def on_iceconnectionstatechange():
            logger.info(f"ICE Connection State: {self.pc.iceConnectionState}")

        @self.pc.on("datachannel")
        def on_datachannel(channel):
            self.data_channel = channel
            logger.info("Data channel received")

            @channel.on("message")
            def on_message(message):
                self.handle_message(message)

            @channel.on("open")
            def on_open():
                logger.info("Data channel opened")

            @channel.on("close")
            def on_close():
                logger.info("Data channel closed")

    def handle_message(self, message):
        try:
            data = json.loads(message)
            msg_type = data.get('type')

            if msg_type == 'ping':
                self.send_data({'type': 'pong'})
            
            elif msg_type == 'control':
                if not self.follow_mode:
                    self.handle_control(data)
            
            elif msg_type == 'action':
                self.handle_action(data)
            
            elif msg_type == 'follow_start':
                self.start_follow_mode(data)
            
            elif msg_type == 'follow_stop':
                self.stop_follow_mode()
            
            elif msg_type == 'follow_settings':
                self.update_follow_settings(data)
            
            elif msg_type == 'follow_position':
                self.update_target_position(data)

        except json.JSONDecodeError:
            logger.error(f"Invalid JSON: {message}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")

    def handle_control(self, data: Dict[str, Any]):
        self.control_commands['throttle'] = data.get('throttle', 0)
        self.control_commands['yaw'] = data.get('yaw', 0)
        self.control_commands['pitch'] = data.get('pitch', 0)
        self.control_commands['roll'] = data.get('roll', 0)
        
        self.update_telemetry_from_control()
        
        latency = time.time() * 1000 - data.get('timestamp', 0)
        logger.debug(f"Control: {self.control_commands}, Latency: {latency:.1f}ms")

    def handle_action(self, data: Dict[str, Any]):
        action = data.get('action')
        logger.info(f"Action command: {action}")
        
        if action == 'takeoff':
            logger.info("=== EXECUTING TAKEOFF ===")
            self.telemetry.altitude = 1.5
            self.is_returning = False
        
        elif action == 'land':
            logger.info("=== EXECUTING LANDING ===")
            self.telemetry.altitude = 0.0
            self.is_returning = False
            if self.follow_mode:
                self.stop_follow_mode()
        
        elif action == 'return':
            logger.info("=== EXECUTING RETURN TO HOME ===")
            self.is_returning = True
            self.return_start_time = time.time()
            if self.follow_mode:
                self.stop_follow_mode()

    def start_follow_mode(self, data: Dict[str, Any]):
        self.follow_mode = True
        self.follow_altitude = data.get('targetAltitude', 2.0)
        self.follow_distance = data.get('targetDistance', 3.0)
        self.drone_position = {'x': 0.0, 'y': 0.0}
        self.target_position = {'x': 0.0, 'y': 0.0}
        logger.info("=== FOLLOW MODE STARTED ===")
        
        if self.telemetry.altitude < 0.5:
            self.telemetry.altitude = self.follow_altitude

    def stop_follow_mode(self):
        self.follow_mode = False
        self.telemetry.pitch = 0.0
        self.telemetry.roll = 0.0
        logger.info("=== FOLLOW MODE STOPPED ===")

    def update_follow_settings(self, data: Dict[str, Any]):
        self.follow_altitude = data.get('targetAltitude', 2.0)
        self.follow_distance = data.get('targetDistance', 3.0)

    def update_target_position(self, data: Dict[str, Any]):
        if not self.follow_mode:
            return
        self.target_position['x'] = data.get('x', 0.0)
        self.target_position['y'] = data.get('y', 0.0)

    def calculate_follow_control(self):
        dx = self.target_position['x'] - self.drone_position['x']
        dy = self.target_position['y'] - self.drone_position['y']
        
        distance = (dx**2 + dy**2)**0.5
        self.position_error = abs(distance - self.follow_distance)
        
        if distance > 0.1:
            import math
            angle = math.atan2(dy, dx)
            
            target_x = self.target_position['x'] - math.cos(angle) * self.follow_distance
            target_y = self.target_position['y'] - math.sin(angle) * self.follow_distance
            
            error_x = target_x - self.drone_position['x']
            error_y = target_y - self.drone_position['y']
            
            self.telemetry.pitch = max(-100, min(100, self.kP * error_y))
            self.telemetry.roll = max(-100, min(100, self.kP * error_x))
            
            self.drone_position['x'] += self.telemetry.roll * 0.0005
            self.drone_position['y'] += self.telemetry.pitch * 0.0005
        
        altitude_error = self.follow_altitude - self.telemetry.altitude
        self.telemetry.altitude += altitude_error * 0.05
        
        self.telemetry.speed = (self.telemetry.pitch**2 + self.telemetry.roll**2)**0.5 * 0.01

    def send_data(self, data: Dict[str, Any]):
        if self.data_channel and self.data_channel.readyState == "open":
            try:
                self.data_channel.send(json.dumps(data))
                return True
            except Exception as e:
                logger.error(f"Failed to send data: {e}")
        return False

    async def send_telemetry_loop(self):
        while self.running:
            try:
                self.update_telemetry_independent()
                telemetry_data = {
                    'type': 'telemetry',
                    'altitude': self.telemetry.altitude,
                    'speed': self.telemetry.speed,
                    'battery': self.telemetry.battery,
                    'satellites': self.telemetry.satellites,
                    'pitch': self.telemetry.pitch,
                    'roll': self.telemetry.roll,
                    'yaw': self.telemetry.yaw,
                    'positionError': self.position_error,
                    'timestamp': time.time() * 1000
                }
                self.send_data(telemetry_data)
                await asyncio.sleep(0.1)
            except Exception as e:
                logger.error(f"Telemetry error: {e}")
                await asyncio.sleep(0.1)

    def update_telemetry_from_control(self):
        throttle = self.control_commands['throttle']
        
        if not self.is_returning and not self.follow_mode:
            if throttle > 10:
                self.telemetry.altitude += (throttle / 100) * 0.1
            elif throttle < -10:
                self.telemetry.altitude = max(0, self.telemetry.altitude - 0.1)
        
        self.telemetry.speed = abs(self.control_commands['pitch']) * 0.05
        self.telemetry.pitch = self.control_commands['pitch']
        self.telemetry.roll = self.control_commands['roll']
        self.telemetry.yaw = self.control_commands['yaw']

    def update_telemetry_independent(self):
        self.telemetry.battery = max(10.0, self.telemetry.battery - 0.001)
        
        if self.follow_mode:
            self.calculate_follow_control()
        
        if self.is_returning and self.telemetry.altitude > 0:
            elapsed = time.time() - self.return_start_time
            target_altitude = max(0, 1.5 - (elapsed / 3.0) * 1.5)
            self.telemetry.altitude = target_altitude
            
            if self.telemetry.altitude <= 0:
                self.is_returning = False
                logger.info("=== RETURN COMPLETE, LANDED ===")

    async def create_offer(self) -> str:
        offer = await self.pc.createOffer()
        await self.pc.setLocalDescription(offer)
        return json.dumps({"sdp": offer.sdp, "type": offer.type})

    async def set_answer(self, answer_json: str):
        answer_data = json.loads(answer_json)
        answer = RTCSessionDescription(sdp=answer_data["sdp"], type=answer_data["type"])
        await self.pc.setRemoteDescription(answer)
        logger.info("Remote description set")

    async def stop(self):
        self.running = False
        
        if self.telemetry_task:
            self.telemetry_task.cancel()
        
        if self.video_track:
            self.video_track.stop()
        
        if self.pc:
            await self.pc.close()
        
        logger.info("Drone controller stopped")


async def main():
    controller = DroneController()
    await controller.start()

    print("\n" + "="*60)
    print("DRONE TRANSMITTER - WebRTC FPV")
    print("="*60)
    
    offer = await controller.create_offer()
    print("\nSDP Offer:")
    print(offer)
    print("\n" + "="*60)
    print("Copy this offer to the browser client")
    print("Then paste the browser's answer here:")
    print("="*60 + "\n")
    
    answer = input("Paste SDP Answer: ").strip()
    await controller.set_answer(answer)
    
    print("\nConnected! Press Ctrl+C to exit")
    print("="*60)
    
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        await controller.stop()


if __name__ == "__main__":
    asyncio.run(main())