import React from 'react';
import { HandoverSummary } from '../types';
import { formatTime } from '../utils/time';

interface HandoverPanelProps {
  summary: HandoverSummary | null;
  onClose: () => void;
}

const HandoverPanel: React.FC<HandoverPanelProps> = ({ summary, onClose }) => {
  if (!summary) return null;

  return (
    <div className="handover-panel">
      <div className="conflict-panel-header">
        <h3>📋 交接班摘要</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="handover-content">
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
          生成时间: {formatTime(summary.generatedAt)}<br />
          班次: {summary.shift} | 调度员: {summary.operator}
        </div>
        
        <div className="handover-section">
          <h4>🚢 拖轮状态</h4>
          <ul>
            {summary.tugboatStatuses.map((ts, i) => (
              <li key={i}>
                <strong>{ts.tugboatName}</strong>: {ts.status}
                {ts.currentTask && ` - ${ts.currentTask}`}
              </li>
            ))}
          </ul>
        </div>

        {summary.ongoingTasks.length > 0 && (
          <div className="handover-section">
            <h4>⏳ 进行中任务</h4>
            <ul>
              {summary.ongoingTasks.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}

        {summary.pendingTasks.length > 0 && (
          <div className="handover-section">
            <h4>📌 待执行任务</h4>
            <ul>
              {summary.pendingTasks.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}

        <div className="handover-notes">
          💡 {summary.notes || '暂无特殊说明'}
        </div>
      </div>
    </div>
  );
};

export default HandoverPanel;
