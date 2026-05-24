import React, { useState, useEffect } from 'react';
import { ScheduleVersion, VersionCompareResult, TaskDiff, Tugboat, TugboatTimeline, Task } from '../types';
import { apiService } from '../services/api';
import { formatTime, getPhaseLabel } from '../utils/time';

interface VersionCompareViewProps {
  versions: ScheduleVersion[];
  tugboats: Tugboat[];
  vessels: Map<string, string>;
  onClose: () => void;
}

const VersionCompareView: React.FC<VersionCompareViewProps> = ({
  versions,
  tugboats,
  vessels,
  onClose
}) => {
  const [version1, setVersion1] = useState<string>('');
  const [version2, setVersion2] = useState<string>('');
  const [compareResult, setCompareResult] = useState<VersionCompareResult | null>(null);
  const [selectedTugboat, setSelectedTugboat] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const v1Timelines: TugboatTimeline[] = [];
  const v2Timelines: TugboatTimeline[] = [];

  useEffect(() => {
    if (version1 && version2 && version1 !== version2) {
      handleCompare();
    } else {
      setCompareResult(null);
    }
  }, [version1, version2]);

  const handleCompare = async () => {
    if (!version1 || !version2) return;
    
    try {
      setLoading(true);
      const result = await apiService.compareVersions(version1, version2);
      setCompareResult(result);
    } catch (error) {
      console.error('版本对比失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDiffValue = (field: string, value: any): string => {
    if (field === 'startTime' || field === 'endTime') {
      return formatTime(value);
    }
    if (field === 'type') {
      return value === 'berthing' ? '靠泊' : '离泊';
    }
    if (field === 'phase') {
      return getPhaseLabel(value);
    }
    if (field === 'vesselId') {
      return vessels.get(value) || value;
    }
    return String(value);
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      tugboatId: '拖轮',
      vesselId: '船舶',
      berthId: '泊位',
      type: '类型',
      phase: '阶段',
      startTime: '开始时间',
      endTime: '结束时间',
      estimatedDuration: '时长',
      priority: '优先级'
    };
    return labels[field] || field;
  };

  const getTugboatTasksFromResult = (result: VersionCompareResult, tugboatId: string, isVersion2: boolean): Task[] => {
    const tasks: Task[] = [];
    
    result.sameTasks
      .filter(t => t.tugboatId === tugboatId)
      .forEach(t => tasks.push(t));
    
    result.modifiedTasks
      .filter(t => t.tugboatId === tugboatId)
      .forEach(t => {
        const task = isVersion2 
          ? result.sameTasks.find(st => st.id === t.taskId) || null
          : null;
        if (task) tasks.push(task);
      });
    
    if (isVersion2) {
      result.addedTasks
        .filter(t => t.tugboatId === tugboatId)
        .forEach(t => tasks.push(t));
    } else {
      result.removedTasks
        .filter(t => t.tugboatId === tugboatId)
        .forEach(t => tasks.push(t));
    }
    
    return tasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  return (
    <div className="version-compare-overlay" onClick={onClose}>
      <div className="version-compare-panel" onClick={e => e.stopPropagation()}>
        <div className="task-editor-header">
          <h3>📊 排法版本对比</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="version-compare-body">
          <div className="version-selectors">
            <div className="form-group">
              <label>版本 A（旧）</label>
              <select value={version1} onChange={e => setVersion1(e.target.value)}>
                <option value="">请选择</option>
                {versions.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <span style={{ fontSize: '24px' }}>→</span>
            </div>
            <div className="form-group">
              <label>版本 B（新）</label>
              <select value={version2} onChange={e => setVersion2(e.target.value)}>
                <option value="">请选择</option>
                {versions.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading && <div className="loading">正在对比...</div>}

          {compareResult && (
            <>
              <div className="compare-summary">
                <div className="stat-card added">
                  <div className="stat-value">+{compareResult.addedTasks.length}</div>
                  <div className="stat-label">新增任务</div>
                </div>
                <div className="stat-card removed">
                  <div className="stat-value">−{compareResult.removedTasks.length}</div>
                  <div className="stat-label">移除任务</div>
                </div>
                <div className="stat-card modified">
                  <div className="stat-value">~{compareResult.modifiedTasks.length}</div>
                  <div className="stat-label">变更任务</div>
                </div>
              </div>

              <div className="form-group">
                <label>选择拖轮查看详细对比</label>
                <select value={selectedTugboat} onChange={e => setSelectedTugboat(e.target.value)}>
                  <option value="">全部拖轮</option>
                  {tugboats.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {compareResult.addedTasks.length > 0 && (
                <div className="diff-section">
                  <h4 style={{ color: '#10B981', marginBottom: '8px' }}>✅ 新增任务</h4>
                  {compareResult.addedTasks
                    .filter(t => !selectedTugboat || t.tugboatId === selectedTugboat)
                    .map(task => (
                      <div key={task.id} className="diff-item added">
                        <strong>{vessels.get(task.vesselId) || task.vesselId}</strong>
                        <span className="diff-tag">+ {getPhaseLabel(task.phase)}</span>
                        <span className="diff-time">{formatTime(task.startTime)}</span>
                      </div>
                    ))}
                </div>
              )}

              {compareResult.removedTasks.length > 0 && (
                <div className="diff-section">
                  <h4 style={{ color: '#EF4444', marginBottom: '8px' }}>❌ 移除任务</h4>
                  {compareResult.removedTasks
                    .filter(t => !selectedTugboat || t.tugboatId === selectedTugboat)
                    .map(task => (
                      <div key={task.id} className="diff-item removed">
                        <strong>{vessels.get(task.vesselId) || task.vesselId}</strong>
                        <span className="diff-tag">− {getPhaseLabel(task.phase)}</span>
                        <span className="diff-time">{formatTime(task.startTime)}</span>
                      </div>
                    ))}
                </div>
              )}

              {compareResult.modifiedTasks.length > 0 && (
                <div className="diff-section">
                  <h4 style={{ color: '#F59E0B', marginBottom: '8px' }}>⚠️ 变更任务</h4>
                  {Array.from(new Set(compareResult.modifiedTasks.map(t => t.taskId)))
                    .map(taskId => {
                      const taskDiffs = compareResult.modifiedTasks.filter(t => t.taskId === taskId);
                      const sampleDiff = taskDiffs[0];
                      if (selectedTugboat && sampleDiff.tugboatId !== selectedTugboat) return null;
                      
                      return (
                        <div key={taskId} className="diff-item modified">
                          <strong>{vessels.get(sampleDiff.vesselId) || sampleDiff.vesselId}</strong>
                          <div className="diff-details">
                            {taskDiffs.map((diff, i) => (
                              <div key={i} className="diff-detail">
                                <span className="diff-field">{getFieldLabel(diff.field || '')}:</span>
                                <span className="diff-old">{formatDiffValue(diff.field || '', diff.oldValue)}</span>
                                <span className="diff-arrow">→</span>
                                <span className="diff-new">{formatDiffValue(diff.field || '', diff.newValue)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {compareResult.addedTasks.length === 0 && 
               compareResult.removedTasks.length === 0 && 
               compareResult.modifiedTasks.length === 0 && (
                <div className="empty-state">两个版本完全相同</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionCompareView;
