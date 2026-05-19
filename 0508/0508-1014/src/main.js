import { VideoCapture } from './videoCapture.js';
import { FrameDecoder } from './frameDecoder.js';
import { WebNNEngine } from './webnnEngine.js';
import { FrameBuffer } from './frameBuffer.js';
import { Pipeline } from './pipeline.js';
import { ModelManager } from './modelManager.js';

class SuperResolutionApp {
  constructor() {
    this.isRunning = false;
    this.scaleFactor = 2;
    this.backend = 'webnn';
    this.currentModelId = 'espcn-2x';
    this.videoWidth = 1920;
    this.videoHeight = 1080;
    
    this.videoCapture = null;
    this.frameDecoder = null;
    this.webnnEngine = null;
    this.frameBuffer = null;
    this.pipeline = null;
    this.modelManager = null;
    
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.currentFps = 0;
    
    this.initElements();
    this.initEventListeners();
    this.initModelManager();
  }
  
  initElements() {
    this.startBtn = document.getElementById('startBtn');
    this.stopBtn = document.getElementById('stopBtn');
    this.videoSourceSelect = document.getElementById('videoSource');
    this.scaleFactorSelect = document.getElementById('scaleFactor');
    this.backendSelect = document.getElementById('backend');
    this.modelSelect = document.getElementById('modelSelect');
    this.loadModelBtn = document.getElementById('loadModelBtn');
    this.reloadModelBtn = document.getElementById('reloadModelBtn');
    this.fileInput = document.getElementById('fileInput');
    this.temporalFilterToggle = document.getElementById('temporalFilterToggle');
    this.filterStrengthSlider = document.getElementById('filterStrength');
    this.filterStrengthValue = document.getElementById('filterStrengthValue');
    this.originalVideo = document.getElementById('originalVideo');
    this.originalCanvas = document.getElementById('originalCanvas');
    this.outputCanvas = document.getElementById('outputCanvas');
    this.fpsElement = document.getElementById('fps');
    this.psnrElement = document.getElementById('psnr');
    this.inferenceTimeElement = document.getElementById('inferenceTime');
    this.resolutionElement = document.getElementById('resolution');
    this.bufferStatusElement = document.getElementById('bufferStatus');
    this.motionLevelElement = document.getElementById('motionLevel');
    this.filterStrengthDisplay = document.getElementById('filterStrengthDisplay');
    this.statusText = document.getElementById('statusText');
  }
  
