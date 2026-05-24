class GlucoseStats {
    calculate(readings) {
        if (readings.length === 0) {
            return {
                average: 0,
                stdDev: 0,
                hba1c: 0,
                count: 0,
                min: 0,
                max: 0
            };
        }

        const values = readings.map(r => r.glucoseValue);
        const average = this.calculateAverage(values);
        const stdDev = this.calculateStdDev(values, average);
        const hba1c = this.calculateHbA1c(average);
        const min = Math.min(...values);
        const max = Math.max(...values);

        return {
            average: Math.round(average * 10) / 10,
            stdDev: Math.round(stdDev * 100) / 100,
            hba1c: Math.round(hba1c * 10) / 10,
            count: readings.length,
            min: Math.round(min * 10) / 10,
            max: Math.round(max * 10) / 10
        };
    }

    calculateAverage(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    calculateStdDev(values, average) {
        const squaredDiffs = values.map(val => Math.pow(val - average, 2));
        const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        return Math.sqrt(avgSquaredDiff);
    }

    calculateHbA1c(averageGlucose) {
        const averageMgDl = averageGlucose * 18.0182;
        return (averageMgDl + 46.7) / 28.7;
    }

    calculateHbA1cAlternative(averageGlucose) {
        return averageGlucose * 0.6278 + 1.627;
    }

    getStatus(glucoseValue) {
        if (glucoseValue < 3.9) return 'low';
        if (glucoseValue > 10.0) return 'high';
        return 'normal';
    }

    getTypeLabel(type) {
        switch (type) {
            case 'before_meal': return '餐前';
            case 'after_meal': return '餐后';
            case 'fasting': return '空腹';
            case 'casual': return '随机';
            default: return '未标记';
        }
    }

    getTypeClass(type) {
        switch (type) {
            case 'before_meal': return 'tag-before';
            case 'after_meal': return 'tag-after';
            default: return 'tag-none';
        }
    }

    getStatusClass(status) {
        switch (status) {
            case 'low': return 'status-low';
            case 'high': return 'status-high';
            default: return 'status-normal';
        }
    }

    getStatusLabel(status) {
        switch (status) {
            case 'low': return '偏低';
            case 'high': return '偏高';
            default: return '正常';
        }
    }
}

const glucoseStats = new GlucoseStats();