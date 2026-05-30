const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const reuploadBtn = document.getElementById('reuploadBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultSection = document.getElementById('resultSection');
const grindSection = document.getElementById('grindSection');
const loading = document.getElementById('loading');
const exportBtn = document.getElementById('exportBtn');
const grindSlider = document.getElementById('grindSlider');
const grindCount = document.getElementById('grindCount');
const estimatedTime = document.getElementById('estimatedTime');
const inkProgress = document.getElementById('inkProgress');
const inkPercent = document.getElementById('inkPercent');
const canvas = document.getElementById('inkCanvas');
const ctx = canvas.getContext('2d');

let currentRecordId = null;
let currentGrindCoefficient = 1.0;
let animationFrame = null;
let currentInkLevel = 0;
let targetInkLevel = 0;
let carbonParticles = [];
let waterMolecules = [];
let grindAngle = 0;
let spawnAccum = 0;

class CarbonParticle {
    constructor(x, y, initialSize) {
        this.x = x;
        this.y = y;
        this.size = initialSize;
        this.originalSize = initialSize;
        this.alpha = 0.9 + Math.random() * 0.1;
        this.vx = 0;
        this.vy = 0;
        this.age = 0;
        this.maxAge = 600 + Math.random() * 400;
        this.brownianStrength = 0.15 + Math.random() * 0.1;
        this.dispersed = false;
        this.dispersionProgress = 0;
        this.trail = [];
        this.trailMax = 5;
        this.glowIntensity = 1.0;
        this.aggregationPartner = null;
        this.hue = Math.random() < 0.3 ? 220 : (Math.random() < 0.5 ? 200 : 240);
        this.saturation = 10 + Math.random() * 20;
    }

    update(centerX, centerY, inkLevel, dt) {
        this.age++;
        this.glowIntensity = Math.max(0, 1.0 - this.age / 60);

        if (this.trail.length >= this.trailMax) this.trail.shift();
        this.trail.push({ x: this.x, y: this.y, size: this.size });

        let bx = (Math.random() - 0.5) * this.brownianStrength;
        let by = (Math.random() - 0.5) * this.brownianStrength;

        let dx = this.x - centerX;
        let dy = this.y - centerY;
        let distFromCenter = Math.sqrt(dx * dx + dy * dy);
        let dispersionRadius = 30 + inkLevel * 0.8;

        if (distFromCenter < dispersionRadius * 0.3) {
            bx += dx / Math.max(distFromCenter, 1) * 0.4;
            by += dy / Math.max(distFromCenter, 1) * 0.4;
        }

        let tangentialForce = 0.08 * (inkLevel / 100);
        if (distFromCenter > 1) {
            bx += (-dy / distFromCenter) * tangentialForce;
            by += (dx / distFromCenter) * tangentialForce;
        }

        if (!this.dispersed) {
            this.dispersionProgress += 0.002 * (1 + inkLevel / 50);
            if (this.dispersionProgress >= 1) {
                this.dispersed = true;
            }
            let spreadFactor = this.dispersionProgress * 0.3;
            if (distFromCenter > 1) {
                bx += (dx / distFromCenter) * spreadFactor;
                by += (dy / distFromCenter) * spreadFactor;
            }
        }

        let grindRefinement = inkLevel / 100;
        this.size = this.originalSize * (1 - grindRefinement * 0.5);
        this.size = Math.max(0.5, this.size);

        this.vx = this.vx * 0.95 + bx;
        this.vy = this.vy * 0.95 + by;
        this.x += this.vx;
        this.y += this.vy;

        let maxDist = 140;
        let dist = Math.sqrt((this.x - centerX) ** 2 + (this.y - centerY) ** 2);
        if (dist > maxDist) {
            this.vx -= (this.x - centerX) / dist * 0.3;
            this.vy -= (this.y - centerY) / dist * 0.3;
        }

        if (this.age > this.maxAge * 0.7) {
            this.alpha = Math.max(0.3, this.alpha - 0.001);
        }
    }

    draw(ctx) {
        if (this.trail.length > 1) {
            ctx.save();
            for (let i = 0; i < this.trail.length - 1; i++) {
                let t = this.trail[i];
                let trailAlpha = (i / this.trail.length) * 0.15 * this.alpha;
                ctx.globalAlpha = trailAlpha;
                ctx.fillStyle = `hsl(${this.hue}, ${this.saturation}%, 8%)`;
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        if (this.glowIntensity > 0.1 && this.age < 60) {
            ctx.save();
            ctx.globalAlpha = this.glowIntensity * 0.3 * this.alpha;
            ctx.fillStyle = `hsla(${this.hue}, 60%, 40%, 0.5)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = this.alpha;
        let lightness = this.dispersed ? 12 : 6;
        ctx.fillStyle = `hsl(${this.hue}, ${this.saturation}%, ${lightness}%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        if (this.size > 1.5) {
            ctx.globalAlpha = this.alpha * 0.3;
            ctx.fillStyle = `hsl(${this.hue}, ${this.saturation}%, ${lightness + 15}%)`;
            ctx.beginPath();
            ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    isDead() {
        return this.age > this.maxAge;
    }
}

class WaterMolecule {
    constructor(centerX, centerY, radius) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.angle = Math.random() * Math.PI * 2;
        this.radius = radius * (0.3 + Math.random() * 0.7);
        this.speed = 0.005 + Math.random() * 0.01;
        this.size = 1 + Math.random() * 1.5;
        this.alpha = 0.08 + Math.random() * 0.12;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.02 + Math.random() * 0.03;
        this.wobbleAmp = 3 + Math.random() * 5;
    }

    update(inkLevel) {
        this.angle += this.speed * (0.5 + inkLevel / 100);
        this.wobble += this.wobbleSpeed;
        this.speed += (Math.random() - 0.5) * 0.001;
        this.speed = Math.max(0.002, Math.min(0.02, this.speed));
    }

    getPosition() {
        let r = this.radius + Math.sin(this.wobble) * this.wobbleAmp;
        return {
            x: this.centerX + Math.cos(this.angle) * r,
            y: this.centerY + Math.sin(this.angle) * r * 0.65
        };
    }

    draw(ctx) {
        let pos = this.getPosition();
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = '#8899aa';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

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
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

reuploadBtn.addEventListener('click', () => {
    imagePreview.style.display = 'none';
    uploadArea.style.display = 'block';
    analyzeBtn.disabled = true;
    resultSection.style.display = 'none';
    grindSection.style.display = 'none';
    fileInput.value = '';
    resetInkAnimation();
});

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        uploadArea.style.display = 'none';
        imagePreview.style.display = 'block';
        analyzeBtn.disabled = false;
    };
    reader.readAsDataURL(file);
}

analyzeBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    loading.classList.add('show');

    try {
        const tempImg = new Image();
        tempImg.src = previewImg.src;
        
        await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = reject;
        });

        console.log('开始提取图像特征...');
        const processor = new ImageProcessor(tempImg);
        const features = await processor.extractAllFeatures();
        
        console.log('特征提取完成:');
        console.log('  线性度:', features.linear.linearityScore.toFixed(3));
        console.log('  线条数量:', features.linear.lineCount);
        console.log('  对比度:', features.glcm.contrast.toFixed(3));
        console.log('  同质性:', features.glcm.homogeneity.toFixed(3));
        console.log('  主角度:', features.linear.dominantAngle + '°');
        if (features.gabor) {
            console.log('  Gabor方向性:', features.gabor.directionality.toFixed(3));
            console.log('  Gabor选择性:', features.gabor.orientationSelectivity.toFixed(3));
            console.log('  Gabor周期性:', features.gabor.texturePeriodicity.toFixed(3));
        }
        if (features.fusion) {
            console.log('  融合向量:', features.fusion.fused.map(v => v.toFixed(3)).join(', '));
            console.log('  PCA解释方差:', (features.fusion.totalExplainedVariance * 100).toFixed(1) + '%');
            console.log('  AE重建误差:', features.fusion.aeReconstructionError.toFixed(4));
        }

        const classifier = new StoneClassifier();
        const classification = classifier.classify(features);
        
        console.log('分类结果:', classification.bestMatch.name, '置信度:', (classification.confidence * 100).toFixed(1) + '%');

        const detectedFeatures = generateFeatureDescription(features, classification);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('features', JSON.stringify(features));
        formData.append('classification', JSON.stringify(classification));
        formData.append('detected_features', detectedFeatures);

        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.error) {
            alert('分析失败: ' + data.error);
        } else {
            displayResults({
                ...data,
                extracted_features: classification.featuresUsed,
                features_detected: detectedFeatures,
                fused_vector: features.fusion ? features.fusion.fused : null,
                gabor_dominant_orientation: features.gabor ? features.gabor.dominantOrientation : 0
            });
            currentRecordId = data.record_id;
            currentGrindCoefficient = data.stone_type.grind_time_coefficient;
        }
    } catch (error) {
        console.error('分析出错:', error);
        alert('分析出错: ' + error.message);
    } finally {
        loading.classList.remove('show');
    }
});

function displayResults(data) {
    document.getElementById('stoneName').textContent = data.stone_type.name;
    document.getElementById('stoneCategory').textContent = data.stone_type.category;
    document.getElementById('confidence').textContent = (data.confidence * 100).toFixed(1) + '%';
    document.getElementById('inkPerformance').textContent = data.stone_type.ink_performance;
    
    const ratingStars = '★'.repeat(data.stone_type.rating) + '☆'.repeat(5 - data.stone_type.rating);
    document.getElementById('rating').textContent = ratingStars;

    const featuresList = document.getElementById('featuresList');
    featuresList.innerHTML = '';
    const features = data.features_detected.split(/[,，、]/);
    features.forEach(feature => {
        if (feature.trim()) {
            const tag = document.createElement('span');
            tag.className = 'feature-tag';
            tag.textContent = feature.trim();
            featuresList.appendChild(tag);
        }
    });

    document.getElementById('stoneDescription').textContent = data.stone_type.description;

    if (data.extracted_features) {
        document.getElementById('paramLinearity').textContent = data.extracted_features.linearity;
        document.getElementById('paramLineCount').textContent = data.extracted_features.lineCount;
        document.getElementById('paramContrast').textContent = data.extracted_features.contrast;
        document.getElementById('paramHomogeneity').textContent = data.extracted_features.homogeneity;
        document.getElementById('paramAngle').textContent = data.extracted_features.dominantAngle + '°';

        if (data.extracted_features.gaborDirectionality !== undefined) {
            document.getElementById('paramGaborDir').textContent = data.extracted_features.gaborDirectionality;
            document.getElementById('paramGaborSel').textContent = data.extracted_features.gaborSelectivity;
            document.getElementById('paramGaborPer').textContent = data.extracted_features.gaborPeriodicity;
            const orientLabels = ['0°', '30°', '60°', '90°', '120°', '150°'];
            const gaborOrientIdx = data.gabor_dominant_orientation || 0;
            document.getElementById('paramGaborOrient').textContent = orientLabels[gaborOrientIdx] || '-';
        }

        if (data.extracted_features.fusedDim !== undefined) {
            document.getElementById('paramRawDim').textContent = data.extracted_features.fusedDim;
            document.getElementById('paramFusedDim').textContent = '5';
            document.getElementById('paramExplVar').textContent = data.extracted_features.explainedVar;
            document.getElementById('paramAeError').textContent = data.extracted_features.aeReconError;
        }

        if (data.fused_vector) {
            document.getElementById('paramFusedVec').textContent = '[' + data.fused_vector.map(v => v.toFixed(2)).join(', ') + ']';
        }
    }

    resultSection.style.display = 'block';
    grindSection.style.display = 'block';
    
    setTimeout(() => {
        resetInkAnimation();
    }, 100);
}

function initInkCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawInkstoneBase();
    initWaterMolecules();
}

