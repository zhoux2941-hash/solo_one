class ModbusRTU {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.slaveAddress = 1;
        this.timeout = 2000;
        this.responseBuffer = [];
        this.isReading = false;
    }

    calculateCRC(buffer) {
        let crc = 0xFFFF;
        for (let i = 0; i < buffer.length; i++) {
            crc ^= buffer[i];
            for (let j = 0; j < 8; j++) {
                if (crc & 0x0001) {
                    crc = (crc >> 1) ^ 0xA001;
                } else {
                    crc >>= 1;
                }
            }
        }
        return crc;
    }

    buildRequest(slave, functionCode, data) {
        const buffer = new Uint8Array(2 + data.length + 2);
        buffer[0] = slave;
        buffer[1] = functionCode;
        buffer.set(data, 2);
        
        const crc = this.calculateCRC(buffer.slice(0, 2 + data.length));
        buffer[2 + data.length] = crc & 0xFF;
        buffer[2 + data.length + 1] = (crc >> 8) & 0xFF;
        
        return buffer;
    }

    async readHoldingRegisters(startAddress, quantity) {
        const data = new Uint8Array(4);
        data[0] = (startAddress >> 8) & 0xFF;
        data[1] = startAddress & 0xFF;
        data[2] = (quantity >> 8) & 0xFF;
        data[3] = quantity & 0xFF;
        
        const request = this.buildRequest(this.slaveAddress, 0x03, data);
        return this.sendRequest(request);
    }

    async readInputRegisters(startAddress, quantity) {
        const data = new Uint8Array(4);
        data[0] = (startAddress >> 8) & 0xFF;
        data[1] = startAddress & 0xFF;
        data[2] = (quantity >> 8) & 0xFF;
        data[3] = quantity & 0xFF;
        
        const request = this.buildRequest(this.slaveAddress, 0x04, data);
        return this.sendRequest(request);
    }

    async readCoils(startAddress, quantity) {
        const data = new Uint8Array(4);
        data[0] = (startAddress >> 8) & 0xFF;
        data[1] = startAddress & 0xFF;
        data[2] = (quantity >> 8) & 0xFF;
        data[3] = quantity & 0xFF;
        
        const request = this.buildRequest(this.slaveAddress, 0x01, data);
        return this.sendRequest(request);
    }

    async readDiscreteInputs(startAddress, quantity) {
        const data = new Uint8Array(4);
        data[0] = (startAddress >> 8) & 0xFF;
        data[1] = startAddress & 0xFF;
        data[2] = (quantity >> 8) & 0xFF;
        data[3] = quantity & 0xFF;
        
        const request = this.buildRequest(this.slaveAddress, 0x02, data);
        return this.sendRequest(request);
    }

    async writeSingleRegister(address, value) {
        const data = new Uint8Array(4);
        data[0] = (address >> 8) & 0xFF;
        data[1] = address & 0xFF;
        data[2] = (value >> 8) & 0xFF;
        data[3] = value & 0xFF;
        
        const request = this.buildRequest(this.slaveAddress, 0x06, data);
        return this.sendRequest(request);
    }

    async writeSingleCoil(address, value) {
        const data = new Uint8Array(4);
        data[0] = (address >> 8) & 0xFF;
        data[1] = address & 0xFF;
        data[2] = value ? 0xFF : 0x00;
        data[3] = 0x00;
        
        const request = this.buildRequest(this.slaveAddress, 0x05, data);
        return this.sendRequest(request);
    }

    async sendRequest(request) {
        if (!this.writer || !this.reader) {
            throw new Error('串口未连接');
        }

        this.responseBuffer = [];
        
        try {
            await this.writer.write(request);
            
            const response = await this.readResponse();
            this.validateResponse(request, response);
            
            return response;
        } catch (error) {
            this.responseBuffer = [];
            throw error;
        }
    }

    async readResponse() {
        const startTime = Date.now();
        
        while (Date.now() - startTime < this.timeout) {
            try {
                const { value, done } = await Promise.race([
                    this.reader.read(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('读取超时')), 100)
                    )
                ]).catch(() => ({ value: null, done: false }));
                
                if (done) {
                    throw new Error('连接已关闭');
                }
                
                if (value && value.length > 0) {
                    this.responseBuffer.push(...value);
                    
                    const validResponse = this.findValidResponse();
                    if (validResponse) {
                        return validResponse;
                    }
                }
            } catch (e) {
            }
            
            await new Promise(resolve => setTimeout(resolve, 5));
        }
        
        throw new Error('响应超时');
    }

    findValidResponse() {
        const buffer = this.responseBuffer;
        
        if (buffer.length < 5) return null;
        
        for (let start = 0; start <= buffer.length - 5; start++) {
            for (let end = buffer.length; end >= start + 5; end--) {
                const candidate = buffer.slice(start, end);
                
                if (candidate[0] !== this.slaveAddress) continue;
                
                const receivedCRC = (candidate[candidate.length - 1] << 8) | candidate[candidate.length - 2];
                const calculatedCRC = this.calculateCRC(candidate.slice(0, candidate.length - 2));
                
                if (receivedCRC === calculatedCRC) {
                    this.responseBuffer = buffer.slice(end);
                    return new Uint8Array(candidate);
                }
            }
        }
        
        return null;
    }

    validateResponse(request, response) {
        if (response.length < 5) {
            throw new Error('响应长度不足');
        }

        if (response[0] !== this.slaveAddress) {
            throw new Error('从站地址不匹配');
        }

        if (response[1] & 0x80) {
            const exceptionCode = response[2];
            const exceptions = {
                0x01: '非法功能码',
                0x02: '非法数据地址',
                0x03: '非法数据值',
                0x04: '从站设备故障',
                0x05: '确认',
                0x06: '从站设备忙',
                0x08: '存储器奇偶校验错误'
            };
            throw new Error(`Modbus异常: ${exceptions[exceptionCode] || exceptionCode}`);
        }
    }

    parseRegisterValue(buffer, offset, dataFormat) {
        switch (dataFormat) {
            case 'uint16':
                return (buffer[offset] << 8) | buffer[offset + 1];
            case 'int16':
                const val16 = (buffer[offset] << 8) | buffer[offset + 1];
                return val16 > 0x7FFF ? val16 - 0x10000 : val16;
            case 'uint32':
                return (buffer[offset] << 24) | (buffer[offset + 1] << 16) | 
                       (buffer[offset + 2] << 8) | buffer[offset + 3];
            case 'int32':
                const val32 = (buffer[offset] << 24) | (buffer[offset + 1] << 16) | 
                              (buffer[offset + 2] << 8) | buffer[offset + 3];
                return val32 > 0x7FFFFFFF ? val32 - 0x100000000 : val32;
            case 'float':
                const floatBuffer = new ArrayBuffer(4);
                const floatView = new Uint8Array(floatBuffer);
                floatView[0] = buffer[offset + 1];
                floatView[1] = buffer[offset];
                floatView[2] = buffer[offset + 3];
                floatView[3] = buffer[offset + 2];
                return new Float32Array(floatBuffer)[0];
            default:
                return (buffer[offset] << 8) | buffer[offset + 1];
        }
    }

    parseCoilValue(buffer, byteOffset, bitOffset) {
        return (buffer[byteOffset] & (1 << bitOffset)) !== 0;
    }
}
