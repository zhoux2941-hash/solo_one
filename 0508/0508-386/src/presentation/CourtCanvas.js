import { HeatmapGenerator } from '../domain/HeatmapGenerator.js';

export class CourtCanvas {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }
    
    drawCourt() {
        this.clear();
        
        this.drawBackground();
        this.drawHoop();
        this.drawPaint();
        this.drawThreePointLine();
        this.drawFreeThrowLine();
        this.drawBaseline();
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#2d5a27');
        gradient.addColorStop(1, '#1e3d1a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawHoop() {
        const centerX = this.width / 2;
        const hoopY = 30;
        const hoopRadius = 15;
        
        this.ctx.strokeStyle = '#ff6b35';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, hoopY, hoopRadius, 0, Math.PI, true);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(centerX - 8, hoopY - 2, 16, 80);
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(centerX - 8, hoopY - 2, 16, 80);
    }
    
    drawPaint() {
        const centerX = this.width / 2;
        const topY = 30;
        const paintWidth = 84;
        const paintHeight = 190;
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(centerX - paintWidth / 2, topY, paintWidth, paintHeight);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(centerX - paintWidth / 2, topY, paintWidth, paintHeight);
    }
    
    drawThreePointLine() {
        const centerX = this.width / 2;
        const hoopY = 30;
        const threePointRadius = 145;
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, hoopY, threePointRadius, 0, Math.PI, true);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - threePointRadius, hoopY);
        this.ctx.lineTo(centerX - threePointRadius, hoopY + 200);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + threePointRadius, hoopY);
        this.ctx.lineTo(centerX + threePointRadius, hoopY + 200);
        this.ctx.stroke();
    }
    
    drawFreeThrowLine() {
        const centerX = this.width / 2;
        const freeThrowY = 145;
        const freeThrowRadius = 45;
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, freeThrowY, freeThrowRadius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawBaseline() {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height - 5);
        this.ctx.lineTo(this.width, this.height - 5);
        this.ctx.stroke();
    }
    
    drawHeatmap(shots) {
        const heatmapData = HeatmapGenerator.generateHeatmapData(shots);
        HeatmapGenerator.drawHeatmap(this.ctx, heatmapData, 0.6);
    }
    
    drawShots(shots) {
        shots.forEach(shot => {
            this.ctx.beginPath();
            this.ctx.arc(shot.x, shot.y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = shot.made ? '#22c55e' : '#ef4444';
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }
    
    getClickPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }
    
    redraw(shots, showHeatmap) {
        this.drawCourt();
        if (showHeatmap) {
            this.drawHeatmap(shots);
        }
        this.drawShots(shots);
    }
}