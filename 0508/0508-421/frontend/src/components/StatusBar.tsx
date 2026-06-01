import React from 'react';
import { usePlcStore } from '../store/plcStore';

export const StatusBar: React.FC = () => {
  const { simMode, bytecodeSize, selectedElementId, scanCycle, program } =
    usePlcStore();

  const getSelectedElementInfo = () => {
    if (!selectedElementId) return null;

    for (const rung of program.rungs) {
      const element = rung.elements.find((el) => el.id === selectedElementId);
      if (element) {
        return `${element.type} @ ${element.variable} (x:${element.x}, y:${element.y})`;
      }
    }
    return null;
  };

  const selectedElementInfo = getSelectedElementInfo();

  const getSimModeDisplay = () => {
    switch (simMode) {
      case 'running':
        return { text: '运行中', color: '#dc2626' };
      case 'paused':
        return { text: '已暂停', color: '#d97706' };
      case 'stopped':
      default:
        return { text: '已停止', color: '#16a34a' };
    }
  };

  const simModeDisplay = getSimModeDisplay();

  const statusBarStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '8px 16px',
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    fontSize: '13px',
    borderTop: '1px solid #374151',
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const labelStyle = {
    color: '#9ca3af',
  };

  const valueStyle = (color?: string) => ({
    fontWeight: 'bold',
    color: color || '#f3f4f6',
  });

  return (
    <div className="status-bar" style={statusBarStyle}>
      <div style={itemStyle}>
        <span style={labelStyle}>模式:</span>
        <span style={valueStyle(simModeDisplay.color)}>{simModeDisplay.text}</span>
      </div>

      <div style={itemStyle}>
        <span style={labelStyle}>字节码:</span>
        <span style={valueStyle()}>
          {bytecodeSize !== null ? `${bytecodeSize} 字节` : '未编译'}
        </span>
      </div>

      <div style={itemStyle}>
        <span style={labelStyle}>扫描周期:</span>
        <span style={valueStyle()}>{scanCycle}</span>
      </div>

      {selectedElementInfo && (
        <div style={itemStyle}>
          <span style={labelStyle}>选中:</span>
          <span style={valueStyle('#60a5fa')}>{selectedElementInfo}</span>
        </div>
      )}

      <div style={{ ...itemStyle, marginLeft: 'auto' }}>
        <span style={labelStyle}>梯级:</span>
        <span style={valueStyle()}>{program.rungs.length}</span>
      </div>
    </div>
  );
};
