class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    range(min, max) {
        return min + this.next() * (max - min);
    }
}

class PathSmoother {
    static rdpSimplify(points, epsilon) {
        if (points.length <= 2) return points.slice();

        let maxDist = 0;
        let maxIdx = 0;
        const start = points[0];
        const end = points[points.length - 1];

        for (let i = 1; i < points.length - 1; i++) {
            const d = PathSmoother.perpendicularDist(points[i], start, end);
            if (d > maxDist) {
                maxDist = d;
                maxIdx = i;
            }
        }

        if (maxDist > epsilon) {
            const left = PathSmoother.rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
            const right = PathSmoother.rdpSimplify(points.slice(maxIdx), epsilon);
            return left.slice(0, -1).concat(right);
        }

        return [start, end];
    }

    static perpendicularDist(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) {
            const ex = point.x - lineStart.x;
            const ey = point.y - lineStart.y;
            return Math.sqrt(ex * ex + ey * ey);
        }

        const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq));
        const projX = lineStart.x + t * dx;
        const projY = lineStart.y + t * dy;
        const ex = point.x - projX;
        const ey = point.y - projY;
        return Math.sqrt(ex * ex + ey * ey);
    }

    static catmullRomToBezier(points, alpha) {
        if (points.length < 2) return [];
        if (points.length === 2) {
            return [{ cp1: points[0], cp2: points[0], end: points[1] }];
        }

        const tension = alpha || 0.5;
        const segments = [];

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = i > 0 ? points[i - 1] : points[0];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = i < points.length - 2 ? points[i + 2] : points[points.length - 1];

            const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
            const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
            const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
            const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

            segments.push({
                cp1: { x: cp1x, y: cp1y },
                cp2: { x: cp2x, y: cp2y },
                end: { x: p2.x, y: p2.y }
            });
        }

        return segments;
    }

    static sampleBezierCubic(p0, cp1, cp2, p1, numSamples) {
        const points = [];
        for (let i = 0; i <= numSamples; i++) {
            const t = i / numSamples;
            const t2 = t * t;
            const t3 = t2 * t;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const mt3 = mt2 * mt;

            points.push({
                x: mt3 * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p1.x,
                y: mt3 * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p1.y
            });
        }
        return points;
    }

    static smoothPath(rawPoints, epsilon, samplesPerSegment) {
        if (rawPoints.length < 2) return rawPoints.slice();

        const simplified = PathSmoother.rdpSimplify(rawPoints, epsilon);
        if (simplified.length === 2) return simplified;

        const bezierSegments = PathSmoother.catmullRomToBezier(simplified, 0.5);
        const result = [simplified[0]];

        for (let i = 0; i < bezierSegments.length; i++) {
            const seg = bezierSegments[i];
            const startPt = simplified[i];
            const sampled = PathSmoother.sampleBezierCubic(
                startPt, seg.cp1, seg.cp2, seg.end, samplesPerSegment
            );
            for (let j = 1; j < sampled.length; j++) {
                result.push(sampled[j]);
            }
        }

        return result;
    }
}

