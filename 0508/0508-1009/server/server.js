import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from '@fails-components/webtransport';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  PORT: 4433,
  HOST: '0.0.0.0',
  MODEL_DIR: path.join(__dirname, '..', 'models', 'processed'),
  CERT_DIR: path.join(__dirname, '..', 'certificates'),
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
      console.log(`Loaded model metadata: ${this.metadata.modelId}`);
      console.log(`Total chunks: ${this.metadata.totalChunks}`);
      console.log(`Total size: ${(this.metadata.totalSize / 1024 / 1024).toFixed(2)} MB`);
      
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
        console.log(`Loaded ${this.chunks.size} chunks into memory`);
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
    const certPath = path.join(CONFIG.CERT_DIR, 'cert.pem');
    const keyPath = path.join(CONFIG.CERT_DIR, 'key.pem');
    
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.log('Generating self-signed certificates...');
      await this.generateCertificates();
    }
    
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    
    const httpsServer = https.createServer({ cert, key }, this.app);
    
    const wtServer = createServer({
      port: CONFIG.PORT,
      host: CONFIG.HOST,
      cert,
      key,
      allowPooling: true,
      streamErrorCode: 0x00,
      sessionTimeout: 60000
    });
    
    wtServer.ready.catch(err => {
      console.error('WebTransport server error:', err);
    });
    
    wtServer.addEventListener('session', (event) => {
      this.handleSession(event.session);
    });
    
    httpsServer.listen(CONFIG.PORT + 1, CONFIG.HOST, () => {
      console.log(`HTTPS server running on https://${CONFIG.HOST}:${CONFIG.PORT + 1}`);
    });
    
    console.log(`WebTransport server running on quic://${CONFIG.HOST}:${CONFIG.PORT}`);
    console.log(`Open https://localhost:${CONFIG.PORT + 1} in browser`);
  }

  async generateCertificates() {
    const { execSync } = await import('child_process');
    
    if (!fs.existsSync(CONFIG.CERT_DIR)) {
      fs.mkdirSync(CONFIG.CERT_DIR, { recursive: true });
    }
    
    const certPath = path.join(CONFIG.CERT_DIR, 'cert.pem');
    const keyPath = path.join(CONFIG.CERT_DIR, 'key.pem');
    
    try {
      execSync(
        `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" ` +
        `-days 365 -nodes -subj "/CN=localhost" ` +
        `-addext "subjectAltName=DNS:localhost,IP:127.0.0.1"`,
        { stdio: 'pipe' }
      );
      console.log('Certificates generated successfully');
    } catch (e) {
      console.log('OpenSSL not available, generating simple certificates...');
      const crypto = await import('crypto');
      const { generateKeyPairSync } = crypto;
      
      const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      
      fs.writeFileSync(keyPath, privateKey);
      fs.writeFileSync(certPath, publicKey);
    }
  }

  handleSession(session) {
    const sessionId = this.generateSessionId();
    console.log(`New session: ${sessionId}`);
    
    const sessionState = {
      id: sessionId,
      session,
      streams: new Map(),
      receivedChunks: new Set(),
      lastChunkId: null,
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
    
    session.closed.catch(err => {
      console.log(`Session closed ${sessionId}:`, err);
      this.cleanupSession(sessionId);
    }).then(() => {
      console.log(`Session closed ${sessionId}`);
      this.cleanupSession(sessionId);
    });
    
    session.addEventListener('datagram', (event) => {
      this.handleDatagram(sessionState, event.data);
    });
    
    session.addEventListener('stream', (event) => {
      this.handleStream(sessionState, event.stream);
    });
    
    this.sendInitialMetadata(sessionState);
  }

  handleDatagram(sessionState, data) {
    try {
      const message = JSON.parse(new TextDecoder().decode(data));
      
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
          this.sendDatagram(sessionState, { type: 'pong', timestamp: message.timestamp });
          break;
        case 'bandwidthReport':
          this.handleBandwidthReport(sessionState, message);
          break;
      }
    } catch (e) {
      console.error('Error parsing datagram:', e);
    }
  }

  handleStream(sessionState, stream) {
    const reader = stream.getReader();
    const chunks = [];
    
    reader.read().then(function processChunk({ done, value }) {
      if (done) {
        try {
          const data = Buffer.concat(chunks);
          const message = JSON.parse(data.toString());
          
          if (message.type === 'requestChunks') {
            this.handleChunkRequest(sessionState, message.chunkIds, stream);
          } else if (message.type === 'resume') {
            this.handleResumeStream(sessionState, message, stream);
          }
        } catch (e) {
          console.error('Error parsing stream data:', e);
        }
        return;
      }
      
      chunks.push(Buffer.from(value));
      return reader.read().then(processChunk.bind(this));
    }.bind(this));
  }

  handleCameraUpdate(sessionState, message) {
    sessionState.cameraPosition = message.position || sessionState.cameraPosition;
    sessionState.cameraTarget = message.target || sessionState.cameraTarget;
    
    const newLOD = this.calculateLOD(sessionState);
    if (newLOD !== sessionState.currentLOD) {
      sessionState.currentLOD = newLOD;
      console.log(`Session ${sessionState.id} LOD changed to ${newLOD}`);
      this.adjustStreaming(sessionState);
    }
  }

  calculateLOD(sessionState) {
    if (!this.metadata?.bounds) return 3;
    
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
      
      console.log(`Session ${sessionState.id} bandwidth: ${(sessionState.bandwidth / 1024 / 1024).toFixed(2)} MB/s`);
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
      console.log(`Resumed session ${message.resumeToken} -> ${sessionState.id}`);
      console.log(`Recovered ${sessionState.receivedChunks.size} chunks`);
    }
    
    sessionState.resumeToken = this.generateSessionId();
    
    this.sendDatagram(sessionState, {
      type: 'resumeReady',
      resumeToken: sessionState.resumeToken,
      receivedChunks: Array.from(sessionState.receivedChunks)
    });
    
    this.startStreaming(sessionState);
  }

  handleResumeStream(sessionState, message, stream) {
    this.handleResume(sessionState, message);
  }

  handleChunkRequest(sessionState, chunkIds, stream) {
    const writer = stream.writable.getWriter();
    
    const sendNext = async (index) => {
      if (index >= chunkIds.length) {
        await writer.close();
        return;
      }
      
      const chunkId = chunkIds[index];
      if (this.chunks.has(chunkId) && !sessionState.receivedChunks.has(chunkId)) {
        const chunkData = this.chunks.get(chunkId);
        const chunkInfo = this.metadata.chunks[chunkId];
        
        const header = Buffer.alloc(8);
        header.writeUInt32LE(chunkData.length, 0);
        header.writeUInt32LE(chunkInfo?.originalSize || chunkData.length, 4);
        
        const idBuffer = Buffer.from(chunkId, 'utf-8');
        const idLength = Buffer.alloc(2);
        idLength.writeUInt16LE(idBuffer.length, 0);
        
        await writer.write(Buffer.concat([idLength, idBuffer, header, chunkData]));
        sessionState.receivedChunks.add(chunkId);
        sessionState.bytesTransferred += chunkData.length;
      }
      
      setImmediate(() => sendNext(index + 1));
    };
    
    sendNext(0);
  }

  sendInitialMetadata(sessionState) {
    if (!this.metadata) return;
    
    const metadataLite = {
      type: 'metadata',
      modelId: this.metadata.modelId,
      bounds: this.metadata.bounds,
      lodLevels: this.metadata.lodLevels,
      totalChunks: this.metadata.totalChunks,
      geometries: this.metadata.geometries.map(g => ({
        id: g.id,
        lodLevel: g.lodLevel,
        vertexChunks: g.vertexChunks,
        indexChunks: g.indexChunks,
        vertexCount: g.vertexCount,
        indexCount: g.indexCount
      })),
      textures: this.metadata.textures.map(t => ({
        id: t.id,
        lodLevel: t.lodLevel,
        mipmapCount: t.mipmapCount,
        tilesPerMip: t.tilesPerMip
      })),
      resumeToken: sessionState.resumeToken || this.generateSessionId()
    };
    
    sessionState.resumeToken = metadataLite.resumeToken;
    this.sendDatagram(sessionState, metadataLite);
    
    setTimeout(() => {
      if (!sessionState.isClosed) {
        this.startStreaming(sessionState);
      }
    }, 100);
  }

  startStreaming(sessionState) {
    if (sessionState.isStreaming) return;
    sessionState.isStreaming = true;
    
    console.log(`Starting stream for session ${sessionState.id}`);
    
    const priorityChunks = this.getPriorityChunks(sessionState);
    this.sendChunksInOrder(sessionState, priorityChunks);
  }

  getPriorityChunks(sessionState) {
    if (!this.metadata) return [];
    
    const chunks = [];
    const targetLOD = sessionState.currentLOD;
    
    for (let lod = this.metadata.lodLevels - 1; lod >= 0; lod--) {
      const geometries = this.metadata.geometries.filter(g => g.lodLevel === lod);
      
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
      
      if (lod === targetLOD) {
        const textures = this.metadata.textures.filter(t => t.lodLevel === lod);
        for (const texture of textures) {
          for (const chunkId of Object.keys(this.metadata.chunks).filter(c => c.startsWith(texture.id))) {
            if (!sessionState.receivedChunks.has(chunkId)) {
              chunks.push({ id: chunkId, priority: lod * 1000 + 800 });
            }
          }
        }
      }
    }
    
    chunks.sort((a, b) => a.priority - b.priority);
    return chunks.map(c => c.id);
  }

  async sendChunksInOrder(sessionState, chunkIds) {
    if (sessionState.isClosed) return;
    
    const batchSize = Math.max(1, Math.floor(sessionState.bandwidth / (64 * 1024) / 10));
    let index = 0;
    
    const sendBatch = async () => {
      if (sessionState.isClosed || index >= chunkIds.length) {
        sessionState.isStreaming = false;
        
        if (sessionState.receivedChunks.size < this.metadata.totalChunks) {
          const remaining = this.getPriorityChunks(sessionState);
          if (remaining.length > 0) {
            setTimeout(() => this.sendChunksInOrder(sessionState, remaining), 100);
          }
        } else {
          console.log(`Session ${sessionState.id} completed all chunks`);
        }
        return;
      }
      
      const batch = chunkIds.slice(index, index + batchSize);
      index += batchSize;
      
      try {
        const stream = await sessionState.session.createUnidirectionalStream();
        const writer = stream.writable.getWriter();
        
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
          header.writeUInt32LE(chunkInfo?.originalSize || chunkData.length, 4);
          
          await writer.write(Buffer.concat([idLength, idBuffer, header, chunkData]));
          sessionState.receivedChunks.add(chunkId);
          sessionState.bytesTransferred += chunkData.length;
          sessionState.bytesInWindow += chunkData.length;
        }
        
        await writer.close();
      } catch (e) {
        console.error(`Error sending batch for session ${sessionState.id}:`, e.message);
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
      
      setTimeout(sendBatch, interval);
    };
    
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

  sendDatagram(sessionState, message) {
    try {
      const data = new TextEncoder().encode(JSON.stringify(message));
      sessionState.session.sendDatagram(data).catch(e => {
        console.debug('Datagram send error:', e.message);
      });
    } catch (e) {
      console.debug('Datagram error:', e.message);
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
      
      setTimeout(() => {
        this.sessions.delete(sessionId);
        console.log(`Session ${sessionId} cleaned up`);
      }, CONFIG.RESUME_TIMEOUT);
    }
  }
}

async function main() {
  const server = new ModelStreamingServer();
  await server.start();
}

main().catch(console.error);
