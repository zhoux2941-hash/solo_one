import { WebRTCManager } from './webrtc-manager.js';
import { AnnotationManager } from './annotation-manager.js';

let webrtcManager;
let annotationManager;
let localStream = null;
let audioStream = null;
let isAudioEnabled = false;

const localVideo = document.getElementById('localVideo');
const annotationCanvas = document.getElementById('annotationCanvas');
const cameraSelect = document.getElementById('cameraSelect');
const resolutionSelect = document.getElementById('resolutionSelect');
const fpsSelect = document.getElementById('fpsSelect');
const bitrateSelect = document.getElementById('bitrateSelect');
const adaptiveBitrateSelect = document.getElementById('adaptiveBitrateSelect');
const adaptiveResolutionSelect = document.getElementById('adaptiveResolutionSelect');
const motionThresholdInput = document.getElementById('motionThreshold');
const motionLevelDisplay = document.getElementById('motionLevel');
const currentResolutionNameDisplay = document.getElementById('currentResolutionName');
const startCameraBtn = document.getElementById('startCameraBtn');
const createRoomBtn = document.getElementById('createRoomBtn');
const roomIdInput = document.getElementById('roomId');
const connectionDot = document.getElementById('connectionDot');
const connectionStatus = document.getElementById('connectionStatus');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const audioStatus = document.getElementById('audioStatus');
const clearAnnotationsBtn = document.getElementById('clearAnnotationsBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');

async function init() {
  annotationManager = new AnnotationManager(annotationCanvas, false);
  
  await loadDevices();
  
  webrtcManager = new WebRTCManager('surgeon');
  webrtcManager.onConnectionStateChange = handleConnectionStateChange;
  webrtcManager.onDataChannelMessage = handleDataChannelMessage;
  webrtcManager.onDataChannelOpen = () => {
    console.log('Data channel ready for annotations - low latency mode');
  };
  webrtcManager.onResolutionChange = handleResolutionChange;
  webrtcManager.onMotionUpdate = handleMotionUpdate;
  
  try {
    await webrtcManager.connectSignaling('ws://localhost:8080');
  } catch (error) {
    console.error('Failed to connect to signaling server:', error);
    alert('无法连接到信令服务器，请先启动服务器: npm run server');
  }
  
  setupEventListeners();
  updateMotionThreshold();
}

async function loadDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    
    cameraSelect.innerHTML = '';
    videoDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `摄像头 ${index + 1}`;
      cameraSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading devices:', error);
  }
}

async function startCamera() {
  const [width, height] = resolutionSelect.value.split('x').map(Number);
  const fps = parseInt(fpsSelect.value);
  
  const constraints = {
    video: {
      deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined,
      width: { ideal: width },
      height: { ideal: height },
      frameRate: { ideal: fps }
    },
    audio: false
  };
  
  try {
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.srcObject = localStream;
    
    await localVideo.play();
    
    const videoTrack = localStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    document.getElementById('videoResolution').textContent = 
      `${settings.width}x${settings.height} @ ${settings.frameRate}fps`;
    
    annotationCanvas.width = settings.width;
    annotationCanvas.height = settings.height;
    
    startCameraBtn.textContent = '🔄 切换摄像头';
    toggleVideoBtn.textContent = '⏹️ 停止视频';
    
    if (adaptiveResolutionSelect.value === 'true') {
      webrtcManager.enableResolutionAdaptation(localVideo);
    }
    currentResolutionNameDisplay.textContent = resolutionSelect.options[resolutionSelect.selectedIndex].text;
    
    if (webrtcManager.peerConnection) {
      localStream.getTracks().forEach(track => {
        webrtcManager.peerConnection.addTrack(track, localStream);
      });
    }
  } catch (error) {
    console.error('Error starting camera:', error);
    alert('无法启动摄像头: ' + error.message);
  }
}

function stopCamera() {
  if (localStream) {
    webrtcManager.disableResolutionAdaptation();
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
    localVideo.srcObject = null;
    startCameraBtn.textContent = '🎥 开启摄像头';
    toggleVideoBtn.textContent = '▶️ 开始视频';
    motionLevelDisplay.textContent = '--';
    currentResolutionNameDisplay.textContent = '--';
  }
}

async function createRoom() {
  if (!webrtcManager.signalingWs) {
    try {
      await webrtcManager.connectSignaling('ws://localhost:8080');
    } catch (error) {
      alert('无法连接到信令服务器');
      return;
    }
  }
  
  await webrtcManager.createPeerConnection();
  
  webrtcManager.setTargetBitrate(parseInt(bitrateSelect.value));
  webrtcManager.adaptiveBitrateEnabled = adaptiveBitrateSelect.value === 'true';
  
  if (localStream) {
    await webrtcManager.addStream(localStream);
  }
  
  webrtcManager.createRoom();
  
  const originalHandleMessage = webrtcManager.handleSignalingMessage.bind(webrtcManager);
  webrtcManager.handleSignalingMessage = function(message) {
    if (message.type === 'room-created') {
      roomIdInput.value = message.roomId;
    }
    originalHandleMessage(message);
  };
  
  createRoomBtn.disabled = true;
  createRoomBtn.textContent = '✅ 房间已创建';
}

