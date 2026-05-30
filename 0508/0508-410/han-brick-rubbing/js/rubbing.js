export class RubbingEngine {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.phase = 'ink';
    this.inkCoverage = 0;

    this._createCanvases();
  }

  _createCanvases() {
    this.patternCanvas = this._makeCanvas();
    this.inkCanvas = this._makeCanvas();
    this.pressureCanvas = this._makeCanvas();
    this.resultCanvas = this._makeCanvas();
    this.inkCtx = this.inkCanvas.getContext('2d');
    this.pressureCtx = this.pressureCanvas.getContext('2d');
    this.resultCtx = this.resultCanvas.getContext('2d');
    this.patternCtx = this.patternCanvas.getContext('2d');
  }

  _makeCanvas() {
    const c = document.createElement('canvas');
    c.width = this.width;
    c.height = this.height;
    return c;
  }

  setPattern(patternCanvas) {
    this.patternCtx.clearRect(0, 0, this.width, this.height);
    this.patternCtx.drawImage(patternCanvas, 0, 0);
  }

  reset() {
    this.phase = 'ink';
    this.inkCoverage = 0;
    this.inkCtx.clearRect(0, 0, this.width, this.height);
    this.pressureCtx.clearRect(0, 0, this.width, this.height);
    this.resultCtx.clearRect(0, 0, this.width, this.height);
  }

  applyInk(x, y, radius) {
    if (this.phase !== 'ink') return;
    const r = radius || 25;
    const grad = this.inkCtx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(20,15,10,0.6)');
    grad.addColorStop(0.5, 'rgba(20,15,10,0.35)');
    grad.addColorStop(1, 'rgba(20,15,10,0)');
    this.inkCtx.fillStyle = grad;
    this.inkCtx.beginPath();
    this.inkCtx.arc(x, y, r, 0, Math.PI * 2);
    this.inkCtx.fill();
  }

  layPaper() {
    if (this.phase !== 'ink') return false;
    this.phase = 'press';
    return true;
  }

  applyPressure(x, y, radius, intensity) {
    if (this.phase !== 'press') return;
    const r = radius || 20;
    const baseAlpha = intensity || 0.15;
    const grad = this.pressureCtx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(255,255,255,${baseAlpha})`);
    grad.addColorStop(0.6, `rgba(255,255,255,${baseAlpha * 0.5})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    this.pressureCtx.fillStyle = grad;
    this.pressureCtx.beginPath();
    this.pressureCtx.arc(x, y, r, 0, Math.PI * 2);
    this.pressureCtx.fill();
  }

  reveal() {
    if (this.phase !== 'press') return false;
    this.phase = 'done';
    this._computeResult();
    return true;
  }

  _computeResult() {
    const w = this.width, h = this.height;

    const patternData = this.patternCtx.getImageData(0, 0, w, h);
    const inkData = this.inkCtx.getImageData(0, 0, w, h);
    const pressureData = this.pressureCtx.getImageData(0, 0, w, h);
    const resultData = this.resultCtx.createImageData(w, h);

    const P = patternData.data;
    const I = inkData.data;
    const Pr = pressureData.data;
    const R = resultData.data;

    const paperR = 245, paperG = 235, paperB = 215;
    const inkR = 25, inkG = 20, inkB = 15;

    for (let i = 0; i < P.length; i += 4) {
      const patternVal = (P[i] + P[i + 1] + P[i + 2]) / (3 * 255);
      const inkVal = I[i + 3] / 255;
      const pressureVal = Pr[i + 3] / 255;

      const isRaised = patternVal > 0.3;
      const patternFactor = isRaised
        ? Math.min(patternVal / 0.85, 1)
        : patternVal * 0.08;

      let transfer;
      if (pressureVal < 0.1) {
        transfer = 0;
      } else if (pressureVal < 0.25) {
        const ramp = (pressureVal - 0.1) / 0.15;
        transfer = patternFactor * inkVal * Math.min(ramp * pressureVal * 2.2, 1);
      } else if (pressureVal < 0.7) {
        transfer = patternFactor * inkVal * Math.min(pressureVal * 1.4, 1);
      } else if (pressureVal < 0.88) {
        const optimal = 0.8;
        const t = (pressureVal - 0.7) / 0.18;
        const falloff = 1 - t * t * 0.15;
        transfer = patternFactor * inkVal * Math.min(pressureVal * 1.2, 1) * falloff;
      } else {
        const overpress = (pressureVal - 0.88) / 0.12;
        transfer = patternFactor * inkVal * Math.min(pressureVal * 1.0, 1);
        if (overpress > 0) {
          transfer = Math.min(transfer + overpress * 0.08, 1);
        }
      }

      if (!isRaised && pressureVal > 0.88) {
        const bleed = (pressureVal - 0.88) / 0.12;
        transfer = Math.min(transfer + bleed * patternVal * 0.08 * inkVal, 1);
      }

      transfer = Math.min(transfer, 1);

      R[i] = Math.round(paperR + (inkR - paperR) * transfer);
      R[i + 1] = Math.round(paperG + (inkG - paperG) * transfer);
      R[i + 2] = Math.round(paperB + (inkB - paperB) * transfer);
      R[i + 3] = 255;
    }

    this.resultCtx.putImageData(resultData, 0, 0);

    if (this._getMaxPressure() > 0.88) {
      this._applyBleedEffect();
    }

    this._applyPaperTexture();
  }

  _getMaxPressure() {
    const w = this.width, h = this.height;
    const data = this.pressureCtx.getImageData(0, 0, w, h).data;
    let maxP = 0;
    for (let i = 0; i < data.length; i += 16) {
      const val = data[i + 3] / 255;
      if (val > maxP) maxP = val;
    }
    return maxP;
  }

  _applyBleedEffect() {
    const maxP = this._getMaxPressure();
    const bleedStrength = Math.min((maxP - 0.88) / 0.12, 1);
    const tempCanvas = this._makeCanvas();
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.filter = `blur(${0.4 + bleedStrength * 0.8}px)`;
    tempCtx.drawImage(this.resultCanvas, 0, 0);
    this.resultCtx.globalAlpha = 0.1 + bleedStrength * 0.15;
    this.resultCtx.drawImage(tempCanvas, 0, 0);
    this.resultCtx.globalAlpha = 1.0;
  }

  _applyPaperTexture() {
    const ctx = this.resultCtx;
    const w = this.width, h = this.height;
    ctx.save();
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const alpha = Math.random() * 0.04;
      ctx.fillStyle = `rgba(180,160,130,${alpha})`;
      ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const len = 5 + Math.random() * 15;
      const alpha = Math.random() * 0.03;
      ctx.strokeStyle = `rgba(200,180,150,${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.random() * len - len / 2, y + len);
      ctx.stroke();
    }
    ctx.restore();
  }

  getInkCoverage() {
    const data = this.inkCtx.getImageData(0, 0, this.width, this.height).data;
    let total = 0, covered = 0;
    for (let i = 0; i < data.length; i += 4) {
      total++;
      if (data[i + 3] > 10) covered++;
    }
    return covered / total;
  }

  getPressureUniformity() {
    const w = this.width, h = this.height;
    const data = this.pressureCtx.getImageData(0, 0, w, h).data;
    const gridSize = 20;
    const cols = Math.ceil(w / gridSize);
    const rows = Math.ceil(h / gridSize);
    const grid = new Float32Array(cols * rows);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const val = data[idx + 3] / 255;
        const gx = Math.floor(x / gridSize);
        const gy = Math.floor(y / gridSize);
        grid[gy * cols + gx] += val;
      }
    }

    const cellArea = gridSize * gridSize;
    let count = 0, sum = 0, sumSq = 0;
    for (let i = 0; i < grid.length; i++) {
      const avg = grid[i] / cellArea;
      if (avg > 0.01) {
        count++;
        sum += avg;
        sumSq += avg * avg;
      }
    }

    if (count === 0) return 0;
    const mean = sum / count;
    const variance = sumSq / count - mean * mean;
    return Math.max(0, 1 - Math.sqrt(variance) / (mean + 0.001));
  }

  getResultDataURL() {
    return this.resultCanvas.toDataURL('image/png');
  }
}
