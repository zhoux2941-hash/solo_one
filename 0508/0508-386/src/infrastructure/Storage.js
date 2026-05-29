import { ShotRecord } from '../domain/ShotRecord.js';

export class Storage {
    static STORAGE_KEY = 'basketball_shots';
    
    static getShots(userId) {
        const data = localStorage.getItem(Storage.STORAGE_KEY);
        if (!data) {
            return Storage.loadMockData(userId);
        }
        
        const allData = JSON.parse(data);
        return allData[userId] ? allData[userId].map(ShotRecord.fromJSON) : [];
    }
    
    static saveShots(userId, shots) {
        const data = localStorage.getItem(Storage.STORAGE_KEY);
        const allData = data ? JSON.parse(data) : {};
        allData[userId] = shots.map(shot => shot.toJSON());
        localStorage.setItem(Storage.STORAGE_KEY, JSON.stringify(allData));
    }
    
    static clearShots(userId) {
        const data = localStorage.getItem(Storage.STORAGE_KEY);
        const allData = data ? JSON.parse(data) : {};
        allData[userId] = [];
        localStorage.setItem(Storage.STORAGE_KEY, JSON.stringify(allData));
    }
    
    static loadMockData(userId) {
        const mockData = {
            user1: [
                { x: 300, y: 50, made: true, timestamp: Date.now() - 10000 },
                { x: 250, y: 80, made: true, timestamp: Date.now() - 20000 },
                { x: 350, y: 90, made: false, timestamp: Date.now() - 30000 },
                { x: 200, y: 150, made: true, timestamp: Date.now() - 40000 },
                { x: 400, y: 160, made: false, timestamp: Date.now() - 50000 },
                { x: 150, y: 200, made: true, timestamp: Date.now() - 60000 },
                { x: 450, y: 210, made: true, timestamp: Date.now() - 70000 },
                { x: 100, y: 300, made: false, timestamp: Date.now() - 80000 },
                { x: 500, y: 290, made: false, timestamp: Date.now() - 90000 },
                { x: 300, y: 200, made: true, timestamp: Date.now() - 100000 }
            ],
            user2: [
                { x: 300, y: 40, made: false, timestamp: Date.now() - 10000 },
                { x: 280, y: 60, made: true, timestamp: Date.now() - 20000 },
                { x: 320, y: 70, made: true, timestamp: Date.now() - 30000 },
                { x: 220, y: 120, made: false, timestamp: Date.now() - 40000 },
                { x: 380, y: 130, made: true, timestamp: Date.now() - 50000 },
                { x: 180, y: 180, made: false, timestamp: Date.now() - 60000 },
                { x: 420, y: 190, made: false, timestamp: Date.now() - 70000 },
                { x: 120, y: 250, made: true, timestamp: Date.now() - 80000 },
                { x: 480, y: 260, made: true, timestamp: Date.now() - 90000 },
                { x: 300, y: 150, made: false, timestamp: Date.now() - 100000 }
            ],
            user3: [
                { x: 300, y: 35, made: true, timestamp: Date.now() - 10000 },
                { x: 260, y: 55, made: true, timestamp: Date.now() - 20000 },
                { x: 340, y: 65, made: true, timestamp: Date.now() - 30000 },
                { x: 210, y: 110, made: false, timestamp: Date.now() - 40000 },
                { x: 390, y: 120, made: true, timestamp: Date.now() - 50000 },
                { x: 170, y: 170, made: true, timestamp: Date.now() - 60000 },
                { x: 430, y: 180, made: false, timestamp: Date.now() - 70000 },
                { x: 110, y: 240, made: false, timestamp: Date.now() - 80000 },
                { x: 490, y: 250, made: true, timestamp: Date.now() - 90000 },
                { x: 300, y: 140, made: true, timestamp: Date.now() - 100000 }
            ]
        };
        
        return mockData[userId] ? mockData[userId].map(ShotRecord.fromJSON) : [];
    }
}