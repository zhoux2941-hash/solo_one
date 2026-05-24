class NFCManager {
    constructor() {
        this.reader = null;
        this.writer = null;
        this.isReading = false;
        this.isWriting = false;
        this.isBatchMode = false;
        this.batchTags = [];
        this.onTagRead = null;
        this.onTagWritten = null;
        this.onError = null;
        this.onStatusChange = null;
        this.retryCount = 5;
        this.retryDelay = 300;
        this.writeTimeout = 15000;
        this.lastTagFingerprint = null;
        this.lastReadTime = 0;
        this.readCooldown = 2000;
        this.batchTagMap = new Map();
    }

    isSupported() {
        return 'NDEFReader' in window;
    }

    async startReading() {
        if (!this.isSupported()) {
            throw new Error('Web NFC is not supported in this browser');
        }

        if (this.isReading) {
            return;
        }

        try {
            this.reader = new NDEFReader();
            this.reader.onreading = (event) => this.handleReading(event);
            this.reader.onreadingerror = (event) => this.handleReadingError(event);

            await this.reader.scan();
            this.isReading = true;
            this.updateStatus('reading', '等待扫描NFC标签...');
            this.log('success', 'NFC扫描已启动，请将标签靠近设备');
        } catch (error) {
            this.log('error', `启动NFC扫描失败: ${error.message}`);
            throw error;
        }
    }

    async stopReading() {
        if (this.reader) {
            this.isReading = false;
            this.reader = null;
            this.updateStatus('success', '扫描已停止');
            this.log('info', 'NFC扫描已停止');
        }
    }

    async startBatchMode() {
        this.isBatchMode = true;
        this.batchTags = [];
        this.batchTagMap.clear();
        this.lastTagFingerprint = null;
        this.log('info', '批量读取模式已启动');
        await this.startReading();
    }

    stopBatchMode() {
        this.isBatchMode = false;
        this.stopReading();
        this.log('info', `批量读取结束，共读取 ${this.batchTags.length} 个标签`);
    }

    clearBatchTags() {
        this.batchTags = [];
        this.batchTagMap.clear();
        this.lastTagFingerprint = null;
    }

    generateTagFingerprint(event) {
        const serialNumber = event.serialNumber || '';
        const recordCount = event.message.records.length;
        let contentHash = '';
        
        for (const record of event.message.records) {
            const data = new Uint8Array(record.data);
            contentHash += Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        return `${serialNumber}_${recordCount}_${contentHash.length}`;
    }

    handleReading(event) {
        if (this.isWriting) {
            return;
        }

        const now = Date.now();
        const fingerprint = this.generateTagFingerprint(event);

        if (this.lastTagFingerprint === fingerprint && (now - this.lastReadTime) < this.readCooldown) {
            return;
        }

        this.lastTagFingerprint = fingerprint;
        this.lastReadTime = now;

        const serialNumber = event.serialNumber || this.generateTagId();
        const tagInfo = this.parseTagInfo(event);
        const records = NDEFParser.parseRecords(event.message.records);
        
        const tagData = {
            id: serialNumber,
            fingerprint: fingerprint,
            timestamp: new Date().toISOString(),
            info: tagInfo,
            records: records,
            rawMessage: event.message
        };

        this.log('success', `成功读取标签: ${serialNumber.substring(0, 16)}...`);

        if (this.isBatchMode) {
            if (!this.batchTagMap.has(fingerprint)) {
                this.batchTagMap.set(fingerprint, tagData);
                this.batchTags.push(tagData);
                this.log('info', `标签已添加到批量列表 (${this.batchTags.length})`);
            } else {
                this.log('info', '标签已在列表中，跳过');
            }
        }

        if (this.onTagRead) {
            this.onTagRead(tagData);
        }
    }

    handleReadingError(event) {
        this.log('error', '读取标签失败，请重试');
        if (this.onError) {
            this.onError(new Error('读取标签失败'));
        }
    }

    parseTagInfo(event) {
        const message = event.message;
        return {
            serialNumber: event.serialNumber || '未知',
            recordCount: message.records.length,
            totalBytes: this.calculateMessageSize(message),
            readAt: new Date().toLocaleString()
        };
    }

    calculateMessageSize(message) {
        let total = 0;
        for (const record of message.records) {
            total += record.data.byteLength;
        }
        return total;
    }

    generateTagId() {
        return 'tag_' + Math.random().toString(36).substr(2, 9);
    }

    async writeText(text, language = 'en', options = {}) {
        return this.withRetry(async () => {
            const record = NDEFParser.createTextRecord(text, language);
            return this.writeRecords([record]);
        }, options);
    }

    async writeURI(uri, options = {}) {
        return this.withRetry(async () => {
            const record = NDEFParser.createURIRecord(uri);
            return this.writeRecords([record]);
        }, options);
    }

    async writeEncrypted(text, password, options = {}) {
        if (!password || password.length < 4) {
            throw new Error('密钥长度至少为4位');
        }

        return this.withRetry(async () => {
            this.log('info', '正在加密数据...');
            const encryptedData = await NDEFParser.encryptData(text, password);
            const record = NDEFParser.createEncryptedRecord(encryptedData);
            this.log('success', '数据加密完成');
            return this.writeRecords([record]);
        }, options);
    }

    async decryptRecord(encryptedRecord, password) {
        if (!password) {
            throw new Error('请输入解密密钥');
        }

        try {
            const decrypted = await NDEFParser.decryptData(encryptedRecord.encryptedData, password);
            return {
                success: true,
                plaintext: decrypted
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async withTimeout(promise, ms, message = '操作超时') {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(message)), ms)
            )
        ]);
    }

    async writeRecords(records) {
        if (!this.isSupported()) {
            throw new Error('Web NFC is not supported in this browser');
        }

        this.isWriting = true;
        const wasReading = this.isReading;
        
        try {
            this.writer = new NDEFWriter();

            const ndefRecords = records.map(r => ({
                tnf: r.tnf,
                type: Array.from(r.type),
                data: Array.from(r.data)
            }));

            let totalBytes = 0;
            for (const r of ndefRecords) {
                totalBytes += r.data.length;
            }
            this.log('info', `准备写入 ${ndefRecords.length} 条记录，共 ${totalBytes} 字节`);
            this.updateStatus('writing', '请保持标签靠近设备，正在写入...');

            await this.withTimeout(
                this.writer.write(ndefRecords),
                this.writeTimeout,
                '写入超时，请确保标签稳定靠近设备'
            );

            this.log('success', '数据写入成功！');
            this.updateStatus('success', '写入成功');
            
            if (this.onTagWritten) {
                this.onTagWritten(ndefRecords);
            }

            await this.sleep(500);
            return true;
        } catch (error) {
            this.log('error', `写入失败: ${error.message}`);
            this.updateStatus('error', `写入失败: ${error.message}`);
            throw error;
        } finally {
            this.isWriting = false;
        }
    }

    async formatTag() {
        this.log('info', '准备格式化标签...');
        const emptyRecord = NDEFParser.createEmptyRecord();
        return this.writeRecords([emptyRecord]);
    }

    async withRetry(operation, options = {}) {
        const maxRetries = options.retryCount || this.retryCount;
        const delay = options.retryDelay || this.retryDelay;
        
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.log('info', `尝试操作 (${attempt}/${maxRetries})...`);
                const result = await operation();
                this.log('success', `操作成功 (尝试 ${attempt})`);
                return result;
            } catch (error) {
                lastError = error;
                this.log('warning', `尝试 ${attempt} 失败: ${error.message}`);
                
                if (attempt < maxRetries) {
                    this.log('info', `${delay}ms 后重试...`);
                    await this.sleep(delay);
                }
            }
        }

        this.log('error', `所有 ${maxRetries} 次尝试均失败`);
        throw lastError;
    }

    async write(type, content, options = {}) {
        switch (type) {
            case 'text':
                const lang = options.language || 'zh';
                return this.writeText(content, lang, options);
            case 'url':
                return this.writeURI(content, options);
            default:
                throw new Error(`不支持的写入类型: ${type}`);
        }
    }

    exportTagsToJSON(tags = null) {
        const data = tags || this.batchTags;
        const json = JSON.stringify(data, null, 2);
        
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `nfc_tags_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.log('success', `已导出 ${data.length} 个标签数据`);
    }

    async importTagsFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!Array.isArray(data)) {
                        throw new Error('JSON格式错误：需要数组');
                    }
                    this.batchTags = data;
                    this.log('success', `成功导入 ${data.length} 个标签数据`);
                    resolve(data);
                } catch (error) {
                    this.log('error', `导入失败: ${error.message}`);
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    updateStatus(type, message) {
        if (this.onStatusChange) {
            this.onStatusChange(type, message);
        }
    }

    log(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        if (this.onLog) {
            this.onLog(type, message, timestamp);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stopAll() {
        this.stopReading();
        if (this.isBatchMode) {
            this.stopBatchMode();
        }
        this.isWriting = false;
    }

    destroy() {
        this.stopAll();
        this.onTagRead = null;
        this.onTagWritten = null;
        this.onError = null;
        this.onStatusChange = null;
        this.onLog = null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NFCManager;
}