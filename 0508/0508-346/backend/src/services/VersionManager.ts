import { Task, ScheduleVersion, VersionCompareResult, TaskDiff } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class VersionManager {
  private versions: Map<string, ScheduleVersion> = new Map();

  saveVersion(tasks: Task[], name: string, createdBy: string, description?: string): ScheduleVersion {
    const version: ScheduleVersion = {
      id: uuidv4(),
      name,
      createdAt: new Date(),
      createdBy,
      description,
      tasks: JSON.parse(JSON.stringify(tasks))
    };
    this.versions.set(version.id, version);
    return version;
  }

  getVersion(id: string): ScheduleVersion | undefined {
    return this.versions.get(id);
  }

  getAllVersions(): ScheduleVersion[] {
    return Array.from(this.versions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  deleteVersion(id: string): boolean {
    return this.versions.delete(id);
  }

  compareVersions(version1Id: string, version2Id: string): VersionCompareResult | null {
    const v1 = this.versions.get(version1Id);
    const v2 = this.versions.get(version2Id);
    if (!v1 || !v2) return null;

    const v1TaskMap = new Map(v1.tasks.map(t => [t.id, t]));
    const v2TaskMap = new Map(v2.tasks.map(t => [t.id, t]));

    const addedTasks: Task[] = [];
    const removedTasks: Task[] = [];
    const modifiedTasks: TaskDiff[] = [];
    const sameTasks: Task[] = [];

    for (const task of v2.tasks) {
      if (!v1TaskMap.has(task.id)) addedTasks.push(task);
    }
    for (const task of v1.tasks) {
      if (!v2TaskMap.has(task.id)) removedTasks.push(task);
    }
    for (const [taskId, task1] of v1TaskMap) {
      const task2 = v2TaskMap.get(taskId);
      if (!task2) continue;
      const diffs = this.compareTask(task1, task2);
      if (diffs.length > 0) {
        modifiedTasks.push(...diffs);
      } else {
        sameTasks.push(task2);
      }
    }

    return {
      version1Id,
      version2Id,
      version1Name: v1.name,
      version2Name: v2.name,
      addedTasks,
      removedTasks,
      modifiedTasks,
      sameTasks
    };
  }

  private compareTask(task1: Task, task2: Task): TaskDiff[] {
    const diffs: TaskDiff[] = [];
    const fieldsToCompare: (keyof Task)[] = [
      'tugboatId', 'vesselId', 'berthId', 'type', 'phase',
      'startTime', 'endTime', 'estimatedDuration', 'priority'
    ];

    for (const field of fieldsToCompare) {
      const val1 = task1[field];
      const val2 = task2[field];
      let isDifferent = false;
      if (field === 'startTime' || field === 'endTime') {
        isDifferent = new Date(val1 as Date).getTime() !== new Date(val2 as Date).getTime();
      } else {
        isDifferent = val1 !== val2;
      }
      if (isDifferent) {
        diffs.push({
          taskId: task1.id,
          type: 'modified',
          field,
          oldValue: val1,
          newValue: val2,
          vesselId: task1.vesselId,
          tugboatId: task1.tugboatId
        });
      }
    }
    return diffs;
  }

  getTasksByTugboat(versionId: string, tugboatId: string): Task[] | null {
    const version = this.versions.get(versionId);
    if (!version) return null;
    return version.tasks
      .filter(t => t.tugboatId === tugboatId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
}