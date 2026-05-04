class ImagePreprocessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.targetBrightness = 128;
        this.contrastFactor = 1.3;
        this.smoothingFrames = 5;
        this.brightnessHistory = [];
    }

    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    calculateBrightness(imageData) {
        const data = imageData.data;
        let totalBrightness = 0;
        const pixelCount = data.length / 4;
        
        const step = Math.max(1, Math.floor(pixelCount / 1000));
        let sampledCount = 0;
        
        for (let i = 0; i < data.length; i += 4 * step) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            totalBrightness += brightness;
            sampledCount++;
        }
        
        return totalBrightness / sampledCount;
    }

    calculateContrast(imageData) {
        const data = imageData.data;
        const brightnessValues = [];
        
        const step = Math.max(1, Math.floor(data.length / 4 / 500));
        
        for (let i = 0; i < data.length; i += 4 * step) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            brightnessValues.push(brightness);
        }
        
        if (brightnessValues.length < 2) return 50;
        
        const mean = brightnessValues.reduce((a, b) => a + b, 0) / brightnessValues.length;
        const variance = brightnessValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / brightnessValues.length;
        
        return Math.sqrt(variance);
    }

    adjustBrightness(imageData, targetBrightness) {
        const data = imageData.data;
        const currentBrightness = this.calculateBrightness(imageData);
        
        this.brightnessHistory.push(currentBrightness);
        if (this.brightnessHistory.length > this.smoothingFrames) {
            this.brightnessHistory.shift();
        }
        
        const smoothedBrightness = this.brightnessHistory.reduce((a, b) => a + b, 0) / this.brightnessHistory.length;
        
        const brightnessDiff = targetBrightness - smoothedBrightness;
        const adjustmentFactor = Math.max(0.5, Math.min(2.0, 1 + brightnessDiff / 128));
        
        const contrast = this.calculateContrast(imageData);
        let contrastAdjust = 1.0;
        if (contrast < 40) {
            contrastAdjust = 1.2 + (40 - contrast) / 100;
        }
        
        for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) {
                let value = data[i + j];
                
                value = (value - 128) * contrastAdjust + 128;
                
                value = value * adjustmentFactor;
                
                value = Math.max(0, Math.min(255, value));
                
                data[i + j] = Math.round(value);
            }
        }
        
        return imageData;
    }

    simpleDenoise(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const output = new Uint8ClampedArray(data);
        
        const kernelSize = 1;
        
        for (let y = kernelSize; y < height - kernelSize; y++) {
            for (let x = kernelSize; x < width - kernelSize; x++) {
                const idx = (y * width + x) * 4;
                
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    let count = 0;
                    
                    for (let ky = -kernelSize; ky <= kernelSize; ky++) {
                        for (let kx = -kernelSize; kx <= kernelSize; kx++) {
                            const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
                            sum += data[kidx];
                            count++;
                        }
                    }
                    
                    output[idx + c] = Math.round(sum / count);
                }
            }
        }
        
        for (let i = 0; i < data.length; i++) {
            data[i] = output[i];
        }
        
        return imageData;
    }

    histogramEqualization(imageData) {
        const data = imageData.data;
        const histogram = new Array(256).fill(0);
        const cdf = new Array(256).fill(0);
        
        for (let i = 0; i < data.length; i += 4) {
            const brightness = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
            histogram[brightness]++;
        }
        
        cdf[0] = histogram[0];
        for (let i = 1; i < 256; i++) {
            cdf[i] = cdf[i - 1] + histogram[i];
        }
        
        const totalPixels = data.length / 4;
        const cdfMin = cdf.find(v => v > 0);
        
        for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) {
                const value = data[i + j];
                const equalized = Math.round(((cdf[value] - cdfMin) / (totalPixels - cdfMin)) * 255);
                data[i + j] = equalized;
            }
        }
        
        return imageData;
    }

    process(videoSource, autoAdjust = true) {
        this.ctx.drawImage(videoSource, 0, 0, this.canvas.width, this.canvas.height);
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        if (autoAdjust) {
            const currentBrightness = this.calculateBrightness(imageData);
            
            if (currentBrightness < 80) {
                this.adjustBrightness(imageData, this.targetBrightness);
                this.histogramEqualization(imageData);
            } else if (currentBrightness > 200) {
                this.adjustBrightness(imageData, this.targetBrightness);
            }
            
            const contrast = this.calculateContrast(imageData);
            if (contrast < 35) {
                this.simpleDenoise(imageData);
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        
        return {
            canvas: this.canvas,
            brightness: this.calculateBrightness(imageData),
            contrast: this.calculateContrast(imageData)
        };
    }
}

class TrainingSession {
    constructor(poseId) {
        this.sessionId = `session_${Date.now()}`;
        this.poseId = poseId;
        this.startTime = Date.now();
        this.endTime = null;
        this.scores = [];
        this.errors = [];
        this.frameCount = 0;
        this.isActive = true;
    }
    
    addScore(score) {
        if (score > 0) {
            this.scores.push(score);
        }
    }
    
    addError(error) {
        if (error && error.name) {
            this.errors.push(error.name);
        }
    }
    
    incrementFrame() {
        this.frameCount++;
    }
    
    end() {
        this.isActive = false;
        this.endTime = Date.now();
        return this.toJSON();
    }
    
    getDuration() {
        const end = this.endTime || Date.now();
        return Math.round((end - this.startTime) / 1000);
    }
    
    getAverageScore() {
        if (this.scores.length === 0) return 0;
        return Math.round(this.scores.reduce((a, b) => a + b, 0) / this.scores.length);
    }
    
    getUniqueErrors() {
        return [...new Set(this.errors)];
    }
    
    toJSON() {
        return {
            session_id: this.sessionId,
            session_date: new Date().toISOString(),
            pose_id: this.poseId,
            duration_seconds: this.getDuration(),
            average_score: this.getAverageScore(),
            frame_count: this.frameCount,
            common_errors: this.getUniqueErrors()
        };
    }
}

class CalendarManager {
    constructor(backendBaseUrl) {
        this.backendBaseUrl = backendBaseUrl;
        this.selectedDate = new Date();
        this.currentWeekStart = this.getWeekStart(new Date());
        this.weeklyPlan = null;
    }
    
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }
    
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    getDayName(dayIndex) {
        const names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        return names[dayIndex];
    }
    
    getWorkoutTypeDisplay(type) {
        const displays = {
            'full_body': '全身训练',
            'lower_body': '下肢训练',
            'upper_body': '上肢训练',
            'core': '核心训练',
            'rest': '休息日'
        };
        return displays[type] || type;
    }
    
    async fetchWeeklyPlan(startDate) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`${this.backendBaseUrl}/training/plan/weekly`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                this.weeklyPlan = await response.json();
                return this.weeklyPlan;
            }
        } catch (error) {
            console.warn('获取周计划失败:', error);
        }
        
        return null;
    }
    
    renderCalendar() {
        const container = document.getElementById('calendarDays');
        if (!container) return;
        
        let html = '';
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + i);
            
            const isToday = this.isSameDay(date, new Date());
            const isSelected = this.isSameDay(date, this.selectedDate);
            const dayType = this.getDayType(i);
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            classes += ` ${dayType === 'rest' ? 'rest' : 'workout'}`;
            
            const dayDisplay = dayType === 'rest' ? '休' : this.getWorkoutTypeDisplay(dayType).substring(0, 2);
            
            html += `
                <div class="${classes}" data-date="${this.formatDate(date)}" data-day-index="${i}">
                    <div class="calendar-day-number">${date.getDate()}</div>
                    <div class="calendar-day-type">${dayDisplay}</div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        container.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.dataset.date;
                this.selectedDate = new Date(dateStr);
                this.renderCalendar();
                this.renderSelectedDayPlan(parseInt(day.dataset.dayIndex));
            });
        });
        
        const todayIndex = this.getTodayIndex();
        if (todayIndex >= 0) {
            this.renderSelectedDayPlan(todayIndex);
        }
    }
    
    getTodayIndex() {
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + i);
            if (this.isSameDay(date, today)) {
                return i;
            }
        }
        return -1;
    }
    
    getDayType(dayIndex) {
        const schedule = ['full_body', 'rest', 'lower_body', 'rest', 'upper_body', 'rest', 'core'];
        return schedule[dayIndex];
    }
    
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    renderSelectedDayPlan(dayIndex) {
        const container = document.getElementById('selectedDayPlan');
        if (!container) return;
        
        const dayType = this.getDayType(dayIndex);
        const date = new Date(this.currentWeekStart);
        date.setDate(date.getDate() + dayIndex);
        
        const workoutTypes = {
            'full_body': ['squat', 'pushup', 'plank'],
            'lower_body': ['squat', 'squat', 'plank'],
            'upper_body': ['pushup', 'pushup', 'plank'],
            'core': ['plank', 'plank', 'squat']
        };
        
        const poseNames = {
            'squat': '深蹲',
            'pushup': '俯卧撑',
            'plank': '平板支撑'
        };
        
        const focusAreas = {
            'squat': '腿部',
            'pushup': '胸部',
            'plank': '核心'
        };
        
        if (dayType === 'rest') {
            container.innerHTML = `
                <div class="rest-day-card">
                    <div class="rest-day-icon">🌿</div>
                    <h3>休息日</h3>
                    <p>今天是休息日，建议进行轻度拉伸或散步。</p>
                    <p style="margin-top: 10px; color: #666; font-size: 0.9rem;">
                        让肌肉得到充分的休息和恢复，明天继续加油！
                    </p>
                </div>
            `;
            return;
        }
        
        const exercises = workoutTypes[dayType] || [];
        
        let exercisesHtml = '';
        exercises.forEach((poseId, index) => {
            exercisesHtml += `
                <div class="exercise-card">
                    <div class="exercise-header">
                        <span class="exercise-name">${poseNames[poseId]}</span>
                        <span class="exercise-focus">${focusAreas[poseId]}</span>
                    </div>
                    <div class="exercise-stats">
                        <span>组数: 3</span>
                        <span>次数: 12</span>
                        <span>休息: 60秒</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = `
            <div class="today-plan">
                <h3>${this.getDayName(dayIndex)} - ${this.getWorkoutTypeDisplay(dayType)}</h3>
                <div class="plan-info">
                    <span>日期: ${this.formatDate(date)}</span>
                    <span>预计时长: ~20分钟</span>
                </div>
                
                <div class="exercise-list">
                    ${exercisesHtml}
                </div>
            </div>
        `;
    }
    
    previousWeek() {
        this.currentWeekStart = new Date(this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7));
        this.renderCalendar();
        this.updateCalendarTitle();
    }
    
    nextWeek() {
        this.currentWeekStart = new Date(this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7));
        this.renderCalendar();
        this.updateCalendarTitle();
    }
    
    updateCalendarTitle() {
        const title = document.getElementById('calendarTitle');
        if (!title) return;
        
        const endDate = new Date(this.currentWeekStart);
        endDate.setDate(endDate.getDate() + 6);
        
        const formatShort = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
        title.textContent = `${formatShort(this.currentWeekStart)} - ${formatShort(endDate)}`;
    }
}

