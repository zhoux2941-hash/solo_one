import React, { useEffect, useRef } from 'react';
import Header from '@/components/Header';
import ControlPanel from '@/components/ControlPanel';
import ContainerView from '@/components/ContainerView';
import DataDisplay from '@/components/DataDisplay';
import ChartsSection from '@/components/ChartsSection';
import CalibrationPanel from '@/components/CalibrationPanel';
import { useSimulationStore } from '@/store/useSimulationStore';

export default function Home() {
  const {
    params,
    currentWaterHeight,
    isRunning,
    isPaused,
    multiLevelState,
    updateSimulationStep,
    calculateTheoreticalCurve,
  } = useSimulationStore();

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    calculateTheoreticalCurve();
  }, [calculateTheoreticalCurve]);

  useEffect(() => {
    if (!isRunning || isPaused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      updateSimulationStep(deltaTime);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, isPaused, updateSimulationStep]);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <ControlPanel />

            <div
              className="p-6 rounded-2xl border-2 classical-border"
              style={{
                backgroundColor: 'rgba(245, 240, 230, 0.9)',
                borderColor: '#8b7355',
              }}
            >
              <h3
                className="text-xl font-bold mb-4 text-center"
                style={{ color: '#1a3a4a', fontFamily: 'serif' }}
              >
                🏺 容器可视化
              </h3>
              <ContainerView
                shape={params.containerShape}
                containerSize={params.containerSize}
                initialWaterHeight={params.initialWaterHeight}
                currentWaterHeight={currentWaterHeight}
                isRunning={isRunning && !isPaused}
                useMultiLevel={params.useMultiLevel}
                multiLevelState={multiLevelState}
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <DataDisplay />
            <ChartsSection />
            <CalibrationPanel />
          </div>
        </div>

        <div
          className="mt-8 p-6 rounded-2xl border-2 text-center"
          style={{
            backgroundColor: 'rgba(26, 58, 74, 0.05)',
            borderColor: '#8b7355',
          }}
        >
          <p className="text-sm" style={{ color: '#6b5344' }}>
            💡 <strong>历史小知识：</strong>
            漏刻是中国古代重要的计时工具，至少在西周时期就已出现。
            古人通过日晷观测太阳位置来校准漏刻，以提高计时精度。
            最著名的漏刻是北宋沈括改进的「浮漏」，计时精度可达每日误差小于1分钟。
          </p>
        </div>
      </main>

      <footer
        className="py-6 text-center"
        style={{ backgroundColor: 'rgba(26, 58, 74, 0.95)' }}
      >
        <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          中国古代水钟模拟器 · 结合传统科技文化与现代物理计算
        </p>
        <p className="text-xs mt-2" style={{ color: 'rgba(212, 175, 55, 0.8)' }}>
          托里拆利定律 · 龙格-库塔数值积分 · 最小二乘法曲线拟合
        </p>
      </footer>
    </div>
  );
}
