import React from 'react';
import { TaskConflict, ConflictLevel } from '../types';

interface ConflictPanelProps {
  conflicts: TaskConflict[];
  onClose: () => void;
}

const ConflictPanel: React.FC<ConflictPanelProps> = ({ conflicts, onClose }) => {
  if (conflicts.length === 0) return null;

  const errorCount = conflicts.filter(c => c.level === ConflictLevel.ERROR).length;
  const warningCount = conflicts.filter(c => c.level === ConflictLevel.WARNING).length;

  return (
    <div className="conflict-panel">
      <div className="conflict-panel-header">
        <h3>⚠️ 冲突提醒</h3>
        <span className="conflict-count">{errorCount + warningCount}</span>
      </div>
      <div className="conflict-list">
        {conflicts.map((conflict, index) => (
          <div 
            key={index} 
            className={`conflict-item ${conflict.level === ConflictLevel.ERROR ? 'error' : 'warning'}`}
          >
            <div className="conflict-message">
              {conflict.level === ConflictLevel.ERROR ? '🔴 ' : '🟡 '}
              {conflict.message}
            </div>
            <div className="conflict-type">
              类型: {conflict.type === 'overlap' ? '时间重叠' : 
                     conflict.type === 'sequence' ? '顺序冲突' : '资源冲突'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConflictPanel;
