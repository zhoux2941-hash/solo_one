export class ResolutionAdapter {
  constructor(videoElement, options = {}) {
    this.videoElement = videoElement;
    this.analysisCanvas = document.createElement('canvas');
    this.analysisCtx = this.analysisCanvas.getContext('2d', { willReadFrequently: true });
    
    this.options = {
      sampleWidth: 160,
      sampleHeight: 90,
      motionThreshold: 0.05,
      highMotionThreshold: 0.15,
      debounceFrames: 10,
      checkInterval: 500,
      resolutionSteps: [
        { width: 3840, height: 2160, maxBitrate: 15000000, name: '4K' },
        { width: 2560, height: 1440, maxBitrate: 10000000, name: '2K' },
        { width: 1920, height: 1080, maxBitrate: 8000000, name: '1080p' },
        { width: 1280, height: 720, maxBitrate: 4000000, name: '720p' }
      ],
      ...options
    };
    
    this.lastFrameData = null;
    this.currentMotionLevel = 0;
    this.motionHistory = [];
    this.maxHistoryLength = 30;
    this.currentResolutionIndex = 0;
    this.targetResolutionIndex = 0;
    this.debounceCounter = 0;
    this.isRunning = false;
    this.checkTimer = null;
    this.isAnalyzing = false;
    
    this.onResolutionChange = null;
    this.onMotionUpdate = null;
    
    this.analysisCanvas.width = this.options.sampleWidth;
    this.analysisCanvas.height = this.options.sampleHeight;
    
    this.samplePoints = this.generateSamplePoints();
  }
  
  generateSamplePoints() {
    const points = [];
    const stepX = Math.floor(this.options.sampleWidth / 8);
    const stepY = Math.floor(this.options.sampleHeight / 8);
    
    for (let y = stepY / 2; y < this.options.sampleHeight; y += stepY) {
      for (let x = stepX / 2; x < this.options.sampleWidth; x += stepX) {
        points.push(Math.floor(y) * this.options.sampleWidth + Math.floor(x));
      }
    }
    return points;
  }
  
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleCheck();
  }
  
  stop() {
    this.isRunning = false;
    if (this.checkTimer) {
      clearTimeout(this.checkTimer);
      this.checkTimer = null;
    }
    this.lastFrameData = null;
    this.isAnalyzing = false;
  }
  
  scheduleCheck() {
    if (!this.isRunning) return;
    
    this.checkTimer = setTimeout(() => {
      if (!this.isAnalyzing) {
        this.analyzeFrame();
      }
      this.scheduleCheck();
    }, this.options.checkInterval);
  }
  
  analyzeFrame() {
    if (!this.videoElement || this.videoElement.readyState < 2) {
      return;
    }
    
    this.isAnalyzing = true;
    
    try {
      this.analysisCtx.drawImage(
        this.videoElement,
        0, 0,
        this.options.sampleWidth,
        this.options.sampleHeight
      );
      
      const imageData = this.analysisCtx.getImageData(
        0, 0,
        this.options.sampleWidth,
        this.options.sampleHeight
      );
      
      if (this.lastFrameData) {
        const motionLevel = this.calculateMotionLevelFast(
          this.lastFrameData,
          imageData.data
        );
        
        this.currentMotionLevel = motionLevel;
        this.motionHistory.push(motionLevel);
        if (this.motionHistory.length > this.maxHistoryLength) {
          this.motionHistory.shift();
        }
        
        const smoothedMotion = this.getSmoothedMotion();
        this.adaptResolution(smoothedMotion);
        
        if (this.onMotionUpdate) {
          this.onMotionUpdate({
            level: motionLevel,
            smoothed: smoothedMotion,
            currentResolution: this.options.resolutionSteps[this.currentResolutionIndex]
          });
        }
      }
      
      this.lastFrameData = new Uint8ClampedArray(imageData.data);
    } catch (error) {
      console.warn('Frame analysis failed:', error);
    } finally {
      this.isAnalyzing = false;
    }
  }
  
  calculateMotionLevelFast(prevData, currData) {
    let diffCount = 0;
    const threshold = 25;
    
    for (let i = 0; i < this.samplePoints.length; i++) {
      const pixelIndex = this.samplePoints[i] * 4;
      
      const rDiff = Math.abs(currData[pixelIndex] - prevData[pixelIndex]);
      const gDiff = Math.abs(currData[pixelIndex + 1] - prevData[pixelIndex + 1]);
      const bDiff = Math.abs(currData[pixelIndex + 2] - prevData[pixelIndex + 2]);
      
      const avgDiff = (rDiff + gDiff + bDiff) / 3;
      
      if (avgDiff > threshold) {
        diffCount++;
      }
    }
    
    return diffCount / this.samplePoints.length;
  }
  
  calculateMotionLevelFull(prevData, currData) {
    let diffCount = 0;
    const threshold = 25;
    const pixelCount = prevData.length / 4;
    
    for (let i = 0; i < prevData.length; i += 4) {
      const rDiff = Math.abs(currData[i] - prevData[i]);
      const gDiff = Math.abs(currData[i + 1] - prevData[i + 1]);
      const bDiff = Math.abs(currData[i + 2] - prevData[i + 2]);
      
      const avgDiff = (rDiff + gDiff + bDiff) / 3;
      
      if (avgDiff > threshold) {
        diffCount++;
      }
    }
    
    return diffCount / pixelCount;
  }
  
  getSmoothedMotion() {
    if (this.motionHistory.length === 0) return 0;
    
    const recent = this.motionHistory.slice(-10);
    const sorted = [...recent].sort((a, b) => a - b);
    const trimmed = sorted.slice(2, -2);
    
    if (trimmed.length === 0) {
      return recent.reduce((sum, val) => sum + val, 0) / recent.length;
    }
    
    return trimmed.reduce((sum, val) => sum + val, 0) / trimmed.length;
  }
  
  adaptResolution(motionLevel) {
    const steps = this.options.resolutionSteps;
    let targetIndex;
    
    if (motionLevel < this.options.motionThreshold) {
      targetIndex = 0;
    } else if (motionLevel < this.options.highMotionThreshold) {
      targetIndex = Math.min(1, steps.length - 1);
    } else {
      targetIndex = Math.min(2, steps.length - 1);
    }
    
    if (targetIndex !== this.targetResolutionIndex) {
      this.debounceCounter++;
      
      if (this.debounceCounter >= this.options.debounceFrames) {
        this.targetResolutionIndex = targetIndex;
        this.debounceCounter = 0;
        
        if (this.targetResolutionIndex !== this.currentResolutionIndex) {
          this.applyResolutionChange(this.targetResolutionIndex);
        }
      }
    } else {
      this.debounceCounter = Math.max(0, this.debounceCounter - 1);
    }
  }
  
  applyResolutionChange(index) {
    const newResolution = this.options.resolutionSteps[index];
    const oldResolution = this.options.resolutionSteps[this.currentResolutionIndex];
    
    console.log(`[ResolutionAdapt] ${oldResolution.name} -> ${newResolution.name}`);
    console.log(`[ResolutionAdapt] Motion: ${(this.currentMotionLevel * 100).toFixed(1)}%`);
    
    this.currentResolutionIndex = index;
    
    if (this.onResolutionChange) {
      this.onResolutionChange({
        oldResolution,
        newResolution,
        motionLevel: this.currentMotionLevel
      });
    }
  }
  
  getCurrentResolution() {
    return this.options.resolutionSteps[this.currentResolutionIndex];
  }
  
  forceResolution(index) {
    if (index >= 0 && index < this.options.resolutionSteps.length) {
      this.applyResolutionChange(index);
    }
  }
  
  setMotionThresholds(low, high) {
    this.options.motionThreshold = low;
    this.options.highMotionThreshold = high;
  }
  
  setCheckInterval(interval) {
    this.options.checkInterval = interval;
  }
  
  destroy() {
    this.stop();
    this.analysisCanvas = null;
    this.analysisCtx = null;
    this.videoElement = null;
    this.samplePoints = null;
    this.motionHistory = [];
  }
}
