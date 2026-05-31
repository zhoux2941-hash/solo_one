class QueueSimulator {
    constructor() {
        this.charts = {};
        this.currentSeed = null;
        this.rng = Math.random;
        this.initEventListeners();
        this.initCharts();
    }

    mulberry32(seed) {
        return function() {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    initEventListeners() {
        const inputs = ['lambda', 'mu', 'duration', 'batchCount', 'warmupCount'];
        
        inputs.forEach(id => {
            const input = document.getElementById(id);
            const slider = document.getElementById(id + 'Slider');
            
            input.addEventListener('input', () => {
                slider.value = input.value;
            });
            
            slider.addEventListener('input', () => {
                input.value = slider.value;
            });
        });

        const seedAuto = document.getElementById('seedAuto');
        const seedInput = document.getElementById('seed');
        const seedHint = document.getElementById('seedHint');

        seedAuto.addEventListener('change', () => {
            if (seedAuto.checked) {
                seedInput.disabled = true;
                seedInput.value = '';
                seedHint.textContent = '当前种子: 自动生成';
            } else {
                seedInput.disabled = false;
                if (!seedInput.value) {
                    seedInput.value = Math.floor(Math.random() * 1000000);
                }
                seedHint.textContent = `当前种子: ${seedInput.value}`;
            }
        });

        seedInput.addEventListener('input', () => {
            if (!seedAuto.checked && seedInput.value) {
                seedHint.textContent = `当前种子: ${seedInput.value}`;
            }
        });

        document.getElementById('runBtn').addEventListener('click', () => this.runSimulation());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    }

    initCharts() {
        const chartConfigs = {
            timelineChart: {
                type: 'bar',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            title: {
                                display: true,
                                text: '顾客编号'
                            }
                        },
                        y: {
                            stacked: true,
                            title: {
                                display: true,
                                text: '时间 (分钟)'
                            }
                        }
                    }
                }
            },
            queueChart: {
                type: 'line',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '时间 (分钟)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: '队列长度 (人)'
                            },
                            beginAtZero: true
                        }
                    }
                }
            },
            waitTimeHist: {
                type: 'bar',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '等待时间 (分钟)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: '频数'
                            }
                        }
                    }
                }
            },
            serviceTimeHist: {
                type: 'bar',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '服务时间 (分钟)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: '频数'
                            }
                        }
                    }
                }
            }
        };

        Object.keys(chartConfigs).forEach(chartId => {
            const ctx = document.getElementById(chartId).getContext('2d');
            this.charts[chartId] = new Chart(ctx, {
                type: chartConfigs[chartId].type,
                data: { labels: [], datasets: [] },
                options: chartConfigs[chartId].options
            });
        });
    }

    exponential(rate, rng) {
        return -Math.log(rng()) / rate;
    }

    calculateTheoretical(lambda, mu) {
        const rho = lambda / mu;
        
        if (rho >= 1) {
            return { rho, unstable: true };
        }

        const Lq = (lambda * lambda) / (mu * (mu - lambda));
        const L = lambda / (mu - lambda);
        const Wq = lambda / (mu * (mu - lambda));
        const W = 1 / (mu - lambda);

        return {
            rho,
            Lq,
            L,
            Wq,
            W,
            unstable: false
        };
    }

    runSingleSimulation(lambda, mu, duration, rng, warmupCount) {
        const customers = [];
        const events = [];
        let currentTime = 0;
        let serverAvailableTime = 0;
        let queueLengthHistory = [{ time: 0, length: 0 }];
        let currentQueueLength = 0;

        while (currentTime < duration) {
            const interarrivalTime = this.exponential(lambda, rng);
            currentTime += interarrivalTime;
            
            if (currentTime >= duration) break;

            const serviceTime = this.exponential(mu, rng);
            const arrivalTime = currentTime;
            
            const serviceStartTime = Math.max(arrivalTime, serverAvailableTime);
            const waitTime = serviceStartTime - arrivalTime;
            const departureTime = serviceStartTime + serviceTime;
            
            const systemTime = departureTime - arrivalTime;
            
            customers.push({
                id: customers.length + 1,
                arrivalTime,
                serviceTime,
                serviceStartTime,
                waitTime,
                departureTime,
                systemTime
            });

            if (arrivalTime < serverAvailableTime) {
                currentQueueLength++;
                queueLengthHistory.push({ time: arrivalTime, length: currentQueueLength });
            }

            events.push({
                time: arrivalTime,
                type: 'arrival',
                customerId: customers.length
            });

            events.push({
                time: serviceStartTime,
                type: 'service',
                customerId: customers.length
            });

            events.push({
                time: departureTime,
                type: 'departure',
                customerId: customers.length
            });

            queueLengthHistory.push({ time: departureTime, length: Math.max(0, currentQueueLength - 1) });
            currentQueueLength = Math.max(0, currentQueueLength - 1);

            serverAvailableTime = departureTime;
        }

        const warmupIdx = Math.min(warmupCount, customers.length);
        const steadyCustomers = customers.slice(warmupIdx);
        const warmupCustomers = customers.slice(0, warmupIdx);

        const totalWaitTime = steadyCustomers.reduce((sum, c) => sum + c.waitTime, 0);
        const totalSystemTime = steadyCustomers.reduce((sum, c) => sum + c.systemTime, 0);
        
        let avgQueueLength = 0;
        const warmupEndTime = warmupIdx > 0 ? customers[warmupIdx - 1].departureTime : 0;
        for (let i = 1; i < queueLengthHistory.length; i++) {
            const segStart = queueLengthHistory[i - 1].time;
            const segEnd = queueLengthHistory[i].time;
            if (segEnd <= warmupEndTime) continue;
            const effectiveStart = Math.max(segStart, warmupEndTime);
            const deltaTime = segEnd - effectiveStart;
            avgQueueLength += queueLengthHistory[i - 1].length * deltaTime;
        }
        const effectiveDuration = duration - warmupEndTime;
        avgQueueLength = effectiveDuration > 0 ? avgQueueLength / effectiveDuration : 0;

        const totalBusyTime = customers.reduce((sum, c) => sum + c.serviceTime, 0);
        const utilization = totalBusyTime / duration;

        const totalSystemTimeAll = customers.reduce((sum, c) => sum + c.systemTime, 0);
        const avgSystemCount = totalSystemTimeAll / duration;

        return {
            customers,
            events,
            queueLengthHistory,
            warmupCount: warmupIdx,
            warmupEndTime,
            stats: {
                totalCustomers: customers.length,
                steadyCustomers: steadyCustomers.length,
                warmupCustomers: warmupIdx,
                avgWaitTime: steadyCustomers.length > 0 ? totalWaitTime / steadyCustomers.length : 0,
                avgSystemTime: steadyCustomers.length > 0 ? totalSystemTime / steadyCustomers.length : 0,
                avgQueueLength,
                avgSystemCount,
                utilization
            }
        };
    }

    async runSimulation() {
        const lambda = parseFloat(document.getElementById('lambda').value);
        const mu = parseFloat(document.getElementById('mu').value);
        const duration = parseInt(document.getElementById('duration').value);
        const batchCount = parseInt(document.getElementById('batchCount').value);
        const warmupCount = parseInt(document.getElementById('warmupCount').value) || 0;
        const seedAuto = document.getElementById('seedAuto').checked;
        const seedInput = document.getElementById('seed').value;
        const seedHint = document.getElementById('seedHint');
        const warningBanner = document.getElementById('warningBanner');
        const warningText = document.getElementById('warningText');

        warningBanner.style.display = 'none';

        if (!seedAuto && (!seedInput || isNaN(parseInt(seedInput)))) {
            this.showStatus('请输入有效的随机种子', 'error');
            return;
        }

        const isUnstable = lambda >= mu;

        const runBtn = document.getElementById('runBtn');
        runBtn.disabled = true;
        this.showStatus('正在运行模拟...', 'running');

        let baseSeed;
        if (seedAuto) {
            baseSeed = Date.now();
            seedHint.textContent = `当前种子: ${baseSeed} (自动)`;
        } else {
            baseSeed = parseInt(seedInput);
            seedHint.textContent = `当前种子: ${baseSeed}`;
        }

        const theoretical = this.calculateTheoretical(lambda, mu);

        if (isUnstable) {
            warningText.textContent = '系统不稳定，队列将无限增长 (λ ≥ μ)。理论稳态值不存在，仅展示模拟观测值。';
            warningBanner.style.display = 'flex';
        }

        let allStats = [];
        let allResults = [];
        let bestResult = null;
        let minError = Infinity;

        for (let i = 0; i < batchCount; i++) {
            const currentSeed = seedAuto ? baseSeed + i : baseSeed;
            const rng = this.mulberry32(currentSeed);
            const result = this.runSingleSimulation(lambda, mu, duration, rng, warmupCount);
            result.seed = currentSeed;
            allStats.push(result.stats);
            allResults.push(result);
            
            if (!isUnstable) {
                const error = Math.abs(result.stats.avgWaitTime - theoretical.Wq);
                if (error < minError) {
                    minError = error;
                    bestResult = result;
                }
            }

            if (batchCount > 1) {
                this.showStatus(`正在运行模拟... (${i + 1}/${batchCount})`, 'running');
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        if (isUnstable && !bestResult) {
            bestResult = allResults[0];
        }

        if (!bestResult && allStats.length > 0) {
            bestResult = this._lastBestResult;
        }

        const avgStats = {
            totalCustomers: Math.round(allStats.reduce((sum, s) => sum + s.totalCustomers, 0) / batchCount),
            steadyCustomers: Math.round(allStats.reduce((sum, s) => sum + s.steadyCustomers, 0) / batchCount),
            warmupCustomers: Math.round(allStats.reduce((sum, s) => sum + s.warmupCustomers, 0) / batchCount),
            avgWaitTime: allStats.reduce((sum, s) => sum + s.avgWaitTime, 0) / batchCount,
            avgSystemTime: allStats.reduce((sum, s) => sum + s.avgSystemTime, 0) / batchCount,
            avgQueueLength: allStats.reduce((sum, s) => sum + s.avgQueueLength, 0) / batchCount,
            avgSystemCount: allStats.reduce((sum, s) => sum + s.avgSystemCount, 0) / batchCount,
            utilization: allStats.reduce((sum, s) => sum + s.utilization, 0) / batchCount
        };

        if (!bestResult) {
            const currentSeed = seedAuto ? baseSeed : baseSeed;
            const rng = this.mulberry32(currentSeed);
            bestResult = this.runSingleSimulation(lambda, mu, duration, rng, warmupCount);
        }

        this._lastBestResult = bestResult;

        this.displayResults(avgStats, theoretical, batchCount, warmupCount);
        this.updateCharts(bestResult, warmupCount);
        this.updateEventLog(bestResult.events);

        runBtn.disabled = false;

        let statusMsg = batchCount > 1 ? `${batchCount} 次模拟完成，已取平均值` : '模拟完成';
        if (warmupCount > 0) {
            statusMsg += ` (已丢弃前 ${warmupCount} 个预热顾客)`;
        }
        this.showStatus(statusMsg, isUnstable ? 'error' : 'completed');
    }

    displayResults(stats, theoretical, batchCount, warmupCount) {
        document.getElementById('utilization').textContent = (stats.utilization * 100).toFixed(2) + '%';
        document.getElementById('avgWaitTime').textContent = stats.avgWaitTime.toFixed(4);
        document.getElementById('avgQueueLength').textContent = stats.avgQueueLength.toFixed(4);
        document.getElementById('avgSystemTime').textContent = stats.avgSystemTime.toFixed(4);
        document.getElementById('avgSystemCount').textContent = stats.avgSystemCount.toFixed(4);
        
        let customerLabel = `${stats.totalCustomers}`;
        if (warmupCount > 0) {
            customerLabel += ` (稳态: ${stats.steadyCustomers})`;
        }
        document.getElementById('totalCustomers').textContent = customerLabel;

        const isUnstable = theoretical && theoretical.unstable;

        if (theoretical && !isUnstable) {
            const formatError = (sim, theo) => {
                const error = ((sim - theo) / theo * 100);
                const absError = Math.abs(error);
                let className = 'error-positive';
                if (absError > 10) className = 'error-high';
                else if (absError > 5) className = 'error-negative';
                return `<span class="${className}">${error >= 0 ? '+' : ''}${error.toFixed(2)}%</span>`;
            };

            document.getElementById('utilizationCompare').innerHTML = 
                `理论: ${(theoretical.rho * 100).toFixed(2)}%`;
            document.getElementById('waitTimeCompare').innerHTML = 
                `理论: ${theoretical.Wq.toFixed(4)} 分钟`;
            document.getElementById('queueLengthCompare').innerHTML = 
                `理论: ${theoretical.Lq.toFixed(4)} 人`;
            document.getElementById('systemTimeCompare').innerHTML = 
                `理论: ${theoretical.W.toFixed(4)} 分钟`;
            document.getElementById('systemCountCompare').innerHTML = 
                `理论: ${theoretical.L.toFixed(4)} 人`;

            const comparisonBody = document.getElementById('comparisonBody');
            comparisonBody.innerHTML = `
                <tr>
                    <td>系统利用率 ρ</td>
                    <td>${(theoretical.rho * 100).toFixed(2)}%</td>
                    <td>${(stats.utilization * 100).toFixed(2)}%</td>
                    <td>${formatError(stats.utilization, theoretical.rho)}</td>
                </tr>
                <tr>
                    <td>平均等待时间 Wq</td>
                    <td>${theoretical.Wq.toFixed(4)} 分钟</td>
                    <td>${stats.avgWaitTime.toFixed(4)} 分钟</td>
                    <td>${formatError(stats.avgWaitTime, theoretical.Wq)}</td>
                </tr>
                <tr>
                    <td>平均队列长度 Lq</td>
                    <td>${theoretical.Lq.toFixed(4)} 人</td>
                    <td>${stats.avgQueueLength.toFixed(4)} 人</td>
                    <td>${formatError(stats.avgQueueLength, theoretical.Lq)}</td>
                </tr>
                <tr>
                    <td>平均系统时间 W</td>
                    <td>${theoretical.W.toFixed(4)} 分钟</td>
                    <td>${stats.avgSystemTime.toFixed(4)} 分钟</td>
                    <td>${formatError(stats.avgSystemTime, theoretical.W)}</td>
                </tr>
                <tr>
                    <td>平均系统人数 L</td>
                    <td>${theoretical.L.toFixed(4)} 人</td>
                    <td>${stats.avgSystemCount.toFixed(4)} 人</td>
                    <td>${formatError(stats.avgSystemCount, theoretical.L)}</td>
                </tr>
            `;
        } else {
            ['utilizationCompare', 'waitTimeCompare', 'queueLengthCompare', 
             'systemTimeCompare', 'systemCountCompare'].forEach(id => {
                document.getElementById(id).innerHTML = isUnstable ? '理论值不存在' : '';
            });

            const comparisonBody = document.getElementById('comparisonBody');
            if (isUnstable) {
                comparisonBody.innerHTML = `
                    <tr>
                        <td>系统利用率 ρ</td>
                        <td>—</td>
                        <td>${(stats.utilization * 100).toFixed(2)}%</td>
                        <td><span class="error-high">系统不稳定</span></td>
                    </tr>
                    <tr>
                        <td>平均等待时间 Wq</td>
                        <td>—</td>
                        <td>${stats.avgWaitTime.toFixed(4)} 分钟</td>
                        <td><span class="error-high">系统不稳定</span></td>
                    </tr>
                    <tr>
                        <td>平均队列长度 Lq</td>
                        <td>—</td>
                        <td>${stats.avgQueueLength.toFixed(4)} 人</td>
                        <td><span class="error-high">系统不稳定</span></td>
                    </tr>
                    <tr>
                        <td>平均系统时间 W</td>
                        <td>—</td>
                        <td>${stats.avgSystemTime.toFixed(4)} 分钟</td>
                        <td><span class="error-high">系统不稳定</span></td>
                    </tr>
                    <tr>
                        <td>平均系统人数 L</td>
                        <td>—</td>
                        <td>${stats.avgSystemCount.toFixed(4)} 人</td>
                        <td><span class="error-high">系统不稳定</span></td>
                    </tr>
                `;
            }
        }
    }

    updateCharts(result, warmupCount) {
        const { customers, queueLengthHistory } = result;
        const warmupIdx = Math.min(warmupCount || 0, customers.length);
        const maxCustomers = Math.min(customers.length, 50);
        const displayCustomers = customers.slice(0, maxCustomers);

        this.charts.timelineChart.data = {
            labels: displayCustomers.map(c => `C${c.id}${c.id <= warmupIdx ? '*' : ''}`),
            datasets: [
                {
                    label: '等待时间',
                    data: displayCustomers.map(c => c.waitTime),
                    backgroundColor: displayCustomers.map(c => 
                        c.id <= warmupIdx ? 'rgba(200, 200, 200, 0.6)' : 'rgba(255, 159, 64, 0.8)'),
                    borderColor: displayCustomers.map(c => 
                        c.id <= warmupIdx ? 'rgba(180, 180, 180, 1)' : 'rgba(255, 159, 64, 1)'),
                    borderWidth: 1
                },
                {
                    label: '服务时间',
                    data: displayCustomers.map(c => c.serviceTime),
                    backgroundColor: displayCustomers.map(c => 
                        c.id <= warmupIdx ? 'rgba(200, 200, 200, 0.4)' : 'rgba(75, 192, 192, 0.8)'),
                    borderColor: displayCustomers.map(c => 
                        c.id <= warmupIdx ? 'rgba(180, 180, 180, 1)' : 'rgba(75, 192, 192, 1)'),
                    borderWidth: 1
                }
            ]
        };
        this.charts.timelineChart.update();

        this.charts.queueChart.data = {
            labels: queueLengthHistory.filter((_, i) => i % Math.ceil(queueLengthHistory.length / 100) === 0).map(q => q.time.toFixed(2)),
            datasets: [{
                label: '队列长度',
                data: queueLengthHistory.filter((_, i) => i % Math.ceil(queueLengthHistory.length / 100) === 0).map(q => q.length),
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                fill: true,
                tension: 0.1
            }]
        };
        this.charts.queueChart.update();

        const steadyCustomers = customers.slice(warmupIdx);

        const waitTimes = steadyCustomers.length > 0 ? steadyCustomers.map(c => c.waitTime) : customers.map(c => c.waitTime);
        const waitHist = this.createHistogram(waitTimes, 10);
        this.charts.waitTimeHist.data = {
            labels: waitHist.labels,
            datasets: [{
                label: steadyCustomers.length > 0 ? '稳态等待时间' : '等待时间',
                data: waitHist.counts,
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };
        this.charts.waitTimeHist.update();

        const serviceTimes = steadyCustomers.length > 0 ? steadyCustomers.map(c => c.serviceTime) : customers.map(c => c.serviceTime);
        const serviceHist = this.createHistogram(serviceTimes, 10);
        this.charts.serviceTimeHist.data = {
            labels: serviceHist.labels,
            datasets: [{
                label: steadyCustomers.length > 0 ? '稳态服务时间' : '服务时间',
                data: serviceHist.counts,
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        };
        this.charts.serviceTimeHist.update();
    }

    createHistogram(data, bins) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / bins || 1;
        
        const counts = new Array(bins).fill(0);
        const labels = [];

        for (let i = 0; i < bins; i++) {
            const binStart = min + i * binWidth;
            const binEnd = binStart + binWidth;
            labels.push(`${binStart.toFixed(2)}-${binEnd.toFixed(2)}`);
        }

        data.forEach(value => {
            let binIndex = Math.floor((value - min) / binWidth);
            if (binIndex >= bins) binIndex = bins - 1;
            if (binIndex < 0) binIndex = 0;
            counts[binIndex]++;
        });

        return { labels, counts };
    }

    updateEventLog(events) {
        const logContainer = document.getElementById('eventLog');
        const sortedEvents = events.sort((a, b) => a.time - b.time).slice(0, 100);
        
        logContainer.innerHTML = sortedEvents.map(event => {
            const typeLabels = {
                arrival: { class: 'arrival', text: '到达' },
                service: { class: 'service', text: '开始服务' },
                departure: { class: 'departure', text: '离开' }
            };
            const type = typeLabels[event.type];
            
            return `<div class="log-entry">
                <span class="time">[${event.time.toFixed(3)}]</span> 
                顾客 #${event.customerId} 
                <span class="${type.class}">${type.text}</span>
            </div>`;
        }).join('');
    }

    showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
    }

    reset() {
        document.getElementById('lambda').value = 3;
        document.getElementById('lambdaSlider').value = 3;
        document.getElementById('mu').value = 5;
        document.getElementById('muSlider').value = 5;
        document.getElementById('duration').value = 100;
        document.getElementById('durationSlider').value = 100;
        document.getElementById('batchCount').value = 1;
        document.getElementById('batchCountSlider').value = 1;
        document.getElementById('seedAuto').checked = true;
        document.getElementById('seed').value = '';
        document.getElementById('seed').disabled = true;
        document.getElementById('seedHint').textContent = '当前种子: 自动生成';
        document.getElementById('warmupCount').value = 0;
        document.getElementById('warmupCountSlider').value = 0;
        document.getElementById('warningBanner').style.display = 'none';

        document.getElementById('utilization').textContent = '-';
        document.getElementById('avgWaitTime').textContent = '-';
        document.getElementById('avgQueueLength').textContent = '-';
        document.getElementById('avgSystemTime').textContent = '-';
        document.getElementById('avgSystemCount').textContent = '-';
        document.getElementById('totalCustomers').textContent = '-';

        ['utilizationCompare', 'waitTimeCompare', 'queueLengthCompare', 
         'systemTimeCompare', 'systemCountCompare'].forEach(id => {
            document.getElementById(id).innerHTML = '';
        });

        document.getElementById('comparisonBody').innerHTML = 
            '<tr><td colspan="4">请先运行模拟</td></tr>';

        Object.values(this.charts).forEach(chart => {
            chart.data = { labels: [], datasets: [] };
            chart.update();
        });

        document.getElementById('eventLog').innerHTML = '';
        document.getElementById('status').className = 'status';
        document.getElementById('status').textContent = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QueueSimulator();
});