class SymmetryEngine {
    static rotatePoint(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            point[0] * cos - point[1] * sin,
            point[0] * sin + point[1] * cos
        ];
    }

    static reflectPoint(point, axisAngle) {
        const cos2 = Math.cos(2 * axisAngle);
        const sin2 = Math.sin(2 * axisAngle);
        return [
            point[0] * cos2 + point[1] * sin2,
            point[0] * sin2 - point[1] * cos2
        ];
    }

    static generateCn(motifVertices, n) {
        const sectors = [];
        for (let k = 0; k < n; k++) {
            const angle = (2 * Math.PI * k) / n;
            const transformed = motifVertices.map(v => {
                const p = this.rotatePoint(v, angle);
                return [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];
            });
            sectors.push({ vertices: transformed, rotationIndex: k, isReflected: false });
        }
        return sectors;
    }

    static generateDn(motifVertices, n) {
        const sectors = [];
        for (let k = 0; k < n; k++) {
            const rotAngle = (2 * Math.PI * k) / n;
            const rotated = motifVertices.map(v => {
                const p = this.rotatePoint(v, rotAngle);
                return [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];
            });
            sectors.push({ vertices: rotated, rotationIndex: k, isReflected: false });
        }
        for (let k = 0; k < n; k++) {
            const rotAngle = (2 * Math.PI * k) / n;
            const reflected = motifVertices.map(v => {
                let p = this.reflectPoint(v, 0);
                p = this.rotatePoint(p, rotAngle);
                return [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];
            });
            sectors.push({ vertices: reflected, rotationIndex: k, isReflected: true });
        }
        return sectors;
    }

    static generate(motifVertices, type, n) {
        return type === 'D' ? this.generateDn(motifVertices, n) : this.generateCn(motifVertices, n);
    }
}

class PatternRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentPattern = null;
        this.currentColors = {
            background: '#1a237e',
            primary: '#c62828',
            secondary: '#d4a574',
            accent: '#f5f0e8',
            outline: '#1a1a2e'
        };
        this.symmetryType = 'D';
        this.symmetryN = 10;
        this.scale = 1.0;
        this.tilingMode = 'single';
        this.allSectors = [];
    }

    render(pattern, symmetryType, symmetryN, scale, tilingMode, colors) {
        this.currentPattern = pattern;
        this.symmetryType = symmetryType;
        this.symmetryN = symmetryN;
        this.scale = scale;
        this.tilingMode = tilingMode;
        this.currentColors = { ...colors };

        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const w = rect.width;
        const h = rect.height;

        this.ctx.fillStyle = colors.background;
        this.ctx.fillRect(0, 0, w, h);

        this.allSectors = SymmetryEngine.generate(pattern.vertices, symmetryType, symmetryN);

        switch (tilingMode) {
            case 'single':
                this._renderSingle(w, h, scale, colors);
                break;
            case 'radial':
                this._renderRadial(w, h, scale, colors);
                break;
            case 'grid':
                this._renderGrid(w, h, scale, colors);
                break;
            case 'carpet':
                this._renderCarpet(w, h, scale, colors);
                break;
        }
    }

    _sectorColor(sector, colors) {
        if (sector.isReflected) {
            return sector.rotationIndex % 2 === 0 ? colors.secondary : colors.accent;
        }
        return sector.rotationIndex % 2 === 0 ? colors.primary : colors.secondary;
    }

    _renderSingle(w, h, scale, colors) {
        const cx = w / 2;
        const cy = h / 2;
        const baseR = Math.min(w, h) * 0.38 * scale;

        this._drawBorder(w, h, colors);

        this.allSectors.forEach(sector => {
            const fill = this._sectorColor(sector, colors);
            this._drawPolygon(sector.vertices, cx, cy, baseR, fill, colors.outline);
        });

        this._drawCenterOrnament(cx, cy, baseR * 0.08, colors);
    }

    _renderRadial(w, h, scale, colors) {
        const cx = w / 2;
        const cy = h / 2;
        const baseR = Math.min(w, h) * 0.16 * scale;

        this._drawBorder(w, h, colors);

        const rings = 3;
        for (let ring = 0; ring < rings; ring++) {
            const ringR = Math.min(w, h) * (0.18 + ring * 0.14) * scale;
            const count = this.symmetryN;
            const ringScale = 1 - ring * 0.15;

            for (let i = 0; i < count; i++) {
                const angle = (2 * Math.PI * i) / count + (ring * Math.PI / count);
                const px = cx + ringR * Math.cos(angle);
                const py = cy + ringR * Math.sin(angle);

                this.ctx.save();
                this.ctx.translate(px, py);
                this.ctx.rotate(angle + Math.PI / 2);

                const ringSectors = SymmetryEngine.generate(
                    this.currentPattern.vertices, this.symmetryType, Math.min(this.symmetryN, 6)
                );
                ringSectors.forEach(sector => {
                    const fill = ring % 2 === 0 ? colors.primary : colors.secondary;
                    const sFill = sector.isReflected ? colors.accent : fill;
                    this._drawPolygonAt(sector.vertices, 0, 0, baseR * 0.5 * ringScale, sFill, colors.outline);
                });

                this.ctx.restore();
            }
        }

        this.allSectors.forEach(sector => {
            const fill = this._sectorColor(sector, colors);
            this._drawPolygon(sector.vertices, cx, cy, baseR * 0.7, fill, colors.outline);
        });
        this._drawCenterOrnament(cx, cy, baseR * 0.35, colors);
    }

    _renderGrid(w, h, scale, colors) {
        const unitR = Math.min(w, h) * 0.1 * scale;
        const step = unitR * 2.4;
        const cols = Math.ceil(w / step) + 1;
        const rows = Math.ceil(h / step) + 1;
        const offsetX = (w - (cols - 1) * step) / 2;
        const offsetY = (h - (rows - 1) * step) / 2;

        this._drawBorder(w, h, colors);

        const gridSectors = SymmetryEngine.generate(
            this.currentPattern.vertices, this.symmetryType, this.symmetryN
        );

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const px = offsetX + col * step + (row % 2 === 1 ? step / 2 : 0);
                const py = offsetY + row * step;

                gridSectors.forEach(sector => {
                    const fill = this._sectorColor(sector, colors);
                    const colorShift = (row + col) % 3;
                    const finalFill = colorShift === 0 ? fill :
                                      colorShift === 1 ? colors.secondary : colors.accent;
                    this._drawPolygonAt(sector.vertices, px, py, unitR, finalFill, colors.outline);
                });
            }
        }
    }

    _renderCarpet(w, h, scale, colors) {
        const cx = w / 2;
        const cy = h / 2;
        const baseR = Math.min(w, h) * 0.32 * scale;

        this._drawCarpetBorder(w, h, colors);

        this.allSectors.forEach(sector => {
            const fill = this._sectorColor(sector, colors);
            this._drawPolygon(sector.vertices, cx, cy, baseR, fill, colors.outline);
        });

        this._drawCenterOrnament(cx, cy, baseR * 0.1, colors);

        const cornerOffset = Math.min(w, h) * 0.35 * scale;
        const cornerR = baseR * 0.3;
        const corners = [
            [cx - cornerOffset, cy - cornerOffset],
            [cx + cornerOffset, cy - cornerOffset],
            [cx - cornerOffset, cy + cornerOffset],
            [cx + cornerOffset, cy + cornerOffset]
        ];

        corners.forEach((pos) => {
            const cornerSectors = SymmetryEngine.generate(
                this.currentPattern.vertices, this.symmetryType, Math.min(this.symmetryN, 4)
            );
            cornerSectors.forEach(sector => {
                const fill = sector.isReflected ? colors.accent : colors.secondary;
                this._drawPolygonAt(sector.vertices, pos[0], pos[1], cornerR, fill, colors.outline);
            });
        });

        const midOffset = cornerOffset;
        const midR = baseR * 0.2;
        const midpoints = [
            [cx, cy - midOffset],
            [cx + midOffset, cy],
            [cx, cy + midOffset],
            [cx - midOffset, cy]
        ];

        midpoints.forEach((pos) => {
            const midSectors = SymmetryEngine.generateCn(
                this.currentPattern.vertices, Math.min(this.symmetryN, 4)
            );
            midSectors.forEach(sector => {
                this._drawPolygonAt(sector.vertices, pos[0], pos[1], midR, colors.primary, colors.outline);
            });
        });
    }

    _drawPolygon(vertices, cx, cy, radius, fillColor, strokeColor) {
        this._drawPolygonAt(vertices, cx, cy, radius, fillColor, strokeColor);
    }

    _drawPolygonAt(vertices, cx, cy, radius, fillColor, strokeColor) {
        if (vertices.length < 2) return;
        this.ctx.beginPath();
        vertices.forEach((v, i) => {
            const x = cx + v[0] * radius;
            const y = cy + v[1] * radius;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.closePath();
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 1.2;
        this.ctx.stroke();
    }

    _drawBorder(w, h, colors) {
        const bw = 6;
        this.ctx.strokeStyle = colors.outline;
        this.ctx.lineWidth = bw;
        this.ctx.strokeRect(bw / 2, bw / 2, w - bw, h - bw);

        this.ctx.strokeStyle = colors.secondary;
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(bw + 3, bw + 3, w - 2 * bw - 6, h - 2 * bw - 6);

        this._drawBorderOrnaments(w, h, colors, bw + 8);
    }

    _drawCarpetBorder(w, h, colors) {
        const bw = Math.min(w, h) * 0.07;

        this.ctx.fillStyle = colors.secondary;
        this.ctx.fillRect(0, 0, w, bw);
        this.ctx.fillRect(0, h - bw, w, bw);
        this.ctx.fillRect(0, 0, bw, h);
        this.ctx.fillRect(w - bw, 0, bw, h);

        this.ctx.strokeStyle = colors.outline;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(bw, bw, w - 2 * bw, h - 2 * bw);

        this.ctx.strokeStyle = colors.accent;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(bw + 3, bw + 3, w - 2 * bw - 6, h - 2 * bw - 6);

        const innerBw = bw * 0.4;
        this.ctx.fillStyle = colors.primary;
        this.ctx.fillRect(bw + 6, bw + 6, w - 2 * bw - 12, innerBw);
        this.ctx.fillRect(bw + 6, h - bw - 6 - innerBw, w - 2 * bw - 12, innerBw);
        this.ctx.fillRect(bw + 6, bw + 6, innerBw, h - 2 * bw - 12);
        this.ctx.fillRect(w - bw - 6 - innerBw, bw + 6, innerBw, h - 2 * bw - 12);

        this._drawBorderOrnaments(w, h, colors, bw);
    }

    _drawBorderOrnaments(w, h, colors, offset) {
        const step = Math.min(w, h) / (this.symmetryN * 2);
        this.ctx.strokeStyle = colors.accent;
        this.ctx.lineWidth = 0.8;

        for (let x = offset + step / 2; x < w - offset; x += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - step * 0.3, offset - 4);
            this.ctx.lineTo(x, offset - 1);
            this.ctx.lineTo(x + step * 0.3, offset - 4);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(x - step * 0.3, h - offset + 4);
            this.ctx.lineTo(x, h - offset + 1);
            this.ctx.lineTo(x + step * 0.3, h - offset + 4);
            this.ctx.stroke();
        }

        for (let y = offset + step / 2; y < h - offset; y += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(offset - 4, y - step * 0.3);
            this.ctx.lineTo(offset - 1, y);
            this.ctx.lineTo(offset - 4, y + step * 0.3);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(w - offset + 4, y - step * 0.3);
            this.ctx.lineTo(w - offset + 1, y);
            this.ctx.lineTo(w - offset + 4, y + step * 0.3);
            this.ctx.stroke();
        }
    }

    _drawCenterOrnament(cx, cy, r, colors) {
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        this.ctx.fillStyle = colors.accent;
        this.ctx.fill();
        this.ctx.strokeStyle = colors.outline;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.55, 0, 2 * Math.PI);
        this.ctx.fillStyle = colors.primary;
        this.ctx.fill();
        this.ctx.stroke();
    }

    generateSVG(pattern, symmetryType, symmetryN, scale, tilingMode, colors, width, height) {
        const sectors = SymmetryEngine.generate(pattern.vertices, symmetryType, symmetryN);
        const cx = width / 2;
        const cy = height / 2;
        const baseR = Math.min(width, height) * 0.38 * scale;

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
        svg += `  <rect width="${width}" height="${height}" fill="${colors.background}"/>\n`;

        sectors.forEach(sector => {
            const fill = this._sectorColor(sector, colors);
            const points = sector.vertices.map(v => `${(cx + v[0] * baseR).toFixed(2)},${(cy + v[1] * baseR).toFixed(2)}`).join(' ');
            svg += `  <polygon points="${points}" fill="${fill}" stroke="${colors.outline}" stroke-width="1.2"/>\n`;
        });

        svg += `  <circle cx="${cx}" cy="${cy}" r="${(baseR * 0.08).toFixed(2)}" fill="${colors.accent}" stroke="${colors.outline}" stroke-width="1.5"/>\n`;
        svg += `  <circle cx="${cx}" cy="${cy}" r="${(baseR * 0.044).toFixed(2)}" fill="${colors.primary}" stroke="${colors.outline}" stroke-width="1"/>\n`;
        svg += '</svg>';

        return svg;
    }
}

