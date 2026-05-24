class BodyScaleApp {
    constructor() {
        this.currentUserId = null;
        this.currentMeasurement = {};
        this.weightChart = null;
        this.fatChart = null;
        this.ageChart = null;
        this.syncStartTime = null;
        this.syncTimeout = null;
        this.isSyncing = false;
        this.measurementsCache = null;
        this.cacheUserId = null;
        this.init();
    }

    async init() {
        await db.init();
        this.setupEventListeners();
        await this.loadUsers();
        this.setupBluetoothCallbacks();
        this.initCharts();
    }

    setupEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => this.handleConnect());
        document.getElementById('userSelect').addEventListener('change', (e) => this.handleUserChange(e));
        document.getElementById('addUserBtn').addEventListener('click', () => this.showUserModal());
        document.getElementById('saveUserBtn').addEventListener('click', () => this.saveUser());
        document.getElementById('cancelUserBtn').addEventListener('click', () => this.hideUserModal());
        document.getElementById('saveGoalBtn').addEventListener('click', () => this.saveGoal());
        document.getElementById('targetWeight').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveGoal();
        });
    }

    setupBluetoothCallbacks() {
        bluetooth.onConnectionChanged = (connected) => {
            this.updateConnectionStatus(connected);
        };

        bluetooth.onDataReceived = (data) => {
            this.handleMeasurementData(data);
        };
    }

    async handleConnect() {
        if (!this.currentUserId) {
            alert('请先选择用户');
            return;
        }

        if (this.isSyncing) {
            return;
        }

        try {
            this.isSyncing = true;
            this.currentMeasurement = {};
            this.showSyncProgress();
            this.syncStartTime = Date.now();
            
            this.syncTimeout = setTimeout(() => {
                if (this.isSyncing) {
                    console.log('Sync timeout, using partial data');
                    this.completeSync(this.currentMeasurement);
                }
            }, 8000);
            
            if (!bluetooth.isSupported()) {
                console.log('Web Bluetooth not supported, using simulation');
                setTimeout(() => {
                    const data = bluetooth.simulateMeasurement();
                    this.handleMeasurementData(data);
                }, 1000);
                return;
            }

            await bluetooth.connect();
        } catch (error) {
            this.cleanupSync();
            console.error('Connection failed:', error);
            alert('连接失败: ' + error.message);
        }
    }

    handleMeasurementData(data) {
        if (!this.isSyncing || !this.currentUserId) return;

        Object.assign(this.currentMeasurement, data);
        
        if (!this.currentMeasurement.metabolicAge) {
            const tempAge = this.calculateMetabolicAge(this.currentMeasurement);
            if (tempAge) {
                this.currentMeasurement.metabolicAge = tempAge;
            }
        }
        
        this.updateDataDisplay(this.currentMeasurement);

        if (this.hasCompleteData(this.currentMeasurement)) {
            this.completeSync(this.currentMeasurement);
        }
    }

    hasCompleteData(data) {
        return data.weight !== undefined;
    }

    cleanupSync() {
        this.isSyncing = false;
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }
        this.hideSyncProgress();
    }

    async completeSync(data) {
        if (!this.currentUserId) {
            this.cleanupSync();
            return;
        }

        const syncDuration = Date.now() - this.syncStartTime;
        
        if (syncDuration > 10000) {
            console.warn('Sync took longer than 10 seconds:', syncDuration);
        }

        const latest = await db.getLatestMeasurement(this.currentUserId);
        
        const completeData = {
            weight: data.weight || (latest ? latest.weight : null),
            bodyFat: data.bodyFat || (latest ? latest.bodyFat : null),
            muscle: data.muscle || (latest ? latest.muscle : null),
            water: data.water || (latest ? latest.water : null),
            bone: data.bone || (latest ? latest.bone : null),
            bmr: data.bmr || (latest ? latest.bmr : null)
        };

        if (completeData.weight === null) {
            completeData.weight = 0;
        }
        if (completeData.bodyFat === null) {
            completeData.bodyFat = 0;
        }
        if (completeData.muscle === null) {
            completeData.muscle = 0;
        }
        if (completeData.water === null) {
            completeData.water = 0;
        }
        if (completeData.bone === null) {
            completeData.bone = 0;
        }
        if (completeData.bmr === null) {
            completeData.bmr = 0;
        }

        completeData.metabolicAge = this.calculateMetabolicAge(completeData);

        try {
            await db.addMeasurement(this.currentUserId, completeData);
            this.cleanupSync();
            this.invalidateCache();
            this.updateDataDisplay(completeData);
            await this.updateCharts();
            await this.updateHistory();
            await this.updateGoalProgress();
        } catch (error) {
            console.error('Failed to save measurement:', error);
            this.cleanupSync();
        }
    }

    invalidateCache() {
        this.measurementsCache = null;
        this.cacheUserId = null;
    }

    async getCachedMeasurements() {
        if (this.measurementsCache && this.cacheUserId === this.currentUserId) {
            return this.measurementsCache;
        }
        const measurements = await db.getMeasurements(this.currentUserId, 30);
        this.measurementsCache = measurements;
        this.cacheUserId = this.currentUserId;
        return measurements;
    }

    calculateMetabolicAge(data) {
        if (!data.weight || !data.bodyFat || !data.muscle || !data.bmr) {
            return null;
        }

        const { weight, bodyFat, muscle, bmr } = data;

        let fatMass = weight * bodyFat / 100;
        let muscleMass = muscle;

        let bmrPerKgMuscle = bmr / muscleMass;

        let fatScore = Math.max(0, Math.min(100, bodyFat * 3));

        let muscleRatio = muscle / weight * 100;
        let muscleScore = Math.max(0, Math.min(100, 100 - muscleRatio * 1.5));

        let expectedBmr = muscle * 22 + fatMass * 5 + (weight - muscle - fatMass) * 1;
        let bmrRatio = bmr / expectedBmr;
        let bmrScore = Math.max(0, Math.min(100, (1 - bmrRatio) * 150));

        let baseAge = 30;
        let ageAdjustment = (fatScore * 0.3 + muscleScore * 0.4 + bmrScore * 0.3) / 100 * 40;

        let metabolicAge = baseAge + ageAdjustment;

        metabolicAge = Math.max(18, Math.min(80, metabolicAge));

        return Math.round(metabolicAge);
    }

    showSyncProgress() {
        document.getElementById('syncProgress').classList.remove('hidden');
    }

    hideSyncProgress() {
        document.getElementById('syncProgress').classList.add('hidden');
    }

    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connectionStatus');
        const btnEl = document.getElementById('connectBtn');

        if (connected) {
            statusEl.textContent = '已连接';
            statusEl.className = 'status connected';
            btnEl.textContent = '断开连接';
        } else {
            statusEl.textContent = '未连接';
            statusEl.className = 'status disconnected';
            btnEl.textContent = '连接体脂秤';
        }
    }

    updateDataDisplay(data) {
        if (data.weight !== undefined && data.weight !== null && data.weight > 0) {
            document.getElementById('weightValue').textContent = data.weight.toFixed(1);
        }
        if (data.bodyFat !== undefined && data.bodyFat !== null && data.bodyFat > 0) {
            document.getElementById('fatValue').textContent = data.bodyFat.toFixed(1);
        }
        if (data.muscle !== undefined && data.muscle !== null && data.muscle > 0) {
            document.getElementById('muscleValue').textContent = data.muscle.toFixed(1);
        }
        if (data.water !== undefined && data.water !== null && data.water > 0) {
            document.getElementById('waterValue').textContent = data.water.toFixed(1);
        }
        if (data.bone !== undefined && data.bone !== null && data.bone > 0) {
            document.getElementById('boneValue').textContent = data.bone.toFixed(1);
        }
        if (data.bmr !== undefined && data.bmr !== null && data.bmr > 0) {
            document.getElementById('bmrValue').textContent = data.bmr;
        }
        if (data.metabolicAge !== undefined && data.metabolicAge !== null) {
            document.getElementById('metabolicAgeValue').textContent = data.metabolicAge;
        }

        const now = new Date();
        document.getElementById('measureTime').textContent = now.toLocaleString('zh-CN');
    }

    async loadUsers() {
        const users = await db.getUsers();
        const select = document.getElementById('userSelect');
        
        select.innerHTML = '<option value="">选择用户</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });
    }

    async handleUserChange(e) {
        if (this.isSyncing) {
            this.cleanupSync();
        }
        
        this.currentUserId = e.target.value ? parseInt(e.target.value) : null;
        this.currentMeasurement = {};
        this.invalidateCache();

        if (this.currentUserId) {
            await this.loadUserData();
        } else {
            this.clearUserData();
        }
    }

    async loadUserData() {
        const latest = await db.getLatestMeasurement(this.currentUserId);
        if (latest) {
            this.updateDataDisplay(latest);
        }

        await this.updateCharts();
        await this.updateHistory();
        await this.updateGoalProgress();
    }

    clearUserData() {
        document.getElementById('weightValue').textContent = '--';
        document.getElementById('fatValue').textContent = '--';
        document.getElementById('muscleValue').textContent = '--';
        document.getElementById('waterValue').textContent = '--';
        document.getElementById('boneValue').textContent = '--';
        document.getElementById('bmrValue').textContent = '--';
        document.getElementById('metabolicAgeValue').textContent = '--';
        document.getElementById('measureTime').textContent = '--';
        document.getElementById('historyBody').innerHTML = '';
        document.getElementById('targetWeight').value = '';
        document.getElementById('currentWeightGoal').textContent = '-- kg';
        document.getElementById('targetWeightGoal').textContent = '-- kg';
        document.getElementById('weightDiff').textContent = '-- kg';
        
        if (this.weightChart) this.weightChart.data.datasets[0].data = [];
        if (this.fatChart) this.fatChart.data.datasets[0].data = [];
        if (this.ageChart) this.ageChart.data.datasets[0].data = [];
        if (this.weightChart) this.weightChart.update();
        if (this.fatChart) this.fatChart.update();
        if (this.ageChart) this.ageChart.update();
    }

    showUserModal() {
        document.getElementById('userModal').classList.add('show');
        document.getElementById('newUserName').focus();
    }

    hideUserModal() {
        document.getElementById('userModal').classList.remove('show');
        document.getElementById('newUserName').value = '';
    }

    async saveUser() {
        const name = document.getElementById('newUserName').value.trim();
        if (!name) {
            alert('请输入用户名');
            return;
        }

        try {
            await db.addUser(name);
            await this.loadUsers();
            this.hideUserModal();
        } catch (error) {
            console.error('Failed to add user:', error);
            alert('添加用户失败，用户名可能已存在');
        }
    }

    initCharts() {
        const weightCtx = document.getElementById('weightChart').getContext('2d');
        const fatCtx = document.getElementById('fatChart').getContext('2d');
        const ageCtx = document.getElementById('ageChart').getContext('2d');

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300
            },
            transitions: {
                none: {
                    animation: false
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        };

        this.weightChart = new Chart(weightCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '体重 (kg)',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 3
                }]
            },
            options: chartOptions
        });

        this.fatChart = new Chart(fatCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '体脂率 (%)',
                    data: [],
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#764ba2',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 3
                }]
            },
            options: chartOptions
        });

        this.ageChart = new Chart(ageCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '代谢年龄 (岁)',
                    data: [],
                    borderColor: '#f093fb',
                    backgroundColor: 'rgba(240, 147, 251, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#f093fb',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 3
                }]
            },
            options: chartOptions
        });
    }

    async updateCharts() {
        if (!this.currentUserId) return;

        const measurements = await this.getCachedMeasurements();
        
        const labels = measurements.map(m => {
            const date = new Date(m.timestamp);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const weights = measurements.map(m => m.weight);
        const fats = measurements.map(m => m.bodyFat);
        const ages = measurements.map(m => m.metabolicAge);

        this.weightChart.data.labels = labels;
        this.weightChart.data.datasets[0].data = weights;
        this.weightChart.update('none');

        this.fatChart.data.labels = labels;
        this.fatChart.data.datasets[0].data = fats;
        this.fatChart.update('none');

        this.ageChart.data.labels = labels;
        this.ageChart.data.datasets[0].data = ages;
        this.ageChart.update('none');
    }

    async updateHistory() {
        if (!this.currentUserId) return;

        const measurements = await this.getCachedMeasurements();
        const tbody = document.getElementById('historyBody');
        
        const rows = [];
        const reversedMeasurements = measurements.slice().reverse();
        
        reversedMeasurements.slice(0, 20).forEach(m => {
            const date = new Date(m.timestamp);
            rows.push(`
                <tr>
                    <td>${date.toLocaleDateString('zh-CN')}</td>
                    <td>${m.weight.toFixed(1)} kg</td>
                    <td>${m.bodyFat.toFixed(1)}%</td>
                    <td>${m.metabolicAge || '--'} 岁</td>
                </tr>
            `);
        });
        
        tbody.innerHTML = rows.join('');
    }

    async saveGoal() {
        if (!this.currentUserId) {
            alert('请先选择用户');
            return;
        }

        const targetWeight = parseFloat(document.getElementById('targetWeight').value);
        if (isNaN(targetWeight) || targetWeight < 30 || targetWeight > 200) {
            alert('请输入有效的目标体重 (30-200 kg)');
            return;
        }

        await db.setGoal(this.currentUserId, targetWeight);
        await this.updateGoalProgress();
    }

    async updateGoalProgress() {
        if (!this.currentUserId) return;

        const goal = await db.getGoal(this.currentUserId);
        const latest = await db.getLatestMeasurement(this.currentUserId);

        if (goal) {
            document.getElementById('targetWeight').value = goal.targetWeight;
            document.getElementById('targetWeightGoal').textContent = `${goal.targetWeight.toFixed(1)} kg`;
        }

        if (latest) {
            document.getElementById('currentWeightGoal').textContent = `${latest.weight.toFixed(1)} kg`;
            
            if (goal) {
                const diff = latest.weight - goal.targetWeight;
                const diffEl = document.getElementById('weightDiff');
                diffEl.textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} kg`;
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BodyScaleApp();
});