  initEventListeners() {
    this.startBtn.addEventListener('click', () => this.start());
    this.stopBtn.addEventListener('click', () => this.stop());
    
    this.videoSourceSelect.addEventListener('change', (e) => {
      if (e.target.value === 'file') {
        this.fileInput.click();
      }
    });
    
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.originalVideo.src = URL.createObjectURL(file);
      }
    });
    
    this.scaleFactorSelect.addEventListener('change', (e) => {
      this.scaleFactor = parseInt(e.target.value);
      const modelId = this.scaleFactor === 2 ? 'espcn-2x' : 'espcn-3x';
      this.modelSelect.value = modelId;
      this.updateStatus(`超分倍数已切换为 ${this.scaleFactor}x`);
    });
    
    this.backendSelect.addEventListener('change', (e) => {
      this.backend = e.target.value;
      if (this.webnnEngine) {
        this.webnnEngine.setBackend(this.backend);
      }
      this.updateStatus(`推理后端已切换为 ${this.backend}`);
    });
    
    this.modelSelect.addEventListener('change', (e) => {
      const modelId = e.target.value;
      this.onModelSelected(modelId);
    });
    
    this.loadModelBtn.addEventListener('click', () => {
      const modelId = this.modelSelect.value;
      this.loadAndSwitchModel(modelId);
    });
    
    this.reloadModelBtn.addEventListener('click', () => {
      this.reloadCurrentModel();
    });
    
    this.temporalFilterToggle.addEventListener('change', (e) => {
      if (this.pipeline) {
        this.pipeline.setTemporalFilterEnabled(e.target.checked);
      }
      this.updateStatus(`时域降噪已${e.target.checked ? '启用' : '禁用'}`);
    });
    
    this.filterStrengthSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.filterStrengthValue.textContent = `${value}%`;
      if (this.pipeline) {
        this.pipeline.setTemporalFilterStrength(value / 100);
      }
    });
  }
  
  async initModelManager() {
    this.webnnEngine = new WebNNEngine();
    await this.webnnEngine.init(this.backend);
    
    this.modelManager = new ModelManager(this.webnnEngine);
    await this.modelManager.initialize();
    
    this.modelManager.onModelLoaded = (modelId, modelInfo) => {
      this.updateStatus(`模型加载完成: ${modelInfo.name}`);
      this.updateModelUI();
    };
    
    this.modelManager.onModelActivated = (modelId, modelInfo) => {
      this.currentModelId = modelId;
      this.scaleFactor = modelInfo.scaleFactor;
      this.scaleFactorSelect.value = modelInfo.scaleFactor.toString();
      this.updateModelUI();
    };
    
    this.updateModelUI();
  }
  
  async onModelSelected(modelId) {
    const modelInfo = this.modelManager.getModelInfo(modelId);
    if (!modelInfo) return;
    
    this.updateStatus(`已选择模型: ${modelInfo.name}`);
    
    if (this.isRunning && modelInfo.loaded) {
      await this.switchModel(modelId);
    }
  }
  
  async loadAndSwitchModel(modelId) {
    try {
      this.updateStatus(`正在加载模型...`);
      this.loadModelBtn.disabled = true;
      this.loadModelBtn.innerHTML = '<span class="model-loading"></span>';
      
      const model = await this.modelManager.loadModel(modelId);
      
      if (this.isRunning) {
        await this.switchModel(modelId);
      } else {
        this.currentModelId = modelId;
        const modelInfo = this.modelManager.getModelInfo(modelId);
        this.scaleFactor = modelInfo.scaleFactor;
        this.scaleFactorSelect.value = modelInfo.scaleFactor.toString();
        this.updateStatus(`模型已加载: ${modelInfo.name}`);
      }
      
    } catch (error) {
      console.error('Model load failed:', error);
      this.updateStatus(`模型加载失败: ${error.message}`);
    } finally {
      this.loadModelBtn.disabled = false;
      this.loadModelBtn.textContent = '加载';
      this.updateModelUI();
    }
  }
  
  async switchModel(modelId) {
    if (!this.pipeline) return;
    
    try {
      this.updateStatus(`正在切换模型...`);
      
      const modelInfo = this.modelManager.getModelInfo(modelId);
      const model = await this.modelManager.activateModel(modelId);
      
      this.pipeline.onModelSwitching = (info) => {
        this.updateStatus(`正在切换到 ${info.name}...`);
      };
      
      this.pipeline.onModelSwitched = (info) => {
        this.currentModelId = modelId;
        this.scaleFactor = info.scaleFactor;
        this.scaleFactorSelect.value = info.scaleFactor.toString();
        
        if (this.videoCapture) {
          this.outputCanvas.width = this.videoWidth * this.scaleFactor;
          this.outputCanvas.height = this.videoHeight * this.scaleFactor;
          this.updateResolutionDisplay(this.videoWidth, this.videoHeight);
        }
        
        this.updateStatus(`已切换到模型: ${info.name}`);
        this.updateModelUI();
      };
      
      await this.pipeline.switchModel(model, modelInfo);
      
    } catch (error) {
      console.error('Model switch failed:', error);
      this.updateStatus(`模型切换失败: ${error.message}`);
    }
  }
  
  async reloadCurrentModel() {
    if (!this.pipeline || !this.currentModelId) return;
    
    try {
      this.updateStatus('正在重新加载模型...');
      this.reloadModelBtn.disabled = true;
      
      const modelInfo = this.modelManager.getModelInfo(this.currentModelId);
      const newModel = this.modelManager.models.get(this.currentModelId);
      
      if (newModel && newModel.instance) {
        await newModel.instance.reload();
        await this.pipeline.switchModel(newModel.instance, modelInfo, { disposeOldModel: true });
      }
      
      this.updateStatus('模型已重新加载');
    } catch (error) {
      console.error('Model reload failed:', error);
      this.updateStatus(`模型重新加载失败: ${error.message}`);
    } finally {
      this.reloadModelBtn.disabled = false;
    }
  }
  
  updateModelUI() {
    const models = this.modelManager.getAllModels();
    const currentModel = this.modelManager.getActiveModel();
    
    for (const model of models) {
      const option = this.modelSelect.querySelector(`option[value="${model.id}"]`);
      if (option) {
        let text = model.name;
        if (model.loaded) {
          text += ' ✓';
        }
        if (model.active) {
          text += ' (当前)';
        }
        option.textContent = text;
      }
    }
    
    this.modelSelect.value = currentModel?.id || this.currentModelId;
  }
  
  async start() {
    try {
      this.updateStatus('正在初始化...');
      this.startBtn.disabled = true;
      
      this.frameBuffer = new FrameBuffer(5);
      
      if (!this.modelManager) {
        await this.initModelManager();
      }
      
      const modelInfo = this.modelManager.getModelInfo(this.currentModelId);
      this.scaleFactor = modelInfo?.scaleFactor || this.scaleFactor;
      
      if (!this.modelManager.isModelLoaded(this.currentModelId)) {
        this.updateStatus('正在加载模型...');
        await this.modelManager.loadModel(this.currentModelId);
      }
      
      const activeModel = await this.modelManager.activateModel(this.currentModelId);
      
      this.videoCapture = new VideoCapture(this.originalVideo);
      const stream = await this.videoCapture.start(this.videoSourceSelect.value);
      
      this.videoWidth = this.originalVideo.videoWidth || 1920;
      this.videoHeight = this.originalVideo.videoHeight || 1080;
      
      this.originalCanvas.width = this.videoWidth;
      this.originalCanvas.height = this.videoHeight;
      this.originalCtx = this.originalCanvas.getContext('2d', { willReadFrequently: true });
      
      this.outputCanvas.width = this.videoWidth * this.scaleFactor;
      this.outputCanvas.height = this.videoHeight * this.scaleFactor;
      this.outputCtx = this.outputCanvas.getContext('2d');
      
      this.frameDecoder = new FrameDecoder(stream, this.videoWidth, this.videoHeight);
      
      this.pipeline = new Pipeline(
        this.frameDecoder,
        activeModel,
        this.frameBuffer,
        this.outputCtx,
        this.videoWidth,
        this.videoHeight,
        this.scaleFactor
      );
      
      this.pipeline.currentModelInfo = modelInfo;
      
      this.pipeline.onFrameProcessed = (stats) => {
        this.updateMetrics(stats);
      };
      
      this.pipeline.onError = (error) => {
        console.error('Pipeline error:', error);
        this.updateStatus(`错误: ${error.message}`);
      };
      
      this.pipeline.onModelSwitching = (info) => {
        this.updateStatus(`正在切换到 ${info.name}...`);
      };
      
      this.pipeline.onModelSwitched = (info) => {
        this.updateStatus(`已切换到模型: ${info.name}`);
        this.outputCanvas.width = this.videoWidth * info.scaleFactor;
        this.outputCanvas.height = this.videoHeight * info.scaleFactor;
        this.updateResolutionDisplay(this.videoWidth, this.videoHeight);
      };
      
      await this.pipeline.start();
      
      this.isRunning = true;
      this.stopBtn.disabled = false;
      
      this.updateResolutionDisplay(this.videoWidth, this.videoHeight);
      this.updateStatus('运行中 - 实时超分辨率处理');
      this.updateModelUI();
      
      this.startFpsCounter();
      
    } catch (error) {
      console.error('Start failed:', error);
      this.updateStatus(`启动失败: ${error.message}`);
      this.startBtn.disabled = false;
    }
  }
  
  async stop() {
    this.isRunning = false;
    this.stopBtn.disabled = true;
    
    if (this.pipeline) {
      await this.pipeline.stop();
    }
    
    if (this.videoCapture) {
      await this.videoCapture.stop();
    }
    
    if (this.frameDecoder) {
      this.frameDecoder.destroy();
    }
    
    this.startBtn.disabled = false;
    this.updateStatus('已停止');
  }
  
  updateMetrics(stats) {
    this.frameCount++;
    
    if (stats.inferenceTime) {
      this.inferenceTimeElement.textContent = `${stats.inferenceTime.toFixed(1)} ms`;
    }
    
    if (stats.psnr) {
      this.psnrElement.textContent = `${stats.psnr.toFixed(2)} dB`;
    }
    
    if (stats.bufferStatus) {
      this.bufferStatusElement.textContent = stats.bufferStatus;
    }
    
    if (stats.motionLevel !== undefined) {
      this.motionLevelElement.textContent = stats.motionLevel.toFixed(1);
    }
    
    if (stats.adaptiveStrength !== undefined) {
      this.filterStrengthDisplay.textContent = `${(stats.adaptiveStrength * 100).toFixed(0)}%`;
    }
  }
  
  startFpsCounter() {
    const updateFps = () => {
      if (!this.isRunning) return;
      
      const now = performance.now();
      if (now - this.lastFpsUpdate >= 1000) {
        this.currentFps = this.frameCount * 1000 / (now - this.lastFpsUpdate);
        this.fpsElement.textContent = this.currentFps.toFixed(1);
        this.frameCount = 0;
        this.lastFpsUpdate = now;
      }
      
      requestAnimationFrame(updateFps);
    };
    
    this.lastFpsUpdate = performance.now();
    this.frameCount = 0;
    requestAnimationFrame(updateFps);
  }
  
  updateResolutionDisplay(width, height) {
    const outputWidth = width * this.scaleFactor;
    const outputHeight = height * this.scaleFactor;
    this.resolutionElement.textContent = `${width}×${height} → ${outputWidth}×${outputHeight}`;
  }
  
  updateStatus(text) {
    this.statusText.textContent = text;
  }
}

const app = new SuperResolutionApp();
window.app = app;
