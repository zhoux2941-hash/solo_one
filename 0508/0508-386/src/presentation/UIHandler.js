import { Exporter } from '../infrastructure/Exporter.js';

export class UIHandler {
    constructor(app, canvas) {
        this.app = app;
        this.canvas = canvas;
        this.clickPosition = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        
        document.getElementById('makeShot').addEventListener('click', this.handleMakeShot.bind(this));
        document.getElementById('missShot').addEventListener('click', this.handleMissShot.bind(this));
        document.getElementById('cancelShot').addEventListener('click', this.hideModal.bind(this));
        
        document.getElementById('filterWeek').addEventListener('click', () => this.setFilter('week'));
        document.getElementById('filterMonth').addEventListener('click', () => this.setFilter('month'));
        document.getElementById('filterAll').addEventListener('click', () => this.setFilter('all'));
        
        document.getElementById('showHeatmap').addEventListener('click', this.toggleHeatmap.bind(this));
        document.getElementById('showPoints').addEventListener('click', this.togglePoints.bind(this));
        
        document.getElementById('exportImage').addEventListener('click', this.exportImage.bind(this));
        document.getElementById('exportCSV').addEventListener('click', this.exportCSV.bind(this));
        
        document.getElementById('clearData').addEventListener('click', this.clearData.bind(this));
        
        document.getElementById('userSelector').addEventListener('change', this.handleUserChange.bind(this));
    }
    
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.clickPosition = {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
        
        this.showModal(event.clientX, event.clientY);
    }
    
    showModal(x, y) {
        const modal = document.getElementById('clickModal');
        modal.style.left = `${x + 10}px`;
        modal.style.top = `${y + 10}px`;
        modal.classList.remove('hidden');
    }
    
    hideModal() {
        const modal = document.getElementById('clickModal');
        modal.classList.add('hidden');
        this.clickPosition = null;
    }
    
    handleMakeShot() {
        if (this.clickPosition) {
            this.app.addShot(this.clickPosition.x, this.clickPosition.y, true);
            this.updateDisplay();
        }
        this.hideModal();
    }
    
    handleMissShot() {
        if (this.clickPosition) {
            this.app.addShot(this.clickPosition.x, this.clickPosition.y, false);
            this.updateDisplay();
        }
        this.hideModal();
    }
    
    setFilter(filter) {
        this.app.setFilter(filter);
        this.updateDisplay();
        
        document.querySelectorAll('[id^="filter"]').forEach(btn => {
            btn.classList.remove('bg-gray-500');
            btn.classList.add('bg-blue-500');
        });
        
        document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`)
            .classList.remove('bg-blue-500');
        document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`)
            .classList.add('bg-gray-500');
    }
    
    toggleHeatmap() {
        this.app.showHeatmap = true;
        document.getElementById('showHeatmap').classList.remove('bg-gray-500');
        document.getElementById('showHeatmap').classList.add('bg-purple-500');
        document.getElementById('showPoints').classList.remove('bg-purple-500');
        document.getElementById('showPoints').classList.add('bg-gray-500');
        this.updateDisplay();
    }
    
    togglePoints() {
        this.app.showHeatmap = false;
        document.getElementById('showPoints').classList.remove('bg-gray-500');
        document.getElementById('showPoints').classList.add('bg-purple-500');
        document.getElementById('showHeatmap').classList.remove('bg-purple-500');
        document.getElementById('showHeatmap').classList.add('bg-gray-500');
        this.updateDisplay();
    }
    
    exportImage() {
        Exporter.exportImage(this.canvas);
    }
    
    exportCSV() {
        const shots = this.app.getFilteredShots();
        Exporter.exportCSV(shots);
    }
    
    clearData() {
        if (confirm('确定要清空所有数据吗？')) {
            this.app.clearShots();
            this.updateDisplay();
        }
    }
    
    handleUserChange(event) {
        const userId = event.target.value;
        this.app.setUser(userId);
        this.updateDisplay();
    }
    
    updateDisplay() {
        const stats = this.app.getStatistics();
        const shots = this.app.getFilteredShots();
        
        document.getElementById('totalShots').textContent = stats.totalShots;
        document.getElementById('totalAccuracy').textContent = `${(stats.totalAccuracy * 100).toFixed(1)}%`;
        
        const paintAccuracy = stats.regionStats.paint.accuracy;
        const midRangeAccuracy = stats.regionStats.midRange.accuracy;
        const threePointAccuracy = stats.regionStats.threePoint.accuracy;
        
        document.getElementById('paintAccuracy').textContent = paintAccuracy !== null 
            ? `${(paintAccuracy * 100).toFixed(1)}% (${stats.regionStats.paint.made}/${stats.regionStats.paint.total})`
            : '-';
        
        document.getElementById('midRangeAccuracy').textContent = midRangeAccuracy !== null 
            ? `${(midRangeAccuracy * 100).toFixed(1)}% (${stats.regionStats.midRange.made}/${stats.regionStats.midRange.total})`
            : '-';
        
        document.getElementById('threePointAccuracy').textContent = threePointAccuracy !== null 
            ? `${(threePointAccuracy * 100).toFixed(1)}% (${stats.regionStats.threePoint.made}/${stats.regionStats.threePoint.total})`
            : '-';
    }
    
    updateCanvas(canvasController) {
        const shots = this.app.getFilteredShots();
        canvasController.redraw(shots, this.app.showHeatmap);
    }
}