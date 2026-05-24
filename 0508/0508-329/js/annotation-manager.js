export class AnnotationManager {
  constructor(canvas, isEditable = false) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isEditable = isEditable;
    
    this.annotations = [];
    this.currentTool = 'arrow';
    this.currentColor = '#ff0000';
    this.lineWidth = 3;
    this.isDrawing = false;
    this.startPoint = null;
    this.tempAnnotation = null;
    
    this.onAnnotationComplete = null;
    this.onClearAnnotations = null;
    
    this.calibrationData = null;
    this.measurements = [];
    
    if (this.isEditable) {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
  }

  handleMouseDown(e) {
    if (!this.isEditable) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    this.isDrawing = true;
    this.startPoint = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };

    if (this.currentTool === 'measure' && this.calibrationData) {
      this.tempAnnotation = {
        type: 'measure',
        points: [this.startPoint],
        color: this.currentColor,
        timestamp: Date.now()
      };
    } else if (this.currentTool === 'text') {
      const text = prompt('请输入标注文字:');
      if (text) {
        const annotation = {
          type: 'text',
          x: this.startPoint.x,
          y: this.startPoint.y,
          text,
          color: this.currentColor,
          timestamp: Date.now()
        };
        this.addAnnotation(annotation);
      }
      this.isDrawing = false;
    }
  }

  handleMouseMove(e) {
    if (!this.isDrawing || !this.isEditable) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const currentPoint = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };

    this.tempAnnotation = {
      type: this.currentTool,
      startX: this.startPoint.x,
      startY: this.startPoint.y,
      endX: currentPoint.x,
      endY: currentPoint.y,
      color: this.currentColor,
      lineWidth: this.lineWidth,
      timestamp: Date.now()
    };

    if (this.currentTool === 'measure' && this.calibrationData) {
      const distance = this.calculateDistance(this.startPoint, currentPoint);
      this.tempAnnotation.distance = distance;
    }

    this.redraw();
  }

  handleMouseUp(e) {
    if (!this.isDrawing || !this.isEditable) return;
    
    this.isDrawing = false;
    
    if (this.tempAnnotation && this.currentTool !== 'text') {
      if (this.currentTool === 'measure' && this.calibrationData) {
        this.tempAnnotation.points = [
          { x: this.tempAnnotation.startX, y: this.tempAnnotation.startY },
          { x: this.tempAnnotation.endX, y: this.tempAnnotation.endY }
        ];
        this.measurements.push({
          ...this.tempAnnotation,
          distance: this.tempAnnotation.distance
        });
      }
      
      this.addAnnotation(this.tempAnnotation);
    }
    
    this.tempAnnotation = null;
    this.startPoint = null;
  }

  addAnnotation(annotation, remote = false) {
    this.annotations.push(annotation);
    
    if (!remote && this.onAnnotationComplete) {
      this.onAnnotationComplete(annotation);
    }
    
    this.redraw();
  }

  clearAll() {
    this.annotations = [];
    this.measurements = [];
    this.redraw();
    
    if (this.onClearAnnotations) {
      this.onClearAnnotations();
    }
  }

  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.annotations.forEach(annotation => {
      this.drawAnnotation(annotation);
    });
    
    if (this.tempAnnotation) {
      this.drawAnnotation(this.tempAnnotation, true);
    }
  }

  drawAnnotation(annotation, isTemp = false) {
    this.ctx.strokeStyle = annotation.color || this.currentColor;
    this.ctx.fillStyle = annotation.color || this.currentColor;
    this.ctx.lineWidth = annotation.lineWidth || this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    if (isTemp) {
      this.ctx.setLineDash([5, 5]);
    } else {
      this.ctx.setLineDash([]);
    }

    switch (annotation.type) {
      case 'arrow':
        this.drawArrow(annotation);
        break;
      case 'circle':
        this.drawCircle(annotation);
        break;
      case 'text':
        this.drawText(annotation);
        break;
      case 'measure':
        this.drawMeasurement(annotation);
        break;
      case 'calibration':
        this.drawCalibration(annotation);
        break;
    }
    
    this.ctx.setLineDash([]);
  }

  drawArrow(annotation) {
    const { startX, startY, endX, endY } = annotation;
    const headLength = 20;
    const angle = Math.atan2(endY - startY, endX - startX);
    
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  drawCircle(annotation) {
    const { startX, startY, endX, endY } = annotation;
    const radius = Math.sqrt(
      Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
    );
    
    this.ctx.beginPath();
    this.ctx.arc(startX, startY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  drawText(annotation) {
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(annotation.text, annotation.x, annotation.y);
  }

  drawMeasurement(annotation) {
    const { startX, startY, endX, endY } = annotation;
    
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    this.drawCrosshair(startX, startY);
    this.drawCrosshair(endX, endY);
    
    if (annotation.distance !== undefined) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      
      this.ctx.font = 'bold 16px Arial';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 3;
      
      const text = `${annotation.distance.toFixed(2)} mm`;
      this.ctx.strokeText(text, midX + 10, midY);
      this.ctx.fillText(text, midX + 10, midY);
    }
  }

  drawCrosshair(x, y) {
    const size = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(x - size, y);
    this.ctx.lineTo(x + size, y);
    this.ctx.moveTo(x, y - size);
    this.ctx.lineTo(x, y + size);
    this.ctx.stroke();
  }

  drawCalibration(annotation) {
    const { startX, startY, endX, endY } = annotation;
    
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 3;
    
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    this.drawCrosshair(startX, startY);
    this.drawCrosshair(endX, endY);
    
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillText('标定参考', midX + 10, midY);
  }

  calculateDistance(point1, point2) {
    if (!this.calibrationData) return null;
    
    const pixelDistance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    );
    
    const calibrationPixelDistance = Math.sqrt(
      Math.pow(this.calibrationData.endX - this.calibrationData.startX, 2) + 
      Math.pow(this.calibrationData.endY - this.calibrationData.startY, 2)
    );
    
    const mmPerPixel = this.calibrationData.knownDistance / calibrationPixelDistance;
    return pixelDistance * mmPerPixel;
  }

  setCalibration(startX, startY, endX, endY, knownDistance) {
    this.calibrationData = {
      startX,
      startY,
      endX,
      endY,
      knownDistance
    };
    
    this.annotations.push({
      type: 'calibration',
      startX,
      startY,
      endX,
      endY,
      knownDistance
    });
    
    this.redraw();
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  setLineWidth(width) {
    this.lineWidth = width;
  }

  getMeasurements() {
    return this.measurements;
  }

  getAnnotations() {
    return this.annotations;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.redraw();
  }

  destroy() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
  }
}
