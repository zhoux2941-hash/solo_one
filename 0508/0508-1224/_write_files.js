const fs = require('fs');
const path = require('path');

const algorithmsContent = `const Algorithms = {
    fibRecursive: function(n, stats) {
        if (!stats) stats = { calls: 0, callCounts: {} };
        stats.calls++;
        stats.callCounts[n] = (stats.callCounts[n] || 0) + 1;
        if (n <= 0) return 0;
        if (n === 1) return 1;
        return this.fibRecursive(n - 1, stats) + this.fibRecursive(n - 2, stats);
    },

    fibRecursiveWithStats: function(n) {
        const stats = { calls: 0, callCounts: {}, duplicates: 0, time: 0 };
        const startTime = performance.now();
        const result = this.fibRecursive(n, stats);
        stats.time = performance.now() - startTime;
        for (const key in stats.callCounts) {
            if (stats.callCounts[key] > 1) {
                stats.duplicates += stats.callCounts[key] - 1;
            }
        }
        return { result, stats };
    },

    fibTailRecursive: function(n, a, b, stats) {
        if (a === undefined) a = 0;
        if (b === undefined) b = 1;
        if (!stats) stats = { calls: 0, time: 0, space: 'O(n)' };
        stats.calls++;
        if (n === 0) return a;
        if (n === 1) return b;
        return this.fibTailRecursive(n - 1, b, a + b, stats);
    },

    fibTailRecursiveWithStats: function(n) {
        const stats = { calls: 0, time: 0, space: 'O(n)' };
        const startTime = performance.now();
        const result = this.fibTailRecursive(n, 0, 1, stats);
        stats.time = performance.now() - startTime;
        return { result, stats };
    },

    fibDP: function(n) {
        const stats = { iterations: 0, time: 0, space: 'O(1)' };
        const startTime = performance.now();
        if (n <= 0) return { result: 0, stats };
        if (n === 1) return { result: 1, stats };
        let a = 0, b = 1, c = 0;
        for (let i = 2; i <= n; i++) {
            stats.iterations++;
            c = a + b; a = b; b = c;
        }
        stats.time = performance.now() - startTime;
        return { result: c, stats };
    }
};`;

