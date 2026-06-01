package report

const reportTemplateHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LLM压测报告 - {{.TestName}}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1e40af, #7c3aed); padding: 30px; border-radius: 12px; margin-bottom: 24px; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header .meta { display: flex; gap: 30px; flex-wrap: wrap; opacity: 0.9; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .summary-card { background: #1e293b; padding: 20px; border-radius: 10px; border-left: 4px solid #3b82f6; }
        .summary-card .label { font-size: 13px; color: #94a3b8; margin-bottom: 8px; }
        .summary-card .value { font-size: 24px; font-weight: 600; }
        .summary-card.success { border-left-color: #10b981; }
        .summary-card.error { border-left-color: #ef4444; }
        .section { background: #1e293b; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
        .section h2 { font-size: 18px; margin-bottom: 20px; color: #f1f5f9; }
        .percentile-table { width: 100%; border-collapse: collapse; }
        .percentile-table th, .percentile-table td { padding: 12px 16px; text-align: right; border-bottom: 1px solid #334155; }
        .percentile-table th { background: #334155; font-weight: 500; }
        .percentile-table td:first-child, .percentile-table th:first-child { text-align: left; }
        .chart-container { height: 300px; margin-bottom: 20px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        .status-200 { background: #065f46; color: #34d399; }
        .status-4xx { background: #92400e; color: #fbbf24; }
        .status-5xx { background: #7f1d1d; color: #fca5a5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LLM压测报告 - {{.TestName}}</h1>
            <div class="meta">
                <span>测试ID: {{.TestID}}</span>
                <span>目标: {{.TargetURL}}</span>
                <span>模式: {{.Mode}}</span>
                <span>开始: {{.StartTime}}</span>
                <span>结束: {{.EndTime}}</span>
                <span>时长: {{.Duration}}</span>
                <span>Worker数: {{.WorkerCount}}</span>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="label">总请求数</div>
                <div class="value">{{.TotalRequests}}</div>
            </div>
            <div class="summary-card success">
                <div class="label">成功请求</div>
                <div class="value">{{.SuccessRequests}}</div>
            </div>
            <div class="summary-card error">
                <div class="label">失败请求</div>
                <div class="value">{{.FailedRequests}}</div>
            </div>
            <div class="summary-card">
                <div class="label">错误率</div>
                <div class="value">{{.ErrorRate}}</div>
            </div>
            <div class="summary-card">
                <div class="label">平均QPS</div>
                <div class="value">{{.AverageQPS}}</div>
            </div>
        </div>

        <div class="section">
            <h2>QPS 趋势</h2>
            <div class="chart-container">
                <canvas id="qpsChart"></canvas>
            </div>
        </div>

        <div class="grid-2">
            <div class="section">
                <h2>延迟趋势 (P95)</h2>
                <div class="chart-container">
                    <canvas id="latencyChart"></canvas>
                </div>
            </div>
            <div class="section">
                <h2>HTTP状态码分布</h2>
                <table class="percentile-table">
                    <thead>
                        <tr><th>状态码</th><th>数量</th><th>占比</th></tr>
                    </thead>
                    <tbody>
                        {{range .StatusCodes}}
                        <tr>
                            <td><span class="status-badge status-{{if eq .Code 200}}200{{else if lt .Code 500}}4xx{{else}}5xx{{end}}">{{.Code}}</span></td>
                            <td>{{.Count}}</td>
                            <td>{{.Pct}}</td>
                        </tr>
                        {{end}}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <h2>延迟分位数统计 (ms)</h2>
            <table class="percentile-table">
                <thead>
                    <tr><th>指标</th><th>Min</th><th>Avg</th><th>P50</th><th>P90</th><th>P95</th><th>P99</th><th>Max</th></tr>
                </thead>
                <tbody>
                    <tr><td>首Token延迟 (TTFT)</td><td>{{.TTFT.Min}}</td><td>{{.TTFT.Avg}}</td><td>{{.TTFT.P50}}</td><td>{{.TTFT.P90}}</td><td>{{.TTFT.P95}}</td><td>{{.TTFT.P99}}</td><td>{{.TTFT.Max}}</td></tr>
                    <tr><td>每Token延迟 (TPOT)</td><td>{{.TPOT.Min}}</td><td>{{.TPOT.Avg}}</td><td>{{.TPOT.P50}}</td><td>{{.TPOT.P90}}</td><td>{{.TPOT.P95}}</td><td>{{.TPOT.P99}}</td><td>{{.TPOT.Max}}</td></tr>
                    <tr><td>端到端延迟</td><td>{{.Total.Min}}</td><td>{{.Total.Avg}}</td><td>{{.Total.P50}}</td><td>{{.Total.P90}}</td><td>{{.Total.P95}}</td><td>{{.Total.P99}}</td><td>{{.Total.Max}}</td></tr>
                </tbody>
            </table>
        </div>

        <div class="grid-2">
            <div class="section">
                <h2>响应长度分位数</h2>
                <table class="percentile-table">
                    <thead>
                        <tr><th>指标</th><th>Min</th><th>Avg</th><th>P50</th><th>P90</th><th>P95</th><th>P99</th><th>Max</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>字符数</td><td>{{.Length.Min}}</td><td>{{.Length.Avg}}</td><td>{{.Length.P50}}</td><td>{{.Length.P90}}</td><td>{{.Length.P95}}</td><td>{{.Length.P99}}</td><td>{{.Length.Max}}</td></tr>
                        <tr><td>Token数</td><td>{{.Tokens.Min}}</td><td>{{.Tokens.Avg}}</td><td>{{.Tokens.P50}}</td><td>{{.Tokens.P90}}</td><td>{{.Tokens.P95}}</td><td>{{.Tokens.P99}}</td><td>{{.Tokens.Max}}</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="section">
                <h2>错误类型分布</h2>
                <table class="percentile-table">
                    <thead>
                        <tr><th>错误类型</th><th>数量</th><th>占比</th></tr>
                    </thead>
                    <tbody>
                        {{range .ErrorTypes}}
                        <tr><td>{{.Type}}</td><td>{{.Count}}</td><td>{{.Pct}}</td></tr>
                        {{else}}
                        <tr><td colspan="3" style="text-align:center;color:#64748b;">无错误</td></tr>
                        {{end}}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        const qpsData = {{.QPSChartData}};
        const latencyData = {{.LatencyChartData}};

        new Chart(document.getElementById('qpsChart'), {
            type: 'line',
            data: {
                labels: qpsData.map(d => d.time),
                datasets: [{ label: 'QPS', data: qpsData.map(d => d.qps), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });

        new Chart(document.getElementById('latencyChart'), {
            type: 'line',
            data: {
                labels: latencyData.map(d => d.time),
                datasets: [
                    { label: 'TTFT P95', data: latencyData.map(d => d.ttft_p95), borderColor: '#10b981', tension: 0.4 },
                    { label: 'TPOT P95', data: latencyData.map(d => d.tpot_p95), borderColor: '#f59e0b', tension: 0.4 },
                    { label: 'Total P95', data: latencyData.map(d => d.total_latency_p95), borderColor: '#ef4444', tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    </script>
</body>
</html>`

const abReportTemplateHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A/B对比测试报告 - {{.TestName}}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 30px; border-radius: 12px; margin-bottom: 24px; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .winner-badge { display: inline-block; background: #10b981; padding: 6px 16px; border-radius: 20px; font-weight: 600; margin-top: 10px; }
        .comparison-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .version-card { background: #1e293b; padding: 24px; border-radius: 10px; }
        .version-card.a { border-top: 4px solid #3b82f6; }
        .version-card.b { border-top: 4px solid #f59e0b; }
        .version-card h3 { font-size: 16px; margin-bottom: 16px; }
        .metric-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; }
        .metric-row .label { color: #94a3b8; }
        .metric-row .value { font-weight: 600; }
        .comp-card { background: linear-gradient(135deg, #1e40af, #3730a3); }
        .improvement { color: #10b981; }
        .regression { color: #ef4444; }
        .section { background: #1e293b; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
        .section h2 { font-size: 18px; margin-bottom: 20px; }
        .chart-container { height: 300px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 768px) { .comparison-grid { grid-template-columns: 1fr; } .grid-2 { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>A/B对比测试报告 - {{.TestName}}</h1>
            <div>测试ID: {{.TestID}}</div>
            <div class="winner-badge">🏆 优胜者: {{.Comparison.Winner}}</div>
        </div>

        <div class="comparison-grid">
            <div class="version-card a">
                <h3>🔵 版本 A</h3>
                <div class="metric-row"><span class="label">目标地址</span><span class="value" style="font-size:12px;">{{.ResultA.TargetURL}}</span></div>
                <div class="metric-row"><span class="label">总请求数</span><span class="value">{{.ResultA.TotalRequests}}</span></div>
                <div class="metric-row"><span class="label">成功率</span><span class="value">{{.ResultA.SuccessRequests}}/{{.ResultA.TotalRequests}}</span></div>
                <div class="metric-row"><span class="label">错误率</span><span class="value">{{.ResultA.ErrorRate}}</span></div>
                <div class="metric-row"><span class="label">平均QPS</span><span class="value">{{.ResultA.AverageQPS}}</span></div>
                <div class="metric-row"><span class="label">TTFT P95</span><span class="value">{{.ResultA.TTFTP95}}</span></div>
                <div class="metric-row"><span class="label">TPOT P95</span><span class="value">{{.ResultA.TPOTP95}}</span></div>
                <div class="metric-row"><span class="label">总延迟 P95</span><span class="value">{{.ResultA.TotalP95}}</span></div>
            </div>
            <div class="version-card b">
                <h3>🟡 版本 B</h3>
                <div class="metric-row"><span class="label">目标地址</span><span class="value" style="font-size:12px;">{{.ResultB.TargetURL}}</span></div>
                <div class="metric-row"><span class="label">总请求数</span><span class="value">{{.ResultB.TotalRequests}}</span></div>
                <div class="metric-row"><span class="label">成功率</span><span class="value">{{.ResultB.SuccessRequests}}/{{.ResultB.TotalRequests}}</span></div>
                <div class="metric-row"><span class="label">错误率</span><span class="value">{{.ResultB.ErrorRate}}</span></div>
                <div class="metric-row"><span class="label">平均QPS</span><span class="value">{{.ResultB.AverageQPS}}</span></div>
                <div class="metric-row"><span class="label">TTFT P95</span><span class="value">{{.ResultB.TTFTP95}}</span></div>
                <div class="metric-row"><span class="label">TPOT P95</span><span class="value">{{.ResultB.TPOTP95}}</span></div>
                <div class="metric-row"><span class="label">总延迟 P95</span><span class="value">{{.ResultB.TotalP95}}</span></div>
            </div>
            <div class="version-card comp-card">
                <h3>📊 对比结果 (B相对A)</h3>
                <div class="metric-row"><span class="label">QPS变化</span><span class="value {{if gt .Comparison.QPSDifference 0}}improvement{{else if lt .Comparison.QPSDifference 0}}regression{{end}}">{{.Comparison.QPSDifference}}</span></div>
                <div class="metric-row"><span class="label">错误率变化</span><span class="value {{if lt .Comparison.ErrorRateDifference 0}}improvement{{else if gt .Comparison.ErrorRateDifference 0}}regression{{end}}">{{.Comparison.ErrorRateDifference}}</span></div>
                <div class="metric-row"><span class="label">TTFT P95变化</span><span class="value {{if lt .Comparison.TTFTImprovement 0}}improvement{{else if gt .Comparison.TTFTImprovement 0}}regression{{end}}">{{.Comparison.TTFTImprovement}}</span></div>
                <div class="metric-row"><span class="label">TPOT P95变化</span><span class="value {{if lt .Comparison.TPOTImprovement 0}}improvement{{else if gt .Comparison.TPOTImprovement 0}}regression{{end}}">{{.Comparison.TPOTImprovement}}</span></div>
                <div class="metric-row"><span class="label">总延迟 P95变化</span><span class="value {{if lt .Comparison.TotalImprovement 0}}improvement{{else if gt .Comparison.TotalImprovement 0}}regression{{end}}">{{.Comparison.TotalImprovement}}</span></div>
            </div>
        </div>

        <div class="grid-2">
            <div class="section">
                <h2>QPS对比</h2>
                <div class="chart-container">
                    <canvas id="qpsCompareChart"></canvas>
                </div>
            </div>
            <div class="section">
                <h2>延迟对比 (P95)</h2>
                <div class="chart-container">
                    <canvas id="latencyCompareChart"></canvas>
                </div>
            </div>
        </div>
    </div>

    <script>
        const timeSeries = {{.TimeSeriesJSON}};
        const labels = timeSeries.map(d => d.index);

        new Chart(document.getElementById('qpsCompareChart'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '版本A QPS', data: timeSeries.map(d => d.a_qps), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
                    { label: '版本B QPS', data: timeSeries.map(d => d.b_qps), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        new Chart(document.getElementById('latencyCompareChart'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '版本A 延迟P95', data: timeSeries.map(d => d.a_latency), borderColor: '#3b82f6', tension: 0.4 },
                    { label: '版本B 延迟P95', data: timeSeries.map(d => d.b_latency), borderColor: '#f59e0b', tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    </script>
</body>
</html>`
