const fs = require('fs');
const path = require('path');
const b = 'e:/solor/0508-1224';

fs.writeFileSync(path.join(b, 'js', 'app.js'), `const App = {
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
document.addEventListener('DOMContentLoaded', function() { App.init(); });
`, 'utf8');

console.log('app.js written');