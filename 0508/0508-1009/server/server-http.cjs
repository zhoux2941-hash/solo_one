const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const zlib = require('zlib');

const CONFIG = {
  PORT: 8080,
  HOST: '0.0.0.0',
  MODEL_DIR: path.join(__dirname, '..', 'models', 'processed'),
  MAX_CONCURRENT_STREAMS: 100,
  BANDWIDTH_WINDOW: 1000,
  MIN_CHUNK_INTERVAL: 5,
  MAX_CHUNK_INTERVAL: 100,
  LOD_DISTANCE_THRESHOLDS: [5, 15, 30, 60],
  RESUME_TIMEOUT: 30000
};

class ModelStreamingServer {
  constructor() {
    this.app = express();
    this.sessions = new Map();
    this.metadata = null;
    this.chunks = new Map();
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
      
      const chunksDir = path.join(CONFIG.MODEL_DIR, 'chunks');
      if (fs.existsSync(chunksDir)) {
        const files = fs.readdirSync(chunksDir);
        for (const file of files) {
          if (file.endsWith('.bin')) {
            const chunkId = file.slice(0, -4);
            const chunkData = fs.readFileSync(path.join(chunksDir, file));
            this.chunks.set(chunkId, chunkData);
          }
        }
        console.log('Loaded ' + this.chunks.size + ' chunks into memory');
      }
    } else {
      console.warn('Model metadata not found. Run model processor first.');
    }
  }

  setupExpress() {
    this.app.use(express.static(path.join(__dirname, '..', 'client')));
    this.app.use(express.json({ limit: '1mb' }));
    
    this.app.get('/api/metadata', (req, res) => {
      res.json(this.metadata || { error: 'No model loaded' });
    });
    
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        sessions: this.sessions.size,
        modelLoaded: this.metadata != null 
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
      console.log('HTTP/WS server running on http://' + CONFIG.HOST + ':' + CONFIG.PORT);
      console.log('Open http://localhost:' + CONFIG.PORT + ' in browser');
    });
  }

  handleConnection(ws) {
    const sessionId = this.generateSessionId();
    console.log('New session: ' + sessionId);
    
    const sessionState = {
      id: sessionId,
      ws: ws,
      receivedChunks: new Set(),
      bandwidth: 10 * 1024 * 1024,
      bytesTransferred: 0,
      startTime: Date.now(),
      lastBandwidthCalc: Date.now(),
      bytesInWindow: 0,
      cameraPosition: [0, 0, 10],
      cameraTarget: [0, 0, 0],
      currentLOD: 3,
      resumeToken: null,
      isClosed: false,
      chunkQueue: [],
      isStreaming: false
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
      case 'resume':
        this.handleResume(sessionState, message);
        break;
      case 'ping':
        this.sendMessage(sessionState, { type: 'pong', timestamp: message.timestamp });
        break;
      case 'bandwidthReport':
        this.handleBandwidthReport(sessionState, message);
        break;
    }
  }

  handleCameraUpdate(sessionState, message) {
    sessionState.cameraPosition = message.position || sessionState.cameraPosition;
    sessionState.cameraTarget = message.target || sessionState.cameraTarget;
    
    const newLOD = this.calculateLOD(sessionState);
    if (newLOD !== sessionState.currentLOD) {
      sessionState.currentLOD = newLOD;
      console.log('Session ' + sessionState.id + ' LOD changed to ' + newLOD);
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
    sessionState.bytesInWindow += message.bytes;
    
    const now = Date.now();
    if (now - sessionState.lastBandwidthCalc >= CONFIG.BANDWIDTH_WINDOW) {
      const elapsed = (now - sessionState.lastBandwidthCalc) / 1000;
      sessionState.bandwidth = Math.max(
        1024 * 1024,
        Math.min(100 * 1024 * 1024, sessionState.bytesInWindow / elapsed)
      );
      sessionState.bytesInWindow = 0;
      sessionState.lastBandwidthCalc = now;
      
      console.log('Session ' + sessionState.id + ' bandwidth: ' + (sessionState.bandwidth / 1024 / 1024).toFixed(2) + ' MB/s');
    }
  }

  handleBandwidthReport(sessionState, message) {
    if (message.bandwidth) {
      sessionState.bandwidth = message.bandwidth;
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
      textures: this.metadata.textures.map(function(t) {
        return {
          id: t.id,
          lodLevel: t.lodLevel,
          mipmapCount: t.mipmapCount,
          tilesPerMip: t.tilesPerMip
        };
      }),
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
    
    const priorityChunks = this.getPriorityChunks(sessionState);
    this.sendChunksInOrder(sessionState, priorityChunks);
  }

  getPriorityChunks(sessionState) {
    if (!this.metadata) return [];
    
    const chunks = [];
    
    for (let lod = this.metadata.lodLevels - 1; lod >= 0; lod--) {
      const geometries = this.metadata.geometries.filter(function(g) { return g.lodLevel === lod; });
      
      for (const geometry of geometries) {
        for (const chunkId of geometry.vertexChunks) {
          if (!sessionState.receivedChunks.has(chunkId)) {
            chunks.push({ id: chunkId, priority: lod * 1000 });
          }
        }
        
        for (const chunkId of geometry.indexChunks) {
          if (!sessionState.receivedChunks.has(chunkId)) {
            chunks.push({ id: chunkId, priority: lod * 1000 + 500 });
          }
        }
      }
    }
    
    chunks.sort(function(a, b) { return a.priority - b.priority; });
    return chunks.map(function(c) { return c.id; });
  }

  async sendChunksInOrder(sessionState, chunkIds) {
    if (sessionState.isClosed || sessionState.ws.readyState !== WebSocket.OPEN) return;
    
    const batchSize = Math.max(1, Math.floor(sessionState.bandwidth / (64 * 1024) / 10));
    let index = 0;
    
    const sendBatch = function() {
      if (sessionState.isClosed || sessionState.ws.readyState !== WebSocket.OPEN) {
        sessionState.isStreaming = false;
        return;
      }
      
      if (index >= chunkIds.length) {
        sessionState.isStreaming = false;
        
        if (sessionState.receivedChunks.size < this.metadata.totalChunks) {
          const remaining = this.getPriorityChunks(sessionState);
          if (remaining.length > 0) {
            setTimeout(function() { this.sendChunksInOrder(sessionState, remaining); }.bind(this), 100);
          }
        } else {
          console.log('Session ' + sessionState.id + ' completed all chunks');
        }
        return;
      }
      
      const batch = chunkIds.slice(index, index + batchSize);
      index += batchSize;
      
      try {
        for (let i = 0; i < batch.length; i++) {
          const chunkId = batch[i];
          if (!this.chunks.has(chunkId) || sessionState.receivedChunks.has(chunkId)) continue;
          
          const chunkData = this.chunks.get(chunkId);
          const chunkInfo = this.metadata.chunks[chunkId];
          
          const idBuffer = Buffer.from(chunkId, 'utf-8');
          const idLength = Buffer.alloc(2);
          idLength.writeUInt16LE(idBuffer.length, 0);
          
          const header = Buffer.alloc(8);
          header.writeUInt32LE(chunkData.length, 0);
          header.writeUInt32LE((chunkInfo && chunkInfo.originalSize) || chunkData.length, 4);
          
          const packet = Buffer.concat([idLength, idBuffer, header, chunkData]);
          sessionState.ws.send(packet, { binary: true });
          
          sessionState.receivedChunks.add(chunkId);
          sessionState.bytesTransferred += chunkData.length;
          sessionState.bytesInWindow += chunkData.length;
        }
      } catch (e) {
        console.error('Error sending batch for session ' + sessionState.id + ':', e.message);
      }
      
      const now = Date.now();
      if (now - sessionState.lastBandwidthCalc >= CONFIG.BANDWIDTH_WINDOW) {
        const elapsed = (now - sessionState.lastBandwidthCalc) / 1000;
        sessionState.bandwidth = Math.max(
          1024 * 1024,
          Math.min(100 * 1024 * 1024, sessionState.bytesInWindow / elapsed)
        );
        sessionState.bytesInWindow = 0;
        sessionState.lastBandwidthCalc = now;
      }
      
      const interval = Math.max(
        CONFIG.MIN_CHUNK_INTERVAL,
        Math.min(CONFIG.MAX_CHUNK_INTERVAL, (batch.length * 64 * 1024 * 1000) / sessionState.bandwidth)
      );
      
      setTimeout(sendBatch.bind(this), interval);
    }.bind(this);
    
    sendBatch();
  }

  adjustStreaming(sessionState) {
    if (sessionState.isStreaming) {
      const remaining = this.getPriorityChunks(sessionState);
      if (remaining.length > 0) {
        this.sendChunksInOrder(sessionState, remaining);
      }
    }
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
  const server = new ModelStreamingServer();
  await server.start();
}

main().catch(console.error);
