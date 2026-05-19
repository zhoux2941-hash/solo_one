export class TemporalFilter {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 5;
    this.maxPixelChange = options.maxPixelChange || 20;
    this.motionThreshold = options.motionThreshold || 15;
    this.strength = options.strength || 0.6;
    
    this.frameHistory = [];
    this.weights = this._calculateGaussianWeights();
    this.lastMean = null;
    this.lastStd = null;
    this.motionHistory = [];
    this.adaptiveStrength = this.strength;
  }
  
  _calculateGaussianWeights() {
    const weights = [];
    const sigma = this.windowSize / 3.0;
    
    for (let i = 0; i < this.windowSize; i++) {
      const x = i - (this.windowSize - 1) / 2;
      weights.push(Math.exp(-(x * x) / (2 * sigma * sigma)));
    }
    
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map(w => w / sum);
  }
  
  process(currentFrame, width, height) {
    const motionLevel = this._detectMotion(currentFrame, width, height);
    this._updateAdaptiveStrength(motionLevel);
    
    let outputFrame;
    
    if (motionLevel < this.motionThreshold * 0.3) {
      outputFrame = this._strongSmooth(currentFrame, width, height);
    } else if (motionLevel < this.motionThreshold) {
      outputFrame = this._adaptiveSmooth(currentFrame, width, height, motionLevel);
    } else {
      outputFrame = this._lightSmooth(currentFrame, width, height);
    }
    
    outputFrame = this._colorCorrection(outputFrame, width, height);
    outputFrame = this._antiFlicker(outputFrame, width, height);
    
    this._addToHistory(currentFrame, width, height);
    
    return outputFrame;
  }
  
  _detectMotion(currentFrame, width, height) {
    if (this.frameHistory.length === 0) return 0;
    
    const lastFrame = this.frameHistory[this.frameHistory.length - 1];
    let diffSum = 0;
    const pixelCount = width * height;
    const step = 4;
    
    for (let i = 0; i < pixelCount * 4; i += 4 * step) {
      const rDiff = Math.abs(currentFrame[i] - lastFrame[i]);
      const gDiff = Math.abs(currentFrame[i + 1] - lastFrame[i + 1]);
      const bDiff = Math.abs(currentFrame[i + 2] - lastFrame[i + 2]);
      diffSum += (rDiff + gDiff + bDiff) / 3;
    }
    
    const avgDiff = diffSum / (pixelCount / step);
    
    this.motionHistory.push(avgDiff);
    if (this.motionHistory.length > 10) {
      this.motionHistory.shift();
    }
    
    const smoothedMotion = this.motionHistory.reduce((a, b) => a + b, 0) / this.motionHistory.length;
    
    return smoothedMotion;
  }
  
  _updateAdaptiveStrength(motionLevel) {
    const normalizedMotion = Math.min(motionLevel / (this.motionThreshold * 2), 1);
    this.adaptiveStrength = this.strength * (1 - normalizedMotion * 0.7);
  }
  
  _strongSmooth(currentFrame, width, height) {
    if (this.frameHistory.length < 2) {
      return new Uint8ClampedArray(currentFrame);
    }
    
    const output = new Uint8ClampedArray(currentFrame.length);
    const frameCount = Math.min(this.frameHistory.length + 1, this.windowSize);
    const useFrames = this.frameHistory.slice(-frameCount + 1);
    
    for (let i = 0; i < currentFrame.length; i += 4) {
      let r = currentFrame[i] * this.weights[frameCount - 1];
      let g = currentFrame[i + 1] * this.weights[frameCount - 1];
      let b = currentFrame[i + 2] * this.weights[frameCount - 1];
      
      for (let f = 0; f < useFrames.length; f++) {
        const weightIdx = frameCount - useFrames.length + f;
        const w = this.weights[weightIdx] * 0.8;
        r += useFrames[f][i] * w;
        g += useFrames[f][i + 1] * w;
        b += useFrames[f][i + 2] * w;
      }
      
      output[i] = Math.round(r);
      output[i + 1] = Math.round(g);
      output[i + 2] = Math.round(b);
      output[i + 3] = currentFrame[i + 3];
    }
    
    return output;
  }
  
  _adaptiveSmooth(currentFrame, width, height, motionLevel) {
    if (this.frameHistory.length === 0) {
      return new Uint8ClampedArray(currentFrame);
    }
    
    const output = new Uint8ClampedArray(currentFrame.length);
    const lastFrame = this.frameHistory[this.frameHistory.length - 1];
    const alpha = this.adaptiveStrength;
    const blockSize = 16;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        const blockMotion = this._getBlockMotion(x, y, width, height, blockSize);
        const localAlpha = alpha * (1 - Math.min(blockMotion / 50, 1) * 0.8);
        
        output[idx] = Math.round(currentFrame[idx] * (1 - localAlpha) + lastFrame[idx] * localAlpha);
        output[idx + 1] = Math.round(currentFrame[idx + 1] * (1 - localAlpha) + lastFrame[idx + 1] * localAlpha);
        output[idx + 2] = Math.round(currentFrame[idx + 2] * (1 - localAlpha) + lastFrame[idx + 2] * localAlpha);
        output[idx + 3] = currentFrame[idx + 3];
      }
    }
    
    return output;
  }
  
  _getBlockMotion(x, y, width, height, blockSize) {
    if (this.frameHistory.length < 2) return 0;
    
    const halfBlock = Math.floor(blockSize / 2);
    const startX = Math.max(0, x - halfBlock);
    const endX = Math.min(width - 1, x + halfBlock);
    const startY = Math.max(0, y - halfBlock);
    const endY = Math.min(height - 1, y + halfBlock);
    
    const current = this.frameHistory[this.frameHistory.length - 1];
    const previous = this.frameHistory[this.frameHistory.length - 2];
    
    let motion = 0;
    let count = 0;
    
    for (let by = startY; by <= endY; by += 2) {
      for (let bx = startX; bx <= endX; bx += 2) {
        const idx = (by * width + bx) * 4;
        motion += Math.abs(current[idx] - previous[idx]);
        motion += Math.abs(current[idx + 1] - previous[idx + 1]);
        motion += Math.abs(current[idx + 2] - previous[idx + 2]);
        count += 3;
      }
    }
    
    return motion / count;
  }
  
  _lightSmooth(currentFrame, width, height) {
    if (this.frameHistory.length === 0) {
      return new Uint8ClampedArray(currentFrame);
    }
    
    const output = new Uint8ClampedArray(currentFrame.length);
    const lastFrame = this.frameHistory[this.frameHistory.length - 1];
    const alpha = Math.max(0.1, this.adaptiveStrength * 0.3);
    
    for (let i = 0; i < currentFrame.length; i += 4) {
      output[i] = Math.round(currentFrame[i] * (1 - alpha) + lastFrame[i] * alpha);
      output[i + 1] = Math.round(currentFrame[i + 1] * (1 - alpha) + lastFrame[i + 1] * alpha);
      output[i + 2] = Math.round(currentFrame[i + 2] * (1 - alpha) + lastFrame[i + 2] * alpha);
      output[i + 3] = currentFrame[i + 3];
    }
    
    return output;
  }
  
  _colorCorrection(currentFrame, width, height) {
    let sumR = 0, sumG = 0, sumB = 0;
    const pixelCount = width * height;
    
    for (let i = 0; i < pixelCount * 4; i += 4 * 16) {
      sumR += currentFrame[i];
      sumG += currentFrame[i + 1];
      sumB += currentFrame[i + 2];
    }
    
    const sampleCount = Math.ceil(pixelCount / 16);
    const currentMean = {
      r: sumR / sampleCount,
      g: sumG / sampleCount,
      b: sumB / sampleCount
    };
    
    if (!this.lastMean) {
      this.lastMean = currentMean;
      return currentFrame;
    }
    
    const meanDiff = {
      r: currentMean.r - this.lastMean.r,
      g: currentMean.g - this.lastMean.g,
      b: currentMean.b - this.lastMean.b
    };
    
    const correctionStrength = 0.3;
    const output = new Uint8ClampedArray(currentFrame);
    
    for (let i = 0; i < pixelCount * 4; i += 4) {
      output[i] = Math.max(0, Math.min(255, currentFrame[i] - meanDiff.r * correctionStrength));
      output[i + 1] = Math.max(0, Math.min(255, currentFrame[i + 1] - meanDiff.g * correctionStrength));
      output[i + 2] = Math.max(0, Math.min(255, currentFrame[i + 2] - meanDiff.b * correctionStrength));
    }
    
    this.lastMean = {
      r: this.lastMean.r * 0.8 + currentMean.r * 0.2,
      g: this.lastMean.g * 0.8 + currentMean.g * 0.2,
      b: this.lastMean.b * 0.8 + currentMean.b * 0.2
    };
    
    return output;
  }
  
  _antiFlicker(currentFrame, width, height) {
    if (this.frameHistory.length === 0) {
      return currentFrame;
    }
    
    const lastFrame = this.frameHistory[this.frameHistory.length - 1];
    const output = new Uint8ClampedArray(currentFrame);
    const maxChange = this.maxPixelChange;
    
    for (let i = 0; i < currentFrame.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const diff = currentFrame[i + c] - lastFrame[i + c];
        if (Math.abs(diff) > maxChange) {
          output[i + c] = Math.round(lastFrame[i + c] + Math.sign(diff) * maxChange);
        }
      }
    }
    
    return output;
  }
  
  _addToHistory(frame, width, height) {
    const downsampled = this._downsampleFrame(frame, width, height, 4);
    this.frameHistory.push(downsampled);
    
    if (this.frameHistory.length > this.windowSize) {
      this.frameHistory.shift();
    }
  }
  
  _downsampleFrame(frame, width, height, factor) {
    const newWidth = Math.floor(width / factor);
    const newHeight = Math.floor(height / factor);
    const downsampled = new Uint8ClampedArray(newWidth * newHeight * 4);
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = x * factor;
        const srcY = y * factor;
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * newWidth + x) * 4;
        
        downsampled[dstIdx] = frame[srcIdx];
        downsampled[dstIdx + 1] = frame[srcIdx + 1];
        downsampled[dstIdx + 2] = frame[srcIdx + 2];
        downsampled[dstIdx + 3] = frame[srcIdx + 3];
      }
    }
    
    return downsampled;
  }
  
  reset() {
    this.frameHistory = [];
    this.motionHistory = [];
    this.lastMean = null;
    this.lastStd = null;
    this.adaptiveStrength = this.strength;
  }
  
  setStrength(strength) {
    this.strength = Math.max(0, Math.min(1, strength));
  }
  
  setMaxPixelChange(maxChange) {
    this.maxPixelChange = Math.max(1, maxChange);
  }
  
  getMotionLevel() {
    if (this.motionHistory.length === 0) return 0;
    return this.motionHistory.reduce((a, b) => a + b, 0) / this.motionHistory.length;
  }
  
  getAdaptiveStrength() {
    return this.adaptiveStrength;
  }
}
