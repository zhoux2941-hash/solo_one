import os
import threading
from flask import Flask, render_template_string, jsonify
from flask_socketio import SocketIO


HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage-Guided Fuzzer Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        h1 {
            text-align: center;
            color: #00d4ff;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            backdrop-filter: blur(10px);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 212, 255, 0.2);
        }
        
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #00d4ff;
            margin-bottom: 10px;
        }
        
        .stat-label {
            color: #888;
            font-size: 0.95em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .stat-card.crash .stat-value {
            color: #ff4757;
        }
        
        .stat-card.coverage .stat-value {
            color: #2ed573;
        }
        
        .charts-container {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .chart-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
        }
        
        .chart-card h3 {
            color: #00d4ff;
            margin-bottom: 20px;
            font-size: 1.3em;
        }
        
        .chart-placeholder {
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .coverage-bar {
            width: 100%;
            height: 30px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            overflow: hidden;
            margin-top: 20px;
        }
        
        .coverage-fill {
            height: 100%;
            background: linear-gradient(90deg, #2ed573, #00d4ff);
            border-radius: 15px;
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            font-weight: bold;
        }
        
        .crashes-section {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
        }
        
        .crashes-section h3 {
            color: #ff4757;
            margin-bottom: 20px;
            font-size: 1.3em;
        }
        
        .crash-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .crash-item {
            background: rgba(255, 71, 87, 0.1);
            border: 1px solid rgba(255, 71, 87, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
        }
        
        .crash-item h4 {
            color: #ff4757;
            margin-bottom: 5px;
        }
        
        .crash-item p {
            color: #888;
            font-size: 0.9em;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #2ed573;
            animation: pulse 2s infinite;
            margin-right: 10px;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .mini-chart {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: flex-end;
            gap: 2px;
            padding: 10px;
        }
        
        .mini-bar {
            flex: 1;
            background: linear-gradient(to top, #00d4ff, #2ed573);
            border-radius: 2px 2px 0 0;
            min-height: 2px;
            transition: height 0.3s;
        }
        
        .heatmap-container {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            padding: 15px;
            overflow-x: auto;
        }
        
        .heatmap-row {
            display: flex;
            gap: 1px;
            margin-bottom: 1px;
        }
        
        .heatmap-cell {
            width: 8px;
            height: 20px;
            border-radius: 2px;
            transition: all 0.3s;
        }
        
        .heatmap-cell:hover {
            transform: scale(1.5);
            z-index: 10;
        }
        
        .impact-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 15px;
        }
        
        .impact-stat {
            text-align: center;
            padding: 10px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
        }
        
        .impact-stat-value {
            font-size: 1.5em;
            font-weight: bold;
        }
        
        .impact-stat-label {
            font-size: 0.8em;
            color: #888;
        }
        
        @media (max-width: 768px) {
            .charts-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>
            <span class="status-indicator"></span>
            Coverage-Guided Fuzzer
        </h1>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="totalExecs">0</div>
                <div class="stat-label">Total Executions</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="execPerSec">0</div>
                <div class="stat-label">Executions/sec</div>
            </div>
            <div class="stat-card coverage">
                <div class="stat-value" id="coverageCount">0</div>
                <div class="stat-label">Edges Covered</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="corpusSize">0</div>
                <div class="stat-label">Corpus Size</div>
            </div>
            <div class="stat-card crash">
                <div class="stat-value" id="crashesFound">0</div>
                <div class="stat-label">Crashes Found</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="hangsFound">0</div>
                <div class="stat-label">Hangs Found</div>
            </div>
        </div>
        
        <div class="charts-container">
            <div class="chart-card">
                <h3>Executions Over Time</h3>
                <div class="chart-placeholder">
                    <div class="mini-chart" id="execChart"></div>
                </div>
            </div>
            <div class="chart-card">
                <h3>Coverage Progress</h3>
                <div class="coverage-bar">
                    <div class="coverage-fill" id="coverageBar" style="width: 0%">0%</div>
                </div>
                <div class="chart-placeholder" style="margin-top: 20px;">
                    <div class="mini-chart" id="coverageChart"></div>
                </div>
            </div>
        </div>
        
        <div class="chart-card" style="margin-bottom: 30px;">
            <h3>Byte Impact Heatmap</h3>
            <div class="heatmap-container">
                <div id="heatmapContent"></div>
            </div>
            <div class="impact-stats">
                <div class="impact-stat">
                    <div class="impact-stat-value" style="color: #ff4757;" id="highImpact">0</div>
                    <div class="impact-stat-label">High Impact</div>
                </div>
                <div class="impact-stat">
                    <div class="impact-stat-value" style="color: #ffa502;" id="mediumImpact">0</div>
                    <div class="impact-stat-label">Medium Impact</div>
                </div>
                <div class="impact-stat">
                    <div class="impact-stat-value" style="color: #2ed573;" id="lowImpact">0</div>
                    <div class="impact-stat-label">Low Impact</div>
                </div>
            </div>
        </div>
        
        <div class="crashes-section">
            <h3>Recent Crashes</h3>
            <div class="crash-list" id="crashList">
                <p style="color: #888; text-align: center; padding: 20px;">No crashes found yet</p>
            </div>
        </div>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
    <script>
        const socket = io();
        let execHistory = [];
        let coverageHistory = [];
        
        socket.on('status_update', function(data) {
            document.getElementById('totalExecs').textContent = data.total_execs.toLocaleString();
            document.getElementById('execPerSec').textContent = data.execs_per_sec.toFixed(1);
            document.getElementById('coverageCount').textContent = data.coverage_count;
            document.getElementById('corpusSize').textContent = data.corpus_size;
            document.getElementById('crashesFound').textContent = data.crashes_found;
            document.getElementById('hangsFound').textContent = data.hangs_found;
            
            const coveragePercent = (data.coverage_count / 32768) * 100;
            document.getElementById('coverageBar').style.width = Math.min(coveragePercent, 100) + '%';
            document.getElementById('coverageBar').textContent = coveragePercent.toFixed(2) + '%';
            
            execHistory.push(data.execs_per_sec);
            if (execHistory.length > 30) execHistory.shift();
            updateMiniChart('execChart', execHistory);
            
            coverageHistory.push(data.coverage_count);
            if (coverageHistory.length > 30) coverageHistory.shift();
            updateMiniChart('coverageChart', coverageHistory);
        });
        
        socket.on('crashes_update', function(crashes) {
            const crashList = document.getElementById('crashList');
            
            if (crashes.length === 0) {
                crashList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No crashes found yet</p>';
                return;
            }
            
            crashList.innerHTML = crashes.slice(-10).reverse().map(crash => `
                <div class="crash-item">
                    <h4>${crash.hash.substring(0, 16)}...</h4>
                    <p>Size: ${crash.size} bytes | ${new Date(crash.timestamp * 1000).toLocaleString()}</p>
                    <p style="color: #ff6b6b; margin-top: 5px;">${crash.error.substring(0, 100)}</p>
                </div>
            `).join('');
        });
        
        function updateMiniChart(chartId, data) {
            const chart = document.getElementById(chartId);
            const maxVal = Math.max(...data, 1);
            
            chart.innerHTML = data.map(val => `
                <div class="mini-bar" style="height: ${(val / maxVal) * 100}%"></div>
            `).join('');
        }
        
        function updateHeatmap(heatmapData) {
            const container = document.getElementById('heatmapContent');
            const cellsPerRow = 64;
            let html = '';
            
            for (let row = 0; row < 64; row++) {
                html += '<div class="heatmap-row">';
                for (let col = 0; col < cellsPerRow; col++) {
                    const idx = row * cellsPerRow + col;
                    const value = heatmapData[idx] || 0;
                    const color = getHeatColor(value);
                    html += `<div class="heatmap-cell" style="background: ${color};" title="Position ${idx}: ${(value * 100).toFixed(1)}%"></div>`;
                }
                html += '</div>';
            }
            container.innerHTML = html;
        }
        
        function getHeatColor(value) {
            if (value <= 0) return 'rgba(48, 48, 64, 0.8)';
            if (value < 0.3) return `rgba(46, 213, 115, ${0.3 + value})`;
            if (value < 0.6) return `rgba(255, 165, 2, ${0.5 + value * 0.5})`;
            return `rgba(255, 71, 87, ${0.7 + value * 0.3})`;
        }
        
        socket.on('heatmap_update', function(data) {
            updateHeatmap(data.heatmap);
            document.getElementById('highImpact').textContent = data.high_impact;
            document.getElementById('mediumImpact').textContent = data.medium_impact;
            document.getElementById('lowImpact').textContent = data.low_impact;
        });
        
        for (let i = 0; i < 30; i++) {
            execHistory.push(0);
            coverageHistory.push(0);
        }
        updateMiniChart('execChart', execHistory);
        updateMiniChart('coverageChart', coverageHistory);
        updateHeatmap([]);
    </script>
</body>
</html>
'''


class WebUI:
    def __init__(self, host: str = '0.0.0.0', port: int = 5000):
        self.host = host
        self.port = port
        self.app = Flask(__name__)
        self.app.config['SECRET_KEY'] = 'fuzzer-secret-key'
        self.socketio = SocketIO(self.app, cors_allowed_origins="*")
        
        self.fuzzer = None
        self._setup_routes()
    
    def _setup_routes(self):
        @self.app.route('/')
        def index():
            return render_template_string(HTML_TEMPLATE)
        
        @self.app.route('/api/status')
        def api_status():
            if self.fuzzer:
                status = self.fuzzer.get_status()
                return jsonify({
                    'total_execs': status.total_execs,
                    'execs_per_sec': status.execs_per_sec,
                    'coverage_count': status.coverage_count,
                    'corpus_size': status.corpus_size,
                    'crashes_found': status.crashes_found,
                    'hangs_found': status.hangs_found
                })
            return jsonify({'error': 'Fuzzer not running'})
        
        @self.app.route('/api/crashes')
        def api_crashes():
            if self.fuzzer:
                return jsonify(self.fuzzer.get_crashes())
            return jsonify([])
    
    def set_fuzzer(self, fuzzer):
        self.fuzzer = fuzzer
    
    def start(self, debug: bool = False):
        self.socketio.run(self.app, host=self.host, port=self.port, debug=debug, use_reloader=False)
    
    def emit_status(self, status):
        self.socketio.emit('status_update', {
            'total_execs': status.total_execs,
            'execs_per_sec': status.execs_per_sec,
            'coverage_count': status.coverage_count,
            'corpus_size': status.corpus_size,
            'crashes_found': status.crashes_found,
            'hangs_found': status.hangs_found
        })
        
        if hasattr(self.fuzzer, 'mutator'):
            try:
                heatmap = self.fuzzer.mutator.get_impact_heatmap()
                stats = self.fuzzer.mutator.get_statistics()
                self.socketio.emit('heatmap_update', {
                    'heatmap': heatmap[:4096],
                    'high_impact': stats.get('high_impact_positions', 0),
                    'medium_impact': stats.get('medium_impact_positions', 0),
                    'low_impact': 0
                })
            except:
                pass
    
    def emit_crashes(self, crashes):
        self.socketio.emit('crashes_update', crashes)
    
    def run_in_background(self):
        thread = threading.Thread(target=self.start, daemon=True)
        thread.start()
        return thread
