const { ipcRenderer } = require('electron');
const io = require('socket.io-client');
const path = require('path');

const SIGNAL_SERVER = 'http://localhost:3000';
const CHUNK_SIZE = 64 * 1024;
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const HEADER_SIZE = 4;

let socket;
let localIP;
let hostname;
let nodes = [];
let selectedNodes = new Set();
let peerConnections = new Map();
let activeSends = new Map();
let activeReceives = new Map();
let transfers = [];
let currentFilter = 'all';
let pendingReceiveQueue = [];
let channelCounter = 0;

const elements = {
  hostname: document.getElementById('hostname'),
  localIP: document.getElementById('local-ip'),
  serverStatus: document.getElementById('server-status'),
  nodesList: document.getElementById('nodes-list'),
  nodeCount: document.getElementById('node-count'),
  transfersList: document.getElementById('transfers-list'),
  refreshBtn: document.getElementById('refresh-btn'),
  sendBtn: document.getElementById('send-btn'),
  receiveModal: document.getElementById('receive-modal'),
  receiveSender: document.getElementById('receive-sender'),
  receiveFilename: document.getElementById('receive-filename'),
  receiveSize: document.getElementById('receive-size'),
  acceptBtn: document.getElementById('accept-btn'),
  rejectBtn: document.getElementById('reject-btn'),
  tabBtns: document.querySelectorAll('.tab-btn')
};

async function init() {
  localIP = await ipcRenderer.invoke('get-local-ip');
  hostname = await ipcRenderer.invoke('get-hostname');
  elements.hostname.textContent = hostname;
  elements.localIP.textContent = localIP;
  await loadTransfers();
  connectToServer();
  setupEventListeners();
}

function connectToServer() {
  socket = io(SIGNAL_SERVER);

  socket.on('connect', () => {
    elements.serverStatus.textContent = '🟢 服务器已连接';
    socket.emit('register', { name: hostname, ip: localIP, port: 0 });
    refreshNodes();
  });

  socket.on('disconnect', () => {
    elements.serverStatus.textContent = '🔴 服务器未连接';
  });

  socket.on('nodes-list', (nodeList) => {
    nodes = nodeList;
    renderNodes();
  });

  socket.on('nodes-update', (nodeList) => {
    nodes = nodeList.filter(n => n.id !== socket.id);
    renderNodes();
    saveNodesToDB();
  });

  socket.on('signal', async (data) => {
    await handleIncomingSignal(data);
  });

  socket.on('signal-answer', (data) => {
    handleSignalAnswer(data);
  });
}

async function handleIncomingSignal(data) {
  if (!peerConnections.has(data.from)) {
    const pc = createPeerConnection(data.from);
    peerConnections.set(data.from, pc);
  }
  const pc = peerConnections.get(data.from);
  await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('signal-answer', { targetId: data.from, signal: answer });
}

function handleSignalAnswer(data) {
  const pc = peerConnections.get(data.from);
  if (pc) {
    pc.setRemoteDescription(new RTCSessionDescription(data.signal));
  }
}

function createPeerConnection(peerId) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  pc.onicecandidate = (event) => {
    if (!event.candidate && pc.localDescription) {
      socket.emit('signal', { targetId: peerId, signal: pc.localDescription });
    }
  };

  pc.ondatachannel = (event) => {
    const channel = event.channel;
    const label = channel.label;
    setupReceiverDataChannel(channel, peerId, label);
  };

  return pc;
}

async function ensurePeerConnection(peerId) {
  if (peerConnections.has(peerId)) {
    const pc = peerConnections.get(peerId);
    if (pc.connectionState !== 'failed' && pc.connectionState !== 'closed') {
      return pc;
    }
    peerConnections.delete(peerId);
  }

  const pc = createPeerConnection(peerId);
  peerConnections.set(peerId, pc);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return pc;
}

function getTotalChunks(fileSize) {
  return Math.ceil(fileSize / CHUNK_SIZE);
}

function encodeChunkBinary(chunkIndex, dataBase64) {
  const dataBuf = Buffer.from(dataBase64, 'base64');
  const header = Buffer.alloc(HEADER_SIZE);
  header.writeUInt32LE(chunkIndex, 0);
  return Buffer.concat([header, dataBuf]);
}

function decodeChunkBinary(arrayBuffer) {
  const buf = Buffer.from(arrayBuffer);
  const chunkIndex = buf.readUInt32LE(0);
  const data = buf.slice(HEADER_SIZE);
  return { chunkIndex, data };
}

function isBinaryMessage(data) {
  return data instanceof ArrayBuffer;
}

