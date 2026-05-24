class BodyScaleBluetooth {
    constructor() {
        this.device = null;
        this.server = null;
        this.weightService = null;
        this.weightCharacteristic = null;
        this.bodyCompositionService = null;
        this.bodyCompositionCharacteristic = null;
        this.onDataReceived = null;
        this.onConnectionChanged = null;
    }

    isSupported() {
        return navigator.bluetooth !== undefined;
    }

    async connect() {
        if (!this.isSupported()) {
            throw new Error('Web Bluetooth is not supported in this browser');
        }

        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['weight_scale'] },
                    { services: ['body_composition'] }
                ],
                optionalServices: ['weight_scale', 'body_composition', 'device_information']
            });

            this.device.addEventListener('gattserverdisconnected', () => {
                this.handleDisconnection();
            });

            this.server = await this.device.gatt.connect();
            await this.discoverServices();
            this.handleConnection();
            return true;
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    }

    async discoverServices() {
        try {
            this.weightService = await this.server.getPrimaryService('weight_scale');
            this.weightCharacteristic = await this.weightService.getCharacteristic('weight_measurement');
            await this.weightCharacteristic.startNotifications();
            this.weightCharacteristic.addEventListener('characteristicvaluechanged', 
                (event) => this.handleWeightMeasurement(event)
            );
        } catch (e) {
            console.log('Weight scale service not available:', e);
        }

        try {
            this.bodyCompositionService = await this.server.getPrimaryService('body_composition');
            this.bodyCompositionCharacteristic = await this.bodyCompositionService.getCharacteristic('body_composition_measurement');
            await this.bodyCompositionCharacteristic.startNotifications();
            this.bodyCompositionCharacteristic.addEventListener('characteristicvaluechanged',
                (event) => this.handleBodyComposition(event)
            );
        } catch (e) {
            console.log('Body composition service not available:', e);
        }
    }

    handleWeightMeasurement(event) {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const weightUnit = flags & 0x01 ? 'lb' : 'kg';
        let weight = value.getUint16(1, true) / 100;

        if (weightUnit === 'lb') {
            weight = weight * 0.453592;
        }

        const data = {
            weight: Math.round(weight * 10) / 10,
            timestamp: Date.now()
        };

        if (this.onDataReceived) {
            this.onDataReceived(data);
        }
    }

    handleBodyComposition(event) {
        const value = event.target.value;
        const flags = value.getUint16(0, true);
        let offset = 2;

        const data = {};

        if (flags & 0x01) {
            data.bodyFat = value.getUint16(offset, true) / 10;
            offset += 2;
        }

        if (flags & 0x04) {
            data.muscle = value.getUint16(offset, true) / 10;
            offset += 2;
        }

        if (flags & 0x08) {
            data.bone = value.getUint16(offset, true) / 10;
            offset += 2;
        }

        if (flags & 0x20) {
            data.water = value.getUint16(offset, true) / 10;
            offset += 2;
        }

        if (this.onDataReceived) {
            this.onDataReceived(data);
        }
    }

    handleConnection() {
        if (this.onConnectionChanged) {
            this.onConnectionChanged(true);
        }
    }

    handleDisconnection() {
        this.device = null;
        this.server = null;
        this.weightService = null;
        this.weightCharacteristic = null;
        this.bodyCompositionService = null;
        this.bodyCompositionCharacteristic = null;

        if (this.onConnectionChanged) {
            this.onConnectionChanged(false);
        }
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
    }

    isConnected() {
        return this.device && this.device.gatt.connected;
    }

    simulateMeasurement() {
        const baseWeight = 65 + Math.random() * 10;
        const bodyFat = Math.round((20 + Math.random() * 10) * 10) / 10;
        const muscle = Math.round((baseWeight * 0.35) * 10) / 10;
        const bmr = Math.round(1200 + Math.random() * 500);

        let fatMass = baseWeight * bodyFat / 100;
        let muscleRatio = muscle / baseWeight * 100;
        let expectedBmr = muscle * 22 + fatMass * 5 + (baseWeight - muscle - fatMass) * 1;
        let bmrRatio = bmr / expectedBmr;
        
        let fatScore = Math.max(0, Math.min(100, bodyFat * 3));
        let muscleScore = Math.max(0, Math.min(100, 100 - muscleRatio * 1.5));
        let bmrScore = Math.max(0, Math.min(100, (1 - bmrRatio) * 150));
        
        let baseAge = 30;
        let ageAdjustment = (fatScore * 0.3 + muscleScore * 0.4 + bmrScore * 0.3) / 100 * 40;
        let metabolicAge = Math.round(Math.max(18, Math.min(80, baseAge + ageAdjustment)));

        const data = {
            weight: Math.round(baseWeight * 10) / 10,
            bodyFat: bodyFat,
            muscle: muscle,
            water: Math.round((50 + Math.random() * 10) * 10) / 10,
            bone: Math.round((2.5 + Math.random() * 1) * 10) / 10,
            bmr: bmr,
            metabolicAge: metabolicAge
        };

        if (this.onDataReceived) {
            this.onDataReceived(data);
        }

        return data;
    }
}

const bluetooth = new BodyScaleBluetooth();