const appContent = `const App = {
    currentN: 5, treeData: null, animationSequence: [],

    init: function() {
        this.bindEvents();
        this.calculate();
    },

    bindEvents: function() {
        document.getElementById('btn-calculate').addEventListener('click', () => this.calculate());
        document.getElementById('btn-play').addEventListener('click', () => this.playAnimation());
        document.getElementById('btn-pause').addEventListener('click', () => this.pauseAnimation());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetAnimation());
        document.getElementById('btn-export-png').addEventListener('click', () => this.exportPNG());
        document.getElementById('btn-export-svg').addEventListener('click', () => this.exportSVG());
        document.getElementById('speed-range').addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = speed + 'x';
            TreeAnimation.setSpeed(speed);
        });
    },

    calculate: function() {
        const input = document.getElementById('input-n');
        const n = parseInt(input.value);
        if (n < 1 || n > 40) { alert('\u8BF7\u8F93\u51651-40\u4E4B\u95F4\u7684\u6570\u5B57'); return; }
        this.currentN = n;
        TreeAnimation.stop();
        const recursiveResult = Algorithms.fibRecursiveWithStats(n);
        const tailResult = Algorithms.fibTailRecursiveWithStats(n);
        const dpResult = Algorithms.fibDP(n);
        this.treeData = TreeBuilder.buildTree(n);
        this.animationSequence = TreeBuilder.getAnimationSequence(this.treeData.root);
        const duplicates = TreeBuilder.getDuplicateCounts(this.treeData.root);
        this.updateResult(recursiveResult.result);
        this.updateComparison(recursiveResult.stats, tailResult.stats, dpResult.stats);
        this.updateDuplicates(duplicates);
        const svg = document.getElementById('tree-svg');
        TreeRenderer.init(svg);
        TreeRenderer.render(this.treeData);
        TreeAnimation.init(TreeRenderer);
        TreeAnimation.setSequence(this.animationSequence);
    },

    updateResult: function(result) {
        document.getElementById('result').textContent = 'F(' + this.currentN + ') = ' + result;
    },

    updateComparison: function(recursiveStats, tailStats, dpStats) {
        const comparisonDiv = document.getElementById('comparison');
        const times = [recursiveStats.time, tailStats.time, dpStats.time];
        const minTime = Math.min.apply(null, times);
        comparisonDiv.innerHTML =
            '<div class="algo-card algo-recursive">' +
            '<div class="algo-title">\u9012\u5F52\u7B97\u6CD5</div>' +
            '<div class="algo-row"><span>\u8017\u65F6</span><span>' + recursiveStats.time.toFixed(3) + ' ms</span></div>' +
            '<div class="algo-row"><span>\u8C03\u7528\u6B21\u6570</span><span>' + recursiveStats.calls + '</span></div>' +
            '<div class="algo-row"><span>\u91CD\u590D\u8BA1\u7B97</span><span>' + recursiveStats.duplicates + '</span></div>' +
            '<div class="algo-row"><span>\u7A7A\u95F4</span><span>O(2\u207F)</span></div>' +
            (recursiveStats.time === minTime ? '<div class="fastest">\u6700\u5FEB</div>' : '') +
            '</div>' +
            '<div class="algo-card algo-tail">' +
            '<div class="algo-title">\u5C3E\u9012\u5F52\u4F18\u5316</div>' +
            '<div class="algo-row"><span>\u8017\u65F6</span><span>' + tailStats.time.toFixed(3) + ' ms</span></div>' +
            '<div class="algo-row"><span>\u8C03\u7528\u6B21\u6570</span><span>' + tailStats.calls + '</span></div>' +
            '<div class="algo-row"><span>\u91CD\u590D\u8BA1\u7B97</span><span>0</span></div>' +
            '<div class="algo-row"><span>\u7A7A\u95F4</span><span>' + tailStats.space + '</span></div>' +
            (tailStats.time === minTime ? '<div class="fastest">\u6700\u5FEB</div>' : '') +
            '</div>' +
            '<div class="algo-card algo-dp">' +
            '<div class="algo-title">\u52A8\u6001\u89C4\u5212</div>' +
            '<div class="algo-row"><span>\u8017\u65F6</span><span>' + dpStats.time.toFixed(3) + ' ms</span></div>' +
            '<div class="algo-row"><span>\u8FED\u4EE3\u6B21\u6570</span><span>' + dpStats.iterations + '</span></div>' +
            '<div class="algo-row"><span>\u91CD\u590D\u8BA1\u7B97</span><span>0</span></div>' +
            '<div class="algo-row"><span>\u7A7A\u95F4</span><span>' + dpStats.space + '</span></div>' +
            (dpStats.time === minTime ? '<div class="fastest">\u6700\u5FEB</div>' : '') +
            '</div>';
    },

    updateDuplicates: function(duplicates) {
        const duplicatesDiv = document.getElementById('duplicates');
        if (duplicates.length === 0) {
            duplicatesDiv.innerHTML = '<p>\u65E0\u91CD\u590D\u8BA1\u7B97</p>';
            return;
        }
        let html = '<h4 style="margin-bottom:10px;">\u91CD\u590D\u8BA1\u7B97\u7EDF\u8BA1</h4>';
        duplicates.forEach(function(item) {
            var nodeIds = item.nodeIds ? item.nodeIds.join(',') : '';
            html += '<div class="duplicate-item" data-value="' + item.n + '" data-node-ids="' + nodeIds + '" style="cursor:pointer;">' +
                '<span>F(' + item.n + ')</span><span>\u8BA1\u7B97 ' + item.count + ' \u6B21</span></div>';
        });
        duplicatesDiv.innerHTML = html;
        duplicatesDiv.querySelectorAll('.duplicate-item').forEach(function(el) {
            el.addEventListener('mouseenter', function(e) {
                var ids = e.currentTarget.dataset.nodeIds;
                if (ids) {
                    TreeRenderer.highlightDuplicatesByIds(ids.split(',').map(Number));
                } else {
                    TreeRenderer.highlightDuplicates(parseInt(e.currentTarget.dataset.value));
                }
            });
            el.addEventListener('mouseleave', function() {
                TreeRenderer.clearHighlights();
            });
        });
    },

    playAnimation: function() { if (!this.treeData) return; TreeAnimation.play(); },
    pauseAnimation: function() { TreeAnimation.pause(); },
    resetAnimation: function() {
        TreeAnimation.reset();
        if (this.treeData) TreeRenderer.render(this.treeData);
    },
    exportPNG: function() {
        var svg = document.getElementById('tree-svg');
        Exporter.exportPNG(svg, 'fibonacci-' + this.currentN + '.png');
    },
    exportSVG: function() {
        var svg = document.getElementById('tree-svg');
        Exporter.exportSVG(svg, 'fibonacci-' + this.currentN + '.svg');
    }
};
document.addEventListener('DOMContentLoaded', function() { App.init(); });`;

