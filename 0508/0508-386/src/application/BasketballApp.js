import { ShotRecord } from '../domain/ShotRecord.js';
import { Statistics } from '../domain/Statistics.js';
import { Storage } from '../infrastructure/Storage.js';

export class BasketballApp {
    constructor() {
        this.currentUser = 'user1';
        this.allShots = [];
        this.currentFilter = 'all';
        this.showHeatmap = true;
    }
    
    initialize() {
        this.loadShots();
    }
    
    loadShots() {
        this.allShots = Storage.getShots(this.currentUser);
    }
    
    saveShots() {
        Storage.saveShots(this.currentUser, this.allShots);
    }
    
    addShot(x, y, made) {
        const shot = new ShotRecord(x, y, made);
        this.allShots.push(shot);
        this.saveShots();
    }
    
    clearShots() {
        this.allShots = [];
        Storage.clearShots(this.currentUser);
    }
    
    setUser(userId) {
        this.currentUser = userId;
        this.loadShots();
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
    }
    
    getFilteredShots() {
        return Statistics.filterByTimeRange(this.allShots, this.currentFilter);
    }
    
    getStatistics() {
        const filteredShots = this.getFilteredShots();
        return {
            totalShots: filteredShots.length,
            totalAccuracy: Statistics.calculateTotalAccuracy(filteredShots),
            regionStats: Statistics.getRegionStats(filteredShots)
        };
    }
    
    toggleHeatmap() {
        this.showHeatmap = !this.showHeatmap;
    }
}