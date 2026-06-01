import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Graph } from '@antv/g6';
import { useStore } from '@/store/useStore';
import type { TopologyNode, TopologyEdge } from '@/types';

const STATUS_FILL: Record<string, string> = {
  healthy: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

const STATUS_STROKE: Record<string, string> = {
  healthy: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
};

const EDGE_COLORS: Record<string, string> = {
  healthy: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

function getEdgeWidth(callCount: number, maxCount: number) {
  if (maxCount === 0) return 1;
  return Math.max(1, Math.min(8, Math.round((callCount / maxCount) * 8)));
}

function buildGraphData(topology: { nodes: TopologyNode[]; edges: TopologyEdge[] }) {
  const maxCallCount = Math.max(...topology.edges.map((e) => e.call_count), 1);
  return {
    nodes: topology.nodes.map((n) => {
      const status = n.status || 'healthy';
      return {
        id: n.id,
        data: { name: n.name, status, metrics: n.metrics },
        style: {
          fill: STATUS_FILL[status] || '#22c55e',
          stroke: STATUS_STROKE[status] || '#4ade80',
          labelText: n.name,
        },
      };
    }),
    edges: topology.edges.map((e) => {
      const health = e.health || 'healthy';
      return {
        id: `${e.source}->${e.target}`,
        source: e.source,
        target: e.target,
        data: { call_count: e.call_count, error_rate: e.error_rate, health, avg_latency: e.avg_latency },
        style: {
          stroke: EDGE_COLORS[health] || '#22c55e',
          lineWidth: getEdgeWidth(e.call_count, maxCallCount),
        },
      };
    }),
  };
}

function buildAdjacencyMap(nodes: TopologyNode[], edges: TopologyEdge[]): Record<string, string[]> {
  const adjacency: Record<string, string[]> = {};
  nodes.forEach((n) => { adjacency[n.id] = []; });
  edges.forEach((e) => {
    if (!adjacency[e.source]) adjacency[e.source] = [];
    if (!adjacency[e.target]) adjacency[e.target] = [];
    adjacency[e.source].push(e.target);
    adjacency[e.target].push(e.source);
  });
  return adjacency;
}

function bfsNeighbors(startId: string, adjacency: Record<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const queue = [startId];
  visited.add(startId);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency[current] || [];
    for (const nId of neighbors) {
      if (!visited.has(nId)) {
        visited.add(nId);
        queue.push(nId);
      }
    }
  }
  return visited;
}

const GRAPH_COMMON_STYLE = {
  node: {
    type: 'circle',
    style: {
      size: 32,
      lineWidth: 2.5,
      labelFill: '#cbd5e1',
      labelFontSize: 10,
      labelPlacement: 'bottom' as const,
      labelOffsetY: 6,
      cursor: 'pointer' as const,
    },
    state: {
      highlight: {
        lineWidth: 4,
      },
      dim: {
        opacity: 0.12,
      },
    },
  },
  edge: {
    type: 'line',
    style: {
      strokeOpacity: 0.65,
      endArrow: true,
      arrowSize: 5,
      cursor: 'default' as const,
    },
    state: {
      highlight: {
        strokeOpacity: 1,
        lineWidth: 4,
      },
      dim: {
        opacity: 0.04,
      },
    },
  },
};

export default function TopologyGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const renderedRef = useRef(false);
  const layoutStoppedRef = useRef(false);
  const resizeTimerRef = useRef<number>(0);
  const topology = useStore((s) => s.topology);
  const selectedService = useStore((s) => s.selectedService);
  const setSelectedService = useStore((s) => s.setSelectedService);
  const setHighlightedNodes = useStore((s) => s.setHighlightedNodes);

  const adjacencyMap = useMemo(
    () => topology ? buildAdjacencyMap(topology.nodes, topology.edges) : null,
    [topology]
  );

  const nodeCount = topology?.nodes.length ?? 0;
  const isLargeGraph = nodeCount > 20;

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const graph = graphRef.current;
      if (!graph || !topology || !renderedRef.current || !adjacencyMap) return;

      const visited = bfsNeighbors(nodeId, adjacencyMap);
      const allNodeIds = topology.nodes.map((n) => n.id);
      const stateMap: Record<string, string[]> = {};
      for (const nId of allNodeIds) {
        stateMap[nId] = visited.has(nId) ? ['highlight'] : ['dim'];
      }
      try {
        graph.setElementState(stateMap);
      } catch {
        // ignore
      }
      setHighlightedNodes(visited);
      setSelectedService(nodeId);
    },
    [topology, adjacencyMap, setSelectedService, setHighlightedNodes]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const graph = new Graph({
      container,
      autoFit: 'view',
      data: { nodes: [], edges: [] },
      node: {
        ...GRAPH_COMMON_STYLE.node,
        style: {
          ...GRAPH_COMMON_STYLE.node.style,
          fill: '#1e293b',
          stroke: '#475569',
          labelText: '',
        },
      },
      edge: {
        ...GRAPH_COMMON_STYLE.edge,
        style: {
          ...GRAPH_COMMON_STYLE.edge.style,
          stroke: '#475569',
          lineWidth: 1,
        },
      },
      layout: {
        type: 'd3-force',
        preventOverlap: true,
        nodeStrength: -200,
        edgeStrength: 0.05,
        linkDistance: isLargeGraph ? 140 : 180,
      },
      behaviors: ['drag-canvas', 'zoom-canvas', ...(isLargeGraph ? [] : ['drag-element'] as any[])],
      animation: false,
    });

    graph.on('node:click', (evt: any) => {
      const nodeId = evt.target?.id;
      if (nodeId) handleNodeClick(nodeId);
    });

    graph.on('afterrender', () => {
      renderedRef.current = true;
      setTimeout(() => {
        if (graphRef.current && !layoutStoppedRef.current) {
          try {
            graphRef.current.stopLayout();
            layoutStoppedRef.current = true;
          } catch {
            // ignore
          }
        }
      }, 3000);
    });

    graph.on('afterlayout', () => {
      if (!layoutStoppedRef.current) {
        layoutStoppedRef.current = true;
      }
    });

    graphRef.current = graph;

    return () => {
      graph.destroy();
      graphRef.current = null;
      renderedRef.current = false;
      layoutStoppedRef.current = false;
    };
  }, [isLargeGraph, handleNodeClick]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !topology) return;

    const data = buildGraphData(topology);
    graph.setData(data);
    graph.render();
    renderedRef.current = true;
    layoutStoppedRef.current = false;
    setTimeout(() => {
      if (graphRef.current && !layoutStoppedRef.current) {
        try {
          graphRef.current.stopLayout();
          layoutStoppedRef.current = true;
        } catch {
          // ignore
        }
      }
    }, 3000);
  }, [topology]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !renderedRef.current) return;
    if (!selectedService) {
      try {
        graph.setElementState({});
      } catch {
        // ignore
      }
    }
  }, [selectedService]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = window.setTimeout(() => {
        if (renderedRef.current && graphRef.current) {
          try {
            graphRef.current.resize();
          } catch {
            // ignore
          }
        }
      }, 200);
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      observer.disconnect();
      clearTimeout(resizeTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-cyber-bg"
    />
  );
}
