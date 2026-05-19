class BikeBluetooth {
    constructor() {
        this.devices = {
            speed: null,
            cadence: null,
            power: null,
            heartRate: null
        };

        this.lastValues = {
            speed: 0,
            cadence: 0,
            power: 0,
            heartRate: null
        };

        this.cscData = {
            lastWheelTime: 0,
            lastWheelRevolutions: 0,
            lastCrankTime: 0,
            lastCrankRevolutions: 0,
            wheelCircumference: 2105
        };

        this.listeners = [];
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(data) {
        this.listeners.forEach(callback => callback(data));
    }

    async connectSpeedSensor() {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['cycling_speed_and_cadence'] }],
                optionalServices: ['device_information']
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('cycling_speed_and_cadence');
            const characteristic = await service.getCharacteristic('csc_measurement');

            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                this.parseCSCMeasurement(event.target.value, 'speed');
            });

            this.devices.speed = { device, server, service, characteristic };
            this.updateSensorStatus('speed', true);
            return true;
        } catch (error) {
            console.error('连接速度传感器失败:', error);
            return false;
        }
    }

    async connectCadenceSensor() {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['cycling_speed_and_cadence'] }],
                optionalServices: ['device_information']
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('cycling_speed_and_cadence');
            const characteristic = await service.getCharacteristic('csc_measurement');

            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                this.parseCSCMeasurement(event.target.value, 'cadence');
            });

            this.devices.cadence = { device, server, service, characteristic };
            this.updateSensorStatus('cadence', true);
            return true;
        } catch (error) {
            console.error('连接踏频传感器失败:', error);
            return false;
        }
    }

    async connectPowerMeter() {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['cycling_power'] }],
                optionalServices: ['device_information']
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('cycling_power');
            const characteristic = await service.getCharacteristic('cycling_power_measurement');

            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                this.parsePowerMeasurement(event.target.value);
            });

            this.devices.power = { device, server, service, characteristic };
            this.updateSensorStatus('power', true);
            return true;
        } catch (error) {
            console.error('连接功率计失败:', error);
            return false;
        }
    }

    async connectHeartRateMonitor() {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],
                optionalServices: ['device_information']
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('heart_rate');
            const characteristic = await service.getCharacteristic('heart_rate_measurement');

            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                this.parseHeartRateMeasurement(event.target.value);
            });

            this.devices.heartRate = { device, server, service, characteristic };
            this.updateSensorStatus('heartRate', true);
            return true;
        } catch (error) {
            console.error('连接心率带失败:', error);
            return false;
        }
    }

    parseCSCMeasurement(value, type) {
        const flags = value.getUint8(0);
        const wheelRevolutionDataPresent = flags & 0x01;
        const crankRevolutionDataPresent = flags & 0x02;

        let offset = 1;

        if (wheelRevolutionDataPresent) {
            const cumulativeWheelRevolutions = value.getUint32(offset, true);
            offset += 4;
            const lastWheelEventTime = value.getUint16(offset, true) / 1024;
            offset += 2;

            if (this.cscData.lastWheelTime > 0 && lastWheelEventTime !== this.cscData.lastWheelTime) {
                let timeDiff = lastWheelEventTime - this.cscData.lastWheelTime;
                if (timeDiff < 0) timeDiff += 64;

                const wheelDiff = cumulativeWheelRevolutions - this.cscData.lastWheelRevolutions;
                const distance = wheelDiff * this.cscData.wheelCircumference / 1000;
                const speedKmh = (distance / timeDiff) * 3.6;

                this.lastValues.speed = Math.max(0, Math.min(speedKmh, 100));
                this.notifyListeners({ type: 'speed', value: this.lastValues.speed });
            }

            this.cscData.lastWheelRevolutions = cumulativeWheelRevolutions;
            this.cscData.lastWheelTime = lastWheelEventTime;
        }

        if (crankRevolutionDataPresent) {
            const cumulativeCrankRevolutions = value.getUint16(offset, true);
            offset += 2;
            const lastCrankEventTime = value.getUint16(offset, true) / 1024;
            offset += 2;

            if (this.cscData.lastCrankTime > 0 && lastCrankEventTime !== this.cscData.lastCrankTime) {
                let timeDiff = lastCrankEventTime - this.cscData.lastCrankTime;
                if (timeDiff < 0) timeDiff += 64;

                const crankDiff = cumulativeCrankRevolutions - this.cscData.lastCrankRevolutions;
                const cadence = (crankDiff / timeDiff) * 60;

                this.lastValues.cadence = Math.round(Math.max(0, Math.min(cadence, 200)));
                this.notifyListeners({ type: 'cadence', value: this.lastValues.cadence });
            }

            this.cscData.lastCrankRevolutions = cumulativeCrankRevolutions;
            this.cscData.lastCrankTime = lastCrankEventTime;
        }
    }

    parsePowerMeasurement(value) {
        const flags = value.getUint16(0, true);
        const power = value.getInt16(2, true);
        this.lastValues.power = Math.max(0, power);
        this.notifyListeners({ type: 'power', value: this.lastValues.power });
    }

    parseHeartRateMeasurement(value) {
        const flags = value.getUint8(0);
        const heartRateFormat = flags & 0x01;

        let heartRate;
        if (heartRateFormat === 0) {
            heartRate = value.getUint8(1);
        } else {
            heartRate = value.getUint16(1, true);
        }

        this.lastValues.heartRate = heartRate;
        this.notifyListeners({ type: 'heartRate', value: heartRate });
    }

    updateSensorStatus(type, connected) {
        const statusEl = document.getElementById(`${type}SensorStatus`);
        if (statusEl) {
            if (connected) {
                statusEl.textContent = '已连接';
                statusEl.className = 'status connected';
            } else {
                statusEl.textContent = '未连接';
                statusEl.className = 'status disconnected';
            }
        }
    }

    disconnect(type) {
        if (this.devices[type] && this.devices[type].device.gatt.connected) {
            this.devices[type].device.gatt.disconnect();
            this.devices[type] = null;
            this.updateSensorStatus(type, false);
        }
    }

    disconnectAll() {
        Object.keys(this.devices).forEach(type => {
            this.disconnect(type);
        });
    }

    getCurrentValues() {
        return { ...this.lastValues };
    }
}

const bikeBluetooth = new BikeBluetooth();