async function sendFileToNode(nodeId, filePath, existingTransferId) {
  const fileSize = await ipcRenderer.invoke('get-file-size', filePath);

  const transferKey = `send-${nodeId}-${Date.now()}-${++channelCounter}`;
  const channelLabel = `fileTransfer-${transferKey}`;

  const pc = await ensurePeerConnection(nodeId);

  const channel = pc.createDataChannel(channelLabel, {
    ordered: true
  });

  const state = {
    peerId: nodeId,
    filePath,
    fileName: path.basename(filePath),
    fileSize,
    channel,
    channelLabel,
    transferId: existingTransferId || null,
    ackResolver: null,
    startTime: null,
    isRetry: !!existingTransferId
  };

  activeSends.set(transferKey, state);
  setupSenderDataChannel(channel, transferKey);
  return transferKey;
}

function setupSenderDataChannel(channel, transferKey) {
  const state = activeSends.get(transferKey);
  if (!state) return;

  channel.binaryType = 'arraybuffer';

  channel.onopen = async () => {
    if (!activeSends.has(transferKey)) {
      channel.close();
      return;
    }

    let transferId = state.transferId;
    let completedChunks = [];

    if (state.isRetry && transferId) {
      completedChunks = await ipcRenderer.invoke('db-get-completed-chunks', transferId);
    }

    if (!transferId) {
      const node = nodes.find(n => n.id === state.peerId);
      transferId = await ipcRenderer.invoke('db-save-transfer', {
        type: 'sending',
        peerId: state.peerId,
        peerName: node?.name || '未知',
        fileName: state.fileName,
        fileSize: state.fileSize,
        filePath: state.filePath,
        status: 'pending'
      });
      state.transferId = transferId;
    }

    const totalChunks = getTotalChunks(state.fileSize);

    channel.send(JSON.stringify({
      type: 'file-info',
      name: state.fileName,
      size: state.fileSize,
      chunkSize: CHUNK_SIZE,
      totalChunks,
      transferId,
      channelLabel: state.channelLabel,
      completedChunks
    }));

    await loadTransfers();
  };

  channel.onmessage = async (event) => {
    if (!activeSends.has(transferKey)) return;
    if (isBinaryMessage(event.data)) return;

    try {
      const msg = JSON.parse(event.data);

      if (msg.type === 'accept') {
        state.startTime = Date.now();
        const completedChunksFromReceiver = msg.completedChunks || [];
        startSendingChunks(channel, transferKey, completedChunksFromReceiver);
        return;
      }

      if (msg.type === 'reject') {
        if (state.transferId) {
          await ipcRenderer.invoke('db-update-transfer', state.transferId, { status: 'failed' });
          await loadTransfers();
        }
        activeSends.delete(transferKey);
        channel.close();
        return;
      }

      if (msg.type === 'chunk-ack') {
        if (state.ackResolver) {
          state.ackResolver(msg.chunkIndex);
          state.ackResolver = null;
        }
        return;
      }
    } catch (e) {}
  };

  channel.onerror = async () => {
    if (state.transferId) {
      await ipcRenderer.invoke('db-update-transfer', state.transferId, { status: 'failed' });
      await loadTransfers();
    }
    activeSends.delete(transferKey);
  };

  channel.onclose = () => {
    activeSends.delete(transferKey);
  };
}