class ColorManager {
    constructor() {
        this.currentColors = {
            background: '#1a237e',
            primary: '#c62828',
            secondary: '#d4a574',
            accent: '#f5f0e8',
            outline: '#1a1a2e'
        };
        this.history = [];
    }

    setColors(colors) { this.currentColors = { ...colors }; }
    setColor(key, value) { this.currentColors[key] = value; }
    getColors() { return { ...this.currentColors }; }

    async loadHistory() {
        try {
            const res = await fetch('/api/color-history');
            if (res.ok) this.history = await res.json();
        } catch (e) { console.error('Failed to load color history:', e); }
    }

    async saveToHistory() {
        try {
            const res = await fetch('/api/color-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ colors: this.currentColors })
            });
            if (res.ok) await this.loadHistory();
        } catch (e) { console.error('Failed to save color history:', e); }
    }

    async deleteFromHistory(id) {
        try {
            await fetch(`/api/color-history/${id}`, { method: 'DELETE' });
            await this.loadHistory();
        } catch (e) { console.error('Failed to delete color history:', e); }
    }
}

class SymmetryInfo {
    static getInfo(type, n) {
        if (type === 'D') {
            return {
                name: `D_${n}`, nameCn: `二面体群 D_${n}`,
                order: 2 * n,
                description: `二面体群 D_${n} 包含 ${n} 次旋转对称和 ${n} 条反射轴，共 ${2 * n} 个对称操作。这是波斯地毯中最常见的对称类型。`,
                rotations: n, reflections: n,
                formula: `D_${n} = { r^k · s^j | k=0..${n - 1}, j=0,1 }\nr: 旋转 ${360 / n}°\ns: 反射（主轴）\n|D_${n}| = 2 × ${n} = ${2 * n}`,
                carpetNote: `D_${n} 对称在波斯地毯中表现为：中央徽章的 ${n} 重旋转对称配合 ${n} 条镜像轴，使图案既具旋转动感又保持平衡。`
            };
        }
        return {
            name: `C_${n}`, nameCn: `循环群 C_${n}`,
            order: n,
            description: `循环群 C_${n} 仅包含 ${n} 次旋转对称，不含反射对称，共 ${n} 个对称操作。产生方向性图案，常用于边框装饰。`,
            rotations: n, reflections: 0,
            formula: `C_${n} = { r^k | k=0..${n - 1} }\nr: 旋转 ${360 / n}°\n|C_${n}| = ${n}`,
            carpetNote: `C_${n} 对称在波斯地毯中较少见，因为伊斯兰艺术偏好含反射的完全对称。C_${n} 图案具有旋转方向性，适合表现流动感。`
        };
    }
}

