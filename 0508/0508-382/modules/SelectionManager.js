export class SelectionManager {
    constructor(mainCanvas) {
        this.mainCanvas = mainCanvas;
        this.selectionCanvas = document.getElementById('selectionCanvas');
        this.ctx = this.selectionCanvas.getContext('2d');
        this.isSelecting = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.selection = null;
        this.onSelectionChange = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.mainCanvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.mainCanvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.mainCanvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.mainCanvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    }

    onMouseDown(e) {
        const rect = this.mainCanvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        this.currentX = this.startX;
        this.currentY = this.startY;
        this.isSelecting = true;
    }

    onMouseMove(e) {
        if (!this.isSelecting) return;
        
        const rect = this.mainCanvas.getBoundingClientRect();
        this.currentX = e.clientX - rect.left;
        this.currentY = e.clientY - rect.top;
        
        this.drawSelection();
    }

    onMouseUp() {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        
        const x = Math.min(this.startX, this.currentX);
        const y = Math.min(this.startY, this.currentY);
        const width = Math.abs(this.currentX - this.startX);
        const height = Math.abs(this.currentY - this.startY);
        
        if (width > 10 && height > 10) {
            this.selection = { x, y, width, height };
            if (this.onSelectionChange) {
                this.onSelectionChange(this.selection);
            }
        } else {
            this.clearSelection();
        }
    }

    drawSelection() {
        this.clearSelectionCanvas();
        
        const x = Math.min(this.startX, this.currentX);
        const y = Math.min(this.startY, this.currentY);
        const width = Math.abs(this.currentX - this.startX);
        const height = Math.abs(this.currentY - this.startY);
        
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x, y, width, height);
        
        this.ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
        this.ctx.fillRect(x, y, width, height);
        
        this.ctx.setLineDash([]);
    }

    clearSelectionCanvas() {
        this.ctx.clearRect(0, 0, this.selectionCanvas.width, this.selectionCanvas.height);
    }

    clearSelection() {
        this.selection = null;
        this.clearSelectionCanvas();
        if (this.onSelectionChange) {
            this.onSelectionChange(null);
        }
    }

    resize(width, height) {
        this.selectionCanvas.width = width;
        this.selectionCanvas.height = height;
    }

    getSelection() {
        return this.selection;
    }
}