async function startSendingChunks(channel, transferKey, completedChunks) {
  const state = activeSends.get(transferKey);
  if (!state) return;

  const fileSize = state.fileSize;
  const totalChunks = getTotalChunks(fileSize);
  const completedSet = new Set(completedChunks);

  const startTime = Date.now();

  await ipcRenderer.invoke('db-update-transfer', state.transferId, { status: 'sending' });

  if (completedSet.size > 0) {
    const progress = Math.floor((completedSet.size / totalChunks) * 100);
    await ipcRenderer.invoke('db-update-transfer', state.transferId, { progress });
    await loadTransfers();
  }

  let bytesSentThisSession = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (!activeSends.has(transferKey)) break;

    if (completedSet.has(chunkIndex)) {
      continue;
    }

    const offset = chunkIndex * CHUNK_SIZE;
    const chunkSize = Math.min(CHUNK_SIZE, fileSize - offset);
    const chunkBase64 = await ipcRenderer.invoke('read-file-chunk', state.filePath, offset, chunkSize);

    const binaryPacket = encodeChunkBinary(chunkIndex, chunkBase64);
    channel.send(binaryPacket);

    const ackedIndex = await new Promise((resolve) => {
      state.ackResolver = resolve;
    });

    await ipcRenderer.invoke('db-save-chunk', state.transferId, ackedIndex);

    bytesSentThisSession += chunkSize;
    const totalDone = completedSet.size + (chunkIndex + 1 - completedSet.size);
    const actualPosition = Math.min((chunkIndex + 1) * CHUNK_SIZE, fileSize);
    const progress = Math.floor((actualPosition / fileSize) * 100);
    const elapsed = (Date.now() - startTime) / 1000;
    const speed = elapsed > 0 ? bytesSentThisSession / elapsed : 0;
    await ipcRenderer.invoke('db-update-transfer', state.transferId, {
      progress,
      speed: Math.floor(speed)
    });

    if (chunkIndex % 16 === 0 || chunkIndex === totalChunks - 1) {
      await loadTransfers();
    }
  }

  if (activeSends.has(transferKey)) {
    await ipcRenderer.invoke('db-update-transfer', state.transferId, { status: 'completed', progress: 100 });
    await ipcRenderer.invoke('show-notification', '发送完成', `文件 ${state.fileName} 已成功发送`);
    await loadTransfers();
    activeSends.delete(transferKey);
  }

  if (channel.readyState === 'open') {
    channel.close();
  }
}

function setupReceiverDataChannel(channel, peerId, channelLabel) {
  const receiveState = {
    channel,
    peerId,
    channelLabel,
    fileInfo: null,
    transferId: null,
    filePath: null,
    receivedSize: 0,
    startTime: null,
    accepted: false,
    completedChunkIndices: new Set()
  };

  activeReceives.set(channelLabel, receiveState);

  channel.binaryType = 'arraybuffer';

  channel.onmessage = async (event) => {
    if (!activeReceives.has(channelLabel)) return;

    if (isBinaryMessage(event.data)) {
      if (!receiveState.accepted || !receiveState.fileInfo || !receiveState.transferId) return;

      const { chunkIndex, data } = decodeChunkBinary(event.data);

      if (receiveState.completedChunkIndices.has(chunkIndex)) {
        channel.send(JSON.stringify({ type: 'chunk-ack', chunkIndex }));
        return;
      }

      const base64Data = data.toString('base64');
      const writeOffset = chunkIndex * receiveState.fileInfo.chunkSize;
      await ipcRenderer.invoke('write-file-chunk', receiveState.filePath, base64Data, writeOffset);

      receiveState.completedChunkIndices.add(chunkIndex);
      receiveState.receivedSize += data.byteLength;

      await ipcRenderer.invoke('db-save-chunk', receiveState.transferId, chunkIndex);

      channel.send(JSON.stringify({ type: 'chunk-ack', chunkIndex }));

      const progress = Math.floor((receiveState.completedChunkIndices.size / receiveState.fileInfo.totalChunks) * 100);
      const elapsed = (Date.now() - receiveState.startTime) / 1000;
      const speed = elapsed > 0 ? receiveState.receivedSize / elapsed : 0;
      await ipcRenderer.invoke('db-update-transfer', receiveState.transferId, {
        progress,
        speed: Math.floor(speed)
      });

      if (chunkIndex % 16 === 0 || receiveState.completedChunkIndices.size >= receiveState.fileInfo.totalChunks) {
        await loadTransfers();
      }

      if (receiveState.completedChunkIndices.size >= receiveState.fileInfo.totalChunks) {
        await ipcRenderer.invoke('db-update-transfer', receiveState.transferId, { status: 'completed', progress: 100 });
        await ipcRenderer.invoke('show-notification', '接收完成', `文件 ${receiveState.fileInfo.name} 已保存`);
        await loadTransfers();
        activeReceives.delete(channelLabel);
        channel.close();
      }

      return;
    }

    try {
      const msg = JSON.parse(event.data);

      if (msg.type === 'file-info') {
        receiveState.fileInfo = msg;
        pendingReceiveQueue.push({ channelLabel, peerId, fileInfo: msg });
        showNextReceiveModal();
        return;
      }
    } catch (e) {}
  };

  channel.onclose = () => {
    activeReceives.delete(channelLabel);
  };

  channel.onerror = async () => {
    if (receiveState.transferId) {
      await ipcRenderer.invoke('db-update-transfer', receiveState.transferId, { status: 'failed' });
      await loadTransfers();
    }
    activeReceives.delete(channelLabel);
  };
}

