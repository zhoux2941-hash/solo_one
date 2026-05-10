const path = require('path');
const fs = require('fs');
const os = require('os');

class ChatAndFileModule {
  constructor(socket, isHost = false) {
    this.socket = socket;
    this.isHost = isHost;
    this.chatTargetId = null;
    this.chatTargetName = null;
    this.pendingFiles = new Map();
    this.receivingFiles = new Map();
    this.CHUNK_SIZE = 64 * 1024;
  }

  setupUI() {
    this.setupChatPanel();
    this.setupEmojiPicker();
    this.setupFileInput();
    this.setupDragAndDrop();
    this.setupSocketEvents();
  }

  setupChatPanel() {
    const chatPanel = document.getElementById('chatPanel');
    const chatHeader = chatPanel.querySelector('.chat-header');
    const chatToggle = document.getElementById('chatToggle');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    chatHeader.addEventListener('click', (e) => {
      if (e.target === chatToggle || chatToggle.contains(e.target)) {
        chatPanel.classList.toggle('collapsed');
      }
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 80) + 'px';
    });

    sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });
  }

  setupEmojiPicker() {
    const emojiBtn = document.getElementById('emojiBtn');
    const emojiPicker = document.getElementById('emojiPicker');
    const emojiItems = emojiPicker.querySelectorAll('.emoji-item');
    const chatInput = document.getElementById('chatInput');

    emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      emojiPicker.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.classList.add('hidden');
      }
    });

    emojiItems.forEach((item) => {
      item.addEventListener('click', () => {
        chatInput.value += item.textContent;
        chatInput.focus();
        emojiPicker.classList.add('hidden');
      });
    });
  }

  setupFileInput() {
    const fileBtn = document.getElementById('fileBtn');
    const fileInput = document.getElementById('fileInput');

    fileBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        this.sendFile(files[0]);
      }
      fileInput.value = '';
    });
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

    const clientItems = document.querySelectorAll('.client-item');
    clientItems.forEach((item) => {
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.classList.add('drop-target');
        dropTarget = item;
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
        if (files.length > 0) {
          const clientId = item.dataset.id;
          if (clientId && clientId !== this.socket.id) {
            const clientName = item.querySelector('.client-name').textContent;
            this.sendFile(files[0], clientId, clientName);
          }
        }
      });
    });
  }

  setChatTarget(targetId = null, targetName = null) {
    this.chatTargetId = targetId;
    this.chatTargetName = targetName;

    const targetIcon = document.querySelector('.chat-target-icon');
    const targetNameEl = document.querySelector('.chat-target-name');
    const targetBadge = document.getElementById('chatTargetBadge');

    if (targetId) {
      targetIcon.textContent = '👤';
      targetNameEl.textContent = targetName || '私聊';
      targetBadge.style.display = 'inline-block';
    } else {
      targetIcon.textContent = '👥';
      targetNameEl.textContent = '群聊';
      targetBadge.style.display = 'none';
    }

    const clientItems = document.querySelectorAll('.client-item');
    clientItems.forEach((item) => {
      if (item.dataset.id === targetId) {
        item.classList.add('chat-targeted');
      } else {
        item.classList.remove('chat-targeted');
      }
    });
  }

  sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const content = chatInput.value.trim();

    if (!content) return;

    const message = {
      content: content,
      targetId: this.chatTargetId,
      targetName: this.chatTargetName
    };

    this.socket.emit('chatMessage', message);
    chatInput.value = '';
    chatInput.style.height = 'auto';
  }

  addChatMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const isOwn = message.senderId === this.socket.id;

    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${isOwn ? 'own' : 'other'} ${message.targetId ? 'private' : ''}`;

    const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (message.isSystem) {
      messageEl.className = 'system-message';
      messageEl.textContent = message.content;
    } else {
      const targetInfo = message.targetId ? ` → ${message.targetName}` : '';
      
      messageEl.innerHTML = `
        <div class="chat-message-info">
          ${message.senderName}${targetInfo} · ${time}
        </div>
        <div class="chat-message-content">
          ${this.escapeHtml(message.content)}
        </div>
      `;
    }

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async sendFile(file, targetId = null, targetName = null) {
    if (!file) return;

    if (targetId === this.socket.id) {
      alert('不能发送文件给自己');
      return;
    }

    const transferId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);

    this.socket.emit('fileTransferStart', {
      transferId: transferId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      totalChunks: totalChunks,
      targetId: targetId,
      targetName: targetName
    });

    this.pendingFiles.set(transferId, {
      file: file,
      targetId: targetId,
      targetName: targetName,
      currentChunk: 0,
      totalChunks: totalChunks
    });

    this.showTransferProgress(transferId, file.name, 0, totalChunks, true);

    this.socket.once('fileTransferReady', async (data) => {
      if (data.transferId === transferId) {
        await this.sendFileChunks(transferId);
      }
    });
  }

  async sendFileChunks(transferId) {
    const pending = this.pendingFiles.get(transferId);
    if (!pending) return;

    const file = pending.file;
    const reader = new FileReader();

    for (let i = 0; i < pending.totalChunks; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      await new Promise((resolve) => {
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          this.socket.emit('fileChunk', {
            transferId: transferId,
            chunkIndex: i,
            chunk: base64,
            targetId: pending.targetId
          });

          pending.currentChunk = i + 1;
          this.updateTransferProgress(transferId, pending.currentChunk, pending.totalChunks);
          
          setTimeout(resolve, 10);
        };
        reader.readAsDataURL(chunk);
      });

      if (i % 10 === 0) {
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    this.pendingFiles.delete(transferId);
  }

  showTransferProgress(transferId, fileName, current, total, isSending) {
    const panel = document.getElementById('fileTransferPanel');
    const info = document.getElementById('fileTransferInfo');

    panel.classList.remove('hidden');

    const percent = Math.round((current / total) * 100);

    info.innerHTML = `
      <div class="file-transfer-item" data-id="${transferId}">
        <div class="file-transfer-item-header">
          <span class="file-transfer-name">${isSending ? '📤 发送中' : '📥 接收中'}: ${fileName}</span>
          <span class="file-transfer-status">${percent}%</span>
        </div>
        <div class="file-transfer-progress">
          <div class="file-transfer-progress-bar" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  }

  updateTransferProgress(transferId, current, total) {
    const item = document.querySelector(`.file-transfer-item[data-id="${transferId}"]`);
    if (!item) return;

    const percent = Math.round((current / total) * 100);
    const status = item.querySelector('.file-transfer-status');
    const progressBar = item.querySelector('.file-transfer-progress-bar');

    status.textContent = `${percent}%`;
    progressBar.style.width = `${percent}%`;

    if (percent >= 100) {
      setTimeout(() => {
        const panel = document.getElementById('fileTransferPanel');
        panel.classList.add('hidden');
      }, 1000);
    }
  }

  getDownloadsPath() {
    const home = os.homedir();
    if (process.platform === 'win32') {
      return path.join(home, 'Downloads');
    } else if (process.platform === 'darwin') {
      return path.join(home, 'Downloads');
    } else {
      return path.join(home, 'Downloads');
    }
  }

  setupSocketEvents() {
    this.socket.on('chatMessage', (message) => {
      this.addChatMessage(message);
    });

    this.socket.on('chatHistory', (history) => {
      history.forEach((msg) => {
        this.addChatMessage(msg);
      });
    });

    this.socket.on('fileTransferStart', (data) => {
      this.receivingFiles.set(data.transferId, {
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        chunks: [],
        totalChunks: data.totalChunks,
        senderName: data.senderName
      });

      this.showTransferProgress(
        data.transferId,
        data.fileName,
        0,
        data.totalChunks,
        false
      );
    });

    this.socket.on('fileChunk', (data) => {
      const receiving = this.receivingFiles.get(data.transferId);
      if (!receiving) return;

      receiving.chunks.push(data.chunk);
      this.updateTransferProgress(data.transferId, data.receivedChunks, data.totalChunks);

      if (data.receivedChunks >= data.totalChunks) {
        this.completeFileTransfer(data.transferId);
      }
    });

    this.socket.on('fileTransferComplete', (data) => {
      const receiving = this.receivingFiles.get(data.transferId);
      if (!receiving) return;

      this.completeFileTransfer(data.transferId);
    });

    this.socket.on('fileTransferCancel', (data) => {
      this.receivingFiles.delete(data.transferId);
      this.pendingFiles.delete(data.transferId);
    });
  }

  async completeFileTransfer(transferId) {
    const receiving = this.receivingFiles.get(transferId);
    if (!receiving) return;

    try {
      const base64Data = receiving.chunks.join('');
      const binaryData = Buffer.from(base64Data, 'base64');

      const downloadsPath = this.getDownloadsPath();
      const fileName = this.generateUniqueFileName(downloadsPath, receiving.fileName);
      const filePath = path.join(downloadsPath, fileName);

      fs.writeFileSync(filePath, binaryData);

      this.addChatMessage({
        id: Date.now(),
        senderId: receiving.senderName,
        senderName: receiving.senderName,
        content: '',
        timestamp: Date.now(),
        isFile: true,
        filePath: filePath,
        fileName: receiving.fileName,
        fileSize: receiving.fileSize
      });

      alert(`文件已保存到: ${filePath}`);
    } catch (err) {
      console.error('保存文件失败:', err);
      alert('保存文件失败: ' + err.message);
    }

    this.receivingFiles.delete(transferId);
  }

  generateUniqueFileName(dir, fileName) {
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    let newName = fileName;
    let counter = 1;

    while (fs.existsSync(path.join(dir, newName))) {
      newName = `${baseName} (${counter})${ext}`;
      counter++;
    }

    return newName;
  }
}

module.exports = ChatAndFileModule;