class TrainingStatsManager {
    constructor(backendBaseUrl) {
        this.backendBaseUrl = backendBaseUrl;
    }
    
    async fetchStats() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`${this.backendBaseUrl}/training/stats`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('获取统计数据失败:', error);
        }
        
        return null;
    }
    
    renderStats(stats) {
        if (!stats) return;
        
        const totalSessions = document.getElementById('totalSessions');
        const totalDuration = document.getElementById('totalDuration');
        const userLevelBadge = document.getElementById('userLevelBadge');
        const historyAvgScore = document.getElementById('historyAvgScore');
        const recentAvgScore = document.getElementById('recentAvgScore');
        const improvementTrend = document.getElementById('improvementTrend');
        
        if (totalSessions) totalSessions.textContent = stats.total_sessions || 0;
        if (totalDuration) totalDuration.textContent = stats.total_duration_minutes || 0;
        if (userLevelBadge) userLevelBadge.textContent = stats.level_name || '初学者';
        if (historyAvgScore) historyAvgScore.textContent = stats.average_score_all_time !== undefined ? stats.average_score_all_time : '--';
        if (recentAvgScore) recentAvgScore.textContent = stats.average_score_recent_7 !== undefined ? stats.average_score_recent_7 : '--';
        
        if (improvementTrend) {
            const trend = stats.improvement_trend || 0;
            if (trend > 0) {
                improvementTrend.textContent = `+${trend} ↑`;
                improvementTrend.style.color = '#28a745';
            } else if (trend < 0) {
                improvementTrend.textContent = `${trend} ↓`;
                improvementTrend.style.color = '#dc3545';
            } else {
                improvementTrend.textContent = '--';
                improvementTrend.style.color = '#666';
            }
        }
        
        const weakPointsSection = document.getElementById('weakPointsSection');
        const weakPointsList = document.getElementById('weakPointsList');
        
        if (weakPointsSection && weakPointsList && stats.weak_points) {
            const weakPoints = stats.weak_points;
            
            if (Object.keys(weakPoints).length > 0) {
                weakPointsSection.style.display = 'block';
                
                const poseNames = {
                    'squat': '深蹲',
                    'pushup': '俯卧撑',
                    'plank': '平板支撑'
                };
                
                let html = '';
                for (const [poseId, data] of Object.entries(weakPoints)) {
                    html += `
                        <div class="weak-point-item">
                            <span class="weak-point-name">${poseNames[poseId] || poseId}</span>
                            <span class="weak-point-score">平均: ${data.average_score}分</span>
                        </div>
                    `;
                }
                weakPointsList.innerHTML = html;
            } else {
                weakPointsSection.style.display = 'none';
            }
        }
    }
}

