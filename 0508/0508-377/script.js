class TypingTimer {
    constructor() {
        this.reset();
        this.PAUSE_THRESHOLD = 2000;
    }
    
    reset() {
        this.startTime = null;
        this.lastKeyTime = null;
        this.totalTime = 0;
        this.effectiveTime = 0;
        this.isRunning = false;
    }
    
    start() {
        this.startTime = Date.now();
        this.lastKeyTime = null;
        this.totalTime = 0;
        this.effectiveTime = 0;
        this.isRunning = true;
    }
    
    stop() {
        if (this.startTime) {
            this.totalTime = Date.now() - this.startTime;
        }
        this.isRunning = false;
    }
    
    recordKey() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        
        if (this.lastKeyTime !== null) {
            const timeSinceLastKey = now - this.lastKeyTime;
            if (timeSinceLastKey <= this.PAUSE_THRESHOLD) {
                this.effectiveTime += timeSinceLastKey;
            }
        }
        
        this.lastKeyTime = now;
    }
    
    getTotalTime() {
        if (this.isRunning && this.startTime) {
            return Date.now() - this.startTime;
        }
        return this.totalTime;
    }
    
    getEffectiveTime() {
        return this.effectiveTime;
    }
    
    getTotalMinutes() {
        return this.getTotalTime() / 1000 / 60;
    }
    
    getEffectiveMinutes() {
        return this.effectiveTime / 1000 / 60;
    }
    
    calculateWPM(totalChars, useEffectiveTime = true) {
        if (totalChars === 0) return 0;
        
        const minutes = useEffectiveTime ? this.getEffectiveMinutes() : this.getTotalMinutes();
        if (minutes <= 0) return 0;
        
        const wordsTyped = totalChars / 5;
        return Math.round(wordsTyped / minutes);
    }
    
    getStats(totalChars = 0) {
        return {
            totalTime: this.getTotalTime(),
            effectiveTime: this.effectiveTime,
            totalWpm: this.calculateWPM(totalChars, false),
            effectiveWpm: this.calculateWPM(totalChars, true)
        };
    }
}

const articles = {
    easy: [
        "The quick brown fox jumps over the lazy dog.",
        "A journey of a thousand miles begins with a single step.",
        "To be or not to be, that is the question.",
        "All that glitters is not gold.",
        "Where there is a will, there is a way."
    ],
    medium: [
        "Success is not final, failure is not fatal. It is the courage to continue that counts.",
        "The only limit to our realization of tomorrow is our doubts of today.",
        "In the middle of difficulty lies opportunity, and the greatest glory in living lies not in never falling.",
        "Life is what happens to you while you are busy making other plans.",
        "The best way to predict the future is to create it, and the future belongs to those who believe in the beauty of their dreams."
    ],
    hard: [
        "In the depths of winter, I finally learned that within me there lay an invincible summer, a season of hope that no external cold could ever extinguish.",
        "The only person you are destined to become is the person you decide to be, and the greatest discovery of all time is that a person can change his future by merely changing his attitude.",
        "Everything you have ever wanted is on the other side of fear, and success usually comes to those who are too busy to be looking for it.",
        "The mind is everything. What you think you become, and all our dreams can come true if we have the courage to pursue them.",
        "The best time to plant a tree was twenty years ago. The second best time is now, for time is what we want most, but what we use worst."
    ]
};

const textDisplay = document.getElementById('textDisplay');
const userInput = document.getElementById('userInput');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const useCustomBtn = document.getElementById('useCustomBtn');
const customText = document.getElementById('customText');
const difficulty = document.getElementById('difficulty');
const articleSelect = document.getElementById('articleSelect');
const soundEnabled = document.getElementById('soundEnabled');

const wpmDisplay = document.getElementById('wpm');
const netWpmDisplay = document.getElementById('netWpm');
const accuracyDisplay = document.getElementById('accuracy');
const keystrokesDisplay = document.getElementById('keystrokes');
const errorsDisplay = document.getElementById('errors');

const reportModal = document.getElementById('reportModal');
const closeModal = document.getElementById('closeModal');
const restartBtn = document.getElementById('restartBtn');

const totalTimeDisplay = document.getElementById('totalTime');
const avgWpmDisplay = document.getElementById('avgWpm');
const totalAccuracyDisplay = document.getElementById('totalAccuracy');
const totalKeystrokesDisplay = document.getElementById('totalKeystrokes');
const totalErrorsDisplay = document.getElementById('totalErrors');
const errorCharsListEl = document.getElementById('errorCharsList');

let currentArticle = '';
let isPracticing = false;
let stats = {
    wpm: 0,
    netWpm: 0,
    accuracy: 0,
    keystrokes: 0,
    errors: 0
};
let errorChars = {};
let keyPressCounts = {};
let speedHistory = [];
let chart = null;
let chartUpdateInterval = null;
let audioContext = null;
const typingTimer = new TypingTimer();