const cssContent = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; }
.container { max-width: 1400px; margin: 0 auto; padding: 20px; }
header { text-align: center; color: white; margin-bottom: 30px; }
header h1 { font-size: 2.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
.controls { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 15px; align-items: center; }
.controls input[type="number"] { padding: 10px 15px; border: 2px solid #e0e0e0; border-radius: 8px; width: 100px; }
.controls button { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; background: #667eea; color: white; font-size: 0.95rem; }
.controls button:hover { opacity: 0.9; }
.main-content { display: grid; grid-template-columns: 350px 1fr; gap: 20px; }
.left-panel { display: flex; flex-direction: column; gap: 20px; }
.left-panel > div { background: white; border-radius: 12px; padding: 20px; }
#result { font-size: 1.5rem; font-weight: bold; color: #667eea; text-align: center; }
#comparison { display: flex; flex-direction: column; gap: 12px; }
.algo-card { padding: 14px; border-radius: 10px; position: relative; }
.algo-recursive { background: #fff0f0; border-left: 5px solid #e74c3c; }
.algo-tail { background: #f0fff0; border-left: 5px solid #27ae60; }
.algo-dp { background: #f0f0ff; border-left: 5px solid #3498db; }
.algo-title { font-weight: bold; font-size: 1rem; margin-bottom: 8px; }
.algo-recursive .algo-title { color: #e74c3c; }
.algo-tail .algo-title { color: #27ae60; }
.algo-dp .algo-title { color: #3498db; }
.algo-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 0.9rem; }
.fastest { position: absolute; top: 10px; right: 12px; background: #f39c12; color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }
.duplicate-item { display: flex; justify-content: space-between; padding: 8px 12px; margin: 5px 0; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107; }
.right-panel { background: white; border-radius: 12px; padding: 20px; min-height: 600px; overflow: auto; }
#tree-svg { width: 100%; min-height: 550px; }
.node circle { stroke: #667eea; stroke-width: 3; fill: white; transition: all 0.3s ease; }
.node.highlighted circle { fill: #ffc107; stroke: #ff9800; }
.node.calculated circle { fill: #4caf50; stroke: #2e7d32; }
.node.animating circle { fill: #2196f3; stroke: #1976d2; }
.node text { font-size: 12px; text-anchor: middle; }
.link { fill: none; stroke: #ccc; stroke-width: 2; }
.link.visible { stroke: #667eea; }
@media (max-width: 900px) { .main-content { grid-template-columns: 1fr; } }`;

const baseDir = 'e:/solor/0508-1224';

fs.writeFileSync(path.join(baseDir, 'js', 'algorithms.js'), algorithmsContent, 'utf8');
console.log('algorithms.js written');

fs.writeFileSync(path.join(baseDir, 'js', 'app.js'), appContent, 'utf8');
console.log('app.js written');

fs.writeFileSync(path.join(baseDir, 'css', 'style.css'), cssContent, 'utf8');
console.log('style.css written');
