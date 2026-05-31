let currentChar = '永';
let currentStrokeIndex = 0;
let isPlaying = false;
let animationTimer = null;
let currentCharData = null;
let isTraceMode = false;
let isDrawing = false;
let userPoints = [];
let deviationCount = 0;
let totalPointsChecked = 0;
let currentStrokePath = null;
let feedbackTimer = null;

const PAUSE_BETWEEN_STROKES = 500;
const STROKE_ANIMATION_DURATION = 800;
const DEVIATION_THRESHOLD = 8;

function init() {
    renderCharList();
    setupEventListeners();
    loadCharacter(currentChar);
}

function renderCharList() {
    const charList = document.getElementById('charList');
    const chars = getCommonChars();
    
    chars.forEach(char => {
        const charItem = document.createElement('div');
        charItem.className = 'char-item';
        charItem.textContent = char;
        charItem.addEventListener('click', () => {
            document.getElementById('characterInput').value = char;
            loadCharacter(char);
        });
        charList.appendChild(charItem);
    });
}

function setupEventListeners() {
    document.getElementById('startBtn').addEventListener('click', () => {
        const input = document.getElementById('characterInput').value.trim();
        if (input) {
            loadCharacter(input[0]);
        }
    });

    document.getElementById('characterInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const input = e.target.value.trim();
            if (input) {
                loadCharacter(input[0]);
            }
        }
    });

    document.getElementById('prevBtn').addEventListener('click', prevStroke);
    document.getElementById('nextBtn').addEventListener('click', nextStroke);
    document.getElementById('playBtn').addEventListener('click', togglePlay);
    document.getElementById('resetBtn').addEventListener('click', resetAnimation);
    document.getElementById('traceModeBtn').addEventListener('click', toggleTraceMode);

    const traceCanvas = document.getElementById('traceCanvas');
    traceCanvas.addEventListener('pointerdown', onTraceStart);
    traceCanvas.addEventListener('pointermove', onTraceMove);
    traceCanvas.addEventListener('pointerup', onTraceEnd);
    traceCanvas.addEventListener('pointerleave', onTraceEnd);
    traceCanvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
}

function loadCharacter(char) {
    stopAnimation();
    
    if (isTraceMode) {
        toggleTraceMode();
    }
    
    currentChar = char;
    currentCharData = getStrokeData(char);
    
    if (!currentCharData) {
        alert(`抱歉，汉字"${char}"暂不支持演示`);
        return;
    }

    currentStrokeIndex = 0;
    updateInfo();
    clearCanvas();
    updateButtonStates();
}

function updateInfo() {
    if (!currentCharData) return;
    
    document.getElementById('currentChar').textContent = currentChar;
    document.getElementById('totalStrokes').textContent = currentCharData.strokes.length;
    document.getElementById('currentStrokeNum').textContent = 
        `${currentStrokeIndex} / ${currentCharData.strokes.length}`;
    document.getElementById('strokeRule').textContent = currentCharData.rule;
}

function clearCanvas() {
    document.getElementById('writtenStrokes').innerHTML = '';
    document.getElementById('currentStroke').innerHTML = '';
}

function getPathLength(pathData) {
    const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tempPath.setAttribute('d', pathData);
    document.getElementById('strokeCanvas').appendChild(tempPath);
    const length = tempPath.getTotalLength();
    tempPath.remove();
    return length;
}

function drawStroke(strokeIndex, animate = true) {
    if (!currentCharData || strokeIndex < 0 || strokeIndex >= currentCharData.strokes.length) {
        return;
    }

    const pathData = currentCharData.strokes[strokeIndex];
    const pathLength = getPathLength(pathData);
    
    const currentStrokeGroup = document.getElementById('currentStroke');
    currentStrokeGroup.innerHTML = '';
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.className = 'current-stroke';
    
    if (animate) {
        path.style.setProperty('--stroke-length', pathLength);
        path.style.setProperty('--duration', `${STROKE_ANIMATION_DURATION}ms`);
        path.classList.add('animating-stroke');
    }
    
    currentStrokeGroup.appendChild(path);
}

function moveToWritten(strokeIndex) {
    if (!currentCharData || strokeIndex < 0 || strokeIndex >= currentCharData.strokes.length) {
        return;
    }

    const pathData = currentCharData.strokes[strokeIndex];
    const writtenGroup = document.getElementById('writtenStrokes');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.className = 'written-stroke';
    writtenGroup.appendChild(path);
}

function clearCurrentStroke() {
    document.getElementById('currentStroke').innerHTML = '';
}

function prevStroke() {
    if (currentStrokeIndex <= 0) return;
    
    stopAnimation();
    
    if (currentStrokeIndex > 0) {
        currentStrokeIndex--;
        updateInfo();
        redrawAllStrokes();
    }
    
    if (isTraceMode) {
        showCurrentGuideStroke();
        clearTraceCanvas();
    }
    
    updateButtonStates();
}