function showNextReceiveModal() {
  if (pendingReceiveQueue.length === 0) return;
  if (!elements.receiveModal.classList.contains('hidden')) return;

  const item = pendingReceiveQueue[0];
  const node = nodes.find(n => n.id === item.peerId);
  elements.receiveSender.textContent = node?.name || '未知节点';
  elements.receiveFilename.textContent = item.fileInfo.name;
  elements.receiveSize.textContent = formatSize(item.fileInfo.size);
  elements.receiveModal.classList.remove('hidden');
}

async function acceptReceive() {
  elements.receiveModal.classList.add('hidden');

  if (pendingReceiveQueue.length === 0) return;

  const item = pendingReceiveQueue.shift();
  const { channelLabel, fileInfo } = item;

  const receiveState = activeReceives.get(channelLabel);
  if (!receiveState) return;

  const savePath = await ipcRenderer.invoke('select-save-path', fileInfo.name);
  if (!savePath) {
    receiveState.channel.send(JSON.stringify({ type: 'reject' }));
    showNextReceiveModal();
    return;
  }

  const exists = await ipcRenderer.invoke('file-exists', savePath);
  if (!exists) {
    await ipcRenderer.invoke('create-file', savePath, fileInfo.size);
  }

  let resumeCompletedChunks = [];
  let resumeTransferId = null;

  const existingTransfers = await ipcRenderer.invoke('db-get-transfers');
  const matchingTransfer = existingTransfers.find(t =>
    t.type === 'receiving' &&
    t.file_name === fileInfo.name &&
    t.file_size === fileInfo.size &&
    (t.status === 'receiving' || t.status === 'failed')
  );

  if (matchingTransfer) {
    resumeTransferId = matchingTransfer.id;
    resumeCompletedChunks = await ipcRenderer.invoke('db-get-completed-chunks', resumeTransferId);
    receiveState.receivedSize = resumeCompletedChunks.length * fileInfo.chunkSize;
    receiveState.completedChunkIndices = new Set(resumeCompletedChunks);
  }

  const senderCompletedChunks = fileInfo.completedChunks || [];

  const mergedCompletedChunks = new Set([...senderCompletedChunks, ...resumeCompletedChunks]);

  const node = nodes.find(n => n.id === item.peerId);
  const transferId = resumeTransferId || await ipcRenderer.invoke('db-save-transfer', {
    type: 'receiving',
    peerId: item.peerId,
    peerName: node?.name || '未知',
    fileName: fileInfo.name,
    fileSize: fileInfo.size,
    filePath: savePath,
    status: 'receiving'
  });

  receiveState.transferId = transferId;
  receiveState.filePath = savePath;
  receiveState.startTime = Date.now();
  receiveState.accepted = true;

  receiveState.channel.send(JSON.stringify({
    type: 'accept',
    completedChunks: Array.from(mergedCompletedChunks)
  }));

  await loadTransfers();
  showNextReceiveModal();
}

function rejectReceive() {
  elements.receiveModal.classList.add('hidden');

  if (pendingReceiveQueue.length === 0) return;

  const item = pendingReceiveQueue.shift();
  const receiveState = activeReceives.get(item.channelLabel);
  if (receiveState && receiveState.channel) {
    receiveState.channel.send(JSON.stringify({ type: 'reject' }));
  }
  activeReceives.delete(item.channelLabel);

  showNextReceiveModal();
}

