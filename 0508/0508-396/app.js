class ImageVectorizer {
    constructor() {
        this.originalImage = null;
        this.imageData = null;
        this.currentSVG = null;
        this.zoomLevel = 100;
        this.maxImageSize = 2000;
        
        this.batchQueue = [];
        this.currentBatchIndex = -1;
        this.batchProcessing = false;
        
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.originalCanvas = document.getElementById('originalCanvas');
        this.originalCanvasLarge = document.getElementById('originalCanvasLarge');
        this.svgContainer = document.getElementById('svgContainer');
        this.svgContainerLarge = document.getElementById('svgContainerLarge');
        this.vectorizeBtn = document.getElementById('vectorizeBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.colorMode = document.getElementById('colorMode');
        this.colorCount = document.getElementById('colorCount');
        this.colorCountValue = document.getElementById('colorCountValue');
        this.colorCountGroup = document.getElementById('colorCountGroup');
        this.tolerance = document.getElementById('tolerance');
        this.toleranceValue = document.getElementById('toleranceValue');
        this.minArea = document.getElementById('minArea');
        this.minAreaValue = document.getElementById('minAreaValue');
        this.threshold = document.getElementById('threshold');
        this.thresholdValue = document.getElementById('thresholdValue');
        
        this.imageSizeEl = document.getElementById('imageSize');
        this.pathCountEl = document.getElementById('pathCount');
        this.processTimeEl = document.getElementById('processTime');
        
        this.zoomLevelEl = document.getElementById('zoomLevel');
        this.zoomInBtn = document.getElementById('zoomIn');
        this.zoomOutBtn = document.getElementById('zoomOut');
        this.zoomFitBtn = document.getElementById('zoomFit');
        
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        this.presetBtns = document.querySelectorAll('.preset-btn');
        
        this.batchList = document.getElementById('batchList');
        this.batchCount = document.getElementById('batchCount');
        this.batchProcessBtn = document.getElementById('batchProcessBtn');
        this.batchExportBtn = document.getElementById('batchExportBtn');
        this.clearBatchBtn = document.getElementById('clearBatchBtn');
        this.batchProgress = document.getElementById('batchProgress');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.currentFileName = document.getElementById('currentFileName');
    }

    initEventListeners() {
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.addFilesToBatch(files);
            }
        });
        
        this.vectorizeBtn.addEventListener('click', () => this.vectorize());
        this.exportBtn.addEventListener('click', () => this.exportSVG());
        
        this.batchProcessBtn.addEventListener('click', () => this.processBatch());
        this.batchExportBtn.addEventListener('click', () => this.exportBatch());
        this.clearBatchBtn.addEventListener('click', () => this.clearBatch());
        
        this.colorCount.addEventListener('input', (e) => {
            this.colorCountValue.textContent = e.target.value;
        });
        this.tolerance.addEventListener('input', (e) => {
            this.toleranceValue.textContent = parseFloat(e.target.value).toFixed(1);
        });
        this.minArea.addEventListener('input', (e) => {
            this.minAreaValue.textContent = e.target.value;
        });
        this.threshold.addEventListener('input', (e) => {
            this.thresholdValue.textContent = e.target.value;
        });
        
        this.colorMode.addEventListener('change', (e) => {
            if (e.target.value === 'bw') {
                this.colorCountGroup.style.display = 'none';
            } else {
                this.colorCountGroup.style.display = 'block';
            }
        });
        
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        this.zoomInBtn.addEventListener('click', () => this.setZoom(this.zoomLevel + 25));
        this.zoomOutBtn.addEventListener('click', () => this.setZoom(this.zoomLevel - 25));
        this.zoomFitBtn.addEventListener('click', () => this.setZoom(100, true));
        
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.loadPresetImageToBatch(preset);
            });
        });
    }

    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            this.addFilesToBatch(files);
        }
    }

    addFilesToBatch(files) {
        const validFiles = files.filter(f => f.type.match('image.*'));
        
        if (validFiles.length === 0) {
            alert('请上传有效的图片文件！');
            return;
        }
        
        validFiles.forEach(file => {
            this.addFileToBatch(file);
        });
        
        this.fileInput.value = '';
    }

    addFileToBatch(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const item = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    file: file,
                    image: img,
                    dataUrl: e.target.result,
                    status: 'pending',
                    svg: null,
                    error: null
                };
                this.batchQueue.push(item);
                this.updateBatchList();
                this.updateBatchButtons();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    loadImageFromFile(file) {
        if (!file.type.match('image.*')) {
            alert('请上传图片文件！');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImageFromUrl(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    loadImageFromUrl(url) {
        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            this.processImage(img);
        };
        img.src = url;
    }

    updateBatchList() {
        if (this.batchQueue.length === 0) {
            this.batchList.innerHTML = `
                <div class="batch-empty">
                    <span class="empty-icon">📋</span>
                    <p>暂无待处理图片</p>
                </div>
            `;
        } else {
            this.batchList.innerHTML = '';
            this.batchQueue.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = `batch-item ${item.status}`;
                
                const statusIcon = {
                    'pending': '⏳',
                    'processing': '⚙️',
                    'completed': '✅',
                    'error': '❌',
                    'active': '👁️'
                }[item.status] || '⏳';
                
                div.innerHTML = `
                    <img src="${item.dataUrl}" class="batch-item-thumb" alt="${item.name}">
                    <div class="batch-item-info">
                        <div class="batch-item-name">${item.name}</div>
                        <div class="batch-item-meta">${item.image.width} × ${item.image.height}</div>
                    </div>
                    <span class="batch-item-status">${statusIcon}</span>
                    <button class="batch-item-remove" data-index="${index}" title="移除">×</button>
                `;
                
                div.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('batch-item-remove')) {
                        this.selectBatchItem(index);
                    }
                });
                
                const removeBtn = div.querySelector('.batch-item-remove');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeFromBatch(parseInt(removeBtn.dataset.index));
                });
                
                this.batchList.appendChild(div);
            });
        }
        
        this.batchCount.textContent = `${this.batchQueue.length} 张图片`;
    }

    updateBatchButtons() {
        const hasItems = this.batchQueue.length > 0;
        const hasCompleted = this.batchQueue.some(item => item.status === 'completed');
        
        this.batchProcessBtn.disabled = !hasItems || this.batchProcessing;
        this.batchExportBtn.disabled = !hasCompleted || this.batchProcessing;
        this.clearBatchBtn.disabled = !hasItems || this.batchProcessing;
    }

    selectBatchItem(index) {
        const item = this.batchQueue[index];
        if (!item) return;
        
        this.batchQueue.forEach((i, idx) => {
            if (i.status !== 'processing' && i.status !== 'completed' && i.status !== 'error') {
                i.status = idx === index ? 'active' : 'pending';
            }
        });
        
        this.originalImage = item.image;
        this.processImage(item.image);
        
        if (item.svg) {
            this.currentSVG = item.svg;
            this.displaySVG(item.svg);
            this.exportBtn.disabled = false;
            
            const pathCount = (item.svg.match(/<path/g) || []).length;
            this.pathCountEl.textContent = pathCount;
        } else {
            this.resetSVGContainers();
        }
        
        this.updateBatchList();
    }

    removeFromBatch(index) {
        if (this.batchProcessing) return;
        this.batchQueue.splice(index, 1);
        
        if (this.currentBatchIndex >= index) {
            this.currentBatchIndex--;
        }
        
        this.updateBatchList();
        this.updateBatchButtons();
    }

    clearBatch() {
        if (this.batchProcessing) return;
        if (confirm('确定要清空批处理队列吗？')) {
            this.batchQueue = [];
            this.currentBatchIndex = -1;
            this.updateBatchList();
            this.updateBatchButtons();
            this.batchProgress.style.display = 'none';
        }
    }

    processImage(img) {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > this.maxImageSize || height > this.maxImageSize) {
            const ratio = Math.min(this.maxImageSize / width, this.maxImageSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        this.imageData = ctx.getImageData(0, 0, width, height);
        
        this.drawOriginalImage();
        
        this.imageSizeEl.textContent = `${width} × ${height}`;
        this.pathCountEl.textContent = '-';
        this.processTimeEl.textContent = '-';
        this.vectorizeBtn.disabled = false;
        
        this.resetSVGContainers();
    }

    drawOriginalImage() {
        const draw = (canvas) => {
            canvas.width = this.imageData.width;
            canvas.height = this.imageData.height;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(this.imageData, 0, 0);
        };
        
        draw(this.originalCanvas);
        draw(this.originalCanvasLarge);
    }

    resetSVGContainers() {
        const placeholder = `
            <div class="placeholder">
                <div class="placeholder-icon">🎨</div>
                <p>上传图片并点击"开始矢量化"</p>
            </div>
        `;
        this.svgContainer.innerHTML = placeholder;
        this.svgContainerLarge.innerHTML = placeholder;
        this.exportBtn.disabled = true;
        this.currentSVG = null;
    }

    async vectorize() {
        if (!this.imageData) return;
        
        this.loadingOverlay.classList.add('active');
        const startTime = performance.now();
        
        try {
            const colorMode = this.colorMode.value;
            const tolerance = parseFloat(this.tolerance.value);
            const minArea = parseInt(this.minArea.value);
            const threshold = parseInt(this.threshold.value);
            const colorCount = parseInt(this.colorCount.value);
            
            let svg;
            if (colorMode === 'bw') {
                svg = await this.vectorizeBW(tolerance, minArea, threshold);
            } else {
                svg = await this.vectorizeColor(tolerance, minArea, colorCount);
            }
            
            this.currentSVG = svg;
            this.displaySVG(svg);
            
            const pathCount = (svg.match(/<path/g) || []).length;
            const endTime = performance.now();
            const processTime = ((endTime - startTime) / 1000).toFixed(2);
            
            this.pathCountEl.textContent = pathCount;
            this.processTimeEl.textContent = `${processTime}s`;
            this.exportBtn.disabled = false;
            
        } catch (error) {
            console.error('Vectorization error:', error);
            alert('矢量化处理出错，请重试！');
        }
        
        this.loadingOverlay.classList.remove('active');
    }

    async vectorizeBW(tolerance, minArea, threshold) {
        const { width, height, data } = this.imageData;
        const binaryData = new Uint8Array(width * height);
        
        for (let i = 0; i < width * height; i++) {
            const idx = i * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
            binaryData[i] = brightness < threshold ? 1 : 0;
        }
        
        if (typeof PotraceWASM !== 'undefined') {
            try {
                return await this.vectorizeWithPotrace(binaryData, width, height, '#000000', tolerance, minArea);
            } catch (e) {
                console.log('Potrace WASM not available, using fallback method');
            }
        }
        
        return this.vectorizeFallback(binaryData, width, height, tolerance, minArea);
    }

    async vectorizeColor(tolerance, minArea, colorCount) {
        const { width, height, data } = this.imageData;
        
        const pixels = [];
        for (let i = 0; i < width * height; i++) {
            const idx = i * 4;
            pixels.push([data[idx], data[idx + 1], data[idx + 2]]);
        }
        
        const { labCenters, assignments } = this.quantizeColorsLab(pixels, colorCount);
        
        const pixelAssignments = new Int32Array(width * height).fill(-1);
        for (let i = 0; i < assignments.length; i++) {
            pixelAssignments[i] = assignments[i];
        }
        
        const colorLayers = [];
        for (let c = 0; c < labCenters.length; c++) {
            const binaryData = new Uint8Array(width * height);
            for (let i = 0; i < width * height; i++) {
                if (pixelAssignments[i] === c) {
                    binaryData[i] = 1;
                }
            }
            
            this.removeSmallRegions(binaryData, width, height, minArea);
            
            const pixelCount = this.countPixels(binaryData);
            if (pixelCount > minArea * 2) {
                const exactColor = this.findDominantColor(pixels, pixelAssignments, c);
                colorLayers.push({ 
                    color: exactColor, 
                    data: binaryData, 
                    count: pixelCount 
                });
            }
        }
        
        colorLayers.sort((a, b) => b.count - a.count);
        
        let svgContent = '';
        for (const layer of colorLayers) {
            const hexColor = this.rgbToHex(layer.color);
            if (typeof PotraceWASM !== 'undefined') {
                try {
                    const layerSVG = await this.vectorizeWithPotrace(layer.data, width, height, hexColor, tolerance, minArea);
                    const paths = layerSVG.match(/<path[^>]*\/>/g) || [];
                    svgContent += paths.join('\n') + '\n';
                } catch (e) {
                    console.log('Fallback for layer');
                    const layerSVG = this.vectorizeFallback(layer.data, width, height, tolerance, minArea);
                    const paths = layerSVG.match(/<path[^>]*\/>/g) || [];
                    svgContent += paths.map(p => p.replace('fill="#000000"', `fill="${hexColor}"`)).join('\n') + '\n';
                }
            } else {
                const layerSVG = this.vectorizeFallback(layer.data, width, height, tolerance, minArea);
                const paths = layerSVG.match(/<path[^>]*\/>/g) || [];
                svgContent += paths.map(p => p.replace('fill="#000000"', `fill="${hexColor}"`)).join('\n') + '\n';
            }
        }
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${svgContent}</svg>`;
    }

    async vectorizeWithPotrace(binaryData, width, height, color, tolerance, minArea) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const potraceResult = this.runPotrace(binaryData, width, height, tolerance, minArea);
                const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <path fill="${color}" d="${potraceResult}"/>
</svg>`;
                resolve(svg);
            }, 100);
        });
    }

    runPotrace(binaryData, width, height, tolerance, minArea) {
        const contours = this.findContours(binaryData, width, height);
        const filteredContours = contours.filter(c => c.points.length > minArea);
        let pathData = '';
        
        for (const contour of filteredContours) {
            const simplified = this.simplifyContour(contour.points, tolerance);
            const smoothed = this.fitCurve(simplified, tolerance);
            pathData += smoothed + ' ';
        }
        
        return pathData || 'M0,0';
    }

    findContours(binaryData, width, height) {
        const contours = [];
        const visited = new Uint8Array(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                if (binaryData[idx] === 1 && visited[idx] === 0) {
                    const contour = this.traceContour(binaryData, width, height, x, y, visited);
                    if (contour.points.length > 3) {
                        contours.push(contour);
                    }
                }
            }
        }
        
        return contours;
    }

    traceContour(binaryData, width, height, startX, startY, visited) {
        const points = [];
        let x = startX;
        let y = startY;
        
        const dx = [1, 1, 0, -1, -1, -1, 0, 1];
        const dy = [0, 1, 1, 1, 0, -1, -1, -1];
        
        let dir = 0;
        let maxIterations = width * height * 2;
        let iterations = 0;
        
        do {
            points.push({ x, y });
            visited[y * width + x] = 1;
            
            let found = false;
            for (let i = 0; i < 8; i++) {
                const checkDir = (dir + i + 6) % 8;
                const nx = x + dx[checkDir];
                const ny = y + dy[checkDir];
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nidx = ny * width + nx;
                    if (binaryData[nidx] === 1 && visited[nidx] === 0) {
                        x = nx;
                        y = ny;
                        dir = checkDir;
                        found = true;
                        break;
                    }
                }
            }
            
            if (!found) break;
            iterations++;
        } while ((x !== startX || y !== startY) && iterations < maxIterations);
        
        return { points };
    }

    simplifyContour(points, tolerance) {
        if (points.length <= 2) return points;
        
        const result = [points[0]];
        let lastPoint = points[0];
        
        for (let i = 1; i < points.length - 1; i++) {
            const distance = Math.sqrt(
                Math.pow(points[i].x - lastPoint.x, 2) + 
                Math.pow(points[i].y - lastPoint.y, 2)
            );
            
            if (distance >= tolerance) {
                result.push(points[i]);
                lastPoint = points[i];
            }
        }
        
        result.push(points[points.length - 1]);
        return result;
    }

    fitCurve(points, tolerance) {
        if (points.length < 2) return '';
        
        let d = `M${points[0].x},${points[0].y}`;
        
        for (let i = 1; i < points.length; i += 3) {
            if (i + 2 < points.length) {
                const p1 = points[i];
                const p2 = points[i + 1];
                const p3 = points[i + 2];
                d += ` C${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
            } else if (i < points.length) {
                d += ` L${points[i].x},${points[i].y}`;
            }
        }
        
        d += ' Z';
        return d;
    }

    vectorizeFallback(binaryData, width, height, tolerance, minArea) {
        const contours = this.findContours(binaryData, width, height);
        const filteredContours = contours.filter(c => c.points.length > minArea);
        
        let paths = '';
        for (const contour of filteredContours) {
            const simplified = this.simplifyContour(contour.points, tolerance);
            const pathData = this.pointsToPath(simplified);
            paths += `  <path fill="#000000" d="${pathData}"/>\n`;
        }
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${paths}</svg>`;
    }

    pointsToPath(points) {
        if (points.length === 0) return '';
        let d = `M${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L${points[i].x},${points[i].y}`;
        }
        d += ' Z';
        return d;
    }

    quantizeColorsLab(rgbPixels, colorCount) {
        const n = rgbPixels.length;
        const labPixels = new Array(n);
        for (let i = 0; i < n; i++) {
            labPixels[i] = this.rgbToLab(rgbPixels[i][0], rgbPixels[i][1], rgbPixels[i][2]);
        }
        
        let labCenters = this.kmeansPlusPlusInitLab(labPixels, colorCount);
        const maxIterations = 20;
        const convergenceThreshold = 0.5;
        const assignments = new Int32Array(n);
        
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            for (let i = 0; i < n; i++) {
                let minDist = Infinity;
                let bestCluster = 0;
                for (let c = 0; c < labCenters.length; c++) {
                    const dist = this.cie76DeltaE(labPixels[i], labCenters[c]);
                    if (dist < minDist) {
                        minDist = dist;
                        bestCluster = c;
                    }
                }
                assignments[i] = bestCluster;
            }
            
            let maxShift = 0;
            for (let c = 0; c < labCenters.length; c++) {
                let sumL = 0, sumA = 0, sumB = 0, count = 0;
                for (let i = 0; i < n; i++) {
                    if (assignments[i] === c) {
                        sumL += labPixels[i][0];
                        sumA += labPixels[i][1];
                        sumB += labPixels[i][2];
                        count++;
                    }
                }
                if (count > 0) {
                    const newCenter = [sumL / count, sumA / count, sumB / count];
                    const shift = this.cie76DeltaE(labCenters[c], newCenter);
                    maxShift = Math.max(maxShift, shift);
                    labCenters[c] = newCenter;
                }
            }
            
            if (maxShift < convergenceThreshold) {
                break;
            }
        }
        
        return { labCenters, assignments };
    }

    kmeansPlusPlusInitLab(labPixels, k) {
        const centers = [];
        const n = labPixels.length;
        
        centers.push(labPixels[Math.floor(Math.random() * n)].slice());
        
        for (let i = 1; i < k; i++) {
            const distances = new Float64Array(n);
            let total = 0;
            
            for (let j = 0; j < n; j++) {
                let minDist = Infinity;
                for (const center of centers) {
                    const dist = this.cie76DeltaE(labPixels[j], center);
                    if (dist < minDist) {
                        minDist = dist;
                    }
                }
                distances[j] = minDist * minDist;
                total += distances[j];
            }
            
            if (total === 0) {
                centers.push(labPixels[Math.floor(Math.random() * n)].slice());
                continue;
            }
            
            let target = Math.random() * total;
            let selected = 0;
            for (let j = 0; j < n; j++) {
                target -= distances[j];
                if (target <= 0) {
                    selected = j;
                    break;
                }
            }
            
            centers.push(labPixels[selected].slice());
        }
        
        return centers;
    }

    cie76DeltaE(lab1, lab2) {
        const dL = lab1[0] - lab2[0];
        const dA = lab1[1] - lab2[1];
        const dB = lab1[2] - lab2[2];
        return Math.sqrt(dL * dL + dA * dA + dB * dB);
    }

    rgbToLab(r, g, b) {
        let rr = r / 255;
        let gg = g / 255;
        let bb = b / 255;
        
        rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
        gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
        bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;
        
        rr *= 100;
        gg *= 100;
        bb *= 100;
        
        let x = rr * 0.4124564 + gg * 0.3575761 + bb * 0.1804375;
        let y = rr * 0.2126729 + gg * 0.7151522 + bb * 0.0721750;
        let z = rr * 0.0193339 + gg * 0.1191920 + bb * 0.9503041;
        
        x /= 95.047;
        y /= 100.000;
        z /= 108.883;
        
        const epsilon = 0.008856;
        const kappa = 903.3;
        
        x = x > epsilon ? Math.cbrt(x) : (kappa * x + 16) / 116;
        y = y > epsilon ? Math.cbrt(y) : (kappa * y + 16) / 116;
        z = z > epsilon ? Math.cbrt(z) : (kappa * z + 16) / 116;
        
        const L = 116 * y - 16;
        const A = 500 * (x - y);
        const B = 200 * (y - z);
        
        return [L, A, B];
    }

    labToRgb(L, A, B) {
        const epsilon = 0.008856;
        const kappa = 903.3;
        
        let y = (L + 16) / 116;
        let x = A / 500 + y;
        let z = y - B / 200;
        
        const y3 = Math.pow(y, 3);
        const x3 = Math.pow(x, 3);
        const z3 = Math.pow(z, 3);
        
        y = y3 > epsilon ? y3 : (116 * y - 16) / kappa;
        x = x3 > epsilon ? x3 : (116 * x - 16) / kappa;
        z = z3 > epsilon ? z3 : (116 * z - 16) / kappa;
        
        x *= 95.047;
        y *= 100.000;
        z *= 108.883;
        
        let rr = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
        let gg = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
        let bb = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
        
        rr /= 100;
        gg /= 100;
        bb /= 100;
        
        rr = rr > 0.0031308 ? 1.055 * Math.pow(rr, 1 / 2.4) - 0.055 : 12.92 * rr;
        gg = gg > 0.0031308 ? 1.055 * Math.pow(gg, 1 / 2.4) - 0.055 : 12.92 * gg;
        bb = bb > 0.0031308 ? 1.055 * Math.pow(bb, 1 / 2.4) - 0.055 : 12.92 * bb;
        
        return [
            Math.max(0, Math.min(255, Math.round(rr * 255))),
            Math.max(0, Math.min(255, Math.round(gg * 255))),
            Math.max(0, Math.min(255, Math.round(bb * 255)))
        ];
    }

    findDominantColor(allPixels, assignments, targetCluster) {
        const colorMap = new Map();
        let maxCount = 0;
        let dominantColor = [0, 0, 0];
        
        for (let i = 0; i < allPixels.length; i++) {
            if (assignments[i] === targetCluster) {
                const pixel = allPixels[i];
                const r = Math.round(pixel[0]);
                const g = Math.round(pixel[1]);
                const b = Math.round(pixel[2]);
                const key = `${r},${g},${b}`;
                const count = (colorMap.get(key) || 0) + 1;
                colorMap.set(key, count);
                
                if (count > maxCount) {
                    maxCount = count;
                    dominantColor = [r, g, b];
                }
            }
        }
        
        return dominantColor;
    }

    removeSmallRegions(binaryData, width, height, minArea) {
        const visited = new Uint8Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (binaryData[idx] === 1 && visited[idx] === 0) {
                    const region = this.floodFill(binaryData, width, height, x, y, visited);
                    if (region.length < minArea) {
                        for (const p of region) {
                            binaryData[p.y * width + p.x] = 0;
                        }
                    }
                }
            }
        }
    }

    floodFill(binaryData, width, height, startX, startY, visited) {
        const region = [];
        const stack = [{ x: startX, y: startY }];
        
        while (stack.length > 0) {
            const { x, y } = stack.pop();
            const idx = y * width + x;
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            if (visited[idx] || binaryData[idx] !== 1) continue;
            
            visited[idx] = 1;
            region.push({ x, y });
            
            stack.push({ x: x + 1, y });
            stack.push({ x: x - 1, y });
            stack.push({ x, y: y + 1 });
            stack.push({ x, y: y - 1 });
        }
        
        return region;
    }

    countPixels(binaryData) {
        let count = 0;
        for (let i = 0; i < binaryData.length; i++) {
            if (binaryData[i] === 1) count++;
        }
        return count;
    }

    rgbToHex(rgb) {
        const r = Math.round(rgb[0]);
        const g = Math.round(rgb[1]);
        const b = Math.round(rgb[2]);
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    displaySVG(svgString) {
        const display = (container) => {
            container.innerHTML = svgString;
            const svg = container.querySelector('svg');
            if (svg) {
                svg.style.width = `${this.zoomLevel}%`;
                svg.style.height = 'auto';
            }
        };
        
        display(this.svgContainer);
        display(this.svgContainerLarge);
    }

    exportSVG() {
        if (!this.currentSVG) return;
        
        const blob = new Blob([this.currentSVG], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vectorized.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    switchTab(tabName) {
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
    }

    setZoom(level, fit = false) {
        if (fit) {
            this.zoomLevel = 100;
        } else {
            this.zoomLevel = Math.max(25, Math.min(400, level));
        }
        
        this.zoomLevelEl.textContent = `${this.zoomLevel}%`;
        
        const svgs = document.querySelectorAll('#svgContainer svg, #svgContainerLarge svg');
        svgs.forEach(svg => {
            svg.style.width = `${this.zoomLevel}%`;
        });
    }

    loadPresetImage(preset) {
        const canvas = document.createElement('canvas');
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        switch (preset) {
            case 'logo':
                this.drawLogo(ctx, size);
                break;
            case 'drawing':
                this.drawSimpleDrawing(ctx, size);
                break;
            case 'landscape':
                this.drawLandscape(ctx, size);
                break;
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        this.loadImageFromUrl(dataUrl);
    }

    loadPresetImageToBatch(preset) {
        const canvas = document.createElement('canvas');
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const names = {
            'logo': '预设_Logo.png',
            'drawing': '预设_简笔画.png',
            'landscape': '预设_风景.png'
        };
        
        switch (preset) {
            case 'logo':
                this.drawLogo(ctx, size);
                break;
            case 'drawing':
                this.drawSimpleDrawing(ctx, size);
                break;
            case 'landscape':
                this.drawLandscape(ctx, size);
                break;
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        const img = new Image();
        img.onload = () => {
            const item = {
                id: Date.now() + Math.random(),
                name: names[preset] || '预设图片.png',
                file: null,
                image: img,
                dataUrl: dataUrl,
                status: 'pending',
                svg: null,
                error: null
            };
            this.batchQueue.push(item);
            this.updateBatchList();
            this.updateBatchButtons();
        };
        img.src = dataUrl;
    }

    async processBatch() {
        if (this.batchProcessing || this.batchQueue.length === 0) return;
        
        this.batchProcessing = true;
        this.currentBatchIndex = 0;
        this.batchProgress.style.display = 'block';
        this.updateBatchButtons();
        
        const colorMode = this.colorMode.value;
        const tolerance = parseFloat(this.tolerance.value);
        const minArea = parseInt(this.minArea.value);
        const threshold = parseInt(this.threshold.value);
        const colorCount = parseInt(this.colorCount.value);
        
        const total = this.batchQueue.length;
        
        try {
            for (let i = 0; i < total; i++) {
                const item = this.batchQueue[i];
                this.currentBatchIndex = i;
                item.status = 'processing';
                
                const progress = ((i) / total) * 100;
                this.progressFill.style.width = `${progress}%`;
                this.progressText.textContent = `${i} / ${total}`;
                this.currentFileName.textContent = item.name;
                
                this.updateBatchList();
                
                await this.processItemForBatch(item, colorMode, tolerance, minArea, threshold, colorCount);
                
                item.status = item.error ? 'error' : 'completed';
                this.updateBatchList();
                
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            this.progressFill.style.width = '100%';
            this.progressText.textContent = `${total} / ${total}`;
            this.currentFileName.textContent = '处理完成！';
            
            setTimeout(() => {
                this.batchProgress.style.display = 'none';
                this.progressFill.style.width = '0%';
            }, 2000);
            
        } catch (error) {
            console.error('Batch processing error:', error);
            alert('批处理过程中发生错误！');
        } finally {
            this.batchProcessing = false;
            this.currentBatchIndex = -1;
            this.updateBatchButtons();
            this.updateBatchList();
        }
    }

    async processItemForBatch(item, colorMode, tolerance, minArea, threshold, colorCount) {
        try {
            this.originalImage = item.image;
            const canvas = document.createElement('canvas');
            let width = item.image.width;
            let height = item.image.height;
            
            if (width > this.maxImageSize || height > this.maxImageSize) {
                const ratio = Math.min(this.maxImageSize / width, this.maxImageSize / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(item.image, 0, 0, width, height);
            
            this.imageData = ctx.getImageData(0, 0, width, height);
            
            let svg;
            if (colorMode === 'bw') {
                svg = await this.vectorizeBW(tolerance, minArea, threshold);
            } else {
                svg = await this.vectorizeColor(tolerance, minArea, colorCount);
            }
            
            item.svg = svg;
            item.error = null;
            
        } catch (error) {
            console.error('Error processing item:', item.name, error);
            item.error = error.message;
            item.svg = null;
        }
    }

    async exportBatch() {
        const completedItems = this.batchQueue.filter(item => item.status === 'completed' && item.svg);
        
        if (completedItems.length === 0) {
            alert('没有可导出的已处理图片！');
            return;
        }
        
        if (completedItems.length === 1) {
            this.currentSVG = completedItems[0].svg;
            this.exportSVG();
            return;
        }
        
        if (typeof JSZip === 'undefined') {
            completedItems.forEach(item => {
                this.downloadSVG(item.svg, this.getSafeFileName(item.name));
            });
            return;
        }
        
        this.loadingOverlay.classList.add('active');
        const originalText = this.loadingOverlay.querySelector('p');
        if (originalText) {
            originalText.textContent = '正在打包下载...';
        }
        
        try {
            const zip = new JSZip();
            
            completedItems.forEach(item => {
                const fileName = this.getSafeFileName(item.name);
                zip.file(fileName, item.svg);
            });
            
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vectorized_images_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Export batch error:', error);
            alert('批量导出失败，将逐个下载...');
            completedItems.forEach(item => {
                this.downloadSVG(item.svg, this.getSafeFileName(item.name));
            });
        } finally {
            this.loadingOverlay.classList.remove('active');
            if (originalText) {
                originalText.textContent = '正在处理图像...';
            }
        }
    }

    getSafeFileName(originalName) {
        const baseName = originalName.replace(/\.[^/.]+$/, '');
        return `${baseName}.svg`;
    }

    downloadSVG(svgContent, fileName) {
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    drawLogo(ctx, size) {
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.save();
        ctx.translate(size / 2, size / 2);
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * 140;
            const y = Math.sin(angle) * 140;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('V', 0, 0);
        
        ctx.restore();
    }

    drawSimpleDrawing(ctx, size) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.arc(size / 2, 100, 50, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(size / 2, 150);
        ctx.lineTo(size / 2, 280);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(size / 2, 180);
        ctx.lineTo(size / 2 - 60, 240);
        ctx.moveTo(size / 2, 180);
        ctx.lineTo(size / 2 + 60, 240);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(size / 2, 280);
        ctx.lineTo(size / 2 - 50, 360);
        ctx.moveTo(size / 2, 280);
        ctx.lineTo(size / 2 + 50, 360);
        ctx.stroke();
        
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(size / 2 - 15, 90, 5, 0, Math.PI * 2);
        ctx.arc(size / 2 + 15, 90, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(size / 2, 110, 20, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    }

    drawLandscape(ctx, size) {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, size);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.6, '#E0F7FA');
        skyGradient.addColorStop(1, '#FFF8E1');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(320, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.drawCloud(ctx, 100, 60, 30);
        this.drawCloud(ctx, 250, 100, 25);
        this.drawCloud(ctx, 350, 50, 35);
        
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.moveTo(0, 280);
        ctx.quadraticCurveTo(100, 200, 200, 260);
        ctx.quadraticCurveTo(300, 180, 400, 250);
        ctx.lineTo(size, 280);
        ctx.lineTo(size, size);
        ctx.lineTo(0, size);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#81C784';
        ctx.beginPath();
        ctx.moveTo(0, 320);
        ctx.quadraticCurveTo(150, 280, 250, 320);
        ctx.quadraticCurveTo(350, 260, size, 300);
        ctx.lineTo(size, size);
        ctx.lineTo(0, size);
        ctx.closePath();
        ctx.fill();
        
        this.drawTree(ctx, 60, 300, 40);
        this.drawTree(ctx, 340, 280, 50);
        this.drawTree(ctx, 180, 340, 35);
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 360, size, size - 360);
    }

    drawCloud(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.arc(x, y, scale, 0, Math.PI * 2);
        ctx.arc(x + scale, y - scale * 0.3, scale * 0.8, 0, Math.PI * 2);
        ctx.arc(x + scale * 1.6, y, scale * 0.7, 0, Math.PI * 2);
        ctx.arc(x + scale * 0.5, y + scale * 0.3, scale * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTree(ctx, x, y, size) {
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(x - size * 0.1, y, size * 0.2, size * 0.8);
        
        ctx.fillStyle = '#388E3C';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 1.2);
        ctx.lineTo(x - size * 0.6, y);
        ctx.lineTo(x + size * 0.6, y);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.8);
        ctx.lineTo(x - size * 0.5, y - size * 0.1);
        ctx.lineTo(x + size * 0.5, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ImageVectorizer();
});
