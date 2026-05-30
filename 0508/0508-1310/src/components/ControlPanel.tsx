import React, { useState, useMemo } from 'react';
import { Play, Pause, RotateCcw, Cylinder, Cone, Box, Droplets, Ruler, Layers, ToggleLeft, ToggleRight } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { ContainerShape } from '../types';
import { COLORS, COMPENSATION_POT_CONFIG } from '../utils/constants';
import { getAllStrategies } from '../strategies/ContainerStrategy';

const ICON_MAP: Record<string, React.ReactNode> = {
  cylinder: <Cylinder size={24} />,
  cone: <Cone size={24} />,
  box: <Box size={24} />,
};

interface ControlPanelProps {
  className?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ className = '' }) => {
  const {
    params,
    setParams,
    isRunning,
    isPaused,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    calculateTheoreticalCurve,
    toggleMultiLevel,
  } = useSimulationStore();

  const [localParams, setLocalParams] = useState(params);

  const handleShapeChange = (shape: ContainerShape) => {
    setLocalParams((prev) => ({ ...prev, containerShape: shape }));
    setParams({ containerShape: shape });
  };

  const handleApertureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalParams((prev) => ({ ...prev, apertureDiameter: value }));
    setParams({ apertureDiameter: value });
  };

  const handleWaterHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalParams((prev) => ({ ...prev, initialWaterHeight: value }));
    setParams({ initialWaterHeight: value });
  };

  const handleContainerSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalParams((prev) => ({ ...prev, containerSize: value }));
    setParams({ containerSize: value });
  };

  const handleMultiLevelToggle = () => {
    const newValue = !localParams.useMultiLevel;
    setLocalParams((prev) => ({ ...prev, useMultiLevel: newValue }));
    toggleMultiLevel(newValue);
  };

  const handlePotCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalParams((prev) => ({ ...prev, compensationPotCount: value }));
    setParams({ compensationPotCount: value });
  };

  const handleOverflowHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalParams((prev) => ({ ...prev, overflowHeight: value }));
    setParams({ overflowHeight: value });
  };

  const handleStartPause = () => {
    if (!isRunning) {
      calculateTheoreticalCurve();
      startSimulation();
    } else if (isPaused) {
      startSimulation();
    } else {
      pauseSimulation();
    }
  };

  const handleReset = () => {
    resetSimulation();
    setLocalParams(params);
  };

  const shapeOptions: { value: ContainerShape; icon: React.ReactNode; label: string }[] = useMemo(
    () =>
      getAllStrategies().map((s) => ({
        value: s.shape,
        icon: ICON_MAP[s.icon] || <Box size={24} />,
        label: s.label,
      })),
    []
  );

  return (
    <div
      className={`p-6 rounded-2xl border-2 ${className}`}
      style={{
        backgroundColor: 'rgba(245, 240, 230, 0.8)',
        borderColor: COLORS.border,
      }}
    >
      <h3
        className="text-xl font-bold mb-6 text-center"
        style={{ color: COLORS.primary, fontFamily: 'serif' }}
      >
        ⚙️ 参数设置
      </h3>

      <div className="mb-6">
        <label className="flex items-center gap-2 mb-3 font-medium" style={{ color: COLORS.text }}>
          <Box size={18} style={{ color: COLORS.secondary }} />
          容器形状
        </label>
        <div className="grid grid-cols-3 gap-3">
          {shapeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleShapeChange(option.value)}
              disabled={isRunning && !isPaused}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 ${
                localParams.containerShape === option.value
                  ? 'shadow-lg scale-105'
                  : 'hover:shadow-md hover:scale-102'
              } ${isRunning && !isPaused ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                backgroundColor:
                  localParams.containerShape === option.value
                    ? 'rgba(212, 175, 55, 0.2)'
                    : 'rgba(255, 255, 255, 0.6)',
                borderColor:
                  localParams.containerShape === option.value
                    ? COLORS.gold
                    : COLORS.border,
                color: localParams.containerShape === option.value ? COLORS.primary : COLORS.text,
              }}
            >
              <span
                style={{
                  color:
                    localParams.containerShape === option.value
                      ? COLORS.gold
                      : COLORS.secondary,
                }}
              >
                {option.icon}
              </span>
              <span className="text-sm mt-1 font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 mb-3 font-medium" style={{ color: COLORS.text }}>
          <Droplets size={18} style={{ color: COLORS.water }} />
          孔径大小: {localParams.apertureDiameter} mm
        </label>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={localParams.apertureDiameter}
          onChange={handleApertureChange}
          disabled={isRunning && !isPaused}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${COLORS.water} 0%, ${COLORS.water} ${((localParams.apertureDiameter - 1) / 9) * 100}%, #d1d5db ${((localParams.apertureDiameter - 1) / 9) * 100}%, #d1d5db 100%)`,
          }}
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: COLORS.textLight }}>
          <span>1mm</span>
          <span>5mm</span>
          <span>10mm</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 mb-3 font-medium" style={{ color: COLORS.text }}>
          <Ruler size={18} style={{ color: COLORS.secondary }} />
          初始水位高度: {localParams.initialWaterHeight} cm
        </label>
        <input
          type="range"
          min="10"
          max="50"
          step="1"
          value={localParams.initialWaterHeight}
          onChange={handleWaterHeightChange}
          disabled={isRunning && !isPaused}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${COLORS.water} 0%, ${COLORS.water} ${((localParams.initialWaterHeight - 10) / 40) * 100}%, #d1d5db ${((localParams.initialWaterHeight - 10) / 40) * 100}%, #d1d5db 100%)`,
          }}
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: COLORS.textLight }}>
          <span>10cm</span>
          <span>30cm</span>
          <span>50cm</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 mb-3 font-medium" style={{ color: COLORS.text }}>
          <Box size={18} style={{ color: COLORS.secondary }} />
          容器尺寸: {localParams.containerSize} cm
        </label>
        <input
          type="range"
          min="10"
          max="30"
          step="1"
          value={localParams.containerSize}
          onChange={handleContainerSizeChange}
          disabled={isRunning && !isPaused}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${COLORS.secondary} 0%, ${COLORS.secondary} ${((localParams.containerSize - 10) / 20) * 100}%, #d1d5db ${((localParams.containerSize - 10) / 20) * 100}%, #d1d5db 100%)`,
          }}
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: COLORS.textLight }}>
          <span>10cm</span>
          <span>20cm</span>
          <span>30cm</span>
        </div>
      </div>

      <div
        className="mb-6 p-4 rounded-xl border-2"
        style={{
          backgroundColor: localParams.useMultiLevel
            ? 'rgba(93, 173, 226, 0.1)'
            : 'rgba(245, 240, 230, 0.5)',
          borderColor: localParams.useMultiLevel ? COLORS.compensationPot1 : COLORS.border,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 font-medium" style={{ color: COLORS.text }}>
            <Layers size={20} style={{ color: COLORS.compensationPot1 }} />
            多级漏刻（补偿壶）
          </label>
          <button
            onClick={handleMultiLevelToggle}
            disabled={isRunning && !isPaused}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              isRunning && !isPaused ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
            style={{
              backgroundColor: localParams.useMultiLevel
                ? COLORS.compensationPot1
                : 'rgba(139, 115, 85, 0.2)',
              color: localParams.useMultiLevel ? 'white' : COLORS.text,
            }}
          >
            {localParams.useMultiLevel ? (
              <ToggleRight size={24} />
            ) : (
              <ToggleLeft size={24} />
            )}
            <span className="text-sm font-bold">
              {localParams.useMultiLevel ? '已启用' : '未启用'}
            </span>
          </button>
        </div>

        {localParams.useMultiLevel && (
          <div className="space-y-4">
            <p
              className="text-xs p-2 rounded-lg"
              style={{
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                color: COLORS.textLight,
              }}
            >
              💡 二级补偿壶通过多级溢流水位保持恒压，使流量更加稳定，提高计时精度
            </p>

            <div>
              <label
                className="flex items-center gap-2 mb-2 text-sm font-medium"
                style={{ color: COLORS.text }}
              >
                补偿壶数量: {localParams.compensationPotCount} 级
              </label>
              <input
                type="range"
                min="2"
                max={COMPENSATION_POT_CONFIG.maxPotCount}
                step="1"
                value={localParams.compensationPotCount}
                onChange={handlePotCountChange}
                disabled={isRunning && !isPaused}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${COLORS.compensationPot1} 0%, ${COLORS.compensationPot1} ${((localParams.compensationPotCount - 2) / (COMPENSATION_POT_CONFIG.maxPotCount - 2)) * 100}%, #d1d5db ${((localParams.compensationPotCount - 2) / (COMPENSATION_POT_CONFIG.maxPotCount - 2)) * 100}%, #d1d5db 100%)`,
                }}
              />
              <div
                className="flex justify-between text-xs mt-1"
                style={{ color: COLORS.textLight }}
              >
                <span>2级（日壶+月壶）</span>
                <span>3级（日壶+月壶+星壶）</span>
              </div>
            </div>

            <div>
              <label
                className="flex items-center gap-2 mb-2 text-sm font-medium"
                style={{ color: COLORS.text }}
              >
                溢流水位高度: {localParams.overflowHeight} cm
              </label>
              <input
                type="range"
                min="15"
                max={localParams.initialWaterHeight - 5}
                step="1"
                value={localParams.overflowHeight}
                onChange={handleOverflowHeightChange}
                disabled={isRunning && !isPaused}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${COLORS.compensationPot2} 0%, ${COLORS.compensationPot2} ${((localParams.overflowHeight - 15) / (localParams.initialWaterHeight - 20)) * 100}%, #d1d5db ${((localParams.overflowHeight - 15) / (localParams.initialWaterHeight - 20)) * 100}%, #d1d5db 100%)`,
                }}
              />
              <div
                className="flex justify-between text-xs mt-1"
                style={{ color: COLORS.textLight }}
              >
                <span>15cm</span>
                <span>{(localParams.initialWaterHeight - 5).toFixed(0)}cm</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleStartPause}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
          style={{
            backgroundColor: isRunning && !isPaused ? COLORS.secondary : COLORS.success,
          }}
        >
          {isRunning && !isPaused ? (
            <>
              <Pause size={20} />
              暂停
            </>
          ) : (
            <>
              <Play size={20} />
              {isPaused ? '继续' : '开始模拟'}
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
          style={{
            backgroundColor: 'rgba(139, 69, 19, 0.1)',
            color: COLORS.primary,
            border: `2px solid ${COLORS.border}`,
          }}
        >
          <RotateCcw size={20} />
          重置
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
