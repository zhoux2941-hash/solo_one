class RideCalculator {
    constructor() {
        this.rideStartTime = null;
        this.totalDistance = 0;
        this.maxSpeed = 0;
        this.speedReadings = [];
        this.cadenceReadings = [];
        this.powerReadings = [];
        this.heartRateReadings = [];
        this.lastPosition = null;
        this.calories = 0;
        this.weight = 75;
    }

    startRide() {
        this.rideStartTime = Date.now();
        this.totalDistance = 0;
        this.maxSpeed = 0;
        this.speedReadings = [];
        this.cadenceReadings = [];
        this.powerReadings = [];
        this.heartRateReadings = [];
        this.lastPosition = null;
        this.calories = 0;
    }

    addPosition(position) {
        if (this.lastPosition) {
            const distance = this.calculateDistance(
                this.lastPosition.lat, this.lastPosition.lng,
                position.lat, position.lng
            );
            this.totalDistance += distance;
        }
        this.lastPosition = position;
    }

    addSpeed(speed) {
        if (speed > 0) {
            this.speedReadings.push(speed);
            if (speed > this.maxSpeed) {
                this.maxSpeed = speed;
            }
        }
    }

    addCadence(cadence) {
        if (cadence > 0) {
            this.cadenceReadings.push(cadence);
        }
    }

    addPower(power) {
        if (power > 0) {
            this.powerReadings.push(power);
        }
    }

    addHeartRate(heartRate) {
        if (heartRate && heartRate > 0) {
            this.heartRateReadings.push(heartRate);
        }
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(deg) {
        return deg * (Math.PI / 180);
    }

    calculateCalories() {
        const rideDuration = this.getRideDurationHours();
        const avgSpeed = this.getAverageSpeed();
        
        let mets = 4;
        if (avgSpeed > 16) mets = 6;
        if (avgSpeed > 19) mets = 8;
        if (avgSpeed > 22) mets = 10;
        if (avgSpeed > 25) mets = 12;
        
        this.calories = Math.round(this.weight * mets * rideDuration);
        return this.calories;
    }

    getRideDuration() {
        if (!this.rideStartTime) return 0;
        return Date.now() - this.rideStartTime;
    }

    getRideDurationHours() {
        return this.getRideDuration() / (1000 * 60 * 60);
    }

    getRideDurationMinutes() {
        return this.getRideDuration() / (1000 * 60);
    }

    getTotalDistance() {
        return this.totalDistance;
    }

    getAverageSpeed() {
        if (this.speedReadings.length === 0) return 0;
        const sum = this.speedReadings.reduce((a, b) => a + b, 0);
        return sum / this.speedReadings.length;
    }

    getMaxSpeed() {
        return this.maxSpeed;
    }

    getAverageCadence() {
        if (this.cadenceReadings.length === 0) return 0;
        const sum = this.cadenceReadings.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.cadenceReadings.length);
    }

    getAveragePower() {
        if (this.powerReadings.length === 0) return 0;
        const sum = this.powerReadings.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.powerReadings.length);
    }

    getAverageHeartRate() {
        if (this.heartRateReadings.length === 0) return null;
        const sum = this.heartRateReadings.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.heartRateReadings.length);
    }

    getCalories() {
        return this.calculateCalories();
    }

    getStats() {
        return {
            rideTime: this.formatTime(this.getRideDuration()),
            distance: this.totalDistance.toFixed(2),
            avgSpeed: this.getAverageSpeed().toFixed(1),
            maxSpeed: this.getMaxSpeed().toFixed(1),
            avgCadence: this.getAverageCadence(),
            avgPower: this.getAveragePower(),
            avgHeartRate: this.getAverageHeartRate(),
            calories: this.getCalories()
        };
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        return [
            hours.toString().padStart(2, '0'),
            (minutes % 60).toString().padStart(2, '0'),
            (seconds % 60).toString().padStart(2, '0')
        ].join(':');
    }
}

const rideCalculator = new RideCalculator();