function handleConnectionStateChange(state) {
  connectionDot.className = 'status-dot';
  
  switch (state) {
    case 'connected':
      connectionDot.classList.add('connected');
      connectionStatus.textContent = '已连接';
      webrtcManager.startStatsMonitoring(updateStats);
      break;
    case 'connecting':
      connectionStatus.textContent = '连接中...';
      break;
    case 'disconnected':
    case 'failed':
    case 'closed':
      connectionStatus.textContent = '未连接';
      webrtcManager.stopStatsMonitoring();
      break;
  }
}

function handleDataChannelMessage(message) {
  switch (message.t || message.type) {
    case 'a':
    case 'annotation':
      annotationManager.addAnnotation(message.d || message.data, true);
      updateAnnotationCount();
      break;
      
    case 'batch':
      if (message.d && Array.isArray(message.d)) {
        message.d.forEach(annotation => {
          annotationManager.addAnnotation(annotation, true);
        });
        updateAnnotationCount();
      }
      break;
      
    case 'clear':
    case 'clear-annotations':
      annotationManager.annotations = [];
      annotationManager.redraw();
      updateAnnotationCount();
      break;
      
    case 'sync-response':
      document.getElementById('syncValue').textContent = `${Math.round(message.rtt / 2)}ms`;
      break;
  }
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
  
  if (stats.availableOutgoingBitrate) {
    const bitrate = Math.round(stats.availableOutgoingBitrate / 1000000);
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
  
  if (stats.targetBitrate) {
    const targetMbps = Math.round(stats.targetBitrate / 1000000);
    console.log('Current encoding bitrate:', targetMbps, 'Mbps');
  }
  
  if (stats.packetsLostRate !== undefined) {
    const lossPercent = (stats.packetsLostRate * 100).toFixed(2);
    if (lossPercent > 1) {
      console.warn('Packet loss detected:', lossPercent, '%');
    }
  }
  
  document.getElementById('fpsValue').textContent = fpsSelect.value;
}

function updateAnnotationCount() {
  const count = annotationManager.getAnnotations().length;
  document.getElementById('annotationCount').textContent = `标注: ${count}`;
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

function handleMotionUpdate(data) {
  const motionPercent = (data.smoothed * 100).toFixed(1);
  motionLevelDisplay.textContent = `${motionPercent}%`;
  
  if (data.smoothed < 0.05) {
    motionLevelDisplay.style.color = '#22c55e';
  } else if (data.smoothed < 0.15) {
    motionLevelDisplay.style.color = '#eab308';
  } else {
    motionLevelDisplay.style.color = '#ef4444';
  }
}

function handleResolutionChange(data) {
  currentResolutionNameDisplay.textContent = data.resolution.name;
  
  if (data.scale >= 1.0) {
    currentResolutionNameDisplay.style.color = '#22c55e';
  } else if (data.scale >= 0.67) {
    currentResolutionNameDisplay.style.color = '#eab308';
  } else {
    currentResolutionNameDisplay.style.color = '#f97316';
  }
}

function updateMotionThreshold() {
  const threshold = parseInt(motionThresholdInput.value) / 100;
  const highThreshold = threshold * 3;
  if (webrtcManager) {
    webrtcManager.setMotionThresholds(threshold, highThreshold);
  }
}

function setupEventListeners() {
  startCameraBtn.addEventListener('click', startCamera);
  createRoomBtn.addEventListener('click', createRoom);
  toggleAudioBtn.addEventListener('click', toggleAudio);
  clearAnnotationsBtn.addEventListener('click', () => {
    annotationManager.clearAll();
    updateAnnotationCount();
  });
  toggleVideoBtn.addEventListener('click', () => {
    if (localStream) {
      stopCamera();
    } else {
      startCamera();
    }
  });
  
  bitrateSelect.addEventListener('change', () => {
    if (webrtcManager && webrtcManager.peerConnection) {
      webrtcManager.setTargetBitrate(parseInt(bitrateSelect.value));
    }
  });
  
  adaptiveBitrateSelect.addEventListener('change', () => {
    if (webrtcManager) {
      webrtcManager.adaptiveBitrateEnabled = adaptiveBitrateSelect.value === 'true';
    }
  });
  
  adaptiveResolutionSelect.addEventListener('change', () => {
    if (webrtcManager && localStream) {
      if (adaptiveResolutionSelect.value === 'true') {
        webrtcManager.enableResolutionAdaptation(localVideo);
      } else {
        webrtcManager.disableResolutionAdaptation();
        currentResolutionNameDisplay.textContent = resolutionSelect.options[resolutionSelect.selectedIndex].text;
      }
    }
  });
  
  motionThresholdInput.addEventListener('input', updateMotionThreshold);
  
  navigator.mediaDevices.addEventListener('devicechange', loadDevices());
}

window.addEventListener('beforeunload', () => {
  if (webrtcManager) {
    webrtcManager.close();
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
  }
});

init();
