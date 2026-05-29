class MathHandwritingApp {
  constructor() {
    this.canvas = document.getElementById('drawingCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.strokeHistory = [];
    this.currentStroke = [];
    this.undoStack = [];
    this.redoStack = [];
    this.recognizedSymbols = [];
    this.currentCandidates = [];
    this.suggestions = [];
    
    this.setupCanvas();
    this.setupEventListeners();
    this.resizeCanvas();
  }

  setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const newWidth = rect.width * window.devicePixelRatio;
    const newHeight = rect.height * window.devicePixelRatio;
    
    if (newWidth !== this.canvas.width || newHeight !== this.canvas.height) {
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.ctx.putImageData(imageData, 0, 0);
      
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    
    document.getElementById('clearBtn').addEventListener('click', this.clearCanvas.bind(this));
    document.getElementById('undoBtn').addEventListener('click', this.undo.bind(this));
    document.getElementById('redoBtn').addEventListener('click', this.redo.bind(this));
    document.getElementById('recognizeBtn').addEventListener('click', this.recognizeSymbol.bind(this));
    document.getElementById('recognizeAllBtn').addEventListener('click', this.recognizeAll.bind(this));
    document.getElementById('copyBtn').addEventListener('click', this.copyLatex.bind(this));
    document.getElementById('exportBtn').addEventListener('click', this.exportLatex.bind(this));
    
    document.querySelectorAll('.symbol-btn').forEach(btn => {
      btn.addEventListener('click', this.addSymbolFromPalette.bind(this));
    });
    
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  getCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  handleTouchStart(e) {
    e.preventDefault();
    const coords = this.getCoordinates(e);
    this.startDrawing({ clientX: coords.x + this.canvas.getBoundingClientRect().left, clientY: coords.y + this.canvas.getBoundingClientRect().top });
  }

  handleTouchMove(e) {
    e.preventDefault();
    const coords = this.getCoordinates(e);
    this.draw({ clientX: coords.x + this.canvas.getBoundingClientRect().left, clientY: coords.y + this.canvas.getBoundingClientRect().top });
  }

  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
    this.currentStroke = [{ x: this.lastX, y: this.lastY }];
  }

  draw(e) {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(currentX, currentY);
    this.ctx.stroke();
    
    this.currentStroke.push({ x: currentX, y: currentY });
    this.lastX = currentX;
    this.lastY = currentY;
  }

  stopDrawing() {
    if (this.isDrawing && this.currentStroke.length > 1) {
      this.strokeHistory.push([...this.currentStroke]);
    }
    this.isDrawing = false;
    this.currentStroke = [];
  }

  clearCanvas() {
    if (this.strokeHistory.length > 0) {
      this.undoStack.push([...this.strokeHistory]);
      this.redoStack = [];
    }
    
    this.strokeHistory = [];
    this.recognizedSymbols = [];
    this.currentCandidates = [];
    
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    
    this.updateUI();
  }

  undo() {
    if (this.strokeHistory.length === 0) return;
    
    this.redoStack.push([...this.strokeHistory]);
    this.strokeHistory.pop();
    
    this.redrawCanvas();
    this.updateUI();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    
    const restored = this.redoStack.pop();
    this.strokeHistory = restored;
    
    this.redrawCanvas();
    this.updateUI();
  }

  redrawCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    
    this.strokeHistory.forEach(stroke => {
      if (stroke.length < 2) return;
      
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      
      for (let i = 1; i < stroke.length; i++) {
        this.ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      
      this.ctx.stroke();
    });
  }

  recognizeSymbol() {
    if (this.strokeHistory.length === 0) return;
    
    const lastStroke = this.strokeHistory[this.strokeHistory.length - 1];
    if (!lastStroke || lastStroke.length < 2) return;
    
    const strokeCanvas = this.createStrokeCanvas(lastStroke);
    const result = Recognizer.recognize(strokeCanvas);
    
    if (result.success && result.results.length > 0) {
      const bestMatch = result.results[0];
      this.recognizedSymbols.push(bestMatch);
      this.currentCandidates = result.results.slice(0, 5);
      
      this.strokeHistory.pop();
      this.redrawCanvas();
    }
    
    this.updateUI();
  }

  createStrokeCanvas(stroke) {
    const padding = 10;
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    stroke.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
    
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(width, 28);
    canvas.height = Math.max(height, 28);
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(stroke[0].x - minX + padding, stroke[0].y - minY + padding);
    
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x - minX + padding, stroke[i].y - minY + padding);
    }
    
    ctx.stroke();
    
    return canvas;
  }

  recognizeAll() {
    if (this.strokeHistory.length === 0) return;
    
    const results = [];
    
    this.strokeHistory.forEach(stroke => {
      if (stroke.length < 2) return;
      
      const strokeCanvas = this.createStrokeCanvas(stroke);
      const result = Recognizer.recognize(strokeCanvas);
      
      if (result.success && result.results.length > 0) {
        results.push(result.results[0]);
      }
    });
    
    const combined = [...this.recognizedSymbols, ...results];
    this.recognizedSymbols = SymbolRecognizer.detectMultiCharSymbols(combined);
    this.strokeHistory = [];
    this.redrawCanvas();
    
    this.updateUI();
  }

  checkSymbolSuggestions() {
    if (this.recognizedSymbols.length < 2) {
      this.suggestions = [];
      this.updateSuggestions();
      return;
    }
    
    const lastTwo = this.recognizedSymbols.slice(-2);
    if (lastTwo.length === 2) {
      const combined = lastTwo[0].symbol + lastTwo[1].symbol;
      this.suggestions = SymbolRecognizer.suggestSymbols(combined);
    } else {
      this.suggestions = [];
    }
    
    this.updateSuggestions();
  }

  applySuggestion(suggestion) {
    if (this.recognizedSymbols.length >= 2) {
      this.recognizedSymbols.pop();
      this.recognizedSymbols.pop();
    }
    
    this.recognizedSymbols.push({
      symbol: suggestion.symbol,
      latex: suggestion.latex,
      category: suggestion.category,
      confidence: 95
    });
    
    this.suggestions = [];
    this.updateUI();
  }

  updateSuggestions() {
    const container = document.getElementById('suggestions');
    
    if (!container) return;
    
    if (this.suggestions.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }
    
    container.innerHTML = `
      <div class="suggestions-header">
        <span>💡 建议符号</span>
        <span class="suggestions-hint">点击替换最后两个符号</span>
      </div>
      <div class="suggestions-list">
        ${this.suggestions.map((s, i) => `
          <div class="suggestion-item" onclick="app.applySuggestion(${JSON.stringify(s).replace(/"/g, '&quot;')})">
            <span class="suggestion-symbol">${s.symbol}</span>
            <span class="suggestion-latex">${s.latex}</span>
          </div>
        `).join('')}
      </div>
    `;
    container.style.display = 'block';
  }

  addSymbolFromPalette(e) {
    const symbolKey = e.target.dataset.symbol;
    const symbolInfo = SymbolRecognizer.getSymbolByKey(symbolKey);
    
    if (symbolInfo) {
      this.recognizedSymbols.push({
        symbol: symbolKey,
        latex: symbolInfo.latex,
        category: symbolInfo.category,
        confidence: 100
      });
      
      this.updateUI();
    }
  }

  removeSymbol(index) {
    this.recognizedSymbols.splice(index, 1);
    this.updateUI();
  }

  selectCandidate(candidate) {
    this.recognizedSymbols.push(candidate);
    this.currentCandidates = [];
    this.updateUI();
  }

  updateUI() {
    this.updateRecognizedSymbols();
    this.updateLatexOutput();
    this.updateFormulaPreview();
    this.updateCandidates();
    this.checkSymbolSuggestions();
  }

  updateRecognizedSymbols() {
    const container = document.getElementById('recognizedSymbols');
    
    if (this.recognizedSymbols.length === 0) {
      container.innerHTML = '<span style="color: #64748b; font-style: italic;">暂无识别结果</span>';
      return;
    }
    
    container.innerHTML = this.recognizedSymbols.map((sym, index) => `
      <div class="symbol-tag">
        <span>${sym.symbol}</span>
        <span class="confidence">${sym.confidence}%</span>
        <span class="remove-btn" onclick="app.removeSymbol(${index})">×</span>
      </div>
    `).join('');
  }

  updateLatexOutput() {
    const latex = this.generateLatex();
    document.getElementById('latexOutput').value = latex;
  }

  updateFormulaPreview() {
    const container = document.getElementById('formulaPreview');
    const latex = this.generateLatex();
    
    if (!latex.trim()) {
      container.innerHTML = '<span style="color: #64748b;">在此预览公式</span>';
      return;
    }
    
    container.innerHTML = '';
    
    try {
      katex.render(latex, container, {
        throwOnError: false,
        displayMode: true
      });
    } catch (e) {
      container.innerHTML = `<span style="color: #ef4444;">${e.message}</span>`;
    }
  }

  updateCandidates() {
    const container = document.getElementById('candidates');
    
    if (this.currentCandidates.length === 0) {
      container.innerHTML = '<span style="color: #64748b; font-style: italic;">点击"识别当前符号"查看候选</span>';
      return;
    }
    
    container.innerHTML = this.currentCandidates.map((candidate, index) => `
      <div class="candidate-item" onclick="app.selectCandidate(${JSON.stringify(candidate).replace(/"/g, '&quot;')})">
        <span class="symbol">${candidate.symbol}</span>
        <span class="confidence">${candidate.confidence}%</span>
      </div>
    `).join('');
  }

  generateLatex() {
    if (this.recognizedSymbols.length === 0) return '';
    
    let latex = '';
    let prevSymbol = null;
    
    this.recognizedSymbols.forEach(sym => {
      const symInfo = SymbolRecognizer.getSymbolByKey(sym.symbol);
      if (!symInfo) return;
      
      let currentLatex = symInfo.latex;
      
      if (prevSymbol) {
        const prevInfo = SymbolRecognizer.getSymbolByKey(prevSymbol);
        
        if (prevInfo) {
          const prevIsLetterOrNumber = prevInfo.category === 'letters' || prevInfo.category === 'numbers';
          const currentIsLetterOrNumber = symInfo.category === 'letters' || symInfo.category === 'numbers';
          const prevIsCloseParen = prevInfo.key === ')' || prevInfo.key === ']' || prevInfo.key === '}';
          const currentIsOpenParen = symInfo.key === '(' || symInfo.key === '[' || symInfo.key === '{';
          
          if ((prevIsLetterOrNumber && currentIsLetterOrNumber) ||
              (prevIsCloseParen && currentIsLetterOrNumber) ||
              (prevIsLetterOrNumber && currentIsOpenParen) ||
              (prevIsCloseParen && currentIsOpenParen)) {
            latex += ' \\cdot ';
          }
        }
      }
      
      latex += currentLatex;
      prevSymbol = sym.symbol;
    });
    
    return latex;
  }

  copyLatex() {
    const latex = this.generateLatex();
    
    if (!latex.trim()) {
      alert('没有可复制的内容');
      return;
    }
    
    navigator.clipboard.writeText(latex).then(() => {
      const copyBtn = document.getElementById('copyBtn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '已复制!';
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    }).catch(() => {
      alert('复制失败，请手动复制');
    });
  }

  exportLatex() {
    const latex = this.generateLatex();
    
    if (!latex.trim()) {
      alert('没有可导出的内容');
      return;
    }
    
    const content = `\\[ ${latex} \\]`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formula.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

const app = new MathHandwritingApp();

document.addEventListener('DOMContentLoaded', () => {
  renderMathInElement(document.body, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true }
    ]
  });
});