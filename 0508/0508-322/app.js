class DroneController {
    constructor() {
        this.webRTC = new WebRTCManager();
        this.leftJoystick = null;
        this.rightJoystick = null;
        this.throttle = 0;
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0;
        this.controlInterval = null;
        this.controlRate = 50;
        
        this.followMode = false;
        this.followAltitude = 2.0;
        this.followDistance = 3.0;
        this.phonePosition = { x: 0, y: 0 };
        this.simulatedPosition = { x: 0, y: 0 };
        this.simulateInterval = null;

        this.init();
    }

    init() {
        this.initJoysticks();
        this.initEventListeners();
        this.setupWebRTCCallbacks();
        this.startControlLoop();
    }

    initJoysticks() {
        this.leftJoystick = new Joystick('leftJoystick', 'leftStick', (x, y) => {
            this.yaw = x;
            this.throttle = y;
            this.updateJoystickDisplay();
        });

        this.rightJoystick = new Joystick('rightJoystick', 'rightStick', (x, y) => {
            this.roll = x;
            this.pitch = y;
            this.updateJoystickDisplay();
        });
    }

    updateJoystickDisplay() {
        document.getElementById('throttleValue').textContent = this.throttle;
        document.getElementById('yawValue').textContent = this.yaw;
        document.getElementById('pitchValue').textContent = this.pitch;
        document.getElementById('rollValue').textContent = this.roll;
    }

    initEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        document.getElementById('takeoffBtn').addEventListener('click', () => this.takeoff());
        document.getElementById('landBtn').addEventListener('click', () => this.land());
        document.getElementById('returnBtn').addEventListener('click', () => this.returnToHome());
        document.getElementById('followBtn').addEventListener('click', () => this.toggleFollowMode());
        
        document.getElementById('altitudeSlider').addEventListener('input', (e) => {
            this.followAltitude = parseFloat(e.target.value);
            document.getElementById('followAltitude').textContent = this.followAltitude.toFixed(1);
            if (this.followMode) {
                this.sendFollowSettings();
            }
        });
        
        document.getElementById('distanceSlider').addEventListener('input', (e) => {
            this.followDistance = parseFloat(e.target.value);
            document.getElementById('followDistance').textContent = this.followDistance.toFixed(1);
            if (this.followMode) {
                this.sendFollowSettings();
            }
        });

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    setupWebRTCCallbacks() {
        this.webRTC.onDataReceived = (data) => this.handleTelemetry(data);
        this.webRTC.onConnected = () => this.onConnected();
        this.webRTC.onDisconnected = () => this.onDisconnected();
    }

    startControlLoop() {
        if (this.controlInterval) {
            clearInterval(this.controlInterval);
        }
        this.controlInterval = setInterval(() => {
            this.sendControlCommand();
        }, this.controlRate);
    }

    sendControlCommand() {
        if (this.webRTC.dataChannel && this.webRTC.dataChannel.readyState === 'open') {
            this.webRTC.sendControlCommand(
                this.throttle,
                this.yaw,
                this.pitch,
                this.roll
            );
        }
    }

    handleTelemetry(data) {
        if (data.type === 'telemetry') {
            this.updateTelemetryDisplay(data);
        }
    }

    updateTelemetryDisplay(data) {
        if (data.altitude !== undefined) {
            document.getElementById('altitude').textContent = data.altitude.toFixed(1);
        }
        if (data.speed !== undefined) {
            document.getElementById('speed').textContent = data.speed.toFixed(1);
        }
        if (data.battery !== undefined) {
            document.getElementById('battery').textContent = data.battery.toFixed(1);
        }
        if (data.satellites !== undefined) {
            document.getElementById('satellites').textContent = data.satellites;
        }
        if (data.positionError !== undefined) {
            document.getElementById('posError').textContent = data.positionError.toFixed(2);
        }

        const batteryEl = document.getElementById('battery');
        if (data.battery < 11.0) {
            batteryEl.style.color = '#ff4444';
        } else if (data.battery < 11.5) {
            batteryEl.style.color = '#ffaa00';
        } else {
            batteryEl.style.color = '#00ff88';
        }
    }

    async connect() {
        try {
            const offerStr = prompt('请粘贴无人机发射端的SDP Offer:');
            if (!offerStr) return;
            
            const offer = JSON.parse(offerStr);
            
            await this.webRTC.createConnection(false);
            await this.webRTC.setRemoteDescription(offer);
            
            const answer = await this.webRTC.createAnswer();
            
            console.log('SDP Answer created. Please share this with the drone:');
            console.log(JSON.stringify(answer));
            
            alert('请将以下SDP Answer复制到无人机发射端:\n\n' + JSON.stringify(answer));
            
        } catch (error) {
            console.error('Connection error:', error);
            alert('连接失败: ' + error.message);
        }
    }

    disconnect() {
        this.webRTC.closeConnection();
    }

    onConnected() {
        document.getElementById('connectBtn').disabled = true;
        document.getElementById('disconnectBtn').disabled = false;
        console.log('Connected to drone!');
    }

    onDisconnected() {
        document.getElementById('connectBtn').disabled = false;
        document.getElementById('disconnectBtn').disabled = true;
        console.log('Disconnected from drone');
    }

    takeoff() {
        console.log('Sending takeoff command');
        this.webRTC.sendActionCommand('takeoff');
    }

    land() {
        console.log('Sending land command');
        this.webRTC.sendActionCommand('land');
    }

    returnToHome() {
        console.log('Sending return to home command');
        this.webRTC.sendActionCommand('return');
        if (this.followMode) {
            this.toggleFollowMode();
        }
    }

    toggleFollowMode() {
        this.followMode = !this.followMode;
        const btn = document.getElementById('followBtn');
        
        if (this.followMode) {
            btn.textContent = '🔴 停止跟随';
            btn.classList.add('active');
            this.startSimulatedMovement();
            this.sendFollowStart();
            console.log('Follow mode started');
        } else {
            btn.textContent = '🔘 开始跟随';
            btn.classList.remove('active');
            this.stopSimulatedMovement();
            this.sendFollowStop();
            console.log('Follow mode stopped');
        }
    }

    sendFollowStart() {
        this.webRTC.sendData({
            type: 'follow_start',
            targetAltitude: this.followAltitude,
            targetDistance: this.followDistance
        });
    }

    sendFollowStop() {
        this.webRTC.sendData({
            type: 'follow_stop'
        });
    }

    sendFollowSettings() {
        this.webRTC.sendData({
            type: 'follow_settings',
            targetAltitude: this.followAltitude,
            targetDistance: this.followDistance
        });
    }

    sendTargetPosition() {
        this.webRTC.sendData({
            type: 'follow_position',
            x: this.phonePosition.x,
            y: this.phonePosition.y
        });
    }

    startSimulatedMovement() {
        if (this.simulateInterval) {
            clearInterval(this.simulateInterval);
        }
        
        let angle = 0;
        this.simulateInterval = setInterval(() => {
            angle += 0.05;
            const radius = 2;
            this.simulatedPosition.x = Math.cos(angle) * radius;
            this.simulatedPosition.y = Math.sin(angle) * radius;
            
            this.phonePosition.x = this.simulatedPosition.x + (Math.random() - 0.5) * 0.2;
            this.phonePosition.y = this.simulatedPosition.y + (Math.random() - 0.5) * 0.2;
            
            document.getElementById('phonePos').textContent = 
                `X: ${this.phonePosition.x.toFixed(2)}, Y: ${this.phonePosition.y.toFixed(2)}`;
            
            this.sendTargetPosition();
        }, 200);
    }

    stopSimulatedMovement() {
        if (this.simulateInterval) {
            clearInterval(this.simulateInterval);
            this.simulateInterval = null;
        }
    }

    handleKeyboard(e) {
        const key = e.key.toLowerCase();
        const step = 20;

        switch (key) {
            case 'w':
                this.throttle = Math.min(100, this.throttle + step);
                break;
            case 's':
                this.throttle = Math.max(-100, this.throttle - step);
                break;
            case 'a':
                this.yaw = Math.max(-100, this.yaw - step);
                break;
            case 'd':
                this.yaw = Math.min(100, this.yaw + step);
                break;
            case 'arrowup':
                this.pitch = Math.min(100, this.pitch + step);
                break;
            case 'arrowdown':
                this.pitch = Math.max(-100, this.pitch - step);
                break;
            case 'arrowleft':
                this.roll = Math.max(-100, this.roll - step);
                break;
            case 'arrowright':
                this.roll = Math.min(100, this.roll + step);
                break;
            case ' ':
                this.throttle = 0;
                this.yaw = 0;
                this.pitch = 0;
                this.roll = 0;
                break;
            default:
                return;
        }

        this.updateJoystickDisplay();
        e.preventDefault();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.droneController = new DroneController();
    console.log('Drone Controller initialized');
});