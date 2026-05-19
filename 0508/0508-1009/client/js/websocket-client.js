class WebSocketClient {
  constructor(serverUrl, options = {}) {
    this.serverUrl = serverUrl;
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.resumeToken = null;
    this.receivedChunks = new Set();
    this.metadata = null;
    this.chunkCallbacks = new Map();
    this.metadataCallback = null;
    this.connectionCallback = null;
    this.messageQueue = [];
    this.isSendingMessages = false;
    this.lastCameraUpdate = 0;
    this.cameraUpdateInterval = 100;
    
    this.stats = {
      bytesReceived: 0,
      chunksReceived: 0,
      startTime: 0,
      firstFrameTime: 0,
      completeTime: 0,
      bandwidth: 0,
      lastBytes: 0,
      lastBandwidthCalc: 0
    };
  }

  async connect() {
    try {
      console.log('Connecting to ' + this.serverUrl + '...');
      
      this.ws = new WebSocket(this.serverUrl);
      this.ws.binaryType = 'arraybuffer';
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('WebSocket connected');
        
        if (this.connectionCallback) {
          this.connectionCallback(true);
        }
        
        this.processMessageQueue();
        
        if (this.resumeToken) {
          this.sendResume();
        }
      };
      
      this.ws.onclose = (event) => {
        console.warn('WebSocket connection closed:', event.code, event.reason);
        this.handleDisconnection();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          this.handleBinaryMessage(new Uint8Array(event.data));
        } else {
          this.handleTextMessage(event.data);
        }
      };
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleDisconnection();
    }
  }

  async handleDisconnection() {
    this.isConnected = false;
    
    if (this.connectionCallback) {
      this.connectionCallback(false);
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);
      console.log('Reconnecting in ' + delay + 'ms (attempt ' + this.reconnectAttempts + ')...');
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnect attempts reached');
    }
  }

  handleTextMessage(data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'metadata':
          this.handleMetadata(message);
          break;
        case 'resumeReady':
          this.resumeToken = message.resumeToken;
          if (message.receivedChunks) {
            this.receivedChunks = new Set(message.receivedChunks);
          }
          break;
        case 'pong':
          const latency = Date.now() - message.timestamp;
          console.debug('Ping latency: ' + latency + 'ms');
          break;
      }
    } catch (e) {
      console.warn('Error parsing message:', e);
    }
  }

  handleBinaryMessage(data) {
    let offset = 0;
    
    while (offset < data.length) {
      const idLength = new DataView(data.buffer, data.byteOffset + offset, 2).getUint16(0, true);
      offset += 2;
      
      const chunkId = new TextDecoder().decode(data.subarray(offset, offset + idLength));
      offset += idLength;
      
      const header = new DataView(data.buffer, data.byteOffset + offset, 8);
      const compressedLength = header.getUint32(0, true);
      const originalLength = header.getUint32(4, true);
      offset += 8;
      
      const chunkData = data.subarray(offset, offset + compressedLength);
      offset += compressedLength;
      
      if (!this.receivedChunks.has(chunkId)) {
        this.receivedChunks.add(chunkId);
        this.stats.chunksReceived++;
        this.stats.bytesReceived += compressedLength;
        
        this.decompressAndProcessChunk(chunkId, chunkData, originalLength);
        this.sendChunkAck(chunkId, compressedLength);
      }
    }
    
    this.updateBandwidthEstimate();
    this.checkCompletion();
  }

  handleMetadata(metadata) {
    console.log('Received metadata:', metadata.modelId);
    this.metadata = metadata;
    this.resumeToken = metadata.resumeToken;
    this.stats.startTime = performance.now();
    
    if (this.metadataCallback) {
      this.metadataCallback(metadata);
    }
  }

  async decompressAndProcessChunk(chunkId, compressedData, originalLength) {
    try {
      const decompressed = await this.decompressGzip(compressedData);
      
      const callback = this.chunkCallbacks.get(chunkId);
      if (callback) {
        callback(chunkId, decompressed);
      }
      
      for (const [pattern, cb] of this.chunkCallbacks) {
        if (chunkId.startsWith(pattern) && pattern !== chunkId) {
          cb(chunkId, decompressed);
        }
      }
    } catch (e) {
      console.warn('Decompression error for chunk', chunkId, e);
    }
  }

  async decompressGzip(data) {
    try {
      const ds = new DecompressionStream('gzip');
      const reader = new Blob([data]).stream().pipeThrough(ds).getReader();
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      let total = 0;
      for (const c of chunks) total += c.length;
      const result = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) {
        result.set(c, offset);
        offset += c.length;
      }
      
      return result;
    } catch (e) {
      return data;
    }
  }

  sendChunkAck(chunkId, bytes) {
    this.sendMessage({
      type: 'chunkAck',
      chunkId: chunkId,
      bytes: bytes,
      timestamp: Date.now()
    });
  }

  updateBandwidthEstimate() {
    const now = performance.now();
    if (now - this.stats.lastBandwidthCalc >= 1000) {
      const elapsed = (now - this.stats.lastBandwidthCalc) / 1000;
      const bytesDelta = this.stats.bytesReceived - this.stats.lastBytes;
      this.stats.bandwidth = bytesDelta / elapsed;
      this.stats.lastBytes = this.stats.bytesReceived;
      this.stats.lastBandwidthCalc = now;
      
      this.sendMessage({
        type: 'bandwidthReport',
        bandwidth: this.stats.bandwidth
      });
    }
  }

  checkCompletion() {
    if (!this.metadata) return;
    
    const progress = this.receivedChunks.size / this.metadata.totalChunks;
    
    if (this.receivedChunks.size >= this.metadata.totalChunks && !this.stats.completeTime) {
      this.stats.completeTime = performance.now();
      const totalTime = (this.stats.completeTime - this.stats.startTime) / 1000;
      console.log('Download complete! Total time: ' + totalTime.toFixed(2) + 's');
    }
  }

  sendMessage(message) {
    if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message);
      return;
    }
    
    this.processMessageQueue();
    
    try {
      this.ws.send(JSON.stringify(message));
    } catch (e) {
      console.debug('Message send error:', e.message);
      this.messageQueue.push(message);
    }
  }

  async processMessageQueue() {
    if (this.isSendingMessages || !this.isConnected || this.ws?.readyState !== WebSocket.OPEN) return;
    
    this.isSendingMessages = true;
    
    try {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.ws.send(JSON.stringify(message));
      }
    } catch (e) {
      console.debug('Message queue error:', e.message);
    } finally {
      this.isSendingMessages = false;
    }
  }

  updateCamera(position, target) {
    const now = Date.now();
    if (now - this.lastCameraUpdate < this.cameraUpdateInterval) return;
    
    this.lastCameraUpdate = now;
    this.sendMessage({
      type: 'cameraUpdate',
      position: [position.x, position.y, position.z],
      target: [target.x, target.y, target.z]
    });
  }

  sendResume() {
    this.sendMessage({
      type: 'resume',
      resumeToken: this.resumeToken,
      receivedChunks: Array.from(this.receivedChunks)
    });
  }

  ping() {
    this.sendMessage({
      type: 'ping',
      timestamp: Date.now()
    });
  }

  onChunk(pattern, callback) {
    this.chunkCallbacks.set(pattern, callback);
  }

  onMetadata(callback) {
    this.metadataCallback = callback;
  }

  onConnection(callback) {
    this.connectionCallback = callback;
  }

  getProgress() {
    if (!this.metadata) return 0;
    return this.receivedChunks.size / this.metadata.totalChunks;
  }

  getStats() {
    return {
      ...this.stats,
      progress: this.getProgress(),
      chunksReceived: this.receivedChunks.size,
      totalChunks: this.metadata?.totalChunks || 0
    };
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export default WebSocketClient;
