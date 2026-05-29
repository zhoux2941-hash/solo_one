import { CourtRegions } from './CourtRegions.js';

export class Statistics {
    static calculateTotalAccuracy(shots) {
        if (shots.length === 0) return 0;
        const made = shots.filter(s => s.made).length;
        return made / shots.length;
    }
    
    static calculateRegionAccuracy(shots, region) {
        const regionShots = shots.filter(shot => CourtRegions.getRegion(shot.x, shot.y) === region);
        if (regionShots.length === 0) return null;
        const made = regionShots.filter(s => s.made).length;
        return made / regionShots.length;
    }
    
    static getRegionStats(shots) {
        const regions = ['paint', 'midRange', 'threePoint'];
        const stats = {};
        
        regions.forEach(region => {
            const regionShots = shots.filter(shot => CourtRegions.getRegion(shot.x, shot.y) === region);
            const made = regionShots.filter(s => s.made).length;
            stats[region] = {
                total: regionShots.length,
                made: made,
                accuracy: regionShots.length > 0 ? made / regionShots.length : null
            };
        });
        
        return stats;
    }
    
    static filterByTimeRange(shots, range) {
        const now = Date.now();
        let startDate;
        
        switch (range) {
            case 'week':
                startDate = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case 'month':
                startDate = now - 30 * 24 * 60 * 60 * 1000;
                break;
            default:
                return shots;
        }
        
        return shots.filter(shot => shot.timestamp >= startDate);
    }
}