function initWaterMolecules() {
    waterMolecules = [];
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    for (let i = 0; i < 40; i++) {
        waterMolecules.push(new WaterMolecule(centerX, centerY, 80));
    }
}

function drawInkstoneBase() {
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let radius = 120;

    let gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius);
    gradient.addColorStop(0, '#5a5a5a');
    gradient.addColorStop(0.7, '#3d3d3d');
    gradient.addColorStop(1, '#2a2a2a');

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#6b5344';
    ctx.lineWidth = 4;
    ctx.stroke();

    let innerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.7);
    innerGradient.addColorStop(0, '#4a4a4a');
    innerGradient.addColorStop(1, '#333333');

    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 5, radius * 0.7, radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = innerGradient;
    ctx.fill();

    let poolX = centerX + 50;
    let poolY = centerY + 40;
    let poolGradient = ctx.createRadialGradient(poolX, poolY, 0, poolX, poolY, 30);
    poolGradient.addColorStop(0, '#1a1a1a');
    poolGradient.addColorStop(1, '#0d0d0d');

    ctx.beginPath();
    ctx.ellipse(poolX, poolY, 30, 20, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = poolGradient;
    ctx.fill();

    drawMicroscopeOverlay(centerX, centerY);
}

function drawMicroscopeOverlay(centerX, centerY) {
    let lensRadius = 55;
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#aabbcc';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY - 5, lensRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#667788';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX - lensRadius, centerY - 5);
    ctx.lineTo(centerX + lensRadius, centerY - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 5 - lensRadius);
    ctx.lineTo(centerX, centerY - 5 + lensRadius);
    ctx.stroke();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#aabbcc';
    ctx.font = '9px monospace';
    ctx.fillText('×400', centerX + lensRadius - 20, centerY - 5 - lensRadius + 10);
    ctx.restore();
}

