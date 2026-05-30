import { drawPattern, getPatternList } from './patterns.js';
import { RubbingEngine } from './rubbing.js';
import { drawInscription, drawSeal, getSealStyles } from './seal.js';

const CANVAS_W = 420;
const CANVAS_H = 560;

class App {
  constructor() {
    this.currentPattern = 'azureDragon';
    this.engine = new RubbingEngine(CANVAS_W, CANVAS_H);
    this.isMouseDown = false;
    this.lastMousePos = null;
    this.inscriptions = [];
    this.seals = [];
    this.sealStyle = 'square';
    this.sealText = '拓印';
    this.placingSeal = false;
    this._pendingSealPos = null;
    this._patternCache = null;
    this._indicatorThrottle = 0;
    this._paperTextureCache = null;
    this._brickPaperTextureCache = null;

    this._cacheDOM();
    this._initPatternSelector();
    this._initSealSelector();
    this._initTextureCaches();
    this._bindEvents();
    this._loadPattern();
    this._updateUI();
  }

  _cacheDOM() {
    this.brickCanvas = document.getElementById('brick-canvas');
    this.paperCanvas = document.getElementById('paper-canvas');
    this.brickCtx = this.brickCanvas.getContext('2d');
    this.paperCtx = this.paperCanvas.getContext('2d');

    this.brickCanvas.width = CANVAS_W;
    this.brickCanvas.height = CANVAS_H;
    this.paperCanvas.width = CANVAS_W;
    this.paperCanvas.height = CANVAS_H;

    this.btnInk = document.getElementById('btn-ink');
    this.btnPaper = document.getElementById('btn-paper');
    this.btnReveal = document.getElementById('btn-reveal');
    this.btnReset = document.getElementById('btn-reset');
    this.btnReset2 = document.getElementById('btn-reset2');

    this.patternSelector = document.getElementById('pattern-selector');
    this.statusText = document.getElementById('status-text');
    this.inkIndicator = document.getElementById('ink-indicator');
    this.pressureIndicator = document.getElementById('pressure-indicator');

    this.inscriptionInput = document.getElementById('inscription-input');
    this.btnAddInscription = document.getElementById('btn-add-inscription');
    this.sealTextInput = document.getElementById('seal-text-input');
    this.sealStyleSelector = document.getElementById('seal-style-selector');
    this.btnAddSeal = document.getElementById('btn-add-seal');

    this.btnStampSeal = document.getElementById('btn-stamp-seal');
    this.btnCancelSeal = document.getElementById('btn-cancel-seal');
    this.sealPlacementHint = document.getElementById('seal-placement-hint');

    this.btnSave = document.getElementById('btn-save');

    this.stepInk = document.getElementById('step-ink');
    this.stepPaper = document.getElementById('step-paper');
    this.stepPress = document.getElementById('step-press');
    this.stepReveal = document.getElementById('step-reveal');
  }

  _initPatternSelector() {
    const patterns = getPatternList();
    this.patternSelector.innerHTML = '';
    patterns.forEach(p => {
      const btn = document.createElement('button');
      btn.textContent = p.name;
      btn.dataset.key = p.key;
      if (p.key === this.currentPattern) btn.classList.add('active');
      btn.addEventListener('click', () => {
        if (this.engine.phase !== 'ink') return;
        this.currentPattern = p.key;
        this.patternSelector.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._loadPattern();
      });
      this.patternSelector.appendChild(btn);
    });
  }

