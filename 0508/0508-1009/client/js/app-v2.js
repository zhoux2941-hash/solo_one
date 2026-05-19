import WebSocketClient from './websocket-client-v2.js';
import ProgressiveRenderer from './progressive-renderer-v2.js';

class App {
  constructor() {
    this.client = null;
    this.renderer = null;
    this.startTime = 0;
    this.firstFrameTime = 0;
    this.ui = {};
    
    this.initUI();
    this.initRenderer();
    this.initClient();
  }

  initUI() {
    this.ui.status = document.getElementById('status');
    this.ui.progress = document.getElementById('progress');
    this.ui.progressBar = document.getElementById('progress-bar');
    this.ui.stats = document.getElementById('stats');
    this.ui.lodInfo = document.getElementById('lod-info');
    this.ui.bandwidthInfo = document.getElementById('bandwidth-info');
    this.ui.connectBtn = document.getElementById('connect-btn');
    
    if (this.ui.connectBtn) {
      this.ui.connectBtn.addEventListener('click', () => this.connect());
    }
  }

  initRenderer() {
    const container = document.getElementById('model-container');
    
    this.renderer = new ProgressiveRenderer(container, {
      onFirstFrame: () => this.onFirstFrame(),
      onProgress: (progress) => this.onProgress(progress),
      onBandwidthUpdate: (bandwidth) => this.onBandwidthUpdate(bandwidth)
    });
  }

  initClient() {
    const serverUrl = `ws://${window.location.hostname}:${window.location.port}`;
    
    this.client = new WebSocketClient(serverUrl, {
      maxReconnectAttempts: 10,
      reconnectDelay: 1000
    });
    
    this.client.onMetadata((metadata) => {
      this.renderer.setMetadata(metadata);
      this.updateStatus('Streaming model data...');
    });
    
    this.client.onConnection((connected) => {
      this.updateStatus(connected ? 'Connected' : 'Disconnected');
      this.ui.connectBtn.textContent = connected ? 'Reconnect' : 'Connect';
    });
    
    this.client.onChunk('g', (chunkId, data) => {
      if (chunkId.includes('_v')) {
        this.renderer.handleVertexChunk(chunkId, data);
      } else if (chunkId.includes('_i')) {
        this.renderer.handleIndexChunk(chunkId, data);
      }
      
      this.renderer.updateBandwidthEstimate(data.length);
    });
    
    this.client.onChunk('t', (chunkId, data) => {
      this.renderer.handleTextureChunk(chunkId, data);
    });
  }

  connect() {
    this.client.connect();
    this.startTime = performance.now();
    this.updateStatus('Connecting...');
  }

  onFirstFrame() {
    this.firstFrameTime = performance.now();
    const timeToFirstFrame = (this.firstFrameTime - this.startTime) / 1000;
    
    console.log(`First frame rendered in ${timeToFirstFrame.toFixed(2)}s`);
    this.updateStatus(`First frame: ${timeToFirstFrame.toFixed(2)}s`);
    
    if (timeToFirstFrame < 2) {
      this.ui.status.style.color = '#4ade80';
    }
  }

  onProgress(progress) {
    const percent = Math.round(progress * 100);
    this.ui.progress.textContent = `${percent}%`;
    this.ui.progressBar.style.width = `${percent}%`;
    
    const stats = this.renderer.getStats();
    this.ui.stats.innerHTML = `
      <div>Vertices: ${stats.vertexCount.toLocaleString()}</div>
      <div>Triangles: ${stats.triangleCount.toLocaleString()}</div>
      <div>Draw Calls: ${stats.drawCalls}</div>
    `;
    
    this.ui.lodInfo.innerHTML = `
      <div>Current LOD: ${stats.currentLOD}</div>
      <div>Meshes: ${stats.meshes}</div>
    `;
    
    if (progress >= 1) {
      const totalTime = (performance.now() - this.startTime) / 1000;
      console.log(`Load complete in ${totalTime.toFixed(2)}s`);
      this.updateStatus(`Complete: ${totalTime.toFixed(2)}s`);
      
      if (totalTime < 10) {
        this.ui.status.style.color = '#4ade80';
      }
    }
  }

  onBandwidthUpdate(bandwidth) {
    const mbps = (bandwidth * 8 / 1024 / 1024).toFixed(1);
    this.ui.bandwidthInfo.innerHTML = `
      <div>Bandwidth: ${mbps} Mbps</div>
    `;
  }

  updateStatus(text) {
    if (this.ui.status) {
      this.ui.status.textContent = text;
    }
  }

  start() {
    this.connect();
    this.updateCameraPosition();
  }

  updateCameraPosition() {
    const update = () => {
      if (this.client && this.client.isConnected && this.renderer) {
        const camera = this.renderer.camera;
        const target = this.renderer.controls.target;
        this.client.updateCamera(camera.position, target);
      }
      requestAnimationFrame(update);
    };
    update();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.start();
});
