class PLCDataBase {
    constructor() {
        this.dbName = 'PLCDataCollector';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('无法打开数据库'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('records')) {
                    const store = db.createObjectStore('records', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('monitorId', 'monitorId', { unique: false });
                }

                if (!db.objectStoreNames.contains('monitors')) {
                    const monitorStore = db.createObjectStore('monitors', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    monitorStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    async addRecord(monitorId, monitorName, value, timestamp = Date.now()) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['records'], 'readwrite');
            const store = transaction.objectStore('records');
            
            const record = {
                monitorId,
                monitorName,
                value,
                timestamp
            };
            
            const request = store.add(record);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getRecordsByMonitorId(monitorId, limit = 1000) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const index = store.index('monitorId');
            
            const records = [];
            const request = index.openCursor(IDBKeyRange.only(monitorId), 'prev');
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && records.length < limit) {
                    records.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(records.reverse());
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async getRecordsByTimeRange(startTime, endTime) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const index = store.index('timestamp');
            
            const records = [];
            const range = IDBKeyRange.bound(startTime, endTime);
            const request = index.openCursor(range);
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    records.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async clearRecords() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['records'], 'readwrite');
            const store = transaction.objectStore('records');
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async exportToCSV() {
        const records = await this.getAllRecords();
        
        if (records.length === 0) {
            throw new Error('没有数据可导出');
        }

        const headers = ['ID', '监控点ID', '监控点名称', '数值', '时间戳', '日期时间'];
        const rows = records.map(r => [
            r.id,
            r.monitorId,
            `"${r.monitorName}"`,
            r.value,
            r.timestamp,
            `"${new Date(r.timestamp).toLocaleString('zh-CN')}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `plc_data_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    async getAllRecords() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const records = [];
            
            const request = store.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    records.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async saveMonitor(monitor) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['monitors'], 'readwrite');
            const store = transaction.objectStore('monitors');
            const request = store.add(monitor);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteMonitor(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['monitors'], 'readwrite');
            const store = transaction.objectStore('monitors');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getMonitors() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['monitors'], 'readonly');
            const store = transaction.objectStore('monitors');
            const monitors = [];
            
            const request = store.openCursor();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    monitors.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(monitors);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }
}
