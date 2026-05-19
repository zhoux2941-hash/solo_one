class WebUSBManager {
    constructor() {
        this.device = null;
        this.interfaceNumber = null;
        this.endpointIn = null;
        this.endpointOut = null;
        this.isConnected = false;
        this.commandQueue = [];
        this.isProcessing = false;
        this.reportId = 0x00;
        this.packetSize = 32;
        this.useHID = false;
        this.hidDevice = null;
    }

    async connect() {
        try {
            if (navigator.hid) {
                this.log('info', '尝试使用 WebHID 连接...');
                const success = await this.connectHID();
                if (success) return true;
            }

            if (!navigator.usb) {
                throw new Error('您的浏览器不支持 WebUSB 或 WebHID，请使用 Chrome 或 Edge');
            }

            this.log('info', '尝试使用 WebUSB 连接...');
            return await this.connectWebUSB();
        } catch (error) {
            if (error.name === 'NotFoundError') {
                this.log('info', '用户取消了设备选择');
            } else {
                this.log('error', `连接失败: ${error.message}`);
            }
            return false;
        }
    }

    async connectHID() {
        try {
            const devices = await navigator.hid.requestDevice({
                filters: [
                    { vendorId: 0x03EB, productId: 0x2042 },
                    { vendorId: 0x03EB, productId: 0x2066 },
                    { vendorId: 0x03EB, productId: 0x201B },
                    { vendorId: 0x16C0, productId: 0x0478 },
                    { vendorId: 0x16C0, productId: 0x047C },
                    { vendorId: 0x16C0, productId: 0x0486 },
                    { vendorId: 0x16C0, productId: 0x0487 },
                    { vendorId: 0xFEED },
                    { usagePage: 0xFF60, usage: 0x61 }
                ]
            });

            if (devices.length === 0) {
                throw new Error('未找到 HID 设备');
            }

            this.hidDevice = devices[0];
            await this.hidDevice.open();

            let foundReport = false;
            for (const collection of this.hidDevice.collections) {
                if (collection.usagePage === 0xFF60 && collection.usage === 0x61) {
                    for (const report of collection.featureReports) {
                        this.reportId = report.reportId || 0x00;
                        this.packetSize = report.items[0]?.reportCount || 32;
                        foundReport = true;
                        this.log('info', `找到 Feature Report: ID=0x${this.reportId.toString(16)}, 大小=${this.packetSize}`);
                        break;
                    }
                }
                if (foundReport) break;
            }

            this.useHID = true;
            this.isConnected = true;
            const productName = this.hidDevice.productName || '未知设备';
            this.log('success', `键盘已连接 (WebHID): ${productName}`);
            this.log('info', `厂商ID: 0x${this.hidDevice.vendorId.toString(16)}, 产品ID: 0x${this.hidDevice.productId.toString(16)}`);
            
            return true;
        } catch (error) {
            this.log('warning', `WebHID 连接失败: ${error.message}`);
            return false;
        }
    }

    async connectWebUSB() {
        this.device = await navigator.usb.requestDevice({
            filters: [
                { vendorId: 0x03EB, productId: 0x2042 },
                { vendorId: 0x03EB, productId: 0x2066 },
                { vendorId: 0x03EB, productId: 0x201B },
                { vendorId: 0x16C0, productId: 0x0478 },
                { vendorId: 0x16C0, productId: 0x047C },
                { vendorId: 0x16C0, productId: 0x0486 },
                { vendorId: 0x16C0, productId: 0x0487 },
                { vendorId: 0xFEED }
            ]
        });

        await this.device.open();
        
        if (this.device.configuration === null) {
            await this.device.selectConfiguration(1);
        }

        const configuration = this.device.configuration;
        let foundInterface = false;

        for (const iface of configuration.interfaces) {
            for (const alt of iface.alternates) {
                if ((alt.interfaceClass === 0x03 && alt.interfaceSubclass === 0x00) ||
                    (alt.interfaceClass === 0xFF && alt.interfaceSubclass === 0x00)) {
                    this.interfaceNumber = iface.interfaceNumber;
                    
                    for (const endpoint of alt.endpoints) {
                        if (endpoint.direction === 'in') {
                            this.endpointIn = endpoint.endpointNumber;
                            this.packetSize = endpoint.packetSize;
                        } else if (endpoint.direction === 'out') {
                            this.endpointOut = endpoint.endpointNumber;
                        }
                    }
                    
                    foundInterface = true;
                    break;
                }
            }
            if (foundInterface) break;
        }

        if (!foundInterface) {
            throw new Error('未找到兼容的 HID 接口');
        }

        try {
            await this.device.claimInterface(this.interfaceNumber);
        } catch (e) {
            console.log('接口可能已被占用，尝试继续...');
        }

        this.useHID = false;
        this.isConnected = true;
        this.log('success', `键盘已连接 (WebUSB): ${this.device.productName}`);
        this.log('info', `厂商ID: 0x${this.device.vendorId.toString(16)}, 产品ID: 0x${this.device.productId.toString(16)}`);
        this.log('info', `数据包大小: ${this.packetSize} 字节`);
        
        return true;
    }

    async disconnect() {
        if (this.useHID && this.hidDevice) {
            try {
                await this.hidDevice.close();
            } catch (e) {
                console.log('关闭 HID 设备时出错:', e);
            }
            this.hidDevice = null;
        } else if (this.device) {
            try {
                await this.device.close();
            } catch (e) {
                console.log('关闭 USB 设备时出错:', e);
            }
            this.device = null;
            this.interfaceNumber = null;
            this.endpointIn = null;
            this.endpointOut = null;
        }
        
        this.isConnected = false;
        this.useHID = false;
        this.log('info', '键盘已断开连接');
    }

    async sendCommand(command, data = []) {
        if (!this.isConnected) {
            throw new Error('设备未连接');
        }

        const packet = this.buildPacket(command, data);
        
        try {
            if (this.useHID) {
                return await this.sendHIDCommand(packet);
            } else {
                return await this.sendUSBCommand(packet);
            }
        } catch (error) {
            this.log('error', `命令发送失败: ${error.message}`);
            throw error;
        }
    }

    async sendHIDCommand(packet) {
        try {
            await this.hidDevice.sendFeatureReport(this.reportId, packet);
            this.log('debug', `发送 Feature Report 成功');
            
            try {
                const response = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        resolve(null);
                    }, 500);
                    
                    const inputReportHandler = (event) => {
                        clearTimeout(timeout);
                        this.hidDevice.removeEventListener('inputreport', inputReportHandler);
                        resolve(event.data);
                    };
                    
                    this.hidDevice.addEventListener('inputreport', inputReportHandler);
                });
                
                if (response) {
                    return this.parseResponse(response);
                }
            } catch (e) {
                this.log('debug', '等待响应超时，假设成功');
            }
            
            return { success: true, data: [] };
        } catch (error) {
            this.log('error', `HID 命令失败: ${error.message}`);
            throw error;
        }
    }

    async sendUSBCommand(packet) {
        try {
            await this.device.transferOut(this.endpointOut, packet);
            
            let response;
            try {
                response = await this.device.transferIn(this.endpointIn, this.packetSize);
            } catch (e) {
                return { success: true, data: [] };
            }
            
            if (response && response.data) {
                return this.parseResponse(response.data);
            }
            
            return { success: true, data: [] };
        } catch (error) {
            this.log('error', `USB 命令失败: ${error.message}`);
            throw error;
        }
    }

    buildPacket(command, data) {
        const packet = new Uint8Array(this.packetSize);
        packet[0] = command;
        
        for (let i = 0; i < Math.min(data.length, this.packetSize - 1); i++) {
            packet[i + 1] = data[i];
        }
        
        return packet;
    }

    parseResponse(dataView) {
        const data = new Uint8Array(dataView.buffer);
        return {
            success: data.length > 0,
            data: data
        };
    }

    async readKeymap(layer, row, col) {
        const response = await this.sendCommand(0x01, [layer, row, col]);
        if (response.success && response.data.length >= 2) {
            return (response.data[0] << 8) | response.data[1];
        }
        return 0;
    }

    async writeKeymap(layer, row, col, keycode) {
        const data = [layer, row, col, (keycode >> 8) & 0xFF, keycode & 0xFF];
        const response = await this.sendCommand(0x02, data);
        return response.success;
    }

    async readMacro(macroIndex) {
        const response = await this.sendCommand(0x05, [macroIndex]);
        if (response.success) {
            return response.data;
        }
        return null;
    }

    async writeMacro(macroIndex, macroData) {
        const data = [macroIndex, ...macroData];
        const response = await this.sendCommand(0x06, data);
        return response.success;
    }

    async saveToEEPROM() {
        const response = await this.sendCommand(0x07, []);
        return response.success;
    }

    async resetEEPROM() {
        const response = await this.sendCommand(0x08, []);
        return response.success;
    }

    async getMatrixInfo() {
        const response = await this.sendCommand(0x09, []);
        if (response.success && response.data.length >= 2) {
            return {
                rows: response.data[0],
                cols: response.data[1],
                layers: response.data[2] || 4
            };
        }
        return { rows: 4, cols: 12, layers: 4 };
    }

    async applyConfig() {
        const response = await this.sendCommand(0x0A, []);
        return response.success;
    }

    log(type, message) {
        const consoleEl = document.getElementById('consoleOutput');
        if (consoleEl) {
            const line = document.createElement('div');
            line.className = `console-line ${type}`;
            const time = new Date().toLocaleTimeString();
            line.textContent = `[${time}] ${message}`;
            consoleEl.appendChild(line);
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    }

    async readRGBConfig() {
        const response = await this.sendCommand(0x03, []);
        if (response.success && response.data.length >= 5) {
            return {
                mode: response.data[0],
                brightness: response.data[1],
                speed: response.data[2],
                hue: response.data[3],
                sat: response.data[4]
            };
        }
        this.log('warning', 'RGB 配置读取不完整，使用默认值');
        return {
            mode: 0,
            brightness: 100,
            speed: 50,
            hue: 180,
            sat: 255
        };
    }

    async writeRGBConfig(config) {
        const data = [
            config.mode,
            config.brightness,
            config.speed,
            config.hue,
            config.sat
        ];
        const response = await this.sendCommand(0x04, data);
        return response.success;
    }
}

const usbManager = new WebUSBManager();