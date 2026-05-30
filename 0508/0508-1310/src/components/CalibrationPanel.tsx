import React, { useState } from 'react';
import { Plus, Trash2, Target, Calculator, Sun } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { COLORS } from '../utils/constants';
import { formatTime, generateTimeScaleTable } from '../utils/fitting';

interface CalibrationPanelProps {
  className?: string;
}

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({ className = '' }) => {
  const {
    calibrationPoints,
    addCalibrationPoint,
    removeCalibrationPoint,
    fittingResult,
    theoreticalData,
    params,
  } = useSimulationStore();

  const [observedTime, setObservedTime] = useState('');
  const [observedWaterHeight, setObservedWaterHeight] = useState('');
  const [showTable, setShowTable] = useState(false);

  const handleAddPoint = () => {
    const time = parseFloat(observedTime);
    const height = parseFloat(observedWaterHeight);

    if (
      isNaN(time) ||
      isNaN(height) ||
      time <= 0 ||
      height <= 0 ||
      height > params.initialWaterHeight
    ) {
      return;
    }

    if (calibrationPoints.length >= 4) {
      return;
    }

    addCalibrationPoint({
      observedTime: time,
      observedWaterHeight: height,
    });

    setObservedTime('');
    setObservedWaterHeight('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPoint();
    }
  };

  const correctedTable = fittingResult
    ? generateTimeScaleTable(fittingResult.correctedTimeScale, 10)
    : [];

  return (
    <div
      className={`p-6 rounded-2xl border-2 ${className}`}
      style={{
        backgroundColor: 'rgba(245, 240, 230, 0.8)',
        borderColor: COLORS.border,
      }}
    >
      <h3
        className="text-xl font-bold mb-4 flex items-center gap-2"
        style={{ color: COLORS.primary, fontFamily: 'serif' }}
      >
        <Sun size={24} style={{ color: COLORS.gold }} />
        日晷校准（误差校正）
      </h3>

      <p
        className="text-sm mb-4 p-3 rounded-lg"
        style={{
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          color: COLORS.textLight,
        }}
      >
        模拟古人用日晷校准漏刻的过程。添加2-4个实际观测的「时刻-水位」校准点，
        系统将自动拟合修正系数，输出更准确的时间刻度。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            观测时刻（秒）
          </label>
          <input
            type="number"
            value={observedTime}
            onChange={(e) => setObservedTime(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="例如: 120"
            min="1"
            className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: COLORS.border,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
            观测水位（cm）
          </label>
          <input
            type="number"
            value={observedWaterHeight}
            onChange={(e) => setObservedWaterHeight(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`0 - ${params.initialWaterHeight}`}
            min="0"
            max={params.initialWaterHeight}
            step="0.1"
            className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: COLORS.border,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            }}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleAddPoint}
            disabled={calibrationPoints.length >= 4}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                calibrationPoints.length >= 4 ? COLORS.textLight : COLORS.secondary,
            }}
          >
            <Plus size={20} />
            添加校准点 ({calibrationPoints.length}/4)
          </button>
        </div>
      </div>

      {calibrationPoints.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-bold mb-2" style={{ color: COLORS.primary }}>
            <Target size={16} className="inline mr-2" />
            校准点列表
          </h4>
          <div className="space-y-2">
            {calibrationPoints.map((point, index) => (
              <div
                key={point.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  backgroundColor: 'rgba(26, 58, 74, 0.05)',
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="w-6 h-6 flex items-center justify-center rounded-full text-white text-sm font-bold"
                    style={{ backgroundColor: COLORS.gold }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <span style={{ color: COLORS.text }}>
                      时刻: <strong>{formatTime(point.observedTime)}</strong>
                    </span>
                    <span className="mx-3" style={{ color: COLORS.textLight }}>
                      |
                    </span>
                    <span style={{ color: COLORS.text }}>
                      水位: <strong>{point.observedWaterHeight.toFixed(1)} cm</strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeCalibrationPoint(point.id)}
                  className="p-2 rounded-lg transition-all hover:bg-red-100"
                  style={{ color: COLORS.error }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {calibrationPoints.length < 2 && (
        <div
          className="p-4 rounded-lg text-center"
          style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)' }}
        >
          <p style={{ color: COLORS.secondary }}>
            ⚠️ 请至少添加 <strong>2个</strong> 校准点以进行曲线拟合
          </p>
        </div>
      )}

      {fittingResult && (
        <div className="mt-4 space-y-4">
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'rgba(61, 122, 61, 0.1)',
              border: `1px solid ${COLORS.success}`,
            }}
          >
            <h4
              className="font-bold mb-2 flex items-center gap-2"
              style={{ color: COLORS.success }}
            >
              <Calculator size={18} />
              拟合结果
            </h4>
            <p className="text-sm mb-2" style={{ color: COLORS.text }}>
              <strong>修正公式：</strong> {fittingResult.correctionFormula}
            </p>
            <p className="text-sm" style={{ color: COLORS.text }}>
              <strong>拟合优度 R²：</strong> {fittingResult.rSquared.toFixed(6)}
              <span className="ml-2 text-xs" style={{ color: COLORS.success }}>
                (越接近1表示拟合效果越好)
              </span>
            </p>
          </div>

          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full py-2 px-4 rounded-lg font-bold transition-all hover:scale-102"
            style={{
              backgroundColor: 'rgba(212, 175, 55, 0.2)',
              color: COLORS.primary,
              border: `1px solid ${COLORS.gold}`,
            }}
          >
            {showTable ? '隐藏' : '查看'}修正后时间刻度表
          </button>

          {showTable && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(26, 58, 74, 0.1)' }}>
                    <th className="px-3 py-2 text-left" style={{ color: COLORS.primary }}>
                      序号
                    </th>
                    <th className="px-3 py-2 text-left" style={{ color: COLORS.primary }}>
                      修正后时刻
                    </th>
                    <th className="px-3 py-2 text-left" style={{ color: COLORS.primary }}>
                      水位 (cm)
                    </th>
                    <th className="px-3 py-2 text-left" style={{ color: COLORS.primary }}>
                      流量 (cm³/s)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {correctedTable.map((row, index) => (
                    <tr
                      key={index}
                      className="border-t"
                      style={{ borderColor: COLORS.border }}
                    >
                      <td className="px-3 py-2" style={{ color: COLORS.text }}>
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 font-medium" style={{ color: COLORS.secondary }}>
                        {row.time}
                      </td>
                      <td className="px-3 py-2" style={{ color: COLORS.text }}>
                        {row.waterHeight}
                      </td>
                      <td className="px-3 py-2" style={{ color: COLORS.text }}>
                        {row.flowRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalibrationPanel;
