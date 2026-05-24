import { WebRTCManager } from './webrtc-manager.js';
import { AnnotationManager } from './annotation-manager.js';

let webrtcManager;
let annotationManager;
let audioStream = null;
let isAudioEnabled = false;
let isCalibrating = false;
let calibrationStartPoint = null;

const remoteVideo = document.getElementById('remoteVideo');
const annotationCanvas = document.getElementById('annotationCanvas');
const roomIdInput = document.getElementById('roomIdInput');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const connectionDot = document.getElementById('connectionDot');
const connectionStatus = document.getElementById('connectionStatus');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const audioStatus = document.getElementById('audioStatus');
const clearAnnotationsBtn = document.getElementById('clearAnnotationsBtn');
const syncBtn = document.getElementById('syncBtn');
const toolButtons = document.querySelectorAll('.tool-btn');
const colorOptions = document.querySelectorAll('.color-option');
const lineWidthRange = document.getElementById('lineWidthRange');
const calibrationDistanceInput = document.getElementById('calibrationDistance');
const startCalibrationBtn = document.getElementById('startCalibrationBtn');
const calibrationStatus = document.getElementById('calibrationStatus');
const calibrationOverlay = document.getElementById('calibrationOverlay');

async function init() {
  annotationManager = new AnnotationManager(annotationCanvas, true);
  annotationManager.onAnnotationComplete = sendAnnotation;
  
  webrtcManager = new WebRTCManager('expert');
  webrtcManager.onConnectionStateChange = handleConnectionStateChange;
  webrtcManager.onRemoteStream = handleRemoteStream;
  webrtcManager.onDataChannelMessage = handleDataChannelMessage;
  
  try {
    await webrtcManager.connectSignaling('ws://localhost:8080');
  } catch (error) {
    console.error('Failed to connect to signaling server:', error);
    alert('无法连接到信令服务器，请先启动服务器: npm run server');
  }
  
  setupEventListeners();
  startSyncMonitoring();
}

function handleRemoteStream(stream) {
  remoteVideo.srcObject = stream;
  remoteVideo.play().catch(console.error);
  
  const videoTrack = stream.getVideoTracks()[0];
  videoTrack.onunmute = () => {
    const settings = videoTrack.getSettings();
    annotationCanvas.width = settings.width;
    annotationCanvas.height = settings.height;
    document.getElementById('videoResolution').textContent = 
      `${settings.width}x${settings.height}`;
  };
}

async function joinRoom() {
  const roomId = roomIdInput.value.trim();
  
  if (!roomId) {
    alert('请输入房间号');
    return;
  }
  
  if (!webrtcManager.signalingWs) {
    try {
      await webrtcManager.connectSignaling('ws://localhost:8080');
    } catch (error) {
      alert('无法连接到信令服务器');
      return;
    }
  }
  
  await webrtcManager.createPeerConnection();
  webrtcManager.joinRoom(roomId);
  
  joinRoomBtn.disabled = true;
  joinRoomBtn.textContent = '🔄 连接中...';
}

function handleConnectionStateChange(state) {
  connectionDot.className = 'status-dot';
  
  switch (state) {
    case 'connected':
      connectionDot.classList.add('connected');
      connectionStatus.textContent = '已连接';
      joinRoomBtn.textContent = '✅ 已连接';
      webrtcManager.startStatsMonitoring(updateStats);
      break;
    case 'connecting':
      connectionStatus.textContent = '连接中...';
      break;
    case 'disconnected':
    case 'failed':
    case 'closed':
      connectionStatus.textContent = '未连接';
      joinRoomBtn.disabled = false;
      joinRoomBtn.textContent = '🚀 加入房间';
      webrtcManager.stopStatsMonitoring();
      break;
  }
}

function handleDataChannelMessage(message) {
  switch (message.t || message.type) {
    case 'sync-response':
      document.getElementById('syncValue').textContent = `${Math.round(message.rtt / 2)}ms`;
      break;
  }
}

function sendAnnotation(annotation) {
  webrtcManager.sendAnnotation(annotation);
  updateAnnotationCount();
  updateMeasurementDisplay();
}

function updateStats(stats) {
  if (stats.currentRoundTripTime) {
    const latency = Math.round(stats.currentRoundTripTime * 1000 / 2);
    const latencyElement = document.getElementById('latencyValue');
    latencyElement.textContent = `${latency}ms`;
    
    if (latency > 200) {
      latencyElement.style.color = '#ff6b6b';
      latencyElement.style.animation = 'blink 1s ease infinite';
    } else if (latency > 100) {
      latencyElement.style.color = '#ffd93d';
      latencyElement.style.animation = 'none';
    } else {
      latencyElement.style.color = '#6bcb77';
      latencyElement.style.animation = 'none';
    }
  }
  
  if (stats.availableIncomingBitrate) {
    const bitrate = Math.round(stats.availableIncomingBitrate / 1000000);
    const bitrateElement = document.getElementById('bitrateValue');
    bitrateElement.textContent = `${bitrate} Mbps`;
    
    if (bitrate < 5) {
      bitrateElement.style.color = '#ff6b6b';
    } else if (bitrate < 10) {
      bitrateElement.style.color = '#ffd93d';
    } else {
      bitrateElement.style.color = '#6bcb77';
    }
  }
  
  if (stats.framesPerSecond) {
    document.getElementById('fpsValue').textContent = Math.round(stats.framesPerSecond);
  } else {
    document.getElementById('fpsValue').textContent = '30';
  }
  
  if (stats.frameWidth && stats.frameHeight) {
    document.getElementById('videoResolution').textContent = 
      `${stats.frameWidth}x${stats.frameHeight}`;
  }
}

