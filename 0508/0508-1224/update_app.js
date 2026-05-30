const fs = require('fs');
const path = require('path');

const oldContent = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');

let newContent = oldContent
    .replace(
        'currentN: 5, treeData: null, animationSequence: [],',
        'currentN: 5, treeData: null, animationSequence: [],\n    isCalculating: false,'
    )
    .replace(
        /calculate: function\(\) \{[\s\S]*?    \},/,
        `calculate: function() {
        const input = document.getElementById('input-n');
        const n = parseInt(input.value);
        if (n < 1 || n > 40) { alert('请输入1-40之间的数字'); return; }
        if (this.isCalculating) return;
        this.currentN = n;
        this.isCalculating = true;
        this.showLoading(true);
        TreeAnimation.stop();
        const self = this;
        setTimeout(function() {
            const recursiveResult = Algorithms.fibRecursiveWithStats(n);
            const tailResult = Algorithms.fibTailRecursiveWithStats(n);
            const dpResult = Algorithms.fibDP(n);
            self.treeData = TreeBuilder.buildTree(n);
            self.animationSequence = TreeBuilder.getAnimationSequence(self.treeData.root);
            const duplicates = TreeBuilder.getDuplicateCounts(self.treeData.root);
            self.updateResult(recursiveResult.result);
            self.updateComparison(recursiveResult.stats, tailResult.stats, dpResult.stats);
            self.updateDuplicates(duplicates);
            const svg = document.getElementById('tree-svg');
            TreeRenderer.init(svg);
            TreeRenderer.render(self.treeData);
            TreeAnimation.init(TreeRenderer);
            TreeAnimation.setSequence(self.animationSequence);
            self.isCalculating = false;
            self.showLoading(false);
        }, 10);
    },

    showLoading: function(show) {
        const btn = document.getElementById('btn-calculate');
        btn.disabled = show;
        btn.textContent = show ? '计算中...' : '计算';
        btn.style.opacity = show ? '0.6' : '1';
    },`
    );

fs.writeFileSync(path.join(__dirname, 'js', 'app.js'), newContent);
console.log('Done. New length:', newContent.length);
