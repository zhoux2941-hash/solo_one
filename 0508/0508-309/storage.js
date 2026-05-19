class RideStorage {
    constructor() {
        this.dbName = 'BikeRideDB';
        this.dbVersion = 1;
        this.db = null;
        this.maxDays = 7;
    }

    getCutoffTime() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.maxDays);
        return cutoff.getTime();
    }

    isRideValid(ride) {
        if (!ride) return false;
        const cutoffTime = this.getCutoffTime();
        return ride.startTime >= cutoffTime;
    }

    async cleanupOldData() {
        const cutoffTime = this.getCutoffTime();
        
        try {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['rides'], 'readonly');
                const store = transaction.objectStore('rides');
                const index = store.index('startTime');
                const range = IDBKeyRange.upperBound(cutoffTime);
                const request = index.getAllKeys(range);
                
                request.onsuccess = async () => {
                    const oldRideIds = request.result;
                    
                    for (const rideId of oldRideIds) {
                        await this.deleteRide(rideId);
                    }
                    
                    resolve(oldRideIds.length);
                };
                
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('清理旧数据失败:', error);
            return 0;
        }
    }

    async getRecentRides() {
        const cutoffTime = this.getCutoffTime();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rides'], 'readonly');
            const store = transaction.objectStore('rides');
            const index = store.index('startTime');
            const range = IDBKeyRange.lowerBound(cutoffTime);
            const request = index.getAll(range);

            request.onsuccess = () => {
                const rides = request.result.sort((a, b) => b.startTime - a.startTime);
                resolve(rides);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = async () => {
                this.db = request.result;
                await this.cleanupOldData();
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('rides')) {
                    const rideStore = db.createObjectStore('rides', { keyPath: 'id', autoIncrement: true });
                    rideStore.createIndex('startTime', 'startTime', { unique: false });
                }

                if (!db.objectStoreNames.contains('rideDataPoints')) {
                    const dataStore = db.createObjectStore('rideDataPoints', { keyPath: 'id', autoIncrement: true });
                    dataStore.createIndex('rideId', 'rideId', { unique: false });
                    dataStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async saveRide(rideData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rides'], 'readwrite');
            const store = transaction.objectStore('rides');
            const request = store.add(rideData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveDataPoints(dataPoints) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rideDataPoints'], 'readwrite');
            const store = transaction.objectStore('rideDataPoints');

            dataPoints.forEach(point => {
                store.add(point);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getAllRides() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rides'], 'readonly');
            const store = transaction.objectStore('rides');
            const request = store.getAll();

            request.onsuccess = () => {
                const rides = request.result.sort((a, b) => b.startTime - a.startTime);
                resolve(rides);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getRideById(rideId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rides'], 'readonly');
            const store = transaction.objectStore('rides');
            const request = store.get(rideId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getDataPointsByRideId(rideId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rideDataPoints'], 'readonly');
            const store = transaction.objectStore('rideDataPoints');
            const index = store.index('rideId');
            const request = index.getAll(rideId);

            request.onsuccess = () => {
                const points = request.result.sort((a, b) => a.timestamp - b.timestamp);
                resolve(points);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteRide(rideId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rides', 'rideDataPoints'], 'readwrite');

            const rideStore = transaction.objectStore('rides');
            rideStore.delete(rideId);

            const dataStore = transaction.objectStore('rideDataPoints');
            const index = dataStore.index('rideId');
            const request = index.openCursor(rideId);

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
}

const rideStorage = new RideStorage();