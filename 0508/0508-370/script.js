let extractedColors = [];

class ColorExtractor {
    constructor() {
        this.pixels = [];
    }

    loadFromImageData(imageData) {
        const pixels = imageData.data;
        this.pixels = [];
        
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            if (a >= 128) {
                this.pixels.push([r, g, b]);
            }
        }
        
        return this;
    }

    extract(count, algorithm = 'medianCut') {
        if (this.pixels.length === 0) {
            throw new Error('No pixels loaded');
        }

        switch (algorithm) {
            case 'medianCut':
                return this.medianCut(count);
            case 'octree':
                return this.octree(count);
            default:
                throw new Error(`Unknown algorithm: ${algorithm}`);
        }
    }

    medianCut(count) {
        const buckets = [this.pixels];
        
        for (let i = 0; i < count - 1; i++) {
            const newBuckets = [];
            
            for (const bucket of buckets) {
                if (bucket.length === 0) continue;
                
                const splitBucket = this.splitByMedian(bucket);
                newBuckets.push(...splitBucket);
            }
            
            buckets.length = 0;
            buckets.push(...newBuckets);
            
            if (buckets.length >= count) break;
        }
        
        const colors = [];
        for (const bucket of buckets) {
            if (bucket.length === 0) continue;
            const avgColor = this.averageColor(bucket);
            colors.push(this.rgbToHex(avgColor[0], avgColor[1], avgColor[2]));
        }
        
        return colors;
    }

    splitByMedian(bucket) {
        if (bucket.length <= 1) {
            return [bucket];
        }
        
        const ranges = this.getRanges(bucket);
        const maxRange = Math.max(ranges.r, ranges.g, ranges.b);
        
        let sortIndex;
        if (maxRange === ranges.r) {
            sortIndex = 0;
        } else if (maxRange === ranges.g) {
            sortIndex = 1;
        } else {
            sortIndex = 2;
        }
        
        const sorted = [...bucket].sort((a, b) => a[sortIndex] - b[sortIndex]);
        const medianIndex = Math.floor(sorted.length / 2);
        
        return [sorted.slice(0, medianIndex), sorted.slice(medianIndex)];
    }

    getRanges(bucket) {
        let minR = 255, maxR = 0;
        let minG = 255, maxG = 0;
        let minB = 255, maxB = 0;
        
        for (const [r, g, b] of bucket) {
            minR = Math.min(minR, r);
            maxR = Math.max(maxR, r);
            minG = Math.min(minG, g);
            maxG = Math.max(maxG, g);
            minB = Math.min(minB, b);
            maxB = Math.max(maxB, b);
        }
        
        return {
            r: maxR - minR,
            g: maxG - minG,
            b: maxB - minB
        };
    }

    averageColor(bucket) {
        let sumR = 0, sumG = 0, sumB = 0;
        
        for (const [r, g, b] of bucket) {
            sumR += r;
            sumG += g;
            sumB += b;
        }
        
        const count = bucket.length;
        return [
            Math.round(sumR / count),
            Math.round(sumG / count),
            Math.round(sumB / count)
        ];
    }

    octree(count) {
        const tree = new Octree();
        
        for (const pixel of this.pixels) {
            tree.insert(pixel);
        }
        
        const colors = tree.reduce(count);
        return colors.map(c => this.rgbToHex(c[0], c[1], c[2]));
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
}

class OctreeNode {
    constructor(level, parent) {
        this.level = level;
        this.parent = parent;
        this.children = new Array(8).fill(null);
        this.color = [0, 0, 0];
        this.pixelCount = 0;
    }

    isLeaf() {
        return this.children.every(child => child === null);
    }

    addColor(r, g, b) {
        this.color[0] += r;
        this.color[1] += g;
        this.color[2] += b;
        this.pixelCount++;
    }

    getAverageColor() {
        if (this.pixelCount === 0) return [0, 0, 0];
        return [
            Math.round(this.color[0] / this.pixelCount),
            Math.round(this.color[1] / this.pixelCount),
            Math.round(this.color[2] / this.pixelCount)
        ];
    }

