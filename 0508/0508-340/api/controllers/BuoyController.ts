import { Request, Response } from 'express';
import { BuoyRepository } from '../repositories/BuoyRepository.js';
import { TrackRepository } from '../repositories/TrackRepository.js';
import { GapRepository } from '../repositories/GapRepository.js';
import { CorrectionService } from '../services/CorrectionService.js';
import { ParserService } from '../services/ParserService.js';

export class BuoyController {
  static async getAllBuoys(req: Request, res: Response): Promise<void> {
    try {
      const { seaArea } = req.query;
      const buoys = BuoyRepository.getAll(seaArea as string | undefined);
      res.json(buoys);
    } catch (error) {
      console.error('获取浮标列表失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async getBuoyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const buoy = BuoyRepository.getById(id);

      if (!buoy) {
        res.status(404).json({ error: '浮标不存在' });
        return;
      }

      res.json(buoy);
    } catch (error) {
      console.error('获取浮标详情失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async getBuoyTrack(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { source } = req.query;

      const buoy = BuoyRepository.getById(id);
      if (!buoy) {
        res.status(404).json({ error: '浮标不存在' });
        return;
      }

      const trackPoints = TrackRepository.getByBuoyId(
        id,
        source as 'telemetry' | 'backfill' | undefined
      );

      res.json({
        buoy,
        trackPoints
      });
    } catch (error) {
      console.error('获取浮标轨迹失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async getBuoyGaps(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.query;

      const buoy = BuoyRepository.getById(id);
      if (!buoy) {
        res.status(404).json({ error: '浮标不存在' });
        return;
      }

      const gaps = GapRepository.getByBuoyId(
        id,
        status as 'open' | 'backfilled' | 'verified' | 'rejected' | undefined
      );

      res.json(gaps);
    } catch (error) {
      console.error('获取数据缺口失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async getDriftStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const buoy = BuoyRepository.getById(id);
      if (!buoy) {
        res.status(404).json({ error: '浮标不存在' });
        return;
      }

      const statistics = CorrectionService.getDriftStatistics(id);
      res.json(statistics);
    } catch (error) {
      console.error('获取漂移统计失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async getAnchorComparison(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const buoy = BuoyRepository.getById(id);
      if (!buoy) {
        res.status(404).json({ error: '浮标不存在' });
        return;
      }

      const comparison = CorrectionService.compareWithAnchor(id);
      res.json(comparison);
    } catch (error) {
      console.error('获取锚点比对失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async getSeaAreas(req: Request, res: Response): Promise<void> {
    try {
      const seaAreas = BuoyRepository.getSeaAreas();
      res.json(seaAreas);
    } catch (error) {
      console.error('获取海域列表失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  static async uploadBackfill(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { gapId, uploadedBy } = req.body;
      const file = req.file as Express.Multer.File;

      const buoy = BuoyRepository.getById(id);
      if (!buoy) {
        res.status(404).json({ error: '浮标不存在' });
        return;
      }

      const gap = GapRepository.getById(gapId);
      if (!gap) {
        res.status(404).json({ error: '数据缺口不存在' });
        return;
      }

      let pointCount = 0;
      if (file) {
        const content = file.buffer.toString('utf8');
        const isJson = file.originalname.endsWith('.json');
        
        let backfillPoints: { timestamp: string; lat: number; lng: number }[] = [];
        if (isJson) {
          const data = JSON.parse(content);
          if (Array.isArray(data.trackPoints)) {
            backfillPoints = data.trackPoints;
          } else if (Array.isArray(data)) {
            backfillPoints = data;
          }
        } else {
          const parsed = ParserService.parseCsvFile(content);
          if (parsed) {
            backfillPoints = parsed.trackPoints;
          }
        }

        pointCount = backfillPoints.length;
        
        if (pointCount > 0) {
          const trackPoints = backfillPoints.map((p: any) => ({
            buoyId: id,
            taskId: null,
            timestamp: p.timestamp || p.time,
            originalLat: parseFloat(p.lat || p.latitude || p.originalLat),
            originalLng: parseFloat(p.lng || p.longitude || p.originalLng),
            correctedLat: undefined,
            correctedLng: undefined,
            source: 'backfill' as const
          })).filter((p: any) => !isNaN(p.originalLat) && !isNaN(p.originalLng));

          if (trackPoints.length > 0) {
            TrackRepository.bulkCreate(trackPoints);
            console.log(`[BuoyController] 插入了 ${trackPoints.length} 条补传轨迹点`);
          }
        }
      }

      const backfillData = GapRepository.addBackfillData(
        gapId,
        uploadedBy || 'system',
        pointCount
      );

      res.json({
        message: '补传数据上传成功',
        backfillData
      });
    } catch (error) {
      console.error('上传补传数据失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
}
