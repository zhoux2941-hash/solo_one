import { TaskRepository } from '../repositories/TaskRepository.js';
import { TrackRepository } from '../repositories/TrackRepository.js';
import { BuoyRepository } from '../repositories/BuoyRepository.js';
import { GapRepository } from '../repositories/GapRepository.js';
import type { TrackPoint } from '../../shared/types.js';

export class CorrectionService {
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
  }

  static calculateDirection(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;
    return bearing;
  }

  static correctDrift(
    originalLat: number,
    originalLng: number,
    anchorLat: number,
    anchorLng: number,
    driftFactor: number = 0.7
  ): { lat: number; lng: number } {
    const distance = this.calculateDistance(originalLat, originalLng, anchorLat, anchorLng);
    const confidence = Math.max(0, 1 - distance / 5000);
    const actualDrift = driftFactor * confidence;
    
    const lat = originalLat + (anchorLat - originalLat) * actualDrift;
    const lng = originalLng + (anchorLng - originalLng) * actualDrift;
    
    return { lat, lng };
  }

  static async processTask(taskId: string): Promise<void> {
    const task = TaskRepository.getById(taskId);
    if (!task) throw new Error('Task not found');

    TaskRepository.updateStatus(taskId, 'processing', 10);

    const buoy = BuoyRepository.getById(task.buoyId);
    if (!buoy) throw new Error('Buoy not found');

    const trackPoints = TrackRepository.getByBuoyId(task.buoyId);
    
    if (trackPoints.length === 0) {
      TaskRepository.updateStatus(taskId, 'failed', 100);
      return;
    }

    TaskRepository.updateStatus(taskId, 'processing', 30);

    let totalDrift = 0;
    let maxDrift = 0;
    let validPoints = 0;

    for (let i = 0; i < trackPoints.length; i++) {
      const point = trackPoints[i];
      const drift = this.calculateDistance(
        point.originalLat, point.originalLng,
        buoy.anchorLat, buoy.anchorLng
      );
      
      totalDrift += drift;
      maxDrift = Math.max(maxDrift, drift);
      validPoints++;

      const corrected = this.correctDrift(
        point.originalLat, point.originalLng,
        buoy.anchorLat, buoy.anchorLng
      );
      
      TrackRepository.updateCorrection(point.id, corrected.lat, corrected.lng);

      if (i % Math.ceil(trackPoints.length / 10) === 0) {
        const progress = 30 + Math.floor((i / trackPoints.length) * 60);
        TaskRepository.updateStatus(taskId, 'processing', progress);
      }
    }

    TaskRepository.updateStatus(taskId, 'processing', 90);

    const avgDrift = totalDrift / validPoints;
    const lastPoint = trackPoints[trackPoints.length - 1];
    const firstPoint = trackPoints[0];
    const direction = this.calculateDirection(
      firstPoint.originalLat, firstPoint.originalLng,
      lastPoint.originalLat, lastPoint.originalLng
    );
    const confidence = Math.max(0, 1 - maxDrift / 10000);

    TaskRepository.updateDriftEstimate(taskId, avgDrift, direction, confidence);

    TaskRepository.updateStatus(taskId, 'processing', 95);
    GapRepository.detectGaps(task.buoyId);

    TaskRepository.updateStatus(taskId, 'completed', 100);
  }

  static getDriftStatistics(buoyId: string): {
    maxDrift: number;
    avgDrift: number;
    totalCorrections: number;
  } {
    const buoy = BuoyRepository.getById(buoyId);
    if (!buoy) return { maxDrift: 0, avgDrift: 0, totalCorrections: 0 };

    const trackPoints = TrackRepository.getByBuoyId(buoyId);
    
    if (trackPoints.length === 0) {
      return { maxDrift: 0, avgDrift: 0, totalCorrections: 0 };
    }

    let totalDrift = 0;
    let maxDrift = 0;
    let correctedCount = 0;

    for (const point of trackPoints) {
      if (point.correctedLat !== undefined && point.correctedLng !== undefined) {
        const drift = this.calculateDistance(
          point.originalLat, point.originalLng,
          buoy.anchorLat, buoy.anchorLng
        );
        totalDrift += drift;
        maxDrift = Math.max(maxDrift, drift);
        correctedCount++;
      }
    }

    return {
      maxDrift: Math.round(maxDrift),
      avgDrift: Math.round(totalDrift / Math.max(1, correctedCount)),
      totalCorrections: correctedCount
    };
  }

  static compareWithAnchor(buoyId: string): Array<{
    timestamp: string;
    originalDistance: number;
    correctedDistance?: number;
  }> {
    const buoy = BuoyRepository.getById(buoyId);
    if (!buoy) return [];

    const trackPoints = TrackRepository.getByBuoyId(buoyId);
    
    return trackPoints.map(point => {
      const originalDistance = this.calculateDistance(
        point.originalLat, point.originalLng,
        buoy.anchorLat, buoy.anchorLng
      );

      let correctedDistance: number | undefined;
      if (point.correctedLat !== undefined && point.correctedLng !== undefined) {
        correctedDistance = this.calculateDistance(
          point.correctedLat, point.correctedLng,
          buoy.anchorLat, buoy.anchorLng
        );
      }

      return {
        timestamp: point.timestamp,
        originalDistance: Math.round(originalDistance),
        correctedDistance: correctedDistance ? Math.round(correctedDistance) : undefined
      };
    });
  }

  static async correctBackfillPoints(buoyId: string, startTime: string, endTime: string): Promise<void> {
    const buoy = BuoyRepository.getById(buoyId);
    if (!buoy) {
      console.error('[CorrectionService] 浮标不存在:', buoyId);
      return;
    }

    const allPoints = TrackRepository.getByBuoyId(buoyId);
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    const backfillPoints = allPoints.filter(p => {
      const t = new Date(p.timestamp).getTime();
      return t >= start && t <= end && p.source === 'backfill' && p.correctedLat === undefined;
    });

    console.log(`[CorrectionService] 开始校正 ${backfillPoints.length} 个补传点`);

    for (const point of backfillPoints) {
      const corrected = this.correctDrift(
        point.originalLat, point.originalLng,
        buoy.anchorLat, buoy.anchorLng
      );
      TrackRepository.updateCorrection(point.id, corrected.lat, corrected.lng);
    }

    console.log(`[CorrectionService] 补传点校正完成`);
  }
}
