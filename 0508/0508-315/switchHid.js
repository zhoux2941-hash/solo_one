class SwitchHIDController {
    constructor() {
        this.device = null;
        this.connected = false;
        this.deviceType = 'unknown';
        this.onData = null;
        this.onConnect = null;
        this.onDisconnect = null;
        
        this.calibration = {
            gyroOffset: { x: 0, y: 0, z: 0 },
            leftStick: {
                center: { x: 2048, y: 2048 },
                min: { x: 0, y: 0 },
                max: { x: 4095, y: 4095 }
            },
            rightStick: {
                center: { x: 2048, y: 2048 },
                min: { x: 0, y: 0 },
                max: { x: 4095, y: 4095 }
            },
            leftDeadzone: 0.05,
            rightDeadzone: 0.05
        };
        
        this.state = {
            buttons: {},
            leftStick: { x: 0, y: 0 },
            rightStick: { x: 0, y: 0 },
            gyro: { x: 0, y: 0, z: 0 },
            accel: { x: 0, y: 0, z: 0 },
            orientation: { roll: 0, pitch: 0, yaw: 0 }
        };
        
        this.lastUpdateTime = 0;
        this.complementaryFilterAlpha = 0.98;
        
        this.isCalibratingSticks = false;
        this.stickCalibrationData = {
            left: { minX: 4095, maxX: 0, minY: 4095, maxY: 0, sumX: 0, sumY: 0, count: 0 },
            right: { minX: 4095, maxX: 0, minY: 4095, maxY: 0, sumX: 0, sumY: 0, count: 0 }
        };
        
        this.vibrateTimer = null;
    }

    async connect() {
        try {
            const devices = await navigator.hid.requestDevice({
                filters: [
                    { vendorId: 0x057E, productId: 0x2009 },
                    { vendorId: 0x057E, productId: 0x2007 },
                    { vendorId: 0x057E, productId: 0x2006 },
                    { vendorId: 0x057E, productId: 0x2017 },
                    { vendorId: 0x057E, productId: 0x2019 },
                    { vendorId: 0x057E, productId: 0x200E }
                ]
            });

            if (devices.length === 0) {
                throw new Error('No devices selected');
            }

            this.device = devices[0];
            
            if (this.device.productId === 0x2009) {
                this.deviceType = 'pro-controller';
            } else if (this.device.productId === 0x2007) {
                this.deviceType = 'joycon-left';
            } else if (this.device.productId === 0x2006) {
                this.deviceType = 'joycon-right';
            } else if (this.device.productId === 0x2017) {
                this.deviceType = 'snes';
            } else if (this.device.productId === 0x2019) {
                this.deviceType = 'n64';
            } else if (this.device.productId === 0x200E) {
                this.deviceType = 'switch-adapter';
            }

            await this.device.open();

            this.device.oninputreport = (event) => {
                this.handleInputReport(event);
            };

            this.connected = true;
            
            await this.setInputReportMode(0x30);
            
            await this.enableIMU(true);
            
            await this.enableVibration(true);

            this.lastUpdateTime = performance.now();
            this.state.orientation = { roll: 0, pitch: 0, yaw: 0 };
            
            if (this.onConnect) {
                this.onConnect(this.device);
            }

            return true;
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.device && this.device.opened) {
            await this.device.close();
        }
        this.connected = false;
        this.device = null;
        
        if (this.vibrateTimer) {
            clearTimeout(this.vibrateTimer);
            this.vibrateTimer = null;
        }
        
        if (this.onDisconnect) {
            this.onDisconnect();
        }
    }

    async setInputReportMode(mode) {
        await this.sendSubcommand(0x03, [mode]);
    }

    async enableIMU(enable) {
        await this.sendSubcommand(0x40, [enable ? 0x01 : 0x00]);
    }

    async enableVibration(enable) {
        await this.sendSubcommand(0x48, [enable ? 0x01 : 0x00]);
    }

    handleInputReport(event) {
        const { data, reportId } = event;
        const view = new DataView(data.buffer);
        
        if (reportId === 0x30 || reportId === 0x31 || reportId === 0x32) {
            this.parseStandardInput(view, reportId);
        }
        
        if (this.onData) {
            this.onData(this.state);
        }
    }

    parseStandardInput(view, reportId) {
        const buttonByte1 = view.getUint8(3);
        const buttonByte2 = view.getUint8(4);
        const buttonByte3 = view.getUint8(5);

        this.state.buttons = {
            Y: (buttonByte1 & 0x01) !== 0,
            X: (buttonByte1 & 0x02) !== 0,
            B: (buttonByte1 & 0x04) !== 0,
            A: (buttonByte1 & 0x08) !== 0,
            R: (buttonByte1 & 0x40) !== 0,
            ZR: (buttonByte1 & 0x80) !== 0,
            Minus: (buttonByte2 & 0x01) !== 0,
            Plus: (buttonByte2 & 0x02) !== 0,
            R3: (buttonByte2 & 0x04) !== 0,
            L3: (buttonByte2 & 0x08) !== 0,
            Home: (buttonByte2 & 0x10) !== 0,
            Capture: (buttonByte2 & 0x20) !== 0,
            Down: (buttonByte3 & 0x01) !== 0,
            Up: (buttonByte3 & 0x02) !== 0,
            Right: (buttonByte3 & 0x04) !== 0,
            Left: (buttonByte3 & 0x08) !== 0,
            L: (buttonByte3 & 0x40) !== 0,
            ZL: (buttonByte3 & 0x80) !== 0
        };

        const leftStickX = view.getUint16(6, true);
        const leftStickY = view.getUint16(8, true);
        const rightStickX = view.getUint16(10, true);
        const rightStickY = view.getUint16(12, true);

        if (this.isCalibratingSticks) {
            this.updateStickCalibrationData(leftStickX, leftStickY, rightStickX, rightStickY);
        }

        this.state.leftStick = this.processStick(
            leftStickX, leftStickY,
            this.calibration.leftStick,
            this.calibration.leftDeadzone
        );
        
        this.state.rightStick = this.processStick(
            rightStickX, rightStickY,
            this.calibration.rightStick,
            this.calibration.rightDeadzone
        );

        if (view.byteLength >= 25) {
            this.parseIMU(view);
        }
    }

    processStick(rawX, rawY, stickCalibration, deadzone) {
        const { center, min, max } = stickCalibration;
        
        let x, y;
        
        if (rawX < center.x) {
            x = (rawX - center.x) / (center.x - min.x);
        } else {
            x = (rawX - center.x) / (max.x - center.x);
        }
        
        if (rawY < center.y) {
            y = (rawY - center.y) / (center.y - min.y);
        } else {
            y = (rawY - center.y) / (max.y - center.y);
        }
        
        x = Math.max(-1, Math.min(1, x));
        y = Math.max(-1, Math.min(1, y));
        
        const magnitude = Math.sqrt(x * x + y * y);
        if (magnitude < deadzone) {
            return { x: 0, y: 0 };
        }
        
        const scale = (magnitude - deadzone) / (1 - deadzone);
        const normalizedX = (x / magnitude) * scale;
        const normalizedY = (y / magnitude) * scale;
        
        return {
            x: Math.max(-1, Math.min(1, normalizedX)),
            y: Math.max(-1, Math.min(1, normalizedY))
        };
    }

    parseIMU(view) {
        const imuScale = 1.0 / 4096.0;
        const gyroScale = (Math.PI / 180.0) * (936.0 / 4096.0);
        
        const accelX = view.getInt16(14, true) * imuScale;
        const accelY = view.getInt16(16, true) * imuScale;
        const accelZ = view.getInt16(18, true) * imuScale;
        
        const gyroX = view.getInt16(20, true) * gyroScale;
        const gyroY = view.getInt16(22, true) * gyroScale;
        const gyroZ = view.getInt16(24, true) * gyroScale;
        
        const rawGyroX = gyroX + this.calibration.gyroOffset.x;
        const rawGyroY = gyroY + this.calibration.gyroOffset.y;
        const rawGyroZ = gyroZ + this.calibration.gyroOffset.z;
        
        this.state.accel = {
            x: accelX,
            y: accelY,
            z: accelZ
        };
        
        this.state.gyro = {
            x: gyroX - this.calibration.gyroOffset.x,
            y: gyroY - this.calibration.gyroOffset.y,
            z: gyroZ - this.calibration.gyroOffset.z
        };
        
        const now = performance.now();
        const dt = (now - this.lastUpdateTime) / 1000.0;
        this.lastUpdateTime = now;
        
        if (dt > 0 && dt < 0.1) {
            this.updateOrientation(rawGyroX, rawGyroY, rawGyroZ, accelX, accelY, accelZ, dt);
        }
    }

    updateOrientation(gyroX, gyroY, gyroZ, accelX, accelY, accelZ, dt) {
        const accPitch = Math.atan2(accelY, Math.sqrt(accelX * accelX + accelZ * accelZ));
        const accRoll = Math.atan2(-accelX, accelZ);
        
        const gyroRoll = this.state.orientation.roll + gyroX * dt;
        const gyroPitch = this.state.orientation.pitch + gyroY * dt;
        const gyroYaw = this.state.orientation.yaw + gyroZ * dt;
        
        const accMagnitude = Math.sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);
        const trust = Math.max(0, 1 - Math.abs(1 - accMagnitude) * 2);
        
        const alpha = this.complementaryFilterAlpha * trust;
        
        this.state.orientation.roll = alpha * gyroRoll + (1 - alpha) * accRoll;
        this.state.orientation.pitch = alpha * gyroPitch + (1 - alpha) * accPitch;
        this.state.orientation.yaw = gyroYaw;
    }

    async sendSubcommand(subcommand, data = []) {
        if (!this.device || !this.device.opened) return;
        
        const report = new Uint8Array(0x40);
        report[0] = 0x01;
        report[1] = 0x00;
        report[10] = subcommand;
        report.set(data, 11);
        
        await this.device.sendReport(0x01, report);
    }

    async vibrate(leftFreq = 160, leftAmp = 0.5, rightFreq = 320, rightAmp = 0.5, duration = 500) {
        if (!this.device || !this.device.opened) return;
        
        const leftData = this.encodeVibration(leftFreq, leftAmp);
        const rightData = this.encodeVibration(rightFreq, rightAmp);
        
        const report = new Uint8Array(0x40);
        report[0] = 0x10;
        report.set(leftData, 1);
        report.set(rightData, 5);
        
        await this.device.sendReport(0x10, report);
        
        if (this.vibrateTimer) {
            clearTimeout(this.vibrateTimer);
        }
        
        this.vibrateTimer = setTimeout(async () => {
            const stopReport = new Uint8Array(0x40);
            stopReport[0] = 0x10;
            stopReport.set(this.encodeVibration(0, 0), 1);
            stopReport.set(this.encodeVibration(0, 0), 5);
            await this.device.sendReport(0x10, stopReport);
        }, duration);
    }

    encodeVibration(frequency, amplitude) {
        if (frequency === 0 || amplitude === 0) {
            return new Uint8Array([0x00, 0x00, 0x00, 0x00]);
        }
        
        const clampedFreq = Math.max(40, Math.min(1252, frequency));
        const clampedAmp = Math.max(0, Math.min(1, amplitude));
        
        const hf = Math.round(Math.log2(clampedFreq / 10.0) * 32.0);
        const hfClamped = Math.max(0, Math.min(255, hf));
        
        let lf = Math.round((clampedFreq - 10) * 32);
        lf = Math.max(0, Math.min(1023, lf));
        
        let amp = Math.round(Math.pow(clampedAmp, 0.5) * 1023);
        amp = Math.max(0, Math.min(1023, amp));
        
        const result = new Uint8Array(4);
        result[0] = hfClamped;
        result[1] = ((amp & 0x380) >> 4) | (lf & 0x0F);
        result[2] = (lf >> 4) & 0x3F;
        result[3] = amp & 0x7F;
        
        return result;
    }

    calibrateGyro() {
        let samples = 0;
        const maxSamples = 200;
        let sumX = 0, sumY = 0, sumZ = 0;
        
        return new Promise((resolve) => {
            const handler = (state) => {
                sumX += state.gyro.x + this.calibration.gyroOffset.x;
                sumY += state.gyro.y + this.calibration.gyroOffset.y;
                sumZ += state.gyro.z + this.calibration.gyroOffset.z;
                samples++;
                
                if (samples >= maxSamples) {
                    this.calibration.gyroOffset.x = sumX / maxSamples;
                    this.calibration.gyroOffset.y = sumY / maxSamples;
                    this.calibration.gyroOffset.z = sumZ / maxSamples;
                    
                    this.state.orientation.yaw = 0;
                    
                    resolve();
                }
            };
            
            const originalHandler = this.onData;
            this.onData = (state) => {
                handler(state);
                if (originalHandler) originalHandler(state);
            };
            
            setTimeout(() => {
                this.onData = originalHandler;
                if (samples < maxSamples) {
                    this.calibration.gyroOffset.x = sumX / Math.max(1, samples);
                    this.calibration.gyroOffset.y = sumY / Math.max(1, samples);
                    this.calibration.gyroOffset.z = sumZ / Math.max(1, samples);
                    resolve();
                }
            }, 3000);
        });
    }

    startStickCalibration() {
        this.isCalibratingSticks = true;
        this.stickCalibrationData = {
            left: { minX: 4095, maxX: 0, minY: 4095, maxY: 0, sumX: 0, sumY: 0, count: 0 },
            right: { minX: 4095, maxX: 0, minY: 4095, maxY: 0, sumX: 0, sumY: 0, count: 0 }
        };
    }

    updateStickCalibrationData(leftX, leftY, rightX, rightY) {
        const left = this.stickCalibrationData.left;
        const right = this.stickCalibrationData.right;
        
        left.minX = Math.min(left.minX, leftX);
        left.maxX = Math.max(left.maxX, leftX);
        left.minY = Math.min(left.minY, leftY);
        left.maxY = Math.max(left.maxY, leftY);
        left.sumX += leftX;
        left.sumY += leftY;
        left.count++;
        
        right.minX = Math.min(right.minX, rightX);
        right.maxX = Math.max(right.maxX, rightX);
        right.minY = Math.min(right.minY, rightY);
        right.maxY = Math.max(right.maxY, rightY);
        right.sumX += rightX;
        right.sumY += rightY;
        right.count++;
    }

    finishStickCalibration() {
        this.isCalibratingSticks = false;
        
        const left = this.stickCalibrationData.left;
        const right = this.stickCalibrationData.right;
        
        if (left.count > 0) {
            this.calibration.leftStick.center = {
                x: Math.round(left.sumX / left.count),
                y: Math.round(left.sumY / left.count)
            };
            this.calibration.leftStick.min = {
                x: left.minX,
                y: left.minY
            };
            this.calibration.leftStick.max = {
                x: left.maxX,
                y: left.maxY
            };
        }
        
        if (right.count > 0) {
            this.calibration.rightStick.center = {
                x: Math.round(right.sumX / right.count),
                y: Math.round(right.sumY / right.count)
            };
            this.calibration.rightStick.min = {
                x: right.minX,
                y: right.minY
            };
            this.calibration.rightStick.max = {
                x: right.maxX,
                y: right.maxY
            };
        }
    }

    calibrateStickCenter() {
        let samples = 0;
        const maxSamples = 100;
        let leftSumX = 0, leftSumY = 0;
        let rightSumX = 0, rightSumY = 0;
        
        return new Promise((resolve) => {
            const handler = () => {
            };
            
            resolve();
        });
    }

    setDeadzone(left, right) {
        this.calibration.leftDeadzone = Math.max(0, Math.min(1, left / 100));
        this.calibration.rightDeadzone = Math.max(0, Math.min(1, right / 100));
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    resetOrientation() {
        this.state.orientation = { roll: 0, pitch: 0, yaw: 0 };
    }
}