function renderNodes() {
  elements.nodeCount.textContent = nodes.length;
  elements.nodesList.innerHTML = '';

  if (nodes.length === 0) {
    elements.nodesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>暂无在线节点</p>
      </div>
    `;
    return;
  }

  nodes.forEach(node => {
    const div = document.createElement('div');
    div.className = `node-item ${selectedNodes.has(node.id) ? 'selected' : ''}`;
    div.innerHTML = `
      <div class="node-header">
        <span class="node-name">${node.name}</span>
        <span class="node-status ${node.online ? '' : 'offline'}"></span>
      </div>
      <div class="node-ip">${node.ip}</div>
    `;
    div.onclick = () => toggleNodeSelection(node.id);
    elements.nodesList.appendChild(div);
  });

  elements.sendBtn.disabled = selectedNodes.size === 0;
}

function toggleNodeSelection(nodeId) {
  if (selectedNodes.has(nodeId)) {
    selectedNodes.delete(nodeId);
  } else {
    selectedNodes.add(nodeId);
  }
  renderNodes();
}

function renderTransfers() {
  let filtered = transfers;
  if (currentFilter === 'sending') {
    filtered = transfers.filter(t => t.type === 'sending');
  } else if (currentFilter === 'receiving') {
    filtered = transfers.filter(t => t.type === 'receiving');
  }

  elements.transfersList.innerHTML = '';

  if (filtered.length === 0) {
    elements.transfersList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>暂无传输记录</p>
      </div>
    `;
    return;
  }

  filtered.forEach(t => {
    const div = document.createElement('div');
    div.className = 'transfer-item';

    const icon = t.type === 'sending' ? '📤' : '📥';
    const remaining = t.file_size > 0 && t.speed > 0
      ? formatTime((t.file_size - (t.progress / 100 * t.file_size)) / t.speed)
      : '--';

    const isResumable = t.status === 'failed' || t.status === 'pending';

    div.innerHTML = `
      <div class="transfer-header">
        <span class="transfer-name">${icon} ${t.file_name}</span>
        <span class="transfer-status status-${t.status}">${getStatusText(t.status)}</span>
      </div>
      <div class="transfer-info">
        ${t.type === 'sending' ? '发送至' : '接收自'}: ${t.peer_name} | ${formatSize(t.file_size)}
      </div>
      ${t.status === 'sending' || t.status === 'receiving' ? `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${t.progress}%"></div>
        </div>
        <div class="transfer-stats">
          <span>${t.progress}%</span>
          <span>${formatSpeed(t.speed)}</span>
          <span>剩余: ${remaining}</span>
        </div>
      ` : `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${t.progress}%"></div>
        </div>
      `}
      ${isResumable ? `
        <div class="transfer-actions">
          <button class="btn btn-primary btn-small" onclick="retryTransfer(${t.id})">重试/续传</button>
        </div>
      ` : ''}
    `;
    elements.transfersList.appendChild(div);
  });
}

async function loadTransfers() {
  transfers = await ipcRenderer.invoke('db-get-transfers');
  renderTransfers();
}

async function saveNodesToDB() {
  for (const node of nodes) {
    await ipcRenderer.invoke('db-save-node', node);
  }
}

function refreshNodes() {
  if (socket && socket.connected) {
    socket.emit('get-nodes');
  }
}

function setupEventListeners() {
  elements.refreshBtn.onclick = refreshNodes;

  elements.sendBtn.onclick = async () => {
    if (selectedNodes.size === 0) return;
    const files = await ipcRenderer.invoke('select-files');
    if (!files || files.length === 0) return;

    for (const file of files) {
      const fileSize = await ipcRenderer.invoke('get-file-size', file);
      if (fileSize > MAX_FILE_SIZE) {
        alert('文件大小不能超过500MB');
        continue;
      }
    }

    const promises = [];
    for (const file of files) {
      for (const nodeId of selectedNodes) {
        promises.push(sendFileToNode(nodeId, file));
      }
    }
    await Promise.all(promises);
  };

  elements.acceptBtn.onclick = acceptReceive;
  elements.rejectBtn.onclick = rejectReceive;

  elements.tabBtns.forEach(btn => {
    btn.onclick = () => {
      elements.tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.tab;
      renderTransfers();
    };
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function formatSpeed(bytesPerSec) {
  if (!bytesPerSec) return '0 KB/s';
  return formatSize(bytesPerSec) + '/s';
}

function formatTime(seconds) {
  if (!seconds || seconds === Infinity) return '--';
  if (seconds < 60) return Math.floor(seconds) + '秒';
  return Math.floor(seconds / 60) + '分' + Math.floor(seconds % 60) + '秒';
}

function getStatusText(status) {
  const map = {
    pending: '等待中',
    sending: '发送中',
    receiving: '接收中',
    completed: '已完成',
    failed: '失败'
  };
  return map[status] || status;
}

async function retryTransfer(transferId) {
  const transfer = await ipcRenderer.invoke('db-get-transfer', transferId);
  if (!transfer) return;

  if (transfer.type === 'sending') {
    const node = nodes.find(n => n.id === transfer.peer_id);
    if (node) {
      await ipcRenderer.invoke('db-update-transfer', transferId, { status: 'pending', speed: 0 });
      await sendFileToNode(transfer.peer_id, transfer.file_path, transferId);
    } else {
      alert('目标节点不在线');
    }
  } else if (transfer.type === 'receiving') {
    const fileExists = await ipcRenderer.invoke('file-exists', transfer.file_path);
    if (!fileExists) {
      await ipcRenderer.invoke('create-file', transfer.file_path, transfer.file_size);
      await ipcRenderer.invoke('db-clear-chunks', transferId);
    }
    await ipcRenderer.invoke('db-update-transfer', transferId, { status: 'pending', speed: 0 });
    await loadTransfers();
  }
}

window.retryTransfer = retryTransfer;

init();
