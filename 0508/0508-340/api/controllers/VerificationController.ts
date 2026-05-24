import { Request, Response } from 'express';
import { VerificationRepository } from '../repositories/VerificationRepository.js';
import { GapRepository } from '../repositories/GapRepository.js';
import { CorrectionService } from '../services/CorrectionService.js';

export class VerificationController {
  static async confirmBackfill(req: Request, res: Response): Promise<void> {
    try {
      const { gapId } = req.params;
      const { verifiedBy, comment } = req.body;

      const gap = GapRepository.getById(gapId);
      if (!gap) {
        res.status(404).json({ error: '数据缺口不存在' });
        return;
      }

      if (gap.status !== 'backfilled') {
        res.status(400).json({ error: '该缺口尚未上传补传数据，无法核验' });
        return;
      }

      const record = VerificationRepository.create(
        gapId,
        verifiedBy || 'system',
        'confirmed',
        comment
      );

      GapRepository.updateStatus(gapId, 'verified');

      await CorrectionService.correctBackfillPoints(gap.buoyId, gap.startTime, gap.endTime);

      res.json({
        message: '核验确认成功',
        record
      });
    } catch (error) {
      console.error('确认补传数据失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async rejectBackfill(req: Request, res: Response): Promise<void> {
    try {
      const { gapId } = req.params;
      const { verifiedBy, comment } = req.body;

      const gap = GapRepository.getById(gapId);
      if (!gap) {
        res.status(404).json({ error: '数据缺口不存在' });
        return;
      }

      if (gap.status !== 'backfilled') {
        res.status(400).json({ error: '该缺口尚未上传补传数据，无法核验' });
        return;
      }

      const record = VerificationRepository.create(
        gapId,
        verifiedBy || 'system',
        'rejected',
        comment
      );

      res.json({
        message: '核验驳回成功',
        record
      });
    } catch (error) {
      console.error('驳回补传数据失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async getVerificationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { gapId } = req.params;
      
      const gap = GapRepository.getById(gapId);
      if (!gap) {
        res.status(404).json({ error: '数据缺口不存在' });
        return;
      }

      const history = VerificationRepository.getHistory(gapId);
      res.json(history);
    } catch (error) {
      console.error('获取核验历史失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
}
