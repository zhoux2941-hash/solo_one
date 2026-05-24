import { Task, TaskConflict, ConflictLevel, ScheduleResult, TaskPhase, TaskType } from '../types';

export class Scheduler {
  private tasks: Map<string, Task> = new Map();

  constructor(initialTasks: Task[] = []) {
    initialTasks.forEach(task => this.tasks.set(task.id, task));
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getTasksByTugboat(tugboatId: string): Task[] {
    return this.getAllTasks()
      .filter(t => t.tugboatId === tugboatId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  getTasksByVessel(vesselId: string): Task[] {
    return this.getAllTasks()
      .filter(t => t.vesselId === vesselId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  addTask(task: Task): ScheduleResult {
    this.tasks.set(task.id, task);
    return this.rescheduleFromTask(task.id);
  }

  updateTask(taskId: string, updates: Partial<Task>): ScheduleResult {
    const task = this.tasks.get(taskId);
    if (!task) {
      return { tasks: this.getAllTasks(), conflicts: [], affectedTaskIds: [] };
    }

    const updatedTask = { ...task, ...updates } as Task;
    this.tasks.set(taskId, updatedTask);

    return this.rescheduleFromTask(taskId);
  }

  deleteTask(taskId: string): ScheduleResult {
    const task = this.tasks.get(taskId);
    if (!task) {
      return { tasks: this.getAllTasks(), conflicts: [], affectedTaskIds: [] };
    }

    const tugboatId = task.tugboatId;
    this.tasks.delete(taskId);

    const tugboatTasks = this.getTasksByTugboat(tugboatId);
    const affectedIds = this.adjustTaskSequence(tugboatTasks, 0);
    const conflicts = this.detectConflicts();

    return {
      tasks: this.getAllTasks(),
      conflicts,
      affectedTaskIds: affectedIds
    };
  }

  private rescheduleFromTask(taskId: string): ScheduleResult {
    const task = this.tasks.get(taskId);
    if (!task) {
      return { tasks: this.getAllTasks(), conflicts: [], affectedTaskIds: [] };
    }

    const tugboatTasks = this.getTasksByTugboat(task.tugboatId);
    const triggerIndex = tugboatTasks.findIndex(t => t.id === taskId);
    const affectedIds = this.adjustTaskSequence(tugboatTasks, triggerIndex);
    const conflicts = this.detectConflicts();

    return {
      tasks: this.getAllTasks(),
      conflicts,
      affectedTaskIds: affectedIds
    };
  }

  private adjustTaskSequence(tugboatTasks: Task[], startIndex: number = 0): string[] {
    if (tugboatTasks.length <= 1) return [];

    const affectedIds: string[] = [];
    let hasChanges = true;
    let iterations = 0;
    const maxIterations = tugboatTasks.length * 2;

    while (hasChanges && iterations < maxIterations) {
      hasChanges = false;
      iterations++;

      for (let i = Math.max(1, startIndex); i < tugboatTasks.length; i++) {
        const prevTask = this.tasks.get(tugboatTasks[i - 1].id)!;
        const currTask = this.tasks.get(tugboatTasks[i].id)!;

        const gap = currTask.startTime.getTime() - prevTask.endTime.getTime();
        
        if (gap < 0) {
          const shiftMs = -gap;
          const newStartTime = new Date(currTask.startTime.getTime() + shiftMs);
          const newEndTime = new Date(currTask.endTime.getTime() + shiftMs);

          this.tasks.set(currTask.id, {
            ...currTask,
            startTime: newStartTime,
            endTime: newEndTime
          });

          if (!affectedIds.includes(currTask.id)) {
            affectedIds.push(currTask.id);
          }
          
          hasChanges = true;
        }
      }
    }

    return affectedIds;
  }

  detectConflicts(): TaskConflict[] {
    const conflicts: TaskConflict[] = [];
    const tasks = this.getAllTasks();

    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const conflict = this.checkTaskConflict(tasks[i], tasks[j]);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }

  private checkTaskConflict(task1: Task, task2: Task): TaskConflict | null {
    const isOverlapping = this.isTimeOverlapping(task1, task2);

    if (task1.tugboatId === task2.tugboatId && isOverlapping) {
      return {
        taskId: task1.id,
        conflictTaskId: task2.id,
        level: ConflictLevel.ERROR,
        message: `拖轮时间冲突: 同一拖轮不能同时执行两项任务`,
        type: 'overlap'
      };
    }

    if (task1.berthId === task2.berthId && 
        task1.type === task2.type &&
        isOverlapping) {
      return {
        taskId: task1.id,
        conflictTaskId: task2.id,
        level: ConflictLevel.WARNING,
        message: `泊位冲突: 同一泊位可能存在冲突`,
        type: 'resource'
      };
    }

    return null;
  }

  private isTimeOverlapping(task1: Task, task2: Task): boolean {
    return task1.startTime < task2.endTime && task2.startTime < task1.endTime;
  }

  reorderTasks(tugboatId: string, newTaskOrder: string[]): ScheduleResult {
    const tugboatTasks = this.getTasksByTugboat(tugboatId);
    const taskMap = new Map(tugboatTasks.map(t => [t.id, t]));

    let currentTime = new Date(Math.min(...tugboatTasks.map(t => t.startTime.getTime())));

    for (const taskId of newTaskOrder) {
      const task = taskMap.get(taskId);
      if (task) {
        const duration = task.estimatedDuration;
        const newStartTime = new Date(currentTime);
        const newEndTime = new Date(currentTime.getTime() + duration * 60000);

        this.tasks.set(taskId, {
          ...task,
          startTime: newStartTime,
          endTime: newEndTime
        });

        currentTime = newEndTime;
      }
    }

    const conflicts = this.detectConflicts();
    return {
      tasks: this.getAllTasks(),
      conflicts,
      affectedTaskIds: newTaskOrder
    };
  }
}
