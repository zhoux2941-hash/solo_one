import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Tag } from 'antd';
import type { GraphNode, GraphLink, NodeRiskResult } from '@/types';

interface ForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width?: number;
  height?: number;
  simulationResult?: NodeRiskResult[];
  disruptedNodes?: Set<string>;
  animationStep?: number;
  onNodeClick?: (node: GraphNode) => void;
  onLinkClick?: (link: GraphLink) => void;
  selectedNodeId?: string | null;
  editMode?: boolean;
  onNodeCreate?: (position: { x: number; y: number }) => void;
  onLinkCreate?: (source: string, target: string) => void;
}

const NODE_COLORS: Record<string, string> = {
  supplier: '#3B82F6',
  manufacturer: '#10B981',
  warehouse: '#F59E0B',
  distributor: '#8B5CF6',
  retailer: '#EC4899',
  customer: '#6B7280',
};

const getRiskColor = (riskScore: number): string => {
  if (riskScore >= 0.7) return '#EF4444';
  if (riskScore >= 0.4) return '#F59E0B';
  return '#22C55E';
};

const getNodeRadius = (node: GraphNode, result?: NodeRiskResult): number => {
  const baseRadius = 25;
  const maxRadius = 50;
  
  if (result) {
    return baseRadius + result.risk_score * (maxRadius - baseRadius);
  }
  
  return baseRadius + node.risk_score * (maxRadius - baseRadius);
};

interface SimulationData {
  simulation: d3.Simulation<GraphNode, GraphLink> | null;
  nodes: d3.Selection<SVGGElement, GraphNode, SVGSVGElement, unknown> | null;
  links: d3.Selection<SVGLineElement, GraphLink, SVGSVGElement, unknown> | null;
  nodeRefs: Map<string, d3.Selection<SVGGElement, GraphNode, SVGSVGElement, unknown>>;
  linkRefs: Map<string, d3.Selection<SVGLineElement, GraphLink, SVGSVGElement, unknown>>;
  isInitialized: boolean;
  nodeData: GraphNode[];
  linkData: GraphLink[];
}

