import React, { useMemo } from 'react';
import { Droplets, Clock, Gauge, Timer, Layers, TrendingUp, Activity, Zap } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { COLORS } from '../utils/constants';
import { formatTime } from '../utils/fitting';
import { calculateFlowRateStability, generateTheoreticalCurve } from '../utils/physics';

interface DataDisplayProps {
  className?: string;
}

export const DataDisplay: React.FC<DataDisplayProps> = ({ className = '' }) => {
  const {
    currentWaterHeight,
    currentTime,
    totalDrainTime,
    params,
    theoreticalData,
    multiLevelState,
  } = useSimulationStore();

  const currentDataPoint = theoreticalData.find(
    (d) => d.time >= currentTime
  ) || theoreticalData[theoreticalData.length - 1];

  const velocity = currentDataPoint?.velocity || 0;
  const flowRate = currentDataPoint?.flowRate || 0;
  const remainingTime = Math.max(0, totalDrainTime - currentTime);
  const constantPressureHead = currentDataPoint?.constantPressureHead;

  const stabilityComparison = useMemo(() => {
    if (!params.useMultiLevel) return null;

    const singleLevelParams = { ...params, useMultiLevel: false };
    const singleLevelCurve = generateTheoreticalCurve(singleLevelParams);
    const multiLevelCurve = generateTheoreticalCurve(params);

    return calculateFlowRateStability(singleLevelCurve, multiLevelCurve);
  }, [params.useMultiLevel, params]);

  const baseStats = [
    {
      icon: <Droplets size={24} style={{ color: COLORS.water }} />,
      label: '当前水位',
      value: `${currentWaterHeight.toFixed(2)} cm`,
      bgColor: 'rgba(74, 144, 164, 0.1)',
    },
    {
      icon: <Gauge size={24} style={{ color: COLORS.secondary }} />,
      label: '瞬时流速',
      value: `${velocity.toFixed(4)} m/s`,
      bgColor: 'rgba(193, 120, 23, 0.1)',
    },
    {
      icon: <Timer size={24} style={{ color: COLORS.gold }} />,
      label: '瞬时流量',
      value: `${flowRate.toFixed(4)} cm³/s`,
      bgColor: 'rgba(212, 175, 55, 0.1)',
    },
    {
      icon: <Clock size={24} style={{ color: COLORS.primary }} />,
      label: '已过时间',
      value: formatTime(currentTime),
      bgColor: 'rgba(26, 58, 74, 0.1)',
    },
    {
      icon: <Clock size={24} style={{ color: COLORS.success }} />,
      label: '剩余时间',
      value: formatTime(remainingTime),
      bgColor: 'rgba(61, 122, 61, 0.1)',
    },
    {
      icon: <Timer size={24} style={{ color: '#8b4513' }} />,
      label: '总流尽时间',
      value: formatTime(totalDrainTime),
      bgColor: 'rgba(139, 69, 19, 0.1)',
    },
  ];

  const multiLevelStats = params.useMultiLevel && multiLevelState ? [
    {
      icon: <Layers size={24} style={{ color: COLORS.compensationPot1 }} />,
      label: '补偿壶数量',
      value: `${multiLevelState.pots.length} 级`,
      bgColor: 'rgba(139, 69, 19, 0.1)',
    },
    {
      icon: <Activity size={24} style={{ color: COLORS.compensationPot2 }} />,
      label: '恒压头高度',
      value: constantPressureHead !== undefined ? `${constantPressureHead.toFixed(2)} cm` : '计算中...',
      bgColor: 'rgba(74, 144, 164, 0.1)',
    },
    ...(stabilityComparison ? [
      {
        icon: <TrendingUp size={24} style={{ color: COLORS.success }} />,
        label: '稳定性提升',
        value: `${stabilityComparison.improvementPercent.toFixed(1)}%`,
        bgColor: 'rgba(61, 122, 61, 0.1)',
      },
      {
        icon: <Zap size={24} style={{ color: COLORS.gold }} />,
        label: '流量变异系数',
        value: `${(stabilityComparison.multiLevelCV * 100).toFixed(2)}%`,
        bgColor: 'rgba(212, 175, 55, 0.1)',
      },
    ] : []),
  ] : [];

  const stats = [...baseStats, ...multiLevelStats];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg"
          style={{
            backgroundColor: stat.bgColor,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            {stat.icon}
            <span
              className="text-sm font-medium"
              style={{ color: COLORS.textLight }}
            >
              {stat.label}
            </span>
          </div>
          <p
            className="text-xl font-bold"
            style={{ color: COLORS.text, fontFamily: 'serif' }}
          >
            {stat.value}
          </p>
        </div>
      ))}

      <div
        className="col-span-2 md:col-span-3 p-4 rounded-xl border-2"
        style={{
          backgroundColor: 'rgba(245, 240, 230, 0.5)',
          borderColor: COLORS.gold,
        }}
      >
        <h4
          className="text-sm font-bold mb-2"
          style={{ color: COLORS.secondary }}
        >
          💧 托里拆利定律公式
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span style={{ color: COLORS.textLight }}>瞬时流速：</span>
            <span style={{ color: COLORS.primary, fontFamily: 'serif' }}>
              v = √(2gh) = {velocity.toFixed(4)} m/s
            </span>
          </div>
          <div>
            <span style={{ color: COLORS.textLight }}>瞬时流量：</span>
            <span style={{ color: COLORS.primary, fontFamily: 'serif' }}>
              Q = v × A孔 = {flowRate.toFixed(4)} cm³/s
            </span>
          </div>
          <div>
            <span style={{ color: COLORS.textLight }}>孔径：</span>
            <span style={{ color: COLORS.primary, fontFamily: 'serif' }}>
              {params.apertureDiameter} mm
            </span>
          </div>
        </div>
      </div>

      {params.useMultiLevel && stabilityComparison && (
        <div
          className="col-span-2 md:col-span-3 p-4 rounded-xl border-2"
          style={{
            backgroundColor: 'rgba(61, 122, 61, 0.08)',
            borderColor: COLORS.success,
          }}
        >
          <h4
            className="text-sm font-bold mb-3"
            style={{ color: COLORS.success }}
          >
            ⚖️ 多级漏刻恒压效果对比
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span style={{ color: COLORS.textLight }}>单级漏刻流量变异系数：</span>
                <span style={{ color: '#c0392b', fontFamily: 'serif', fontWeight: 'bold' }}>
                  {(stabilityComparison.singleLevelCV * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: COLORS.textLight }}>多级漏刻流量变异系数：</span>
                <span style={{ color: COLORS.success, fontFamily: 'serif', fontWeight: 'bold' }}>
                  {(stabilityComparison.multiLevelCV * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: COLORS.textLight }}>稳定性提升：</span>
                <span style={{ color: COLORS.primary, fontFamily: 'serif', fontWeight: 'bold' }}>
                  {stabilityComparison.improvementPercent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span style={{ color: COLORS.textLight }}>单级漏刻流量标准差：</span>
                <span style={{ color: '#c0392b', fontFamily: 'serif' }}>
                  {stabilityComparison.singleLevelStd.toFixed(4)} cm³/s
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: COLORS.textLight }}>多级漏刻流量标准差：</span>
                <span style={{ color: COLORS.success, fontFamily: 'serif' }}>
                  {stabilityComparison.multiLevelStd.toFixed(4)} cm³/s
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: COLORS.textLight }}>平均流量：</span>
                <span style={{ color: COLORS.primary, fontFamily: 'serif' }}>
                  {stabilityComparison.multiLevelMean.toFixed(4)} cm³/s
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: COLORS.textLight }}>
            💡 原理：多级漏刻通过补偿壶保持恒定水压，使流量稳定。
            变异系数（CV）越小表示流量越稳定，计时精度越高。
          </p>
        </div>
      )}
    </div>
  );
};

export default DataDisplay;