    getLeafNodes() {
        const leaves = [];
        const stack = [this];
        
        while (stack.length > 0) {
            const node = stack.pop();
            if (node.isLeaf()) {
                leaves.push(node);
            } else {
                for (const child of node.children) {
                    if (child !== null) {
                        stack.push(child);
                    }
                }
            }
        }
        
        return leaves;
    }

    getNodesByLevel(level) {
        const nodes = [];
        const stack = [this];
        
        while (stack.length > 0) {
            const node = stack.pop();
            if (node.level === level) {
                nodes.push(node);
            } else if (node.level < level) {
                for (const child of node.children) {
                    if (child !== null) {
                        stack.push(child);
                    }
                }
            }
        }
        
        return nodes;
    }
}

class Octree {
    constructor() {
        this.root = new OctreeNode(0, null);
        this.levels = Array.from({ length: 9 }, () => []);
    }

    insert(pixel) {
        let node = this.root;
        const [r, g, b] = pixel;
        
        for (let level = 0; level < 8; level++) {
            const index = this.getColorIndex(r, g, b, level);
            
            if (node.children[index] === null) {
                node.children[index] = new OctreeNode(level + 1, node);
            }
            
            node = node.children[index];
            
            if (level === 7) {
                node.addColor(r, g, b);
            }
        }
    }

    getColorIndex(r, g, b, level) {
        const shift = 7 - level;
        const rBit = (r >> shift) & 1;
        const gBit = (g >> shift) & 1;
        const bBit = (b >> shift) & 1;
        return (rBit << 2) | (gBit << 1) | bBit;
    }

    reduce(colorCount) {
        let leaves = this.root.getLeafNodes();
        
        while (leaves.length > colorCount) {
            const nodesWithChildren = this.root.getNodesByLevel(7);
            nodesWithChildren.sort((a, b) => a.pixelCount - b.pixelCount);
            
            for (const node of nodesWithChildren) {
                if (leaves.length <= colorCount) break;
                if (node.parent === null) continue;
                
                this.mergeNode(node);
                leaves = this.root.getLeafNodes();
            }
        }
        
        return leaves.map(node => node.getAverageColor());
    }

