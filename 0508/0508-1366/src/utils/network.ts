import { Node, Edge, SimulationResult, RoutingTable, RoutingEntry } from '../types/network';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

export const calculateAttenuation = (distance: number, baseLoss: number = 2): number => {
  return Math.round(distance * 0.08 + baseLoss);
};

export const getNodeById = (nodes: Node[], id: string): Node | undefined => {
  return nodes.find(n => n.id === id);
};

export const findPathBFS = (
  nodes: Node[],
  edges: Edge[],
  sourceId: string,
  targetId: string
): SimulationResult | null => {
  const source = getNodeById(nodes, sourceId);
  const target = getNodeById(nodes, targetId);
  
  if (!source || !target) {
    return null;
  }

  const adjacencyList: Record<string, { nodeId: string; attenuation: number }[]> = {};
  nodes.forEach(node => {
    adjacencyList[node.id] = [];
  });
  
  edges.forEach(edge => {
    adjacencyList[edge.sourceId].push({ nodeId: edge.targetId, attenuation: edge.attenuation });
    adjacencyList[edge.targetId].push({ nodeId: edge.sourceId, attenuation: edge.attenuation });
  });

  interface QueueItem {
    nodeId: string;
    path: string[];
    hops: number;
    totalAttenuation: number;
  }

  const queue: QueueItem[] = [{ nodeId: sourceId, path: [sourceId], hops: 0, totalAttenuation: 0 }];
  const visited = new Map<string, number>();
  visited.set(sourceId, 0);

  const nodeSignals: Record<string, number> = {};
  nodeSignals[sourceId] = 0;

  let bestPath: string[] = [];
  let bestHops = Infinity;
  let bestAttenuation = Infinity;

  while (queue.length > 0) {
    queue.sort((a, b) => a.hops - b.hops);
    const current = queue.shift()!;
    
    if (current.nodeId === targetId) {
      if (current.hops < bestHops || (current.hops === bestHops && current.totalAttenuation < bestAttenuation)) {
        bestPath = current.path;
        bestHops = current.hops;
        bestAttenuation = current.totalAttenuation;
      }
      continue;
    }

    const currentNode = getNodeById(nodes, current.nodeId);
    if (currentNode) {
      const maxHops = currentNode.maxHops;
      if (current.hops >= maxHops) {
        continue;
      }
    }

    for (const neighbor of adjacencyList[current.nodeId] || []) {
      const newHops = current.hops + 1;
      const newAttenuation = current.totalAttenuation + neighbor.attenuation;
      const existingHops = visited.get(neighbor.nodeId);
      
      if (existingHops === undefined || newHops < existingHops) {
        visited.set(neighbor.nodeId, newHops);
        nodeSignals[neighbor.nodeId] = Math.min(
          nodeSignals[neighbor.nodeId] ?? Infinity,
          newAttenuation
        );
        queue.push({
          nodeId: neighbor.nodeId,
          path: [...current.path, neighbor.nodeId],
          hops: newHops,
          totalAttenuation: newAttenuation
        });
      }
    }
  }

  if (bestPath.length > 0) {
    return {
      path: bestPath,
      hops: bestHops,
      totalAttenuation: Math.round(bestAttenuation * 100) / 100,
      success: true,
      message: `成功找到路径，共 ${bestHops} 跳，总衰减 ${Math.round(bestAttenuation * 100) / 100} dB`,
      nodeSignals
    };
  } else {
    return {
      path: [],
      hops: 0,
      totalAttenuation: 0,
      success: false,
      message: '未找到有效路径',
      nodeSignals
    };
  }
};

