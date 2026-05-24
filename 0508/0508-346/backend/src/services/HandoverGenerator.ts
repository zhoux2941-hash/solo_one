import { Task, Tugboat, HandoverSummary, TaskConflict, TugboatStatus, TaskPhase } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class HandoverGenerator {
  generateSummary(
    tasks: Task[],
    tugboats: Tugboat[],
    conflicts: TaskConflict[],
    shift: string,
    operator: string
  ): HandoverSummary {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const sortByTime = (a: Task, b: Task) => a.startTime.getTime() - b.startTime.getTime();
    
    const completedTasks = tasks.filter(t => t.endTime <= now).sort(sortByTime);
    const ongoingTasks = tasks.filter(t => t.startTime <= now && t.endTime > now).sort(sortByTime);
    const pendingTasks = tasks.filter(t => t.startTime > now && t.startTime <= oneHourLater).sort(sortByTime);

    const tugboatStatuses = tugboats.map(tugboat => {
      const currentTask = tasks.find(t => 
        t.tugboatId === tugboat.id && 
        t.startTime <= now && 
        t.endTime > now
      );

      return {
        tugboatId: tugboat.id,
        tugboatName: tugboat.name,
        status: this.getTugboatStatusText(tugboat.status),
        currentTask: currentTask ? this.getTaskDescription(currentTask) : undefined
      };
    });

    const notes = this.generateNotes(completedTasks, ongoingTasks, pendingTasks, conflicts);

    return {
      id: uuidv4(),
      generatedAt: now,
      shift,
      operator,
      completedTasks: completedTasks.map(t => this.getTaskDescription(t)),
      ongoingTasks: ongoingTasks.map(t => this.getTaskDescription(t)),
      pendingTasks: pendingTasks.map(t => this.getTaskDescription(t)),
      conflicts,
      notes,
      tugboatStatuses
    };
  }

  private getTugboatStatusText(status: TugboatStatus): string {
    switch (status) {
      case TugboatStatus.IDLE: return '空闲';
      case TugboatStatus.BUSY: return '作业中';
      case TugboatStatus.MAINTENANCE: return '维护中';
      default: return '未知';
    }
  }

  private getTaskDescription(task: Task): string {
    const phaseText = this.getPhaseText(task.phase);
    const typeText = task.type === 'berthing' ? '靠泊' : '离泊';
    return `${typeText}-${phaseText} (${task.vesselId})`;
  }

  private getPhaseText(phase: TaskPhase): string {
    switch (phase) {
      case TaskPhase.DEPART: return '出发';
      case TaskPhase.APPROACH: return '接近';
      case TaskPhase.BERTH: return '靠泊';
      case TaskPhase.UNBERTH: return '离泊';
      case TaskPhase.RETURN: return '返航';
      default: return '未知';
    }
  }

  private generateNotes(
    completedTasks: Task[],
    ongoingTasks: Task[],
    pendingTasks: Task[],
    conflicts: TaskConflict[]
  ): string {
    const notes: string[] = [];

    if (completedTasks.length > 0) {
      notes.push(`本班次已完成 ${completedTasks.length} 项任务`);
    }

    if (ongoingTasks.length > 0) {
      notes.push(`正在进行 ${ongoingTasks.length} 项任务，请持续关注`);
    }

    if (pendingTasks.length > 0) {
      notes.push(`未来1小时内有 ${pendingTasks.length} 项待执行任务`);
    }

    if (conflicts.length > 0) {
      const errorCount = conflicts.filter(c => c.level === 'error').length;
      const warningCount = conflicts.filter(c => c.level === 'warning').length;
      if (errorCount > 0) notes.push(`存在 ${errorCount} 个严重冲突需要处理`);
      if (warningCount > 0) notes.push(`存在 ${warningCount} 个警告提醒`);
    }

    return notes.join('；');
  }
}