class BatikSimulator {
    constructor() {
        this.mainCanvas = document.getElementById('main-canvas');
        this.waxCanvas = document.getElementById('wax-canvas');
        this.mainCtx = this.mainCanvas.getContext('2d');
        this.waxCtx = this.waxCanvas.getContext('2d');

        this.waxLayers = {};
        this.waxLayerCtxs = {};
        ['yellow', 'red', 'black'].forEach(color => {
            const c = document.createElement('canvas');
            c.width = this.mainCanvas.width;
            c.height = this.mainCanvas.height;
            this.waxLayers[color] = c;
            this.waxLayerCtxs[color] = c.getContext('2d');
        });

        this.isDrawing = false;
        this.rawPathPoints = [];

        this.knifeWidth = 5;
        this.waxTemp = 'medium';
        this.waxColor = 'yellow';
        this.symmetryX = false;
        this.symmetryY = false;
        this.isDyed = false;

        this.seedLock = false;
        this.currentSeed = 12345;

        this.totalDrawLength = 0;
        this.waxPixels = 0;

        this.history = [];
        this.maxHistory = 20;

        this.rdpEpsilon = 2.0;
        this.bezierSamples = 8;

        this.tempConfig = {
            low: {
                widthMultiplier: 0.8,
                roughness: 0.6,
                edgeSmoothness: 0.2,
                description: '低温蜡：线条较细，边缘毛糙，蜡液渗透少'
            },
            medium: {
                widthMultiplier: 1.0,
                roughness: 0.3,
                edgeSmoothness: 0.5,
                description: '中温蜡：线条适中，边缘较为平滑'
            },
            high: {
                widthMultiplier: 1.4,
                roughness: 0.1,
                edgeSmoothness: 0.8,
                description: '高温蜡：线条较粗，边缘光滑，蜡液渗透多'
            }
        };

        this.waxColorConfig = {
            yellow: {
                colors: {
                    low: '#d4a574',
                    medium: '#c4956a',
                    high: '#b08050'
                },
                dyePreserve: null,
                label: '传统蜡：染色后留白'
            },
            red: {
                colors: {
                    low: '#c96b5b',
                    medium: '#b94432',
                    high: '#8b2e20'
                },
                dyePreserve: { r: 185, g: 68, b: 50 },
                label: '红蜡：染色后保留红色'
            },
            black: {
                colors: {
                    low: '#4a4a4a',
                    medium: '#333333',
                    high: '#1a1a1a'
                },
                dyePreserve: { r: 40, g: 35, b: 30 },
                label: '黑蜡：染色后保留深色'
            }
        };

        this.init();
    }

    init() {
        this.setupCanvas();
        this.bindEvents();
        this.updateInfo();
        this.saveState();
    }

    setupCanvas() {
        this.mainCtx.fillStyle = '#f5f0e6';
        this.mainCtx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        this.waxCtx.clearRect(0, 0, this.waxCanvas.width, this.waxCanvas.height);
        Object.values(this.waxLayerCtxs).forEach(ctx => {
            ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        });
    }

    getActiveCtx() {
        return this.waxLayerCtxs[this.waxColor];
    }

    getActiveColor() {
        return this.waxColorConfig[this.waxColor].colors[this.waxTemp];
    }

    compositeWaxPreview() {
        this.waxCtx.clearRect(0, 0, this.waxCanvas.width, this.waxCanvas.height);
        ['yellow', 'red', 'black'].forEach(color => {
            this.waxCtx.drawImage(this.waxLayers[color], 0, 0);
        });
    }

