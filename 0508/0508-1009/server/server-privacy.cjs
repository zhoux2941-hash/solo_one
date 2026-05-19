const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const CONFIG = {
  PORT: 8081,
  HOST: '0.0.0.0',
  MODEL_DIR: path.join(__dirname, '..', 'models', 'processed-privacy'),
  BANDWIDTH_WINDOW: 1000,
  MIN_CHUNK_INTERVAL: 10,
  MAX_CHUNK_INTERVAL: 200,
  LOD_DISTANCE_THRESHOLDS: [5, 15, 30, 60],
  RESUME_TIMEOUT: 30000,
  MAX_BUFFER_BYTES: 256 * 1024,
  BANDWIDTH_SMOOTHING: 0.3,
  LOW_BANDWIDTH_THRESHOLD: 2 * 1024 * 1024,
  CRITICAL_BANDWIDTH_THRESHOLD: 512 * 1024
};

class PrivacyStreamingServer {
  constructor() {
    this.app = express();
    this.sessions = new Map();
    this.metadata = null;
    this.chunks = new Map();
    this.chunkMetadata = new Map();
    this.loadModelData();
    this.setupExpress();
  }

  loadModelData() {
    const metadataPath = path.join(CONFIG.MODEL_DIR, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      this.metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      console.log('Loaded model metadata: ' + this.metadata.modelId);
      console.log('Total chunks: ' + this.metadata.totalChunks);
      console.log('Total size: ' + (this.metadata.totalSize / 1024 / 1024).toFixed(2) + ' MB');
      
      if (this.metadata.privacy) {
        console.log('Privacy protection: ' + (this.metadata.privacy.enabled ? 'ENABLED' : 'DISABLED'));
        console.log('Faces detected: ' + (this.metadata.privacy.facesDetected || 0));
        console.log('Blur intensity: ' + (this.metadata.privacy.blurIntensity || 0));
      }
      
      const chunksDir = path.join(CONFIG.MODEL_DIR, 'chunks');
      if (fs.existsSync(chunksDir)) {
        const files = fs.readdirSync(chunksDir);
        for (const file of files) {
          if (file.endsWith('.bin')) {
            const chunkId = file.slice(0, -4);
            const chunkData = fs.readFileSync(path.join(chunksDir, file));
            this.chunks.set(chunkId, chunkData);
            
            const meta = this.metadata.chunks[chunkId];
            if (meta) {
              this.chunkMetadata.set(chunkId, meta);
            }
          }
        }
        console.log('Loaded ' + this.chunks.size + ' chunks into memory');
      }
    } else {
      console.warn('Model metadata not found. Run privacy model processor first.');
    }
  }

  setupExpress() {
    this.app.use(express.static(path.join(__dirname, '..', 'client')));
    this.app.use(express.json({ limit: '1mb' }));
    
    this.app.get('/api/metadata', (req, res) => {
      res.json(this.metadata || { error: 'No model loaded' });
    });
    
    var self = this;
    this.app.get('/api/privacy-info', function(req, res) {
      var enabled = false;
      var facesDetected = 0;
      var blurIntensity = 0;
      if (self.metadata && self.metadata.privacy) {
        enabled = self.metadata.privacy.enabled || false;
        facesDetected = self.metadata.privacy.facesDetected || 0;
        blurIntensity = self.metadata.privacy.blurIntensity || 0;
      }
      res.json({
        enabled: enabled,
        facesDetected: facesDetected,
        blurIntensity: blurIntensity
      });
    });
    
    this.app.get('/api/health', function(req, res) {
      var privacy = { enabled: false };
      if (self.metadata && self.metadata.privacy) {
        privacy = self.metadata.privacy;
      }
      res.json({ 
        status: 'ok', 
        sessions: self.sessions.size,
        modelLoaded: self.metadata != null,
        privacy: privacy
      });
    });
  }

