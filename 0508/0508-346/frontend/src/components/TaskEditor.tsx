import React, { useState, useEffect } from 'react';
import { Task, Tugboat, Vessel, Berth, TaskPhase, TaskType } from '../types';
import { formatDateTime } from '../utils/time';

interface TaskEditorProps {
  task: Task | null;
  tugboats: Tugboat[];
  vessels: Vessel[];
  berths: Berth[];
  onSave: (task: Task, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
  isNew?: boolean;
}

const TaskEditor: React.FC<TaskEditorProps> = ({
  task,
  tugboats,
  vessels,
  berths,
  onSave,
  onDelete,
  onClose,
  isNew = false
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({});

  useEffect(() => {
    if (task) {
      setFormData({
        tugboatId: task.tugboatId,
        vesselId: task.vesselId,
        berthId: task.berthId,
        type: task.type,
        phase: task.phase,
        startTime: task.startTime,
        endTime: task.endTime,
        estimatedDuration: task.estimatedDuration,
        priority: task.priority,
        notes: task.notes
      });
    }
  }, [task]);

  const handleChange = (field: keyof Task, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (task) {
      onSave(task, formData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (task && window.confirm('确定要删除这个任务吗？')) {
      onDelete(task.id);
      onClose();
    }
  };

  if (!task) return null;

  return (
    <div className="task-editor-overlay" onClick={onClose}>
      <div className="task-editor" onClick={e => e.stopPropagation()}>
        <div className="task-editor-header">
          <h3>{isNew ? '新建任务' : '编辑任务'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="task-editor-body">
          <div className="form-group">
            <label>拖轮</label>
            <select 
              value={formData.tugboatId || ''} 
              onChange={e => handleChange('tugboatId', e.target.value)}
            >
              {tugboats.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>船舶</label>
              <select 
                value={formData.vesselId || ''} 
                onChange={e => handleChange('vesselId', e.target.value)}
              >
                {vessels.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>泊位</label>
              <select 
                value={formData.berthId || ''} 
                onChange={e => handleChange('berthId', e.target.value)}
              >
                {berths.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>任务类型</label>
              <select 
                value={formData.type || ''} 
                onChange={e => handleChange('type', e.target.value)}
              >
                <option value={TaskType.BERTHING}>靠泊</option>
                <option value={TaskType.UNBERTHING}>离泊</option>
              </select>
            </div>
            <div className="form-group">
              <label>阶段</label>
              <select 
                value={formData.phase || ''} 
                onChange={e => handleChange('phase', e.target.value)}
              >
                <option value={TaskPhase.DEPART}>出发</option>
                <option value={TaskPhase.APPROACH}>接近</option>
                <option value={TaskPhase.BERTH}>靠泊</option>
                <option value={TaskPhase.UNBERTH}>离泊</option>
                <option value={TaskPhase.RETURN}>返航</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>开始时间</label>
              <input 
                type="datetime-local"
                value={formData.startTime ? formatDateTimeForInput(formData.startTime) : ''}
                onChange={e => handleChange('startTime', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>结束时间</label>
              <input 
                type="datetime-local"
                value={formData.endTime ? formatDateTimeForInput(formData.endTime) : ''}
                onChange={e => handleChange('endTime', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>预计时长（分钟）</label>
              <input 
                type="number"
                value={formData.estimatedDuration || 0}
                onChange={e => handleChange('estimatedDuration', parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>优先级</label>
              <input 
                type="number"
                value={formData.priority || 1}
                onChange={e => handleChange('priority', parseInt(e.target.value))}
                min={1}
                max={5}
              />
            </div>
          </div>
          <div className="form-group">
            <label>备注</label>
            <textarea 
              rows={3}
              value={formData.notes || ''}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="添加任务备注..."
            />
          </div>
          {!isNew && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
              任务ID: {task.id}<br />
              创建时间: {formatDateTime(task.startTime)}
            </div>
          )}
        </div>
        <div className="task-editor-footer">
          {!isNew && (
            <button className="btn btn-danger" onClick={handleDelete}>删除</button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>保存</button>
        </div>
      </div>
    </div>
  );
};

function formatDateTimeForInput(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default TaskEditor;
