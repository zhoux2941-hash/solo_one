class ControllerApp {
    constructor() {
        this.controller = new SwitchHIDController();
        this.recording = false;
        this.recordedData = [];
        this.playbackIndex = 0;
        this.playbackInterval = null;
        this.isCalibratingSticks = false;
        this.stickCalibrationTimer = null;
        
        this.mouseControl = {
            enabled: false,
            sensitivity: 3.0,
            smoothing: 0.7,
            deadzone: 0.05,
            reverseY: true,
            useGyro: false
        };
        
        this.mouseState = {
            x: 0,
            y: 0,
            rawX: 0,
            rawY: 0,
            centerPitch: 0,
            centerRoll: 0
        };
        
        this.initEventListeners();
        this.initControllerCallbacks();
    }

    initEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        
        document.getElementById('vibrateBtn').addEventListener('click', () => this.triggerVibration());
        
        document.getElementById('calibrateGyroBtn').addEventListener('click', () => this.calibrateGyro());
        document.getElementById('calibrateCenterBtn').addEventListener('click', () => this.calibrateStickCenter());
        document.getElementById('calibrateStickRangeBtn')?.addEventListener('click', () => this.calibrateStickRange());
        document.getElementById('resetOrientationBtn')?.addEventListener('click', () => this.resetOrientation());
        
        document.getElementById('leftDeadzone').addEventListener('input', (e) => this.updateDeadzone(e));
        document.getElementById('rightDeadzone').addEventListener('input', (e) => this.updateDeadzone(e));
        
        document.getElementById('recordBtn').addEventListener('click', () => this.startRecording());
        document.getElementById('stopRecordBtn').addEventListener('click', () => this.stopRecording());
        document.getElementById('playbackBtn').addEventListener('click', () => this.startPlayback());
        document.getElementById('stopPlaybackBtn').addEventListener('click', () => this.stopPlayback());
        document.getElementById('playbackSpeed').addEventListener('input', (e) => {
            document.getElementById('playbackSpeedValue').textContent = e.target.value + 'x';
        });
        
        ['leftFreq', 'leftAmp', 'rightFreq', 'rightAmp', 'vibrateDuration'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                const valueId = id + 'Value';
                document.getElementById(valueId).textContent = e.target.value + (id.includes('Amp') ? '%' : '');
            });
        });
        
        document.getElementById('mouseControlEnabled').addEventListener('change', (e) => {
            this.mouseControl.enabled = e.target.checked;
            if (this.mouseControl.enabled) {
                this.resetMouseCenter();
            }
        });
        
        document.getElementById('mouseSensitivity').addEventListener('input', (e) => {
            this.mouseControl.sensitivity = parseFloat(e.target.value);
            document.getElementById('mouseSensitivityValue').textContent = e.target.value;
        });
        
        document.getElementById('mouseSmoothing').addEventListener('input', (e) => {
            this.mouseControl.smoothing = parseFloat(e.target.value);
            document.getElementById('mouseSmoothingValue').textContent = e.target.value;
        });
        
        document.getElementById('mouseDeadzone').addEventListener('input', (e) => {
            this.mouseControl.deadzone = parseFloat(e.target.value);
            document.getElementById('mouseDeadzoneValue').textContent = e.target.value;
        });
        
        document.getElementById('mouseReverseY').addEventListener('change', (e) => {
            this.mouseControl.reverseY = e.target.checked;
        });
        
        document.getElementById('mouseUseGyro').addEventListener('change', (e) => {
            this.mouseControl.useGyro = e.target.checked;
        });
        
        document.getElementById('resetMouseCenter').addEventListener('click', () => {
            this.resetMouseCenter();
        });
    }

    initControllerCallbacks() {
        this.controller.onConnect = (device) => {
            this.updateConnectionStatus(true, device);
            this.enableControls(true);
        };

        this.controller.onDisconnect = () => {
            this.updateConnectionStatus(false);
            this.enableControls(false);
        };

        this.controller.onData = (state) => {
            this.updateUI(state);
            if (this.recording) {
                this.recordedData.push({
                    timestamp: Date.now(),
                    state: JSON.parse(JSON.stringify(state))
                });
                document.getElementById('recordCount').textContent = this.recordedData.length;
            }
        };
    }

    async connect() {
        try {
            document.getElementById('connectBtn').disabled = true;
            document.getElementById('statusText').textContent = '连接中...';
            await this.controller.connect();
        } catch (error) {
            console.error('Failed to connect:', error);
            document.getElementById('statusText').textContent = '连接失败: ' + error.message;
            document.getElementById('connectBtn').disabled = false;
        }
    }

    async disconnect() {
        await this.controller.disconnect();
    }

    updateConnectionStatus(connected, device = null) {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const deviceInfo = document.getElementById('deviceInfo');

        if (connected && device) {
            indicator.className = 'status-indicator connected';
            statusText.textContent = '已连接';
            deviceInfo.style.display = 'block';
            document.getElementById('deviceName').textContent = device.productName || 'Unknown';
            document.getElementById('deviceVid').textContent = device.vendorId.toString(16).toUpperCase();
            document.getElementById('devicePid').textContent = device.productId.toString(16).toUpperCase();
        } else {
            indicator.className = 'status-indicator disconnected';
            statusText.textContent = '未连接';
            deviceInfo.style.display = 'none';
        }
    }

    enableControls(enabled) {
        document.getElementById('connectBtn').disabled = enabled;
        document.getElementById('disconnectBtn').disabled = !enabled;
        document.getElementById('vibrateBtn').disabled = !enabled;
        document.getElementById('calibrateGyroBtn').disabled = !enabled;
        document.getElementById('resetOrientationBtn').disabled = !enabled;
        document.getElementById('calibrateStickRangeBtn').disabled = !enabled;
        document.getElementById('recordBtn').disabled = !enabled;
        document.getElementById('playbackBtn').disabled = !enabled || this.recordedData.length === 0;
        document.getElementById('mouseControlEnabled').disabled = !enabled;
        document.getElementById('resetMouseCenter').disabled = !enabled;
    }

    updateUI(state) {
        this.updateButtons(state.buttons);
        this.updateSticks(state.leftStick, state.rightStick);
        this.updateSensors(state.gyro, state.accel, state.orientation);
        this.updateMouseControl(state);
    }

    updateButtons(buttons) {
        const buttonMap = {
            'A': 'btnA',
            'B': 'btnB',
            'X': 'btnX',
            'Y': 'btnY',
            'L': 'btnL',
            'R': 'btnR',
            'ZL': 'btnZL',
            'ZR': 'btnZR',
            'Up': 'dpadUp',
            'Down': 'dpadDown',
            'Left': 'dpadLeft',
            'Right': 'dpadRight',
            'L3': 'btnL3',
            'R3': 'btnR3',
            'Minus': 'btnMinus',
            'Plus': 'btnPlus',
            'Home': 'btnHome',
            'Capture': 'btnCapture'
        };

        for (const [key, elementId] of Object.entries(buttonMap)) {
            const element = document.getElementById(elementId);
            if (element) {
                if (buttons[key]) {
                    element.classList.add('pressed');
                } else {
                    element.classList.remove('pressed');
                }
            }
        }
    }

    updateSticks(leftStick, rightStick) {
        const leftKnob = document.getElementById('leftStickKnob');
        const rightKnob = document.getElementById('rightStickKnob');
        
        const maxOffset = 35;
        leftKnob.style.transform = `translate(calc(-50% + ${leftStick.x * maxOffset}px), calc(-50% + ${-leftStick.y * maxOffset}px))`;
        rightKnob.style.transform = `translate(calc(-50% + ${rightStick.x * maxOffset}px), calc(-50% + ${-rightStick.y * maxOffset}px))`;

        this.updateStickBar('leftStickX', leftStick.x);
        this.updateStickBar('leftStickY', leftStick.y);
        this.updateStickBar('rightStickX', rightStick.x);
        this.updateStickBar('rightStickY', rightStick.y);
    }

    updateStickBar(prefix, value) {
        const bar = document.getElementById(prefix + 'Bar');
        const valueEl = document.getElementById(prefix + 'Value');
        const percentage = ((value + 1) / 2) * 100;
        bar.style.width = percentage + '%';
        valueEl.textContent = value.toFixed(3);
    }

    updateSensors(gyro, accel, orientation) {
        document.getElementById('gyroX').textContent = (gyro.x * 180 / Math.PI).toFixed(2);
        document.getElementById('gyroY').textContent = (gyro.y * 180 / Math.PI).toFixed(2);
        document.getElementById('gyroZ').textContent = (gyro.z * 180 / Math.PI).toFixed(2);
        
        document.getElementById('accelX').textContent = accel.x.toFixed(2);
        document.getElementById('accelY').textContent = accel.y.toFixed(2);
        document.getElementById('accelZ').textContent = accel.z.toFixed(2);

        const cube = document.getElementById('motionCube');
        const rollDeg = orientation.roll * 180 / Math.PI;
        const pitchDeg = orientation.pitch * 180 / Math.PI;
        const yawDeg = orientation.yaw * 180 / Math.PI;
        cube.style.transform = `rotateX(${pitchDeg}deg) rotateY(${yawDeg}deg) rotateZ(${rollDeg}deg)`;
    }

    triggerVibration() {
        const leftFreq = parseInt(document.getElementById('leftFreq').value);
        const leftAmp = parseInt(document.getElementById('leftAmp').value) / 100;
        const rightFreq = parseInt(document.getElementById('rightFreq').value);
        const rightAmp = parseInt(document.getElementById('rightAmp').value) / 100;
        const duration = parseInt(document.getElementById('vibrateDuration').value);

        this.controller.vibrate(leftFreq, leftAmp, rightFreq, rightAmp, duration);
    }

    async calibrateGyro() {
        const btn = document.getElementById('calibrateGyroBtn');
        const originalText = btn.textContent;
        btn.textContent = '校准中...';
        btn.disabled = true;

        await this.controller.calibrateGyro();
        
        btn.textContent = originalText;
        btn.disabled = false;
    }

    async calibrateStickRange() {
        if (this.isCalibratingSticks) {
            return;
        }

        const btn = document.getElementById('calibrateStickRangeBtn');
        if (!btn) return;
        
        const originalText = btn.textContent;
        this.isCalibratingSticks = true;
        btn.textContent = '转动摇杆...';
        btn.disabled = true;

        this.controller.startStickCalibration();

        await new Promise(resolve => {
            this.stickCalibrationTimer = setTimeout(resolve, 5000);
        });

        this.controller.finishStickCalibration();
        
        this.isCalibratingSticks = false;
        btn.textContent = originalText;
        btn.disabled = false;
    }

    calibrateStickCenter() {
        this.controller.calibrateStickCenter();
    }

    resetOrientation() {
        this.controller.resetOrientation();
    }

    updateDeadzone() {
        const left = parseInt(document.getElementById('leftDeadzone').value);
        const right = parseInt(document.getElementById('rightDeadzone').value);
        
        document.getElementById('leftDeadzoneValue').textContent = left + '%';
        document.getElementById('rightDeadzoneValue').textContent = right + '%';
        
        this.controller.setDeadzone(left, right);
    }

    startRecording() {
        this.recording = true;
        this.recordedData = [];
        document.getElementById('recordStatus').textContent = '记录中...';
        document.getElementById('recordBtn').disabled = true;
        document.getElementById('stopRecordBtn').disabled = false;
        document.getElementById('playbackBtn').disabled = true;
    }

    stopRecording() {
        this.recording = false;
        document.getElementById('recordStatus').textContent = '已停止';
        document.getElementById('recordBtn').disabled = false;
        document.getElementById('stopRecordBtn').disabled = true;
        document.getElementById('playbackBtn').disabled = this.recordedData.length === 0;
    }

    startPlayback() {
        if (this.recordedData.length === 0) return;

        this.playbackIndex = 0;
        document.getElementById('recordStatus').textContent = '回放中...';
        document.getElementById('playbackBtn').disabled = true;
        document.getElementById('stopPlaybackBtn').disabled = false;
        document.getElementById('recordBtn').disabled = true;

        const speed = parseFloat(document.getElementById('playbackSpeed').value);
        const baseInterval = 16;

        this.playbackInterval = setInterval(() => {
            if (this.playbackIndex >= this.recordedData.length) {
                this.stopPlayback();
                return;
            }

            const data = this.recordedData[this.playbackIndex];
            this.updateUI(data.state);
            
            const progress = ((this.playbackIndex + 1) / this.recordedData.length * 100).toFixed(1);
            document.getElementById('playbackProgress').textContent = progress + '%';

            this.playbackIndex++;
        }, baseInterval / speed);
    }

    stopPlayback() {
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }

        document.getElementById('recordStatus').textContent = '已停止';
        document.getElementById('playbackBtn').disabled = false;
        document.getElementById('stopPlaybackBtn').disabled = true;
        document.getElementById('recordBtn').disabled = false;
        document.getElementById('playbackProgress').textContent = '0%';
    }

    updateMouseControl(state) {
        if (!this.mouseControl.enabled) return;

        const { orientation, gyro } = state;
        let dx = 0, dy = 0;

        if (this.mouseControl.useGyro) {
            dx = gyro.y * this.mouseControl.sensitivity * 0.15;
            dy = gyro.x * this.mouseControl.sensitivity * 0.15;
            
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (mag < this.mouseControl.deadzone * 10) {
                const scale = mag / (this.mouseControl.deadzone * 10);
                dx *= scale * scale;
                dy *= scale * scale;
            }
        } else {
            const rollDelta = orientation.roll - this.mouseState.centerRoll;
            const pitchDelta = orientation.pitch - this.mouseState.centerPitch;

            if (Math.abs(rollDelta) > this.mouseControl.deadzone) {
                dx = (rollDelta - Math.sign(rollDelta) * this.mouseControl.deadzone) 
                     * this.mouseControl.sensitivity * 80;
            }

            if (Math.abs(pitchDelta) > this.mouseControl.deadzone) {
                dy = (pitchDelta - Math.sign(pitchDelta) * this.mouseControl.deadzone) 
                     * this.mouseControl.sensitivity * 80;
            }
            
            dx = this.applyAccelerationCurve(dx);
            dy = this.applyAccelerationCurve(dy);
        }

        if (this.mouseControl.reverseY) {
            dy = -dy;
        }

        const smooth = this.mouseControl.smoothing;
        this.mouseState.rawX = dx;
        this.mouseState.rawY = dy;
        
        this.mouseState.x = this.mouseState.x * smooth + dx * (1 - smooth);
        this.mouseState.y = this.mouseState.y * smooth + dy * (1 - smooth);

        this.updateVirtualCursor();
    }

    applyAccelerationCurve(value) {
        const absValue = Math.abs(value);
        const sign = Math.sign(value);
        
        if (absValue < 5) {
            return value * 0.5;
        } else if (absValue < 20) {
            return value;
        } else {
            return sign * (20 + (absValue - 20) * 1.5);
        }
    }

    resetMouseCenter() {
        if (this.controller.state && this.controller.state.orientation) {
            this.mouseState.centerRoll = this.controller.state.orientation.roll;
            this.mouseState.centerPitch = this.controller.state.orientation.pitch;
        }
        this.mouseState.x = 0;
        this.mouseState.y = 0;
        this.updateVirtualCursor();
    }

    updateVirtualCursor() {
        const cursor = document.getElementById('virtualCursor');
        const canvas = document.getElementById('mouseCanvas');
        if (!cursor || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const maxMove = Math.min(centerX, centerY) - 15;
        
        let targetX = centerX + this.mouseState.x;
        let targetY = centerY + this.mouseState.y;

        targetX = Math.max(15, Math.min(rect.width - 15, targetX));
        targetY = Math.max(15, Math.min(rect.height - 15, targetY));

        cursor.style.left = targetX + 'px';
        cursor.style.top = targetY + 'px';
        cursor.style.transform = 'translate(-50%, -50%)';

        document.getElementById('mouseX').textContent = Math.round(this.mouseState.x);
        document.getElementById('mouseY').textContent = Math.round(this.mouseState.y);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.hid) {
        alert('您的浏览器不支持 WebHID API。请使用 Chrome 89+ 或 Edge 89+。');
        return;
    }
    
    window.app = new ControllerApp();
});