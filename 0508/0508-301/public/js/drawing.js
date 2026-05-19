const BrushShape = {
  ROUND: 'round',
  SQUARE: 'square',
  BUTT: 'butt',
  PROJECTING: 'projecting',
  DIAMOND: 'diamond',
  STAR: 'star'
};

class DrawingManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isDrawing = false;
    this.currentTool = 'pen';
    this.color = '#000000';
    this.lineWidth = 3;
    this.opacity = 1;
    this.brushShape = BrushShape.ROUND;
    this.pressureEnabled = true;
    this.pressureSensitivity = 0.5;
    this.minLineWidth = 1;
    this.maxLineWidth = 15;
    
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.lastTimestamp = 0;
    this.lastVelocity = 0;
    this.imageData = null;
    this.drawCallback = null;
    this.pointsBuffer = [];

    this.setupCanvas();
    this.setupEvents();
  }

  setupCanvas() {
    this.canvas.width = Math.min(window.innerWidth - 40, 1920);
    this.canvas.height = Math.min(window.innerHeight - 160, 1080);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  setupEvents() {
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.endDrawing.bind(this));
    this.canvas.addEventListener('mouseleave', this.endDrawing.bind(this));

    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouch.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.endDrawing.bind(this));
  }

  handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const event = {
      clientX: touch.clientX,
      clientY: touch.clientY
    };

    if (e.type === 'touchstart') {
      this.startDrawing(event);
    } else if (e.type === 'touchmove') {
      this.draw(event);
    }
  }

  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
    this.lastX = this.startX;
    this.lastY = this.startY;
    this.lastTimestamp = Date.now();
    this.lastVelocity = 0;
    this.pointsBuffer = [{ x: this.startX, y: this.startY, width: this.lineWidth }];
    this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    if (this.currentTool === 'pen') {
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
      this.applyStrokeStyle();
      
      this.drawDot(this.startX, this.startY, this.lineWidth);
    }
  }

  draw(e) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch (this.currentTool) {
      case 'pen':
        this.drawPen(x, y);
        break;
      case 'rectangle':
        this.drawRectanglePreview(x, y);
        break;
      case 'circle':
        this.drawCirclePreview(x, y);
        break;
    }

    this.lastX = x;
    this.lastY = y;
  }

  calculateLineWidth(x, y) {
    if (!this.pressureEnabled) {
      return this.lineWidth;
    }

    const now = Date.now();
    const dt = now - this.lastTimestamp;
    this.lastTimestamp = now;

    if (dt === 0) return this.lineWidth;

    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity = distance / dt;

    const smoothedVelocity = this.lastVelocity * 0.7 + velocity * 0.3;
    this.lastVelocity = smoothedVelocity;

    const normalizedVelocity = Math.min(smoothedVelocity / 2, 1);
    const pressureFactor = 1 - normalizedVelocity * this.pressureSensitivity;
    
    const dynamicWidth = this.minLineWidth + 
      (this.maxLineWidth - this.minLineWidth) * pressureFactor;

    return Math.max(this.minLineWidth, Math.min(this.maxLineWidth, dynamicWidth));
  }

  drawPen(x, y) {
    const dynamicWidth = this.calculateLineWidth(x, y);
    
    this.pointsBuffer.push({ x, y, width: dynamicWidth });

    if (this.pointsBuffer.length >= 3) {
      const p0 = this.pointsBuffer[this.pointsBuffer.length - 3];
      const p1 = this.pointsBuffer[this.pointsBuffer.length - 2];
      const p2 = this.pointsBuffer[this.pointsBuffer.length - 1];
      
      this.drawBezierSegment(p0, p1, p2);
    }

    this.applyStrokeStyle();
    this.ctx.lineWidth = dynamicWidth;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);

    this.emitDraw({
      type: 'pen',
      fromX: this.lastX,
      fromY: this.lastY,
      toX: x,
      toY: y,
      color: this.color,
      lineWidth: dynamicWidth,
      opacity: this.opacity,
      brushShape: this.brushShape
    });
  }

  drawBezierSegment(p0, p1, p2) {
    const cp1x = p0.x + (p1.x - p0.x) * 0.5;
    const cp1y = p0.y + (p1.y - p0.y) * 0.5;
    const cp2x = p1.x + (p2.x - p1.x) * 0.5;
    const cp2y = p1.y + (p2.y - p1.y) * 0.5;

    this.applyStrokeStyle();
    this.ctx.lineWidth = p1.width;
    this.ctx.beginPath();
    this.ctx.moveTo(p0.x, p0.y);
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    this.ctx.stroke();
  }

  drawDot(x, y, width) {
    this.applyStrokeStyle();
    this.ctx.beginPath();
    this.ctx.arc(x, y, width / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.getColorWithOpacity();
    this.ctx.fill();
  }

  applyStrokeStyle() {
    this.ctx.strokeStyle = this.getColorWithOpacity();
    this.ctx.lineCap = this.brushShape === BrushShape.ROUND ? 'round' : 
                       this.brushShape === BrushShape.SQUARE ? 'square' : 'butt';
    this.ctx.lineJoin = 'round';
  }

  getColorWithOpacity() {
    if (this.opacity >= 1) {
      return this.color;
    }
    
    const r = parseInt(this.color.slice(1, 3), 16);
    const g = parseInt(this.color.slice(3, 5), 16);
    const b = parseInt(this.color.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
  }

  drawRectanglePreview(x, y) {
    this.ctx.putImageData(this.imageData, 0, 0);
    this.ctx.strokeStyle = this.getColorWithOpacity();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
  }

  drawCirclePreview(x, y) {
    this.ctx.putImageData(this.imageData, 0, 0);
    const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
    this.ctx.strokeStyle = this.getColorWithOpacity();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.beginPath();
    this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  endDrawing(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const rect = this.canvas.getBoundingClientRect();
    let x = this.lastX;
    let y = this.lastY;
    
    if (e && e.clientX) {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    if (this.currentTool === 'rectangle') {
      this.emitDraw({
        type: 'rectangle',
        x: this.startX,
        y: this.startY,
        width: x - this.startX,
        height: y - this.startY,
        color: this.color,
        lineWidth: this.lineWidth,
        opacity: this.opacity
      });
    } else if (this.currentTool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
      this.emitDraw({
        type: 'circle',
        x: this.startX,
        y: this.startY,
        radius: radius,
        color: this.color,
        lineWidth: this.lineWidth,
        opacity: this.opacity
      });
    }

    this.pointsBuffer = [];
    this.ctx.beginPath();
  }

  emitDraw(data) {
    if (this.drawCallback) {
      this.drawCallback(data);
    }
  }

  setDrawCallback(callback) {
    this.drawCallback = callback;
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.color = color;
  }

  setLineWidth(width) {
    this.lineWidth = width;
    this.minLineWidth = Math.max(0.5, width * 0.3);
    this.maxLineWidth = width * 3;
  }

  setOpacity(opacity) {
    this.opacity = opacity;
  }

  setBrushShape(shape) {
    this.brushShape = shape;
  }

  setPressureEnabled(enabled) {
    this.pressureEnabled = enabled;
  }

  setPressureSensitivity(sensitivity) {
    this.pressureSensitivity = sensitivity;
  }

  clear() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  executeDraw(data) {
    const opacity = data.opacity !== undefined ? data.opacity : 1;
    const brushShape = data.brushShape || BrushShape.ROUND;
    
    const r = parseInt(data.color.slice(1, 3), 16);
    const g = parseInt(data.color.slice(3, 5), 16);
    const b = parseInt(data.color.slice(5, 7), 16);
    
    this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    this.ctx.lineWidth = data.lineWidth;
    this.ctx.lineCap = brushShape === BrushShape.ROUND ? 'round' : 
                       brushShape === BrushShape.SQUARE ? 'square' : 'butt';
    this.ctx.lineJoin = 'round';

    switch (data.type) {
      case 'pen':
        this.ctx.beginPath();
        this.ctx.moveTo(data.fromX, data.fromY);
        this.ctx.lineTo(data.toX, data.toY);
        this.ctx.stroke();
        break;
      case 'rectangle':
        this.ctx.strokeRect(data.x, data.y, data.width, data.height);
        break;
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(data.x, data.y, data.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
      case 'clear':
        this.clear();
        break;
    }
  }
}
