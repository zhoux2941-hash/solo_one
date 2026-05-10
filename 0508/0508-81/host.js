const { ipcRenderer, desktopCapturer } = require('electron');
const io = require('socket.io-client');
const ScreenShareServer = require('./server');
const ChatAndFileModule = require('./shared');
const path = require('path');
const fs = require('fs');
const os = require('os');

class HostApp {
  constructor() {
    this.server = null;
    this.socket = null;
    this.mediaStream = null;
    this.videoElement = null;
    this.canvas = null;
    this.ctx = null;
    this.drawingCanvas = null;
    this.drawingCtx = null;
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.currentTool = 'pen';
    this.brushColor = '#ff0000';
    this.brushSize = 5;
    this.frameInterval = null;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsTime = Date.now();
    this.hostSocketId = null;
    this.clients = [];
    
    this.MAX_WIDTH = 1280;
    this.MAX_HEIGHT = 720;
    this.targetFps = 1;
    this.actualCanvasWidth = 0;
    this.actualCanvasHeight = 0;

    this.init();
  }

  async init() {
    this.setupUI();
    await this.startServer();
    await this.setupSocket();
    await this.startScreenCapture();
    this.setupDrawing();
    this.startFpsCounter();
  }

  setupUI() {
    document.getElementById('btnClearDrawings').addEventListener('click', () => {
      this.clearDrawings();
      if (this.socket) {
        this.socket.emit('clearDrawings');
      }
    });

    document.getElementById('btnScreenshot').addEventListener('click', () => {
      this.saveScreenshot();
    });

    document.getElementById('btnStop').addEventListener('click', () => {
      this.stop();
      window.location.href = 'start.html';
    });

    document.getElementById('toolPen').addEventListener('click', () => {
      this.setTool('pen');
    });

    document.getElementById('toolEraser').addEventListener('click', () => {
      this.setTool('eraser');
    });

    document.getElementById('colorPicker').addEventListener('change', (e) => {
      this.brushColor = e.target.value;
    });

    document.getElementById('brushSize').addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value);
    });
  }

  async startServer() {
    const port = 3000;
    this.server = new ScreenShareServer(port);
    
    try {
      await this.server.start();
      document.getElementById('hostPort').textContent = port;
      
      const ip = this.getLocalIP();
      document.getElementById('hostIp').textContent = ip || 'localhost';
      
      console.log(`服务器启动成功，端口: ${port}`);
    } catch (err) {
      console.error('服务器启动失败:', err);
      alert('服务器启动失败，请检查端口是否被占用');
    }
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return null;
  }

  async setupSocket() {
    return new Promise((resolve, reject) => {
      this.socket = io('http://localhost:3000');

      this.socket.on('connect', () => {
        console.log('已连接到服务器');
        this.initChatAndFile();
        resolve();
      });

      this.socket.on('role', (role) => {
        console.log('角色:', role);
      });

      this.socket.on('clientList', (clients) => {
        this.clients = clients;
        this.updateClientList();
      });

      this.socket.on('clientJoined', (client) => {
        console.log('新客户端加入:', client);
      });

      this.socket.on('clientLeft', (clientId) => {
        console.log('客户端离开:', clientId);
      });

      this.socket.on('drawing', (data) => {
        if (data.clientId !== this.socket.id) {
          this.remoteDraw(data);
        }
      });

      this.socket.on('strokeEnd', (data) => {
        if (data.clientId !== this.socket.id) {
          this.remoteStrokeEnd(data);
        }
      });

      this.socket.on('clearDrawings', () => {
        this.clearDrawings();
      });

      this.socket.on('connect_error', (err) => {
        console.error('连接错误:', err);
        reject(err);
      });
    });
  }

  initChatAndFile() {
    if (!this.chatModule) {
      this.chatModule = new ChatAndFileModule(this.socket, true);
      this.chatModule.setupUI();
    }
  }

  updateClientList() {
    const listEl = document.getElementById('clientList');
    listEl.innerHTML = '';

    const hostItem = document.createElement('li');
    hostItem.className = 'client-item';
    hostItem.dataset.id = this.socket.id;
    hostItem.innerHTML = `
      <div class="client-info">
        <div class="client-avatar">主</div>
        <div>
          <div class="client-name">主持人（您）</div>
          <div class="client-role">HOST</div>
        </div>
      </div>
    `;
    listEl.appendChild(hostItem);

    this.clients.forEach((client) => {
      if (client.id === this.socket.id) return;

      const item = document.createElement('li');
      item.className = 'client-item';
      item.dataset.id = client.id;
      item.dataset.name = client.name;
      item.innerHTML = `
        <div class="client-info">
          <div class="client-avatar">${client.name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="client-name">${client.name}</div>
            <div class="client-role">CLIENT</div>
          </div>
        </div>
        <div style="display: flex; gap: 5px;">
          <button class="btn btn-secondary btn-small" data-id="${client.id}" data-action="chat" title="私聊">💬</button>
          <button class="btn btn-danger btn-small" data-id="${client.id}" data-action="kick" title="踢出">🚫</button>
        </div>
      `;
      listEl.appendChild(item);
    });

    listEl.querySelectorAll('.client-item[data-id]').forEach((item) => {
      const clientId = item.dataset.id;
      const clientName = item.dataset.name;

      item.addEventListener('dblclick', () => {
        if (clientId !== this.socket.id && this.chatModule) {
          this.chatModule.setChatTarget(clientId, clientName);
        }
      });

      item.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'kick') {
          if (confirm('确定要踢出此用户吗？')) {
            this.socket.emit('kickClient', clientId);
          }
        } else if (e.target.dataset.action === 'chat') {
          if (this.chatModule) {
            if (this.chatModule.chatTargetId === clientId) {
              this.chatModule.setChatTarget(null, null);
            } else {
              this.chatModule.setChatTarget(clientId, clientName);
            }
          }
        }
      });
    });

    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    const clientList = document.getElementById('clientList');
    const fileDropHint = document.getElementById('fileDropHint');
    let dropTarget = null;

    document.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (fileDropHint) {
        fileDropHint.classList.add('drag-over');
      }
    });

    document.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (fileDropHint && !e.relatedTarget) {
        fileDropHint.classList.remove('drag-over');
      }
      if (dropTarget) {
        dropTarget.classList.remove('drop-target');
        dropTarget = null;
      }
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (fileDropHint) {
        fileDropHint.classList.remove('drag-over');
      }
    });

    clientList.querySelectorAll('.client-item[data-id]').forEach((item) => {
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (item.dataset.id !== this.socket.id) {
          item.classList.add('drop-target');
          dropTarget = item;
        }
      });

      item.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.classList.remove('drop-target');
        if (dropTarget === item) {
          dropTarget = null;
        }
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.classList.remove('drop-target');
        if (fileDropHint) {
          fileDropHint.classList.remove('drag-over');
        }
        dropTarget = null;

        const files = e.dataTransfer.files;
        if (files.length > 0 && item.dataset.id !== this.socket.id && this.chatModule) {
          this.chatModule.sendFile(files[0], item.dataset.id, item.dataset.name);
        }
      });
    });
  }

  async startScreenCapture() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: this.MAX_WIDTH, height: this.MAX_HEIGHT }
      });

      if (sources.length === 0) {
        throw new Error('未找到屏幕源');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sources[0].id,
            maxWidth: this.MAX_WIDTH * 2,
            maxHeight: this.MAX_HEIGHT * 2,
            maxFrameRate: 5
          }
        }
      });

      this.mediaStream = stream;

      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = stream;
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;

      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');

      this.videoElement.addEventListener('loadedmetadata', () => {
        const videoWidth = this.videoElement.videoWidth;
        const videoHeight = this.videoElement.videoHeight;
        
        const scale = Math.min(
          this.MAX_WIDTH / videoWidth,
          this.MAX_HEIGHT / videoHeight,
          1
        );
        
        this.actualCanvasWidth = Math.floor(videoWidth * scale);
        this.actualCanvasHeight = Math.floor(videoHeight * scale);
        
        this.canvas.width = this.actualCanvasWidth;
        this.canvas.height = this.actualCanvasHeight;
        
        console.log(`原始分辨率: ${videoWidth}x${videoHeight}`);
        console.log(`传输分辨率: ${this.actualCanvasWidth}x${this.actualCanvasHeight}`);
        console.log(`压缩比例: ${(scale * 100).toFixed(1)}%`);
        
        this.startFrameTransmission();
      });

      await this.videoElement.play();

      document.getElementById('placeholder').style.display = 'none';
      const img = document.getElementById('screenImage');
      img.style.display = 'block';
    } catch (err) {
      console.error('屏幕捕获失败:', err);
      document.getElementById('placeholder').innerHTML = `
        <div class="error-message">
          <h4>屏幕捕获失败</h4>
          <p>${err.message}</p>
        </div>
      `;
    }
  }

  startFrameTransmission() {
    this.frameInterval = setInterval(() => {
      this.captureAndSendFrame();
    }, 1000);
  }

  captureAndSendFrame() {
    if (!this.videoElement || !this.ctx || !this.socket) return;

    this.ctx.drawImage(
      this.videoElement,
      0, 0,
      this.canvas.width,
      this.canvas.height
    );

    const quality = 0.4;
    const dataUrl = this.canvas.toDataURL('image/jpeg', quality);
    
    const img = document.getElementById('screenImage');
    img.src = dataUrl;

    this.resizeDrawingCanvas();

    this.socket.emit('screenUpdate', {
      data: dataUrl,
      width: this.actualCanvasWidth,
      height: this.actualCanvasHeight,
      timestamp: Date.now()
    });

    this.frameCount++;
  }

  resizeDrawingCanvas() {
    const container = document.getElementById('canvasContainer');
    const img = document.getElementById('screenImage');
    const drawingCanvas = document.getElementById('drawingCanvas');

    if (!img || !img.offsetWidth) return;

    drawingCanvas.width = img.offsetWidth;
    drawingCanvas.height = img.offsetHeight;
    drawingCanvas.style.left = `${img.offsetLeft}px`;
    drawingCanvas.style.top = `${img.offsetTop}px`;
    drawingCanvas.style.width = `${img.offsetWidth}px`;
    drawingCanvas.style.height = `${img.offsetHeight}px`;

    if (!this.drawingCtx) {
      this.drawingCtx = drawingCanvas.getContext('2d');
    }
  }

  setupDrawing() {
    this.drawingCanvas = document.getElementById('drawingCanvas');
    this.drawingCtx = this.drawingCanvas.getContext('2d');

    this.drawingCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.drawingCanvas.addEventListener('mousemove', (e) => this.draw(e));
    this.drawingCanvas.addEventListener('mouseup', () => this.stopDrawing());
    this.drawingCanvas.addEventListener('mouseleave', () => this.stopDrawing());
  }

  getMousePos(e) {
    const rect = this.drawingCanvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  startDrawing(e) {
    this.isDrawing = true;
    const pos = this.getMousePos(e);
    this.lastX = pos.x;
    this.lastY = pos.y;

    this.localDraw(this.lastX, this.lastY);
  }

  draw(e) {
    if (!this.isDrawing) return;

    const pos = this.getMousePos(e);
    const x = pos.x;
    const y = pos.y;

    this.localDraw(x, y, this.lastX, this.lastY);

    const scaleX = this.canvas.width / this.drawingCanvas.width;
    const scaleY = this.canvas.height / this.drawingCanvas.height;

    this.socket.emit('drawing', {
      x: x * scaleX,
      y: y * scaleY,
      lastX: this.lastX * scaleX,
      lastY: this.lastY * scaleY,
      tool: this.currentTool,
      color: this.brushColor,
      size: this.brushSize * scaleX,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height
    });

    this.lastX = x;
    this.lastY = y;
  }

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.socket.emit('strokeEnd', { clientId: this.socket.id });
    }
  }

  localDraw(x, y, lastX = x, lastY = y) {
    if (!this.drawingCtx) return;

    this.drawingCtx.beginPath();
    this.drawingCtx.moveTo(lastX, lastY);
    this.drawingCtx.lineTo(x, y);
    this.drawingCtx.lineCap = 'round';
    this.drawingCtx.lineJoin = 'round';

    if (this.currentTool === 'eraser') {
      this.drawingCtx.globalCompositeOperation = 'destination-out';
      this.drawingCtx.strokeStyle = 'rgba(0,0,0,1)';
      this.drawingCtx.lineWidth = this.brushSize * 3;
    } else {
      this.drawingCtx.globalCompositeOperation = 'source-over';
      this.drawingCtx.strokeStyle = this.brushColor;
      this.drawingCtx.lineWidth = this.brushSize;
    }

    this.drawingCtx.stroke();
    this.drawingCtx.globalCompositeOperation = 'source-over';
  }

  remoteDraw(data) {
    if (!this.drawingCtx || !this.drawingCanvas) return;

    const scaleX = this.drawingCanvas.width / data.canvasWidth;
    const scaleY = this.drawingCanvas.height / data.canvasHeight;

    const x = data.x * scaleX;
    const y = data.y * scaleY;
    const lastX = data.lastX * scaleX;
    const lastY = data.lastY * scaleY;

    this.drawingCtx.beginPath();
    this.drawingCtx.moveTo(lastX, lastY);
    this.drawingCtx.lineTo(x, y);
    this.drawingCtx.lineCap = 'round';
    this.drawingCtx.lineJoin = 'round';

    if (data.tool === 'eraser') {
      this.drawingCtx.globalCompositeOperation = 'destination-out';
      this.drawingCtx.strokeStyle = 'rgba(0,0,0,1)';
      this.drawingCtx.lineWidth = data.size * 3 * scaleX;
    } else {
      this.drawingCtx.globalCompositeOperation = 'source-over';
      this.drawingCtx.strokeStyle = data.color;
      this.drawingCtx.lineWidth = data.size * scaleX;
    }

    this.drawingCtx.stroke();
    this.drawingCtx.globalCompositeOperation = 'source-over';
  }

  remoteStrokeEnd(data) {
  }

  setTool(tool) {
    this.currentTool = tool;
    document.getElementById('toolPen').classList.toggle('active', tool === 'pen');
    document.getElementById('toolEraser').classList.toggle('active', tool === 'eraser');
  }

  clearDrawings() {
    if (this.drawingCtx && this.drawingCanvas) {
      this.drawingCtx.clearRect(
        0, 0,
        this.drawingCanvas.width,
        this.drawingCanvas.height
      );
    }
  }

  async saveScreenshot() {
    try {
      const result = await ipcRenderer.invoke('save-dialog', `screenshot-${Date.now()}.png`);
      
      if (result.canceled || !result.filePath) return;

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');

      const img = document.getElementById('screenImage');
      const drawingCanvas = document.getElementById('drawingCanvas');

      if (img && img.src) {
        const tempImg = new Image();
        tempImg.src = img.src;
        
        await new Promise((resolve) => {
          tempImg.onload = resolve;
        });

        tempCanvas.width = tempImg.width;
        tempCanvas.height = tempImg.height;

        tempCtx.drawImage(tempImg, 0, 0);

        if (drawingCanvas) {
          tempCtx.drawImage(
            drawingCanvas,
            0, 0,
            drawingCanvas.width,
            drawingCanvas.height,
            0, 0,
            tempCanvas.width,
            tempCanvas.height
          );
        }

        const dataUrl = tempCanvas.toDataURL('image/png');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

        fs.writeFileSync(result.filePath, base64Data, 'base64');
        alert('截图已保存: ' + result.filePath);
      }
    } catch (err) {
      console.error('保存截图失败:', err);
      alert('保存截图失败: ' + err.message);
    }
  }

  startFpsCounter() {
    setInterval(() => {
      const now = Date.now();
      const elapsed = (now - this.lastFpsTime) / 1000;
      this.fps = Math.round(this.frameCount / elapsed);
      this.frameCount = 0;
      this.lastFpsTime = now;

      document.getElementById('fpsInfo').textContent = `FPS: ${this.fps}`;
    }, 1000);
  }

  stop() {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new HostApp();
});

window.addEventListener('beforeunload', () => {
  if (window.hostApp) {
    window.hostApp.stop();
  }
});