    mergeNode(node) {
        const parent = node.parent;
        const index = parent.children.findIndex(child => child === node);
        
        for (let i = 0; i < 8; i++) {
            const child = node.children[i];
            if (child !== null) {
                parent.addColor(...child.getAverageColor());
                child.parent = null;
            }
        }
        
        parent.children[index] = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initImageUpload();
    initImageUrlLoad();
    initColorCount();
    initExtractButton();
    initGradientUpload();
    initGradientUrlLoad();
    initGradientAngle();
    initExtractGradientButton();
    initCopyGradientCode();
    initContrastCalculation();
    initWebpageFetch();
    initExportButtons();
});

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabId}-panel`).classList.add('active');
        });
    });
}

function initImageUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            loadImage(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            loadImage(e.target.files[0]);
        }
    });
}

function initImageUrlLoad() {
    const imageUrlInput = document.getElementById('imageUrl');
    const loadUrlBtn = document.getElementById('loadUrlBtn');

    loadUrlBtn.addEventListener('click', () => {
        const url = imageUrlInput.value.trim();
        if (url) {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                document.getElementById('previewImage').src = url;
                document.getElementById('previewSection').style.display = 'block';
            };
            img.onerror = () => {
                alert('无法加载图片，请检查URL是否正确');
            };
            img.src = url;
        }
    });
}

function initColorCount() {
    const colorCount = document.getElementById('colorCount');
    const colorCountValue = document.getElementById('colorCountValue');

    colorCount.addEventListener('input', (e) => {
        colorCountValue.textContent = e.target.value;
    });
}

function initExtractButton() {
    const extractBtn = document.getElementById('extractBtn');
    
    extractBtn.addEventListener('click', () => {
        const img = document.getElementById('previewImage');
        const count = parseInt(document.getElementById('colorCount').value);
        const algorithm = document.getElementById('algorithm').value;
        
        if (img.src) {
            extractColors(img, count, algorithm);
        }
    });
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('previewSection').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function extractColors(img, count, algorithm = 'medianCut') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const maxDim = 400;
    let width = img.width;
    let height = img.height;
    
    if (width > maxDim || height > maxDim) {
        if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
        } else {
            width = (width / height) * maxDim;
            height = maxDim;
        }
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    
    const imageData = ctx.getImageData(0, 0, width, height);
    
    try {
        const extractor = new ColorExtractor();
        const dominantColors = extractor.loadFromImageData(imageData).extract(count, algorithm);
        extractedColors = dominantColors;
        displayPalette(dominantColors);
    } catch (error) {
        alert(error.message);
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function displayPalette(colors) {
    const palette = document.getElementById('palette');
    palette.innerHTML = '';
    
    colors.forEach((color, index) => {
        const colorBlock = document.createElement('div');
        colorBlock.className = 'color-block';
        colorBlock.style.background = color;
        colorBlock.dataset.color = color;
        colorBlock.dataset.index = index;
        colorBlock.addEventListener('click', () => copyColor(color));
        palette.appendChild(colorBlock);
    });
    
    document.getElementById('paletteSection').style.display = 'block';
}

function copyColor(color) {
    navigator.clipboard.writeText(color).then(() => {
        const toast = document.getElementById('copyToast');
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 2000);
    });
}

function initContrastCalculation() {
    const fgColor = document.getElementById('foregroundColor');
    const bgColor = document.getElementById('backgroundColor');
    const fgHex = document.getElementById('foregroundHex');
    const bgHex = document.getElementById('backgroundHex');

    const updateContrast = () => {
        const fg = fgHex.value;
        const bg = bgHex.value;
        
        const ratio = calculateContrast(fg, bg);
        document.getElementById('contrastRatio').textContent = ratio.toFixed(2);
        
        updateWCAGLevels(ratio);
        updatePreview(fg, bg);
    };

    fgColor.addEventListener('input', (e) => {
        fgHex.value = e.target.value;
        updateContrast();
    });

    bgColor.addEventListener('input', (e) => {
        bgHex.value = e.target.value;
        updateContrast();
    });

    fgHex.addEventListener('input', (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
            fgColor.value = e.target.value;
            updateContrast();
        }
    });

    bgHex.addEventListener('input', (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
            bgColor.value = e.target.value;
            updateContrast();
        }
    });

    updateContrast();
}

function calculateContrast(color1, color2) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 1;
    
    const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(r, g, b) {
    const sRGB = [r, g, b].map(x => {
        x = x / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

function updateWCAGLevels(ratio) {
    const aa = document.getElementById('wcagAA');
    const aaa = document.getElementById('wcagAAA');
    
    aa.className = 'level';
    aaa.className = 'level';
    
    if (ratio >= 4.5) {
        aa.classList.add('pass');
    } else {
        aa.classList.add('fail');
    }
    
    if (ratio >= 7.0) {
        aaa.classList.add('pass');
    } else {
        aaa.classList.add('fail');
    }
}

function updatePreview(fg, bg) {
    const previewBox = document.querySelector('.preview-box');
    const previewText = document.getElementById('previewText');
    
    previewBox.style.background = bg;
    previewText.style.color = fg;
}

function initWebpageFetch() {
    const fetchBtn = document.getElementById('fetchBtn');
    const webpageUrl = document.getElementById('webpageUrl');
    
    fetchBtn.addEventListener('click', () => {
        const url = webpageUrl.value.trim();
        if (url) {
            fetchWebpageColors(url);
        }
    });
}

async function fetchWebpageColors(url) {
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    const mockColors = [
        '#1a1a2e', '#16213e', '#0f3460', '#533483',
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    
    extractedColors = mockColors.slice(0, 10);
    displayPalette(extractedColors);
    
    alert('已模拟抓取网页颜色！由于浏览器安全限制，实际网页抓取需要后端支持。这里展示模拟数据。');
}

function initExportButtons() {
    document.getElementById('exportCSS').addEventListener('click', exportCSS);
    document.getElementById('exportSCSS').addEventListener('click', exportSCSS);
    document.getElementById('exportASE').addEventListener('click', exportASE);
}

function exportCSS() {
    if (extractedColors.length === 0) {
        alert('请先提取颜色！');
        return;
    }
    
    let css = ':root {\n';
    extractedColors.forEach((color, index) => {
        css += `  --color-${index + 1}: ${color};\n`;
    });
    css += '}';
    
    downloadFile(css, 'palette.css', 'text/css');
}

function exportSCSS() {
    if (extractedColors.length === 0) {
        alert('请先提取颜色！');
        return;
    }
    
    let scss = '$colors: (\n';
    extractedColors.forEach((color, index) => {
        scss += `  ${index + 1}: ${color}`;
        scss += index < extractedColors.length - 1 ? ',\n' : '\n';
    });
    scss += ');\n\n';
    
    extractedColors.forEach((color, index) => {
        scss += `$color-${index + 1}: ${color};\n`;
    });
    
    downloadFile(scss, 'palette.scss', 'text/plain');
}

function exportASE() {
    if (extractedColors.length === 0) {
        alert('请先提取颜色！');
        return;
    }
    
    const aseData = createASEData(extractedColors);
    downloadFile(aseData, 'palette.ase', 'application/octet-stream');
}

function createASEData(colors) {
    const header = [
        0x41, 0x44, 0x4F, 0x42, // "A" "D" "O" "B"
        0x42, 0x45, 0x53, 0x57, // "B" "E" "S" "W"
        0x41, 0x54, 0x43, 0x48, // "A" "T" "C" "H"
        0x00, 0x00, 0x00, 0x00, // Version 1.0
        0x00, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, (colors.length + 1) * 2 // Number of entries * 2 (group + color)
    ];
    
    const groupStart = [
        0x00, 0x01, // Group start
        0x00, 0x00, 0x00, 0x0C, // Length
        0x00, 0x08, // Name length
        0x70, 0x61, 0x6C, 0x65, 0x74, 0x74, 0x65, 0x00 // "palette\0"
    ];
    
    let colorEntries = [];
    colors.forEach((color, index) => {
        const rgb = hexToRgb(color);
        const entry = [
            0x00, 0x02, // Color entry
            0x00, 0x00, 0x00, 0x18, // Length
            0x00, 0x02, // Name length
            (index + 1).toString().charCodeAt(0), 0x00, // Color name
            0x52, 0x47, 0x42, 0x20, // "RGB "
            0x00, 0x00, 0x00, 0x01, // Space ID
            rgb.r / 255, rgb.g / 255, rgb.b / 255, // RGB values
            0x00, 0x00, 0x00, 0x00 // Reserved
        ];
        colorEntries.push(...entry);
    });
    
    const groupEnd = [
        0x00, 0x03 // Group end
    ];
    
    const allBytes = [...header, ...groupStart, ...colorEntries.flat(), ...groupEnd];
    
    return new Uint8Array(allBytes);
}

function downloadFile(data, filename, type) {
    const blob = typeof data === 'string' ? new Blob([data], { type }) : new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function initGradientUpload() {
    const uploadArea = document.getElementById('gradientUploadArea');
    const fileInput = document.getElementById('gradientFileInput');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            loadGradientImage(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            loadGradientImage(e.target.files[0]);
        }
    });
}

function initGradientUrlLoad() {
    const imageUrlInput = document.getElementById('gradientImageUrl');
    const loadUrlBtn = document.getElementById('loadGradientUrlBtn');

    loadUrlBtn.addEventListener('click', () => {
        const url = imageUrlInput.value.trim();
        if (url) {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                document.getElementById('gradientPreviewImage').src = url;
                document.getElementById('gradientPreviewSection').style.display = 'block';
                document.getElementById('gradientResult').style.display = 'none';
            };
            img.onerror = () => {
                alert('无法加载图片，请检查URL是否正确');
            };
            img.src = url;
        }
    });
}

function initGradientAngle() {
    const gradientAngle = document.getElementById('gradientAngle');
    const gradientAngleValue = document.getElementById('gradientAngleValue');

    gradientAngle.addEventListener('input', (e) => {
        gradientAngleValue.textContent = e.target.value + '°';
    });
}

function initExtractGradientButton() {
    const extractBtn = document.getElementById('extractGradientBtn');
    
    extractBtn.addEventListener('click', () => {
        const img = document.getElementById('gradientPreviewImage');
        const type = document.getElementById('gradientType').value;
        const angle = parseInt(document.getElementById('gradientAngle').value);
        
        if (img.src) {
            extractGradient(img, type, angle);
        }
    });
}

function initCopyGradientCode() {
    const copyBtn = document.getElementById('copyGradientCode');
    
    copyBtn.addEventListener('click', () => {
        const code = document.getElementById('gradientCode').value;
        navigator.clipboard.writeText(code).then(() => {
            const toast = document.getElementById('copyToast');
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 2000);
        });
    });
}

function loadGradientImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('gradientPreviewImage').src = e.target.result;
        document.getElementById('gradientPreviewSection').style.display = 'block';
        document.getElementById('gradientResult').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function extractGradient(img, type, angle) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const maxDim = 400;
    let width = img.width;
    let height = img.height;
    
    if (width > maxDim || height > maxDim) {
        if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
        } else {
            width = (width / height) * maxDim;
            height = maxDim;
        }
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    
    let samplePixels = [];
    
    if (type === 'linear') {
        const step = Math.floor(height / 20);
        for (let y = 0; y < height; y += step) {
            const idx = (y * width + Math.floor(width / 2)) * 4;
            samplePixels.push([
                pixels[idx],
                pixels[idx + 1],
                pixels[idx + 2]
            ]);
        }
    } else {
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        
        for (let r = 0; r < maxDist; r += Math.floor(maxDist / 20)) {
            const x = Math.floor(centerX + r * Math.cos(angle * Math.PI / 180));
            const y = Math.floor(centerY + r * Math.sin(angle * Math.PI / 180));
            
            if (x >= 0 && x < width && y >= 0 && y < height) {
                const idx = (y * width + x) * 4;
                samplePixels.push([
                    pixels[idx],
                    pixels[idx + 1],
                    pixels[idx + 2]
                ]);
            }
        }
    }
    
    const gradientColors = analyzeGradientColors(samplePixels);
    displayGradientResult(gradientColors, type, angle);
}

function analyzeGradientColors(pixels) {
    if (pixels.length < 2) {
        return ['#ffffff', '#000000'];
    }
    
    const colorDistances = [];
    for (let i = 0; i < pixels.length - 1; i++) {
        const dist = colorDistance(pixels[i], pixels[i + 1]);
        colorDistances.push({ index: i, distance: dist });
    }
    
    colorDistances.sort((a, b) => b.distance - a.distance);
    
    const keyIndices = [0];
    const usedIndices = new Set([0]);
    
    for (let i = 0; i < 3 && i < colorDistances.length; i++) {
        const idx = colorDistances[i].index + 1;
        if (!usedIndices.has(idx)) {
            keyIndices.push(idx);
            usedIndices.add(idx);
        }
    }
    
    keyIndices.push(pixels.length - 1);
    keyIndices.sort((a, b) => a - b);
    
    const uniqueColors = [];
    const seenColors = new Set();
    
    for (const idx of keyIndices) {
        const color = rgbToHex(pixels[idx][0], pixels[idx][1], pixels[idx][2]);
        if (!seenColors.has(color)) {
            seenColors.add(color);
            uniqueColors.push(color);
        }
    }
    
    if (uniqueColors.length < 2) {
        uniqueColors.push(rgbToHex(
            255 - hexToRgb(uniqueColors[0]).r,
            255 - hexToRgb(uniqueColors[0]).g,
            255 - hexToRgb(uniqueColors[0]).b
        ));
    }
    
    return uniqueColors;
}

function colorDistance(c1, c2) {
    const r = c1[0] - c2[0];
    const g = c1[1] - c2[1];
    const b = c1[2] - c2[2];
    return Math.sqrt(r * r + g * g + b * b);
}

function displayGradientResult(colors, type, angle) {
    let gradientCode;
    if (type === 'linear') {
        gradientCode = `background: linear-gradient(${angle}deg, ${colors.join(', ')});`;
    } else {
        gradientCode = `background: radial-gradient(circle at center, ${colors.join(', ')});`;
    }
    
    document.getElementById('gradientPreviewBox').style.background = type === 'linear' 
        ? `linear-gradient(${angle}deg, ${colors.join(', ')})`
        : `radial-gradient(circle at center, ${colors.join(', ')})`;
    
    document.getElementById('gradientCode').value = gradientCode;
    document.getElementById('gradientResult').style.display = 'block';
}