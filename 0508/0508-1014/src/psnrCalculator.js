export class PSNRCalculator {
  constructor() {
    this.rollingWindow = [];
    this.maxWindowSize = 30;
    this.lastPSNR = 0;
  }
  
  calculate(originalData, enhancedData, width, height) {
    const pixelCount = width * height;
    let mse = 0;
    
    for (let i = 0; i < pixelCount * 4; i += 4) {
      const rDiff = originalData[i] - enhancedData[i];
      const gDiff = originalData[i + 1] - enhancedData[i + 1];
      const bDiff = originalData[i + 2] - enhancedData[i + 2];
      
      mse += rDiff * rDiff + gDiff * gDiff + bDiff * bDiff;
    }
    
    mse /= (pixelCount * 3);
    
    if (mse === 0) {
      return Infinity;
    }
    
    const maxPixelValue = 255;
    const psnr = 10 * Math.log10((maxPixelValue * maxPixelValue) / mse);
    
    this._updateRollingAverage(psnr);
    
    return psnr;
  }
  
  calculateWithDownsampling(originalData, enhancedData, originalWidth, originalHeight, scaleFactor) {
    const downsampled = this._downsampleBicubic(
      enhancedData,
      originalWidth * scaleFactor,
      originalHeight * scaleFactor,
      scaleFactor
    );
    
    return this.calculate(originalData, downsampled, originalWidth, originalHeight);
  }
  
  _downsampleBicubic(data, width, height, scaleFactor) {
    const newWidth = Math.floor(width / scaleFactor);
    const newHeight = Math.floor(height / scaleFactor);
    const output = new Uint8ClampedArray(newWidth * newHeight * 4);
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = x * scaleFactor;
        const srcY = y * scaleFactor;
        
        const r = this._bicubicInterpolate(data, width, height, srcX, srcY, 0);
        const g = this._bicubicInterpolate(data, width, height, srcX, srcY, 1);
        const b = this._bicubicInterpolate(data, width, height, srcX, srcY, 2);
        
        const dstIdx = (y * newWidth + x) * 4;
        output[dstIdx] = r;
        output[dstIdx + 1] = g;
        output[dstIdx + 2] = b;
        output[dstIdx + 3] = 255;
      }
    }
    
    return output;
  }
  
  _bicubicInterpolate(data, width, height, x, y, channel) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    
    let sum = 0;
    let weightSum = 0;
    
    for (let j = -1; j <= 2; j++) {
      for (let i = -1; i <= 2; i++) {
        const px = Math.max(0, Math.min(width - 1, x0 + i));
        const py = Math.max(0, Math.min(height - 1, y0 + j));
        
        const weight = this._cubicKernel(i - fx) * this._cubicKernel(j - fy);
        const idx = (py * width + px) * 4 + channel;
        
        sum += data[idx] * weight;
        weightSum += weight;
      }
    }
    
    return Math.max(0, Math.min(255, sum / weightSum));
  }
  
  _cubicKernel(t) {
    const a = -0.5;
    const absT = Math.abs(t);
    
    if (absT <= 1) {
      return (a + 2) * absT * absT * absT - (a + 3) * absT * absT + 1;
    } else if (absT <= 2) {
      return a * absT * absT * absT - 5 * a * absT * absT + 8 * a * absT - 4 * a;
    }
    
    return 0;
  }
  
  _updateRollingAverage(psnr) {
    this.rollingWindow.push(psnr);
    if (this.rollingWindow.length > this.maxWindowSize) {
      this.rollingWindow.shift();
    }
    
    this.lastPSNR = this.rollingWindow.reduce((a, b) => a + b, 0) / this.rollingWindow.length;
  }
  
  getAveragePSNR() {
    return this.lastPSNR;
  }
  
  getWindowPSNR() {
    if (this.rollingWindow.length === 0) return 0;
    return this.rollingWindow.reduce((a, b) => a + b, 0) / this.rollingWindow.length;
  }
  
  reset() {
    this.rollingWindow = [];
    this.lastPSNR = 0;
  }
}
