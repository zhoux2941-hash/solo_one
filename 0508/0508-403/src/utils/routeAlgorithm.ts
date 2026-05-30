import type { RouteResult, LineStation, Transfer } from '@/types';
import { lineStations, transfers } from '@/data/railwayConfig';

interface Edge {
  toStationId: string;
  lineId: string;
  minutes: number;
  type: 'ride' | 'transfer';
}

function buildGraph(): Map<string, Edge[]> {
  const graph = new Map<string, Edge[]>();

  const byLine = new Map<string, LineStation[]>();
  for (const ls of lineStations) {
    if (!byLine.has(ls.lineId)) byLine.set(ls.lineId, []);
    byLine.get(ls.lineId)!.push(ls);
  }

  for (const [, stations] of byLine) {
    stations.sort((a, b) => a.order - b.order);
    for (let i = 0; i < stations.length; i++) {
      const curr = stations[i];
      if (!graph.has(curr.stationId)) graph.set(curr.stationId, []);

      if (i > 0) {
        const prev = stations[i - 1];
        graph.get(curr.stationId)!.push({
          toStationId: prev.stationId,
          lineId: curr.lineId,
          minutes: curr.minutesFromPrev,
          type: 'ride',
        });
      }
      if (i < stations.length - 1) {
        const next = stations[i + 1];
        graph.get(curr.stationId)!.push({
          toStationId: next.stationId,
          lineId: next.lineId,
          minutes: next.minutesFromPrev,
          type: 'ride',
        });
      }
    }
  }

  for (const t of transfers) {
    if (!graph.has(t.stationId)) graph.set(t.stationId, []);
    graph.get(t.stationId)!.push({
      toStationId: t.stationId,
      lineId: t.toLineId,
      minutes: t.transferMinutes,
      type: 'transfer',
    });
    graph.get(t.stationId)!.push({
      toStationId: t.stationId,
      lineId: t.fromLineId,
      minutes: t.transferMinutes,
      type: 'transfer',
    });
  }

  return graph;
}

const graph = buildGraph();

interface State {
  stationId: string;
  lineId: string;
  cost: number;
  path: { stationId: string; lineId: string }[];
}

export function findRoute(fromStationId: string, toStationId: string): RouteResult | null {
  if (fromStationId === toStationId) return null;

  const startLines = new Set<string>();
  for (const ls of lineStations) {
    if (ls.stationId === fromStationId) startLines.add(ls.lineId);
  }

  const visited = new Set<string>();
  const queue: State[] = [];

  for (const lineId of startLines) {
    queue.push({
      stationId: fromStationId,
      lineId,
      cost: 0,
      path: [{ stationId: fromStationId, lineId }],
    });
  }

  queue.sort((a, b) => a.cost - b.cost);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.stationId}|${current.lineId}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (current.stationId === toStationId) {
      return buildRouteResult(current.path);
    }

    const edges = graph.get(current.stationId) || [];
    for (const edge of edges) {
      if (edge.type === 'transfer' && edge.lineId === current.lineId) continue;
      if (edge.type === 'ride' && edge.lineId !== current.lineId) continue;

      const nextLineId = edge.type === 'transfer' ? edge.lineId : current.lineId;
      const nextKey = `${edge.toStationId}|${nextLineId}`;
      if (visited.has(nextKey)) continue;

      queue.push({
        stationId: edge.toStationId,
        lineId: nextLineId,
        cost: current.cost + edge.minutes,
        path: [...current.path, { stationId: edge.toStationId, lineId: nextLineId }],
      });
    }

    queue.sort((a, b) => a.cost - b.cost);
  }

  return null;
}

function buildRouteResult(path: { stationId: string; lineId: string }[]): RouteResult {
  const stationPath = path.map((p) => p.stationId);
  const totalMinutes = 0;

  const segments: RouteResult['segments'] = [];
  let currentLineId = path[0].lineId;
  let currentStations: string[] = [path[0].stationId];

  for (let i = 1; i < path.length; i++) {
    if (path[i].lineId !== currentLineId) {
      segments.push({ lineId: currentLineId, stationIds: currentStations });
      currentLineId = path[i].lineId;
      currentStations = [path[i - 1].stationId];
    }
    currentStations.push(path[i].stationId);
  }
  segments.push({ lineId: currentLineId, stationIds: currentStations });

  const routeTransfers: RouteResult['transfers'] = [];
  for (let i = 1; i < segments.length; i++) {
    const prevSeg = segments[i - 1];
    const transferStationId = prevSeg.stationIds[prevSeg.stationIds.length - 1];
    routeTransfers.push({
      stationId: transferStationId,
      fromLineId: prevSeg.lineId,
      toLineId: segments[i].lineId,
    });
  }

  let calcMinutes = 0;
  for (const seg of segments) {
    for (let j = 1; j < seg.stationIds.length; j++) {
      const ls = lineStations.find(
        (l) => l.lineId === seg.lineId && l.stationId === seg.stationIds[j]
      );
      if (ls) calcMinutes += ls.minutesFromPrev;
    }
  }

  for (const t of routeTransfers) {
    const tf = transfers.find(
      (tr) =>
        tr.stationId === t.stationId &&
        tr.fromLineId === t.fromLineId &&
        tr.toLineId === t.toLineId
    );
    if (tf) calcMinutes += tf.transferMinutes;
  }

  return {
    segments,
    stationPath,
    totalMinutes: calcMinutes || totalMinutes,
    transfers: routeTransfers,
  };
}
