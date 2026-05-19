import WebSocketClient from './websocket-client.js';
import ProgressiveRenderer from './progressive-renderer.js';

class App {
  constructor() {
    this.client = null;
    this.renderer = null;
    this.container = document.getElementById('canvas-container');
    this.stats = document.getElementById('stats');
    this.progressBar = document.getElementById('progress-fill');
    this.statusText = document.getElementById('status-text');
    this.perfStats = document.getElementById('perf-stats');
    
    this.firstFrameTime = null;
    this.completeTime = null;
    this.startTime = null;
    
    this.init();
  }

  init() {
    this.showStatus('Initializing...');
    
    try {
      this.renderer = new ProgressiveRenderer(this.container, {
        onFirstFrame: () => this.onFirstFrame(),
        onProgress: (progress) => this.onProgress(progress)
      });
      
      const serverUrl = `ws://${window.location.hostname}:${window.location.port}`;
      this.client = new WebSocketClient(serverUrl, {
        maxReconnectAttempts: 10,
        reconnectDelay: 1000
      });
      
      this.client.onMetadata((metadata) => this.onMetadata(metadata));
      this.client.onConnection((connected) => this.onConnection(connected));
      
      this.client.onChunk('g', (chunkId, data) => {
        if (chunkId.includes('_v')) {
          this.renderer.handleVertexChunk(chunkId, data);
        } else if (chunkId.includes('_i')) {
          this.renderer.handleIndexChunk(chunkId, data);
        }
      });
      
      this.client.onChunk('t', (chunkId, data) => {
        this.renderer.handleTextureChunk(chunkId, data);
      });
      
      this.showStatus('Connecting to server...');
      this.client.connect();
      
      this.startTime = performance.now();
      
      this.updateStatsLoop();
      
    } catch (error) {
      console.error('Initialization error:', error);
      this.showStatus('Error: ' + error.message, true);
    }
  }

  onMetadata(metadata) {
    console.log('Received metadata:', metadata);
    this.renderer.setMetadata(metadata);
    this.showStatus(`Loading model: '${metadata.modelId}'...`);
    this.startTime = performance.now();
  }

  onConnection(connected) {
    if (connected) {
      this.showStatus('Connected');
    } else {
      this.showStatus('Disconnected. Reconnecting...');
    }
  }

  onFirstFrame() {
    this.firstFrameTime = performance.now();
    const timeToFirstFrame = (this.firstFrameTime - this.startTime) / 1000;
    console.log(`First frame: ${timeToFirstFrame.toFixed(3)}s`);
    this.showStatus(`First frame in ${timeToFirstFrame.toFixed(2)}s`);
    
    setTimeout(() => {
      this.showStatus('Streaming high-quality data...');
    }, 1000);
  }

  onProgress(progress) {
    const percentage = Math.min(100, Math.round(progress * 100));
    
    if (this.progressBar) {
      this.progressBar.style.width = percentage + '%';
    }
    
    if (percentage >= 100 && !this.completeTime) {
      this.completeTime = performance.now();
      const totalTime = (this.completeTime - this.startTime) / 1000;
      console.log(`Complete load: ${totalTime.toFixed(3)}s`);
      this.showStatus(`Complete in ${totalTime.toFixed(2)}s`);
      
      const perfStatsDiv = document.getElementById('perf-stats');
      if (perfStatsDiv) {
        perfStatsDiv.innerHTML += `<div class="stat-item"><span class="label">Time to First Frame:</span><span class="value">${((this.firstFrameTime - this.startTime) / 1000).toFixed(2)}s</span></div><div class="stat-item"><span class="label">Total Load Time:</span><span class="value">${totalTime.toFixed(2)}s</span></div>`;
      }
    }
  }

  showStatus(text, isError = false) {
    if (this.statusText) {
      this.statusText.textContent = text;
      this.statusText.className = 'status ' + (isError ? 'error' : '');
    }
  }

  updateStatsLoop() {
    const update = () => {
      if (this.stats) {
        const clientStats = this.client ? this.client.getStats() : {};
        const renderStats = this.renderer ? this.renderer.getStats() : {};
        
        const bandwidth = clientStats.bandwidth ? (clientStats.bandwidth / 1024 / 1024).toFixed(2) : '0.00';
        const progress = clientStats.progress ? (clientStats.progress * 100).toFixed(1) : '0.0';
        
        this.stats.innerHTML = `
          <div class="stat-row">
            <span>Progress:</span>
            <span>${progress}%</span>
          </div>
          <div class="stat-row">
            <span>Bandwidth:</span>
            <span>${bandwidth} MB/s</span>
          </div>
          <div class="stat-row">
            <span>Vertices:</span>
            <span>${renderStats.vertexCount || 0}</span>
          </div>
          <div class="stat-row">
            <span>Triangles:</span>
            <span>${renderStats.triangleCount || 0}</span>
          </div>
          <div class="stat-row">
            <span>LOD:</span>
            <span>${renderStats.currentLOD || 3}</span>
          </div>
          <div class="stat-row">
            <span>Draw Calls:</span>
            <span>${renderStats.drawCalls || 0}</span>
          </div>
        `;
      }
      
      requestAnimationFrame(update);
    };
    
    update();
  }

  updateCameraTracking() {
    const update = () => {
      if (this.client && this.renderer) {
        this.client.updateCamera(
          this.renderer.camera.position,
          this.renderer.controls.target
        );
      }
      setTimeout(update, 100);
    };
    
    update();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

export default App;
