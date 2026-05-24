import { Request, Response } from 'express';
import { ParserService } from '../services/ParserService.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import type { TaskStatus } from '../../shared/types.js';

export class TaskController {
  static async uploadTelemetry(req: Request, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        res.status(400).json({ error: '未上传文件' });
        return;
      }

      const results = [];

      for (const file of files) {
        const content = file.buffer.toString('utf8');
        let telemetryData;

        if (file.originalname.endsWith('.json')) {
          telemetryData = ParserService.parseTelemetryFile(content);
        } else if (file.originalname.endsWith('.csv')) {
          telemetryData = ParserService.parseCsvFile(content);
        }

        if (!telemetryData) {
          results.push({
            fileName: file.originalname,
            success: false,
            error: '文件格式无效或解析失败'
          });
          continue;
        }

        const result = await ParserService.processTelemetryData(telemetryData);
        results.push({
          fileName: file.originalname,
          success: true,
          buoyId: result.buoy.id,
          buoyName: result.buoy.name,
          taskId: result.taskId,
          pointCount: result.pointCount
        });
      }

      res.json({
        message: `成功处理 ${results.filter(r => r.success).length}/${results.length} 个文件`,
        results
      });
    } catch (error) {
      console.error('上传遥测包失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async createMockData(req: Request, res: Response): Promise<void> {
    try {
      const { buoyCode, days } = req.body;
      
      if (!buoyCode) {
        res.status(400).json({ error: '缺少浮标编号' });
        return;
      }

      const telemetryData = ParserService.generateMockTelemetry(buoyCode, days || 7);
      const result = await ParserService.processTelemetryData(telemetryData);

      res.json({
        message: '模拟数据创建成功',
        buoyId: result.buoy.id,
        buoyName: result.buoy.name,
        taskId: result.taskId,
        pointCount: result.pointCount
      });
    } catch (error) {
      console.error('创建模拟数据失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const { status, buoyId, seaArea } = req.query;
      
      const tasks = TaskRepository.getAll(
        status as TaskStatus | undefined,
        buoyId as string | undefined,
        seaArea as string | undefined
      );

      res.json(tasks);
    } catch (error) {
      console.error('获取任务列表失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const task = TaskRepository.getById(id);

      if (!task) {
        res.status(404).json({ error: '任务不存在' });
        return;
      }

      res.json(task);
    } catch (error) {
      console.error('获取任务详情失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async getTaskStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = TaskRepository.getStats();
      res.json(stats);
    } catch (error) {
      console.error('获取任务统计失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
}
