export class ShotRecord {
    constructor(x, y, made, timestamp = Date.now()) {
        this.x = x;
        this.y = y;
        this.made = made;
        this.timestamp = timestamp;
    }

    toJSON() {
        return {
            x: this.x,
            y: this.y,
            made: this.made,
            timestamp: this.timestamp
        };
    }

    static fromJSON(data) {
        return new ShotRecord(data.x, data.y, data.made, data.timestamp);
    }
}