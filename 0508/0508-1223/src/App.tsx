import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TowerControl, Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronLeft, ChevronRight, Target, Footprints, TrendingUp, Award, GitBranch, Layers } from 'lucide-react';

type RodId = string;
type Speed = 'slow' | 'medium' | 'fast';
type RodMode = 3 | 4;

const ROD_IDS_3 = ['A', 'B', 'C'];
const ROD_IDS_4 = ['A', 'B', 'C', 'D'];

function getRodIds(mode: RodMode): RodId[] {
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
  const memo = new Map<string, number>();
  function solve(disks: number, pegs: number): number {
    if (disks === 0) return 0;
    if (disks === 1) return 1;
    if (pegs === 3) return Math.pow(2, disks) - 1;
    const key = disks + '-' + pegs;
    if (memo.has(key)) return memo.get(key)!;
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
  const optimalKMemo = new Map<string, number>();
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
      bestK = optimalKMemo.get(key)!;
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

function DiskComponent({ disk, totalDisks, isTop, isAnimating, animationProgress }) {
  const baseWidth = 36;
  const widthIncrement = 20;
  const width = baseWidth + (disk.size - 1) * widthIncrement;
  const maxWidth = baseWidth + (totalDisks - 1) * widthIncrement;
  const leftOffset = (maxWidth - width) / 2;

  return (
    <div
      className={'h-5 rounded-md shadow-lg transition-all duration-300 ' +
        (isTop ? 'cursor-grab active:cursor-grabbing hover:brightness-110' : 'cursor-not-allowed opacity-90') +
        (isAnimating ? ' z-50 scale-105' : '')}
      style={{
        width: width + 'px',
        marginLeft: leftOffset + 'px',
        backgroundColor: disk.color,
        boxShadow: '0 3px 10px ' + disk.color + '40, inset 0 1px 3px rgba(255,255,255,0.3)',
        transform: isAnimating && animationProgress !== undefined
          ? 'translateY(' + (-20 - animationProgress * 40) + 'px)'
          : 'none',
        transition: isAnimating ? 'none' : 'all 0.3s ease'
      }}
    >
      <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold drop-shadow-md">
        {disk.size}
      </div>
    </div>
  );
}

function RodComponent({ rodId, rods, totalDisks, rodMode, onDrop, animatingDisk, animationState }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingFrom, setDraggingFrom] = useState(null);
  const baseWidth = 36;
  const widthIncrement = 20;
  const maxWidth = baseWidth + (totalDisks - 1) * widthIncrement + 32;

  const disks = rods[rodId] || [];
  const showAnimatingDisk = animationState.currentStep?.to === rodId && animationState.progress > 0.5;
  const hideTopDisk = animationState.currentStep?.from === rodId && animationState.progress > 0.3;

  const handleDragStart = (e, fromRod) => {
    e.dataTransfer.setData('fromRod', fromRod);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingFrom(fromRod);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (draggingFrom !== rodId) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const from = e.dataTransfer.getData('fromRod');
    if (from && from !== rodId) {
      onDrop(from, rodId);
    }
    setDraggingFrom(null);
  };

  const displayDisks = hideTopDisk ? disks.slice(0, -1) : disks;

  return (
    <div
      className={'flex flex-col items-center transition-all duration-300 ' + (isDragOver ? 'scale-105' : '')}
      style={{ width: maxWidth + 'px' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-slate-300 font-bold text-base mb-1">{rodId}</div>
      <div
        className={'relative w-full flex flex-col-reverse items-center py-1 rounded-t-lg transition-all duration-300 ' +
          (isDragOver ? 'bg-slate-700/50 ring-2 ring-blue-400' : '')}
        style={{ minHeight: totalDisks * 24 + 32 + 'px' }}
      >
        <div
          className="absolute top-0 w-2.5 rounded-t-lg bg-gradient-to-b from-amber-600 to-amber-800"
          style={{ height: totalDisks * 24 + 16 + 'px' }}
        />
        <div className="relative z-10 flex flex-col-reverse gap-0.5 w-full items-center">
          {displayDisks.map((disk, index) => (
            <div
              key={disk.id}
              draggable={index === disks.length - 1 && !animationState.isAnimating}
              onDragStart={(e) => index === disks.length - 1 && handleDragStart(e, rodId)}
            >
              <DiskComponent
                disk={disk}
                totalDisks={totalDisks}
                isTop={index === disks.length - 1 && !hideTopDisk}
              />
            </div>
          ))}
          {showAnimatingDisk && animatingDisk && (
            <div style={{ opacity: animationState.progress * 2 - 1 }}>
              <DiskComponent
                disk={animatingDisk}
                totalDisks={totalDisks}
                isTop={true}
                isAnimating={true}
                animationProgress={1 - animationState.progress}
              />
            </div>
          )}
        </div>
      </div>
      <div
        className="h-3 rounded-lg bg-gradient-to-b from-amber-700 to-amber-900 shadow-lg"
        style={{ width: maxWidth + 'px' }}
      />
    </div>
  );
}

function HanoiPage() {
  const [rodMode, setRodMode] = useState(3);
  const [diskCount, setDiskCount] = useState(3);
  const [rods, setRods] = useState(() => createInitialRods(3, 3));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [manualSteps, setManualSteps] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('medium');
  const [moveHistory, setMoveHistory] = useState([]);
  const [solutionSteps, setSolutionSteps] = useState(() => generateSolutionSteps(3, 3));
  const [isComplete, setIsComplete] = useState(false);
  const [animationState, setAnimationState] = useState({
    isAnimating: false,
    currentStep: null,
    progress: 0
  });

  const animationQueueRef = useRef([]);
  const isProcessingRef = useRef(false);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(0);

  const targetRod = rodMode === 3 ? 'C' : 'D';
  const optimalSteps = rodMode === 3 ? calculateOptimalSteps3(diskCount) : frameStewartSteps(diskCount);
  const efficiency = totalSteps > 0 ? (optimalSteps / totalSteps) * 100 : 100;

  const fullReset = useCallback((newRodMode, newDiskCount) => {
    setRodMode(newRodMode);
    setDiskCount(newDiskCount);
    setRods(createInitialRods(newRodMode, newDiskCount));
    setCurrentStepIndex(0);
    setTotalSteps(0);
    setManualSteps(0);
    setIsPlaying(false);
    setMoveHistory([]);
    setSolutionSteps(generateSolutionSteps(newDiskCount, newRodMode));
    setIsComplete(false);
    setAnimationState({ isAnimating: false, currentStep: null, progress: 0 });
    animationQueueRef.current = [];
    isProcessingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const resetGame = useCallback(() => {
    fullReset(rodMode, diskCount);
  }, [rodMode, diskCount, fullReset]);

  const changeDiskCount = useCallback((delta) => {
    const newCount = Math.max(3, Math.min(8, diskCount + delta));
    if (newCount !== diskCount) {
      fullReset(rodMode, newCount);
    }
  }, [diskCount, rodMode, fullReset]);

  const changeRodMode = useCallback((mode) => {
    if (mode !== rodMode) {
      fullReset(mode, diskCount);
    }
  }, [rodMode, diskCount, fullReset]);

  const checkCompletion = useCallback((newRods) => {
    const target = newRods[targetRod];
    return target && target.length === diskCount;
  }, [targetRod, diskCount]);

  const executeMoveImmediately = useCallback((step, isAuto = false) => {
    if (!validateMove(rods, step.from, step.to)) return false;
    const newRods = { ...rods, [step.from]: [...rods[step.from]], [step.to]: [...rods[step.to]] };
    const disk = newRods[step.from].pop();
    newRods[step.to].push(disk);
    setRods(newRods);
    setTotalSteps(t => t + 1);
    if (!isAuto) setManualSteps(t => t + 1);
    setMoveHistory(h => [...h, step]);
    if (checkCompletion(newRods)) {
      setIsComplete(true);
      setIsPlaying(false);
    }
    return true;
  }, [rods, checkCompletion]);

  const executeAnimatedMove = useCallback((step, isAuto = false) => {
    return new Promise((resolve) => {
      if (!validateMove(rods, step.from, step.to)) {
        resolve(false);
        return;
      }
      const duration = getSpeedDuration(speed);
      setAnimationState({ isAnimating: true, currentStep: step, progress: 0 });
      startTimeRef.current = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setAnimationState(prev => ({ ...prev, progress: easedProgress }));
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          const newRods = { ...rods, [step.from]: [...rods[step.from]], [step.to]: [...rods[step.to]] };
          const disk = newRods[step.from].pop();
          newRods[step.to].push(disk);
          setRods(newRods);
          setTotalSteps(t => t + 1);
          if (!isAuto) setManualSteps(t => t + 1);
          setMoveHistory(h => [...h, step]);
          setAnimationState({ isAnimating: false, currentStep: null, progress: 0 });
          if (checkCompletion(newRods)) {
            setIsComplete(true);
            setIsPlaying(false);
          }
          resolve(true);
        }
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    });
  }, [rods, speed, checkCompletion]);

  const processAnimationQueue = useCallback(async () => {
    if (isProcessingRef.current || animationQueueRef.current.length === 0) return;
    isProcessingRef.current = true;
    while (animationQueueRef.current.length > 0 && isPlaying) {
      const step = animationQueueRef.current.shift();
      const success = await executeAnimatedMove(step, true);
      if (success) {
        setCurrentStepIndex(s => s + 1);
      }
      if (!isPlaying) break;
    }
    isProcessingRef.current = false;
    if (animationQueueRef.current.length === 0 && currentStepIndex >= solutionSteps.length - 1) {
      setIsPlaying(false);
    }
  }, [executeAnimatedMove, isPlaying, currentStepIndex, solutionSteps.length]);

  const stepForward = useCallback(async () => {
    if (currentStepIndex >= solutionSteps.length || animationState.isAnimating) return;
    const step = solutionSteps[currentStepIndex];
    await executeAnimatedMove(step, true);
    setCurrentStepIndex(s => s + 1);
  }, [currentStepIndex, solutionSteps, executeAnimatedMove, animationState.isAnimating]);

  const stepBackward = useCallback(() => {
    if (currentStepIndex <= 0 || moveHistory.length === 0 || animationState.isAnimating) return;
    const lastMove = moveHistory[moveHistory.length - 1];
    const newRods = { ...rods, [lastMove.to]: [...rods[lastMove.to]], [lastMove.from]: [...rods[lastMove.from]] };
    const disk = newRods[lastMove.to].pop();
    newRods[lastMove.from].push(disk);
    setRods(newRods);
    setCurrentStepIndex(s => s - 1);
    setTotalSteps(t => t - 1);
    setMoveHistory(h => h.slice(0, -1));
    setIsComplete(false);
  }, [currentStepIndex, moveHistory, rods, animationState.isAnimating]);

  useEffect(() => {
    if (isPlaying && !animationState.isAnimating && currentStepIndex < solutionSteps.length) {
      animationQueueRef.current = [solutionSteps[currentStepIndex]];
      processAnimationQueue();
    }
  }, [isPlaying, animationState.isAnimating, currentStepIndex, solutionSteps, processAnimationQueue]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleManualMove = useCallback((from, to) => {
    if (animationState.isAnimating) return;
    executeMoveImmediately({ from, to, disk: 0, description: '移动从 ' + from + ' -> ' + to }, false);
  }, [animationState.isAnimating, executeMoveImmediately]);

  const speedOptions = [
    { value: 'slow', label: '慢' },
    { value: 'medium', label: '中' },
    { value: 'fast', label: '快' }
  ];

  const getEfficiencyColor = () => {
    if (efficiency >= 90) return 'text-green-400';
    if (efficiency >= 70) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const getEfficiencyBg = () => {
    if (efficiency >= 90) return 'from-green-500 to-emerald-400';
    if (efficiency >= 70) return 'from-yellow-500 to-amber-400';
    return 'from-rose-500 to-red-400';
  };

  const animatingDisk = animationState.currentStep
    ? rods[animationState.currentStep.from]?.[rods[animationState.currentStep.from].length - 1] || null
    : null;

  const activeRodIds = getRodIds(rodMode);
  const threePegOptimal = calculateOptimalSteps3(diskCount);
  const fourPegOptimal = frameStewartSteps(diskCount);
                  <div className="flex gap-1">
                    {speedOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSpeed(option.value)}
                        className={'px-3 py-1.5 rounded-lg text-sm font-medium transition-all ' +
                          (speed === option.value
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600')}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={stepBackward}
                      disabled={currentStepIndex <= 0 || isPlaying || animationState.isAnimating}
                      className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white"
                    >
                      <SkipBack size={18} />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={isComplete || animationState.isAnimating}
                      className={'p-3.5 rounded-xl transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed ' +
                        (isPlaying
                          ? 'bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/30'
                          : 'bg-green-500 hover:bg-green-400 shadow-lg shadow-green-500/30')}
                    >
                      {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                    </button>
                    <button
                      onClick={stepForward}
                      disabled={currentStepIndex >= solutionSteps.length || isPlaying || animationState.isAnimating}
                      className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white"
                    >
                      <SkipForward size={18} />
                    </button>
                    <button
                      onClick={resetGame}
                      disabled={animationState.isAnimating}
                      className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-all ml-2 disabled:opacity-50"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-slate-400 text-sm">
                    进度: <span className="text-white font-mono">{currentStepIndex}</span>
                    <span className="text-slate-500"> / </span>
                    <span className="text-slate-300 font-mono">{solutionSteps.length}</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={'h-full transition-all duration-300 ' +
                        (rodMode === 4
                          ? 'bg-gradient-to-r from-purple-500 to-pink-400'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-400')}
                      style={{ width: (currentStepIndex / solutionSteps.length) * 100 + '%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-800/60 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-3">📖 使用说明</h3>
              <ul className="text-slate-400 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>拖拽盘子在柱子间移动</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span>点击播放按钮查看自动求解</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>使用单步按钮逐帧查看</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>切换3柱/4柱模式对比效率</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>规则：大盘不能放在小盘上面</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20">
              <h3 className="text-white font-bold mb-2">💡 算法原理</h3>
              {rodMode === 3 ? (
                <>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    经典3柱汉诺塔 — 递归解法：
                  </p>
                  <ol className="text-slate-400 text-sm mt-2 space-y-1 list-decimal list-inside">
                    <li>将 n-1 个盘子从 A 移到 B</li>
                    <li>将第 n 个盘子从 A 移到 C</li>
                    <li>将 n-1 个盘子从 B 移到 C</li>
                  </ol>
                  <div className="mt-2 text-xs text-slate-500">
                    最优步数公式: 2^n - 1
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    4柱汉诺塔 — Frame-Stewart 算法：
                  </p>
                  <ol className="text-slate-400 text-sm mt-2 space-y-1 list-decimal list-inside">
                    <li>选择最优 k (1 ≤ k {'<'} n)</li>
                    <li>将 k 个盘子移到辅助柱（4柱递归）</li>
                    <li>将 n-k 个盘子移到目标柱（3柱递归）</li>
                    <li>将 k 个盘子移到目标柱（4柱递归）</li>
                  </ol>
                  <div className="mt-2 text-xs text-slate-500">
                    4柱模式比3柱显著减少步数
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-500 text-sm">
          <p>
            {rodMode === 3
              ? <>最优解步数公式: 2<sup>n</sup> - 1</>
              : <>4柱最优步数: Frame-Stewart 算法（动态规划求解最优 k）</>
            }
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HanoiPage />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">柱子模式</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => changeRodMode(3)}
                      disabled={isPlaying || animationState.isAnimating}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        rodMode === 3
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      } disabled:opacity-50`}
                    >
                      3柱
                    </button>
                    <button
                      onClick={() => changeRodMode(4)}
                      disabled={isPlaying || animationState.isAnimating}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        rodMode === 4
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      } disabled:opacity-50`}
                    >
                      4柱
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">盘子数量</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => changeDiskCount(-1)}
                      disabled={diskCount <= 3 || isPlaying || animationState.isAnimating}
                      className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-white"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="w-8 text-center text-xl font-bold text-white">{diskCount}</span>
                    <button
                      onClick={() => changeDiskCount(1)}
                      disabled={diskCount >= 8 || isPlaying || animationState.isAnimating}
                      className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-white"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">动画速度</label>
                  <div className="flex gap-1">
                    {speedOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSpeed(option.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          speed === option.value
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={stepBackward}
                      disabled={currentStepIndex <= 0 || isPlaying || animationState.isAnimating}
                      className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white"
                    >
                      <SkipBack size={18} />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={isComplete || animationState.isAnimating}
                      className={`p-3.5 rounded-xl transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                        isPlaying
                          ? 'bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/30'
                          : 'bg-green-500 hover:bg-green-400 shadow-lg shadow-green-500/30'
                      }`}
                    >
                      {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                    </button>
                    <button
                      onClick={stepForward}
                      disabled={currentStepIndex >= solutionSteps.length || isPlaying || animationState.isAnimating}
                      className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white"
                    >
                      <SkipForward size={18} />
                    </button>
                    <button
                      onClick={resetGame}
                      disabled={animationState.isAnimating}
                      className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-all ml-2 disabled:opacity-50"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-slate-400 text-sm">
                    进度: <span className="text-white font-mono">{currentStepIndex}</span>
                    <span className="text-slate-500"> / </span>
                    <span className="text-slate-300 font-mono">{solutionSteps.length}</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        rodMode === 4
                          ? 'bg-gradient-to-r from-purple-500 to-pink-400'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      }`}
                      style={{ width: `${(currentStepIndex / solutionSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-800/60 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-3">📖 使用说明</h3>
              <ul className="text-slate-400 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>拖拽盘子在柱子间移动</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span>点击播放按钮查看自动求解</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>使用单步按钮逐帧查看</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>切换3柱/4柱模式对比效率</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>规则：大盘不能放在小盘上面</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20">
              <h3 className="text-white font-bold mb-2">💡 算法原理</h3>
              {rodMode === 3 ? (
                <>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    经典3柱汉诺塔 — 递归解法：
                  </p>
                  <ol className="text-slate-400 text-sm mt-2 space-y-1 list-decimal list-inside">
                    <li>将 n-1 个盘子从 A 移到 B</li>
                    <li>将第 n 个盘子从 A 移到 C</li>
                    <li>将 n-1 个盘子从 B 移到 C</li>
                  </ol>
                  <div className="mt-2 text-xs text-slate-500">
                    最优步数公式: 2^n - 1
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    4柱汉诺塔 — Frame-Stewart 算法：
                  </p>
                  <ol className="text-slate-400 text-sm mt-2 space-y-1 list-decimal list-inside">
                    <li>选择最优 k (1 ≤ k &lt; n)</li>
                    <li>将 k 个盘子移到辅助柱（4柱递归）</li>
                    <li>将 n-k 个盘子移到目标柱（3柱递归）</li>
                    <li>将 k 个盘子移到目标柱（4柱递归）</li>
                  </ol>
                  <div className="mt-2 text-xs text-slate-500">
                    4柱模式比3柱显著减少步数
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-500 text-sm">
          <p>
            {rodMode === 3
              ? <>最优解步数公式: 2<sup>n</sup> - 1</>
              : <>4柱最优步数: Frame-Stewart 算法（动态规划求解最优 k）</>
            }
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HanoiPage />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
