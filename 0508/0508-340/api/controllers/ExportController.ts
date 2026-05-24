import { Request, Response } from 'express';
import { ExportService } from '../services/ExportService.js';
import { BuoyRepository } from '../repositories/BuoyRepository.js';

export class ExportController {
  static async exportBatchSummary(req: Request, res: Response): Promise<void> {
    try {
      const { buoyCodes, format = 'json', exportedBy } = req.query;

      if (!buoyCodes || typeof buoyCodes !== 'string') {
        res.status(400).json({ error: '请提供浮标编号列表' });
        return;
      }

      const codeList = buoyCodes.split(',').filter(c => c.trim());
      if (codeList.length === 0) {
        res.status(400).json({ error: '浮标编号列表为空' });
        return;
      }

      const fileName = `batch_summary_${Date.now()}`;

      if (format === 'csv') {
        const csvContent = ExportService.generateBatchCsvSummary(
          codeList,
          exportedBy as string | undefined
        );
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
        res.send('\uFEFF' + csvContent);
      } else {
        const jsonContent = ExportService.generateBatchJsonSummary(
          codeList,
          exportedBy as string | undefined
        );
        
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.json"`);
        res.send(jsonContent);
      }
    } catch (error) {
      console.error('批量导出摘要失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async exportSummary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { format = 'json', exportedBy } = req.query;

      const buoy = BuoyRepository.getById(id);
      if (!buoy) {
        res.status(404).json({ error: '浮标不存在' });
        return;
      }

      const fileName = `buoy_${buoy.code}_summary_${Date.now()}`;

      if (format === 'csv') {
        const csvContent = ExportService.generateCsvSummary(
          id,
          exportedBy as string | undefined
        );
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
        res.send('\uFEFF' + csvContent);
      } else {
          const jsonContent = ExportService.generateJsonSummary(
            id,
            exportedBy as string | undefined
          );
          
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}.json"`);
          res.send(jsonContent);
        }
    } catch (error) {
      console.error('导出摘要失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async exportTrack(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const buoy = BuoyRepository.getById(id);
      if (!buoy) {
        res.status(404).json({ error: '浮标不存在' });
        return;
      }

      const csvContent = ExportService.generateTrackCsv(id);
      const fileName = `buoy_${buoy.code}_track_${Date.now()}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send('\uFEFF' + csvContent);
    } catch (error) {
      console.error('导出轨迹失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async getSummaryPreview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { exportedBy } = req.query;

      const summary = ExportService.generateBuoySummary(
        id,
        exportedBy as string | undefined
      );

      if (!summary) {
        res.status(404).json({ error: '浮标不存在' });
        return;
      }

      res.json(summary);
    } catch (error) {
      console.error('获取摘要预览失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
}