function nextStroke() {
    if (!currentCharData) return;
    if (currentStrokeIndex >= currentCharData.strokes.length) return;
    
    stopAnimation();
    drawNext();
    
    if (isTraceMode) {
        showCurrentGuideStroke();
        clearTraceCanvas();
    }
    
    updateButtonStates();
}

function drawNext() {
    if (!currentCharData) return;
    if (currentStrokeIndex >= currentCharData.strokes.length) return;
    
    if (currentStrokeIndex > 0) {
        moveToWritten(currentStrokeIndex - 1);
    }
    
    drawStroke(currentStrokeIndex, true);
    currentStrokeIndex++;
    updateInfo();
}

function redrawAllStrokes() {
    clearCanvas();
    
    for (let i = 0; i < currentStrokeIndex; i++) {
        moveToWritten(i);
    }
    
    if (currentStrokeIndex < currentCharData.strokes.length) {
        drawStroke(currentStrokeIndex, false);
    }
}

function togglePlay() {
    if (isPlaying) {
        stopAnimation();
    } else {
        startAnimation();
    }
}

function startAnimation() {
    if (!currentCharData) return;
    
    if (currentStrokeIndex >= currentCharData.strokes.length) {
        resetAnimation();
    }
    
    isPlaying = true;
    document.getElementById('playBtn').textContent = '暂停';
    updateButtonStates();
    playNextStroke();
}

function playNextStroke() {
    if (!isPlaying || !currentCharData) return;
    
    if (currentStrokeIndex >= currentCharData.strokes.length) {
        stopAnimation();
        return;
    }
    
    drawNext();
    updateButtonStates();
    
    animationTimer = setTimeout(() => {
        playNextStroke();
    }, STROKE_ANIMATION_DURATION + PAUSE_BETWEEN_STROKES);
}

function stopAnimation() {
    isPlaying = false;
    document.getElementById('playBtn').textContent = '播放';
    
    if (animationTimer) {
        clearTimeout(animationTimer);
        animationTimer = null;
    }
    
    updateButtonStates();
}

function resetAnimation() {
    stopAnimation();
    currentStrokeIndex = 0;
    updateInfo();
    clearCanvas();
    updateButtonStates();
}

function updateButtonStates() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const resetBtn = document.getElementById('resetBtn');
    const startBtn = document.getElementById('startBtn');
    const traceModeBtn = document.getElementById('traceModeBtn');
    
    if (!currentCharData) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }
    
    if (isPlaying) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        resetBtn.disabled = true;
        startBtn.disabled = true;
        traceModeBtn.disabled = true;
    } else {
        prevBtn.disabled = currentStrokeIndex <= 0;
        nextBtn.disabled = currentStrokeIndex >= currentCharData.strokes.length;
        resetBtn.disabled = false;
        startBtn.disabled = false;
        traceModeBtn.disabled = false;
    }
}

function toggleTraceMode() {
    isTraceMode = !isTraceMode;
    const tianGrid = document.querySelector('.tian-grid');
    const traceBtn = document.getElementById('traceModeBtn');
    const traceCanvas = document.getElementById('traceCanvas');
    
    if (isTraceMode) {
        tianGrid.classList.add('trace-mode');
        traceBtn.classList.add('active');
        traceBtn.textContent = '退出跟写';
        stopAnimation();
        initTraceMode();
    } else {
        tianGrid.classList.remove('trace-mode');
        traceBtn.classList.remove('active');
        traceBtn.textContent = '跟写模式';
        clearTraceCanvas();
        hideFeedback();
        document.getElementById('guideStroke').innerHTML = '';
    }
}

function initTraceMode() {
    if (!currentCharData) return;
    
    resizeTraceCanvas();
    showCurrentGuideStroke();
    clearTraceCanvas();
    showFeedback('info', '请沿蓝色虚线描摹当前笔画');
}

