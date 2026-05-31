class IndexedDB {
    constructor() {
        this.dbName = 'HttpTesterDB';
        this.dbVersion = 2;
        this.db = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('collections')) {
                    const collectionStore = db.createObjectStore('collections', { keyPath: 'id' });
                    collectionStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('requests')) {
                    const requestStore = db.createObjectStore('requests', { keyPath: 'id' });
                    requestStore.createIndex('collectionId', 'collectionId', { unique: false });
                    requestStore.createIndex('order', 'order', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('history')) {
                    const historyStore = db.createObjectStore('history', { keyPath: 'id' });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('environment')) {
                    const envStore = db.createObjectStore('environment', { keyPath: 'id' });
                    envStore.createIndex('key', 'key', { unique: true });
                }
            };
        });
    }

    getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}

class HttpTester {
    constructor() {
        this.db = new IndexedDB();
        this.collections = [];
        this.requests = [];
        this.history = [];
        this.environment = [];
        this.currentHeaders = [];
        this.draggedRequest = null;
        this.init();
    }

    async init() {
        await this.db.init();
        this.loadData();
        this.bindEvents();
        this.addHeaderRow();
    }

    async loadData() {
        this.collections = await this.db.getAll('collections');
        this.requests = await this.db.getAll('requests');
        this.history = await this.db.getAll('history');
        this.environment = await this.db.getAll('environment');
        this.history.sort((a, b) => b.timestamp - a.timestamp);
        this.renderCollections();
        this.renderHistory();
        this.renderEnvironment();
        this.updateCollectionSelect();
    }

    bindEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchSidebarTab(e.target.dataset.tab));
        });

        document.querySelectorAll('.request-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchRequestTab(e.target.dataset.requestTab));
        });

        document.querySelectorAll('.response-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchResponseTab(e.target.dataset.responseTab));
        });

        document.getElementById('send-btn').addEventListener('click', () => this.sendRequest());
        document.getElementById('save-btn').addEventListener('click', () => this.openSaveModal());
        document.getElementById('add-header-btn').addEventListener('click', () => this.addHeaderRow());
        document.getElementById('add-env-btn').addEventListener('click', () => this.addEnvRow());
        document.getElementById('new-collection-btn').addEventListener('click', () => this.openNewCollectionModal());
        document.getElementById('clear-history-btn').addEventListener('click', () => this.clearHistory());
        document.getElementById('collection-search').addEventListener('input', (e) => this.filterCollections(e.target.value));

        document.getElementById('modal-close').addEventListener('click', () => this.closeSaveModal());
        document.getElementById('cancel-save-btn').addEventListener('click', () => this.closeSaveModal());
        document.getElementById('confirm-save-btn').addEventListener('click', () => this.saveRequestToCollection());

        document.getElementById('new-collection-modal-close').addEventListener('click', () => this.closeNewCollectionModal());
        document.getElementById('cancel-new-collection-btn').addEventListener('click', () => this.closeNewCollectionModal());
        document.getElementById('confirm-new-collection-btn').addEventListener('click', () => this.createCollection());

        document.getElementById('url-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendRequest();
        });
    }

    switchSidebarTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
        document.getElementById('collections-tab').classList.toggle('hidden', tab !== 'collections');
        document.getElementById('history-tab').classList.toggle('hidden', tab !== 'history');
    }

    switchRequestTab(tab) {
        document.querySelectorAll('.request-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.requestTab === tab));
        document.getElementById('headers-tab').classList.toggle('hidden', tab !== 'headers');
        document.getElementById('body-tab').classList.toggle('hidden', tab !== 'body');
        document.getElementById('env-tab').classList.toggle('hidden', tab !== 'env');
    }

    switchResponseTab(tab) {
        document.querySelectorAll('.response-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.responseTab === tab));
        document.getElementById('response-body-tab').classList.toggle('hidden', tab !== 'body');
        document.getElementById('response-headers-tab').classList.toggle('hidden', tab !== 'headers');
    }

    addHeaderRow(key = '', value = '') {
        const headersList = document.getElementById('headers-list');
        const headerRow = document.createElement('div');
        headerRow.className = 'header-row';
        headerRow.innerHTML = `
            <input type="text" class="header-key" placeholder="Key" value="${this.escapeHtml(key)}">
            <input type="text" class="header-value" placeholder="Value" value="${this.escapeHtml(value)}">
            <button class="header-delete-btn">删除</button>
        `;
        headerRow.querySelector('.header-delete-btn').addEventListener('click', () => {
            headerRow.remove();
        });
        headersList.appendChild(headerRow);
    }

    getCurrentHeaders() {
        const headers = {};
        document.querySelectorAll('.header-row').forEach(row => {
            const key = row.querySelector('.header-key').value.trim();
            const value = row.querySelector('.header-value').value.trim();
            if (key) {
                headers[key] = value;
            }
        });
        return headers;
    }

    clearHeaders() {
        document.getElementById('headers-list').innerHTML = '';
    }

    addEnvRow(key = '', value = '', id = null) {
        const envList = document.getElementById('env-list');
        const envRow = document.createElement('div');
        envRow.className = 'env-row';
        if (id) envRow.dataset.envId = id;
        envRow.innerHTML = `
            <input type="text" class="env-key" placeholder="变量名 (如: base_url)" value="${this.escapeHtml(key)}">
            <input type="text" class="env-value" placeholder="变量值" value="${this.escapeHtml(value)}">
            <button class="env-delete-btn">删除</button>
        `;
        envRow.querySelector('.env-delete-btn').addEventListener('click', () => {
            if (id) this.deleteEnv(id);
            envRow.remove();
        });
        envRow.querySelectorAll('.env-key, .env-value').forEach(input => {
            input.addEventListener('blur', () => this.saveEnvironment());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.saveEnvironment();
            });
        });
        envList.appendChild(envRow);
    }

    getCurrentEnv() {
        const env = {};
        document.querySelectorAll('.env-row').forEach(row => {
            const key = row.querySelector('.env-key').value.trim();
            const value = row.querySelector('.env-value').value.trim();
            if (key) {
                env[key] = { value: value, id: row.dataset.envId };
            }
        });
        return env;
    }

    async saveEnvironment() {
        const currentEnv = this.getCurrentEnv();
        const newEnv = [];
        
        for (const [key, data] of Object.entries(currentEnv)) {
            const envItem = {
                id: data.id || this.generateId(),
                key: key,
                value: data.value,
                updatedAt: Date.now()
            };
            newEnv.push(envItem);
            await this.db.put('environment', envItem);
        }
        
        const keysToKeep = Object.keys(currentEnv);
        for (const oldEnv of this.environment) {
            if (!keysToKeep.includes(oldEnv.key)) {
                await this.db.delete('environment', oldEnv.id);
            }
        }
        
        this.environment = newEnv;
    }

    clearEnv() {
        document.getElementById('env-list').innerHTML = '';
    }

    renderEnvironment() {
        this.clearEnv();
        if (this.environment.length === 0) {
            this.addEnvRow();
            return;
        }
        for (const env of this.environment) {
            this.addEnvRow(env.key, env.value, env.id);
        }
    }

    async deleteEnv(id) {
        await this.db.delete('environment', id);
        this.environment = this.environment.filter(e => e.id !== id);
    }

    getEnvMap() {
        const envMap = {};
        for (const env of this.environment) {
            envMap[env.key] = env.value;
        }
        const currentEnv = this.getCurrentEnv();
        for (const [key, data] of Object.entries(currentEnv)) {
            envMap[key] = data.value;
        }
        return envMap;
    }

    replaceEnvVariables(text) {
        if (!text) return text;
        const envMap = this.getEnvMap();
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return envMap[key] !== undefined ? envMap[key] : match;
        });
    }

    async sendRequest() {
        await this.saveEnvironment();
        
        const method = document.getElementById('method-select').value;
        const rawUrl = document.getElementById('url-input').value.trim();
        const rawHeaders = this.getCurrentHeaders();
        const rawBody = document.getElementById('body-input').value;

        const url = this.replaceEnvVariables(rawUrl);
        const headers = {};
        for (const [key, value] of Object.entries(rawHeaders)) {
            headers[key] = this.replaceEnvVariables(value);
        }
        const body = this.replaceEnvVariables(rawBody);

        if (!url) {
            alert('请输入请求 URL');
            return;
        }

        const sendBtn = document.getElementById('send-btn');
        const originalText = sendBtn.textContent;
        sendBtn.textContent = '发送中...';
        sendBtn.disabled = true;

        const startTime = Date.now();

        try {
            const options = {
                method: method,
                headers: headers
            };

            if (method !== 'GET' && method !== 'HEAD' && body) {
                options.body = body;
            }

            const response = await fetch(url, options);
            const endTime = Date.now();
            const duration = endTime - startTime;

            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            let responseBody;
            const contentType = response.headers.get('content-type') || '';
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const decoded = new TextDecoder('utf-8').decode(buffer);
            
            if (contentType.includes('application/json')) {
                try {
                    responseBody = JSON.stringify(JSON.parse(decoded), null, 2);
                } catch {
                    responseBody = decoded;
                }
            } else {
                responseBody = decoded;
            }

            this.displayResponse(response.status, response.statusText, responseHeaders, responseBody, duration);
            this.saveToHistory({ method, url, headers, body, timestamp: Date.now() });

        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                errorMessage = '请求失败: 可能是跨域(CORS)限制或网络错误。\n\n' +
                    '提示: 如果接口未开启 CORS，可以尝试:\n' +
                    '1. 使用浏览器插件禁用 CORS 检查\n' +
                    '2. 配置服务端允许跨域\n' +
                    '3. 使用代理服务器转发请求\n\n' +
                    '原始错误: ' + error.message;
            }
            
            this.displayResponse(0, 'Error', {}, errorMessage, duration);
        } finally {
            sendBtn.textContent = originalText;
            sendBtn.disabled = false;
        }
    }

    displayResponse(status, statusText, headers, body, duration) {
        const statusCodeEl = document.getElementById('status-code');
        const statusTextEl = document.getElementById('status-text');
        const responseTimeEl = document.getElementById('response-time');
        const responseBodyEl = document.getElementById('response-body');
        const responseHeadersEl = document.getElementById('response-headers');

        statusCodeEl.textContent = status || '-';
        statusCodeEl.className = 'status-code';
        
        if (status >= 200 && status < 300) {
            statusCodeEl.classList.add('success');
        } else if (status >= 300 && status < 400) {
            statusCodeEl.classList.add('redirect');
        } else if (status >= 400 || status === 0) {
            statusCodeEl.classList.add('error');
        }

        statusTextEl.textContent = statusText || '';
        responseTimeEl.textContent = duration ? `${duration}ms` : '';

        responseBodyEl.textContent = body || '无响应内容';

        responseHeadersEl.innerHTML = '';
        if (Object.keys(headers).length === 0) {
            responseHeadersEl.innerHTML = '<div class="empty-state">无响应头</div>';
        } else {
            for (const [key, value] of Object.entries(headers)) {
                const row = document.createElement('div');
                row.className = 'response-header-row';
                row.innerHTML = `
                    <span class="response-header-key">${this.escapeHtml(key)}</span>
                    <span class="response-header-value">${this.escapeHtml(value)}</span>
                `;
                responseHeadersEl.appendChild(row);
            }
        }
    }

    async saveToHistory(requestData) {
        const historyItem = {
            id: this.generateId(),
            ...requestData
        };

        await this.db.put('history', historyItem);
        
        this.history.unshift(historyItem);
        
        if (this.history.length > 10) {
            const toDelete = this.history.slice(10);
            for (const item of toDelete) {
                await this.db.delete('history', item.id);
            }
            this.history = this.history.slice(0, 10);
        }
        
        this.renderHistory();
    }

    async clearHistory() {
        if (!confirm('确定要清空所有历史记录吗？')) return;
        await this.db.clear('history');
        this.history = [];
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('history-list');
        
        if (this.history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <div>暂无历史记录</div>
                </div>
            `;
            return;
        }

        historyList.innerHTML = '';
        for (const item of this.history) {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span class="request-method method-${item.method}">${item.method}</span>
                <span class="history-url" title="${this.escapeHtml(item.url)}">${this.escapeHtml(item.url)}</span>
                <span class="history-time">${this.formatTime(item.timestamp)}</span>
            `;
            div.addEventListener('click', () => this.loadRequest(item));
            historyList.appendChild(div);
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    openSaveModal() {
        const url = document.getElementById('url-input').value.trim();
        if (!url) {
            alert('请先输入请求 URL');
            return;
        }
        
        document.getElementById('request-name-input').value = url.substring(0, 50);
        this.updateCollectionSelect();
        document.getElementById('save-modal').classList.remove('hidden');
    }

    closeSaveModal() {
        document.getElementById('save-modal').classList.add('hidden');
    }

    openNewCollectionModal() {
        document.getElementById('new-collection-name').value = '';
        document.getElementById('new-collection-modal').classList.remove('hidden');
    }

    closeNewCollectionModal() {
        document.getElementById('new-collection-modal').classList.add('hidden');
    }

    async createCollection() {
        const name = document.getElementById('new-collection-name').value.trim();
        if (!name) {
            alert('请输入集合名称');
            return;
        }

        const collection = {
            id: this.generateId(),
            name: name,
            createdAt: Date.now()
        };

        await this.db.put('collections', collection);
        this.collections.push(collection);
        this.renderCollections();
        this.updateCollectionSelect();
        this.closeNewCollectionModal();
    }

    updateCollectionSelect() {
        const select = document.getElementById('collection-select');
        select.innerHTML = '';
        
        if (this.collections.length === 0) {
            select.innerHTML = '<option value="">暂无集合,请先创建</option>';
            return;
        }

        for (const collection of this.collections) {
            const option = document.createElement('option');
            option.value = collection.id;
            option.textContent = collection.name;
            select.appendChild(option);
        }
    }

    async saveRequestToCollection() {
        const name = document.getElementById('request-name-input').value.trim();
        const collectionId = document.getElementById('collection-select').value;
        
        if (!name) {
            alert('请输入请求名称');
            return;
        }
        
        if (!collectionId) {
            alert('请选择集合');
            return;
        }

        const method = document.getElementById('method-select').value;
        const url = document.getElementById('url-input').value.trim();
        const headers = this.getCurrentHeaders();
        const body = document.getElementById('body-input').value;

        const collectionRequests = this.requests.filter(r => r.collectionId === collectionId);
        const maxOrder = collectionRequests.length > 0 
            ? Math.max(...collectionRequests.map(r => r.order)) 
            : -1;

        const request = {
            id: this.generateId(),
            collectionId: collectionId,
            name: name,
            method: method,
            url: url,
            headers: headers,
            body: body,
            order: maxOrder + 1,
            createdAt: Date.now()
        };

        await this.db.put('requests', request);
        this.requests.push(request);
        this.renderCollections();
        this.closeSaveModal();
    }

    async deleteCollection(collectionId) {
        if (!confirm('确定要删除这个集合吗？其中的所有请求也会被删除。')) return;

        const requestsToDelete = this.requests.filter(r => r.collectionId === collectionId);
        for (const req of requestsToDelete) {
            await this.db.delete('requests', req.id);
        }
        
        await this.db.delete('collections', collectionId);
        
        this.requests = this.requests.filter(r => r.collectionId !== collectionId);
        this.collections = this.collections.filter(c => c.id !== collectionId);
        
        this.renderCollections();
        this.updateCollectionSelect();
    }

    async deleteRequest(requestId) {
        if (!confirm('确定要删除这个请求吗？')) return;
        
        await this.db.delete('requests', requestId);
        this.requests = this.requests.filter(r => r.id !== requestId);
        this.renderCollections();
    }

    renderCollections(filter = '') {
        const collectionsList = document.getElementById('collections-list');
        
        if (this.collections.length === 0) {
            collectionsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <div>暂无集合</div>
                    <div style="margin-top: 8px; font-size: 12px;">点击上方"+ 新建"创建第一个集合</div>
                </div>
            `;
            return;
        }

        const filteredCollections = this.collections.filter(c => 
            c.name.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredCollections.length === 0) {
            collectionsList.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 12px;">未找到匹配的集合</div>
                </div>
            `;
            return;
        }

        collectionsList.innerHTML = '';
        for (const collection of filteredCollections) {
            const collectionRequests = this.requests
                .filter(r => r.collectionId === collection.id)
                .sort((a, b) => a.order - b.order);

            const div = document.createElement('div');
            div.className = 'collection-item';
            div.innerHTML = `
                <div class="collection-header">
                    <span class="collection-toggle">▶</span>
                    <span class="collection-name">${this.escapeHtml(collection.name)}</span>
                    <span class="collection-actions">
                        <button class="collection-delete-btn" title="删除集合">🗑</button>
                    </span>
                </div>
                <div class="collection-requests">
                    ${collectionRequests.length === 0 
                        ? '<div class="empty-state" style="padding: 20px; font-size: 12px;">暂无请求</div>' 
                        : ''}
                </div>
            `;

            const header = div.querySelector('.collection-header');
            const toggle = div.querySelector('.collection-toggle');
            const requestsContainer = div.querySelector('.collection-requests');
            const deleteBtn = div.querySelector('.collection-delete-btn');

            header.addEventListener('click', (e) => {
                if (e.target === deleteBtn || deleteBtn.contains(e.target)) return;
                const isExpanded = requestsContainer.classList.contains('expanded');
                toggle.classList.toggle('expanded', !isExpanded);
                requestsContainer.classList.toggle('expanded', !isExpanded);
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCollection(collection.id);
            });

            for (const req of collectionRequests) {
                const reqDiv = this.createRequestElement(req);
                requestsContainer.appendChild(reqDiv);
            }

            collectionsList.appendChild(div);
        }
    }

    createRequestElement(req) {
        const div = document.createElement('div');
        div.className = 'request-item';
        div.draggable = true;
        div.dataset.requestId = req.id;
        div.innerHTML = `
            <span class="drag-handle">⋮⋮</span>
            <span class="request-method method-${req.method}">${req.method}</span>
            <span class="request-name" title="${this.escapeHtml(req.url)}">${this.escapeHtml(req.name)}</span>
            <span class="request-actions">
                <button class="request-delete-btn" title="删除请求">🗑</button>
            </span>
        `;

        div.addEventListener('click', (e) => {
            if (e.target.closest('.request-delete-btn') || e.target.closest('.drag-handle')) return;
            this.loadRequest(req);
        });

        div.querySelector('.request-delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteRequest(req.id);
        });

        div.addEventListener('dragstart', (e) => {
            this.draggedRequest = req;
            div.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
            this.draggedRequest = null;
            document.querySelectorAll('.request-item').forEach(el => {
                el.classList.remove('drag-over');
            });
        });

        div.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedRequest && this.draggedRequest.id !== req.id && 
                this.draggedRequest.collectionId === req.collectionId) {
                div.classList.add('drag-over');
            }
        });

        div.addEventListener('dragleave', () => {
            div.classList.remove('drag-over');
        });

        div.addEventListener('drop', async (e) => {
            e.preventDefault();
            div.classList.remove('drag-over');
            
            if (!this.draggedRequest || this.draggedRequest.id === req.id) return;
            if (this.draggedRequest.collectionId !== req.collectionId) return;

            await this.reorderRequests(this.draggedRequest, req);
        });

        return div;
    }

    async reorderRequests(draggedReq, targetReq) {
        const collectionId = draggedReq.collectionId;
        let collectionRequests = this.requests
            .filter(r => r.collectionId === collectionId)
            .sort((a, b) => a.order - b.order);

        const draggedIndex = collectionRequests.findIndex(r => r.id === draggedReq.id);
        const targetIndex = collectionRequests.findIndex(r => r.id === targetReq.id);

        if (draggedIndex === -1 || targetIndex === -1) return;

        collectionRequests.splice(draggedIndex, 1);
        collectionRequests.splice(targetIndex, 0, draggedReq);

        for (let i = 0; i < collectionRequests.length; i++) {
            collectionRequests[i].order = i;
            await this.db.put('requests', collectionRequests[i]);
        }

        this.requests = this.requests.filter(r => r.collectionId !== collectionId);
        this.requests.push(...collectionRequests);
        
        this.renderCollections();
    }

    filterCollections(query) {
        this.renderCollections(query);
    }

    loadRequest(req) {
        document.getElementById('method-select').value = req.method;
        document.getElementById('url-input').value = req.url;
        document.getElementById('body-input').value = req.body || '';

        this.clearHeaders();
        if (req.headers && Object.keys(req.headers).length > 0) {
            for (const [key, value] of Object.entries(req.headers)) {
                this.addHeaderRow(key, value);
            }
        } else {
            this.addHeaderRow();
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HttpTester();
});
