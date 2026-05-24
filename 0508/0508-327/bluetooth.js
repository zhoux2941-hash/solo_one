class BluetoothGlucoseMeter {
    constructor() {
        this.device = null;
        this.server = null;
        this.brand = null;
        this.glucoseService = null;
        this.glucoseCharacteristic = null;
        this.raccpCharacteristic = null;
        this.collectedReadings = [];
        this.expectedRecords = null;
        this.syncResolve = null;
        this.syncTimeout = null;
    }

    static GLUCOSE_SERVICE_UUID = '00001808-0000-1000-8000-00805f9b34fb';
    static GLUCOSE_MEASUREMENT_UUID = '00002a18-0000-1000-8000-00805f9b34fb';
    static GLUCOSE_FEATURE_UUID = '00002a51-0000-1000-8000-00805f9b34fb';
    static RACP_UUID = '00002a52-0000-1000-8000-00805f9b34fb';

    getServiceFilters(brand) {
        const filters = {
            contour: [
                { namePrefix: 'Contour' },
                { namePrefix: 'CONTOUR' }
            ],
            roche: [
                { namePrefix: 'Accu-Chek' },
                { namePrefix: 'ACCU-CHEK' }
            ],
            yuyue: [
                { namePrefix: 'Yuwell' },
                { namePrefix: 'YUWELL' },
                { namePrefix: '鱼跃' }
            ]
        };

        return filters[brand] || [];
    }

    async connect(brand) {
        this.brand = brand;
        
        const filters = this.getServiceFilters(brand);
        const options = {
            filters: filters.length > 0 ? filters : undefined,
            optionalServices: [BluetoothGlucoseMeter.GLUCOSE_SERVICE_UUID]
        };

        if (filters.length === 0) {
            options.acceptAllDevices = true;
        }

        try {
            this.device = await navigator.bluetooth.requestDevice(options);
            
            this.device.addEventListener('gattserverdisconnected', () => {
                console.log('设备已断开连接');
            });

            this.server = await this.device.gatt.connect();
            this.glucoseService = await this.server.getPrimaryService(BluetoothGlucoseMeter.GLUCOSE_SERVICE_UUID);
            
            try {
                this.glucoseCharacteristic = await this.glucoseService.getCharacteristic(BluetoothGlucoseMeter.GLUCOSE_MEASUREMENT_UUID);
            } catch (e) {
                console.log('获取测量特征失败:', e);
            }

            try {
                this.raccpCharacteristic = await this.glucoseService.getCharacteristic(BluetoothGlucoseMeter.RACP_UUID);
            } catch (e) {
                console.log('获取RACP特征失败:', e);
            }

            return { success: true, deviceName: this.device.name };
        } catch (error) {
            console.error('连接失败:', error);
            return { success: false, error: error.message };
        }
    }

    async startNotifications(callback) {
        if (!this.glucoseCharacteristic) {
            throw new Error('未找到血糖测量特征');
        }

        await this.glucoseCharacteristic.startNotifications();
        this.glucoseCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
            const reading = this.parseGlucoseMeasurement(event.target.value);
            this.collectedReadings.push(reading);
            callback(reading);
            this.checkSyncComplete();
        });
    }

    async startRACPNotifications() {
        if (!this.raccpCharacteristic) return;

        await this.raccpCharacteristic.startNotifications();
        this.raccpCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
            this.parseRACPResponse(event.target.value);
        });
    }

    parseRACPResponse(value) {
        const dataView = new DataView(value.buffer);
        const opCode = dataView.getUint8(0);
        const operator = dataView.getUint8(1);

        if (opCode === 5 && operator === 1) {
            this.expectedRecords = dataView.getUint16(2, true);
            console.log(`预期记录数: ${this.expectedRecords}`);
        }

        if (opCode === 6) {
            console.log('RACP传输完成');
            this.checkSyncComplete();
        }
    }

    checkSyncComplete() {
        if (this.syncResolve) {
            const hasEnoughRecords = this.expectedRecords === null || 
                this.collectedReadings.length >= this.expectedRecords;
            
            if (hasEnoughRecords || this.collectedReadings.length > 0) {
                clearTimeout(this.syncTimeout);
                const resolve = this.syncResolve;
                this.syncResolve = null;
                resolve(this.collectedReadings);
            }
        }
    }

    async syncAllRecords(timeoutMs = 15000) {
        this.collectedReadings = [];
        this.expectedRecords = null;

        await this.startNotifications(() => {});
        await this.startRACPNotifications();

        try {
            await this.getNumberOfRecords();
        } catch (e) {
            console.log('获取记录数失败');
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            await this.requestAllRecords();
        } catch (e) {
            console.log('请求所有记录失败');
        }

        return new Promise((resolve) => {
            this.syncResolve = resolve;
            this.syncTimeout = setTimeout(() => {
                console.log('同步超时，返回已收集的数据');
                if (this.syncResolve) {
                    const resolveFn = this.syncResolve;
                    this.syncResolve = null;
                    resolveFn(this.collectedReadings);
                }
            }, timeoutMs);
        });
    }

    parseGlucoseMeasurement(value) {
        const dataView = new DataView(value.buffer);
        let offset = 0;

        const flags = dataView.getUint8(offset);
        offset += 1;

        const timeOffsetPresent = flags & 0x01;
        const typeAndLocationPresent = flags & 0x02;
        const concentrationUnit = (flags & 0x04) ? 'mmol/L' : 'mg/dL';
        const statusAnnunciationPresent = flags & 0x08;

        const sequenceNumber = dataView.getUint16(offset, true);
        offset += 2;

        const baseTime = this.parseDateTime(dataView, offset);
        offset += 7;

        let timeOffset = 0;
        if (timeOffsetPresent) {
            timeOffset = dataView.getInt16(offset, true);
            offset += 2;
        }

        const timestamp = new Date(baseTime.getTime() + timeOffset * 60000);

        let concentration = null;
        if (concentrationUnit === 'mmol/L') {
            concentration = dataView.getUint16(offset, true) / 1000;
        } else {
            concentration = dataView.getUint16(offset, true) / 1000 * 0.0555;
        }
        offset += 2;

        let type = 'none';
        let location = 'unknown';
        if (typeAndLocationPresent) {
            const typeAndLocation = dataView.getUint8(offset);
            offset += 1;
            
            const typeCode = typeAndLocation & 0x0F;
            const locationCode = (typeAndLocation >> 4) & 0x0F;

            switch (typeCode) {
                case 1: type = 'before_meal'; break;
                case 2: type = 'after_meal'; break;
                case 3: type = 'fasting'; break;
                case 4: type = 'casual'; break;
                default: type = 'none';
            }
        }

        let status = null;
        if (statusAnnunciationPresent) {
            status = dataView.getUint16(offset, true);
            offset += 2;
        }

        return {
            sequenceNumber,
            timestamp: timestamp.getTime(),
            dateTime: timestamp.toISOString(),
            glucoseValue: Math.round(concentration * 10) / 10,
            unit: 'mmol/L',
            type,
            location,
            deviceBrand: this.brand,
            deviceName: this.device?.name
        };
    }

    parseDateTime(dataView, offset) {
        const year = dataView.getUint16(offset, true);
        const month = dataView.getUint8(offset + 2) - 1;
        const day = dataView.getUint8(offset + 3);
        const hours = dataView.getUint8(offset + 4);
        const minutes = dataView.getUint8(offset + 5);
        const seconds = dataView.getUint8(offset + 6);
        
        return new Date(year, month, day, hours, minutes, seconds);
    }

    async requestAllRecords() {
        if (!this.raccpCharacteristic) {
            throw new Error('RACP特征不可用');
        }

        const requestAll = new Uint8Array([0x01, 0x01]);
        await this.raccpCharacteristic.writeValue(requestAll);
    }

    async getNumberOfRecords() {
        if (!this.raccpCharacteristic) {
            throw new Error('RACP特征不可用');
        }

        const getCount = new Uint8Array([0x04, 0x01]);
        await this.raccpCharacteristic.writeValue(getCount);
    }

    disconnect() {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
        }
        this.device = null;
        this.server = null;
        this.glucoseService = null;
        this.glucoseCharacteristic = null;
        this.raccpCharacteristic = null;
    }

    isConnected() {
        return this.device?.gatt?.connected || false;
    }

    generateMockData(count = 50) {
        const readings = [];
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        for (let i = 0; i < count; i++) {
            const daysAgo = Math.floor(Math.random() * 30);
            const hoursAgo = Math.floor(Math.random() * 24);
            const timestamp = now - daysAgo * oneDay - hoursAgo * 60 * 60 * 1000;
            
            const baseGlucose = 5.5 + Math.random() * 4;
            const variation = (Math.random() - 0.5) * 2;
            
            let type = 'none';
            const typeRandom = Math.random();
            if (typeRandom < 0.3) type = 'before_meal';
            else if (typeRandom < 0.6) type = 'after_meal';

            readings.push({
                sequenceNumber: count - i,
                timestamp,
                dateTime: new Date(timestamp).toISOString(),
                glucoseValue: Math.round((baseGlucose + variation) * 10) / 10,
                unit: 'mmol/L',
                type,
                location: 'finger',
                deviceBrand: this.brand || 'mock',
                deviceName: 'Mock Device'
            });
        }

        return readings.sort((a, b) => b.timestamp - a.timestamp);
    }
}

const bluetoothMeter = new BluetoothGlucoseMeter();