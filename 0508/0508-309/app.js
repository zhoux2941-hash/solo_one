class BikeRideApp {
    constructor() {
        this.isRiding = false;
        this.currentRideId = null;
        this.dataPoints = [];
        this.updateInterval = null;
        this.playbackInterval = null;
        this.isPlaying = false;
        this.playbackSpeed = 1;
        this.currentPlaybackIndex = 0;
        this.currentPlaybackRide = null;
        this.currentPlaybackData = null;

        this.init();
    }

    async init() {
        await rideStorage.init();
        this.bindEvents();
        rideMap.initMap();
        
        bikeBluetooth.addListener((data) => {
            this.handleBluetoothData(data);
        });

        rideMap.addPositionListener((position) => {
            this.handlePositionData(position);
        });
    }

    bindEvents() {
        document.getElementById('connectBtn').addEventListener('click', () => {
            document.getElementById('sensorModal').style.display = 'block';
        });

        document.getElementById('startRideBtn').addEventListener('click', () => {
            this.startRide();
        });

        document.getElementById('stopRideBtn').addEventListener('click', () => {
            this.stopRide();
        });

        document.getElementById('historyBtn').addEventListener('click', async () => {
            await this.showHistory();
            document.getElementById('historyModal').style.display = 'block';
        });

        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
                this.stopPlayback();
            });
        });

        document.querySelectorAll('.sensor-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const sensorType = btn.dataset.type;
                await this.connectSensor(sensorType);
            });
        });

        document.getElementById('playBtn').addEventListener('click', () => {
            this.startPlayback();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pausePlayback();
        });

        document.getElementById('speedUpBtn').addEventListener('click', (e) => {
            this.togglePlaybackSpeed(e.target);
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
                this.stopPlayback();
            }
        });
    }

    async connectSensor(type) {
        let success = false;
        
        switch (type) {
            case 'speed':
                success = await bikeBluetooth.connectSpeedSensor();
                break;
            case 'cadence':
                success = await bikeBluetooth.connectCadenceSensor();
                break;
            case 'power':
                success = await bikeBluetooth.connectPowerMeter();
                break;
            case 'heartRate':
                success = await bikeBluetooth.connectHeartRateMonitor();
                break;
        }

        if (success) {
            this.checkCanStartRide();
        }
    }

    checkCanStartRide() {
        const anySensorConnected = 
            bikeBluetooth.devices.speed || 
            bikeBluetooth.devices.cadence || 
            bikeBluetooth.devices.power;

        document.getElementById('startRideBtn').disabled = !anySensorConnected;
    }

    startRide() {
        this.isRiding = true;
        this.dataPoints = [];
        rideCalculator.startRide();
        rideMap.startTracking();

        document.getElementById('startRideBtn').disabled = true;
        document.getElementById('stopRideBtn').disabled = false;
        document.getElementById('connectBtn').disabled = true;

        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 200);

        this.recordInterval = setInterval(() => {
            this.recordDataPoint();
        }, 500);
    }

    stopRide() {
        this.isRiding = false;

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.recordInterval) {
            clearInterval(this.recordInterval);
            this.recordInterval = null;
        }

        rideMap.stopTracking();

        document.getElementById('startRideBtn').disabled = false;
        document.getElementById('stopRideBtn').disabled = true;
        document.getElementById('connectBtn').disabled = false;

        this.saveRide();
    }

    handleBluetoothData(data) {
        if (data.type === 'speed') {
            rideCalculator.addSpeed(data.value);
            rideMap.updateSpeed(data.value);
        } else if (data.type === 'cadence') {
            rideCalculator.addCadence(data.value);
        } else if (data.type === 'power') {
            rideCalculator.addPower(data.value);
        } else if (data.type === 'heartRate') {
            rideCalculator.addHeartRate(data.value);
        }

        this.updateRealTimeData();
    }

    handlePositionData(position) {
        if (this.isRiding) {
            rideCalculator.addPosition(position);
        }
    }

    updateRealTimeData() {
        const values = bikeBluetooth.getCurrentValues();
        
        document.getElementById('speedValue').textContent = values.speed.toFixed(1);
        document.getElementById('cadenceValue').textContent = values.cadence;
        document.getElementById('powerValue').textContent = values.power;
        document.getElementById('heartRateValue').textContent = values.heartRate || '--';
    }

    updateDisplay() {
        const stats = rideCalculator.getStats();

        document.getElementById('rideTime').textContent = stats.rideTime;
        document.getElementById('totalDistance').textContent = `${stats.distance} km`;
        document.getElementById('avgSpeed').textContent = `${stats.avgSpeed} km/h`;
        document.getElementById('maxSpeed').textContent = `${stats.maxSpeed} km/h`;
        document.getElementById('calories').textContent = `${stats.calories} kcal`;
        document.getElementById('avgCadence').textContent = `${stats.avgCadence} rpm`;
        document.getElementById('avgPower').textContent = `${stats.avgPower} W`;
        document.getElementById('avgHeartRate').textContent = `${stats.avgHeartRate || '--'} bpm`;
    }

    recordDataPoint() {
        const values = bikeBluetooth.getCurrentValues();
        const track = rideMap.getTrack();
        const currentPosition = track.length > 0 ? track[track.length - 1] : null;

        const dataPoint = {
            timestamp: Date.now(),
            speed: values.speed,
            cadence: values.cadence,
            power: values.power,
            heartRate: values.heartRate,
            position: currentPosition
        };

        this.dataPoints.push(dataPoint);
    }

    async saveRide() {
        const stats = rideCalculator.getStats();
        const track = rideMap.getTrack();

        const rideData = {
            startTime: rideCalculator.rideStartTime,
            endTime: Date.now(),
            duration: rideCalculator.getRideDuration(),
            distance: parseFloat(stats.distance),
            avgSpeed: parseFloat(stats.avgSpeed),
            maxSpeed: parseFloat(stats.maxSpeed),
            avgCadence: stats.avgCadence,
            avgPower: stats.avgPower,
            avgHeartRate: stats.avgHeartRate,
            calories: stats.calories,
            hasTrack: track.length > 0
        };

        try {
            const rideId = await rideStorage.saveRide(rideData);

            const pointsToSave = this.dataPoints.map(point => ({
                rideId: rideId,
                ...point
            }));

            if (pointsToSave.length > 0) {
                await rideStorage.saveDataPoints(pointsToSave);
            }

            alert('骑行数据已保存！');
        } catch (error) {
            console.error('保存数据失败:', error);
            alert('保存数据失败，请重试。');
        }
    }

    formatDaysAgo(timestamp) {
        const now = Date.now();
        const diffMs = now - timestamp;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return '今天';
        } else if (diffDays === 1) {
            return '昨天';
        } else {
            return `${diffDays}天前`;
        }
    }

    async showHistory() {
        const historyList = document.getElementById('historyList');
        const rides = await rideStorage.getRecentRides();

        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const dateStr = cutoffDate.toLocaleDateString('zh-CN');

        if (rides.length === 0) {
            historyList.innerHTML = `
                <div class="history-notice">
                    <span class="notice-icon">ℹ️</span>
                    <span class="notice-text">仅显示最近7天（${dateStr}之后）的骑行记录</span>
                </div>
                <div class="empty-history">暂无骑行记录</div>
            `;
            return;
        }

        const ridesHtml = rides.map(ride => {
            const date = new Date(ride.startTime).toLocaleString('zh-CN');
            const duration = rideCalculator.formatTime(ride.duration);
            const daysAgo = this.formatDaysAgo(ride.startTime);

            return `
                <div class="history-item" data-ride-id="${ride.id}">
                    <div class="history-date">📅 ${date} <span class="days-ago">(${daysAgo})</span></div>
                    <div class="history-stats">
                        <div class="history-stat">
                            <div class="history-stat-label">时长</div>
                            <div class="history-stat-value">${duration}</div>
                        </div>
                        <div class="history-stat">
                            <div class="history-stat-label">里程</div>
                            <div class="history-stat-value">${ride.distance.toFixed(2)} km</div>
                        </div>
                        <div class="history-stat">
                            <div class="history-stat-label">均速</div>
                            <div class="history-stat-value">${ride.avgSpeed.toFixed(1)} km/h</div>
                        </div>
                        <div class="history-stat">
                            <div class="history-stat-label">卡路里</div>
                            <div class="history-stat-value">${ride.calories} kcal</div>
                        </div>
                    </div>
                    <div class="history-actions">
                        <button class="btn btn-primary" onclick="app.playRide(${ride.id})">回放</button>
                        <button class="btn btn-danger" onclick="app.deleteRide(${ride.id})">删除</button>
                    </div>
                </div>
            `;
        }).join('');

        historyList.innerHTML = `
            <div class="history-notice">
                <span class="notice-icon">ℹ️</span>
                <span class="notice-text">仅显示最近7天（${dateStr}之后）的骑行记录</span>
            </div>
            ${ridesHtml}
        `;
    }

    async playRide(rideId) {
        document.getElementById('historyModal').style.display = 'none';
        
        const ride = await rideStorage.getRideById(rideId);
        
        if (!rideStorage.isRideValid(ride)) {
            alert('该骑行记录已超过7天，无法回放');
            return;
        }
        
        const dataPoints = await rideStorage.getDataPointsByRideId(rideId);

        this.currentPlaybackRide = ride;
        this.currentPlaybackData = dataPoints;
        this.currentPlaybackIndex = 0;

        document.getElementById('playbackModal').style.display = 'block';
        
        setTimeout(() => {
            const track = dataPoints.filter(p => p.position).map(p => p.position);
            rideMap.drawPlaybackTrack(track);
            rideMap.resizePlaybackMap();
        }, 100);

        this.updatePlaybackTimeDisplay();
    }

    startPlayback() {
        if (this.isPlaying) return;
        if (!this.currentPlaybackData || this.currentPlaybackData.length === 0) return;

        this.isPlaying = true;

        this.playbackInterval = setInterval(() => {
            if (this.currentPlaybackIndex >= this.currentPlaybackData.length) {
                this.stopPlayback();
                return;
            }

            const point = this.currentPlaybackData[this.currentPlaybackIndex];
            this.updatePlaybackDisplay(point);
            
            if (point.position) {
                rideMap.updatePlaybackPosition(point.position);
            }

            this.currentPlaybackIndex++;
            this.updatePlaybackTimeDisplay();
        }, 500 / this.playbackSpeed);
    }

    pausePlayback() {
        this.isPlaying = false;
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
    }

    stopPlayback() {
        this.pausePlayback();
        this.currentPlaybackIndex = 0;
    }

    togglePlaybackSpeed(btn) {
        if (this.playbackSpeed === 1) {
            this.playbackSpeed = 2;
            btn.textContent = '1x';
        } else {
            this.playbackSpeed = 1;
            btn.textContent = '2x';
        }

        if (this.isPlaying) {
            this.pausePlayback();
            this.startPlayback();
        }
    }

    updatePlaybackDisplay(point) {
        document.getElementById('playbackSpeed').textContent = point.speed.toFixed(1);
        document.getElementById('playbackCadence').textContent = point.cadence;
        document.getElementById('playbackPower').textContent = point.power;
        document.getElementById('playbackHeartRate').textContent = point.heartRate || '--';
    }

    updatePlaybackTimeDisplay() {
        if (!this.currentPlaybackRide || !this.currentPlaybackData) return;

        const totalDuration = this.currentPlaybackRide.duration;
        let currentDuration = 0;
        
        if (this.currentPlaybackData.length > 0 && this.currentPlaybackIndex > 0) {
            const currentPoint = this.currentPlaybackData[Math.min(this.currentPlaybackIndex, this.currentPlaybackData.length - 1)];
            const firstPoint = this.currentPlaybackData[0];
            currentDuration = currentPoint.timestamp - firstPoint.timestamp;
        }

        const currentTime = rideCalculator.formatTime(currentDuration);
        const totalTime = rideCalculator.formatTime(totalDuration);
        document.getElementById('playbackTime').textContent = `${currentTime} / ${totalTime}`;
    }

    async deleteRide(rideId) {
        if (confirm('确定要删除这条骑行记录吗？')) {
            try {
                await rideStorage.deleteRide(rideId);
                await this.showHistory();
            } catch (error) {
                console.error('删除记录失败:', error);
                alert('删除记录失败，请重试。');
            }
        }
    }
}

const app = new BikeRideApp();