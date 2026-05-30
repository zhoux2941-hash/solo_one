function fibRecursive(n, stats) {
    if (!stats) stats = { calls: 0, callCounts: {} };
    stats.calls++;
    stats.callCounts[n] = (stats.callCounts[n] || 0) + 1;
    if (n <= 0) return 0;
    if (n === 1) return 1;
    return fibRecursive(n - 1, stats) + fibRecursive(n - 2, stats);
}

function fibRecursiveWithStats(n) {
    const stats = { calls: 0, callCounts: {}, duplicates: 0, time: 0 };
    const startTime = performance.now();
    const result = fibRecursive(n, stats);
    stats.time = performance.now() - startTime;
    for (const key in stats.callCounts) {
        if (stats.callCounts[key] > 1) {
            stats.duplicates += stats.callCounts[key] - 1;
        }
    }
    return { result, stats };
}

function fibTailRecursive(n, a, b, stats) {
    if (a === undefined) a = 0;
    if (b === undefined) b = 1;
    if (!stats) stats = { calls: 0, time: 0, space: 'O(n)' };
    stats.calls++;
    if (n === 0) return a;
    if (n === 1) return b;
    return fibTailRecursive(n - 1, b, a + b, stats);
}

function fibTailRecursiveWithStats(n) {
    const stats = { calls: 0, time: 0, space: 'O(n)' };
    const startTime = performance.now();
    const result = fibTailRecursive(n, 0, 1, stats);
    stats.time = performance.now() - startTime;
    return { result, stats };
}

function fibDP(n) {
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

function buildTree(n) {
    let nodeId = 0;
    function createNode(value, depth, parentId) {
        return { id: ++nodeId, value, depth, parentId, result: null, children: [], visited: false, calculated: false };
    }
    function build(node) {
        if (node.value <= 1) {
            node.result = node.value === 1 ? 1 : 0;
            node.calculated = true;
            return node.result;
        }
        const left = createNode(node.value - 1, node.depth + 1, node.id);
        const right = createNode(node.value - 2, node.depth + 1, node.id);
        node.children.push(left, right);
        node.result = build(left) + build(right);
        node.calculated = true;
        return node.result;
    }
    const root = createNode(n, 0, null);
    build(root);
    return { root, nodeCount: nodeId };
}

function getAnimationSequence(root) {
    const seq = [];
    function traverse(node) {
        if (!node) return;
        seq.push({ type: 'visit', node });
        if (node.children.length > 0) { traverse(node.children[0]); traverse(node.children[1]); }
        seq.push({ type: 'calculate', node });
    }
    traverse(root);
    return seq;
}

function getDuplicateCounts(root) {
    const counts = {}, allNodes = [];
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
