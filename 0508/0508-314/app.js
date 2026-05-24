class NFCApp {
    constructor() {
        this.nfc = new NFCManager();
        this.currentTag = null;
        this.init();
    }

    init() {
        this.setupNFCListeners();
        this.setupUIListeners();
        this.checkSupport();
    }

    checkSupport() {
        if (!this.nfc.isSupported()) {
            this.updateStatus('error', '您的浏览器不支持 Web NFC');
            this.log('error', 'Web NFC 不受支持，请使用 Chrome for Android 或其他支持 Web NFC 的浏览器');
            this.disableButtons();
        } else {
            this.log('success', 'Web NFC 已准备就绪');
        }
    }

    log(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        this.addLogEntry(type, message, timestamp);
    }

    setupNFCListeners() {
        this.nfc.onTagRead = (tagData) => {
            this.currentTag = tagData;
            this.displayTagInfo(tagData.info);
            this.displayNDEFRecords(tagData.records);
            
            if (this.nfc.isBatchMode) {
                this.updateBatchList();
            }
        };

        this.nfc.onTagWritten = (records) => {
            this.log('success', `成功写入 ${records.length} 条记录`);
        };

        this.nfc.onError = (error) => {
            this.updateStatus('error', error.message);
        };

        this.nfc.onStatusChange = (type, message) => {
            this.updateStatus(type, message);
        };

        this.nfc.onLog = (type, message, timestamp) => {
            this.addLogEntry(type, message, timestamp);
        };
    }

    setupUIListeners() {
        document.getElementById('btnRead').addEventListener('click', () => this.startReading());
        document.getElementById('btnWrite').addEventListener('click', () => this.writeTag());
        document.getElementById('btnFormat').addEventListener('click', () => this.formatTag());
        document.getElementById('btnStop').addEventListener('click', () => this.stopOperations());

        document.getElementById('btnBatchStart').addEventListener('click', () => this.startBatchMode());
        document.getElementById('btnBatchStop').addEventListener('click', () => this.stopBatchMode());
        document.getElementById('btnBatchClear').addEventListener('click', () => this.clearBatchList());

        document.getElementById('btnExport').addEventListener('click', () => this.exportTags());
        document.getElementById('importFile').addEventListener('change', (e) => this.importTags(e));

        document.getElementById('writeType').addEventListener('change', (e) => this.onWriteTypeChange(e));
    }

    onWriteTypeChange(e) {
        const encryptGroup = document.getElementById('encryptKeyGroup');
        encryptGroup.style.display = e.target.value === 'encrypted' ? 'block' : 'none';
    }

    async startReading() {
        try {
            await this.nfc.startReading();
            this.toggleButtons(true);
        } catch (error) {
            this.log('error', `启动扫描失败: ${error.message}`);
        }
    }

    async writeTag() {
        const type = document.getElementById('writeType').value;
        const content = document.getElementById('writeContent').value.trim();
        const lang = document.getElementById('textLang').value.trim() || 'zh';
        const encryptKey = document.getElementById('encryptKey').value.trim();

        if (!content) {
            this.log('warning', '请输入要写入的内容');
            return;
        }

        try {
            this.updateStatus('writing', '准备写入，请将标签靠近设备...');
            
            if (type === 'encrypted') {
                await this.nfc.writeEncrypted(content, encryptKey, { language: lang });
            } else {
                await this.nfc.write(type, content, { language: lang });
            }
        } catch (error) {
            this.log('error', `写入失败: ${error.message}`);
        }
    }

    async formatTag() {
        if (!confirm('确定要格式化标签吗？这将清除所有数据。')) {
            return;
        }

        try {
            this.updateStatus('writing', '准备格式化，请将标签靠近设备...');
            await this.nfc.formatTag();
            this.log('success', '标签格式化成功');
        } catch (error) {
            this.log('error', `格式化失败: ${error.message}`);
        }
    }

    stopOperations() {
        this.nfc.stopAll();
        this.toggleButtons(false);
        this.updateStatus('success', '所有操作已停止');
    }

    async startBatchMode() {
        try {
            await this.nfc.startBatchMode();
            document.getElementById('btnBatchStart').disabled = true;
            document.getElementById('btnBatchStop').disabled = false;
            this.toggleButtons(true);
        } catch (error) {
            this.log('error', `启动批量读取失败: ${error.message}`);
        }
    }

    stopBatchMode() {
        this.nfc.stopBatchMode();
        document.getElementById('btnBatchStart').disabled = false;
        document.getElementById('btnBatchStop').disabled = true;
        this.updateBatchList();
    }

    clearBatchList() {
        this.nfc.clearBatchTags();
        this.updateBatchList();
        this.log('info', '批量列表已清空');
    }

    updateBatchList() {
        const container = document.getElementById('batchList');
        const countEl = document.getElementById('batchCount');
        const tags = this.nfc.batchTags;

        countEl.textContent = tags.length;

        if (tags.length === 0) {
            container.innerHTML = '<p class="empty-state">批量读取列表为空</p>';
            return;
        }

        container.innerHTML = tags.map((tag, index) => `
            <div class="batch-item">
                <div class="batch-item-header">
                    <span class="batch-item-id">#${index + 1} - ${tag.id.substring(0, 12)}...</span>
                    <span class="batch-item-time">${new Date(tag.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="batch-item-content">
                    ${tag.records.map(r => this.getRecordPreview(r)).join('<br>')}
                </div>
            </div>
        `).join('');
    }

    getRecordPreview(record) {
        if (record.text) return `📝 ${record.text.substring(0, 50)}${record.text.length > 50 ? '...' : ''}`;
        if (record.uri) return `🔗 ${record.uri.substring(0, 50)}${record.uri.length > 50 ? '...' : ''}`;
        if (record.title) return `📋 ${record.title.substring(0, 50)}${record.title.length > 50 ? '...' : ''}`;
        return `📦 ${record.recordType} (${record.rawPayload.byteLength} bytes)`;
    }

    displayTagInfo(info) {
        const container = document.getElementById('tagInfo');
        container.innerHTML = `
            <div class="tag-detail">
                <div class="tag-item">
                    <div class="tag-item-label">序列号</div>
                    <div class="tag-item-value">${info.serialNumber}</div>
                </div>
                <div class="tag-item">
                    <div class="tag-item-label">记录数量</div>
                    <div class="tag-item-value">${info.recordCount} 条</div>
                </div>
                <div class="tag-item">
                    <div class="tag-item-label">数据大小</div>
                    <div class="tag-item-value">${info.totalBytes} 字节</div>
                </div>
                <div class="tag-item">
                    <div class="tag-item-label">读取时间</div>
                    <div class="tag-item-value">${info.readAt}</div>
                </div>
            </div>
        `;
    }

    displayNDEFRecords(records) {
        const container = document.getElementById('ndefRecords');

        if (records.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无NDEF记录</p>';
            return;
        }

        container.innerHTML = records.map((record, index) => `
            <div class="record-card" id="record-${index}">
                <div class="record-type">${this.getRecordTypeIcon(record)} ${record.recordType}</div>
                <div class="record-content" id="record-content-${index}">${this.getRecordContent(record)}</div>
                ${record.isEncrypted ? this.getDecryptUI(record, index) : ''}
                ${this.getRecordMeta(record)}
            </div>
        `).join('');
    }

    getDecryptUI(record, index) {
        return `
            <div style="margin-top: 10px; padding: 10px; background: #e3f2fd; border-radius: 6px;">
                <div style="margin-bottom: 8px;">
                    <input type="password" id="decrypt-key-${index}" class="form-control" 
                           placeholder="输入解密密钥" style="margin-bottom: 5px;">
                </div>
                <button onclick="nfcApp.decryptRecord(${index})" class="btn" 
                        style="background: #2196f3; color: white; padding: 6px 12px; font-size: 14px;">
                    🔑 解密
                </button>
                <div id="decrypt-result-${index}" style="margin-top: 8px; display: none;"></div>
            </div>
        `;
    }

    async decryptRecord(index) {
        const keyInput = document.getElementById(`decrypt-key-${index}`);
        const resultEl = document.getElementById(`decrypt-result-${index}`);
        const password = keyInput.value.trim();

        if (!password) {
            resultEl.textContent = '请输入密钥';
            resultEl.style.color = '#dc3545';
            resultEl.style.display = 'block';
            return;
        }

        const record = this.currentTag.records[index];
        resultEl.textContent = '正在解密...';
        resultEl.style.color = '#6c757d';
        resultEl.style.display = 'block';

        const result = await this.nfc.decryptRecord(record, password);

        if (result.success) {
            resultEl.innerHTML = `<span style="color: #28a745;">✅ 解密成功</span><br><br>
                                  <div style="background: white; padding: 8px; border-radius: 4px; 
                                              font-family: monospace; word-break: break-all;">
                                    ${this.escapeHtml(result.plaintext)}
                                  </div>`;
            this.log('success', '解密成功');
        } else {
            resultEl.textContent = `❌ ${result.error}`;
            resultEl.style.color = '#dc3545';
            this.log('error', `解密失败: ${result.error}`);
        }
    }

    getRecordTypeIcon(record) {
        if (record.isEncrypted) return '🔐';
        switch (record.recordType) {
            case 'Text': return '📝';
            case 'URI': return '🔗';
            case 'Smart Poster': return '📋';
            case 'MIME': return '📦';
            default: return '📄';
        }
    }

    getRecordContent(record) {
        if (record.parseError) {
            return `<span style="color: #dc3545;">解析错误: ${record.parseError}</span>`;
        }

        if (record.text) {
            return this.escapeHtml(record.text);
        }

        if (record.uri) {
            return `<a href="${this.escapeHtml(record.uri)}" target="_blank" style="color: #667eea;">${this.escapeHtml(record.uri)}</a>`;
        }

        if (record.title || record.recordType === 'Smart Poster') {
            let content = [];
            if (record.title) content.push(`标题: ${this.escapeHtml(record.title)}`);
            if (record.uri) content.push(`链接: <a href="${this.escapeHtml(record.uri)}" target="_blank" style="color: #667eea;">${this.escapeHtml(record.uri)}</a>`);
            if (record.action) content.push(`动作: ${record.action.name}`);
            if (record.size !== null) content.push(`大小: ${record.size} 字节`);
            return content.join('<br>');
        }

        if (record.payload) {
            return `十六进制数据: ${record.payload}`;
        }

        return '(无内容)';
    }

    getRecordMeta(record) {
        const meta = [];
        
        if (record.language) {
            meta.push(`语言: ${record.language}`);
        }
        if (record.encoding) {
            meta.push(`编码: ${record.encoding}`);
        }
        if (record.mimeType) {
            meta.push(`MIME: ${record.mimeType}`);
        }
        if (record.rawPayload) {
            meta.push(`大小: ${record.rawPayload.byteLength} 字节`);
        }

        if (meta.length === 0) return '';
        
        return `<div class="record-meta">${meta.join(' | ')}</div>`;
    }

    exportTags() {
        const tags = this.nfc.batchTags.length > 0 
            ? this.nfc.batchTags 
            : (this.currentTag ? [this.currentTag] : []);

        if (tags.length === 0) {
            this.log('warning', '没有可导出的数据');
            return;
        }

        this.nfc.exportTagsToJSON(tags);
    }

    async importTags(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const data = await this.nfc.importTagsFromJSON(file);
            this.updateBatchList();
            
            if (data.length > 0) {
                document.getElementById('btnBatchStart').disabled = true;
                document.getElementById('btnBatchStop').disabled = false;
            }
        } catch (error) {
            this.log('error', `导入失败: ${error.message}`);
        }

        event.target.value = '';
    }

    updateStatus(type, message) {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');

        indicator.className = 'status-indicator ' + type;
        text.textContent = message;
    }

    addLogEntry(type, message, timestamp) {
        const container = document.getElementById('logs');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-type-${type}">[${type.toUpperCase()}]</span>
            ${this.escapeHtml(message)}
        `;
        container.insertBefore(entry, container.firstChild);

        while (container.children.length > 50) {
            container.removeChild(container.lastChild);
        }
    }

    toggleButtons(isActive) {
        document.getElementById('btnRead').disabled = isActive;
        document.getElementById('btnStop').disabled = !isActive;
    }

    disableButtons() {
        const buttons = document.querySelectorAll('.btn:not(#btnExport)');
        buttons.forEach(btn => btn.disabled = true);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let nfcApp;
document.addEventListener('DOMContentLoaded', () => {
    nfcApp = new NFCApp();
});