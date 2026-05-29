class LightCanvas {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dirtyRegions = [];
        this.lastMouseX = -1;
        this.lastMouseY = -1;
        
        this.clear();
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.dirtyRegions = [];
    }
    
    markDirty(x, y, width, height) {
        this.dirtyRegions.push({ x, y, width, height });
    }
    
    clearDirty() {
        this.dirtyRegions.forEach(region => {
            this.ctx.clearRect(region.x, region.y, region.width, region.height);
        });
        this.dirtyRegions = [];
    }
    
    drawCrosshair(x, y, lastX, lastY, chartArea) {
        const region1 = {
            x: lastX - 2,
            y: chartArea.padding.top,
            width: 4,
            height: chartArea.height
        };
        const region2 = {
            x: chartArea.padding.left,
            y: lastY - 2,
            width: chartArea.width,
            height: 4
        };
        this.markDirty(region1.x, region1.y, region1.width, region1.height);
        this.markDirty(region2.x, region2.y, region2.width, region2.height);
        
        this.clearDirty();
        
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, chartArea.padding.top);
        this.ctx.lineTo(x, this.canvas.height - chartArea.padding.bottom);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(chartArea.padding.left, y);
        this.ctx.lineTo(this.canvas.width - chartArea.padding.right, y);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        return { lastX: x, lastY: y };
    }
}

class WelfordStats {
    constructor() {
        this.count = 0;
        this.mean = 0;
        this.M2 = 0;
        this.values = [];
    }
    
    add(value) {
        this.count++;
        const delta = value - this.mean;
        this.mean += delta / this.count;
        const delta2 = value - this.mean;
        this.M2 += delta * delta2;
        this.values.push(value);
    }
    
    remove(value) {
        if (this.count === 0) return;
        
        const oldMean = this.mean;
        this.count--;
        
        if (this.count === 0) {
            this.mean = 0;
            this.M2 = 0;
        } else {
            const delta = value - this.mean;
            this.mean -= delta / this.count;
            const delta2 = value - this.mean;
            this.M2 -= delta * delta2;
        }
        
        const index = this.values.indexOf(value);
        if (index !== -1) {
            this.values.splice(index, 1);
        }
    }
    
    getVariance() {
        return this.count > 1 ? this.M2 / this.count : 0;
    }
    
    getStd() {
        return Math.sqrt(this.getVariance());
    }
}

class BollingerBandChart {
    constructor() {
        this.canvas = document.getElementById('chartCanvas');
        this.lightCanvas = new LightCanvas(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.processedData = [];
        this.currentPeriod = 'day';
        this.maPeriod = 20;
        this.stdMultiplier = 2;
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseOver = false;
        this.hoveredIndex = -1;
        
        this.chartArea = {
            padding: { top: 40, right: 80, bottom: 60, left: 60 },
            width: 0,
            height: 0
        };
        
        this.priceRange = { min: 0, max: 0 };
        this.bollingerCache = {};
        
        this.bindEvents();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    bindEvents() {
        const csvFile = document.getElementById('csvFile');
        csvFile.addEventListener('change', (e) => this.handleCSVUpload(e));
        
        const periodButtons = document.querySelectorAll('.period-btn');
        periodButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.changePeriod(e.target.dataset.period));
        });
        
        const maPeriodSlider = document.getElementById('maPeriod');
        const maPeriodValue = document.getElementById('maPeriodValue');
        maPeriodSlider.addEventListener('input', (e) => {
            this.maPeriod = parseInt(e.target.value);
            maPeriodValue.textContent = this.maPeriod;
            this.processData();
        });
        
        const stdSlider = document.getElementById('stdMultiplier');
        const stdValue = document.getElementById('stdMultiplierValue');
        stdSlider.addEventListener('input', (e) => {
            this.stdMultiplier = parseFloat(e.target.value);
            stdValue.textContent = this.stdMultiplier.toFixed(1);
            this.processData();
        });
        
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth * window.devicePixelRatio;
        this.canvas.height = 600 * window.devicePixelRatio;
        this.canvas.style.height = '600px';
        
        this.chartArea.width = this.canvas.width - this.chartArea.padding.left - this.chartArea.padding.right;
        this.chartArea.height = this.canvas.height - this.chartArea.padding.top - this.chartArea.padding.bottom;
        