function drawGrindMotion(centerX, centerY, inkLevel) {
    if (inkLevel < 1) return;
    grindAngle += 0.03 * (inkLevel / 50);
    let stickRadius = 25 + (1 - inkLevel / 100) * 10;
    let stickX = centerX + Math.cos(grindAngle) * stickRadius * 0.3;
    let stickY = centerY - 5 + Math.sin(grindAngle) * stickRadius * 0.2;

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(stickX, stickY, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(stickX, stickY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function resetInkAnimation() {
    currentInkLevel = 0;
    targetInkLevel = 0;
    carbonParticles = [];
    waterMolecules = [];
    grindAngle = 0;
    spawnAccum = 0;
    grindSlider.value = 0;
    updateGrindDisplay();

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    initInkCanvas();
}

grindSlider.addEventListener('input', (e) => {
    let value = parseInt(e.target.value);
    targetInkLevel = value;
    updateGrindDisplay();
    startAnimation();
});

function updateGrindDisplay() {
    let value = parseInt(grindSlider.value);
    grindCount.textContent = value;
    estimatedTime.textContent = (value * currentGrindCoefficient).toFixed(1) + ' 秒';
}

function startAnimation() {
    if (animationFrame) return;

    function animate() {
        let diff = targetInkLevel - currentInkLevel;

        if (Math.abs(diff) > 0.5) {
            currentInkLevel += diff * 0.05;

            let spawnRate = 0.2 + currentInkLevel * 0.04;
            spawnAccum += spawnRate;
            while (spawnAccum >= 1 && carbonParticles.length < 500) {
                spawnAccum -= 1;
                spawnCarbonParticle();
            }
        }

        let centerX = canvas.width / 2;
        let centerY = canvas.height / 2;

        waterMolecules.forEach(w => w.update(currentInkLevel));

        carbonParticles.forEach(p => p.update(centerX, centerY, currentInkLevel, 1));
        carbonParticles = carbonParticles.filter(p => !p.isDead());

        if (carbonParticles.length > 500) {
            carbonParticles = carbonParticles.slice(carbonParticles.length - 500);
        }

        drawInkAnimation();
        updateInkProgress();
        updateParticleStats();

        let hasActiveParticles = carbonParticles.some(p => p.age < 60);
        if (Math.abs(diff) > 0.1 || hasActiveParticles) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            animationFrame = null;
        }
    }

    animate();
}

function spawnCarbonParticle() {
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let spawnRadius = 8 + Math.random() * 15;
    let angle = Math.random() * Math.PI * 2;

    let baseSize;
    let grindProgress = currentInkLevel / 100;
    if (grindProgress < 0.3) {
        baseSize = 3 + Math.random() * 4;
    } else if (grindProgress < 0.6) {
        baseSize = 1.5 + Math.random() * 3;
    } else {
        baseSize = 0.8 + Math.random() * 2;
    }

    let x = centerX + Math.cos(angle) * spawnRadius;
    let y = centerY - 5 + Math.sin(angle) * spawnRadius * 0.65;
    let particle = new CarbonParticle(x, y, baseSize);
    particle.vx = Math.cos(angle) * (0.5 + Math.random() * 1);
    particle.vy = Math.sin(angle) * (0.3 + Math.random() * 0.6);
    carbonParticles.push(particle);
}

function drawInkAnimation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawInkstoneBase();

    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    waterMolecules.forEach(w => w.draw(ctx));

    drawGrindMotion(centerX, centerY, currentInkLevel);

    let inkRadius = 50 * (currentInkLevel / 100);

    if (currentInkLevel > 0) {
        let opacity = Math.min(currentInkLevel / 100 * 0.5, 0.45);
        let inkGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, inkRadius + 20);
        inkGradient.addColorStop(0, `rgba(15, 15, 20, ${opacity * 0.6})`);
        inkGradient.addColorStop(0.5, `rgba(25, 25, 30, ${opacity * 0.4})`);
        inkGradient.addColorStop(1, `rgba(40, 40, 45, 0)`);

        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 5, inkRadius * 1.2, inkRadius * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = inkGradient;
        ctx.fill();
    }

    let sortedParticles = carbonParticles.slice().sort((a, b) => a.age - b.age);
    sortedParticles.forEach(p => p.draw(ctx));

    if (currentInkLevel > 20) {
        let poolX = centerX + 50;
        let poolY = centerY + 40;
        let poolFillLevel = Math.min((currentInkLevel - 20) / 80, 1);
        let poolOpacity = 0.3 + poolFillLevel * 0.7;

        let poolGradient = ctx.createRadialGradient(poolX, poolY, 0, poolX, poolY, 25);
        poolGradient.addColorStop(0, `rgba(5, 5, 8, ${poolOpacity})`);
        poolGradient.addColorStop(1, `rgba(15, 15, 18, ${poolOpacity * 0.7})`);

        ctx.beginPath();
        ctx.ellipse(poolX, poolY, 25 * poolFillLevel + 5, 15 * poolFillLevel + 3, 0.3, 0, Math.PI * 2);
        ctx.fillStyle = poolGradient;
        ctx.fill();

        if (currentInkLevel > 50) {
            let poolParticleCount = Math.floor((currentInkLevel - 50) / 5);
            ctx.save();
            ctx.globalAlpha = 0.4;
            for (let i = 0; i < poolParticleCount; i++) {
                let pa = Math.random() * Math.PI * 2;
                let pr = Math.random() * 15 * poolFillLevel;
                let px = poolX + Math.cos(pa) * pr;
                let py = poolY + Math.sin(pa) * pr * 0.6;
                ctx.fillStyle = `hsl(220, 15%, ${4 + Math.random() * 6}%)`;
                ctx.beginPath();
                ctx.arc(px, py, 0.5 + Math.random() * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    drawConcentrationInfo(centerX, centerY);
}

function drawConcentrationInfo(centerX, centerY) {
    if (currentInkLevel < 5) return;

    ctx.save();
    let legendX = 15;
    let legendY = canvas.height - 55;

    ctx.globalAlpha = 0.7;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(legendX, legendY, 130, 45);

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#aabbcc';
    ctx.font = '10px monospace';
    ctx.fillText('碳粒分散模拟', legendX + 8, legendY + 14);

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#889999';
    ctx.font = '9px monospace';
    ctx.fillText('碳粒: ' + carbonParticles.length, legendX + 8, legendY + 27);
    ctx.fillText('细度: ' + getFinenessLabel(), legendX + 8, legendY + 39);

    let dotSize = currentInkLevel < 30 ? 4 : (currentInkLevel < 60 ? 2.5 : 1.2);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#1a1a2a';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(legendX + 100 + i * 8, legendY + 35, dotSize, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function getFinenessLabel() {
    if (currentInkLevel < 20) return '粗粒';
    if (currentInkLevel < 40) return '中粒';
    if (currentInkLevel < 60) return '细粒';
    if (currentInkLevel < 80) return '微粒';
    return '纳米级';
}

function updateInkProgress() {
    let percent = Math.round(currentInkLevel);
    inkProgress.style.width = percent + '%';
    inkPercent.textContent = percent + '%';
}

function updateParticleStats() {
    let statsEl = document.getElementById('particleStats');
    if (!statsEl) return;
    let avgSize = 0;
    let dispersedCount = 0;
    if (carbonParticles.length > 0) {
        let totalSize = 0;
        carbonParticles.forEach(p => {
            totalSize += p.size;
            if (p.dispersed) dispersedCount++;
        });
        avgSize = totalSize / carbonParticles.length;
    }
    let dispersion = carbonParticles.length > 0 ? (dispersedCount / carbonParticles.length * 100).toFixed(0) : 0;
    statsEl.innerHTML =
        '<span>碳粒数: <b>' + carbonParticles.length + '</b></span>' +
        '<span>平均粒径: <b>' + avgSize.toFixed(1) + 'μm</b></span>' +
        '<span>分散率: <b>' + dispersion + '%</b></span>';
}

exportBtn.addEventListener('click', () => {
    if (currentRecordId) {
        window.open(`/api/report/${currentRecordId}`, '_blank');
    }
});

window.addEventListener('load', () => {
    if (canvas.getContext) {
        initInkCanvas();
    }
});