function resizeTraceCanvas() {
    const tianGrid = document.querySelector('.tian-grid');
    const traceCanvas = document.getElementById('traceCanvas');
    const rect = tianGrid.getBoundingClientRect();
    traceCanvas.width = rect.width * window.devicePixelRatio;
    traceCanvas.height = rect.height * window.devicePixelRatio;
    const ctx = traceCanvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function showCurrentGuideStroke() {
    const guideGroup = document.getElementById('guideStroke');
    guideGroup.innerHTML = '';
    
    if (!currentCharData || currentStrokeIndex >= currentCharData.strokes.length) return;
    
    const pathData = currentCharData.strokes[currentStrokeIndex];
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.className = 'guide-stroke';
    guideGroup.appendChild(path);
    
    buildStrokePathModel(pathData);
}

function buildStrokePathModel(pathData) {
    const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tempPath.setAttribute('d', pathData);
    document.getElementById('strokeCanvas').appendChild(tempPath);
    
    const length = tempPath.getTotalLength();
    const sampleCount = Math.max(Math.floor(length / 1), 20);
    currentStrokePath = [];
    
    for (let i = 0; i <= sampleCount; i++) {
        const point = tempPath.getPointAtLength((i / sampleCount) * length);
        currentStrokePath.push({ x: point.x, y: point.y });
    }
    
    tempPath.remove();
}

function svgToCanvasCoords(svgX, svgY) {
    const tianGrid = document.querySelector('.tian-grid');
    const rect = tianGrid.getBoundingClientRect();
    return {
        x: (svgX / 100) * rect.width,
        y: (svgY / 100) * rect.height
    };
}

function canvasToSvgCoords(canvasX, canvasY) {
    const tianGrid = document.querySelector('.tian-grid');
    const rect = tianGrid.getBoundingClientRect();
    return {
        x: (canvasX / rect.width) * 100,
        y: (canvasY / rect.height) * 100
    };
}

function onTraceStart(e) {
    if (!isTraceMode || !currentCharData) return;
    if (currentStrokeIndex >= currentCharData.strokes.length) return;
    
    e.preventDefault();
    isDrawing = true;
    userPoints = [];
    deviationCount = 0;
    totalPointsChecked = 0;
    
    const tianGrid = document.querySelector('.tian-grid');
    const rect = tianGrid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    userPoints.push({ x, y });
}

function onTraceMove(e) {
    if (!isDrawing || !isTraceMode) return;
    e.preventDefault();
    
    const tianGrid = document.querySelector('.tian-grid');
    const rect = tianGrid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    userPoints.push({ x, y });
    
    const svgCoords = canvasToSvgCoords(x, y);
    const deviation = getMinDeviation(svgCoords.x, svgCoords.y);
    totalPointsChecked++;
    
    if (deviation > DEVIATION_THRESHOLD) {
        deviationCount++;
    }
    
    drawUserTrace(deviation);
}

function onTraceEnd(e) {
    if (!isDrawing) return;
    isDrawing = false;
    
    if (userPoints.length < 5) {
        clearTraceCanvas();
        return;
    }
    
    evaluateTrace();
}

function getMinDeviation(svgX, svgY) {
    if (!currentStrokePath || currentStrokePath.length === 0) return Infinity;
    
    let minDist = Infinity;
    for (const point of currentStrokePath) {
        const dx = svgX - point.x;
        const dy = svgY - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
        }
    }
    return minDist;
}

function drawUserTrace(deviation) {
    const traceCanvas = document.getElementById('traceCanvas');
    const ctx = traceCanvas.getContext('2d');
    const len = userPoints.length;
    
    if (len < 2) return;
    
    const prevPoint = userPoints[len - 2];
    const curPoint = userPoints[len - 1];
    
    ctx.beginPath();
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(curPoint.x, curPoint.y);
    
    if (deviation <= DEVIATION_THRESHOLD * 0.5) {
        ctx.strokeStyle = '#28a745';
        ctx.lineWidth = 3;
    } else if (deviation <= DEVIATION_THRESHOLD) {
        ctx.strokeStyle = '#ffc107';
        ctx.lineWidth = 3;
    } else {
        ctx.strokeStyle = '#dc3545';
        ctx.lineWidth = 3;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

function clearTraceCanvas() {
    const traceCanvas = document.getElementById('traceCanvas');
    const ctx = traceCanvas.getContext('2d');
    ctx.clearRect(0, 0, traceCanvas.width, traceCanvas.height);
}

function evaluateTrace() {
    if (totalPointsChecked === 0) return;
    
    const deviationRate = deviationCount / totalPointsChecked;
    
    if (deviationRate < 0.15) {
        showFeedback('success', '写得很好！笔画准确 ✓');
    } else if (deviationRate < 0.35) {
        showFeedback('warning', '基本正确，注意笔画方向');
    } else {
        showFeedback('error', '偏离较大，请再试一次');
    }
    
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
        if (deviationRate < 0.35 && currentStrokeIndex < currentCharData.strokes.length) {
            moveToWritten(currentStrokeIndex);
            currentStrokeIndex++;
            updateInfo();
            updateButtonStates();
            
            if (currentStrokeIndex < currentCharData.strokes.length) {
                showCurrentGuideStroke();
                clearTraceCanvas();
                showFeedback('info', '请继续描摹下一笔');
            } else {
                document.getElementById('guideStroke').innerHTML = '';
                document.getElementById('currentStroke').innerHTML = '';
                showFeedback('success', '恭喜！全部笔画完成 ✓');
                clearTraceCanvas();
            }
        } else {
            clearTraceCanvas();
        }
    }, 1500);
}

function showFeedback(type, text) {
    const feedback = document.getElementById('traceFeedback');
    const icon = document.getElementById('feedbackIcon');
    const textEl = document.getElementById('feedbackText');
    
    feedback.className = 'trace-feedback ' + type;
    
    const icons = {
        success: '✓',
        warning: '!',
        error: '✗',
        info: 'ℹ'
    };
    
    icon.textContent = icons[type] || '';
    textEl.textContent = text;
}

function hideFeedback() {
    const feedback = document.getElementById('traceFeedback');
    feedback.className = 'trace-feedback hidden';
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', () => {
    if (isTraceMode) {
        resizeTraceCanvas();
    }
});