        this.draw();
    }
    
    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.parseCSV(e.target.result);
        };
        reader.readAsText(file);
    }
    
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));
        const openIndex = headers.findIndex(h => h.toLowerCase().includes('open'));
        const highIndex = headers.findIndex(h => h.toLowerCase().includes('high'));
        const lowIndex = headers.findIndex(h => h.toLowerCase().includes('low'));
        const closeIndex = headers.findIndex(h => h.toLowerCase().includes('close'));
        
        this.data = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
                date: new Date(values[dateIndex].trim()),
                open: parseFloat(values[openIndex].trim()),
                high: parseFloat(values[highIndex].trim()),
                low: parseFloat(values[lowIndex].trim()),
                close: parseFloat(values[closeIndex].trim())
            };
        }).filter(item => !isNaN(item.open));
        
        this.bollingerCache = {};
        this.processData();
    }
    
    processData() {
        if (!this.data.length) return;
        
        const cacheKey = `${this.currentPeriod}_${this.maPeriod}_${this.stdMultiplier}`;
        
        if (this.bollingerCache[cacheKey]) {
            this.processedData = this.bollingerCache[cacheKey];
        } else {
            const aggregatedData = this.aggregateByPeriod(this.currentPeriod);
            this.processedData = this.calculateBollingerBands(aggregatedData);
            this.bollingerCache[cacheKey] = this.processedData;
        }
        
        this.updatePricePosition();
        this.draw();
    }
    
    aggregateByPeriod(period) {
        if (period === 'day') return [...this.data];
        
        const aggregated = [];
        const groups = {};
        
        this.data.forEach(item => {
            let key;
            if (period === 'week') {
                const startOfWeek = new Date(item.date);
                startOfWeek.setDate(item.date.getDate() - item.date.getDay());
                key = startOfWeek.toISOString().split('T')[0];
            } else {
                key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
            }
            
            if (!groups[key]) {
                groups[key] = {
                    date: item.date,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close
                };
            } else {
                groups[key].high = Math.max(groups[key].high, item.high);
                groups[key].low = Math.min(groups[key].low, item.low);
                groups[key].close = item.close;
            }
        });
        
        return Object.values(groups).sort((a, b) => a.date - b.date);
    }
    
    calculateBollingerBands(data) {
        const result = [];
        const stats = new WelfordStats();
        
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            stats.add(item.close);
            
            if (stats.count > this.maPeriod) {
                const oldestValue = data[i - this.maPeriod].close;
                stats.remove(oldestValue);
            }
            
            const ma = stats.mean;
            const std = stats.getStd();
            
            result.push({
                ...item,
                ma: ma,
                upperBand: ma + this.stdMultiplier * std,
                lowerBand: ma - this.stdMultiplier * std
            });
        }
        
        return result;
    }
    
    changePeriod(period) {
        this.currentPeriod = period;
        
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        this.processData();
    }
    
    updatePricePosition() {
        if (!this.processedData.length) {
            document.getElementById('pricePosition').textContent = '当前价格位置: 请导入数据';
            return;
        }
        
        const latest = this.processedData[this.processedData.length - 1];
        const { close, upperBand, lowerBand, ma } = latest;
        
        let position;
        if (close > upperBand) {
            position = '<strong>上轨上方</strong> (超买区域)';
        } else if (close < lowerBand) {
            position = '<strong>下轨下方</strong> (超卖区域)';
        } else {
            const distanceToMa = Math.abs(close - ma);
            const bandWidth = (upperBand - lowerBand) / 2;
            if (distanceToMa < bandWidth * 0.3) {
                position = '<strong>中轨附近</strong>';
            } else if (close > ma) {
                position = '<strong>中轨与上轨之间</strong>';
            } else {
                position = '<strong>中轨与下轨之间</strong>';
            }
        }
        
        document.getElementById('pricePosition').innerHTML = `当前价格位置: ${position}`;
    }
    
    draw() {
        this.lightCanvas.clear();
        
        if (!this.processedData.length) {
            this.drawEmptyState();
            return;
        }
        
        this.calculatePriceRange();
        this.drawGrid();
        this.drawBollingerBands();
        this.drawCandlesticks();
        this.drawYAxis();
        this.drawXAxis();
        
        if (this.isMouseOver && this.hoveredIndex >= 0) {
            this.drawCrosshair();
            this.drawTooltip();
        }
    }
    
    drawEmptyState() {
        this.ctx.fillStyle = '#8892b0';
        this.ctx.font = '16px "Segoe UI", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('请导入CSV格式的OHLC数据', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('数据格式: 日期,开盘价,最高价,最低价,收盘价', this.canvas.width / 2, this.canvas.height / 2 + 25);
    }
    
    calculatePriceRange() {
        let min = Infinity;
        let max = -Infinity;
        
        this.processedData.forEach(item => {
            min = Math.min(min, item.low, item.lowerBand);
            max = Math.max(max, item.high, item.upperBand);
        });
        
        const padding = (max - min) * 0.1;
        this.priceRange = {
            min: min - padding,
            max: max + padding
        };
    }
    
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        const gridCount = 5;
        const priceStep = (this.priceRange.max - this.priceRange.min) / gridCount;
        
        for (let i = 0; i <= gridCount; i++) {
            const y = this.chartArea.padding.top + (this.chartArea.height / gridCount) * i;
            ctx.beginPath();
            ctx.moveTo(this.chartArea.padding.left, y);
            ctx.lineTo(this.canvas.width - this.chartArea.padding.right, y);
            ctx.stroke();
            
            const price = this.priceRange.max - priceStep * i;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '11px "Segoe UI", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(price.toFixed(2), this.chartArea.padding.left - 10, y + 4);
        }
    }
    
    drawBollingerBands() {
        const ctx = this.ctx;
        const stepX = this.chartArea.width / Math.max(this.processedData.length - 1, 1);
        
        ctx.beginPath();
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        this.processedData.forEach((item, i) => {
            const x = this.chartArea.padding.left + i * stepX;
            const y = this.priceToY(item.ma);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        ctx.beginPath();
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        this.processedData.forEach((item, i) => {
            const x = this.chartArea.padding.left + i * stepX;
            const y = this.priceToY(item.upperBand);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        ctx.beginPath();
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 2;
        this.processedData.forEach((item, i) => {
            const x = this.chartArea.padding.left + i * stepX;
            const y = this.priceToY(item.lowerBand);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        
        const gradient = ctx.createLinearGradient(0, this.chartArea.padding.top, 0, this.canvas.height - this.chartArea.padding.bottom);
        gradient.addColorStop(0, 'rgba(78, 205, 196, 0.15)');
        gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 107, 107, 0.15)');
        
        ctx.beginPath();
        this.processedData.forEach((item, i) => {
            const x = this.chartArea.padding.left + i * stepX;
            const upperY = this.priceToY(item.upperBand);
            const lowerY = this.priceToY(item.lowerBand);
            if (i === 0) {
                ctx.moveTo(x, upperY);
            } else {
                ctx.lineTo(x, upperY);
            }
        });
        for (let i = this.processedData.length - 1; i >= 0; i--) {
            const x = this.chartArea.padding.left + i * stepX;
            const lowerY = this.priceToY(this.processedData[i].lowerBand);
            ctx.lineTo(x, lowerY);
        }
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    drawCandlesticks() {
        const ctx = this.ctx;
        const stepX = this.chartArea.width / Math.max(this.processedData.length - 1, 1);
        const candleWidth = Math.max(3, stepX * 0.6);
        
        this.processedData.forEach((item, i) => {
            const x = this.chartArea.padding.left + i * stepX;
            const isBullish = item.close >= item.open;
            const color = isBullish ? '#00ff88' : '#ff4757';
            
            const openY = this.priceToY(item.open);
            const closeY = this.priceToY(item.close);
            const highY = this.priceToY(item.high);
            const lowY = this.priceToY(item.low);
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();
            
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(closeY - openY) || 1;
            
            ctx.fillStyle = isBullish ? color : 'transparent';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
            ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        });
    }
    
    drawYAxis() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.chartArea.padding.left, this.chartArea.padding.top);
        ctx.lineTo(this.chartArea.padding.left, this.canvas.height - this.chartArea.padding.bottom);
        ctx.stroke();
    }
    
    drawXAxis() {
        const ctx = this.ctx;
        const stepX = this.chartArea.width / Math.max(this.processedData.length - 1, 1);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.chartArea.padding.left, this.canvas.height - this.chartArea.padding.bottom);
        ctx.lineTo(this.canvas.width - this.chartArea.padding.right, this.canvas.height - this.chartArea.padding.bottom);
        ctx.stroke();
        
        const labelCount = Math.min(10, this.processedData.length);
        const labelStep = Math.floor(this.processedData.length / labelCount);
        
        for (let i = 0; i < this.processedData.length; i += labelStep) {
            const item = this.processedData[i];
            const x = this.chartArea.padding.left + i * stepX;
            const dateStr = this.formatDate(item.date);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(dateStr, x, this.canvas.height - 30);
        }
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}-${day}`;
    }
    
    priceToY(price) {
        const range = this.priceRange.max - this.priceRange.min;
        const ratio = (price - this.priceRange.min) / range;
        return this.canvas.height - this.chartArea.padding.bottom - ratio * this.chartArea.height;
    }
    
    yToPrice(y) {
        const range = this.priceRange.max - this.priceRange.min;
        const ratio = (this.canvas.height - this.chartArea.padding.bottom - y) / this.chartArea.height;
        return this.priceRange.min + ratio * range;
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const newMouseX = (event.clientX - rect.left) * window.devicePixelRatio;
        const newMouseY = (event.clientY - rect.top) * window.devicePixelRatio;
        
        const stepX = this.chartArea.width / Math.max(this.processedData.length - 1, 1);
        const newHoveredIndex = Math.round((newMouseX - this.chartArea.padding.left) / stepX);
        const clampedIndex = Math.max(0, Math.min(newHoveredIndex, this.processedData.length - 1));
        
        if (this.isMouseOver && this.processedData.length > 0) {
            this.lightCanvas.drawCrosshair(newMouseX, newMouseY, this.mouseX, this.mouseY, this.chartArea);
        }
        
        this.mouseX = newMouseX;
        this.mouseY = newMouseY;
        this.isMouseOver = true;
        this.hoveredIndex = clampedIndex;
        
        this.drawTooltip();
    }
    
    handleMouseLeave() {
        this.isMouseOver = false;
        this.hoveredIndex = -1;
        
        const tooltip = document.getElementById('tooltip');
        tooltip.style.display = 'none';
        
        this.lightCanvas.markDirty(
            this.chartArea.padding.left,
            this.chartArea.padding.top,
            this.chartArea.width,
            this.chartArea.height
        );
        this.lightCanvas.clearDirty();
        
        this.drawGrid();
        this.drawBollingerBands();
        this.drawCandlesticks();
        this.drawYAxis();
        this.drawXAxis();
    }
    
    drawCrosshair() {
    }
    
    drawTooltip() {
        if (this.hoveredIndex < 0 || !this.processedData[this.hoveredIndex]) {
            document.getElementById('tooltip').style.display = 'none';
            return;
        }
        
        const item = this.processedData[this.hoveredIndex];
        const tooltip = document.getElementById('tooltip');
        
        const dateStr = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}-${String(item.date.getDate()).padStart(2, '0')}`;
        
        tooltip.innerHTML = `
            <div class="tooltip-row"><span class="label">日期</span><span class="value">${dateStr}</span></div>
            <div class="tooltip-row"><span class="label">开盘</span><span class="value">${item.open.toFixed(2)}</span></div>
            <div class="tooltip-row"><span class="label">最高</span><span class="value">${item.high.toFixed(2)}</span></div>
            <div class="tooltip-row"><span class="label">最低</span><span class="value">${item.low.toFixed(2)}</span></div>
            <div class="tooltip-row"><span class="label">收盘</span><span class="value">${item.close.toFixed(2)}</span></div>
            <div class="tooltip-row"><span class="label">中轨(MA)</span><span class="value">${item.ma.toFixed(2)}</span></div>
            <div class="tooltip-row"><span class="label">上轨</span><span class="value">${item.upperBand.toFixed(2)}</span></div>
            <div class="tooltip-row"><span class="label">下轨</span><span class="value">${item.lowerBand.toFixed(2)}</span></div>
        `;
        
        const rect = this.canvas.getBoundingClientRect();
        let tooltipX = (this.mouseX / window.devicePixelRatio) + 15;
        let tooltipY = (this.mouseY / window.devicePixelRatio) - tooltip.offsetHeight / 2;
        
        if (tooltipX + tooltip.offsetWidth > rect.width) {
            tooltipX = (this.mouseX / window.devicePixelRatio) - tooltip.offsetWidth - 15;
        }
        if (tooltipY < 10) tooltipY = 10;
        if (tooltipY + tooltip.offsetHeight > rect.height - 20) {
            tooltipY = rect.height - tooltip.offsetHeight - 20;
        }
        
        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;
        tooltip.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BollingerBandChart();
});