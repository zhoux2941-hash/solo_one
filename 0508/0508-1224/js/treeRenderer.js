const TreeRenderer = {
    svg: null, g: null, width: 0, height: 0,
    nodeRadius: 25, levelHeight: 70,

    init: function(svgElement) {
        this.svg = d3.select(svgElement);
        this.updateDimensions();
    },

    updateDimensions: function() {
        const container = this.svg.node().parentElement;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.svg.attr('width', this.width).attr('height', this.height);
    },

    render: function(treeData) {
        this.svg.selectAll('*').remove();
        this.g = this.svg.append('g').attr('transform', `translate(${this.width / 2}, 50)`);
        const root = d3.hierarchy(treeData.root);
        const treeLayout = d3.tree().nodeSize([80, this.levelHeight]);
        treeLayout(root);
        const nodes = root.descendants();
        const links = root.links();
        const maxLeft = Math.min(...nodes.map(d => d.x));
        const maxRight = Math.max(...nodes.map(d => d.x));
        const treeWidth = maxRight - maxLeft + 100;
        if (treeWidth > this.width) {
            this.svg.attr('width', treeWidth);
            this.g.attr('transform', `translate(${treeWidth / 2}, 50)`);
        }
        this.g.selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d => `M ${d.source.x} ${d.source.y + this.nodeRadius} L ${d.target.x} ${d.target.y - this.nodeRadius}`)
            .attr('data-source-id', d => d.source.data.id)
            .attr('data-target-id', d => d.target.data.id);

        const nodeGroups = this.g.selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .attr('data-node-id', d => d.data.id)
            .attr('data-value', d => d.data.value);

        nodeGroups.append('circle').attr('r', this.nodeRadius);
        nodeGroups.append('text').attr('dy', -5).text(d => `n=${d.data.value}`).attr('font-size', '11px');
        nodeGroups.append('text').attr('dy', 12).text(d => d.data.result !== null ? `=${d.data.result}` : '').attr('font-size', '11px').attr('font-weight', 'bold');
        return { nodes: nodeGroups, links: this.g.selectAll('.link') };
    },

    highlightNode: function(nodeId) {
        this.g.selectAll(`[data-node-id="${nodeId}"]`).classed('animating', true);
    },

    unhighlightNode: function(nodeId) {
        this.g.selectAll(`[data-node-id="${nodeId}"]`).classed('animating', false);
    },

    markCalculated: function(nodeId) {
        this.g.selectAll(`[data-node-id="${nodeId}"]`).classed('calculated', true).classed('animating', false);
    },

    showLink: function(sourceId, targetId) {
        this.g.selectAll(`[data-source-id="${sourceId}"][data-target-id="${targetId}"]`).classed('visible', true);
    },

    highlightDuplicates: function(value) {
        this.g.selectAll(`[data-value="${value}"]`).classed('highlighted', true);
    },

    highlightDuplicatesByIds: function(nodeIds) {
        this.clearHighlights();
        nodeIds.forEach(id => {
            this.g.selectAll(`[data-node-id="${id}"]`).classed('highlighted', true);
        });
    },

    clearHighlights: function() {
        this.g.selectAll('.node').classed('highlighted', false).classed('animating', false).classed('calculated', false);
        this.g.selectAll('.link').classed('visible', false);
    },

    reset: function() { this.clearHighlights(); }
};
        this.g.selectAll(`[data-node-id="${nodeId}"]`)
            .classed('animating', false);
    },

    markCalculated: function(nodeId) {
        this.g.selectAll(`[data-node-id="${nodeId}"]`)
            .classed('calculated', true)
            .classed('animating', false);
    },

    showLink: function(sourceId, targetId) {
        this.g.selectAll(`[data-source-id="${sourceId}"][data-target-id="${targetId}"]`)
            .classed('visible', true);
    },

    highlightDuplicates: function(value) {
        this.g.selectAll(`[data-value="${value}"]`)
            .classed('highlighted', true);
    },

    clearHighlights: function() {
        this.g.selectAll('.node')
            .classed('highlighted', false)
            .classed('animating', false)
            .classed('calculated', false);
        
        this.g.selectAll('.link')
            .classed('visible', false);
    },

    reset: function() {
        this.clearHighlights();
    }
};
