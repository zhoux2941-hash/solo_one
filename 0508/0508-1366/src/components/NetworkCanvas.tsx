import React, { useRef, useEffect, useCallback } from 'react';
import { useNetworkStore } from '../store/networkStore';
import { Node, Edge } from '../types/network';
import { getNodeById } from '../utils/network';

const NODE_RADIUS = 24;
const COVERAGE_OPACITY = 0.15;
const EDGE_HIT_TOLERANCE = 8;

const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = lenSq !== 0 ? dot / lenSq : -1;
  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

export const NetworkCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const dragNodeRef = useRef<string | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const {
    nodes,
    edges,
    selectedNodeId,
    hoveredEdgeId,
    toolMode,
    connectingFromId,
    simulationResult,
    showCoverage,
    mousePos,
    addNode,
    selectNode,
    updateNode,
    startConnection,
    endConnection,
    cancelConnection,
    deleteNode,
    deleteEdge,
    setHoveredEdge,
    setSourceNode,
    setTargetNode,
    setMousePos,
  } = useNetworkStore();

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const findNodeAt = useCallback((x: number, y: number): Node | undefined => {
    return nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS;
    });
  }, [nodes]);

  const findEdgeAt = useCallback((x: number, y: number): Edge | undefined => {
    for (const edge of edges) {
      const source = getNodeById(nodes, edge.sourceId);
      const target = getNodeById(nodes, edge.targetId);
      if (!source || !target) continue;
      
      const dist = distanceToLine(x, y, source.x, source.y, target.x, target.y);
      if (dist <= EDGE_HIT_TOLERANCE) {
        return edge;
      }
    }
    return undefined;
  }, [nodes, edges]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (showCoverage) {
      nodes.forEach(node => {
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.signalRange
        );
        
        let color = 'rgba(0, 212, 255,';
        if (node.isSource) color = 'rgba(0, 255, 136,';
        if (node.isTarget) color = 'rgba(255, 107, 107,';
        
        gradient.addColorStop(0, `${color} ${COVERAGE_OPACITY + 0.1})`);
        gradient.addColorStop(0.7, `${color} ${COVERAGE_OPACITY})`);
        gradient.addColorStop(1, `${color} 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.signalRange, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    edges.forEach(edge => {
      const source = getNodeById(nodes, edge.sourceId);
      const target = getNodeById(nodes, edge.targetId);
      if (!source || !target) return;

      const isInPath = simulationResult?.path.some((nodeId, idx) => {
        if (idx === simulationResult.path.length - 1) return false;
        const nextId = simulationResult.path[idx + 1];
        return (edge.sourceId === nodeId && edge.targetId === nextId) ||
               (edge.sourceId === nextId && edge.targetId === nodeId);
      });

      const isHovered = edge.id === hoveredEdgeId;
      const isDeleteMode = toolMode === 'delete';

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      
      if (isInPath) {
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 10;
      } else if (isHovered && isDeleteMode) {
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 15;
      } else if (isHovered) {
        ctx.strokeStyle = '#5cdbd3';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#5cdbd3';
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = '#434343';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0;

      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      
      ctx.fillStyle = isInPath ? '#00d4ff' : isHovered ? '#5cdbd3' : '#8c8c8c';
      ctx.font = '11px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${edge.attenuation} dB`, midX, midY - 8);
    });

    if (connectingFromId && mousePos) {
      const fromNode = getNodeById(nodes, connectingFromId);
      if (fromNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    nodes.forEach(node => {
      const isSelected = node.id === selectedNodeId;
      const isInPath = simulationResult?.path.includes(node.id);

      if (isSelected || isInPath) {
        const gradient = ctx.createRadialGradient(
          node.x, node.y, NODE_RADIUS,
          node.x, node.y, NODE_RADIUS + 15
        );
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS + 15, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
      
      let fillColor = '#1e3a5f';
      let strokeColor = '#4096ff';
      
      if (node.isSource) {
        fillColor = '#0d4f2e';
        strokeColor = '#00ff88';
      } else if (node.isTarget) {
        fillColor = '#4f1e1e';
        strokeColor = '#ff6b6b';
      }
      
      if (isSelected) {
        strokeColor = '#00d4ff';
      }
      
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📡', node.x, node.y);

      ctx.fillStyle = '#e8e8e8';
      ctx.font = '12px Noto Sans SC';
      ctx.fillText(node.name, node.x, node.y + NODE_RADIUS + 15);

      if (simulationResult?.nodeSignals[node.id] !== undefined && !node.isSource) {
        const signal = simulationResult.nodeSignals[node.id];
        ctx.fillStyle = signal > 30 ? '#ff6b6b' : '#00ff88';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`${signal.toFixed(1)} dB`, node.x, node.y + NODE_RADIUS + 30);
      }
    });

    animationRef.current = requestAnimationFrame(draw);
  }, [nodes, edges, selectedNodeId, hoveredEdgeId, connectingFromId, simulationResult, showCoverage, mousePos, toolMode]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const clickedNode = findNodeAt(x, y);
    const clickedEdge = !clickedNode ? findEdgeAt(x, y) : undefined;

    if (toolMode === 'select' && clickedNode) {
      dragNodeRef.current = clickedNode.id;
      offsetRef.current = { x: x - clickedNode.x, y: y - clickedNode.y };
      selectNode(clickedNode.id);
    } else if (toolMode === 'addNode' && !clickedNode) {
      addNode(x, y);
    } else if (toolMode === 'connect' && clickedNode) {
      if (connectingFromId) {
        endConnection(clickedNode.id);
      } else {
        startConnection(clickedNode.id);
      }
    } else if (toolMode === 'delete' && clickedNode) {
      deleteNode(clickedNode.id);
    } else if (toolMode === 'delete' && clickedEdge) {
      deleteEdge(clickedEdge.id);
    } else if (toolMode === 'setSource' && clickedNode) {
      setSourceNode(clickedNode.id);
    } else if (toolMode === 'setTarget' && clickedNode) {
      setTargetNode(clickedNode.id);
    } else if (toolMode === 'select' && !clickedNode) {
      selectNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setMousePos({ x, y });

    if (toolMode === 'delete') {
      const hoveredNode = findNodeAt(x, y);
      if (!hoveredNode) {
        const hoveredEdge = findEdgeAt(x, y);
        setHoveredEdge(hoveredEdge?.id || null);
      } else {
        setHoveredEdge(null);
      }
    } else {
      setHoveredEdge(null);
    }

    if (dragNodeRef.current && toolMode === 'select') {
      updateNode(dragNodeRef.current, {
        x: x - offsetRef.current.x,
        y: y - offsetRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    dragNodeRef.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    cancelConnection();
    setHoveredEdge(null);
  };

  const handleMouseLeave = () => {
    dragNodeRef.current = null;
    cancelConnection();
    setMousePos(null);
    setHoveredEdge(null);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${toolMode === 'delete' ? 'cursor-crosshair' : 'cursor-crosshair'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
    />
  );
};
