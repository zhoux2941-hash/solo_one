import { PSNRCalculator } from './psnrCalculator.js';
import { TemporalFilter } from './temporalFilter.js';

export class Pipeline {
  constructor(frameDecoder, espcnModel, frameBuffer, outputCtx, width, height, scaleFactor) {
    this.frameDecoder = frameDecoder;
    this.espcnModel = espcnModel;
    this.frameBuffer = frameBuffer;
    this.outputCtx = outputCtx;
    this.width = width;
    this.height = height;
    this.scaleFactor = scaleFactor;
    
    this.isRunning = false;
    this.isPaused = false;
    this.isSwitchingModel = false;
    this.processedFrames = 0;
    this.droppedFrames = 0;
    this.enableTemporalFilter = true;
    
    this.psnrCalculator = new PSNRCalculator();
    this.temporalFilter = new TemporalFilter({
      windowSize: 5,
      maxPixelChange: 25,
      motionThreshold: 20,
      strength: 0.7
    });
    
    this.onFrameProcessed = null;
    this.onError = null;
    this.onModelSwitching = null;
    this.onModelSwitched = null;
    
    this.processingPromise = null;
    this.lastFrameData = null;
    this.currentModelInfo = null;
    this.pendingModel = null;
    
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    
    this.outputImageData = null;
    this.transitionCanvas = document.createElement('canvas');
    this.transitionCtx = this.transitionCanvas.getContext('2d');
  }
  
  async start() {
    this.isRunning = true;
    this.processedFrames = 0;
    this.droppedFrames = 0;
    
    this.frameDecoder.onFrame((frame) => {
      if (!this.isRunning || this.isPaused) {
        if (frame.close) frame.close();
        return;
      }
      
      this.frameBuffer.add(frame);
    });
    
    await this.frameDecoder.start();
    
    this._startProcessingLoop();
    
    console.log('Pipeline started');
  }
  
  async stop() {
    this.isRunning = false;
    this.frameDecoder.stop();
    this.frameBuffer.clear();
    this.temporalFilter.reset();
    
    if (this.processingPromise) {
      await this.processingPromise;
    }
    
    console.log('Pipeline stopped');
  }
  
  pause() {
    this.isPaused = true;
  }
  
  resume() {
    this.isPaused = false;
  }
  
  async switchModel(newModel, modelInfo, options = {}) {
    if (this.isSwitchingModel) {
      throw new Error('Model switch already in progress');
    }
    
    if (!newModel || !newModel.isReady()) {
      throw new Error('New model is not ready');
    }
    
    this.isSwitchingModel = true;
    this.pendingModel = { model: newModel, info: modelInfo };
    
    if (this.onModelSwitching) {
      this.onModelSwitching(modelInfo);
    }
    
    const newScaleFactor = modelInfo?.scaleFactor || newModel.scaleFactor;
    const scaleChanged = newScaleFactor !== this.scaleFactor;
    
    if (scaleChanged) {
      if (options.seamless !== false) {
        await this._seamlessScaleTransition(newModel, newScaleFactor);
      }
      this.scaleFactor = newScaleFactor;
    }
    
    const oldModel = this.espcnModel;
    this.espcnModel = newModel;
    this.currentModelInfo = modelInfo;
    this.temporalFilter.reset();
    this.outputImageData = null;
    
    this.isSwitchingModel = false;
    this.pendingModel = null;
    
    if (oldModel && oldModel.dispose && options.disposeOldModel !== false) {
      setTimeout(() => {
        if (oldModel.dispose) {
          oldModel.dispose();
        }
      }, 100);
    }
    
    if (this.onModelSwitched) {
      this.onModelSwitched(modelInfo);
    }
    
    console.log('Model switched to:', modelInfo?.name || 'Unknown');
  }
  
  async _seamlessScaleTransition(newModel, newScaleFactor) {
    const newWidth = this.width * newScaleFactor;
    const newHeight = this.height * newScaleFactor;
    
    this.transitionCanvas.width = newWidth;
    this.transitionCanvas.height = newHeight;
    
    if (this.lastFrameData) {
      const tempResult = await newModel.infer(this.lastFrameData, this.width, this.height);
      this._displayResult({
        ...tempResult,
        width: newWidth,
        height: newHeight
      });
    }
  }
  
  async reloadCurrentModel() {
    if (!this.espcnModel) return;
    
    if (this.espcnModel.reload) {
      await this.espcnModel.reload();
      this.temporalFilter.reset();
    }
  }
  
  getCurrentModel() {
    return {
      model: this.espcnModel,
      info: this.currentModelInfo
    };
  }
  
