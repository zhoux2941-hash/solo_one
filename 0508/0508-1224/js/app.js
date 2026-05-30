const App = {
    currentN: 5, treeData: null, animationSequence: [],
    isCalculating: false,

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
        if (n < 1 || n > 40) { alert('请输入1-40之间的数字'); return; }
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
            '<div class="algo-title">递归算法</div>' +
            '<div class="algo-row"><span>耗时</span><span>' + recursiveStats.time.toFixed(3) + ' ms</span></div>' +
            '<div class="algo-row"><span>调用次数</span><span>' + recursiveStats.calls + '</span></div>' +
            '<div class="algo-row"><span>重复计算</span><span>' + recursiveStats.duplicates + '</span></div>' +
            '<div class="algo-row"><span>空间</span><span>O(2ⁿ)</span></div>' +
            (recursiveStats.time === minTime ? '<div class="fastest">最快</div>' : '') +
            '</div>' +
            '<div class="algo-card algo-tail">' +
            '<div class="algo-title">尾递归优化</div>' +
            '<div class="algo-row"><span>耗时</span><span>' + tailStats.time.toFixed(3) + ' ms</span></div>' +
            '<div class="algo-row"><span>调用次数</span><span>' + tailStats.calls + '</span></div>' +
            '<div class="algo-row"><span>重复计算</span><span>0</span></div>' +
            '<div class="algo-row"><span>空间</span><span>' + tailStats.space + '</span></div>' +
            (tailStats.time === minTime ? '<div class="fastest">最快</div>' : '') +
            '</div>' +
            '<div class="algo-card algo-dp">' +
            '<div class="algo-title">动态规划</div>' +
            '<div class="algo-row"><span>耗时</span><span>' + dpStats.time.toFixed(3) + ' ms</span></div>' +
            '<div class="algo-row"><span>迭代次数</span><span>' + dpStats.iterations + '</span></div>' +
            '<div class="algo-row"><span>重复计算</span><span>0</span></div>' +
            '<div class="algo-row"><span>空间</span><span>' + dpStats.space + '</span></div>' +
            (dpStats.time === minTime ? '<div class="fastest">最快</div>' : '') +
            '</div>';
    },

    updateDuplicates: function(duplicates) {
        const duplicatesDiv = document.getElementById('duplicates');
        if (duplicates.length === 0) {
            duplicatesDiv.innerHTML = '<p>无重复计算</p>';
            return;
        }
        let html = '<h4 style="margin-bottom:10px;">重复计算统计</h4>';
        duplicates.forEach(function(item) {
            var nodeIds = item.nodeIds ? item.nodeIds.join(',') : '';
            html += '<div class="duplicate-item" data-value="' + item.n + '" data-node-ids="' + nodeIds + '" style="cursor:pointer;">' +
                '<span>F(' + item.n + ')</span><span>计算 ' + item.count + ' 次</span></div>';
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

    updateDuplicates: function(duplicates) {
        const duplicatesDiv = document.getElementById('duplicates');
        if (duplicates.length === 0) {
            duplicatesDiv.innerHTML = '<p>无重复计算</p>';
            return;
        }
        let html = '<h4 style="margin-bottom:10px;">重复计算统计</h4>';
        duplicates.forEach(function(item) {
            var nodeIds = item.nodeIds ? item.nodeIds.join(',') : '';
            html += '<div class="duplicate-item" data-value="' + item.n + '" data-node-ids="' + nodeIds + '" style="cursor:pointer;">' +
                '<span>F(' + item.n + ')</span><span>计算 ' + item.count + ' 次</span></div>';
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
            var nodeIds = item.nodeIds ? item.nodeIds.join(',') : '';
            html += '<div class="duplicate-item" data-value="' + item.n + '" data-node-ids="' + nodeIds + '" style="cursor:pointer;">' +
                '<span>F(' + item.n + ')</span><span>计算 ' + item.count + ' 次</span></div>';
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
                function traverse(node) {
                    if (!node) return;
                    allNodes.push(node);
                    counts[node.value] = (counts[node.value] || 0) + 1;
                    node.children.forEach(child => traverse(child));
                }
                traverse(root);
                const duplicates = [];
                for (const [value, count] of Object.entries(counts)) {
                    if (count > 1) {
                        const nodesWithValue = allNodes.filter(n => n.value === parseInt(value));
                        duplicates.push({ n: parseInt(value), count, nodeIds: nodesWithValue.map(n => n.id) });
                    }
                }
                return duplicates.sort((a, b) => b.n - a.n);
            }

            self.onmessage = function(e) {
                const { type, n } = e.data;
                if (type === 'calculate') {
                    try {
                        const recursiveResult = fibRecursiveWithStats(n);
                        const tailResult = fibTailRecursiveWithStats(n);
                        const dpResult = fibDP(n);
                        const treeData = buildTree(n);
                        const animationSequence = getAnimationSequence(treeData.root);
                        const duplicates = getDuplicateCounts(treeData.root);
                        self.postMessage({ type: 'result', recursiveResult, tailResult, dpResult, treeData, animationSequence, duplicates });
                    } catch (error) {
                        self.postMessage({ type: 'error', message: error.message });
                    }
                }
            };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));

        this.worker.onmessage = (e) => {
            if (e.data.type === 'result') {
                this.handleCalculationResult(e.data);
            } else if (e.data.type === 'error') {
            }
        };

        this.worker.onerror = (err) => {
        };
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
        if (n < 1 || n > 40) { alert('请输入1-40之间的数字'); return; }
        if (this.isCalculating) return;
        
        this.currentN = n;
        this.isCalculating = true;
        this.showLoading(true);
        TreeAnimation.stop();
        this.worker.postMessage({ type: 'calculate', n });
    },

    handleCalculationResult: function(data) {
        const { recursiveResult, tailResult, dpResult, treeData, animationSequence, duplicates } = data;
        
        this.treeData = treeData;
        this.animationSequence = animationSequence;
        this.updateResult(recursiveResult.result);
        this.updateComparison(recursiveResult.stats, tailResult.stats, dpResult.stats);
        this.updateDuplicates(duplicates);
        const svg = document.getElementById('tree-svg');
        TreeRenderer.init(svg);
        TreeRenderer.render(this.treeData);
        TreeAnimation.init(TreeRenderer);
        TreeAnimation.setSequence(this.animationSequence);
        this.isCalculating = false;
        this.showLoading(false);
    },

    showLoading: function(show) {
        let loader = document.getElementById('loading-overlay');
        if (!loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
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
            '<div class="algo-title">递归算法</div>' +
            '<div class="algo-row"><span>耗时</span><span>' + recursiveStats.time.toFixed(3) + ' ms</span></div>' +
            '<div class="algo-row"><span>调用次数</span><span>' + recursiveStats.calls + '</span></div>' +
            '<div class="algo-row"><span>重复计算</span><span>' + recursiveStats.duplicates + '</span></div>' +
            '<div class="algo-row"><span>空间</span><span>O(2^n)</span></div>' +
            (recursiveStats.time === minTime ? '<div class="fastest">最快</div>' : '') +
            '</div>' +
            '<div class="algo-card algo-tail">' +
            '<div class="algo-title">尾递归优化</div>' +
            '<div class="algo-row"><span>耗时</span><span>' + tailStats.time.toFixed(3) + ' ms</span></div>' +
            '<div class="algo-row"><span>调用次数</span><span>' + tailStats.calls + '</span></div>' +
            '<div class="algo-row"><span>重复计算</span><span>0</span></div>' +
            '<div class="algo-row"><span>空间</span><span>' + tailStats.space + '</span></div>' +
            (tailStats.time === minTime ? '<div class="fastest">最快</div>' : '') +
            '</div>' +
            '<div class="algo-card algo-dp">' +
            '<div class="algo-title">动态规划</div>' +
            '<div class="algo-row"><span>耗时</span><span>' + dpStats.time.toFixed(3) + ' ms</span></div>' +
            '<div class="algo-row"><span>迭代次数</span><span>' + dpStats.iterations + '</span></div>' +
            '<div class="algo-row"><span>重复计算</span><span>0</span></div>' +
            '<div class="algo-row"><span>空间</span><span>' + dpStats.space + '</span></div>' +
            (dpStats.time === minTime ? '<div class="fastest">最快</div>' : '') +
            '</div>';
    },

    updateDuplicates: function(duplicates) {
        const duplicatesDiv = document.getElementById('duplicates');
        if (duplicates.length === 0) {
            duplicatesDiv.innerHTML = '<p>无重复计算</p>';
            return;
        }
        let html = '<h4 style="margin-bottom:10px;">重复计算统计</h4>';
        duplicates.forEach(item => {
            const nodeIds = item.nodeIds ? item.nodeIds.join(',') : '';
            html += '<div class="duplicate-item" data-value="' + item.n + '" data-node-ids="' + nodeIds + '" style="cursor:pointer;">' +
                '<span>F(' + item.n + ')</span><span>计算 ' + item.count + ' 次</span></div>';
        });
        duplicatesDiv.innerHTML = html;
        duplicatesDiv.querySelectorAll('.duplicate-item').forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const nodeIds = e.currentTarget.dataset.nodeIds;
                if (nodeIds) {
                    TreeRenderer.highlightDuplicatesByIds(nodeIds.split(',').map(Number));
                } else {
                    const value = parseInt(e.currentTarget.dataset.value);
                    TreeRenderer.highlightDuplicates(value);
                }
            });
            el.addEventListener('mouseleave', () => {
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
        const svg = document.getElementById('tree-svg');
        Exporter.exportPNG(svg, 'fibonacci-' + this.currentN + '.png');
    },
    exportSVG: function() {
        const svg = document.getElementById('tree-svg');
        Exporter.exportSVG(svg, 'fibonacci-' + this.currentN + '.svg');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
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
                TreeRenderer.clearHighlights();
            });
        });
    },

    playAnimation: function() {
        if (!this.treeData) return;
        TreeAnimation.play();
    },

    pauseAnimation: function() {
        TreeAnimation.pause();
    },

    resetAnimation: function() {
        TreeAnimation.reset();
        if (this.treeData) {
            TreeRenderer.render(this.treeData);
        }
    },

    exportPNG: function() {
        const svg = document.getElementById('tree-svg');
        Exporter.exportPNG(svg, `fibonacci-${this.currentN}.png`);
    },

    exportSVG: function() {
        const svg = document.getElementById('tree-svg');
        Exporter.exportSVG(svg, `fibonacci-${this.currentN}.svg`);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