  _initSealSelector() {
    const styles = getSealStyles();
    this.sealStyleSelector.innerHTML = '';
    styles.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.key;
      opt.textContent = s.name;
      this.sealStyleSelector.appendChild(opt);
    });
    this.sealStyleSelector.value = this.sealStyle;
  }

  _bindEvents() {
    this.btnInk.addEventListener('click', () => this._activateInkMode());
    this.btnPaper.addEventListener('click', () => this._layPaper());
    this.btnReveal.addEventListener('click', () => this._reveal());
    this.btnReset.addEventListener('click', () => this._reset());
    this.btnReset2.addEventListener('click', () => this._reset());

    this.btnAddInscription.addEventListener('click', () => this._addInscription());
    this.btnAddSeal.addEventListener('click', () => this._startSealPlacement());
    this.btnStampSeal.addEventListener('click', () => this._confirmSeal());
    this.btnCancelSeal.addEventListener('click', () => this._cancelSealPlacement());
    this.sealStyleSelector.addEventListener('change', (e) => {
      this.sealStyle = e.target.value;
    });

    this.btnSave.addEventListener('click', () => this._saveImage());

    this.brickCanvas.addEventListener('mousedown', (e) => this._onMouseDown(e, 'brick'));
    this.brickCanvas.addEventListener('mousemove', (e) => this._onMouseMove(e, 'brick'));
    this.brickCanvas.addEventListener('mouseup', () => this._onMouseUp());
    this.brickCanvas.addEventListener('mouseleave', () => this._onMouseUp());

    this.brickCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._onMouseDown(e.touches[0], 'brick');
    }, { passive: false });
    this.brickCanvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this._onMouseMove(e.touches[0], 'brick');
    }, { passive: false });
    this.brickCanvas.addEventListener('touchend', () => this._onMouseUp());

    this.paperCanvas.addEventListener('mousedown', (e) => this._onMouseDown(e, 'paper'));
    this.paperCanvas.addEventListener('mousemove', (e) => this._onMouseMove(e, 'paper'));
    this.paperCanvas.addEventListener('mouseup', () => this._onMouseUp());
    this.paperCanvas.addEventListener('mouseleave', () => this._onMouseUp());

    this.paperCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._onMouseDown(e.touches[0], 'paper');
    }, { passive: false });
    this.paperCanvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this._onMouseMove(e.touches[0], 'paper');
    }, { passive: false });
    this.paperCanvas.addEventListener('touchend', () => this._onMouseUp());
  }

  _getCanvasPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  _onMouseDown(e, target) {
    this.isMouseDown = true;
    const canvas = target === 'brick' ? this.brickCanvas : this.paperCanvas;
    const pos = this._getCanvasPos(e, canvas);
    this.lastMousePos = pos;

    if (this.placingSeal && target === 'paper') {
      this._placeSealAt(pos.x, pos.y);
      return;
    }

    if (target === 'brick') {
      if (this.engine.phase === 'ink') {
        this.engine.applyInk(pos.x, pos.y, 28);
        this._drawBrickView();
        this._updateIndicators();
      } else if (this.engine.phase === 'press') {
        this.engine.applyPressure(pos.x, pos.y, 22, 0.18);
        this._drawBrickView();
        this._drawPaperView();
      }
    }

    if (target === 'paper' && this.engine.phase === 'press') {
      this.engine.applyPressure(pos.x, pos.y, 22, 0.18);
      this._drawPaperView();
      this._drawBrickView();
    }
  }

  _onMouseMove(e, target) {
    if (!this.isMouseDown) return;
    const canvas = target === 'brick' ? this.brickCanvas : this.paperCanvas;
    const pos = this._getCanvasPos(e, canvas);

    if (target === 'brick') {
      if (this.engine.phase === 'ink') {
        this.engine.applyInk(pos.x, pos.y, 28);
        this._drawBrickView();
        this._throttledIndicatorUpdate();
      } else if (this.engine.phase === 'press') {
        const speed = this.lastMousePos
          ? Math.hypot(pos.x - this.lastMousePos.x, pos.y - this.lastMousePos.y)
          : 0;
        const intensity = Math.min(0.25, 0.12 + speed * 0.003);
        this.engine.applyPressure(pos.x, pos.y, 22, intensity);
        this._drawBrickView();
        this._drawPaperView();
        this._throttledIndicatorUpdate();
      }
    }

    if (target === 'paper' && this.engine.phase === 'press') {
      const speed = this.lastMousePos
        ? Math.hypot(pos.x - this.lastMousePos.x, pos.y - this.lastMousePos.y)
        : 0;
      const intensity = Math.min(0.25, 0.12 + speed * 0.003);
      this.engine.applyPressure(pos.x, pos.y, 22, intensity);
      this._drawPaperView();
      this._drawBrickView();
      this._throttledIndicatorUpdate();
    }

    this.lastMousePos = pos;
  }

  _onMouseUp() {
    this.isMouseDown = false;
    this.lastMousePos = null;
  }

  _loadPattern() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_W;
    tempCanvas.height = CANVAS_H;
    const tempCtx = tempCanvas.getContext('2d');
    drawPattern(tempCtx, this.currentPattern, CANVAS_W, CANVAS_H);
    this._patternCache = tempCanvas;
    this.engine.setPattern(tempCanvas);
    this.engine.reset();
    this._drawBrickView();
    this._drawPaperView();
    this._updateUI();
  }

  _activateInkMode() {
    if (this.engine.phase !== 'ink') return;
    this.brickCanvas.style.cursor = 'crosshair';
    this.statusText.textContent = '请在砖面上涂抹墨汁（按住鼠标拖动）';
  }

  _layPaper() {
    if (!this.engine.layPaper()) {
      if (this.engine.phase === 'ink') {
        this.statusText.textContent = '请先在砖面上涂抹墨汁！';
      }
      return;
    }
    this.brickCanvas.style.cursor = 'grab';
    this.statusText.textContent = '请在砖面/宣纸上均匀按压（按住鼠标拖动）';
    this._drawBrickView();
    this._drawPaperView();
    this._updateUI();
  }

  _reveal() {
    if (!this.engine.reveal()) {
      this.statusText.textContent = '请先铺纸并按压！';
      return;
    }
    this._drawPaperView();
    this._drawBrickView();
    const uniformity = this.engine.getPressureUniformity();
    let quality;
    if (uniformity > 0.7) quality = '上品';
    else if (uniformity > 0.4) quality = '中品';
    else quality = '下品';
    this.statusText.textContent = `拓印完成（${quality}）！可添加题跋和钤印`;
    this._updateUI();
  }

  _reset() {
    this.engine.reset();
    this.inscriptions = [];
    this.seals = [];
    this.placingSeal = false;
    this.sealPlacementHint.style.display = 'none';
    this._loadPattern();
    this._drawBrickView();
    this._drawPaperView();
    this._updateUI();
  }

  _drawBrickView() {
    this.brickCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (this._patternCache) {
      this.brickCtx.drawImage(this._patternCache, 0, 0);
    }

    if (this.engine.phase === 'ink') {
      this.brickCtx.globalAlpha = 0.6;
      this.brickCtx.drawImage(this.engine.inkCanvas, 0, 0);
      this.brickCtx.globalAlpha = 1;
    }

    if (this.engine.phase === 'press') {
      this.brickCtx.fillStyle = 'rgba(240,230,210,0.55)';
      this.brickCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      this._drawPaperTexture(this.brickCtx, 0.15);
      this.brickCtx.globalAlpha = 0.25;
      this.brickCtx.drawImage(this.engine.pressureCanvas, 0, 0);
      this.brickCtx.globalAlpha = 1;
      this.brickCtx.strokeStyle = 'rgba(160,140,110,0.5)';
      this.brickCtx.lineWidth = 2;
      this.brickCtx.setLineDash([8, 4]);
      this.brickCtx.strokeRect(3, 3, CANVAS_W - 6, CANVAS_H - 6);
      this.brickCtx.setLineDash([]);
    }

    if (this.engine.phase === 'done') {
      this.brickCtx.globalAlpha = 0.4;
      this.brickCtx.fillStyle = '#3a2a1a';
      this.brickCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      this.brickCtx.globalAlpha = 1;
      this.brickCtx.fillStyle = 'rgba(200,180,150,0.8)';
      this.brickCtx.font = '18px KaiTi, STKaiti, SimSun, "Microsoft YaHei", "PingFang SC", serif';
      this.brickCtx.textAlign = 'center';
      this.brickCtx.textBaseline = 'middle';
      this.brickCtx.fillText('已揭纸', CANVAS_W / 2, CANVAS_H / 2);
    }
  }

  _drawPaperView() {
    this.paperCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    this.paperCtx.fillStyle = '#f5ebd7';
    this.paperCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    this._drawPaperTexture(this.paperCtx, 0.3);

    if (this.engine.phase === 'ink') {
      this.paperCtx.globalAlpha = 0.15;
      this.paperCtx.font = '16px KaiTi, STKaiti, SimSun, "Microsoft YaHei", "PingFang SC", serif';
      this.paperCtx.textAlign = 'center';
      this.paperCtx.textBaseline = 'middle';
      this.paperCtx.fillStyle = '#8a7a60';
      this.paperCtx.fillText('宣纸待用', CANVAS_W / 2, CANVAS_H / 2);
      this.paperCtx.globalAlpha = 1;
    }

    if (this.engine.phase === 'press') {
      this.paperCtx.globalAlpha = 0.15;
      this.paperCtx.drawImage(this.engine.patternCanvas, 0, 0);
      this.paperCtx.globalAlpha = 0.2;
      this.paperCtx.drawImage(this.engine.pressureCanvas, 0, 0);
      this.paperCtx.globalAlpha = 1;

      this.paperCtx.fillStyle = 'rgba(160,140,110,0.4)';
      this.paperCtx.font = '14px KaiTi, STKaiti, SimSun, "Microsoft YaHei", "PingFang SC", serif';
      this.paperCtx.textAlign = 'center';
      this.paperCtx.textBaseline = 'middle';
      this.paperCtx.fillText('按压预览 · 请继续均匀按压', CANVAS_W / 2, CANVAS_H - 30);
    }

    if (this.engine.phase === 'done') {
      this.paperCtx.drawImage(this.engine.resultCanvas, 0, 0);
      this._drawDecorations();
    }
  }

  _initTextureCaches() {
    this._paperTextureCache = this._createTextureCanvas(0.3);
    this._brickPaperTextureCache = this._createTextureCanvas(0.15);
  }

  _createTextureCanvas(intensity) {
    const c = document.createElement('canvas');
    c.width = CANVAS_W;
    c.height = CANVAS_H;
    const ctx = c.getContext('2d');
    for (let i = 0; i < 200 * intensity; i++) {
      const x = Math.random() * CANVAS_W;
      const y = Math.random() * CANVAS_H;
      const alpha = Math.random() * 0.02 * intensity;
      ctx.fillStyle = `rgba(180,160,130,${alpha})`;
      ctx.fillRect(x, y, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }
    return c;
  }

  _drawPaperTexture(ctx, intensity) {
    const cache = intensity > 0.2 ? this._paperTextureCache : this._brickPaperTextureCache;
    if (cache) {
      ctx.drawImage(cache, 0, 0);
    }
  }

  _drawDecorations() {
    this.inscriptions.forEach(ins => {
      drawInscription(this.paperCtx, ins.text, ins.x, ins.y, {
        fontSize: ins.fontSize || 16,
        vertical: ins.vertical !== false
      });
    });

    this.seals.forEach(s => {
      drawSeal(this.paperCtx, s.style, s.x, s.y, s.text, s.size || 48);
    });

    if (this.placingSeal && this._pendingSealPos) {
      this.paperCtx.globalAlpha = 0.5;
      drawSeal(this.paperCtx, this.sealStyle, this._pendingSealPos.x, this._pendingSealPos.y, this.sealText, 48);
      this.paperCtx.globalAlpha = 1;
    }
  }

  _addInscription() {
    if (this.engine.phase !== 'done') {
      this.statusText.textContent = '请先完成拓印！';
      return;
    }
    const text = this.inscriptionInput.value.trim();
    if (!text) {
      this.statusText.textContent = '请输入题跋文字';
      return;
    }
    const x = CANVAS_W - 40;
    const y = 30;
    this.inscriptions.push({ text, x, y, fontSize: 16, vertical: true });
    this.inscriptionInput.value = '';
    this._drawPaperView();
    this.statusText.textContent = '题跋已添加';
  }

  _startSealPlacement() {
    if (this.engine.phase !== 'done') {
      this.statusText.textContent = '请先完成拓印！';
      return;
    }
    this.sealText = this.sealTextInput.value.trim() || '拓印';
    this.sealStyle = this.sealStyleSelector.value;
    this.placingSeal = true;
    this._pendingSealPos = null;
    this.paperCanvas.style.cursor = 'pointer';
    this.sealPlacementHint.style.display = 'block';
    this.statusText.textContent = '请点击宣纸上的位置放置印章';
  }

  _placeSealAt(x, y) {
    this._pendingSealPos = { x, y };
    this._drawPaperView();
  }

  _confirmSeal() {
    if (!this._pendingSealPos) {
      this.statusText.textContent = '请先在宣纸上点击选择位置';
      return;
    }
    this.seals.push({
      style: this.sealStyle,
      x: this._pendingSealPos.x,
      y: this._pendingSealPos.y,
      text: this.sealText,
      size: 48
    });
    this.placingSeal = false;
    this._pendingSealPos = null;
    this.paperCanvas.style.cursor = 'default';
    this.sealPlacementHint.style.display = 'none';
    this._drawPaperView();
    this.statusText.textContent = '印章已盖';
  }

  _cancelSealPlacement() {
    this.placingSeal = false;
    this._pendingSealPos = null;
    this.paperCanvas.style.cursor = 'default';
    this.sealPlacementHint.style.display = 'none';
    this._drawPaperView();
  }

  _saveImage() {
    if (this.engine.phase !== 'done') {
      this.statusText.textContent = '请先完成拓印！';
      return;
    }

    const saveCanvas = document.createElement('canvas');
    saveCanvas.width = CANVAS_W;
    saveCanvas.height = CANVAS_H;
    const saveCtx = saveCanvas.getContext('2d');

    saveCtx.drawImage(this.engine.resultCanvas, 0, 0);

    this.inscriptions.forEach(ins => {
      drawInscription(saveCtx, ins.text, ins.x, ins.y, {
        fontSize: ins.fontSize || 16,
        vertical: ins.vertical !== false
      });
    });

    this.seals.forEach(s => {
      drawSeal(saveCtx, s.style, s.x, s.y, s.text, s.size || 48);
    });

    const link = document.createElement('a');
    link.download = `汉砖拓印_${new Date().getTime()}.png`;
    link.href = saveCanvas.toDataURL('image/png');
    link.click();

    this.statusText.textContent = '图片已保存！';
  }

  _throttledIndicatorUpdate() {
    const now = Date.now();
    if (now - this._indicatorThrottle < 200) return;
    this._indicatorThrottle = now;
    this._updateIndicators();
  }

  _updateIndicators() {
    if (this.engine.phase === 'ink') {
      const coverage = this.engine.getInkCoverage();
      this.inkIndicator.style.width = `${Math.min(coverage * 300, 100)}%`;
    }
    if (this.engine.phase === 'press') {
      const uniformity = this.engine.getPressureUniformity();
      this.pressureIndicator.style.width = `${uniformity * 100}%`;
    }
  }

  _updateUI() {
    const phase = this.engine.phase;

    this.stepInk.classList.toggle('active', phase === 'ink');
    this.stepPaper.classList.toggle('active', phase === 'press');
    this.stepPress.classList.toggle('active', phase === 'press');
    this.stepReveal.classList.toggle('active', phase === 'done');

    this.stepInk.classList.toggle('completed', phase !== 'ink');
    this.stepPaper.classList.toggle('completed', phase === 'done');
    this.stepPress.classList.toggle('completed', phase === 'done');

    this.btnInk.disabled = phase !== 'ink';
    this.btnPaper.disabled = phase !== 'ink';
    this.btnReveal.disabled = phase !== 'press';

    this.patternSelector.querySelectorAll('button').forEach(b => {
      b.disabled = phase !== 'ink';
    });

    const decorationPanel = document.getElementById('decoration-panel');
    if (decorationPanel) {
      decorationPanel.style.display = phase === 'done' ? 'block' : 'none';
    }

    if (phase === 'ink') {
      this.brickCanvas.style.cursor = 'crosshair';
      this.statusText.textContent = '步骤一：在砖面上涂抹墨汁';
      this.inkIndicator.parentElement.style.display = 'block';
      this.pressureIndicator.parentElement.style.display = 'none';
    } else if (phase === 'press') {
      this.brickCanvas.style.cursor = 'grab';
      this.statusText.textContent = '步骤三：在宣纸上均匀按压';
      this.inkIndicator.parentElement.style.display = 'none';
      this.pressureIndicator.parentElement.style.display = 'block';
    } else if (phase === 'done') {
      this.brickCanvas.style.cursor = 'default';
      this.statusText.textContent = '拓印完成！可添加题跋和钤印';
      this.inkIndicator.parentElement.style.display = 'none';
      this.pressureIndicator.parentElement.style.display = 'none';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
