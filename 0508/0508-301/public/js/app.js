class WhiteboardApp {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.roomId = null;
    this.roomKey = null;
    this.crypto = new CryptoManager();
    this.webrtc = null;
    this.drawing = null;
    this.users = new Set();
    this.init();
  }

  init() {
    this.setupElements();
    this.setupDrawing();
    this.setupEvents();
  }

  setupElements() {
    this.createRoomBtn = document.getElementById('createRoomBtn');
    this.joinRoomBtn = document.getElementById('joinRoomBtn');
    this.roomIdInput = document.getElementById('roomIdInput');
    this.currentRoomEl = document.getElementById('currentRoom');
    this.toolSelect = document.getElementById('toolSelect');
    this.brushShapeSelect = document.getElementById('brushShapeSelect');
    this.colorPicker = document.getElementById('colorPicker');
    this.sizeSlider = document.getElementById('sizeSlider');
    this.sizeValue = document.getElementById('sizeValue');
    this.opacitySlider = document.getElementById('opacitySlider');
    this.opacityValue = document.getElementById('opacityValue');
    this.pressureToggle = document.getElementById('pressureToggle');
    this.pressureSlider = document.getElementById('pressureSlider');
    this.pressureValue = document.getElementById('pressureValue');
    this.clearBtn = document.getElementById('clearBtn');
    this.userCountEl = document.getElementById('userCount');
    this.connectionStatusEl = document.getElementById('connectionStatus');
    this.latencyEl = document.getElementById('latency');
    this.statusBarEl = document.getElementById('statusBar');
    this.canvas = document.getElementById('whiteboard');
  }

  setupDrawing() {
    this.drawing = new DrawingManager(this.canvas);
    this.drawing.clear();
    this.drawing.setDrawCallback((data) => this.onLocalDraw(data));
  }

  setupEvents() {
    this.createRoomBtn.addEventListener('click', () => this.createRoom());
    this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
    this.roomIdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinRoom();
    });

    this.toolSelect.addEventListener('change', (e) => {
      this.drawing.setTool(e.target.value);
    });

    this.brushShapeSelect.addEventListener('change', (e) => {
      this.drawing.setBrushShape(e.target.value);
    });

    this.colorPicker.addEventListener('input', (e) => {
      this.drawing.setColor(e.target.value);
    });

    this.sizeSlider.addEventListener('input', (e) => {
      const size = e.target.value;
      this.sizeValue.textContent = `${size}px`;
      this.drawing.setLineWidth(parseInt(size));
    });

    this.opacitySlider.addEventListener('input', (e) => {
      const opacity = parseInt(e.target.value) / 100;
      this.opacityValue.textContent = `${e.target.value}%`;
      this.drawing.setOpacity(opacity);
    });

    this.pressureToggle.addEventListener('change', (e) => {
      this.drawing.setPressureEnabled(e.target.checked);
    });

    this.pressureSlider.addEventListener('input', (e) => {
      const sensitivity = parseInt(e.target.value) / 100;
      this.pressureValue.textContent = `${e.target.value}%`;
      this.drawing.setPressureSensitivity(sensitivity);
    });

    this.clearBtn.addEventListener('click', () => this.clearCanvas());
  }

  connectWebSocket() {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.ws = new WebSocket(`${protocol}//${window.location.host}`);

      this.ws.onopen = () => {
        this.updateConnectionStatus('服务器已连接');
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleServerMessage(message);
      };

      this.ws.onerror = (error) => {
        this.updateConnectionStatus('服务器连接错误');
        reject(error);
      };

      this.ws.onclose = () => {
        this.updateConnectionStatus('服务器已断开');
      };
    });
  }

  async createRoom() {
    try {
      if (!this.ws) {
        await this.connectWebSocket();
      }

      this.roomKey = await this.crypto.generateKey();
      this.ws.send(JSON.stringify({ type: 'create-room' }));
    } catch (error) {
      console.error('Create room error:', error);
      alert('创建房间失败');
    }
  }

  async joinRoom() {
    const roomId = this.roomIdInput.value.trim().toUpperCase();
    if (!roomId) {
      alert('请输入房间ID');
      return;
    }

    try {
      if (!this.ws) {
        await this.connectWebSocket();
      }

      this.ws.send(JSON.stringify({ type: 'join-room', roomId }));
    } catch (error) {
      console.error('Join room error:', error);
      alert('加入房间失败');
    }
  }

  handleServerMessage(message) {
    switch (message.type) {
      case 'room-created':
        this.roomId = message.roomId;
        this.userId = message.userId;
        this.currentRoomEl.textContent = `房间: ${this.roomId}`;
        this.showRoomKey();
        this.initWebRTC();
        this.users.add(this.userId);
        this.updateUserCount();
        break;

      case 'room-joined':
        this.roomId = message.roomId;
        this.userId = message.userId;
        this.currentRoomEl.textContent = `房间: ${this.roomId}`;
        this.initWebRTC();
        this.users.add(this.userId);
        this.promptForKey();
        message.users.forEach(userId => {
          this.users.add(userId);
          this.webrtc.createOffer(userId);
        });
        this.updateUserCount();
        break;

      case 'user-joined':
        this.users.add(message.userId);
        this.updateUserCount();
        if (this.webrtc) {
          this.webrtc.createOffer(message.userId);
        }
        break;

      case 'user-left':
        this.users.delete(message.userId);
        this.updateUserCount();
        break;

      case 'signal':
        this.handleSignal(message);
        break;

      case 'error':
        alert(message.message);
        break;
    }
  }

  showRoomKey() {
    const keyDisplay = `房间ID: ${this.roomId}\n加密密钥: ${this.roomKey}\n\n请将密钥分享给其他用户！`;
    alert(keyDisplay);
  }

  async promptForKey() {
    const key = prompt('请输入房间加密密钥:');
    if (key) {
      try {
        await this.crypto.importKey(key);
        alert('密钥设置成功！等待其他用户连接...');
      } catch (e) {
        alert('无效的密钥，请重试');
        this.promptForKey();
      }
    }
  }

  initWebRTC() {
    this.webrtc = new WebRTCManager(this.userId, this.crypto);
    
    this.webrtc.setSignalingCallback((signal) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'signal',
          to: signal.to,
          data: signal.data
        }));
      }
    });

    this.webrtc.setMessageCallback((message) => {
      this.drawing.executeDraw(message);
    });

    this.webrtc.setConnectionStateChangeCallback((state) => {
      this.updatePeerConnectionStatus(state);
    });

    this.webrtc.startLatencyMeasurement();
    setInterval(() => {
      if (this.webrtc) {
        const latency = this.webrtc.getAverageLatency();
        this.latencyEl.textContent = `延迟: ${latency > 0 ? latency + 'ms' : '--'}`;
      }
    }, 1000);
  }

  updatePeerConnectionStatus(state) {
    const statusMap = {
      [ConnectionState.DISCONNECTED]: '未连接',
      [ConnectionState.CONNECTING]: '连接中...',
      [ConnectionState.CONNECTED]: '已连接',
      [ConnectionState.FAILED]: '连接失败'
    };
    
    const statusText = statusMap[state] || '未知状态';
    
    this.statusBarEl.classList.remove('connected', 'connecting', 'failed');
    
    if (state === ConnectionState.CONNECTED) {
      const count = this.webrtc ? this.webrtc.getConnectedUserCount() : 0;
      this.updateConnectionStatus(`点对点已连接 (${count}人)`);
      this.statusBarEl.classList.add('connected');
    } else if (state === ConnectionState.CONNECTING) {
      this.updateConnectionStatus(statusText);
      this.statusBarEl.classList.add('connecting');
    } else if (state === ConnectionState.FAILED) {
      this.updateConnectionStatus(statusText);
      this.statusBarEl.classList.add('failed');
    } else {
      this.updateConnectionStatus(statusText);
    }
  }

  handleSignal(message) {
    if (!this.webrtc) return;

    const { from, data } = message;
    
    switch (data.type) {
      case 'offer':
        this.webrtc.handleOffer(from, data.sdp);
        break;
      case 'answer':
        this.webrtc.handleAnswer(from, data.sdp);
        break;
      case 'candidate':
        this.webrtc.handleCandidate(from, data.candidate);
        break;
    }
  }

  onLocalDraw(data) {
    if (this.webrtc) {
      this.webrtc.sendMessage(data);
    }
  }

  clearCanvas() {
    this.drawing.clear();
    if (this.webrtc) {
      this.webrtc.sendMessage({ type: 'clear' });
    }
  }

  updateUserCount() {
    this.userCountEl.textContent = `用户: ${this.users.size}`;
  }

  updateConnectionStatus(status) {
    this.connectionStatusEl.textContent = status;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new WhiteboardApp();
});
