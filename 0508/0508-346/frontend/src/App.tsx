import React, { useState, useEffect } from 'react';
import { Task, Tugboat, Vessel, Berth, TugboatTimeline, BerthTimeline, TaskConflict, HandoverSummary, TaskPhase, GroupMode, ScheduleVersion } from './types';
import { apiService } from './services/api';
import { getPhaseColor, getPhaseLabel, getStatusColor, formatDateTime } from './utils/time';
import UniversalTimeline from './components/UniversalTimeline';
import TaskEditor from './components/TaskEditor';
import ConflictPanel from './components/ConflictPanel';
import HandoverPanel from './components/HandoverPanel';
import VersionCompareView from './components/VersionCompareView';

const App: React.FC = () => {
  const [tugboats, setTugboats] = useState<Tugboat[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [tugboatTimelines, setTugboatTimelines] = useState<TugboatTimeline[]>([]);
  const [berthTimelines, setBerthTimelines] = useState<BerthTimeline[]>([]);
  const [conflicts, setConflicts] = useState<TaskConflict[]>([]);
  const [affectedTaskIds, setAffectedTaskIds] = useState<string[]>([]);
  const [versions, setVersions] = useState<ScheduleVersion[]>([]);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const [handoverSummary, setHandoverSummary] = useState<HandoverSummary | null>(null);
  const [zoomLevel, setZoomLevel] = useState(5);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState<GroupMode>('tugboat');
  const [loading, setLoading] = useState(true);

  const vesselMap = new Map(vessels.map(v => [v.id, v.name]));

  useEffect(() => {
    loadData();
  }, [groupMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tugboatsData, vesselsData, berthsData, timelineData, berthTimelineData, conflictsData, versionsData] = await Promise.all([
        apiService.getTugboats(),
        apiService.getVessels(),
        apiService.getBerths(),
        apiService.getTimeline(),
        apiService.getBerthTimeline(),
        apiService.getConflicts(),
        apiService.getVersions()
      ]);
      
      setTugboats(tugboatsData);
      setVessels(vesselsData);
      setBerths(berthsData);
      setTugboatTimelines(timelineData);
      setBerthTimelines(berthTimelineData);
      setConflicts(conflictsData);
      setVersions(versionsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskEditor(true);
  };

  const handleTaskDrag = async (taskId: string, newStartTime: Date) => {
    try {
      const allTasks = [...tugboatTimelines.flatMap(t => t.tasks)];
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;

      const duration = new Date(task.endTime).getTime() - new Date(task.startTime).getTime();
      const newEndTime = new Date(newStartTime.getTime() + duration);

      const result = await apiService.updateTask(taskId, {
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString()
      });

      updateTimelines(result.tasks);
      setConflicts(result.conflicts);
      setAffectedTaskIds(result.affectedTaskIds);

      setTimeout(() => setAffectedTaskIds([]), 3000);
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  const handleTaskSave = async (task: Task, updates: Partial<Task>) => {
    try {
      const result = await apiService.updateTask(task.id, updates);
      updateTimelines(result.tasks);
      setConflicts(result.conflicts);
      setAffectedTaskIds(result.affectedTaskIds);
      
      setTimeout(() => setAffectedTaskIds([]), 3000);
    } catch (error) {
      console.error('保存任务失败:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      const result = await apiService.deleteTask(taskId);
      updateTimelines(result.tasks);
      setConflicts(result.conflicts);
      setAffectedTaskIds(result.affectedTaskIds);
      
      setTimeout(() => setAffectedTaskIds([]), 3000);
    } catch (error) {
      console.error('删除任务失败:', error);
    }
  };

  const updateTimelines = (tasks: Task[]) => {
    const newTugboatTimelines = tugboats.map(tugboat => ({
      tugboatId: tugboat.id,
      tugboatName: tugboat.name,
      tasks: tasks
        .filter(t => t.tugboatId === tugboat.id)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    }));
    setTugboatTimelines(newTugboatTimelines);

    const newBerthTimelines = berths.map(berth => ({
      berthId: berth.id,
      berthName: berth.name,
      berthCode: berth.code,
      tasks: tasks
        .filter(t => t.berthId === berth.id)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    })).filter(t => t.tasks.length > 0);
    setBerthTimelines(newBerthTimelines);
  };

  const generateHandover = async () => {
    try {
      const summary = await apiService.generateHandover('白班', '调度员');
      setHandoverSummary(summary);
      setShowHandover(true);
    } catch (error) {
      console.error('生成交接班摘要失败:', error);
    }
  };

  const saveCurrentVersion = async () => {
    const name = prompt('请输入版本名称:', `排法版本 ${versions.length + 1}`);
    if (!name) return;
    
    try {
      const version = await apiService.saveVersion(name, '调度员');
      setVersions([version, ...versions]);
      alert(`版本「${version.name}」已保存！`);
    } catch (error) {
      console.error('保存版本失败:', error);
    }
  };

  const phases = [
    { phase: TaskPhase.DEPART, label: '出发' },
    { phase: TaskPhase.APPROACH, label: '接近' },
    { phase: TaskPhase.BERTH, label: '靠泊' },
    { phase: TaskPhase.UNBERTH, label: '离泊' },
    { phase: TaskPhase.RETURN, label: '返航' },
  ];

  const activeItems = groupMode === 'tugboat' ? tugboats : berths;

  if (loading) {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#94a3b8'
        }}>
          正在加载港区调度对照盘...
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>⛵ 港区调度对照盘</h1>
        <div className="header-actions">
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${groupMode === 'tugboat' ? 'active' : ''}`}
              onClick={() => { setGroupMode('tugboat'); setSelectedItemId(null); }}
            >
              🚢 按拖轮
            </button>
            <button 
              className={`mode-btn ${groupMode === 'berth' ? 'active' : ''}`}
              onClick={() => { setGroupMode('berth'); setSelectedItemId(null); }}
            >
              ⚓ 按泊位
            </button>
          </div>
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => setZoomLevel(z => Math.max(1, z - 1))}>−</button>
            <span className="zoom-level">{zoomLevel * 10}%</span>
            <button className="zoom-btn" onClick={() => setZoomLevel(z => Math.min(10, z + 1))}>+</button>
          </div>
          <button className="btn btn-secondary" onClick={saveCurrentVersion}>💾 保存版本</button>
          <button className="btn btn-secondary" onClick={() => setShowVersionCompare(true)}>📊 版本对比</button>
          <button className="btn btn-secondary" onClick={loadData}>🔄 刷新</button>
          <button className="btn btn-secondary" onClick={generateHandover}>📋 交接班</button>
          <button className="btn btn-primary">➕ 新建任务</button>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>任务阶段图例</h3>
            <div className="legend">
              {phases.map(({ phase, label }) => (
                <div key={phase} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: getPhaseColor(phase) }} />
                  <span>{getPhaseLabel(phase)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="sidebar-section" style={{ flex: 1, overflowY: 'auto' }}>
            <h3>{groupMode === 'tugboat' ? '拖轮列表' : '泊位列表'}</h3>
            <div className={groupMode === 'tugboat' ? 'tugboat-list' : 'berth-list'}>
              {activeItems.map(item => (
                <div 
                  key={item.id} 
                  className={groupMode === 'tugboat' ? 'tugboat-item' : 'berth-item'}
                  style={{ 
                    borderColor: selectedItemId === item.id ? '#3b82f6' : 'transparent',
                    backgroundColor: selectedItemId === item.id ? '#1e3a5f' : undefined
                  }}
                  onClick={() => setSelectedItemId(
                    selectedItemId === item.id ? null : item.id
                  )}
                >
                  <div className={groupMode === 'tugboat' ? 'tugboat-name' : 'berth-name'}>
                    {groupMode === 'tugboat' ? (item as Tugboat).name : (item as Berth).name}
                  </div>
                  {groupMode === 'tugboat' ? (
                    <div className="tugboat-status">
                      <span 
                        className="status-dot" 
                        style={{ backgroundColor: getStatusColor((item as Tugboat).status) }} 
                      />
                      {(item as Tugboat).status === 'idle' ? '空闲' : 
                       (item as Tugboat).status === 'busy' ? '作业中' : '维护中'}
                      <span style={{ marginLeft: 'auto', color: '#64748b' }}>
                        {(item as Tugboat).power}马力
                      </span>
                    </div>
                  ) : (
                    <div className="berth-code">
                      {(item as Berth).code} · 最大 {(item as Berth).maxLength}m
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>统计信息</h3>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '2' }}>
              <div>当前模式: <strong style={{ color: '#e2e8f0' }}>{groupMode === 'tugboat' ? '拖轮视图' : '泊位视图'}</strong></div>
              <div>任务总数: <strong style={{ color: '#e2e8f0' }}>
                {groupMode === 'tugboat'
                  ? tugboatTimelines.reduce((sum, t) => sum + t.tasks.length, 0)
                  : berthTimelines.reduce((sum, t) => sum + t.tasks.length, 0)
                }
              </strong></div>
              <div>版本数: <strong style={{ color: '#3b82f6' }}>{versions.length}</strong></div>
              <div>冲突数: <strong style={{ color: '#ef4444' }}>{conflicts.length}</strong></div>
            </div>
          </div>
        </aside>

        <UniversalTimeline
          mode={groupMode}
          tugboatTimelines={tugboatTimelines}
          berthTimelines={berthTimelines}
          conflicts={conflicts}
          affectedTaskIds={affectedTaskIds}
          vessels={vesselMap}
          onTaskClick={handleTaskClick}
          onTaskDrag={groupMode === 'tugboat' ? handleTaskDrag : undefined}
          zoomLevel={zoomLevel}
          selectedItemId={selectedItemId}
        />
      </div>

      {conflicts.length > 0 && (
        <ConflictPanel 
          conflicts={conflicts} 
          onClose={() => {}} 
        />
      )}

      {showHandover && (
        <HandoverPanel 
          summary={handoverSummary} 
          onClose={() => setShowHandover(false)} 
        />
      )}

      {showVersionCompare && (
        <VersionCompareView
          versions={versions}
          tugboats={tugboats}
          vessels={vesselMap}
          onClose={() => setShowVersionCompare(false)}
        />
      )}

      {showTaskEditor && selectedTask && (
        <TaskEditor
          task={selectedTask}
          tugboats={tugboats}
          vessels={vessels}
          berths={berths}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
          onClose={() => {
            setShowTaskEditor(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