    bindEvents() {
        this.waxCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.waxCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.waxCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.waxCanvas.addEventListener('mouseout', () => this.stopDrawing());

        this.waxCanvas.addEventListener('touchstart', (e) => this.startDrawing(e), { passive: false });
        this.waxCanvas.addEventListener('touchmove', (e) => this.draw(e), { passive: false });
        this.waxCanvas.addEventListener('touchend', () => this.stopDrawing());

        document.getElementById('knife-width').addEventListener('input', (e) => {
            this.knifeWidth = parseInt(e.target.value);
            document.getElementById('width-value').textContent = this.knifeWidth;
        });

        document.querySelectorAll('.temp-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.temp-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.waxTemp = e.target.dataset.temp;
                document.getElementById('temp-desc').textContent = this.tempConfig[this.waxTemp].description;
            });
        });

        document.querySelectorAll('.wax-color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnEl = e.currentTarget;
                document.querySelectorAll('.wax-color-btn').forEach(b => b.classList.remove('active'));
                btnEl.classList.add('active');
                this.waxColor = btnEl.dataset.waxColor;
                document.getElementById('wax-color-desc').textContent = this.waxColorConfig[this.waxColor].label;
            });
        });

        document.getElementById('symmetry-x').addEventListener('change', (e) => {
            this.symmetryX = e.target.checked;
        });

        document.getElementById('symmetry-y').addEventListener('change', (e) => {
            this.symmetryY = e.target.checked;
        });

        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.insertTemplate(e.target.dataset.template);
            });
        });

        document.getElementById('dye-btn').addEventListener('click', () => this.applyDye());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('export-btn').addEventListener('click', () => this.exportPNG());

        document.getElementById('seed-lock').addEventListener('change', (e) => {
            this.seedLock = e.target.checked;
            document.getElementById('seed-value').disabled = !this.seedLock;
            document.getElementById('seed-random').disabled = this.seedLock;
            if (this.seedLock) {
                this.currentSeed = parseInt(document.getElementById('seed-value').value) || 12345;
                document.getElementById('status-text').textContent = `种子已锁定: ${this.currentSeed}`;
            } else {
                document.getElementById('status-text').textContent = '种子已解锁，冰裂纹将随机生成';
            }
        });

        document.getElementById('seed-value').addEventListener('change', (e) => {
            this.currentSeed = parseInt(e.target.value) || 12345;
        });

        document.getElementById('seed-random').addEventListener('click', () => {
            this.currentSeed = Math.floor(Math.random() * 999999) + 1;
            document.getElementById('seed-value').value = this.currentSeed;
            document.getElementById('status-text').textContent = `新随机种子: ${this.currentSeed}`;
        });
    }

    getCanvasCoordinates(e) {
        const rect = this.waxCanvas.getBoundingClientRect();
        const scaleX = this.waxCanvas.width / rect.width;
        const scaleY = this.waxCanvas.height / rect.height;

        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    startDrawing(e) {
        if (e.cancelable) e.preventDefault();
        if (this.isDyed) return;

        this.isDrawing = true;
        const coords = this.getCanvasCoordinates(e);
        this.rawPathPoints = [coords];

        document.getElementById('status-text').textContent = '正在绘制...';
    }

    draw(e) {
        if (!this.isDrawing || this.isDyed) return;
        if (e.cancelable) e.preventDefault();

        const coords = this.getCanvasCoordinates(e);

        const lastPt = this.rawPathPoints[this.rawPathPoints.length - 1];
        const dist = Math.sqrt(Math.pow(coords.x - lastPt.x, 2) + Math.pow(coords.y - lastPt.y, 2));
        if (dist < 1.5) return;

        this.rawPathPoints.push(coords);

        this.renderCurrentStroke();
    }

    renderCurrentStroke() {
        const config = this.tempConfig[this.waxTemp];
        const smoothed = PathSmoother.smoothPath(
            this.rawPathPoints,
            this.rdpEpsilon,
            this.bezierSamples
        );

        this.clearActiveLayer();

        this.renderSmoothedPath(smoothed, config);

        if (this.symmetryX) {
            const mirrored = smoothed.map(p => ({ x: this.waxCanvas.width - p.x, y: p.y }));
            this.renderSmoothedPath(mirrored, config);

            if (this.symmetryY) {
                const mirroredXY = smoothed.map(p => ({
                    x: this.waxCanvas.width - p.x,
                    y: this.waxCanvas.height - p.y
                }));
                this.renderSmoothedPath(mirroredXY, config);
            }
        }

        if (this.symmetryY && !this.symmetryX) {
            const mirrored = smoothed.map(p => ({ x: p.x, y: this.waxCanvas.height - p.y }));
            this.renderSmoothedPath(mirrored, config);
        }

        this.compositeWaxPreview();
    }

    clearActiveLayer() {
        const ctx = this.getActiveCtx();
        ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;

            if (this.rawPathPoints.length >= 2) {
                const smoothed = PathSmoother.smoothPath(
                    this.rawPathPoints,
                    this.rdpEpsilon,
                    this.bezierSamples
                );
                this.addPathLength(smoothed);
            }

            this.rawPathPoints = [];
            this.saveState();
            document.getElementById('status-text').textContent = '绘制完成';
            this.updateInfo();
        }
    }

    addPathLength(points) {
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i - 1].x;
            const dy = points[i].y - points[i - 1].y;
            this.totalDrawLength += Math.sqrt(dx * dx + dy * dy);
        }
    }

    renderSmoothedPath(points, config) {
        if (points.length < 2) return;

        const actualWidth = this.knifeWidth * config.widthMultiplier;
        const step = Math.max(1, Math.floor(2 / (actualWidth * 0.5)));

        for (let i = 0; i < points.length; i += step) {
            const p = points[i];

            let angle = 0;
            if (i < points.length - 1) {
                angle = Math.atan2(points[i + 1].y - p.y, points[i + 1].x - p.x);
            } else if (i > 0) {
                angle = Math.atan2(p.y - points[i - 1].y, p.x - points[i - 1].x);
            }

            const widthVariation = 1 + (Math.random() - 0.5) * config.roughness;
            const dotWidth = actualWidth * widthVariation;

            const perpAngle = angle + Math.PI / 2;
            const offset = (Math.random() - 0.5) * config.roughness * actualWidth;
            const offsetX = Math.cos(perpAngle) * offset;
            const offsetY = Math.sin(perpAngle) * offset;

            this.drawWaxBlob(p.x + offsetX, p.y + offsetY, dotWidth, config);
        }

        if ((points.length - 1) % step !== 0) {
            const last = points[points.length - 1];
            const widthVariation = 1 + (Math.random() - 0.5) * config.roughness;
            this.drawWaxBlob(last.x, last.y, actualWidth * widthVariation, config);
        }
    }

    drawWaxBlob(x, y, width, config) {
        const ctx = this.getActiveCtx();
        const color = this.getActiveColor();

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, width / 2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.6, this.adjustColor(color, 10));
        gradient.addColorStop(0.8, this.adjustColor(color, 20) + 'cc');
        gradient.addColorStop(1, this.adjustColor(color, 30) + '00');

        ctx.beginPath();
        ctx.fillStyle = gradient;

        const points = 12;
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const roughness = 1 + (Math.random() - 0.5) * (1 - config.edgeSmoothness) * 0.5;
            const radius = (width / 2) * roughness;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();

        this.waxPixels += Math.PI * Math.pow(width / 2, 2);
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, Math.max(0, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.min(255, Math.max(0, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.min(255, Math.max(0, parseInt(hex.substr(4, 2), 16) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    drawWaxLine(x1, y1, x2, y2) {
        const rawPoints = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
        const config = this.tempConfig[this.waxTemp];
        this.renderSmoothedPath(rawPoints, config);
    }

    insertTemplate(template) {
        if (this.isDyed) return;

        const centerX = this.waxCanvas.width / 2;
        const centerY = this.waxCanvas.height / 2;
        const config = this.tempConfig[this.waxTemp];

        switch (template) {
            case 'vortex':
                this.drawVortex(centerX, centerY, 150, config);
                break;
            case 'sun':
                this.drawSunPattern(centerX, centerY, 120, config);
                break;
            case 'drum':
                this.drawDrumPattern(centerX, centerY, 140, config);
                break;
        }

        this.compositeWaxPreview();
        this.saveState();
        document.getElementById('status-text').textContent = `已插入${template === 'vortex' ? '涡纹' : template === 'sun' ? '太阳纹' : '铜鼓纹'}模板`;
    }

    drawVortex(cx, cy, radius, config) {
        const numTurns = 3;
        const numPoints = 360;
        const width = this.knifeWidth * config.widthMultiplier;

        const rawPoints1 = [];
        const rawPoints2 = [];

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2 * numTurns;
            const r = (i / numPoints) * radius;
            rawPoints1.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
            rawPoints2.push({ x: cx + Math.cos(angle + Math.PI) * r, y: cy + Math.sin(angle + Math.PI) * r });
        }

        const smoothed1 = PathSmoother.smoothPath(rawPoints1, this.rdpEpsilon, this.bezierSamples);
        const smoothed2 = PathSmoother.smoothPath(rawPoints2, this.rdpEpsilon, this.bezierSamples);

        for (let i = 0; i < smoothed1.length; i++) {
            const widthVariation = 1 + (Math.random() - 0.5) * config.roughness;
            this.drawWaxBlob(smoothed1[i].x, smoothed1[i].y, width * widthVariation, config);
        }
        for (let i = 0; i < smoothed2.length; i++) {
            const widthVariation = 1 + (Math.random() - 0.5) * config.roughness;
            this.drawWaxBlob(smoothed2[i].x, smoothed2[i].y, width * widthVariation, config);
        }

        this.totalDrawLength += numTurns * 2 * Math.PI * radius * 2;
        this.updateInfo();
    }

    drawSunPattern(cx, cy, radius, config) {
        const numRays = 12;
        const width = this.knifeWidth * config.widthMultiplier;

        this.drawCircle(cx, cy, radius * 0.3, width, config);

        for (let i = 0; i < numRays; i++) {
            const angle = (i / numRays) * Math.PI * 2;
            const innerR = radius * 0.4;
            const outerR = radius;

            const x1 = cx + Math.cos(angle) * innerR;
            const y1 = cy + Math.sin(angle) * innerR;
            const x2 = cx + Math.cos(angle) * outerR;
            const y2 = cy + Math.sin(angle) * outerR;

            this.drawWaxLine(x1, y1, x2, y2);
            this.totalDrawLength += (outerR - innerR);
        }

        this.drawCircle(cx, cy, radius, width, config);
        this.updateInfo();
    }

    drawCircle(cx, cy, radius, width, config) {
        const numPoints = 120;
        const rawPoints = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            rawPoints.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
        }

        const smoothed = PathSmoother.smoothPath(rawPoints, this.rdpEpsilon, this.bezierSamples);
        for (let i = 0; i < smoothed.length; i++) {
            const widthVariation = 1 + (Math.random() - 0.5) * config.roughness;
            this.drawWaxBlob(smoothed[i].x, smoothed[i].y, width * widthVariation, config);
        }
        this.totalDrawLength += 2 * Math.PI * radius;
    }

    drawDrumPattern(cx, cy, radius, config) {
        const width = this.knifeWidth * config.widthMultiplier;

        this.drawCircle(cx, cy, radius, width, config);
        this.drawCircle(cx, cy, radius * 0.85, width, config);
        this.drawCircle(cx, cy, radius * 0.6, width, config);

        const numStars = 8;
        const starRadius = radius * 0.2;
        for (let i = 0; i < numStars; i++) {
            const angle = (i / numStars) * Math.PI * 2;
            const sx = cx + Math.cos(angle) * radius * 0.72;
            const sy = cy + Math.sin(angle) * radius * 0.72;
            this.drawStar(sx, sy, starRadius, 5, width, config);
        }

        const rays = 24;
        for (let i = 0; i < rays; i++) {
            const angle = (i / rays) * Math.PI * 2;
            const x1 = cx + Math.cos(angle) * radius * 0.3;
            const y1 = cy + Math.sin(angle) * radius * 0.3;
            const x2 = cx + Math.cos(angle) * radius * 0.5;
            const y2 = cy + Math.sin(angle) * radius * 0.5;
            this.drawWaxLine(x1, y1, x2, y2);
            this.totalDrawLength += radius * 0.2;
        }

        this.updateInfo();
    }

    drawStar(cx, cy, outerRadius, points, width, config) {
        const innerRadius = outerRadius * 0.4;
        const rawPoints = [];

        for (let i = 0; i <= points * 2; i++) {
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            rawPoints.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }

        const smoothed = PathSmoother.smoothPath(rawPoints, this.rdpEpsilon, this.bezierSamples);
        this.renderSmoothedPath(smoothed, config);

        for (let i = 1; i < rawPoints.length; i++) {
            const dx = rawPoints[i].x - rawPoints[i - 1].x;
            const dy = rawPoints[i].y - rawPoints[i - 1].y;
            this.totalDrawLength += Math.sqrt(dx * dx + dy * dy);
        }
    }

    applyDye() {
        if (this.isDyed) return;

        const hasWax = ['yellow', 'red', 'black'].some(color => {
            const ctx = this.waxLayerCtxs[color];
            const data = ctx.getImageData(0, 0, this.mainCanvas.width, this.mainCanvas.height).data;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] > 10) return true;
            }
            return false;
        });

        if (!hasWax) {
            document.getElementById('status-text').textContent = '请先绘制蜡纹再染色';
            return;
        }

        document.getElementById('status-text').textContent = '正在进行靛蓝染色...';

        setTimeout(() => {
            const w = this.mainCanvas.width;
            const h = this.mainCanvas.height;

            const allWaxCanvas = document.createElement('canvas');
            allWaxCanvas.width = w;
            allWaxCanvas.height = h;
            const allWaxCtx = allWaxCanvas.getContext('2d');
            ['yellow', 'red', 'black'].forEach(color => {
                allWaxCtx.drawImage(this.waxLayers[color], 0, 0);
            });

            const dyeCanvas = document.createElement('canvas');
            dyeCanvas.width = w;
            dyeCanvas.height = h;
            const dyeCtx = dyeCanvas.getContext('2d');

            const indigoGradient = dyeCtx.createLinearGradient(0, 0, w, h);
            indigoGradient.addColorStop(0, '#1e3a5f');
            indigoGradient.addColorStop(0.3, '#2c5282');
            indigoGradient.addColorStop(0.5, '#1a365d');
            indigoGradient.addColorStop(0.7, '#2b4c7e');
            indigoGradient.addColorStop(1, '#15304a');

            dyeCtx.fillStyle = indigoGradient;
            dyeCtx.fillRect(0, 0, w, h);

            this.addCrackleEffect(dyeCtx);

            dyeCtx.save();
            dyeCtx.globalCompositeOperation = 'destination-out';
            dyeCtx.drawImage(allWaxCanvas, 0, 0);
            dyeCtx.restore();

            this.mainCtx.fillStyle = '#f5f0e6';
            this.mainCtx.fillRect(0, 0, w, h);

            this.mainCtx.drawImage(dyeCanvas, 0, 0);

            ['red', 'black'].forEach(color => {
                const colorConfig = this.waxColorConfig[color];
                if (!colorConfig.dyePreserve) return;

                const layerCtx = this.waxLayerCtxs[color];
                const layerData = layerCtx.getImageData(0, 0, w, h);
                const preserve = colorConfig.dyePreserve;

                const colorLayer = document.createElement('canvas');
                colorLayer.width = w;
                colorLayer.height = h;
                const colorCtx = colorLayer.getContext('2d');

                const colorImageData = colorCtx.createImageData(w, h);
                const cd = colorImageData.data;
                for (let i = 0; i < layerData.data.length; i += 4) {
                    const alpha = layerData.data[i + 3];
                    if (alpha > 10) {
                        const strength = alpha / 255;
                        const fabricBlend = 0.3;
                        cd[i] = Math.round(preserve.r * strength + (245 * fabricBlend) * (1 - strength));
                        cd[i + 1] = Math.round(preserve.g * strength + (240 * fabricBlend) * (1 - strength));
                        cd[i + 2] = Math.round(preserve.b * strength + (230 * fabricBlend) * (1 - strength));
                        cd[i + 3] = Math.min(255, alpha + 30);
                    }
                }
                colorCtx.putImageData(colorImageData, 0, 0);

                this.mainCtx.drawImage(colorLayer, 0, 0);
            });

            this.waxCtx.clearRect(0, 0, w, h);
            Object.values(this.waxLayerCtxs).forEach(ctx => {
                ctx.clearRect(0, 0, w, h);
            });

            this.isDyed = true;
            document.getElementById('status-text').textContent = '染色完成！冰裂纹效果已生成';
            this.updateInfo();
        }, 800);
    }

    addCrackleEffect(ctx) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;

        const rng = this.seedLock ? new SeededRandom(this.currentSeed) : null;
        const random = this.seedLock ? () => rng.next() : () => Math.random();

        const numCracks = 50;
        for (let i = 0; i < numCracks; i++) {
            let x = random() * ctx.canvas.width;
            let y = random() * ctx.canvas.height;
            let angle = random() * Math.PI * 2;

            for (let j = 0; j < 100; j++) {
                const dx = Math.cos(angle) * 2;
                const dy = Math.sin(angle) * 2;
                x += dx;
                y += dy;

                if (x < 0 || x >= ctx.canvas.width || y < 0 || y >= ctx.canvas.height) break;

                angle += (random() - 0.5) * 0.5;

                for (let k = -1; k <= 1; k++) {
                    for (let l = -1; l <= 1; l++) {
                        const px = Math.floor(x) + k;
                        const py = Math.floor(y) + l;
                        if (px >= 0 && px < ctx.canvas.width && py >= 0 && py < ctx.canvas.height) {
                            const idx = (py * ctx.canvas.width + px) * 4;
                            const lighten = random() * 40;
                            data[idx] = Math.min(255, data[idx] + lighten);
                            data[idx + 1] = Math.min(255, data[idx + 1] + lighten * 0.8);
                            data[idx + 2] = Math.min(255, data[idx + 2] + lighten * 0.6);
                        }
                    }
                }
            }
        }

        for (let i = 0; i < 2000; i++) {
            const x = Math.floor(random() * ctx.canvas.width);
            const y = Math.floor(random() * ctx.canvas.height);
            const idx = (y * ctx.canvas.width + x) * 4;

            if (data[idx + 3] > 128) {
                const noise = (random() - 0.5) * 30;
                data[idx] = Math.max(0, Math.min(255, data[idx] + noise));
                data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + noise * 0.8));
                data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + noise * 0.6));
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    clearCanvas() {
        if (confirm('确定要清除画布吗？')) {
            this.mainCtx.fillStyle = '#f5f0e6';
            this.mainCtx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
            this.waxCtx.clearRect(0, 0, this.waxCanvas.width, this.waxCanvas.height);
            Object.values(this.waxLayerCtxs).forEach(ctx => {
                ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
            });
            this.isDyed = false;
            this.totalDrawLength = 0;
            this.waxPixels = 0;
            this.history = [];
            this.updateInfo();
            this.saveState();
            document.getElementById('status-text').textContent = '画布已清除';
        }
    }

    saveState() {
        const waxState = this.waxCtx.getImageData(0, 0, this.waxCanvas.width, this.waxCanvas.height);
        const mainState = this.mainCtx.getImageData(0, 0, this.mainCanvas.width, this.mainCanvas.height);

        const layerStates = {};
        ['yellow', 'red', 'black'].forEach(color => {
            layerStates[color] = this.waxLayerCtxs[color].getImageData(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        });

        this.history.push({
            wax: waxState,
            main: mainState,
            layers: layerStates,
            isDyed: this.isDyed,
            totalDrawLength: this.totalDrawLength,
            waxPixels: this.waxPixels
        });

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    undo() {
        if (this.history.length > 1) {
            this.history.pop();
            const prevState = this.history[this.history.length - 1];

            this.waxCtx.putImageData(prevState.wax, 0, 0);
            this.mainCtx.putImageData(prevState.main, 0, 0);
            ['yellow', 'red', 'black'].forEach(color => {
                this.waxLayerCtxs[color].putImageData(prevState.layers[color], 0, 0);
            });
            this.isDyed = prevState.isDyed;
            this.totalDrawLength = prevState.totalDrawLength;
            this.waxPixels = prevState.waxPixels;

            this.updateInfo();
            document.getElementById('status-text').textContent = '已撤销';
        } else {
            document.getElementById('status-text').textContent = '没有可撤销的操作';
        }
    }

    exportPNG() {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.mainCanvas.width;
        exportCanvas.height = this.mainCanvas.height;
        const exportCtx = exportCanvas.getContext('2d');

        exportCtx.fillStyle = '#f5f0e6';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        exportCtx.drawImage(this.mainCanvas, 0, 0);
        if (!this.isDyed) {
            this.compositeWaxPreview();
            exportCtx.drawImage(this.waxCanvas, 0, 0);
        }

        const link = document.createElement('a');
        link.download = `蜡染设计_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();

        document.getElementById('status-text').textContent = '设计图已导出';
    }

    updateInfo() {
        const waxUsageGrams = (this.waxPixels * 0.0001).toFixed(2);
        const drawLengthMeters = (this.totalDrawLength * 0.000264583).toFixed(2);
        const dyeTimeMinutes = Math.ceil(this.waxPixels * 0.00002 + 10);

        document.getElementById('wax-usage').textContent = `${waxUsageGrams} g`;
        document.getElementById('draw-length').textContent = `${drawLengthMeters} m`;
        document.getElementById('dye-time').textContent = `${dyeTimeMinutes} 分钟`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BatikSimulator();
});
