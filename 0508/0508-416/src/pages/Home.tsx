import React, { useEffect, useCallback } from 'react';
import { ControlPanel } from '@/components/ControlPanel';
import { NumberGrid } from '@/components/NumberGrid';
import { StatusBar } from '@/components/StatusBar';
import { Statistics } from '@/components/Statistics';
import { useSieveStore } from '@/store/useSieveStore';
import { useSieveAnimation } from '@/hooks/useSieveAnimation';
import { Speed } from '@/types';

const Home: React.FC = () => {
  const {
    n,
    numbers,
    currentPrime,
    isRunning,
    isCompleted,
    isPaused,
    speed,
    stepsCompleted,
    totalSteps,
    primeCount,
    setN,
    setSpeed,
    initialize,
    reset,
  } = useSieveStore();

  const { autoPlay, stepForward, pause, resume, stop } = useSieveAnimation();

  useEffect(() => {
    initialize(100);
  }, [initialize]);

  const handleGenerate = useCallback(() => {
    stop();
    initialize(n);
  }, [n, initialize, stop]);

  const handleStart = useCallback(async () => {
    if (numbers.length === 0) return;
    await autoPlay();
  }, [numbers.length, autoPlay]);

  const handleStep = useCallback(async () => {
    if (numbers.length === 0) return;
    await stepForward();
  }, [numbers.length, stepForward]);

  const handleReset = useCallback(() => {
    stop();
    reset();
  }, [stop, reset]);

  const handleSpeedChange = useCallback(
    (newSpeed: Speed) => {
      setSpeed(newSpeed);
    },
    [setSpeed]
  );

  const hasGrid = numbers.length > 0;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            <span className="text-prime">埃拉托色尼筛法</span>
            <span className="text-slate-300"> 可视化</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            交互式演示古老的素数筛选算法，从2开始逐步标记合数，直观理解素数的分布规律
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ControlPanel
              n={n}
              speed={speed}
              isRunning={isRunning}
              isPaused={isPaused}
              isCompleted={isCompleted}
              hasGrid={hasGrid}
              onNChange={setN}
              onGenerate={handleGenerate}
              onSpeedChange={handleSpeedChange}
              onStart={handleStart}
              onStep={handleStep}
              onPause={pause}
              onResume={resume}
              onReset={handleReset}
            />
          </div>

          <div className="lg:col-span-3 space-y-6">
            {hasGrid && (
              <StatusBar
                currentPrime={currentPrime}
                stepsCompleted={stepsCompleted}
                totalSteps={totalSteps}
                isRunning={isRunning}
                isPaused={isPaused}
                isCompleted={isCompleted}
                n={n}
              />
            )}

            <NumberGrid numbers={numbers} n={n} />

            <Statistics
              primeCount={primeCount}
              n={n}
              isCompleted={isCompleted}
            />
          </div>
        </div>

        <footer className="text-center text-slate-500 text-sm pt-8">
          <p>
            埃拉托色尼筛法（Sieve of Eratosthenes）是由古希腊数学家埃拉托色尼发明的一种简单且高效的素数筛选算法。
          </p>
          <p className="mt-1">
            它通过从2开始，将每个素数的所有倍数标记为合数来工作。算法的时间复杂度为 O(n log log n)。
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