class ToastManager {
    constructor() {
        this.toastElement = document.getElementById('toast');
    }
    
    show(message, type = 'success', duration = 3000) {
        if (!this.toastElement) return;
        
        this.toastElement.textContent = message;
        this.toastElement.className = `toast ${type} show`;
        
        setTimeout(() => {
            this.toastElement.classList.remove('show');
        }, duration);
    }
}

class FitnessPoseDetection {
    constructor() {
        this.video = document.getElementById('videoElement');
        this.canvas = document.getElementById('canvasElement');
        this.ctx = this.canvas.getContext('2d');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        
        this.preprocessor = new ImagePreprocessor();
        this.toast = new ToastManager();
        
        this.model = null;
        this.isRunning = false;
        this.animationId = null;
        this.currentPose = 'squat';
        
        this.frameCount = 0;
        this.errorCount = 0;
        this.scores = [];
        this.lastFrameTime = 0;
        this.fps = 0;
        
        this.backendBaseUrl = 'http://localhost:5000/api';
        this.backendConnected = false;
        this.backendFailures = 0;
        this.maxBackendFailures = 3;
        this.backendCooldown = false;
        this.cooldownEndTime = 0;
        
        this.minPoseScore = 0.5;
        this.minKeypointScore = 0.4;
        this.minAverageKeypointScore = 0.55;
        
        this.currentSession = null;
        this.sessionStartTime = null;
        
        this.keypointIndices = {
            'nose': 0, 'left_eye': 1, 'right_eye': 2, 'left_ear': 3, 'right_ear': 4,
            'left_shoulder': 5, 'right_shoulder': 6, 'left_elbow': 7, 'right_elbow': 8,
            'left_wrist': 9, 'right_wrist': 10, 'left_hip': 11, 'right_hip': 12,
            'left_knee': 13, 'right_knee': 14, 'left_ankle': 15, 'right_ankle': 16
        };
        
        this.connections = [
            ['nose', 'left_eye'], ['nose', 'right_eye'],
            ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
            ['left_shoulder', 'right_shoulder'],
            ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
            ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'],
            ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
            ['left_hip', 'right_hip'],
            ['left_hip', 'left_knee'], ['right_hip', 'right_knee'],
            ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle']
        ];
        
        this.angleDefinitions = {
            'left_elbow': ['left_shoulder', 'left_elbow', 'left_wrist'],
            'right_elbow': ['right_shoulder', 'right_elbow', 'right_wrist'],
            'left_shoulder': ['left_hip', 'left_shoulder', 'left_elbow'],
            'right_shoulder': ['right_hip', 'right_shoulder', 'right_elbow'],
            'left_hip': ['left_shoulder', 'left_hip', 'left_knee'],
            'right_hip': ['right_shoulder', 'right_hip', 'right_knee'],
            'left_knee': ['left_hip', 'left_knee', 'left_ankle'],
            'right_knee': ['right_hip', 'right_knee', 'right_ankle']
        };
        
        this.consecutiveLowQualityFrames = 0;
        this.maxConsecutiveLowQuality = 5;
        this.lastValidPose = null;
        
        this.calendarManager = new CalendarManager(this.backendBaseUrl);
        this.statsManager = new TrainingStatsManager(this.backendBaseUrl);
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.setupTabNavigation();
        await this.checkBackendConnection();
        this.loadingText.textContent = '准备就绪，请点击"开始检测"';
        
        this.calendarManager.renderCalendar();
        this.calendarManager.updateCalendarTitle();
        
        const stats = await this.statsManager.fetchStats();
        if (stats) {
            this.statsManager.renderStats(stats);
        }
    }
    
    setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                const targetContent = document.getElementById(`tab-${targetTab}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                if (targetTab === 'stats') {
                    this.refreshStats();
                }
            });
        });
        
        const prevWeekBtn = document.getElementById('prevWeekBtn');
        const nextWeekBtn = document.getElementById('nextWeekBtn');
        
        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => {
                this.calendarManager.previousWeek();
            });
        }
        
        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                this.calendarManager.nextWeek();
            });
        }
        
        const refreshPlanBtn = document.getElementById('refreshPlanBtn');
        if (refreshPlanBtn) {
            refreshPlanBtn.addEventListener('click', () => {
                this.calendarManager.renderCalendar();
                this.toast.show('计划已刷新', 'success');
            });
        }
        
        const refreshStatsBtn = document.getElementById('refreshStatsBtn');
        if (refreshStatsBtn) {
            refreshStatsBtn.addEventListener('click', () => {
                this.refreshStats();
            });
        }
    }
    
    async refreshStats() {
        const stats = await this.statsManager.fetchStats();
        if (stats) {
            this.statsManager.renderStats(stats);
            this.toast.show('统计数据已更新', 'success');
        } else {
            this.toast.show('获取统计数据失败', 'error');
        }
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        
        const saveSessionBtn = document.getElementById('saveSessionBtn');
        if (saveSessionBtn) {
            saveSessionBtn.addEventListener('click', () => this.saveCurrentSession());
        }
        
        document.getElementById('poseSelect').addEventListener('change', (e) => {
            this.currentPose = e.target.value;
            this.resetStats();
        });
    }
    
    async checkBackendConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`${this.backendBaseUrl}/health`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                this.backendConnected = true;
                this.backendFailures = 0;
                const statusEl = document.getElementById('backendStatus');
                if (statusEl) {
                    statusEl.textContent = '已连接';
                    statusEl.style.color = '#28a745';
                }
            }
        } catch (error) {
            console.warn('后端未连接，将使用本地分析模式');
            this.backendConnected = false;
            const statusEl = document.getElementById('backendStatus');
            if (statusEl) {
                statusEl.textContent = '未连接';
                statusEl.style.color = '#dc3545';
            }
        }
    }
    
    async start() {
        if (this.isRunning) return;
        
        this.loadingOverlay.style.display = 'flex';
        this.loadingText.textContent = '正在启动摄像头...';
        
        try {
            await this.initCamera();
            this.loadingText.textContent = '正在加载MoveNet模型...';
            await this.loadModel();
            
            this.isRunning = true;
            this.currentSession = new TrainingSession(this.currentPose);
            this.sessionStartTime = Date.now();
            
            this.updateUIState(true);
            this.loadingOverlay.style.display = 'none';
            
            this.detectPose();
        } catch (error) {
            console.error('启动失败:', error);
            this.loadingText.textContent = '启动失败: ' + error.message;
        }
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
        }
        
        this.updateUIState(false);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.consecutiveLowQualityFrames = 0;
        this.lastValidPose = null;
        this.preprocessor.brightnessHistory = [];
        
        if (this.currentSession && this.currentSession.scores.length > 0) {
            const saveBtn = document.getElementById('saveSessionBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
            }
        }
    }
    
    async saveCurrentSession() {
        if (!this.currentSession) {
            this.toast.show('没有可保存的训练记录', 'error');
            return;
        }
        
        const sessionData = this.currentSession.end();
        
        if (this.currentSession.scores.length === 0) {
            this.toast.show('训练数据不足，无法保存', 'error');
            return;
        }
        
        const fullSessionData = {
            ...sessionData,
            exercises: [{
                pose_id: this.currentPose,
                average_score: sessionData.average_score,
                common_errors: sessionData.common_errors
            }]
        };
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.backendBaseUrl}/training/history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fullSessionData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const result = await response.json();
                this.toast.show(`训练记录已保存！评分: ${sessionData.average_score}分`, 'success');
                
                const saveBtn = document.getElementById('saveSessionBtn');
                if (saveBtn) {
                    saveBtn.disabled = true;
                }
                
                this.currentSession = null;
                
                setTimeout(() => this.refreshStats(), 500);
            } else {
                throw new Error(`服务器返回错误: ${response.status}`);
            }
        } catch (error) {
            console.error('保存训练记录失败:', error);
            this.toast.show(`保存失败: ${error.message}`, 'error');
        }
    }
    
    updateSessionDuration() {
        const durationEl = document.getElementById('sessionDuration');
        if (!durationEl || !this.sessionStartTime) return;
        
        const elapsed = Math.round((Date.now() - this.sessionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        durationEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    async initCamera() {
        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.video.srcObject = stream;
        
        return new Promise((resolve) => {
            this.video.onloadedmetadata = () => {
                this.video.play();
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.preprocessor.setSize(this.video.videoWidth, this.video.videoHeight);
                const statusEl = document.getElementById('cameraStatus');
                if (statusEl) {
                    statusEl.classList.remove('inactive');
                    statusEl.classList.add('active');
                }
                resolve();
            };
        });
    }
    
    async loadModel() {
        const detectorConfig = {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableSmoothing: true,
            minPoseScore: this.minPoseScore
        };
        
        this.model = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            detectorConfig
        );
        
        const statusEl = document.getElementById('modelStatus');
        if (statusEl) {
            statusEl.classList.remove('inactive');
            statusEl.classList.add('active');
        }
    }
    
    async detectPose() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        if (this.lastFrameTime > 0) {
            this.fps = Math.round(1000 / (currentTime - this.lastFrameTime));
        }
        this.lastFrameTime = currentTime;
        
        this.updateSessionDuration();
        
        try {
            const processed = this.preprocessor.process(this.video, true);
            
            const poses = await this.model.estimatePoses(processed.canvas);
            
            if (poses.length > 0) {
                const pose = poses[0];
                
                const poseQuality = this.evaluatePoseQuality(pose);
                
                if (poseQuality.isAcceptable) {
                    this.consecutiveLowQualityFrames = 0;
                    this.lastValidPose = pose;
                    await this.processPose(pose);
                } else {
                    this.consecutiveLowQualityFrames++;
                    
                    if (this.consecutiveLowQualityFrames >= this.maxConsecutiveLowQuality) {
                        this.showLowQualityWarning(poseQuality.reason);
                    }
                    
                    if (this.lastValidPose && this.consecutiveLowQualityFrames < 3) {
                        await this.processPose(this.lastValidPose);
                    }
                }
            }
            
            this.updateStats();
            
        } catch (error) {
            console.error('姿态检测错误:', error);
        }
        
        this.animationId = requestAnimationFrame(() => this.detectPose());
    }
    
    evaluatePoseQuality(pose) {
        if (!pose || !pose.keypoints) {
            return { isAcceptable: false, reason: '未检测到人体姿态' };
        }
        
        if (pose.score !== undefined && pose.score < this.minPoseScore) {
            return { isAcceptable: false, reason: `整体置信度过低: ${(pose.score * 100).toFixed(1)}%` };
        }
        
        const keyKeypoints = [
            'left_shoulder', 'right_shoulder',
            'left_hip', 'right_hip',
            'left_knee', 'right_knee'
        ];
        
        let totalScore = 0;
        let validCount = 0;
        let lowScoreCount = 0;
        
        for (const kp of pose.keypoints) {
            if (keyKeypoints.includes(kp.name)) {
                totalScore += kp.score;
                validCount++;
                
                if (kp.score < this.minKeypointScore) {
                    lowScoreCount++;
                }
            }
        }
        
        if (validCount === 0) {
            return { isAcceptable: false, reason: '未检测到关键关节点' };
        }
        
        const avgScore = totalScore / validCount;
        
        if (avgScore < this.minAverageKeypointScore) {
            return { 
                isAcceptable: false, 
                reason: `关键节点置信度过低: ${(avgScore * 100).toFixed(1)}%，请调整光线或位置` 
            };
        }
        
        if (lowScoreCount > 2) {
            return { 
                isAcceptable: false, 
                reason: `多个关键节点检测质量差，请确保全身在画面中` 
            };
        }
        
        return { 
            isAcceptable: true, 
            avgScore: avgScore,
            reason: '质量良好'
        };
    }
    
    showLowQualityWarning(reason) {
        const scoreValue = document.getElementById('scoreValue');
        const scoreStatus = document.getElementById('scoreStatus');
        
        if (scoreValue) scoreValue.textContent = '--';
        if (scoreStatus) {
            scoreStatus.textContent = reason;
            scoreStatus.style.color = '#ffc107';
        }
    }
    
    async processPose(pose) {
        this.frameCount++;
        
        if (this.currentSession) {
            this.currentSession.incrementFrame();
        }
        
        const keypoints = this.formatKeypoints(pose.keypoints);
        const angles = this.calculateAllAngles(keypoints);
        
        this.drawPose(keypoints, angles);
        
        const analysisStartTime = performance.now();
        const analysisResult = await this.analyzePose(keypoints, angles);
        const analysisLatency = Math.round(performance.now() - analysisStartTime);
        
        if (this.currentSession) {
            if (analysisResult.overall_score > 0) {
                this.currentSession.addScore(analysisResult.overall_score);
            }
            if (analysisResult.detected_errors && analysisResult.detected_errors.length > 0) {
                analysisResult.detected_errors.forEach(err => {
                    this.currentSession.addError(err);
                });
            }
        }
        
        this.updateUI(analysisResult, angles, analysisLatency);
    }
    
    formatKeypoints(keypoints) {
        const formatted = [];
        for (const [name, index] of Object.entries(this.keypointIndices)) {
            const kp = keypoints[index];
            formatted.push({
                name: name,
                x: kp.x,
                y: kp.y,
                score: kp.score
            });
        }
        return formatted;
    }
    
    calculateAllAngles(keypoints) {
        const angles = {};
        const kpMap = {};
        
        for (const kp of keypoints) {
            kpMap[kp.name] = { x: kp.x, y: kp.y, score: kp.score };
        }
        
        for (const [angleName, points] of Object.entries(this.angleDefinitions)) {
            const [p1Name, vertexName, p2Name] = points;
            
            if (kpMap[p1Name] && kpMap[vertexName] && kpMap[p2Name]) {
                const p1 = kpMap[p1Name];
                const vertex = kpMap[vertexName];
                const p2 = kpMap[p2Name];
                
                if (p1.score > this.minKeypointScore && 
                    vertex.score > this.minKeypointScore && 
                    p2.score > this.minKeypointScore) {
                    angles[angleName] = this.calculateAngle(p1, vertex, p2);
                }
            }
        }
        
        return angles;
    }
    
    calculateAngle(p1, vertex, p2) {
        const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
        const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
        
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        
        if (mag1 === 0 || mag2 === 0) return 0;
        
        const cosAngle = dot / (mag1 * mag2);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
        
        return Math.round(angle * (180 / Math.PI));
    }
    
    drawPose(keypoints, angles) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const kpMap = {};
        for (const kp of keypoints) {
            kpMap[kp.name] = kp;
        }
        
        for (const [p1Name, p2Name] of this.connections) {
            const p1 = kpMap[p1Name];
            const p2 = kpMap[p2Name];
            
            if (p1 && p2 && p1.score > this.minKeypointScore && p2.score > this.minKeypointScore) {
                this.drawLine(p1, p2, '#00ff88', 4);
            }
        }
        
        for (const kp of keypoints) {
            if (kp.score > this.minKeypointScore) {
                const color = this.getKeypointColor(kp.name, angles);
                this.drawPoint(kp, color, 8);
            }
        }
    }
    
    getKeypointColor(name, angles) {
        const angleMap = {
            'left_elbow': 'left_elbow',
            'right_elbow': 'right_elbow',
            'left_shoulder': 'left_shoulder',
            'right_shoulder': 'right_shoulder',
            'left_hip': 'left_hip',
            'right_hip': 'right_hip',
            'left_knee': 'left_knee',
            'right_knee': 'right_knee'
        };
        
        const angleName = angleMap[name];
        if (angleName && angles[angleName]) {
            return '#00ff88';
        }
        
        return '#ffffff';
    }
    
    drawLine(p1, p2, color, width) {
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }
    
    drawPoint(point, color, radius) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, radius + 3, 0, 2 * Math.PI);
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    shouldUseBackend() {
        if (!this.backendConnected) return false;
        
        if (this.backendCooldown) {
            if (Date.now() >= this.cooldownEndTime) {
                this.backendCooldown = false;
                this.backendFailures = 0;
                return true;
            }
            return false;
        }
        
        if (this.backendFailures >= this.maxBackendFailures) {
            this.backendCooldown = true;
            this.cooldownEndTime = Date.now() + 30000;
            console.warn('后端连续失败，进入30秒冷却期，将使用本地分析');
            return false;
        }
        
        return true;
    }
    
    async analyzePose(keypoints, angles) {
        if (this.shouldUseBackend()) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                const response = await fetch(`${this.backendBaseUrl}/analyze/${this.currentPose}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        keypoints: keypoints,
                        angles: angles,
                        timestamp: Date.now()
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    this.backendFailures = 0;
                    const result = await response.json();
                    
                    if (result.detected_errors && result.detected_errors.length > 0) {
                        this.errorCount++;
                    }
                    if (result.overall_score > 0) {
                        this.scores.push(result.overall_score);
                    }
                    
                    return result;
                } else {
                    this.backendFailures++;
                    console.warn(`后端返回错误状态: ${response.status}`);
                }
            } catch (error) {
                this.backendFailures++;
                if (error.name === 'AbortError') {
                    console.warn('后端请求超时，使用本地分析');
                } else {
                    console.warn('后端分析失败，使用本地分析:', error.message);
                }
            }
        }
        
        return this.localAnalyze(keypoints, angles);
    }
    
    localAnalyze(keypoints, angles) {
        const standards = this.getLocalStandards();
        const standard = standards[this.currentPose];
        
        const detectedErrors = [];
        const angleComparisons = {};
        
        for (const [angleName, angleValue] of Object.entries(angles)) {
            if (standard.key_angles[angleName]) {
                const s = standard.key_angles[angleName];
                const isAcceptable = angleValue >= s.min && angleValue <= s.max;
                angleComparisons[angleName] = {
                    current: angleValue,
                    standard_min: s.min,
                    standard_max: s.max,
                    ideal: s.ideal,
                    is_acceptable: isAcceptable,
                    deviation: angleValue - s.ideal
                };
            }
        }
        
        const errors = this.detectLocalErrors(keypoints, angles, standard);
        detectedErrors.push(...errors);
        
        const overallScore = this.calculateLocalScore(angleComparisons, detectedErrors);
        
        if (detectedErrors.length > 0) {
            this.errorCount++;
        }
        if (overallScore > 0) {
            this.scores.push(overallScore);
        }
        
        return {
            pose_id: this.currentPose,
            pose_name: standard.name,
            angle_comparisons: angleComparisons,
            detected_errors: detectedErrors,
            overall_score: overallScore
        };
    }
    
    getLocalStandards() {
        return {
            'squat': {
                name: '深蹲',
                key_angles: {
                    'left_knee': { min: 90, max: 140, ideal: 110 },
                    'right_knee': { min: 90, max: 140, ideal: 110 },
                    'left_hip': { min: 90, max: 150, ideal: 120 },
                    'right_hip': { min: 90, max: 150, ideal: 120 }
                },
                common_errors: [
                    {
                        id: 'knee_valgus',
                        name: '膝盖内扣',
                        description: '膝盖向中线靠拢',
                        check: (kps, angs) => this.checkKneeValgus(kps),
                        correction: '保持膝盖与脚尖方向一致，向外打开'
                    },
                    {
                        id: 'depth_insufficient',
                        name: '下蹲深度不足',
                        description: '膝盖弯曲角度不够',
                        check: (kps, angs) => this.checkDepthInsufficient(angs),
                        correction: '继续下蹲，直到大腿与地面平行'
                    }
                ]
            },
            'pushup': {
                name: '俯卧撑',
                key_angles: {
                    'left_elbow': { min: 90, max: 160, ideal: 120 },
                    'right_elbow': { min: 90, max: 160, ideal: 120 },
                    'left_shoulder': { min: 80, max: 120, ideal: 100 },
                    'right_shoulder': { min: 80, max: 120, ideal: 100 }
                },
                common_errors: [
                    {
                        id: 'elbow_flaring',
                        name: '肘部外展',
                        description: '肘部向外打开角度过大',
                        check: (kps, angs) => this.checkElbowFlaring(angs),
                        correction: '肘部贴近身体，约45度角'
                    }
                ]
            },
            'plank': {
                name: '平板支撑',
                key_angles: {
                    'left_shoulder': { min: 80, max: 100, ideal: 90 },
                    'right_shoulder': { min: 80, max: 100, ideal: 90 },
                    'left_hip': { min: 160, max: 180, ideal: 180 },
                    'right_hip': { min: 160, max: 180, ideal: 180 }
                },
                common_errors: [
                    {
                        id: 'hip_sagging',
                        name: '臀部下垂',
                        description: '臀部低于身体直线',
                        check: (kps, angs) => this.checkHipSagging(kps),
                        correction: '收紧核心，保持身体成一条直线'
                    }
                ]
            }
        };
    }
    
    detectLocalErrors(keypoints, angles, standard) {
        const errors = [];
        const kpMap = {};
        
        for (const kp of keypoints) {
            kpMap[kp.name] = { x: kp.x, y: kp.y, score: kp.score };
        }
        
        for (const error of standard.common_errors) {
            if (error.check(keypoints, angles)) {
                errors.push({
                    id: error.id,
                    name: error.name,
                    description: error.description,
                    correction: error.correction
                });
            }
        }
        
        return errors;
    }
    
    checkKneeValgus(keypoints) {
        const kpMap = {};
        for (const kp of keypoints) {
            kpMap[kp.name] = kp;
        }
        
        const leftKnee = kpMap['left_knee'];
        const rightKnee = kpMap['right_knee'];
        const leftHip = kpMap['left_hip'];
        const rightHip = kpMap['right_hip'];
        
        if (!leftKnee || !rightKnee || !leftHip || !rightHip) return false;
        if (leftKnee.score < this.minKeypointScore || rightKnee.score < this.minKeypointScore || 
            leftHip.score < this.minKeypointScore || rightHip.score < this.minKeypointScore) return false;
        
        const hipWidth = Math.abs(rightHip.x - leftHip.x);
        const kneeDistance = Math.abs(rightKnee.x - leftKnee.x);
        
        return kneeDistance < hipWidth * 0.7;
    }
    
    checkDepthInsufficient(angles) {
        const leftKnee = angles['left_knee'] || 180;
        const rightKnee = angles['right_knee'] || 180;
        
        return leftKnee > 140 && rightKnee > 140;
    }
    
    checkElbowFlaring(angles) {
        const leftElbow = angles['left_elbow'] || 90;
        const rightElbow = angles['right_elbow'] || 90;
        
        return leftElbow > 160 || rightElbow > 160;
    }
    
    checkHipSagging(keypoints) {
        const kpMap = {};
        for (const kp of keypoints) {
            kpMap[kp.name] = kp;
        }
        
        const leftShoulder = kpMap['left_shoulder'];
        const rightShoulder = kpMap['right_shoulder'];
        const leftHip = kpMap['left_hip'];
        const rightHip = kpMap['right_hip'];
        
        if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return false;
        if (leftShoulder.score < this.minKeypointScore || rightShoulder.score < this.minKeypointScore || 
            leftHip.score < this.minKeypointScore || rightHip.score < this.minKeypointScore) return false;
        
        const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const hipY = (leftHip.y + rightHip.y) / 2;
        
        return hipY > shoulderY + 50;
    }
    
    calculateLocalScore(angleComparisons, detectedErrors) {
        if (!angleComparisons || Object.keys(angleComparisons).length === 0) {
            return 0;
        }
        
        let totalDeviation = 0;
        let validAngles = 0;
        
        for (const [angleName, comparison] of Object.entries(angleComparisons)) {
            if (comparison.is_acceptable) {
                const idealRange = comparison.standard_max - comparison.standard_min;
                if (idealRange > 0) {
                    const deviationRatio = Math.abs(comparison.deviation) / idealRange;
                    totalDeviation += deviationRatio;
                    validAngles++;
                }
            }
        }
        
        if (validAngles === 0) {
            return 0;
        }
        
        const angleScore = Math.max(0, 100 - (totalDeviation / validAngles) * 100);
        const errorPenalty = detectedErrors.length * 15;
        
        return Math.max(0, Math.min(100, angleScore - errorPenalty));
    }
    
    updateUI(analysisResult, angles, latency) {
        const fpsDisplay = document.getElementById('fpsDisplay');
        const latencyDisplay = document.getElementById('latencyDisplay');
        
        if (fpsDisplay) fpsDisplay.textContent = this.fps;
        if (latencyDisplay) latencyDisplay.textContent = latency;
        
        const score = analysisResult.overall_score || 0;
        const scoreValue = document.getElementById('scoreValue');
        if (scoreValue) scoreValue.textContent = Math.round(score);
        
        let scoreStatus = '良好';
        let scoreColor = '#28a745';
        
        if (score >= 80) {
            scoreStatus = '优秀';
            scoreColor = '#28a745';
        } else if (score >= 60) {
            scoreStatus = '良好';
            scoreColor = '#ffc107';
        } else if (score > 0) {
            scoreStatus = '需要改进';
            scoreColor = '#dc3545';
        } else {
            scoreStatus = '检测中';
            scoreColor = '#666';
        }
        
        const scoreStatusEl = document.getElementById('scoreStatus');
        if (scoreStatusEl) {
            scoreStatusEl.textContent = scoreStatus;
            scoreStatusEl.style.color = scoreColor;
        }
        
        this.updateAnglesUI(angles, analysisResult.angle_comparisons);
        this.updateErrorsUI(analysisResult.detected_errors);
        this.drawErrorHints(analysisResult.detected_errors);
    }
    
    updateAnglesUI(angles, comparisons) {
        const anglesList = document.getElementById('anglesList');
        if (!anglesList) return;
        
        if (!angles || Object.keys(angles).length === 0) {
            anglesList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">未检测到有效角度</p>';
            return;
        }
        
        let html = '';
        
        const angleNames = {
            'left_elbow': '左肘',
            'right_elbow': '右肘',
            'left_shoulder': '左肩',
            'right_shoulder': '右肩',
            'left_hip': '左髋',
            'right_hip': '右髋',
            'left_knee': '左膝',
            'right_knee': '右膝'
        };
        
        for (const [angleName, angleValue] of Object.entries(angles)) {
            const comparison = comparisons ? comparisons[angleName] : null;
            const displayName = angleNames[angleName] || angleName;
            
            let valueClass = 'angle-value';
            let statusText = '';
            
            if (comparison) {
                if (!comparison.is_acceptable) {
                    valueClass += ' error';
                    statusText = ' (偏离标准)';
                } else if (Math.abs(comparison.deviation) > 10) {
                    valueClass += ' warning';
                    statusText = ' (接近边界)';
                }
            }
            
            html += `
                <div class="angle-item">
                    <span class="angle-name">${displayName}</span>
                    <span class="${valueClass}">${angleValue}°${statusText}</span>
                </div>
            `;
        }
        
        anglesList.innerHTML = html;
    }
    
    updateErrorsUI(errors) {
        const errorsList = document.getElementById('errorsList');
        if (!errorsList) return;
        
        if (!errors || errors.length === 0) {
            errorsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">暂无问题，动作标准！</p>';
            return;
        }
        
        let html = '';
        for (const error of errors) {
            html += `
                <div class="error-item">
                    <div class="error-name">⚠️ ${error.name}</div>
                    <div>${error.description}</div>
                    <div class="error-correction">💡 ${error.correction}</div>
                </div>
            `;
        }
        
        errorsList.innerHTML = html;
    }
    
    drawErrorHints(errors) {
        if (!errors || errors.length === 0) return;
        
        this.ctx.save();
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        
        let y = 40;
        
        for (const error of errors) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, y - 25, this.ctx.measureText(error.name).width + 30, 35);
            
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillText(`⚠️ ${error.name}`, 20, y);
            
            y += 45;
        }
        
        this.ctx.restore();
    }
    
    updateStats() {
        const frameCount = document.getElementById('frameCount');
        const errorCount = document.getElementById('errorCount');
        
        if (frameCount) frameCount.textContent = this.frameCount;
        if (errorCount) errorCount.textContent = this.errorCount;
        
        if (this.scores.length > 0) {
            const avgScore = this.scores.reduce((a, b) => a + b, 0) / this.scores.length;
            const avgScoreEl = document.getElementById('avgScore');
            if (avgScoreEl) avgScoreEl.textContent = Math.round(avgScore);
        }
    }
    
    resetStats() {
        this.frameCount = 0;
        this.errorCount = 0;
        this.scores = [];
        this.updateStats();
    }
    
    updateUIState(isRunning) {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const poseSelect = document.getElementById('poseSelect');
        const saveSessionBtn = document.getElementById('saveSessionBtn');
        
        if (startBtn) startBtn.disabled = isRunning;
        if (stopBtn) stopBtn.disabled = !isRunning;
        if (poseSelect) poseSelect.disabled = isRunning;
        
        if (saveSessionBtn) {
            saveSessionBtn.disabled = true;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FitnessPoseDetection();
});