class ExportManager {
    static exportSVG(renderer, pattern, symmetryType, symmetryN, scale, tilingMode, colors) {
        const svgContent = renderer.generateSVG(pattern, symmetryType, symmetryN, scale, tilingMode, colors, 800, 800);
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `persian-pattern-${pattern.name_en.replace(/\s+/g, '-').toLowerCase()}-${symmetryType}${symmetryN}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static exportPDF(renderer, pattern, symmetryType, symmetryN, scale, tilingMode, colors) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const svgContent = renderer.generateSVG(pattern, symmetryType, symmetryN, scale, tilingMode, colors, 800, 800);
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const canvas = document.createElement('canvas');
        canvas.width = 2400;
        canvas.height = 2400;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = colors.background;
            ctx.fillRect(0, 0, 2400, 2400);
            ctx.drawImage(img, 0, 0, 2400, 2400);

            const imgData = canvas.toDataURL('image/png');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const size = Math.min(pageWidth, pageHeight) - 2 * margin;

            pdf.addImage(imgData, 'PNG', margin, margin, size, size);
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`${pattern.name} | ${symmetryType}_${symmetryN} | Persian Islamic Geometric Pattern`, margin, pageHeight - 8);
            pdf.save(`persian-pattern-${pattern.name_en.replace(/\s+/g, '-').toLowerCase()}-${symmetryType}${symmetryN}.pdf`);
            URL.revokeObjectURL(svgUrl);
        };
        img.src = svgUrl;
    }
}

class App {
    constructor() {
        this.patterns = [];
        this.presets = [];
        this.selectedPattern = null;
        this.renderer = null;
        this.colorManager = new ColorManager();
        this.symmetryType = 'D';
        this.symmetryN = 10;
        this.scale = 1.0;
        this.tilingMode = 'single';
    }

    async init() {
        this.renderer = new PatternRenderer(document.getElementById('main-canvas'));

        await Promise.all([
            this.loadPatterns(),
            this.loadPresets(),
            this.colorManager.loadHistory()
        ]);

        this.setupCanvasSize();
        this.renderPatternList();
        this.renderPresetList();
        this.renderColorHistory();
        this.bindEvents();
        this.updateSymmetryInfo();

        if (this.patterns.length > 0) {
            this.selectPattern(this.patterns[0]);
        }

        window.addEventListener('resize', () => {
            this.setupCanvasSize();
            this.renderCurrent();
        });
    }

    setupCanvasSize() {
        const area = document.getElementById('canvas-area');
        const canvas = document.getElementById('main-canvas');
        const w = area.clientWidth - 40;
        const h = area.clientHeight - 40;
        const size = Math.min(w, h, 800);
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
    }

    async loadPatterns() {
        try {
            const res = await fetch('/api/patterns');
            this.patterns = await res.json();
        } catch (e) { console.error('Failed to load patterns:', e); }
    }

    async loadPresets() {
        try {
            const res = await fetch('/api/isfahan-presets');
            this.presets = await res.json();
        } catch (e) { console.error('Failed to load presets:', e); }
    }

    renderPatternList() {
        const container = document.getElementById('pattern-list');
        container.innerHTML = '';

        this.patterns.forEach(p => {
            const card = document.createElement('div');
            card.className = 'pattern-card';
            card.dataset.patternId = p.id;

            const miniCanvas = document.createElement('canvas');
            miniCanvas.width = 160;
            miniCanvas.height = 160;
            miniCanvas.style.width = '80px';
            miniCanvas.style.height = '80px';
            this._drawMiniPreview(miniCanvas, p);

            const name = document.createElement('div');
            name.className = 'pattern-name';
            name.textContent = p.name;

            card.appendChild(miniCanvas);
            card.appendChild(name);
            card.addEventListener('click', () => this.selectPattern(p));
            container.appendChild(card);
        });
    }

    _drawMiniPreview(canvas, pattern) {
        const ctx = canvas.getContext('2d');
        const cx = 80;
        const cy = 80;
        const r = 60;

        ctx.fillStyle = '#1a1832';
        ctx.fillRect(0, 0, 160, 160);

        const sectors = SymmetryEngine.generate(pattern.vertices, pattern.symmetry_type, pattern.default_n);
        sectors.forEach(sector => {
            ctx.beginPath();
            sector.vertices.forEach((v, i) => {
                const x = cx + v[0] * r;
                const y = cy + v[1] * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            const fillColors = sector.isReflected
                ? ['#d4a57480', '#f5f0e880']
                : ['#c6282880', '#d4a57480'];
            ctx.fillStyle = fillColors[sector.rotationIndex % 2];
            ctx.fill();
            ctx.strokeStyle = '#d4a574';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        });
    }

    renderPresetList() {
        const container = document.getElementById('isfahan-presets');
        container.innerHTML = '';

        this.presets.forEach(preset => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            card.dataset.presetId = preset.id;

            const name = document.createElement('div');
            name.className = 'preset-name';
            name.textContent = `${preset.name} · ${preset.name_en}`;

            const desc = document.createElement('div');
            desc.className = 'preset-desc';
            desc.textContent = preset.description;

            const colorsDiv = document.createElement('div');
            colorsDiv.className = 'preset-colors';
            Object.values(preset.colors).forEach(c => {
                const swatch = document.createElement('span');
                swatch.style.background = c;
                colorsDiv.appendChild(swatch);
            });

            card.appendChild(name);
            card.appendChild(desc);
            card.appendChild(colorsDiv);
            card.addEventListener('click', () => this.applyPreset(preset));
            container.appendChild(card);
        });
    }

    renderColorHistory() {
        const container = document.getElementById('color-history');
        container.innerHTML = '';

        if (this.colorManager.history.length === 0) {
            container.innerHTML = '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:12px;">暂无配色历史</div>';
            return;
        }

        this.colorManager.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';

            const colorsDiv = document.createElement('div');
            colorsDiv.className = 'history-colors';
            Object.values(item.colors).forEach(c => {
                const swatch = document.createElement('span');
                swatch.style.background = c;
                colorsDiv.appendChild(swatch);
            });

            const time = document.createElement('span');
            time.className = 'history-time';
            if (item.created_at) {
                const d = new Date(item.created_at + 'Z');
                time.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
            }

            const delBtn = document.createElement('button');
            delBtn.className = 'history-delete';
            delBtn.textContent = '×';
            delBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.colorManager.deleteFromHistory(item.id);
                this.renderColorHistory();
            });

            div.appendChild(colorsDiv);
            div.appendChild(time);
            div.appendChild(delBtn);
            div.addEventListener('click', () => {
                this.colorManager.setColors(item.colors);
                this.syncColorInputs();
                this.renderCurrent();
            });
            container.appendChild(div);
        });
    }

    selectPattern(pattern) {
        this.selectedPattern = pattern;

        document.querySelectorAll('.pattern-card').forEach(card => {
            card.classList.toggle('active', parseInt(card.dataset.patternId) === pattern.id);
        });
        document.querySelectorAll('.preset-card').forEach(card => card.classList.remove('active'));

        this.symmetryType = pattern.symmetry_type;
        this.symmetryN = pattern.default_n;

        document.getElementById('btn-dn').classList.toggle('active', this.symmetryType === 'D');
        document.getElementById('btn-cn').classList.toggle('active', this.symmetryType === 'C');
        document.getElementById('symmetry-n').value = this.symmetryN;
        document.getElementById('n-display').textContent = this.symmetryN;

        this.updateSymmetryInfo();
        this.renderCurrent();
    }

    async applyPreset(preset) {
        document.querySelectorAll('.preset-card').forEach(card => {
            card.classList.toggle('active', parseInt(card.dataset.presetId) === preset.id);
        });

        this.colorManager.setColors(preset.colors);
        this.syncColorInputs();

        const firstPatternId = preset.pattern_ids[0];
        const pattern = this.patterns.find(p => p.id === firstPatternId);
        if (pattern) this.selectPattern(pattern);

        const firstRepeatKey = Object.keys(preset.repeat_counts)[0];
        if (firstRepeatKey) {
            const n = preset.repeat_counts[firstRepeatKey];
            this.symmetryN = n;
            document.getElementById('symmetry-n').value = n;
            document.getElementById('n-display').textContent = n;
        }

        switch (preset.layout_type) {
            case 'medallion': this.tilingMode = 'carpet'; break;
            case 'allover': this.tilingMode = 'grid'; break;
            case 'prayer': this.tilingMode = 'single'; break;
        }
        document.getElementById('tiling-mode').value = this.tilingMode;

        this.updateSymmetryInfo();
        this.renderCurrent();
    }

    renderCurrent() {
        if (!this.selectedPattern) return;
        this.renderer.render(
            this.selectedPattern,
            this.symmetryType,
            this.symmetryN,
            this.scale,
            this.tilingMode,
            this.colorManager.getColors()
        );
    }

    syncColorInputs() {
        const colors = this.colorManager.getColors();
        const map = { 'bg': 'background', 'primary': 'primary', 'secondary': 'secondary', 'accent': 'accent', 'outline': 'outline' };
        Object.entries(map).forEach(([suffix, key]) => {
            const input = document.getElementById(`color-${suffix}`);
            const hex = document.getElementById(`hex-${suffix}`);
            if (input) input.value = colors[key];
            if (hex) hex.textContent = colors[key];
        });
    }

    updateSymmetryInfo() {
        const info = SymmetryInfo.getInfo(this.symmetryType, this.symmetryN);
        const container = document.getElementById('symmetry-detail');
        container.innerHTML = `
            <h3>${info.nameCn}</h3>
            <p>${info.description}</p>
            <div class="formula">${info.formula}</div>
            <p>群阶: <strong>|${info.name}| = ${info.order}</strong></p>
            <p>旋转操作: ${info.rotations} 个 &nbsp; 反射操作: ${info.reflections} 个</p>
            <p class="note">🧶 ${info.carpetNote}</p>
        `;
    }

    bindEvents() {
        document.getElementById('symmetry-n').addEventListener('input', (e) => {
            this.symmetryN = parseInt(e.target.value);
            document.getElementById('n-display').textContent = this.symmetryN;
            this.updateSymmetryInfo();
            this.renderCurrent();
        });

        document.getElementById('pattern-scale').addEventListener('input', (e) => {
            this.scale = parseFloat(e.target.value);
            document.getElementById('scale-display').textContent = this.scale.toFixed(1);
            this.renderCurrent();
        });

        document.getElementById('btn-dn').addEventListener('click', () => {
            this.symmetryType = 'D';
            document.getElementById('btn-dn').classList.add('active');
            document.getElementById('btn-cn').classList.remove('active');
            this.updateSymmetryInfo();
            this.renderCurrent();
        });

        document.getElementById('btn-cn').addEventListener('click', () => {
            this.symmetryType = 'C';
            document.getElementById('btn-cn').classList.add('active');
            document.getElementById('btn-dn').classList.remove('active');
            this.updateSymmetryInfo();
            this.renderCurrent();
        });

        document.getElementById('tiling-mode').addEventListener('change', (e) => {
            this.tilingMode = e.target.value;
            this.renderCurrent();
        });

        const colorMap = {
            'color-bg': 'background', 'color-primary': 'primary',
            'color-secondary': 'secondary', 'color-accent': 'accent', 'color-outline': 'outline'
        };

        Object.entries(colorMap).forEach(([inputId, colorKey]) => {
            const input = document.getElementById(inputId);
            input.addEventListener('input', (e) => {
                this.colorManager.setColor(colorKey, e.target.value);
                const suffix = inputId.replace('color-', '');
                document.getElementById(`hex-${suffix}`).textContent = e.target.value;
                this.renderCurrent();
            });
        });

        document.querySelectorAll('.swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                const color = swatch.dataset.color;
                const activeInput = document.activeElement;
                if (activeInput && activeInput.classList.contains('color-picker')) {
                    activeInput.value = color;
                    const suffix = activeInput.id.replace('color-', '');
                    const key = colorMap[activeInput.id];
                    this.colorManager.setColor(key, color);
                    document.getElementById(`hex-${suffix}`).textContent = color;
                } else {
                    this.colorManager.setColor('primary', color);
                    document.getElementById('color-primary').value = color;
                    document.getElementById('hex-primary').textContent = color;
                }
                this.renderCurrent();
            });
        });

        document.getElementById('btn-save-colors').addEventListener('click', async () => {
            await this.colorManager.saveToHistory();
            this.renderColorHistory();
        });

        document.getElementById('btn-export-svg').addEventListener('click', () => {
            if (!this.selectedPattern) return;
            ExportManager.exportSVG(this.renderer, this.selectedPattern,
                this.symmetryType, this.symmetryN, this.scale, this.tilingMode, this.colorManager.getColors());
        });

        document.getElementById('btn-export-pdf').addEventListener('click', () => {
            if (!this.selectedPattern) return;
            ExportManager.exportPDF(this.renderer, this.selectedPattern,
                this.symmetryType, this.symmetryN, this.scale, this.tilingMode, this.colorManager.getColors());
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