  async _startProcessingLoop() {
    while (this.isRunning) {
      if (this.isPaused) {
        await this._sleep(10);
        continue;
      }
      
      if (this.frameBuffer.isEmpty()) {
        await this._sleep(5);
        continue;
      }
      
      const frameItem = this.frameBuffer.get();
      if (!frameItem) continue;
      
      this.frameBuffer.markProcessing(frameItem.id);
      
      try {
        this.processingPromise = this._processFrame(frameItem.frame);
        const result = await this.processingPromise;
        
        if (result && this.isRunning) {
          this._displayResult(result);
          
          if (this.onFrameProcessed) {
            this.onFrameProcessed({
              inferenceTime: result.inferenceTime,
              psnr: result.psnr,
              bufferStatus: this.frameBuffer.getStatusString(),
              motionLevel: result.motionLevel,
              adaptiveStrength: result.adaptiveStrength,
              temporalFilteringTime: result.temporalFilteringTime
            });
          }
          
          this.processedFrames++;
        }
      } catch (error) {
        console.error('Frame processing error:', error);
        if (this.onError) {
          this.onError(error);
        }
      } finally {
        this.frameBuffer.markProcessed(frameItem.id);
        
        if (frameItem.frame && frameItem.frame.close) {
          frameItem.frame.close();
        }
      }
    }
  }
  
  async _processFrame(frame) {
    let frameData;
    
    if (frame instanceof VideoFrame) {
      frameData = await this._extractFromVideoFrame(frame);
    } else if (frame.data) {
      frameData = frame.data;
    } else {
      throw new Error('Unsupported frame format');
    }
    
    if (!frameData) return null;
    
    this.lastFrameData = frameData;
    
    const result = await this.espcnModel.infer(frameData, this.width, this.height);
    
    let filteredData = result.data;
    let temporalFilteringTime = 0;
    
    if (this.enableTemporalFilter) {
      const filterStart = performance.now();
      filteredData = this.temporalFilter.process(
        result.data,
        result.width,
        result.height
      );
      temporalFilteringTime = performance.now() - filterStart;
    }
    
    const psnr = this._calculatePSNR(frameData, filteredData);
    const motionLevel = this.temporalFilter.getMotionLevel();
    const adaptiveStrength = this.temporalFilter.getAdaptiveStrength();
    
    return {
      ...result,
      data: filteredData,
      psnr,
      motionLevel,
      adaptiveStrength,
      temporalFilteringTime
    };
  }
  
  async _extractFromVideoFrame(videoFrame) {
    try {
      this.offscreenCtx.drawImage(videoFrame, 0, 0, this.width, this.height);
      const imageData = this.offscreenCtx.getImageData(0, 0, this.width, this.height);
      return imageData.data;
    } catch (error) {
      console.error('Failed to extract from VideoFrame:', error);
      return null;
    }
  }
  
  _calculatePSNR(originalData, enhancedData) {
    try {
      return this.psnrCalculator.calculateWithDownsampling(
        originalData,
        enhancedData,
        this.width,
        this.height,
        this.scaleFactor
      );
    } catch (e) {
      return 0;
    }
  }
  
  _displayResult(result) {
    const outputWidth = result.width;
    const outputHeight = result.height;
    
    if (!this.outputImageData || 
        this.outputImageData.width !== outputWidth || 
        this.outputImageData.height !== outputHeight) {
      this.outputImageData = this.outputCtx.createImageData(outputWidth, outputHeight);
    }
    
    if (result.data instanceof Uint8ClampedArray || result.data instanceof Uint8Array) {
      this.outputImageData.data.set(result.data);
      this.outputCtx.putImageData(this.outputImageData, 0, 0);
    } else if (result.data instanceof Float32Array) {
      const uint8Data = new Uint8ClampedArray(result.data.length);
      for (let i = 0; i < result.data.length; i++) {
        uint8Data[i] = Math.max(0, Math.min(255, result.data[i]));
      }
      this.outputImageData.data.set(uint8Data);
      this.outputCtx.putImageData(this.outputImageData, 0, 0);
    }
  }
  
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  getStats() {
    return {
      processedFrames: this.processedFrames,
      droppedFrames: this.droppedFrames,
      isRunning: this.isRunning,
      isPaused: this.isPaused
    };
  }
  
  updateScaleFactor(scaleFactor) {
    this.scaleFactor = scaleFactor;
  }
  
  setTemporalFilterEnabled(enabled) {
    this.enableTemporalFilter = enabled;
    if (!enabled) {
      this.temporalFilter.reset();
    }
  }
  
  setTemporalFilterStrength(strength) {
    this.temporalFilter.setStrength(strength);
  }
  
  setMaxPixelChange(maxChange) {
    this.temporalFilter.setMaxPixelChange(maxChange);
  }
  
  getTemporalFilterStats() {
    return {
      enabled: this.enableTemporalFilter,
      motionLevel: this.temporalFilter.getMotionLevel(),
      adaptiveStrength: this.temporalFilter.getAdaptiveStrength()
    };
  }
}