export const ForceGraph: React.FC<ForceGraphProps> = ({
  nodes,
  links,
  width = 900,
  height = 600,
  simulationResult,
  disruptedNodes = new Set(),
  animationStep = 0,
  onNodeClick,
  onLinkClick,
  selectedNodeId,
  editMode = false,
  onNodeCreate,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const simData = useRef<SimulationData>({
    simulation: null,
    nodes: null,
    links: null,
    nodeRefs: new Map(),
    linkRefs: new Map(),
    isInitialized: false,
    nodeData: [],
    linkData: [],
  });
  
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, SVGSVGElement, unknown> | null>(null);
  
  const [containerSize, setContainerSize] = useState({ width, height });
  
  const resultMap = useMemo(() => {
    if (!simulationResult) return new Map<string, NodeRiskResult>();
    return new Map(simulationResult.map(r => [r.node_id, r]));
  }, [simulationResult]);

  const rootNodes = useMemo(() => {
    if (nodes.length === 0) return [];
    
    const targetNodeIds = new Set(links.map(l => typeof l.target === 'string' ? l.target : l.target.id));
    const roots = nodes.filter(n => !targetNodeIds.has(n.id));
    
    if (roots.length === 0 && nodes.length > 0) {
      const degreeMap = new Map<string, { in: number; out: number }>();
      
      for (const node of nodes) {
        degreeMap.set(node.id, { in: 0, out: 0 });
      }
      
      for (const link of links) {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        const sourceDeg = degreeMap.get(sourceId);
        const targetDeg = degreeMap.get(targetId);
        
        if (sourceDeg) sourceDeg.out++;
        if (targetDeg) targetDeg.in++;
      }
      
      const sortedByOutdegree = [...degreeMap.entries()]
        .sort((a, b) => b[1].out - a[1].out);
      
      return [sortedByOutdegree[0]?.[0]].filter(Boolean);
    }
    
    return roots.map(r => r.id);
  }, [nodes, links]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          setContainerSize({ width: w, height: h });
        }
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const updateNodeAppearance = useCallback((
    nodeElement: d3.Selection<SVGGElement, GraphNode, any, any>,
    d: GraphNode,
    resultMap: Map<string, NodeRiskResult>,
    disruptedNodes: Set<string>,
    selectedNodeId: string | null,
    animationStep: number
  ) => {
    const nodeResult = resultMap.get(d.id);
    const isDisrupted = disruptedNodes.has(d.id);
    const isSelected = selectedNodeId === d.id;
    const isAnimating = d.animationStep !== undefined && d.animationStep <= animationStep;

    const radius = getNodeRadius(d, nodeResult);
    const baseColor = nodeResult ? getRiskColor(nodeResult.risk_score) : NODE_COLORS[d.type];
    
    nodeElement.select('circle.node-circle')
      .attr('r', radius)
      .attr('fill', isDisrupted ? '#EF4444' : isAnimating ? '#F97316' : baseColor)
      .attr('stroke', isSelected ? '#fff' : '#1F2937')
      .attr('stroke-width', isSelected ? 3 : 1.5)
      .attr('opacity', isAnimating ? 1 : 0.9);

    nodeElement.select('text.node-label')
      .text(d.name.length > 12 ? d.name.substring(0, 10) + '...' : d.name)
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dy', radius + 15);

    if (nodeResult && nodeResult.risk_score > 0) {
      nodeElement.select('text.risk-label')
        .text(`${Math.round(nodeResult.risk_score * 100)}%`)
        .attr('fill', '#fff')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .attr('dy', '3px');
    } else {
      nodeElement.select('text.risk-label').text('');
    }

    nodeElement.select('circle.disrupted-indicator')
      .attr('opacity', isDisrupted ? 1 : 0);

    const pulseRing = nodeElement.select('circle.pulse-ring');
    if (isAnimating) {
      pulseRing
        .attr('r', radius + 5)
        .attr('stroke', '#F97316')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('opacity', 0.8);
    } else {
      pulseRing.attr('opacity', 0);
    }
  }, []);

  const updateLinkAppearance = useCallback((
    linkElement: d3.Selection<SVGLineElement, GraphLink, any, any>,
    d: GraphLink,
    animationStep: number
  ) => {
    const baseWidth = 1 + d.strength * 4;
    const isAnimating = d.animationStep !== undefined && d.animationStep <= animationStep;

    linkElement
      .attr('stroke-width', baseWidth)
      .attr('stroke', isAnimating ? '#F97316' : '#6B7280')
      .attr('opacity', isAnimating ? 1 : 0.6);

    if (isAnimating) {
      linkElement
        .attr('stroke-dasharray', '5,5')
        .attr('stroke-dashoffset', -animationStep * 10);
    } else {
      linkElement.attr('stroke-dasharray', 'none');
    }
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const sim = simData.current;
    
    const nodesChanged = JSON.stringify(nodes.map(n => ({ id: n.id }))) !== 
                         JSON.stringify(sim.nodeData.map(n => ({ id: n.id })));
    const linksChanged = JSON.stringify(links.map(l => ({ 
      id: l.id,
      source: typeof l.source === 'string' ? l.source : l.source.id,
      target: typeof l.target === 'string' ? l.target : l.target.id
    }))) !== JSON.stringify(sim.linkData.map(l => ({
      id: l.id,
      source: typeof l.source === 'string' ? l.source : l.source.id,
      target: typeof l.target === 'string' ? l.target : l.target.id
    })));

    if (!nodesChanged && !linksChanged && sim.isInitialized) {
      return;
    }

    if (sim.simulation) {
      sim.simulation.stop();
    }

    sim.nodeData = nodes.map(n => ({ ...n }));
    sim.linkData = links.map(l => ({ ...l }));

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    
    const gradient = defs.append('linearGradient')
      .attr('id', 'link-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6B7280');
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#374151');

    const arrowMarker = defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto');

    arrowMarker.append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#6B7280');

    const g = svg.append('g');
    gRef.current = g;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        if (gRef.current) {
          gRef.current.attr('transform', event.transform);
        }
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const linkGroup = g.append('g').attr('class', 'links');
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const simulation = d3.forceSimulation<GraphNode, GraphLink>(sim.nodeData)
      .force('link', d3.forceLink<GraphNode, GraphLink>(sim.linkData)
        .id((d: any) => d.id)
        .distance((d: any) => 100 - d.strength * 30)
        .strength(0.3))
      .force('charge', d3.forceManyBody()
        .strength(-300)
        .distanceMax(300))
      .force('center', d3.forceCenter(containerSize.width / 2, containerSize.height / 2))
      .force('collision', d3.forceCollide()
        .radius(40)
        .strength(0.8))
      .force('x', d3.forceX(containerSize.width / 2).strength(0.05))
      .force('y', d3.forceY(containerSize.height / 2).strength(0.05))
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    sim.simulation = simulation;

    rootNodes.forEach((rootId, index) => {
      const nodeIndex = sim.nodeData.findIndex(n => n.id === rootId);
      if (nodeIndex !== -1) {
        const node = sim.nodeData[nodeIndex];
        
        const angle = (index / Math.max(rootNodes.length, 1)) * Math.PI * 2;
        const radius = 50;
        node.fx = containerSize.width / 2 + Math.cos(angle) * radius;
        node.fy = containerSize.height / 2 + Math.sin(angle) * radius;
      }
    });

    simulation.alpha(1).restart();

    const linkElements = linkGroup.selectAll('line.link')
      .data(sim.linkData, (d: any) => d.id)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('marker-end', 'url(#arrow)')
      .on('click', function(event, d) {
        event.stopPropagation();
        onLinkClick?.(d);
      });

    const nodeElements = nodeGroup.selectAll('g.node')
      .data(sim.nodeData, (d) => d.id)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        event.stopPropagation();
        onNodeClick?.(d);
      });

    nodeElements.append('circle')
      .attr('class', 'node-circle');

    nodeElements.append('circle')
      .attr('class', 'pulse-ring')
      .attr('opacity', 0);

    nodeElements.append('circle')
      .attr('class', 'disrupted-indicator')
      .attr('r', 8)
      .attr('cx', 15)
      .attr('cy', -15)
      .attr('fill', '#EF4444')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    nodeElements.append('text')
      .attr('class', 'risk-label');

    nodeElements.append('text')
      .attr('class', 'node-label');

    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        if (!rootNodes.includes(d.id)) {
          d.fx = d.x;
          d.fy = d.y;
        }
      })
      .on('drag', (event, d) => {
        if (!rootNodes.includes(d.id)) {
          d.fx = event.x;
          d.fy = event.y;
        }
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
      });

    nodeElements.call(drag);

    sim.nodeRefs.clear();
    sim.linkRefs.clear();

    sim.nodeData.forEach((d, i) => {
      nodeElements.each(function(nodeData) {
        if (nodeData.id === d.id) {
          sim.nodeRefs.set(d.id, d3.select(this));
          updateNodeAppearance(d3.select(this), nodeData, resultMap, disruptedNodes, selectedNodeId || null, animationStep);
        }
      });
    });

    sim.linkData.forEach((d, i) => {
      linkElements.each(function(linkData: any) {
        if (linkData.id === d.id) {
          sim.linkRefs.set(d.id, d3.select(this));
          updateLinkAppearance(d3.select(this), linkData, animationStep);
        }
      });
    });

    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeElements.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    sim.isInitialized = true;

    if (editMode && onNodeCreate) {
      svg.on('click', (event) => {
        if (event.target === svgRef.current) {
          const transform = d3.zoomTransform(svgRef.current);
          const [x, y] = transform.invert(d3.pointer(event, g.node()));
          onNodeCreate({ x, y });
        }
      });
    }

    return () => {
      if (simulation) {
        simulation.stop();
      }
      if (svgRef.current) {
        d3.select(svgRef.current).on('.zoom', null).on('click', null);
      }
    };
  }, [
    nodes, links, containerSize, rootNodes, editMode,
    resultMap, disruptedNodes, selectedNodeId, animationStep,
    updateNodeAppearance, updateLinkAppearance,
    onNodeClick, onLinkClick, onNodeCreate
  ]);

  useEffect(() => {
    const sim = simData.current;
    if (!sim.isInitialized) return;

    sim.nodeData.forEach((d) => {
      const nodeEl = sim.nodeRefs.get(d.id);
      if (nodeEl) {
        updateNodeAppearance(nodeEl, d, resultMap, disruptedNodes, selectedNodeId || null, animationStep);
      }
    });

    sim.linkData.forEach((d) => {
      const linkEl = sim.linkRefs.get(d.id);
      if (linkEl) {
        updateLinkAppearance(linkEl, d, animationStep);
      }
    });
  }, [resultMap, disruptedNodes, selectedNodeId, animationStep, updateNodeAppearance, updateLinkAppearance]);

  useEffect(() => {
    return () => {
      const sim = simData.current;
      
      if (sim.simulation) {
        sim.simulation.stop();
        sim.simulation = null;
      }
      
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.on('.zoom', null).on('click', null);
        svg.selectAll('*').remove();
      }
      
      sim.nodeRefs.clear();
      sim.linkRefs.clear();
      sim.nodes = null;
      sim.links = null;
      sim.isInitialized = false;
      sim.nodeData = [];
      sim.linkData = [];
      
      zoomRef.current = null;
      gRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={containerSize.width}
        height={containerSize.height}
        className="bg-gray-900 rounded-lg"
        style={{ width: '100%', height: '100%' }}
      />
      
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 rounded-lg p-3 text-xs text-gray-300">
        <div className="font-semibold mb-2">节点类型</div>
        <div className="space-y-1">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
        {simulationResult && (
          <>
            <div className="font-semibold mt-3 mb-2">风险等级</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>高风险 (70%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>中风险 (40-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>低风险 (<40%)</span>
              </div>
            </div>
          </>
        )}
        {rootNodes.length > 0 && (
          <>
            <div className="font-semibold mt-3 mb-2">固定根节点</div>
            <Tag color="blue">
              {rootNodes.length} 个节点已固定位置
            </Tag>
          </>
        )}
      </div>

      {editMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
          编辑模式：点击空白处添加节点，拖动节点调整位置
        </div>
      )}
    </div>
  );
};

export default ForceGraph;
