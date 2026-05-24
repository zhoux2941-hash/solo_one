import { TaskRepository } from '../repositories/TaskRepository.js';
import { CorrectionService } from '../services/CorrectionService.js';
import { db } from '../db/init.js';

export class CorrectionWorker {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private processingTaskId: string | null = null;

  constructor(private pollInterval: number = 5000) {}

  private resetStuckTasks(): void {
    try {
      const stmt = db.prepare(`
        UPDATE correction_task 
        SET status = 'pending', progress = 0 
        WHERE status = 'processing'
      `);
      const result = stmt.run();
      if (result.changes && result.changes > 0) {
        console.log(`[CorrectionWorker] 重置了 ${result.changes} 个卡住的处理中任务`);
      }
    } catch (error) {
      console.error('[CorrectionWorker] 重置卡住任务失败:', error);
    }
  }

  start(): void {
    if (this.isRunning) return;
    
    this.resetStuckTasks();
    this.isRunning = true;
    console.log('[CorrectionWorker] 启动校正任务处理Worker');
    
    this.processNextTask();
    this.intervalId = setInterval(() => this.processNextTask(), this.pollInterval);
  }

  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[CorrectionWorker] Worker已停止');
  }

  private async processNextTask(): Promise<void> {
    if (this.processingTaskId) return;

    let taskId: string | null = null;
    try {
      const pendingTasks = TaskRepository.getPendingTasks();
      
      if (pendingTasks.length === 0) return;

      const task = pendingTasks[0];
      taskId = task.id;
      this.processingTaskId = taskId;
      
      console.log(`[CorrectionWorker] 开始处理任务: ${taskId}`);
      
      TaskRepository.updateStatus(taskId, 'processing', 10);
      
      await CorrectionService.processTask(taskId);
      
      console.log(`[CorrectionWorker] 任务处理完成: ${taskId}`);
    } catch (error) {
      console.error('[CorrectionWorker] 任务处理失败:', error);
      
      if (this.processingTaskId) {
        try {
          TaskRepository.updateStatus(this.processingTaskId, 'failed', 100);
        } catch (e) {
          console.error('[CorrectionWorker] 更新任务失败状态也失败:', e);
        }
      }
    } finally {
      this.processingTaskId = null;
      taskId = null;
    }
  }

  getStatus(): {
    isRunning: boolean;
    processingTaskId: string | null;
    pendingCount: number;
  } {
    const stats = TaskRepository.getStats();
    return {
      isRunning: this.isRunning,
      processingTaskId: this.processingTaskId,
      pendingCount: stats.pending
    };
  }
}

export const correctionWorker = new CorrectionWorker();
export default correctionWorker;
