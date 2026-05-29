export class CourtRegions {
    static CANVAS_WIDTH = 600;
    static CANVAS_HEIGHT = 450;
    
    static CENTER_X = 300;
    static BASELINE_Y = 450;
    static HOOP_Y = 30;
    
    static THREE_POINT_RADIUS = 145;
    static PAINT_WIDTH = 84;
    static PAINT_HEIGHT = 190;
    
    static getRegion(x, y) {
        const normalizedX = x;
        const normalizedY = CourtRegions.BASELINE_Y - y;
        
        const distanceFromCenter = Math.sqrt(
            Math.pow(normalizedX - CourtRegions.CENTER_X, 2) + 
            Math.pow(normalizedY - CourtRegions.HOOP_Y, 2)
        );
        
        if (distanceFromCenter <= CourtRegions.THREE_POINT_RADIUS) {
            if (this.isInPaint(x, y)) {
                return 'paint';
            }
            return 'midRange';
        }
        return 'threePoint';
    }
    
    static isInPaint(x, y) {
        const leftPaint = CourtRegions.CENTER_X - CourtRegions.PAINT_WIDTH / 2;
        const rightPaint = CourtRegions.CENTER_X + CourtRegions.PAINT_WIDTH / 2;
        const topPaint = CourtRegions.HOOP_Y;
        const bottomPaint = CourtRegions.HOOP_Y + CourtRegions.PAINT_HEIGHT;
        
        const normalizedY = CourtRegions.BASELINE_Y - y;
        
        return x >= leftPaint && x <= rightPaint && 
               normalizedY >= topPaint && normalizedY <= bottomPaint;
    }
    
    static getRegionName(region) {
        const names = {
            paint: '油漆区',
            midRange: '中距离',
            threePoint: '三分线外'
        };
        return names[region] || region;
    }
}