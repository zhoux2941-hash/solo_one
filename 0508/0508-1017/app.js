class WebHIDTabletConfigurator {
    constructor() {
        this.device = null;
        this.isConnected = false;
        this.currentPressure = 0;
        this.rawPressure = 0;
        this.maxPressure = 8192;
        this.currentCurve = 'linear';
        this.profiles = {};
        this.currentProfile = 'default';
        this.shortcuts = {};
        this.pressedButtons = new Set();
        
        this.tiltX = 0;
        this.tiltY = 0;
        this.tiltAngle = 0;
        this.tiltMagnitude = 0;
        this.tiltMapping = 'none';
        
        this.sampleTimestamps = [];
        this.lastReportTime = 0;
        this.latencyMeasurements = [];
        
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.brushColor = '#1a1a2e';
        this.maxBrushSize = 20;
        
        this.modalButtonIndex = null;
        this.modalShortcut = null;
        
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadProfiles();
        this.renderCurve();
        this.renderTabletButtons();
        this.initCanvas();
        this.updateProfileUI();
        
        if (!navigator.hid) {
            this.showToast('您的浏览器不支持 WebHID API，请使用 Chrome/Edge 89+', 'error');
        }
    }

    cacheDOM() {
        this.connectBtn = document.getElementById('connectBtn');
        this.deviceStatus = document.getElementById('deviceStatus');
        this.statusIndicator = this.deviceStatus.querySelector('.status-indicator');
        this.statusText = this.deviceStatus.querySelector('.status-text');
        
        this.profileSelect = document.getElementById('profileSelect');
        this.profileName = document.getElementById('profileName');
        this.addProfileBtn = document.getElementById('addProfileBtn');
        this.saveProfileBtn = document.getElementById('saveProfileBtn');
        this.deleteProfileBtn = document.getElementById('deleteProfileBtn');
        
        this.curvePresets = document.querySelectorAll('.curve-preset');
        this.curveCanvas = document.getElementById('curveCanvas');
        this.inputPressureEl = document.getElementById('inputPressure');
        this.outputPressureEl = document.getElementById('outputPressure');
        
        this.pressureBar = document.getElementById('pressureBar');
        this.pressureValueEl = document.getElementById('pressureValue');
        this.sampleRateEl = document.getElementById('sampleRate');
        this.latencyEl = document.getElementById('latency');
        
        this.tiltXEl = document.getElementById('tiltX');
        this.tiltYEl = document.getElementById('tiltY');
        this.tiltAngleEl = document.getElementById('tiltAngle');
        this.tiltMagnitudeEl = document.getElementById('tiltMagnitude');
        this.tiltMappingSelect = document.getElementById('tiltMapping');
        this.tiltVisual = document.getElementById('tiltVisual');
        
        this.testCanvas = document.getElementById('testCanvas');
        this.clearCanvasBtn = document.getElementById('clearCanvasBtn');
        this.brushColorInput = document.getElementById('brushColor');
        this.maxBrushSizeInput = document.getElementById('maxBrushSize');
        this.maxBrushSizeValue = document.getElementById('maxBrushSizeValue');
        
        this.tabletButtonsContainer = document.getElementById('tabletButtons');
        this.shortcutModal = document.getElementById('shortcutModal');
        this.modalButtonName = document.getElementById('modalButtonName');
        this.shortcutPreview = document.getElementById('shortcutPreview');
        this.clearShortcutBtn = document.getElementById('clearShortcutBtn');
        this.cancelShortcutBtn = document.getElementById('cancelShortcutBtn');
        this.confirmShortcutBtn = document.getElementById('confirmShortcutBtn');
        
        this.toast = document.getElementById('toast');
    }

    bindEvents() {
        this.connectBtn.addEventListener('click', () => this.connectDevice());
        
        this.profileSelect.addEventListener('change', (e) => this.switchProfile(e.target.value));
        this.addProfileBtn.addEventListener('click', () => this.addProfile());
        this.saveProfileBtn.addEventListener('click', () => this.saveProfile());
        this.deleteProfileBtn.addEventListener('click', () => this.deleteProfile());
        
        this.curvePresets.forEach(btn => {
            btn.addEventListener('click', (e) => this.setCurve(e.target.dataset.curve));
        });
        
        this.clearCanvasBtn.addEventListener('click', () => this.clearCanvas());
        this.brushColorInput.addEventListener('input', (e) => {
            this.brushColor = e.target.value;
        });
        this.maxBrushSizeInput.addEventListener('input', (e) => {
            this.maxBrushSize = parseInt(e.target.value);
            this.maxBrushSizeValue.textContent = this.maxBrushSize;
        });
        
        this.tiltMappingSelect.addEventListener('change', (e) => {
            this.tiltMapping = e.target.value;
        });
        
        this.cancelShortcutBtn.addEventListener('click', () => this.closeShortcutModal());
        this.clearShortcutBtn.addEventListener('click', () => {
            this.modalShortcut = null;
            this.shortcutPreview.textContent = '无快捷键';
        });
        this.confirmShortcutBtn.addEventListener('click', () => this.confirmShortcut());
        
        document.addEventListener('keydown', (e) => this.handleModalKeydown(e));
    }

    async connectDevice() {
        if (this.isConnected) {
            await this.disconnectDevice();
            return;
        }

        try {
            const filters = [
                { vendorId: 0x056A },
                { vendorId: 0x256C },
                { vendorId: 0x28BD },
                { vendorId: 0x046D },
                { vendorId: 0x04B4 },
            ];

            const devices = await navigator.hid.requestDevice({ filters });
            
            if (devices.length === 0) {
                this.showToast('未选择任何设备', 'error');
                return;
            }

            this.device = devices[0];
            await this.device.open();
            
            this.device.oninputreport = (e) => this.handleInputReport(e);
            
            this.isConnected = true;
            this.updateDeviceStatus();
            this.showToast(`已连接: ${this.device.productName}`, 'success');
            
        } catch (error) {
            console.error('连接失败:', error);
            this.showToast('连接失败: ' + error.message, 'error');
        }
    }

    async disconnectDevice() {
        if (this.device) {
            try {
                await this.device.close();
            } catch (e) {
                console.error('断开连接时出错:', e);
            }
        }
        this.device = null;
        this.isConnected = false;
        this.currentPressure = 0;
        this.rawPressure = 0;
        this.updateDeviceStatus();
        this.updatePressureDisplay();
        this.showToast('设备已断开', 'success');
    }

    handleInputReport(event) {
        const data = event.data;
        const reportId = event.reportId;
        const bytes = new Uint8Array(data.buffer);
        
        const timestamp = performance.now();
        this.updateSampleRate(timestamp);
        
        this.parseTabletData(bytes, reportId);
    }

    parseTabletData(bytes, reportId) {
        if (bytes.length < 5) return;
        
        let pressure = 0;
        let buttons = 0;
        let tiltX = 0;
        let tiltY = 0;
        
        const vendorId = this.device?.vendorId || 0;
        
        if (vendorId === 0x056A) {
            pressure = (bytes[2] & 0xFF) | ((bytes[3] & 0xFF) << 8);
            buttons = bytes[1] & 0x7F;
            if (bytes.length >= 12) {
                const rawTiltX = (bytes[8] & 0xFF) | ((bytes[9] & 0x0F) << 8);
                const rawTiltY = (bytes[10] & 0xFF) | ((bytes[11] & 0x0F) << 8);
                tiltX = (rawTiltX > 2047 ? rawTiltX - 4096 : rawTiltX) / 1800;
                tiltY = (rawTiltY > 2047 ? rawTiltY - 4096 : rawTiltY) / 1800;
            }
        } else if (vendorId === 0x256C || vendorId === 0x28BD) {
            pressure = (bytes[6] & 0xFF) | ((bytes[7] & 0xFF) << 8);
            buttons = bytes[3] & 0xFF;
            if (bytes.length >= 16) {
                const rawTiltX = (bytes[12] & 0xFF) | ((bytes[13] & 0xFF) << 8);
                const rawTiltY = (bytes[14] & 0xFF) | ((bytes[15] & 0xFF) << 8);
                tiltX = (rawTiltX > 32767 ? rawTiltX - 65536 : rawTiltX) / 32767;
                tiltY = (rawTiltY > 32767 ? rawTiltY - 65536 : rawTiltY) / 32767;
            }
        } else {
            pressure = (bytes[4] & 0xFF) | ((bytes[5] & 0xFF) << 8);
            if (bytes.length > 3) {
                buttons = bytes[3] & 0xFF;
            }
            if (bytes.length >= 14) {
                const rawTiltX = (bytes[10] & 0xFF) | ((bytes[11] & 0x0F) << 8);
                const rawTiltY = (bytes[12] & 0xFF) | ((bytes[13] & 0x0F) << 8);
                tiltX = (rawTiltX > 2047 ? rawTiltX - 4096 : rawTiltX) / 1800;
                tiltY = (rawTiltY > 2047 ? rawTiltY - 4096 : rawTiltY) / 1800;
            }
        }
        
        pressure = Math.min(Math.max(pressure, 0), this.maxPressure);
        this.rawPressure = pressure;
        this.currentPressure = this.applyPressureCurve(pressure);
        
        this.tiltX = Math.max(-1, Math.min(1, tiltX));
        this.tiltY = Math.max(-1, Math.min(1, tiltY));
        this.tiltAngle = Math.atan2(this.tiltY, this.tiltX) * 180 / Math.PI;
        this.tiltMagnitude = Math.min(1, Math.sqrt(this.tiltX * this.tiltX + this.tiltY * this.tiltY));
        
        this.updatePressureDisplay();
        this.updateTiltDisplay();
        this.handleButtons(buttons);
    }

    handleButtons(buttonByte) {
        const newPressed = new Set();
        
        for (let i = 0; i < 8; i++) {
            if (buttonByte & (1 << i)) {
                newPressed.add(i);
                
                if (!this.pressedButtons.has(i)) {
                    this.triggerShortcut(i);
                }
            }
        }
        
        this.pressedButtons.forEach(btn => {
            const btnEl = document.querySelector(`[data-button="${btn}"]`);
            if (btnEl) btnEl.classList.remove('pressed');
        });
        
        newPressed.forEach(btn => {
            const btnEl = document.querySelector(`[data-button="${btn}"]`);
            if (btnEl) btnEl.classList.add('pressed');
        });
        
        this.pressedButtons = newPressed;
    }

    triggerShortcut(buttonIndex) {
        const shortcut = this.shortcuts[buttonIndex];
        if (!shortcut) return;
        
        console.log(`触发快捷键: ${shortcut.display}`);
        
        if (navigator.clipboard && shortcut.keys) {
        }
    }

    setCurve(curveType) {
        this.currentCurve = curveType;
        
        this.curvePresets.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.curve === curveType);
        });
        
        this.renderCurve();
        
        if (this.rawPressure > 0) {
            this.currentPressure = this.applyPressureCurve(this.rawPressure);
            this.updatePressureDisplay();
        }
    }

    applyPressureCurve(value) {
        const normalized = value / this.maxPressure;
        
        const deadzone = 0.015;
        if (normalized < deadzone) {
            return 0;
        }
        
        const adjusted = (normalized - deadzone) / (1 - deadzone);
        
        let result;
        
        switch (this.currentCurve) {
            case 'linear':
                result = adjusted;
                break;
            case 'logarithmic':
                result = Math.log(adjusted * 7 + 1) / Math.log(8);
                break;
            case 'exp1':
                result = Math.pow(adjusted, 1.15);
                result = result * 0.85 + adjusted * 0.15;
                break;
            case 'exp2':
                result = Math.pow(adjusted, 1.3);
                result = result * 0.75 + adjusted * 0.25;
                break;
            case 'exp3':
                result = Math.pow(adjusted, 1.45);
                result = result * 0.65 + adjusted * 0.35;
                break;
            default:
                result = adjusted;
        }
        
        const minOutput = 0.08;
        if (result > 0 && result < minOutput) {
            result = minOutput + (result / minOutput) * 0.05;
        }
        
        return Math.round(Math.max(0, Math.min(1, result)) * this.maxPressure);
    }

    renderCurve() {
        const canvas = this.curveCanvas;
        const ctx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
        
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        const padding = 20;
        
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const x = padding + (width - 2 * padding) * (i / 4);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
            
            const y = height - padding - (height - 2 * padding) * (i / 4);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#475569';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, padding);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        const steps = 100;
        for (let i = 0; i <= steps; i++) {
            const x = i / steps;
            const y = this.applyPressureCurve(x * this.maxPressure) / this.maxPressure;
            
            const canvasX = padding + x * (width - 2 * padding);
            const canvasY = height - padding - y * (height - 2 * padding);
            
            if (i === 0) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
        ctx.stroke();
        
        if (this.rawPressure > 0) {
            const normX = this.rawPressure / this.maxPressure;
            const normY = this.currentPressure / this.maxPressure;
            
            const dotX = padding + normX * (width - 2 * padding);
            const dotY = height - padding - normY * (height - 2 * padding);
            
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText('0', padding - 15, height - padding + 4);
        ctx.fillText('8192', width - padding + 5, height - padding + 4);
        ctx.fillText('8192', padding - 25, padding + 4);
    }

    updateTiltDisplay() {
        if (this.tiltXEl) this.tiltXEl.textContent = this.tiltX.toFixed(2);
        if (this.tiltYEl) this.tiltYEl.textContent = this.tiltY.toFixed(2);
        if (this.tiltAngleEl) this.tiltAngleEl.textContent = `${Math.round(this.tiltAngle)}°`;
        if (this.tiltMagnitudeEl) this.tiltMagnitudeEl.textContent = `${Math.round(this.tiltMagnitude * 100)}%`;
        
        if (this.tiltVisual) {
            const radius = 25;
            const centerX = 30;
            const centerY = 30;
            const dotX = centerX + this.tiltX * radius;
            const dotY = centerY + this.tiltY * radius;
            
            const svg = `
                <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#334155" stroke-width="1"/>
                    <circle cx="${centerX}" cy="${centerY}" r="2" fill="#334155"/>
                    <circle cx="${dotX}" cy="${dotY}" r="5" fill="#06b6d4" opacity="${0.3 + this.tiltMagnitude * 0.7}"/>
                </svg>
            `;
            this.tiltVisual.innerHTML = svg;
        }
    }

    updatePressureDisplay() {
        const percentage = (this.currentPressure / this.maxPressure) * 100;
        this.pressureBar.style.width = `${percentage}%`;
        this.pressureValueEl.textContent = this.currentPressure;
        this.inputPressureEl.textContent = this.rawPressure;
        this.outputPressureEl.textContent = this.currentPressure;
        
        if (this.isConnected && this.rawPressure > 0) {
            this.renderCurve();
        }
    }

    updateSampleRate(timestamp) {
        if (this.lastReportTime > 0) {
            const latency = timestamp - this.lastReportTime;
            this.latencyMeasurements.push(latency);
            if (this.latencyMeasurements.length > 50) {
                this.latencyMeasurements.shift();
            }
        }
        this.lastReportTime = timestamp;
        
        this.sampleTimestamps.push(timestamp);
        const cutoff = timestamp - 1000;
        this.sampleTimestamps = this.sampleTimestamps.filter(t => t > cutoff);
        
        const sampleRate = this.sampleTimestamps.length;
        const avgLatency = this.latencyMeasurements.length > 0 
            ? this.latencyMeasurements.reduce((a, b) => a + b, 0) / this.latencyMeasurements.length 
            : 0;
        
        this.sampleRateEl.textContent = `${sampleRate} Hz`;
        this.latencyEl.textContent = `${avgLatency.toFixed(1)} ms`;
        
        if (sampleRate >= 200 && avgLatency < 20) {
            this.sampleRateEl.style.color = '#10b981';
            this.latencyEl.style.color = '#10b981';
        } else {
            this.sampleRateEl.style.color = '#f59e0b';
            this.latencyEl.style.color = '#f59e0b';
        }
    }

    updateDeviceStatus() {
        if (this.isConnected) {
            this.statusIndicator.className = 'status-indicator connected';
            this.statusText.textContent = this.device?.productName || '已连接';
            this.connectBtn.textContent = '断开连接';
        } else {
            this.statusIndicator.className = 'status-indicator disconnected';
            this.statusText.textContent = '未连接设备';
            this.connectBtn.textContent = '连接数位板';
        }
    }

    initCanvas() {
        const canvas = this.testCanvas;
        const ctx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
        canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
        canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
        canvas.addEventListener('pointerleave', (e) => this.handlePointerUp(e));
    }

    handlePointerDown(e) {
        e.preventDefault();
        this.testCanvas.setPointerCapture(e.pointerId);
        this.isDrawing = true;
        
        const rect = this.testCanvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        
        this.testCanvas.classList.add('drawing');
        
        let pressure;
        if (this.isConnected && this.rawPressure > 0) {
            pressure = this.currentPressure / this.maxPressure;
        } else if (e.pressure && e.pressure > 0 && e.pressure < 1) {
            pressure = e.pressure;
        } else {
            pressure = 0.3;
        }
        
        this.drawDot(this.lastX, this.lastY, pressure);
    }

    handlePointerMove(e) {
        if (!this.isDrawing) return;
        
        e.preventDefault();
        
        const rect = this.testCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        let pressure;
        if (this.isConnected && this.rawPressure > 0) {
            pressure = this.currentPressure / this.maxPressure;
        } else if (e.pressure && e.pressure > 0 && e.pressure < 1) {
            pressure = e.pressure;
        } else {
            pressure = 0.3;
        }
        
        this.drawLine(this.lastX, this.lastY, x, y, pressure);
        
        this.lastX = x;
        this.lastY = y;
    }

    handlePointerUp(e) {
        this.isDrawing = false;
        this.testCanvas.classList.remove('drawing');
    }

    drawLine(x1, y1, x2, y2, pressure) {
        const ctx = this.testCanvas.getContext('2d');
        
        const minSize = 1.5;
        const sizeRange = this.maxBrushSize - minSize;
        let size = minSize + Math.max(0, pressure) * sizeRange;
        
        let alpha = 0.5 + Math.max(0, pressure) * 0.5;
        let rotation = 0;
        
        if (this.tiltMapping === 'opacity') {
            alpha = alpha * (1 - this.tiltMagnitude * 0.6);
            alpha = Math.max(0.2, alpha);
        } else if (this.tiltMapping === 'rotation') {
            rotation = this.tiltAngle * Math.PI / 180;
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.brushColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (this.tiltMapping === 'rotation' && this.tiltMagnitude > 0.1) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const stretchFactor = 1 + this.tiltMagnitude * 0.5;
            
            ctx.translate(midX, midY);
            ctx.rotate(rotation);
            ctx.scale(1, 1 / stretchFactor);
            ctx.translate(-midX, -midY);
            
            ctx.lineWidth = size * (1 + this.tiltMagnitude * 0.3);
        } else {
            ctx.lineWidth = size;
        }
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    drawDot(x, y, pressure) {
        const ctx = this.testCanvas.getContext('2d');
        
        const minSize = 1.5;
        const sizeRange = this.maxBrushSize - minSize;
        let size = minSize + Math.max(0, pressure) * sizeRange;
        
        let alpha = 0.5 + Math.max(0, pressure) * 0.5;
        let rotation = 0;
        
        if (this.tiltMapping === 'opacity') {
            alpha = alpha * (1 - this.tiltMagnitude * 0.6);
            alpha = Math.max(0.2, alpha);
        } else if (this.tiltMapping === 'rotation') {
            rotation = this.tiltAngle * Math.PI / 180;
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.brushColor;
        
        if (this.tiltMapping === 'rotation' && this.tiltMagnitude > 0.1) {
            const stretchFactor = 1 + this.tiltMagnitude * 0.5;
            
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.scale(1, 1 / stretchFactor);
            
            ctx.beginPath();
            ctx.arc(0, 0, size / 2 * (1 + this.tiltMagnitude * 0.3), 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    clearCanvas() {
        const ctx = this.testCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = this.testCanvas.getBoundingClientRect();
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, this.testCanvas.width, this.testCanvas.height);
        ctx.scale(dpr, dpr);
    }

    renderTabletButtons() {
        this.tabletButtonsContainer.innerHTML = '';
        
        for (let i = 0; i < 8; i++) {
            const buttonEl = document.createElement('div');
            buttonEl.className = 'tablet-button';
            buttonEl.dataset.button = i;
            
            const shortcut = this.shortcuts[i];
            const shortcutText = shortcut ? shortcut.display : '未配置';
            
            buttonEl.innerHTML = `
                <div class="button-number">${i + 1}</div>
                <div class="button-shortcut">${shortcutText}</div>
            `;
            
            buttonEl.addEventListener('click', () => this.openShortcutModal(i));
            this.tabletButtonsContainer.appendChild(buttonEl);
        }
    }

    openShortcutModal(buttonIndex) {
        this.modalButtonIndex = buttonIndex;
        this.modalShortcut = this.shortcuts[buttonIndex] || null;
        
        this.modalButtonName.textContent = `按键 ${buttonIndex + 1}`;
        this.shortcutPreview.textContent = this.modalShortcut ? this.modalShortcut.display : '等待输入...';
        this.shortcutPreview.classList.add('recording');
        
        this.shortcutModal.classList.remove('hidden');
    }

    closeShortcutModal() {
        this.shortcutModal.classList.add('hidden');
        this.shortcutPreview.classList.remove('recording');
        this.modalButtonIndex = null;
        this.modalShortcut = null;
    }

    handleModalKeydown(e) {
        if (this.shortcutModal.classList.contains('hidden')) return;
        if (this.modalButtonIndex === null) return;
        
        if (e.key === 'Escape') {
            this.closeShortcutModal();
            return;
        }
        
        e.preventDefault();
        
        const keys = [];
        if (e.ctrlKey) keys.push('Ctrl');
        if (e.shiftKey) keys.push('Shift');
        if (e.altKey) keys.push('Alt');
        if (e.metaKey) keys.push('Meta');
        
        const keyMap = {
            'Control': 'Ctrl',
            ' ': 'Space',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'Escape': 'Esc',
            'Delete': 'Del',
            'Backspace': '⌫',
            'Enter': '↵',
            'Tab': '⇥',
        };
        
        let keyName = keyMap[e.key] || e.key;
        if (keyName.length === 1) {
            keyName = keyName.toUpperCase();
        }
        
        if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
            keys.push(keyName);
        }
        
        if (keys.length > 0) {
            this.modalShortcut = {
                keys: keys,
                display: keys.join(' + ')
            };
            this.shortcutPreview.textContent = this.modalShortcut.display;
        }
    }

    confirmShortcut() {
        if (this.modalButtonIndex === null) return;
        
        if (this.modalShortcut) {
            this.shortcuts[this.modalButtonIndex] = this.modalShortcut;
        } else {
            delete this.shortcuts[this.modalButtonIndex];
        }
        
        this.renderTabletButtons();
        this.closeShortcutModal();
        this.showToast('快捷键已保存', 'success');
    }

    loadProfiles() {
        try {
            const saved = localStorage.getItem('tabletConfiguratorProfiles');
            if (saved) {
                this.profiles = JSON.parse(saved);
            }
        } catch (e) {
            console.error('加载配置失败:', e);
        }
        
        if (!this.profiles['default']) {
            this.profiles['default'] = {
                name: '默认配置',
                curve: 'linear',
                tiltMapping: 'none',
                shortcuts: {}
            };
        }
        
        this.switchProfile('default');
    }

    saveProfiles() {
        try {
            localStorage.setItem('tabletConfiguratorProfiles', JSON.stringify(this.profiles));
        } catch (e) {
            console.error('保存配置失败:', e);
            this.showToast('保存失败: ' + e.message, 'error');
        }
    }

    switchProfile(profileId) {
        const profile = this.profiles[profileId];
        if (!profile) return;
        
        this.currentProfile = profileId;
        this.currentCurve = profile.curve || 'linear';
        this.tiltMapping = profile.tiltMapping || 'none';
        this.shortcuts = profile.shortcuts || {};
        
        this.curvePresets.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.curve === this.currentCurve);
        });
        
        if (this.tiltMappingSelect) {
            this.tiltMappingSelect.value = this.tiltMapping;
        }
        
        this.renderCurve();
        this.renderTabletButtons();
        this.updateProfileUI();
    }

    updateProfileUI() {
        this.profileSelect.innerHTML = '';
        
        Object.keys(this.profiles).forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = this.profiles[id].name;
            option.selected = id === this.currentProfile;
            this.profileSelect.appendChild(option);
        });
        
        this.profileName.value = this.profiles[this.currentProfile]?.name || '';
    }

    addProfile() {
        const id = 'profile_' + Date.now();
        const name = prompt('输入新配置名称:', '新配置');
        
        if (!name) return;
        
        this.profiles[id] = {
            name: name,
            curve: this.currentCurve,
            tiltMapping: this.tiltMapping,
            shortcuts: { ...this.shortcuts }
        };
        
        this.saveProfiles();
        this.switchProfile(id);
        this.showToast('配置已创建', 'success');
    }

    saveProfile() {
        const name = this.profileName.value.trim();
        if (!name) {
            this.showToast('请输入配置名称', 'error');
            return;
        }
        
        if (!this.profiles[this.currentProfile]) {
            this.profiles[this.currentProfile] = {};
        }
        
        this.profiles[this.currentProfile].name = name;
        this.profiles[this.currentProfile].curve = this.currentCurve;
        this.profiles[this.currentProfile].tiltMapping = this.tiltMapping;
        this.profiles[this.currentProfile].shortcuts = { ...this.shortcuts };
        
        this.saveProfiles();
        this.updateProfileUI();
        this.showToast('配置已保存', 'success');
    }

    deleteProfile() {
        if (this.currentProfile === 'default') {
            this.showToast('无法删除默认配置', 'error');
            return;
        }
        
        if (!confirm('确定要删除此配置吗？')) return;
        
        delete this.profiles[this.currentProfile];
        this.saveProfiles();
        this.switchProfile('default');
        this.showToast('配置已删除', 'success');
    }

    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.classList.remove('hidden');
        
        setTimeout(() => {
            this.toast.classList.add('hidden');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new WebHIDTabletConfigurator();
});
