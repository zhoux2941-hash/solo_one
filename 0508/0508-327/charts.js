class GlucoseChart {
    constructor() {
        this.chart = null;
        this.ctx = null;
        this.currentPeriod = 'week';
    }

    init() {
        this.ctx = document.getElementById('glucoseChart').getContext('2d');
        this.createChart();
    }

    createChart() {
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '血糖值',
                        data: [],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: (context) => {
                            const value = context.raw;
                            if (value < 3.9) return '#ffc107';
                            if (value > 10.0) return '#dc3545';
                            return '#28a745';
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                let label = `血糖: ${context.parsed.y} mmol/L`;
                                if (context.parsed.y < 3.9) {
                                    label += ' (偏低)';
                                } else if (context.parsed.y > 10.0) {
                                    label += ' (偏高)';
                                } else {
                                    label += ' (正常)';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '时间'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '血糖值 (mmol/L)'
                        },
                        min: 2,
                        max: 18,
                        grid: {
                            color: (context) => {
                                if (context.tick.value === 3.9 || context.tick.value === 10.0) {
                                    return 'rgba(40, 167, 69, 0.8)';
                                }
                                return 'rgba(0, 0, 0, 0.1)';
                            },
                            lineWidth: (context) => {
                                if (context.tick.value === 3.9 || context.tick.value === 10.0) {
                                    return 2;
                                }
                                return 1;
                            }
                        }
                    }
                }
            }
        });
    }

    updateData(readings, period = 'week') {
        this.currentPeriod = period;
        
        const filteredReadings = this.filterByPeriod(readings, period);
        const groupedData = this.groupData(filteredReadings, period);
        
        this.chart.data.labels = groupedData.labels;
        this.chart.data.datasets[0].data = groupedData.values;
        this.chart.update();
    }

    filterByPeriod(readings, period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        return readings.filter(r => new Date(r.timestamp) >= startDate);
    }

    groupData(readings, period) {
        const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp);
        const labels = [];
        const values = [];

        if (period === 'day') {
            const hourlyData = {};
            sorted.forEach(reading => {
                const hour = new Date(reading.timestamp).getHours();
                if (!hourlyData[hour]) {
                    hourlyData[hour] = [];
                }
                hourlyData[hour].push(reading.glucoseValue);
            });

            for (let i = 0; i < 24; i++) {
                labels.push(`${i}:00`);
                if (hourlyData[i] && hourlyData[i].length > 0) {
                    const avg = hourlyData[i].reduce((a, b) => a + b, 0) / hourlyData[i].length;
                    values.push(Math.round(avg * 10) / 10);
                } else {
                    values.push(null);
                }
            }
        } else if (period === 'week') {
            const dailyData = {};
            sorted.forEach(reading => {
                const date = new Date(reading.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
                if (!dailyData[date]) {
                    dailyData[date] = [];
                }
                dailyData[date].push(reading.glucoseValue);
            });

            const days = Object.keys(dailyData);
            days.forEach(day => {
                labels.push(day);
                const avg = dailyData[day].reduce((a, b) => a + b, 0) / dailyData[day].length;
                values.push(Math.round(avg * 10) / 10);
            });
        } else if (period === 'month') {
            const weeklyData = {};
            sorted.forEach(reading => {
                const date = new Date(reading.timestamp);
                const weekNum = Math.floor(date.getDate() / 7) + 1;
                const weekLabel = `第${weekNum}周`;
                if (!weeklyData[weekLabel]) {
                    weeklyData[weekLabel] = [];
                }
                weeklyData[weekLabel].push(reading.glucoseValue);
            });

            const weeks = Object.keys(weeklyData);
            weeks.forEach(week => {
                labels.push(week);
                const avg = weeklyData[week].reduce((a, b) => a + b, 0) / weeklyData[week].length;
                values.push(Math.round(avg * 10) / 10);
            });
        }

        return { labels, values };
    }

    setPeriod(period) {
        this.currentPeriod = period;
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });
    }
}

const glucoseChart = new GlucoseChart();