const keyboardLayout = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\'', 'Enter'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Menu', 'Ctrl']
];

const keyWidths = {
    'Backspace': 'wide',
    'Tab': 'wide',
    'Caps': 'wide',
    'Enter': 'wide',
    'Shift': 'wide',
    'Ctrl': 'wide',
    'Win': 'wide',
    'Alt': 'wide',
    'Space': 'extra-wide',
    'Menu': 'wide'
};

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function getErrorLevel(errorCount, totalCount) {
    if (errorCount === 0) return 'correct-key';
    const errorRate = errorCount / totalCount;
    if (errorRate < 0.2) return 'low-error';
    if (errorRate < 0.5) return 'medium-error';
    return 'high-error';
}

function createKeyboardHeatmap() {
    const keyboardHeatmap = document.getElementById('keyboardHeatmap');
    keyboardHeatmap.innerHTML = '';
    
    keyboardLayout.forEach((row) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        
        row.forEach((key) => {
            const keyDiv = document.createElement('div');
            keyDiv.className = `key ${keyWidths[key] || ''} correct-key`;
            keyDiv.textContent = key;
            keyDiv.dataset.key = key.toLowerCase();
            keyDiv.addEventListener('click', () => {
                const upperKey = key.toUpperCase();
                const lowerKey = key.toLowerCase();
                const errorCount = errorChars[upperKey] || errorChars[lowerKey] || 0;
                const pressCount = keyPressCounts[upperKey] || keyPressCounts[lowerKey] || 0;
                alert(`键位 "${key}"\n总按下次数: ${pressCount}\n错误次数: ${errorCount}`);
            });
            rowDiv.appendChild(keyDiv);
        });
        
        keyboardHeatmap.appendChild(rowDiv);
    });
}

function updateKeyboardHeatmap() {
    const keys = document.querySelectorAll('.key');
    keys.forEach((keyDiv) => {
        const key = keyDiv.dataset.key;
        const upperKey = key.toUpperCase();
        const lowerKey = key.toLowerCase();
        const errorCount = errorChars[upperKey] || errorChars[lowerKey] || 0;
        const pressCount = keyPressCounts[upperKey] || keyPressCounts[lowerKey] || 0;
        
        keyDiv.classList.remove('correct-key', 'low-error', 'medium-error', 'high-error');
        
        if (pressCount > 0) {
            const level = getErrorLevel(errorCount, pressCount);
            keyDiv.classList.add(level);
        } else {
            keyDiv.classList.add('correct-key');
        }
        
        const existingBadge = keyDiv.querySelector('.error-count');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        if (errorCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'error-count';
            badge.textContent = errorCount;
            keyDiv.appendChild(badge);
        }
    });
}

function playKeySound(isCorrect) {
    if (!soundEnabled.checked) return;
    
    const ctx = initAudio();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = isCorrect ? 800 : 400;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
}