  async start() {
    const httpServer = http.createServer(this.app);
    const wss = new WebSocket.Server({ server: httpServer });
    
    wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });
    
    httpServer.listen(CONFIG.PORT, CONFIG.HOST, () => {
      console.log('Privacy Streaming Server running on http://' + CONFIG.HOST + ':' + CONFIG.PORT);
      console.log('Demo: http://localhost:' + CONFIG.PORT + '/index-privacy.html');
    });
  }

  handleConnection(ws) {
    const sessionId = this.generateSessionId();
    console.log('New session: ' + sessionId);
    
    const sessionState = {
      id: sessionId,
      ws: ws,
      receivedChunks: new Set(),
      requestedChunks: new Set(),
      bandwidth: 10 * 1024 * 1024,
      smoothedBandwidth: 10 * 1024 * 1024,
      bytesTransferred: 0,
      startTime: Date.now(),
      lastBandwidthCalc: Date.now(),
      bytesInWindow: 0,
      cameraPosition: [0, 0, 10],
      cameraTarget: [0, 0, 0],
      currentLOD: 3,
      targetLOD: 3,
      resumeToken: null,
      isClosed: false,
      isStreaming: false,
      isSending: false,
      lastSendTime: 0,
      bytesInFlight: 0,
      rtt: 50,
      rttSamples: []
    };
    
    this.sessions.set(sessionId, sessionState);
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(sessionState, message);
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });
    
    ws.on('close', () => {
      console.log('Session closed: ' + sessionId);
      this.cleanupSession(sessionId);
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      this.cleanupSession(sessionId);
    });
    
    this.sendInitialMetadata(sessionState);
  }

  handleMessage(sessionState, message) {
    switch (message.type) {
      case 'cameraUpdate':
        this.handleCameraUpdate(sessionState, message);
        break;
      case 'chunkAck':
        this.handleChunkAck(sessionState, message);
        break;
      case 'chunkNack':
        this.handleChunkNack(sessionState, message);
        break;
      case 'resume':
        this.handleResume(sessionState, message);
        break;
      case 'ping':
        const now = Date.now();
        if (message.timestamp) {
          const rtt = now - message.timestamp;
          this.updateRTT(sessionState, rtt);
        }
        this.sendMessage(sessionState, { type: 'pong', timestamp: message.timestamp });
        break;
      case 'bandwidthReport':
        this.handleBandwidthReport(sessionState, message);
        break;
      case 'bufferStatus':
        this.handleBufferStatus(sessionState, message);
        break;
    }
  }

  handleCameraUpdate(sessionState, message) {
    sessionState.cameraPosition = message.position || sessionState.cameraPosition;
    sessionState.cameraTarget = message.target || sessionState.cameraTarget;
    
    const newLOD = this.calculateLOD(sessionState);
    if (newLOD !== sessionState.targetLOD) {
      sessionState.targetLOD = newLOD;
      console.log('Session ' + sessionState.id + ' target LOD changed to ' + newLOD);
      
      this.adjustStreaming(sessionState);
    }
  }

  calculateLOD(sessionState) {
    if (!this.metadata || !this.metadata.bounds) return 3;
    
    const [cx, cy, cz] = sessionState.cameraPosition;
    const [tx, ty, tz] = this.metadata.bounds.center;
    const distance = Math.sqrt(
      Math.pow(cx - tx, 2) + Math.pow(cy - ty, 2) + Math.pow(cz - tz, 2)
    );
    
    for (let i = 0; i < CONFIG.LOD_DISTANCE_THRESHOLDS.length; i++) {
      if (distance < CONFIG.LOD_DISTANCE_THRESHOLDS[i]) {
        return i;
      }
    }
    
    return CONFIG.LOD_DISTANCE_THRESHOLDS.length - 1;
  }

  handleChunkAck(sessionState, message) {
    sessionState.receivedChunks.add(message.chunkId);
    sessionState.requestedChunks.delete(message.chunkId);
    
    if (message.bytes) {
      sessionState.bytesInWindow += message.bytes;
    }
    
    if (message.rtt) {
      this.updateRTT(sessionState, message.rtt);
    }
    
    this.updateBandwidthEstimate(sessionState);
    this.processSendQueue(sessionState);
  }

  handleChunkNack(sessionState, message) {
    sessionState.requestedChunks.delete(message.chunkId);
    this.processSendQueue(sessionState);
  }

  handleBandwidthReport(sessionState, message) {
    if (message.bandwidth) {
      sessionState.smoothedBandwidth = CONFIG.BANDWIDTH_SMOOTHING * message.bandwidth + 
        (1 - CONFIG.BANDWIDTH_SMOOTHING) * sessionState.smoothedBandwidth;
    }
  }

  handleBufferStatus(sessionState, message) {
    if (message.bufferLevel != null) {
      if (message.bufferLevel > 0.8) {
        sessionState.bandwidth = Math.max(CONFIG.CRITICAL_BANDWIDTH_THRESHOLD, sessionState.bandwidth * 0.7);
      } else if (message.bufferLevel < 0.2) {
        sessionState.bandwidth = Math.min(100 * 1024 * 1024, sessionState.bandwidth * 1.1);
      }
    }
  }

  updateRTT(sessionState, rtt) {
    sessionState.rttSamples.push(rtt);
    if (sessionState.rttSamples.length > 20) {
      sessionState.rttSamples.shift();
    }
    
    const sorted = [...sessionState.rttSamples].sort(function(a, b) { return a - b; });
    const mid = Math.floor(sorted.length / 2);
    sessionState.rtt = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  updateBandwidthEstimate(sessionState) {
    const now = Date.now();
    if (now - sessionState.lastBandwidthCalc >= CONFIG.BANDWIDTH_WINDOW) {
      const elapsed = (now - sessionState.lastBandwidthCalc) / 1000;
      const measuredBandwidth = sessionState.bytesInWindow / elapsed;
      
      sessionState.smoothedBandwidth = CONFIG.BANDWIDTH_SMOOTHING * measuredBandwidth + 
        (1 - CONFIG.BANDWIDTH_SMOOTHING) * sessionState.smoothedBandwidth;
      
      sessionState.bandwidth = sessionState.smoothedBandwidth;
      sessionState.bytesInWindow = 0;
      sessionState.lastBandwidthCalc = now;
      
      console.log('Session ' + sessionState.id + ' bandwidth: ' + 
        (sessionState.bandwidth / 1024 / 1024).toFixed(2) + ' MB/s, RTT: ' + 
        sessionState.rtt.toFixed(0) + 'ms');
    }
  }

  handleResume(sessionState, message) {
    if (message.resumeToken && this.sessions.has(message.resumeToken)) {
      const previousSession = this.sessions.get(message.resumeToken);
      sessionState.receivedChunks = new Set(previousSession.receivedChunks);
      console.log('Resumed session ' + message.resumeToken + ' -> ' + sessionState.id);
      console.log('Recovered ' + sessionState.receivedChunks.size + ' chunks');
    }
    
    sessionState.resumeToken = this.generateSessionId();
    
    this.sendMessage(sessionState, {
      type: 'resumeReady',
      resumeToken: sessionState.resumeToken,
      receivedChunks: Array.from(sessionState.receivedChunks)
    });
    
    this.startStreaming(sessionState);
  }

  sendInitialMetadata(sessionState) {
    if (!this.metadata) return;
    
    const metadataLite = {
      type: 'metadata',
      modelId: this.metadata.modelId,
      bounds: this.metadata.bounds,
      lodLevels: this.metadata.lodLevels,
      totalChunks: this.metadata.totalChunks,
      geometries: this.metadata.geometries.map(function(g) {
        return {
          id: g.id,
          lodLevel: g.lodLevel,
          vertexChunks: g.vertexChunks,
          indexChunks: g.indexChunks,
          vertexCount: g.vertexCount,
          indexCount: g.indexCount
        };
      }),
      textures: (this.metadata.textures || []).map(function(t) {
        return {
          id: t.id,
          lodLevel: t.lodLevel,
          mipmapCount: t.mipmapCount,
          tilesPerMip: t.tilesPerMip
        };
      }),
      privacy: this.metadata.privacy,
      resumeToken: sessionState.resumeToken || this.generateSessionId()
    };
    
    sessionState.resumeToken = metadataLite.resumeToken;
    this.sendMessage(sessionState, metadataLite);
    
    setTimeout(function() {
      if (!sessionState.isClosed) {
        this.startStreaming(sessionState);
      }
    }.bind(this), 100);
  }

  startStreaming(sessionState) {
    if (sessionState.isStreaming) return;
    sessionState.isStreaming = true;
    
    console.log('Starting stream for session ' + sessionState.id);
    this.processSendQueue(sessionState);
  }

  getPriorityChunks(sessionState) {
    if (!this.metadata) return [];
    
    const chunks = [];
    const targetLOD = sessionState.targetLOD;
    const currentLOD = sessionState.currentLOD;
    
    const isLowBandwidth = sessionState.bandwidth < CONFIG.LOW_BANDWIDTH_THRESHOLD;
    const isCriticalBandwidth = sessionState.bandwidth < CONFIG.CRITICAL_BANDWIDTH_THRESHOLD;
    
    let maxLOD = this.metadata.lodLevels - 1;
    if (isCriticalBandwidth) {
      maxLOD = Math.min(maxLOD, Math.max(currentLOD, 3));
    } else if (isLowBandwidth) {
      maxLOD = Math.min(maxLOD, Math.max(currentLOD, Math.max(0, targetLOD + 1)));
    }
    
    for (let lod = this.metadata.lodLevels - 1; lod >= 0; lod--) {
      if (lod > maxLOD) continue;
      
      const isTargetLOD = lod === targetLOD;
      const isCurrentLOD = lod === currentLOD;
      const isHigherThanCurrent = lod < currentLOD;
      
      const basePriority = lod * 1000;
      const targetBonus = isTargetLOD ? -500 : 0;
      const currentBonus = isCurrentLOD ? -200 : 0;
      const higherBonus = isHigherThanCurrent ? -100 : 0;
      const finalPriority = basePriority + targetBonus + currentBonus + higherBonus;
      
      const geometries = this.metadata.geometries.filter(function(g) { return g.lodLevel === lod; });
      
      for (const geometry of geometries) {
        for (const chunkId of geometry.vertexChunks) {
          if (!sessionState.receivedChunks.has(chunkId) && !sessionState.requestedChunks.has(chunkId)) {
            chunks.push({ id: chunkId, priority: finalPriority });
          }
        }
        
        for (const chunkId of geometry.indexChunks) {
          if (!sessionState.receivedChunks.has(chunkId) && !sessionState.requestedChunks.has(chunkId)) {
            chunks.push({ id: chunkId, priority: finalPriority + 500 });
          }
        }
      }
      
      if (lod <= targetLOD && lod <= 1) {
        const textures = (this.metadata.textures || []).filter(function(t) { return t.lodLevel === lod; });
        for (const texture of textures) {
          const textureChunks = Object.keys(this.metadata.chunks).filter(function(c) { 
            return c.indexOf(texture.id) === 0; 
          });
          for (const chunkId of textureChunks) {
            if (!sessionState.receivedChunks.has(chunkId) && !sessionState.requestedChunks.has(chunkId)) {
              chunks.push({ id: chunkId, priority: finalPriority + 800 });
            }
          }
        }
      }
    }
    
    chunks.sort(function(a, b) { return a.priority - b.priority; });
    return chunks.map(function(c) { return c.id; });
  }

  processSendQueue(sessionState) {
    if (sessionState.isClosed || sessionState.ws.readyState !== WebSocket.OPEN) {
      sessionState.isStreaming = false;
      return;
    }
    
    if (sessionState.isSending) return;
    
    const priorityChunks = this.getPriorityChunks(sessionState);
    if (priorityChunks.length === 0) {
      sessionState.isStreaming = false;
      
      if (sessionState.receivedChunks.size < this.metadata.totalChunks) {
        setTimeout(function() {
          if (!sessionState.isClosed) {
            this.processSendQueue(sessionState);
          }
        }.bind(this), 500);
      } else {
        console.log('Session ' + sessionState.id + ' completed all chunks');
      }
      return;
    }
    
    const rtt = Math.max(20, sessionState.rtt);
    const bandwidth = Math.max(CONFIG.CRITICAL_BANDWIDTH_THRESHOLD, sessionState.bandwidth);
    const bytesPerRTT = (bandwidth * rtt) / 1000;
    const maxBytesInFlight = Math.min(CONFIG.MAX_BUFFER_BYTES, Math.max(64 * 1024, bytesPerRTT));
    
    if (sessionState.bytesInFlight >= maxBytesInFlight) {
      const retryDelay = Math.max(20, rtt / 2);
      setTimeout(function() {
        if (!sessionState.isClosed) {
          this.processSendQueue(sessionState);
        }
      }.bind(this), retryDelay);
      return;
    }
    
    sessionState.isSending = true;
    
    let bytesToSend = 0;
    const chunksToSend = [];
    
    for (const chunkId of priorityChunks) {
      const chunkData = this.chunks.get(chunkId);
      if (!chunkData) continue;
      
      const estimatedSize = chunkData.length + 64;
      
      if (bytesToSend + estimatedSize > maxBytesInFlight && chunksToSend.length > 0) {
        break;
      }
      
      chunksToSend.push(chunkId);
      bytesToSend += estimatedSize;
    }
    
    if (chunksToSend.length === 0) {
      sessionState.isSending = false;
      return;
    }
    
    let sentCount = 0;
    
    const sendNext = function() {
      if (sentCount >= chunksToSend.length) {
        sessionState.isSending = false;
        
        const interval = Math.max(
          CONFIG.MIN_CHUNK_INTERVAL,
          Math.min(CONFIG.MAX_CHUNK_INTERVAL, (bytesToSend * 1000) / bandwidth)
        );
        
        setTimeout(function() {
          if (!sessionState.isClosed) {
            this.processSendQueue(sessionState);
          }
        }.bind(this), interval);
        return;
      }
      
      const chunkId = chunksToSend[sentCount];
      const chunkData = this.chunks.get(chunkId);
      const chunkInfo = this.chunkMetadata.get(chunkId);
      
      if (!chunkData || sessionState.receivedChunks.has(chunkId)) {
        sentCount++;
        setImmediate(sendNext.bind(this));
        return;
      }
      
      try {
        const idBuffer = Buffer.from(chunkId, 'utf-8');
        const idLength = Buffer.alloc(2);
        idLength.writeUInt16LE(idBuffer.length, 0);
        
        const header = Buffer.alloc(8);
        header.writeUInt32LE(chunkData.length, 0);
        header.writeUInt32LE((chunkInfo && chunkInfo.originalSize) || chunkData.length, 4);
        
        const sendTime = Date.now();
        const sendTimeBuffer = Buffer.alloc(8);
        sendTimeBuffer.writeDoubleLE(sendTime, 0);
        
        const packet = Buffer.concat([idLength, idBuffer, header, sendTimeBuffer, chunkData]);
        
        sessionState.ws.send(packet, { binary: true }, function(err) {
          if (!err) {
            sessionState.requestedChunks.add(chunkId);
            sessionState.bytesInFlight += chunkData.length;
            sessionState.bytesTransferred += chunkData.length;
            sessionState.bytesInWindow += chunkData.length;
          }
          
          sentCount++;
          setImmediate(sendNext.bind(this));
        }.bind(this));
        
      } catch (e) {
        console.error('Error sending chunk ' + chunkId + ':', e.message);
        sentCount++;
        setImmediate(sendNext.bind(this));
      }
    }.bind(this);
    
    sendNext();
  }

  adjustStreaming(sessionState) {
    sessionState.currentLOD = sessionState.targetLOD;
    this.processSendQueue(sessionState);
  }

  sendMessage(sessionState, message) {
    try {
      if (sessionState.ws.readyState === WebSocket.OPEN) {
        sessionState.ws.send(JSON.stringify(message));
      }
    } catch (e) {
      console.debug('Message send error:', e.message);
    }
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2, 15);
  }

  cleanupSession(sessionId) {
    const sessionState = this.sessions.get(sessionId);
    if (sessionState) {
      sessionState.isClosed = true;
      sessionState.isStreaming = false;
      
      setTimeout(function() {
        this.sessions.delete(sessionId);
        console.log('Session ' + sessionId + ' cleaned up');
      }.bind(this), CONFIG.RESUME_TIMEOUT);
    }
  }
}

async function main() {
  const server = new PrivacyStreamingServer();
  await server.start();
}

main().catch(console.error);
