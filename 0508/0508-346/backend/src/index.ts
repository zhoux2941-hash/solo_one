import express from 'express';
import cors from 'cors';
import { Scheduler } from './services/Scheduler';
import { HandoverGenerator } from './services/HandoverGenerator';
import { VersionManager } from './services/VersionManager';
import { mockTugboats, mockVessels, mockBerths, mockTasks } from './data/mockData';
import { Task, TugboatTimeline, BerthTimeline } from './types';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const scheduler = new Scheduler(mockTasks);
const handoverGenerator = new HandoverGenerator();
const versionManager = new VersionManager();

versionManager.saveVersion(mockTasks, '初始排法', '系统', '系统初始化的默认排法');

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '港区调度服务运行正常' });
});

app.get('/api/tugboats', (req, res) => {
  res.json(mockTugboats);
});

app.get('/api/vessels', (req, res) => {
  res.json(mockVessels);
});

app.get('/api/berths', (req, res) => {
  res.json(mockBerths);
});

app.get('/api/tasks', (req, res) => {
  const tasks = scheduler.getAllTasks();
  res.json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = scheduler.getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  res.json(task);
});

app.get('/api/timeline', (req, res) => {
  const tasks = scheduler.getAllTasks();
  const timelines: TugboatTimeline[] = mockTugboats.map(tugboat => ({
    tugboatId: tugboat.id,
    tugboatName: tugboat.name,
    tasks: tasks
      .filter(t => t.tugboatId === tugboat.id)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }));
  res.json(timelines);
});

app.post('/api/tasks', (req, res) => {
  const taskData = req.body;
  const newTask: Task = {
    id: uuidv4(),
    ...taskData,
    startTime: new Date(taskData.startTime),
    endTime: new Date(taskData.endTime)
  };
  
  const result = scheduler.addTask(newTask);
  res.json(result);
});

app.put('/api/tasks/:id', (req, res) => {
  const updates = req.body;
  
  if (updates.startTime) {
    updates.startTime = new Date(updates.startTime);
  }
  if (updates.endTime) {
    updates.endTime = new Date(updates.endTime);
  }
  
  const result = scheduler.updateTask(req.params.id, updates);
  res.json(result);
});

app.delete('/api/tasks/:id', (req, res) => {
  const result = scheduler.deleteTask(req.params.id);
  res.json(result);
});

app.post('/api/reorder/:tugboatId', (req, res) => {
  const { taskOrder } = req.body;
  const result = scheduler.reorderTasks(req.params.tugboatId, taskOrder);
  res.json(result);
});

app.get('/api/conflicts', (req, res) => {
  const conflicts = scheduler.detectConflicts();
  res.json(conflicts);
});

app.post('/api/handover', (req, res) => {
  const { shift = '白班', operator = '调度员' } = req.body;
  const tasks = scheduler.getAllTasks();
  const conflicts = scheduler.detectConflicts();
  const summary = handoverGenerator.generateSummary(
    tasks,
    mockTugboats,
    conflicts,
    shift,
    operator
  );
  res.json(summary);
});

app.get('/api/timeline/berth', (req, res) => {
  const tasks = scheduler.getAllTasks();
  const timelines: BerthTimeline[] = mockBerths.map(berth => ({
    berthId: berth.id,
    berthName: berth.name,
    berthCode: berth.code,
    tasks: tasks
      .filter(t => t.berthId === berth.id)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }));
  res.json(timelines.filter(t => t.tasks.length > 0));
});

app.get('/api/versions', (req, res) => {
  const versions = versionManager.getAllVersions();
  res.json(versions);
});

app.get('/api/versions/:id', (req, res) => {
  const version = versionManager.getVersion(req.params.id);
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }
  res.json(version);
});

app.post('/api/versions', (req, res) => {
  const { name, createdBy, description } = req.body;
  const tasks = scheduler.getAllTasks();
  const version = versionManager.saveVersion(tasks, name, createdBy, description);
  res.json(version);
});

app.delete('/api/versions/:id', (req, res) => {
  const success = versionManager.deleteVersion(req.params.id);
  if (!success) {
    return res.status(404).json({ error: '版本不存在' });
  }
  res.json({ success: true });
});

app.get('/api/versions/compare/:v1/:v2', (req, res) => {
  const result = versionManager.compareVersions(req.params.v1, req.params.v2);
  if (!result) {
    return res.status(404).json({ error: '版本不存在' });
  }
  res.json(result);
});

app.get('/api/versions/:versionId/tugboat/:tugboatId', (req, res) => {
  const tasks = versionManager.getTasksByTugboat(req.params.versionId, req.params.tugboatId);
  if (!tasks) {
    return res.status(404).json({ error: '版本或拖轮不存在' });
  }
  res.json(tasks);
});

app.listen(PORT, () => {
  console.log(`港区调度服务已启动: http://localhost:${PORT}`);
});