function createChart() {
    const ctx = document.getElementById('speedChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '打字速度 (WPM)',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '时间 (秒)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'WPM'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function updateChart() {
    const elapsed = Math.floor(typingTimer.getTotalTime() / 1000);
    if (elapsed % 10 === 0 && stats.keystrokes > 0) {
        const currentWpm = typingTimer.calculateWPM(stats.keystrokes, true);
        
        speedHistory.push({ time: elapsed, wpm: currentWpm });
        
        if (chart) {
            chart.data.labels.push(elapsed + 's');
            chart.data.datasets[0].data.push(currentWpm);
            chart.update();
        }
    }
}

function displayText() {
    let html = '';
    const userText = userInput.value;
    
    for (let i = 0; i < currentArticle.length; i++) {
        const char = currentArticle[i];
        if (i < userText.length) {
            if (userText[i] === char) {
                html += `<span class="correct">${char}</span>`;
            } else {
                html += `<span class="incorrect">${char}</span>`;
            }
        } else if (i === userText.length) {
            html += `<span class="current">${char}</span>`;
        } else {
            html += char;
        }
    }
    
    textDisplay.innerHTML = html;
}

function updateStats() {
    const userText = userInput.value;
    let correct = 0;
    let errors = 0;
    
    for (let i = 0; i < userText.length; i++) {
        if (userText[i] === currentArticle[i]) {
            correct++;
        } else {
            errors++;
            const wrongChar = currentArticle[i];
            if (wrongChar) {
                errorChars[wrongChar] = (errorChars[wrongChar] || 0) + 1;
            }
        }
    }
    
    stats.keystrokes = userText.length;
    stats.errors = errors;
    stats.accuracy = correct > 0 ? Math.round((correct / userText.length) * 100) : 0;
    
    const timerStats = typingTimer.getStats(userText.length);
    stats.wpm = timerStats.totalWpm;
    stats.netWpm = timerStats.effectiveWpm;
    
    wpmDisplay.textContent = stats.wpm;
    netWpmDisplay.textContent = stats.netWpm;
    accuracyDisplay.textContent = stats.accuracy + '%';
    keystrokesDisplay.textContent = stats.keystrokes;
    errorsDisplay.textContent = stats.errors;
}

function handleInput(e) {
    if (!isPracticing) return;
    
    typingTimer.recordKey();
    
    const userText = e.target.value;
    const currentChar = userText[userText.length - 1];
    const expectedChar = currentArticle[userText.length - 1];
    const isCorrect = currentChar === expectedChar;
    
    const upperChar = currentChar.toUpperCase();
    keyPressCounts[upperChar] = (keyPressCounts[upperChar] || 0) + 1;
    
    playKeySound(isCorrect);
    displayText();
    updateStats();
    updateKeyboardHeatmap();
    
    if (userText.length === currentArticle.length) {
        finishPractice();
    }
}

function finishPractice() {
    isPracticing = false;
    userInput.disabled = true;
    typingTimer.stop();
    
    const totalElapsed = Math.round(typingTimer.getTotalTime() / 1000);
    const timerStats = typingTimer.getStats(stats.keystrokes);
    
    totalTimeDisplay.textContent = totalElapsed + '秒';
    avgWpmDisplay.textContent = timerStats.effectiveWpm;
    totalAccuracyDisplay.textContent = stats.accuracy + '%';
    totalKeystrokesDisplay.textContent = stats.keystrokes;
    totalErrorsDisplay.textContent = stats.errors;
    
    const sortedErrors = Object.entries(errorChars)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const errorCharsList = document.getElementById('errorCharsList');
    errorCharsList.innerHTML = '';
    
    if (sortedErrors.length > 0) {
        sortedErrors.forEach(([char, count]) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="char">"${char}"</span><span class="count">${count}次</span>`;
            errorCharsList.appendChild(li);
        });
    } else {
        errorCharsList.innerHTML = '<li style="text-align: center;">没有错误字符</li>';
    }
    
    reportModal.style.display = 'block';
    
    if (chartUpdateInterval) {
        clearInterval(chartUpdateInterval);
    }
}

function startPractice() {
    const custom = customText.value.trim();
    if (custom) {
        currentArticle = custom;
    } else {
        const diff = difficulty.value;
        const index = parseInt(articleSelect.value);
        currentArticle = articles[diff][index];
    }
    
    userInput.value = '';
    stats = { wpm: 0, netWpm: 0, accuracy: 0, keystrokes: 0, errors: 0 };
    errorChars = {};
    keyPressCounts = {};
    speedHistory = [];
    
    displayText();
    updateStats();
    updateKeyboardHeatmap();
    
    typingTimer.start();
    isPracticing = true;
    userInput.disabled = false;
    userInput.focus();
    
    if (chart) {
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.update();
    }
    
    chartUpdateInterval = setInterval(updateChart, 1000);
}

function resetPractice() {
    isPracticing = false;
    userInput.value = '';
    userInput.disabled = true;
    stats = { wpm: 0, netWpm: 0, accuracy: 0, keystrokes: 0, errors: 0 };
    errorChars = {};
    keyPressCounts = {};
    speedHistory = [];
    typingTimer.reset();
    
    wpmDisplay.textContent = '0';
    netWpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '0%';
    keystrokesDisplay.textContent = '0';
    errorsDisplay.textContent = '0';
    
    textDisplay.textContent = '点击"开始练习"按钮开始打字练习';
    
    if (chart) {
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.update();
    }
    
    if (chartUpdateInterval) {
        clearInterval(chartUpdateInterval);
    }
    
    reportModal.style.display = 'none';
    updateKeyboardHeatmap();
}

function useCustomText() {
    if (customText.value.trim()) {
        articleSelect.disabled = true;
        difficulty.disabled = true;
    } else {
        articleSelect.disabled = false;
        difficulty.disabled = false;
    }
}

startBtn.addEventListener('click', startPractice);
resetBtn.addEventListener('click', resetPractice);
useCustomBtn.addEventListener('click', useCustomText);
userInput.addEventListener('input', handleInput);

closeModal.addEventListener('click', () => {
    reportModal.style.display = 'none';
});

restartBtn.addEventListener('click', () => {
    reportModal.style.display = 'none';
    startPractice();
});

window.addEventListener('click', (e) => {
    if (e.target === reportModal) {
        reportModal.style.display = 'none';
    }
});

difficulty.addEventListener('change', () => {
    customText.value = '';
    articleSelect.disabled = false;
});

customText.addEventListener('input', () => {
    if (customText.value.trim()) {
        articleSelect.disabled = true;
        difficulty.disabled = true;
    } else {
        articleSelect.disabled = false;
        difficulty.disabled = false;
    }
});

createChart();
createKeyboardHeatmap();
resetPractice();