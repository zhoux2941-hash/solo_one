class BodyScaleDB {
    constructor() {
        this.dbName = 'BodyScaleDB';
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

                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                    userStore.createIndex('name', 'name', { unique: true });
                }

                if (!db.objectStoreNames.contains('measurements')) {
                    const measurementStore = db.createObjectStore('measurements', { keyPath: 'id', autoIncrement: true });
                    measurementStore.createIndex('userId', 'userId', { unique: false });
                    measurementStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!db.objectStoreNames.contains('goals')) {
                    const goalStore = db.createObjectStore('goals', { keyPath: 'userId', unique: true });
                }
            };
        });
    }

    async addUser(name) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.add({ name, createdAt: Date.now() });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUsers() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async addMeasurement(userId, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['measurements'], 'readwrite');
            const store = transaction.objectStore('measurements');
            const request = store.add({
                userId,
                timestamp: Date.now(),
                weight: data.weight,
                bodyFat: data.bodyFat,
                muscle: data.muscle,
                water: data.water,
                bone: data.bone,
                bmr: data.bmr,
                metabolicAge: data.metabolicAge
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getMeasurements(userId, days = 30) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['measurements'], 'readonly');
            const store = transaction.objectStore('measurements');
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => {
                const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
                const filtered = request.result.filter(m => m.timestamp >= cutoff);
                filtered.sort((a, b) => a.timestamp - b.timestamp);
                resolve(filtered);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getLatestMeasurement(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['measurements'], 'readonly');
            const store = transaction.objectStore('measurements');
            const index = store.index('userId');
            const request = index.openCursor(userId, 'prev');

            request.onsuccess = () => {
                const cursor = request.result;
                resolve(cursor ? cursor.value : null);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async setGoal(userId, targetWeight) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['goals'], 'readwrite');
            const store = transaction.objectStore('goals');
            const request = store.put({ userId, targetWeight, updatedAt: Date.now() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getGoal(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['goals'], 'readonly');
            const store = transaction.objectStore('goals');
            const request = store.get(userId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }
}

const db = new BodyScaleDB();