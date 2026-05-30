import type { RodId, MoveStep, RecursionNode } from '../types/hanoi';

export function calculateOptimalSteps(n: number): number {
  return Math.pow(2, n) - 1;
}

export function generateSolutionSteps(n: number, from: RodId = 'A', to: RodId = 'C', aux: RodId = 'B'): MoveStep[] {
  const steps: MoveStep[] = [];

  function solve(n: number, from: RodId, to: RodId, aux: RodId) {
    if (n === 0) return;
    solve(n - 1, from, aux, to);
    steps.push({
      from,
      to,
      disk: n,
      description: `移动盘子 ${n} 从 ${from} 到 ${to}`
    });
    solve(n - 1, aux, to, from);
  }

  solve(n, from, to, aux);
  return steps;
}

export function generateRecursionTree(n: number, from: RodId = 'A', to: RodId = 'C', aux: RodId = 'B'): RecursionNode[] {
  const nodes: RecursionNode[] = [];
  let nodeId = 0;

  function traverse(n: number, from: RodId, to: RodId, aux: RodId, depth: number) {
    const id = `node-${nodeId++}`;
    nodes.push({
      id,
      n,
      from,
      to,
      aux,
      depth,
      isActive: false,
      isCompleted: false
    });

    if (n === 0) return;
    traverse(n - 1, from, aux, to, depth + 1);
    traverse(n - 1, aux, to, from, depth + 1);
  }

  traverse(n, from, to, aux, 0);
  return nodes;
}

export function getActiveRecursionNodes(
  allNodes: RecursionNode[],
  currentStep: number,
  totalSteps: number
): RecursionNode[] {
  return allNodes.map((node, index) => ({
    ...node,
    isActive: index === currentStep,
    isCompleted: index < currentStep
  }));
}

export function validateMove(
  rods: Record<RodId, { size: number }[]>,
  from: RodId,
  to: RodId
): boolean {
  const fromRod = rods[from];
  const toRod = rods[to];

  if (fromRod.length === 0) return false;

  const topDisk = fromRod[fromRod.length - 1];
  if (toRod.length === 0) return true;

  const targetTopDisk = toRod[toRod.length - 1];
  return topDisk.size < targetTopDisk.size;
}

export function checkCompletion(rods: Record<RodId, unknown[]>, targetRod: RodId = 'C', totalDisks: number): boolean {
  return rods[targetRod].length === totalDisks;
}
