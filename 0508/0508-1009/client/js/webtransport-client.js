class WebTransportClient {
  constructor(serverUrl, options = {}) {
    this.serverUrl = serverUrl;
    this.transport = null;
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
    this.datagramQueue = [];
    this.isSendingDatagrams = false;
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
      console.log(`Connecting to ${this.serverUrl}...`);
      
      this.transport = new WebTransport(this.serverUrl);
      
      this.transport.closed.catch(error => {
        console.warn('WebTransport connection closed:', error);
        this.handleDisconnection();
      });
      
      this.transport.ready.then(() => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('WebTransport connected');
        
        if (this.connectionCallback) {
          this.connectionCallback(true);
        }
        
        this.receiveDatagrams();
        this.receiveStreams();
        
        if (this.resumeToken) {
          this.sendResume();
        }
      }).catch(error => {
        console.error('WebTransport connection failed:', error);
        this.handleDisconnection();
      });
      
    } catch (error) {
      console.error('WebTransport connection error:', error);
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
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnect attempts reached');
    }
  }

  async receiveDatagrams() {
    if (!this.transport?.datagrams?.readable) return;
    
    const reader = this.transport.datagrams.readable.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        this.handleDatagram(value);
      }
    } catch (error) {
      console.warn('Datagram reader error:', error);
    }
  }

  handleDatagram(data) {
    try {
      const message = JSON.parse(new TextDecoder().decode(data));
      
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
          console.debug(`Ping latency: ${latency}ms`);
          break;
      }
    } catch (e) {
      console.warn('Error parsing datagram:', e);
    }
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

  async receiveStreams() {
    if (!this.transport?.incomingUnidirectionalStreams) return;
    
    const reader = this.transport.incomingUnidirectionalStreams.getReader();
    
    try {
      while (true) {
        const { done, value: stream } = await reader.read();
        if (done) break;
        
        this.handleIncomingStream(stream);
      }
    } catch (error) {
      console.warn('Stream reader error:', error);
    }
  }

  async handleIncomingStream(stream) {
    const reader = stream.getReader();
    const chunks = [];
    let totalLength = 0;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        if (value) {
          chunks.push(value);
          totalLength += value.length;
        }
      }
      
      const data = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.length;
      }
      
      this.parseChunkData(data);
    } catch (error) {
      console.warn('Stream error:', error);
    }
  }

  parseChunkData(data) {
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
    this.sendDatagram({
      type: 'chunkAck',
      chunkId,
      bytes,
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
      
      this.sendDatagram({
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
      console.log(`Download complete! Total time: ${totalTime.toFixed(2)}s`);
    }
  }

  sendDatagram(message) {
    if (!this.isConnected || !this.transport?.datagrams?.writable) {
      this.datagramQueue.push(message);
      return;
    }
    
    this.processDatagramQueue();
    
    try {
      const data = new TextEncoder().encode(JSON.stringify(message));
      const writer = this.transport.datagrams.writable.getWriter();
      writer.write(data);
      writer.releaseLock();
    } catch (e) {
      console.debug('Datagram send error:', e.message);
      this.datagramQueue.push(message);
    }
  }

  async processDatagramQueue() {
    if (this.isSendingDatagrams || !this.transport?.datagrams?.writable) return;
    
    this.isSendingDatagrams = true;
    
    try {
      const writer = this.transport.datagrams.writable.getWriter();
      
      while (this.datagramQueue.length > 0) {
        const message = this.datagramQueue.shift();
        const data = new TextEncoder().encode(JSON.stringify(message));
        await writer.write(data);
      }
      
      writer.releaseLock();
    } catch (e) {
      console.debug('Datagram queue error:', e.message);
    } finally {
      this.isSendingDatagrams = false;
    }
  }

  updateCamera(position, target) {
    const now = Date.now();
    if (now - this.lastCameraUpdate < this.cameraUpdateInterval) return;
    
    this.lastCameraUpdate = now;
    this.sendDatagram({
      type: 'cameraUpdate',
      position: [position.x, position.y, position.z],
      target: [target.x, target.y, target.z]
    });
  }

  sendResume() {
    this.sendDatagram({
      type: 'resume',
      resumeToken: this.resumeToken,
      receivedChunks: Array.from(this.receivedChunks)
    });
  }

  ping() {
    this.sendDatagram({
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
    if (this.transport) {
      this.transport.close();
      this.transport = null;
    }
    this.isConnected = false;
  }
}

export default WebTransportClient;
