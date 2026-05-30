const fs = require('fs');
const c = fs.readFileSync('src/App.tsx', 'utf8');

const rest = `

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
    executeMoveImmediately({ from, to, disk: 0, description: "移动从 " + from + " -> " + to }, false);
  }, [animationState.isAnimating, executeMoveImmediately]);

  const speedOptions = [
    { value: "slow", label: "慢" },
    { value: "medium", label: "中" },
    { value: "fast", label: "快" }
  ];

  const getEfficiencyColor = () => {
    if (efficiency >= 90) return "text-green-400";
    if (efficiency >= 70) return "text-yellow-400";
    return "text-rose-400";
  };

  const getEfficiencyBg = () => {
    if (efficiency >= 90) return "from-green-500 to-emerald-400";
    if (efficiency >= 70) return "from-yellow-500 to-amber-400";
    return "from-rose-500 to-red-400";
  };

  const animatingDisk = animationState.currentStep
    ? rods[animationState.currentStep.from]?.[rods[animationState.currentStep.from].length - 1] || null
    : null;

  const activeRodIds = getRodIds(rodMode);
  const threePegOptimal = calculateOptimalSteps3(diskCount);
  const fourPegOptimal = frameStewartSteps(diskCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <TowerControl className="text-cyan-400" size={40} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              汉诺塔可视化
            </h1>
          </div>
          <p className="text-slate-400 text-lg">递归算法演示 · 交互式学习 · {rodMode}柱模式</p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl">
              <div className={'flex justify-center items-end ' + (rodMode === 4 ? 'gap-4 md:gap-8' : 'gap-8 md:gap-16')}>
                {activeRodIds.map((rodId) => (
                  <RodComponent
                    key={rodId}
                    rodId={rodId}
                    rods={rods}
                    totalDisks={diskCount}
                    rodMode={rodMode}
                    onDrop={handleManualMove}
                    animatingDisk={animatingDisk}
                    animationState={animationState}
                  />
                ))}
              </div>
              <div className="mt-4 text-center text-slate-400 text-sm">
                {isPlaying ? (
                  <></>
                ) : animationState.isAnimating ? (
                  <span className="text-amber-400">移动中...</span>
                ) : (
                  <span>拖拽柱子顶部的盘子到其他柱子 · 目标: 全部移到 {targetRod} 柱</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <GitBranch size={20} className="text-purple-400" />
                  递归调用栈
                </h3>
                <div className="mb-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Layers size={14} />
                    <span>步骤: <span className="text-white font-mono">{currentStepIndex}</span> / {solutionSteps.length}</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {moveHistory.slice(-5).map((step, index) => (
                    <div key={index} className="p-2 rounded-lg text-sm bg-slate-700/50 text-slate-300">
                      {step.description}
                    </div>
                  ))}
                  {moveHistory.length === 0 && (
                    <div className="text-slate-500 text-sm">暂无移动记录</div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="text-xs text-slate-500 space-y-1">
                    {rodMode === 3 ? (
                      <>
                        <p>递归公式: T(n) = 2 × T(n-1) + 1</p>
                        <p>时间复杂度: O(2^n)</p>
                      </>
                    ) : (
                      <>
                        <p>Frame-Stewart 算法</p>
                        <p>递归: 选最优 k, 移 k 盘(4柱), 移 n-k 盘(3柱), 移 k 盘(4柱)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target size={20} className="text-blue-400" />
                  统计信息
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-700/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Footprints size={12} />总步数
                    </div>
                    <div className="text-2xl font-bold text-white">{totalSteps}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Award size={12} />最优步数
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">{optimalSteps}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <TrendingUp size={12} />效率
                    </div>
                    <div className={'text-xl font-bold ' + getEfficiencyColor()}>
                      {efficiency.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-3">
                    <div className="text-slate-400 text-xs mb-1">步数比例</div>
                    <div className="text-xl font-bold text-white">
                      {totalSteps > 0 ? (totalSteps / optimalSteps).toFixed(2) : '-'}
                      <span className="text-xs text-slate-500 ml-1">倍</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={'h-full bg-gradient-to-r ' + getEfficiencyBg() + ' transition-all duration-500'}
                      style={{ width: Math.min(100, efficiency) + '%' }}
                    />
                  </div>
                </div>
                {rodMode === 4 && (
                  <div className="mt-3 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <div className="text-xs text-indigo-300 font-medium mb-1">📊 3柱 vs 4柱对比</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">3柱最优: <span className="text-slate-200">{threePegOptimal}步</span></span>
                      <span className="text-slate-400">4柱最优: <span className="text-indigo-300">{fourPegOptimal}步</span></span>
                    </div>
                    <div className="text-xs text-green-400 mt-1">
                      节省 {((1 - fourPegOptimal / threePegOptimal) * 100).toFixed(1)}% 步数
                    </div>
                  </div>
                )}
                {isComplete && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 text-center">
                    <div className="text-lg">🎊</div>
                    <div className="text-green-400 font-bold text-sm">恭喜完成！</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 shadow-xl">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">柱子模式</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => changeRodMode(3)}
                      disabled={isPlaying || animationState.isAnimating}
                      className={'px-4 py-1.5 rounded-lg text-sm font-medium transition-all ' +
                        (rodMode === 3
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600') +
                        (isPlaying || animationState.isAnimating ? ' opacity-50' : '')}
                    >
                      3柱
                    </button>
                    <button
                      onClick={() => changeRodMode(4)}
                      disabled={isPlaying || animationState.isAnimating}
                      className={'px-4 py-1.5 rounded-lg text-sm font-medium transition-all ' +
                        (rodMode === 4
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600') +
                        (isPlaying || animationState.isAnimating ? ' opacity-50' : '')}
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
              ? '最优解步数公式: 2^n - 1'
              : '4柱最优步数: Frame-Stewart 算法（动态规划求解最优 k）'}
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
`;

fs.writeFileSync('src/App.tsx', c + rest, 'utf8');
console.log('done');
