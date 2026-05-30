const TreeBuilder = {
    buildTree: function(n) {
        let nodeId = 0;
        function createNode(value, depth, parentId) {
            return {
                id: ++nodeId,
                value,
                depth,
                parentId,
                result: null,
                children: [],
                visited: false,
                calculated: false
            };
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
    },

    getAnimationSequence: function(root) {
        const seq = [];
        function traverse(node) {
            if (!node) return;
            seq.push({ type: 'visit', node });
            if (node.children.length > 0) {
                traverse(node.children[0]);
                traverse(node.children[1]);
            }
            seq.push({ type: 'calculate', node });
        }
        traverse(root);
        return seq;
    },

    getDuplicateCounts: function(root) {
        const counts = {};
        const allNodes = [];
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
                duplicates.push({
                    n: parseInt(value),
                    count,
                    nodeIds: nodesWithValue.map(n => n.id)
                });
            }
        }
        return duplicates.sort((a, b) => b.n - a.n);
    },

    getAllNodesByValue: function(root) {
        const nodesByValue = {};
        function traverse(node) {
            if (!node) return;
            if (!nodesByValue[node.value]) nodesByValue[node.value] = [];
            nodesByValue[node.value].push(node.id);
            node.children.forEach(child => traverse(child));
        }
        traverse(root);
        return nodesByValue;
    }
};
            }
        }
        
        return duplicates.sort((a, b) => b.n - a.n);
    }
};
