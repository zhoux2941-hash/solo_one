class GlucoseDatabase {
    constructor() {
        this.dbName = 'GlucoseMonitorDB';
        this.dbVersion = 2;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('readings')) {
                    const store = db.createObjectStore('readings', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('deviceId', 'deviceId', { unique: false });
                    store.createIndex('readingKey', 'readingKey', { unique: true });
                } else {
                    const store = event.target.transaction.objectStore('readings');
                    if (!store.indexNames.contains('readingKey')) {
                        store.createIndex('readingKey', 'readingKey', { unique: true });
                    }
                }

                if (!db.objectStoreNames.contains('devices')) {
                    db.createObjectStore('devices', { keyPath: 'deviceId' });
                }
            };
        });
    }

    async addReading(reading) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['readings'], 'readwrite');
            const store = transaction.objectStore('readings');
            
            const request = store.add({
                ...reading,
                timestamp: reading.timestamp || Date.now()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    generateReadingKey(reading) {
        return `${reading.timestamp}_${reading.glucoseValue}_${reading.sequenceNumber || 0}`;
    }

    async addReadingsBatch(readings) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['readings'], 'readwrite');
            const store = transaction.objectStore('readings');
            let addedCount = 0;
            let duplicateCount = 0;
            let processedCount = 0;

            readings.forEach(reading => {
                const readingKey = this.generateReadingKey(reading);
                const readingWithKey = {
                    ...reading,
                    readingKey,
                    timestamp: reading.timestamp || Date.now()
                };

                const request = store.add(readingWithKey);
                request.onsuccess = () => {
                    addedCount++;
                    processedCount++;
                    if (processedCount === readings.length) {
                        resolve({ added: addedCount, duplicates: duplicateCount });
                    }
                };
                request.onerror = (event) => {
                    event.preventDefault();
                    duplicateCount++;
                    processedCount++;
                    if (processedCount === readings.length) {
                        resolve({ added: addedCount, duplicates: duplicateCount });
                    }
                };
            });
        });
    }

    async getAllReadings() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['readings'], 'readonly');
            const store = transaction.objectStore('readings');
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');
            const readings = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    readings.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(readings);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getReadingsByDateRange(startDate, endDate) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['readings'], 'readonly');
            const store = transaction.objectStore('readings');
            const index = store.index('timestamp');
            
            const keyRange = IDBKeyRange.bound(startDate.getTime(), endDate.getTime());
            const request = index.openCursor(keyRange, 'prev');
            const readings = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    readings.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(readings);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async deleteReading(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['readings'], 'readwrite');
            const store = transaction.objectStore('readings');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllReadings() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['readings'], 'readwrite');
            const store = transaction.objectStore('readings');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async saveDevice(device) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['devices'], 'readwrite');
            const store = transaction.objectStore('devices');
            const request = store.put(device);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getDevice(deviceId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['devices'], 'readonly');
            const store = transaction.objectStore('devices');
            const request = store.get(deviceId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

const db = new GlucoseDatabase();