export const forceDirectedLayout = (
  nodes: Node[],
  edges: Edge[],
  iterations: number = 100,
  width: number = 800,
  height: number = 600
): Node[] => {
  const k = 150;
  const repulsion = k * k;
  const attraction = 0.01;
  const damping = 0.9;
  const centerX = width / 2;
  const centerY = height / 2;

  const tempNodes = nodes.map(node => ({
    ...node,
    vx: 0,
    vy: 0
  }));

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < tempNodes.length; i++) {
      for (let j = i + 1; j < tempNodes.length; j++) {
        const dx = tempNodes[j].x - tempNodes[i].x;
        const dy = tempNodes[j].y - tempNodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        tempNodes[i].vx! -= fx;
        tempNodes[i].vy! -= fy;
        tempNodes[j].vx! += fx;
        tempNodes[j].vy! += fy;
      }
    }

    for (const edge of edges) {
      const source = tempNodes.find(n => n.id === edge.sourceId);
      const target = tempNodes.find(n => n.id === edge.targetId);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - k) * attraction;
      
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      source.vx! += fx;
      source.vy! += fy;
      target.vx! -= fx;
      target.vy! -= fy;
    }

    for (const node of tempNodes) {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      node.vx! += dx * 0.001;
      node.vy! += dy * 0.001;
    }

    for (const node of tempNodes) {
      node.x += node.vx!;
      node.y += node.vy!;
      node.vx! *= damping;
      node.vy! *= damping;
      
      node.x = Math.max(50, Math.min(width - 50, node.x));
      node.y = Math.max(50, Math.min(height - 50, node.y));
    }
  }

  return tempNodes.map(({ vx, vy, ...rest }) => rest);
};

export const buildAdjacencyList = (nodes: Node[], edges: Edge[]): Record<string, { nodeId: string; attenuation: number }[]> => {
  const adjacencyList: Record<string, { nodeId: string; attenuation: number }[]> = {};
  nodes.forEach(node => {
    adjacencyList[node.id] = [];
  });
  
  edges.forEach(edge => {
    adjacencyList[edge.sourceId].push({ nodeId: edge.targetId, attenuation: edge.attenuation });
    adjacencyList[edge.targetId].push({ nodeId: edge.sourceId, attenuation: edge.attenuation });
  });
  
  return adjacencyList;
};

export const dijkstraWithNextHops = (
  nodes: Node[],
  edges: Edge[],
  sourceId: string
): { distances: Record<string, number>; hops: Record<string, number>; nextHops: Record<string, string | null>; reachable: Record<string, boolean> } => {
  const adjacencyList = buildAdjacencyList(nodes, edges);
  const sourceNode = getNodeById(nodes, sourceId);
  const maxHops = sourceNode?.maxHops ?? 10;

  const distances: Record<string, number> = {};
  const hops: Record<string, number> = {};
  const nextHops: Record<string, string | null> = {};
  const reachable: Record<string, boolean> = {};
  const visited: Record<string, boolean> = {};

  nodes.forEach(node => {
    distances[node.id] = Infinity;
    hops[node.id] = Infinity;
    nextHops[node.id] = null;
    reachable[node.id] = false;
    visited[node.id] = false;
  });

  distances[sourceId] = 0;
  hops[sourceId] = 0;
  reachable[sourceId] = true;

  for (let i = 0; i < nodes.length; i++) {
    let u: string | null = null;
    let minDist = Infinity;

    nodes.forEach(node => {
      if (!visited[node.id] && distances[node.id] < minDist) {
        minDist = distances[node.id];
        u = node.id;
      }
    });

    if (u === null) break;
    visited[u] = true;

    if (hops[u] >= maxHops) continue;

    for (const neighbor of adjacencyList[u] || []) {
      const v = neighbor.nodeId;
      const alt = distances[u] + neighbor.attenuation;
      const altHops = hops[u] + 1;

      if (altHops <= maxHops && alt < distances[v]) {
        distances[v] = alt;
        hops[v] = altHops;
        reachable[v] = true;
        
        if (hops[u] === 0) {
          nextHops[v] = v;
        } else {
          nextHops[v] = nextHops[u];
        }
      }
    }
  }

  return { distances, hops, nextHops, reachable };
};

export const calculateAllRoutingTables = (nodes: Node[], edges: Edge[]): RoutingTable[] => {
  return nodes.map(sourceNode => {
    const { distances, hops, nextHops, reachable } = dijkstraWithNextHops(nodes, edges, sourceNode.id);
    
    const entries: RoutingEntry[] = nodes
      .filter(targetNode => targetNode.id !== sourceNode.id)
      .map(targetNode => {
        const nextHopId = nextHops[targetNode.id];
        const nextHopNode = nextHopId ? getNodeById(nodes, nextHopId) : null;
        
        return {
          targetId: targetNode.id,
          nextHopId: reachable[targetNode.id] ? nextHopId : null,
          nextHopName: nextHopNode?.name || '-',
          cost: reachable[targetNode.id] ? distances[targetNode.id] : -1,
          hops: reachable[targetNode.id] ? hops[targetNode.id] : -1,
        };
      });
    
    return {
      nodeId: sourceNode.id,
      entries,
    };
  });
};