function updateAnnotationCount() {
  const count = annotationManager.getAnnotations().length;
  document.getElementById('annotationCount').textContent = `标注: ${count}`;
}

function updateMeasurementDisplay() {
  const measurements = annotationManager.getMeasurements();
  const display = document.getElementById('measurementDisplay');
  
  if (measurements.length === 0) {
    display.innerHTML = '<div class="measurement-item"><span>暂无测量数据</span></div>';
    return;
  }
  
  display.innerHTML = measurements.slice(-5).map((m, i) => `
    <div class="measurement-item">
      <span>测量 ${measurements.length - 4 + i > 0 ? measurements.length - 4 + i : i + 1}</span>
      <span>${m.distance.toFixed(2)} mm</span>
    </div>
  `).join('');
}

function startSyncMonitoring() {
  setInterval(() => {
    if (webrtcManager.peerConnection?.connectionState === 'connected') {
      webrtcManager.sendSignalingMessage({
        type: 'sync-request',
        timestamp: Date.now()
      });
    }
  }, 2000);
}

async function toggleAudio() {
  if (isAudioEnabled) {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      audioStream = null;
    }
    isAudioEnabled = false;
    toggleAudioBtn.textContent = '🔊 开启语音';
    audioStatus.textContent = '未开启';
    document.getElementById('audioIndicator').style.opacity = '0.3';
  } else {
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (webrtcManager.peerConnection) {
        audioStream.getAudioTracks().forEach(track => {
          webrtcManager.peerConnection.addTrack(track, audioStream);
        });
      }
      
      isAudioEnabled = true;
      toggleAudioBtn.textContent = '🔇 关闭语音';
      audioStatus.textContent = '通话中';
      document.getElementById('audioIndicator').style.opacity = '1';
    } catch (error) {
      console.error('Error starting audio:', error);
      alert('无法启动麦克风: ' + error.message);
    }
  }
}

function startCalibration() {
  isCalibrating = true;
  calibrationOverlay.classList.remove('hidden');
  startCalibrationBtn.textContent = '📍 点击画面设置标定起点...';
  startCalibrationBtn.disabled = true;
  
  annotationManager.setTool('calibration');
}

function handleCalibrationClick(e) {
  if (!isCalibrating) return;
  
  const rect = annotationCanvas.getBoundingClientRect();
  const scaleX = annotationCanvas.width / rect.width;
  const scaleY = annotationCanvas.height / rect.height;
  
  const point = {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
  
  if (!calibrationStartPoint) {
    calibrationStartPoint = point;
    startCalibrationBtn.textContent = '📍 点击终点完成标定';
  } else {
    const knownDistance = parseFloat(calibrationDistanceInput.value);
    annotationManager.setCalibration(
      calibrationStartPoint.x,
      calibrationStartPoint.y,
      point.x,
      point.y,
      knownDistance
    );
    
    isCalibrating = false;
    calibrationStartPoint = null;
    calibrationOverlay.classList.add('hidden');
    startCalibrationBtn.textContent = '🎯 重新标定';
    startCalibrationBtn.disabled = false;
    calibrationStatus.textContent = `已标定: ${knownDistance}mm 参考`;
    
    annotationManager.setTool('arrow');
    setActiveTool('arrow');
  }
}

function setActiveTool(tool) {
  toolButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
  
  const toolNames = {
    arrow: '箭头',
    circle: '圆圈',
    text: '文字',
    measure: '测量'
  };
  document.getElementById('currentTool').textContent = `当前工具: ${toolNames[tool] || tool}`;
}

function setupEventListeners() {
  joinRoomBtn.addEventListener('click', joinRoom);
  toggleAudioBtn.addEventListener('click', toggleAudio);
  clearAnnotationsBtn.addEventListener('click', () => {
    annotationManager.clearAll();
    webrtcManager.clearAnnotations();
    updateAnnotationCount();
    updateMeasurementDisplay();
  });
  syncBtn.addEventListener('click', () => {
    webrtcManager.sendSignalingMessage({
      type: 'sync-request',
      timestamp: Date.now()
    });
  });
  
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      annotationManager.setTool(tool);
      setActiveTool(tool);
    });
  });
  
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      const color = option.dataset.color;
      annotationManager.setColor(color);
      colorOptions.forEach(o => o.classList.remove('active'));
      option.classList.add('active');
    });
  });
  
  lineWidthRange.addEventListener('input', (e) => {
    annotationManager.setLineWidth(parseInt(e.target.value));
  });
  
  startCalibrationBtn.addEventListener('click', startCalibration);
  
  annotationCanvas.addEventListener('mousedown', (e) => {
    if (isCalibrating) {
      handleCalibrationClick(e);
    }
  });
  
  roomIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      joinRoom();
    }
  });
}

window.addEventListener('beforeunload', () => {
  if (webrtcManager) {
    webrtcManager.close();
  }
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
  }
});

init();
