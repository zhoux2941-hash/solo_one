const fs = require('fs');

const content = `import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TowerControl, Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronLeft, ChevronRight, Target, Footprints, TrendingUp, Award, GitBranch, Layers } from 'lucide-react';

type RodId = string;
type Speed = 'slow' | 'medium' | 'fast';
type RodMode = 3 | 4;

const ROD_IDS_3 = ['A', 'B', 'C'];
const ROD_IDS_4 = ['A', 'B', 'C', 'D'];

function getRodIds(mode) {
  return mode === 4 ? ROD_IDS_4 : ROD_IDS_3;
}

interface Disk {
  id: number;
  size: number;
  color: string;
}

interface MoveStep {
  from: RodId;
  to: RodId;
  disk: number;
  description: string;
}

interface AnimationState {
  isAnimating: boolean;
  currentStep: MoveStep | null;
  progress: number;
}

const DISK_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77',
  '#4D96FF', '#6F69AC', '#9B59B6', '#E91E63'
];

function getDiskColor(size: number): string {
  return DISK_COLORS[(size - 1) % DISK_COLORS.length];
}

function calculateOptimalSteps3(n: number): number {
  return Math.pow(2, n) - 1;
}

function frameStewartSteps(n: number): number {
  const memo = new Map();
  function solve(disks: number, pegs: number): number {
    if (disks === 0) return 0;
    if (disks === 1) return 1;
    if (pegs === 3) return Math.pow(2, disks) - 1;
    const key = disks + '-' + pegs;
    if (memo.has(key)) return memo.get(key);
    let minMoves = Infinity;
    for (let k = 1; k < disks; k++) {
      const moves = solve(k, pegs) + solve(disks - k, pegs - 1) + solve(k, pegs);
      if (moves < minMoves) minMoves = moves;
    }
    memo.set(key, minMoves);
    return minMoves;
  }
  return solve(n, 4);
}

function generateSolutionSteps3(n: number, from: RodId = 'A', to: RodId = 'C', aux: RodId = 'B'): MoveStep[] {
  const steps: MoveStep[] = [];
  function solve(n: number, from: RodId, to: RodId, aux: RodId) {
    if (n === 0) return;
    solve(n - 1, from, aux, to);
    steps.push({ from, to, disk: n, description: '移动盘子 ' + n + ' 从 ' + from + ' -> ' + to });
    solve(n - 1, aux, to, from);
  }
  solve(n, from, to, aux);
  return steps;
}

function generateSolutionSteps4(n: number, rods = ['A', 'B', 'C', 'D']): MoveStep[] {
  const steps: MoveStep[] = [];
  const optimalKMemo = new Map();
  function solve(n: number, from: RodId, to: RodId, auxRods: RodId[]) {
    if (n === 0) return;
    if (n === 1) {
      steps.push({ from, to, disk: 1, description: '移动盘子 1 从 ' + from + ' -> ' + to });
      return;
    }
    if (auxRods.length === 1) {
      solve3(n, from, to, auxRods[0]);
      return;
    }
    const key = n + '-' + auxRods.length;
    let bestK = 1;
    if (optimalKMemo.has(key)) {
      bestK = optimalKMemo.get(key);
    } else {
      let minMoves = Infinity;
      for (let k = 1; k < n; k++) {
        const moves = countMoves(k, auxRods.length + 2) + countMoves(n - k, auxRods.length + 1) + countMoves(k, auxRods.length + 2);
        if (moves < minMoves) { minMoves = moves; bestK = k; }
      }
      optimalKMemo.set(key, bestK);
    }
    const tempRod = auxRods[0];
    const remainingAux = auxRods.slice(1);
    solve(bestK, from, tempRod, remainingAux);
    solve3(n - bestK, from, to, remainingAux.length > 0 ? remainingAux[0] : tempRod);
    solve(bestK, tempRod, to, remainingAux);
  }
  function solve3(n: number, from: RodId, to: RodId, aux: RodId) {
    if (n === 0) return;
    solve3(n - 1, from, aux, to);
    steps.push({ from, to, disk: n, description: '移动盘子 ' + n + ' 从 ' + from + ' -> ' + to });
    solve3(n - 1, aux, to, from);
  }
  function countMoves(disks: number, pegs: number): number {
    if (disks === 0) return 0;
    if (disks === 1) return 1;
    if (pegs === 3) return Math.pow(2, disks) - 1;
    let minMoves = Infinity;
    for (let k = 1; k < disks; k++) {
      const moves = countMoves(k, pegs) + countMoves(disks - k, pegs - 1) + countMoves(k, pegs);
      if (moves < minMoves) minMoves = moves;
    }
    return minMoves;
  }
  const from = rods[0];
  const to = rods[rods.length - 1];
  const auxRods = rods.slice(1, -1);
  solve(n, from, to, auxRods);
  return steps;
}

function generateSolutionSteps(n: number, rodMode: RodMode): MoveStep[] {
  if (rodMode === 3) {
    return generateSolutionSteps3(n, 'A', 'C', 'B');
  } else {
    return generateSolutionSteps4(n, ['A', 'B', 'C', 'D']);
  }
}

function createInitialDisks(count: number): Disk[] {
  const disks: Disk[] = [];
  for (let i = count; i >= 1; i--) {
    disks.push({ id: i, size: i, color: getDiskColor(i) });
  }
  return disks;
}

function createInitialRods(rodMode: RodMode, diskCount: number): Record<RodId, Disk[]> {
  const rods: Record<RodId, Disk[]> = {};
  const rodIds = getRodIds(rodMode);
  rodIds.forEach((id, index) => {
    rods[id] = index === 0 ? createInitialDisks(diskCount) : [];
  });
  return rods;
}

function validateMove(rods: Record<RodId, Disk[]>, from: RodId, to: RodId): boolean {
  const fromRod = rods[from];
  const toRod = rods[to];
  if (!fromRod || fromRod.length === 0) return false;
  if (!toRod || toRod.length === 0) return true;
  return fromRod[fromRod.length - 1].size < toRod[toRod.length - 1].size;
}

function getSpeedDuration(speed: Speed): number {
  switch (speed) {
    case 'slow': return 1200;
    case 'medium': return 600;
    case 'fast': return 250;
    default: return 600;
  }
}
`;

fs.writeFileSync('src/App.tsx', content);
console.log('Part 1 written');
