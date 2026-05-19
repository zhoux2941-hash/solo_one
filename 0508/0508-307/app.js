class HeartRateMonitor {
    constructor() {
        this.device = null;
        this.server = null;
        this.hrCharacteristic = null;
        this.isConnected = false;
        this.currentHR = 0;
        this.hrHistory = [];
        this.rrIntervals = [];
        this.rmssd = 0;
        
        this.isWorkoutActive = false;
        this.workoutStartTime = null;
        this.workoutEndTime = null;
        this.workoutHRData = [];
        this.workoutDuration = 0;
        this.avgHR = 0;
        this.maxHR = 0;
        this.calories = 0;
        
        this.maxHRUser = 190;
        this.voiceEnabled = true;
        this.voiceInterval = 60;
        this.lastVoiceTime = 0;
        
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.lastDeviceId = null;
        this.lastRRUpdate = null;
        this.lastRMSSD = 0;
        
        this.isRecoveryMode = false;
        this.recoveryStartTime = null;
        this.recoveryStartHR = 0;
        this.restingHR = 60;
        this.recoveryHRHistory = [];
        this.recoveryMonitorTimer = null;
        
        this.chart = null;
        this.db = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initChart();
        this.initDB();
        this.loadRecords();
    }

    bindEvents() {
        document.getElementById('scanBtn').addEventListener('click', () => this.scanDevices());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        document.getElementById('startWorkoutBtn').addEventListener('click', () => this.startWorkout());
        document.getElementById('endWorkoutBtn').addEventListener('click', () => this.endWorkout());
        document.getElementById('loadRecordsBtn').addEventListener('click', () => this.loadRecords());
        document.getElementById('voiceEnabled').addEventListener('change', (e) => {
            this.voiceEnabled = e.target.checked;
        });
        document.getElementById('voiceInterval').addEventListener('change', (e) => {
            this.voiceInterval = parseInt(e.target.value);
        });
    }

    async scanDevices() {
        try {
            const options = {
                filters: [
                    { services: ['heart_rate'] },
                    { namePrefix: 'Polar' },
                    { namePrefix: 'H10' }
                ],
                optionalServices: ['battery_service', 'device_information']
            };

            this.device = await navigator.bluetooth.requestDevice(options);
            
            this.device.addEventListener('gattserverdisconnected', () => {
                this.onDisconnected();
            });

            await this.connect();
        } catch (error) {
            console.error('扫描设备失败:', error);
            this.updateStatus('扫描失败: ' + error.message, false);
        }
    }

    async connect() {
        try {
            this.updateStatus('正在连接...', false);
            
            this.server = await this.device.gatt.connect();
            
            const service = await this.server.getPrimaryService('heart_rate');
            this.hrCharacteristic = await service.getCharacteristic('heart_rate_measurement');
            
            await this.hrCharacteristic.startNotifications();
            this.hrCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
                this.parseHRData(event.target.value);
            });

            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.lastDeviceId = this.device.id;
            this.rrIntervals = [];
            
            this.updateStatus('已连接: ' + this.device.name, true);
            this.updateDeviceInfo();
            
            document.getElementById('scanBtn').disabled = true;
            document.getElementById('disconnectBtn').disabled = false;
            document.getElementById('startWorkoutBtn').disabled = false;

        } catch (error) {
            console.error('连接失败:', error);
            this.updateStatus('连接失败', false);
        }
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
        this.isConnected = false;
        this.device = null;
        this.server = null;
        this.hrCharacteristic = null;
        
        this.updateStatus('已断开', false);
        document.getElementById('scanBtn').disabled = false;
        document.getElementById('disconnectBtn').disabled = true;
        document.getElementById('startWorkoutBtn').disabled = true;
        document.getElementById('endWorkoutBtn').disabled = true;
        
        if (this.isWorkoutActive) {
            this.endWorkout();
        }
        
        this.stopRecoveryMonitoring();
    }

    onDisconnected() {
        this.isConnected = false;
        this.updateStatus('连接断开', false);
        document.getElementById('scanBtn').disabled = false;
        document.getElementById('disconnectBtn').disabled = true;
        
        this.attemptReconnect();
    }

    async attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.updateStatus('重连失败，请手动连接', false);
            this.reconnectAttempts = 0;
            return;
        }

        this.reconnectAttempts++;
        this.updateStatus(`正在重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`, false);

        setTimeout(async () => {
            if (this.device) {
                try {
                    await this.connect();
                } catch (error) {
                    this.attemptReconnect();
                }
            }
        }, this.reconnectInterval);
    }

    parseHRData(value) {
        const flags = value.getUint8(0);
        const hrFormat = flags & 0x01;
        const sensorContactStatus = (flags >> 1) & 0x03;
        const energyExpendedStatus = (flags >> 3) & 0x01;
        const rrIntervalStatus = (flags >> 4) & 0x01;

        let offset = 1;
        let hrValue;

        if (hrFormat === 1) {
            hrValue = value.getUint16(offset, true);
            offset += 2;
        } else {
            hrValue = value.getUint8(offset);
            offset += 1;
        }

        if (energyExpendedStatus === 1) {
            offset += 2;
        }

        let hasNewRR = false;
        let rrCount = 0;
        
        if (rrIntervalStatus === 1) {
            while (offset + 1 < value.byteLength) {
                const rawRR = value.getUint16(offset, true);
                const rrInterval = rawRR / 1024 * 1000;
                
                if (rrInterval > 300 && rrInterval < 2000) {
                    this.rrIntervals.push(rrInterval);
                    hasNewRR = true;
                    rrCount++;
                    
                    if (this.rrIntervals.length > 120) {
                        this.rrIntervals.shift();
                    }
                }
                offset += 2;
            }
        }

        if (hasNewRR) {
            this.lastRRUpdate = Date.now();
        }

        if (this.rrIntervals.length >= 20) {
            this.calculateRMSSD();
        }

        this.currentHR = hrValue;
        this.updateHRDisplay();
        this.addHRToHistory(hrValue);
        
        if (this.isWorkoutActive) {
            this.updateWorkoutStats(hrValue);
        }
    }

    calculateRMSSD() {
        if (this.rrIntervals.length < 20) {
            this.rmssd = 0;
            document.getElementById('hrvValue').textContent = '--';
            return;
        }

        const recentRR = this.rrIntervals.slice(-50);
        
        const meanRR = recentRR.reduce((a, b) => a + b, 0) / recentRR.length;
        const filteredRR = recentRR.filter(rr => rr > meanRR * 0.7 && rr < meanRR * 1.3);

        if (filteredRR.length < 15) {
            document.getElementById('hrvValue').textContent = '--';
            return;
        }

        let sumSquares = 0;
        let validPairs = 0;
        
        for (let i = 1; i < filteredRR.length; i++) {
            const diff = filteredRR[i] - filteredRR[i - 1];
            if (Math.abs(diff) < 400) {
                sumSquares += diff * diff;
                validPairs++;
            }
        }

        if (validPairs > 0) {
            const meanSquares = sumSquares / validPairs;
            this.rmssd = Math.sqrt(meanSquares);
            
            const smoothedRMSSD = this.rmssd * 0.3 + (this.lastRMSSD || this.rmssd) * 0.7;
            this.lastRMSSD = smoothedRMSSD;
            
            document.getElementById('hrvValue').textContent = Math.round(smoothedRMSSD);
        } else {
            document.getElementById('hrvValue').textContent = '--';
        }
    }

    updateHRDisplay() {
        document.getElementById('hrValue').textContent = this.currentHR;
        const zone = this.getHRZone(this.currentHR);
        document.getElementById('hrZone').textContent = zone.name;
        document.getElementById('hrZone').style.background = zone.color;
        
        document.querySelectorAll('.zone-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.zone === zone.key) {
                item.classList.add('active');
            }
        });
    }

    getHRZone(hr) {
        const percentage = (hr / this.maxHRUser) * 100;
        
        if (percentage < 50) {
            return { key: 'warmup', name: '静息', color: 'rgba(116, 185, 255, 0.8)' };
        } else if (percentage < 60) {
            return { key: 'warmup', name: '热身', color: 'rgba(116, 185, 255, 0.8)' };
        } else if (percentage < 70) {
            return { key: 'fatburn', name: '燃脂', color: 'rgba(85, 239, 196, 0.8)' };
        } else if (percentage < 80) {
            return { key: 'cardio', name: '有氧', color: 'rgba(253, 203, 110, 0.8)' };
        } else if (percentage < 90) {
            return { key: 'anaerobic', name: '无氧', color: 'rgba(253, 121, 168, 0.8)' };
        } else {
            return { key: 'max', name: '极限', color: 'rgba(255, 118, 117, 0.8)' };
        }
    }

    addHRToHistory(hr) {
        const now = new Date();
        this.hrHistory.push({
            time: now,
            value: hr
        });

        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        this.hrHistory = this.hrHistory.filter(item => item.time >= thirtyMinutesAgo);

        this.updateChart();
    }

    updateStatus(text, connected) {
        document.getElementById('statusText').textContent = text;
        const dot = document.querySelector('.status-dot');
        dot.className = connected ? 'status-dot connected' : 'status-dot disconnected';
    }

    updateDeviceInfo() {
        const info = document.getElementById('deviceInfo');
        info.innerHTML = `
            <p><strong>设备名称:</strong> ${this.device.name}</p>
            <p><strong>设备ID:</strong> ${this.device.id}</p>
        `;
    }

    startWorkout() {
        this.isWorkoutActive = true;
        this.workoutStartTime = new Date();
        this.workoutHRData = [];
        this.maxHR = this.currentHR;
        this.lastVoiceTime = Date.now();
        
        this.stopRecoveryMonitoring();
        
        document.getElementById('startWorkoutBtn').disabled = true;
        document.getElementById('endWorkoutBtn').disabled = false;
        
        this.workoutTimer = setInterval(() => {
            this.updateWorkoutDuration();
        }, 1000);

        this.speak('运动开始');
    }

    endWorkout() {
        if (!this.isWorkoutActive) return;
        
        this.isWorkoutActive = false;
        this.workoutEndTime = new Date();
        clearInterval(this.workoutTimer);
        
        document.getElementById('startWorkoutBtn').disabled = false;
        document.getElementById('endWorkoutBtn').disabled = true;
        
        this.saveWorkoutRecord();
        this.startRecoveryMonitoring();
        this.speak(`运动结束。平均心率${Math.round(this.avgHR)}，消耗${Math.round(this.calories)}卡路里`);
    }

    startRecoveryMonitoring() {
        this.isRecoveryMode = true;
        this.recoveryStartTime = new Date();
        this.recoveryStartHR = this.currentHR;
        this.recoveryHRHistory = [];
        
        document.getElementById('recoveryCard').style.display = 'block';
        document.getElementById('recoveryTip').textContent = '正在监测心率恢复，请保持安静休息...';
        
        this.recoveryMonitorTimer = setInterval(() => {
            this.updateRecoveryCalculation();
        }, 5000);
    }

    stopRecoveryMonitoring() {
        this.isRecoveryMode = false;
        if (this.recoveryMonitorTimer) {
            clearInterval(this.recoveryMonitorTimer);
            this.recoveryMonitorTimer = null;
        }
        document.getElementById('recoveryCard').style.display = 'none';
    }

    updateRecoveryCalculation() {
        if (!this.isRecoveryMode || this.currentHR === 0) return;
        
        this.recoveryHRHistory.push({
            time: new Date(),
            hr: this.currentHR
        });
        
        if (this.recoveryHRHistory.length > 36) {
            this.recoveryHRHistory.shift();
        }
        
        if (this.recoveryHRHistory.length >= 6) {
            this.calculateRecoveryTime();
        }
    }

    calculateRecoveryTime() {
        const elapsedMinutes = (new Date() - this.recoveryStartTime) / 1000 / 60;
        const hrDrop = this.recoveryStartHR - this.currentHR;
        
        if (elapsedMinutes < 0.5 || hrDrop <= 0) {
            return;
        }
        
        const dropPerMinute = hrDrop / elapsedMinutes;
        const remainingHRToDrop = Math.max(0, this.currentHR - this.restingHR);
        
        let estimatedMinutesToRest = 0;
        if (dropPerMinute > 0) {
            estimatedMinutesToRest = remainingHRToDrop / dropPerMinute;
        }
        
        const intensityFactor = this.calculateIntensityFactor();
        estimatedMinutesToRest *= intensityFactor;
        estimatedMinutesToRest = Math.min(estimatedMinutesToRest, 180);
        
        const totalRecoveryMinutes = elapsedMinutes + estimatedMinutesToRest;
        
        const progress = Math.min(100, (elapsedMinutes / totalRecoveryMinutes) * 100);
        
        this.updateRecoveryUI(dropPerMinute, estimatedMinutesToRest, progress);
        this.updateRecoveryTip(dropPerMinute, estimatedMinutesToRest);
    }

    calculateIntensityFactor() {
        const avgHrPercent = (this.avgHR / this.maxHRUser) * 100;
        const maxHrPercent = (this.maxHR / this.maxHRUser) * 100;
        const durationHours = this.workoutDuration / 3600;
        
        let factor = 1.0;
        
        if (maxHrPercent > 90) {
            factor *= 1.5;
        } else if (maxHrPercent > 80) {
            factor *= 1.3;
        } else if (maxHrPercent > 70) {
            factor *= 1.1;
        }
        
        if (durationHours > 1.5) {
            factor *= 1.4;
        } else if (durationHours > 1) {
            factor *= 1.2;
        }
        
        if (avgHrPercent > 80) {
            factor *= 1.3;
        } else if (avgHrPercent > 70) {
            factor *= 1.1;
        }
        
        return factor;
    }

    updateRecoveryUI(dropRate, estimatedMinutes, progress) {
        document.getElementById('recoveryRate').textContent = `${dropRate.toFixed(1)} BPM/分钟`;
        
        if (estimatedMinutes < 1) {
            document.getElementById('recoveryTime').textContent = '< 1分钟';
        } else if (estimatedMinutes < 60) {
            document.getElementById('recoveryTime').textContent = `${Math.round(estimatedMinutes)} 分钟`;
        } else {
            const hours = Math.floor(estimatedMinutes / 60);
            const mins = Math.round(estimatedMinutes % 60);
            document.getElementById('recoveryTime').textContent = `${hours}小时${mins}分钟`;
        }
        
        document.getElementById('recoveryProgress').style.width = `${progress}%`;
        
        if (this.currentHR <= this.restingHR + 5) {
            document.getElementById('recoveryProgress').style.background = 'linear-gradient(90deg, #00b894, #55efc4)';
            document.getElementById('recoveryTip').textContent = '🎉 恭喜！您已基本恢复！';
        }
    }

    updateRecoveryTip(dropRate, estimatedMinutes) {
        if (this.currentHR <= this.restingHR + 5) return;
        
        let tip = '';
        if (dropRate > 5) {
            tip = '👍 恢复速度很棒！继续保持深呼吸。';
        } else if (dropRate > 2) {
            tip = '😊 恢复正常，建议继续休息。';
        } else if (dropRate > 0) {
            tip = '😌 恢复较慢，尝试做些拉伸和深呼吸。';
        } else {
            tip = '⚠️ 心率尚未开始下降，请放松身心。';
        }
        
        if (estimatedMinutes > 60) {
            tip += ' 本次运动强度较高，建议充分休息。';
        }
        
        document.getElementById('recoveryTip').textContent = tip;
    }

    updateWorkoutStats(hr) {
        this.workoutHRData.push(hr);
        
        if (hr > this.maxHR) {
            this.maxHR = hr;
        }
        
        const sum = this.workoutHRData.reduce((a, b) => a + b, 0);
        this.avgHR = sum / this.workoutHRData.length;
        
        const durationHours = this.workoutDuration / 3600;
        this.calories = this.estimateCalories(this.avgHR, durationHours);
        
        document.getElementById('avgHr').textContent = Math.round(this.avgHR);
        document.getElementById('maxHr').textContent = this.maxHR;
        document.getElementById('calories').textContent = Math.round(this.calories);
        
        this.checkVoiceAnnouncement();
    }

    updateWorkoutDuration() {
        const now = new Date();
        this.workoutDuration = Math.floor((now - this.workoutStartTime) / 1000);
        
        const hours = Math.floor(this.workoutDuration / 3600);
        const minutes = Math.floor((this.workoutDuration % 3600) / 60);
        const seconds = this.workoutDuration % 60;
        
        document.getElementById('duration').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    estimateCalories(avgHR, durationHours) {
        const weight = 70;
        const age = 30;
        const isMale = true;
        
        let calories;
        if (isMale) {
            calories = ((-55.0969 + (0.6309 * avgHR) + (0.1988 * weight) + (0.2017 * age)) / 4.184) * 60 * durationHours;
        } else {
            calories = ((-20.4022 + (0.4472 * avgHR) - (0.1263 * weight) + (0.074 * age)) / 4.184) * 60 * durationHours;
        }
        
        return Math.max(0, calories);
    }

    checkVoiceAnnouncement() {
        if (!this.voiceEnabled) return;
        
        const now = Date.now();
        if (now - this.lastVoiceTime >= this.voiceInterval * 1000) {
            const zone = this.getHRZone(this.currentHR);
            this.speak(`心率${this.currentHR}，${zone.name}区间`);
            this.lastVoiceTime = now;
        }
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 1;
            speechSynthesis.speak(utterance);
        }
    }

    initChart() {
        const ctx = document.getElementById('hrChart').getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, 'rgba(255, 107, 107, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '心率 (BPM)',
                    data: [],
                    borderColor: '#ff6b6b',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        ticks: {
                            color: '#ccc',
                            maxTicksLimit: 10
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        min: 40,
                        max: 220,
                        ticks: {
                            color: '#ccc',
                            stepSize: 20
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    updateChart() {
        const labels = this.hrHistory.map(item => {
            return item.time.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
        });
        
        const data = this.hrHistory.map(item => item.value);
        
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update('none');
    }

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('HeartRateDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('workouts')) {
                    const store = db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('startTime', 'startTime', { unique: false });
                }
            };
        });
    }

    saveWorkoutRecord() {
        const record = {
            startTime: this.workoutStartTime.toISOString(),
            endTime: this.workoutEndTime.toISOString(),
            duration: this.workoutDuration,
            avgHR: Math.round(this.avgHR),
            maxHR: this.maxHR,
            calories: Math.round(this.calories),
            hrData: [...this.workoutHRData]
        };

        const transaction = this.db.transaction(['workouts'], 'readwrite');
        const store = transaction.objectStore('workouts');
        store.add(record);

        transaction.oncomplete = () => {
            this.loadRecords();
        };
    }

    loadRecords() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['workouts'], 'readonly');
        const store = transaction.objectStore('workouts');
        const request = store.getAll();

        request.onsuccess = () => {
            const records = request.result.sort((a, b) => 
                new Date(b.startTime) - new Date(a.startTime)
            );
            this.renderRecords(records);
        };
    }

    renderRecords(records) {
        const container = document.getElementById('recordsList');
        
        if (records.length === 0) {
            container.innerHTML = '<p style="color: #ccc; text-align: center;">暂无运动记录</p>';
            return;
        }

        container.innerHTML = records.map(record => {
            const date = new Date(record.startTime).toLocaleString('zh-CN');
            const hours = Math.floor(record.duration / 3600);
            const minutes = Math.floor((record.duration % 3600) / 60);
            
            return `
                <div class="record-item">
                    <div class="record-date">${date}</div>
                    <div class="record-stats">
                        <span>时长: ${hours}h ${minutes}m</span>
                        <span>平均: ${record.avgHR} BPM</span>
                        <span>最大: ${record.maxHR} BPM</span>
                        <span>卡路里: ${record.calories} kcal</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.bluetooth) {
        alert('您的浏览器不支持WebBluetooth API，请使用Chrome或Edge浏览器');
        return;
    }
    
    new HeartRateMonitor();
});
