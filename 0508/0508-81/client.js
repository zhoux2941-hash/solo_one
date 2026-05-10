const { ipcRenderer } = require('electron');
const io = require('socket.io-client');
const ChatAndFileModule = require('./shared');
const path = require('path');
const fs = require('fs');

class ClientApp {
  constructor() {
    this.socket = null;
    this.drawingCanvas = null;
    this.drawingCtx = null;
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.currentTool = 'pen';
    this.brushColor = '#ff0000';
    this.brushSize = 5;
    this.hostIp = 'localhost';
    this.hostPort = 3000;
    this.clientName = '匿名用户';
    this.canvasSize = { width: 1920, height: 1080 };
    this.clients = [];
    
    this.pendingFrame = null;
    this.isProcessingFrame = false;
    this.lastFrameTime = 0;
    this.frameInterval = 1000;
    this.screenImageLoaded = false;

    this.init();
  }

  init() {
    this.parseUrlParams();
    this.setupUI();
    this.connectToServer();
  }

  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    this.hostIp = params.get('ip') || 'localhost';
    this.hostPort = params.get('port') || 3000;
    this.clientName = params.get('name') || '匿名用户';

    document.getElementById('hostIp').textContent = this.hostIp;
    document.getElementById('hostPort').textContent = this.hostPort;
  }

  setupUI() {
    document.getElementById('btnScreenshot').addEventListener('click', () => {
      this.saveScreenshot();
    });

    document.getElementById('btnLeave').addEventListener('click', () => {
      this.leave();
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

    window.addEventListener('resize', () => {
      this.resizeDrawingCanvas();
    });
  }

  connectToServer() {
    const serverUrl = `http://${this.hostIp}:${this.hostPort}`;
    console.log('连接到:', serverUrl);

    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.socket.on('connect', () => {
      console.log('已连接到服务器');
      this.setConnectedStatus(true);
      document.getElementById('connectionStatus').textContent = '已连接';

      if (this.clientName) {
        this.socket.emit('setName', this.clientName);
      }
      
      this.initChatAndFile();
    });

    this.socket.on('disconnect', () => {
      console.log('与服务器断开连接');
      this.setConnectedStatus(false);
      document.getElementById('connectionStatus').textContent = '已断开';
    });

    this.socket.on('connect_error', (err) => {
      console.error('连接错误:', err);
      this.setConnectedStatus(false);
      document.getElementById('connectionStatus').textContent = '连接失败';
      document.getElementById('placeholder').innerHTML = `
        <div class="error-message">
          <h4>无法连接到服务器</h4>
          <p>请检查 IP 地址和端口是否正确</p>
          <p style="margin-top: 10px; font-size: 0.85rem;">${err.message}</p>
        </div>
      `;
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

    this.socket.on('screenUpdate', (data) => {
      this.handleScreenUpdate(data);
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

    this.socket.on('drawingHistory', (history) => {
      console.log('收到绘画历史:', history.length, '条');
      this.replayDrawingHistory(history);
    });

    this.socket.on('clearDrawings', () => {
      this.clearDrawings();
    });

    this.socket.on('hostLeft', () => {
      alert('主持人已离开房间');
      this.leave();
    });

    this.socket.on('kicked', () => {
      alert('您已被主持人踢出房间');
      this.leave();
    });
  }

  setConnectedStatus(connected) {
    const badge = document.getElementById('connectionBadge');
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');

    if (connected) {
      badge.className = 'status-badge online';
      dot.style.background = '#28a745';
      text.textContent = '已连接';
    } else {
      badge.className = 'status-badge offline';
      dot.style.background = '#dc3545';
      text.textContent = '未连接';
    }
  }

  initChatAndFile() {
    if (!this.chatModule) {
      this.chatModule = new ChatAndFileModule(this.socket, false);
      this.chatModule.setupUI();
    }
  }

  updateClientList() {
    const listEl = document.getElementById('clientList');
    listEl.innerHTML = '';

    this.clients.forEach((client, index) => {
      const isHost = index === 0;
      const isMe = client.id === this.socket.id;

      const item = document.createElement('li');
      item.className = 'client-item';
      item.dataset.id = client.id;
      item.dataset.name = client.name;
      
      if (isMe) {
        item.innerHTML = `
          <div class="client-info">
            <div class="client-avatar">${isHost ? '主' : client.name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="client-name">${client.name} (您)</div>
              <div class="client-role">${isHost ? 'HOST' : 'CLIENT'}</div>
            </div>
          </div>
        `;
      } else {
        item.innerHTML = `
          <div class="client-info">
            <div class="client-avatar">${isHost ? '主' : client.name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="client-name">${client.name}</div>
              <div class="client-role">${isHost ? 'HOST' : 'CLIENT'}</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-small" data-id="${client.id}" data-action="chat" title="私聊">💬</button>
        `;
      }
      
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
        if (e.target.dataset.action === 'chat') {
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

  handleScreenUpdate(data) {
    const now = Date.now();
    
    if (now - this.lastFrameTime < this.frameInterval) {
      this.pendingFrame = data;
      return;
    }
    
    this.lastFrameTime = now;
    this.processFrame(data);
    
    if (this.pendingFrame) {
      const pending = this.pendingFrame;
      this.pendingFrame = null;
      setTimeout(() => {
        this.handleScreenUpdate(pending);
      }, this.frameInterval - (Date.now() - now));
    }
  }

  processFrame(data) {
    const img = document.getElementById('screenImage');
    const placeholder = document.getElementById('placeholder');

    if (placeholder.style.display !== 'none') {
      placeholder.style.display = 'none';
      img.style.display = 'block';
    }

    if (!this.screenImageLoaded) {
      img.onload = () => {
        this.canvasSize.width = img.naturalWidth;
        this.canvasSize.height = img.naturalHeight;
        this.resizeDrawingCanvas();
        this.screenImageLoaded = true;
      };
    }

    const oldSrc = img.src;
    img.src = typeof data === 'string' ? data : data.data;
    
    if (data.width && data.height) {
      this.canvasSize.width = data.width;
      this.canvasSize.height = data.height;
    }

    if (oldSrc && oldSrc.startsWith('data:')) {
      URL.revokeObjectURL(oldSrc);
    }
  }

  resizeDrawingCanvas() {
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
      this.setupDrawing();
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

    const scaleX = this.canvasSize.width / this.drawingCanvas.width;
    const scaleY = this.canvasSize.height / this.drawingCanvas.height;

    this.socket.emit('drawing', {
      x: x * scaleX,
      y: y * scaleY,
      lastX: this.lastX * scaleX,
      lastY: this.lastY * scaleY,
      tool: this.currentTool,
      color: this.brushColor,
      size: this.brushSize * scaleX,
      canvasWidth: this.canvasSize.width,
      canvasHeight: this.canvasSize.height
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

  replayDrawingHistory(history) {
    if (!this.drawingCtx || !this.drawingCanvas) return;

    history.forEach((data) => {
      this.remoteDraw(data);
    });
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

  leave() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    window.location.href = 'start.html';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new ClientApp();
});

window.addEventListener('beforeunload', () => {
  if (window.clientApp && window.clientApp.socket) {
    window.clientApp.socket.disconnect();
  }
});
