import { BuoyRepository } from '../repositories/BuoyRepository.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { TrackRepository } from '../repositories/TrackRepository.js';
import type { TrackPoint, Buoy } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

export interface TelemetryData {
  buoyCode: string;
  buoyName?: string;
  seaArea?: string;
  anchorLat: number;
  anchorLng: number;
  deployDate?: string;
  trackPoints: {
    timestamp: string;
    lat: number;
    lng: number;
  }[];
}

export class ParserService {
  static parseTelemetryFile(content: string): TelemetryData | null {
    try {
      const data = JSON.parse(content);
      return this.validateAndConvert(data);
    } catch {
      return null;
    }
  }

  static parseCsvFile(content: string): TelemetryData | null {
    try {
      const lines = content.trim().split('\n');
      if (lines.length < 2) return null;

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const buoyCodeIdx = headers.indexOf('buoycode');
      const timestampIdx = headers.indexOf('timestamp');
      const latIdx = headers.indexOf('lat');
      const lngIdx = headers.indexOf('lng');

      if (buoyCodeIdx === -1 || timestampIdx === -1 || latIdx === -1 || lngIdx === -1) {
        return null;
      }

      const trackPoints: { timestamp: string; lat: number; lng: number }[] = [];
      let buoyCode = '';
      let buoyName = '';
      let seaArea = '';

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (!buoyCode) buoyCode = values[buoyCodeIdx];
        
        const lat = parseFloat(values[latIdx]);
        const lng = parseFloat(values[lngIdx]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          trackPoints.push({
            timestamp: values[timestampIdx],
            lat,
            lng
          });
        }
      }

      return {
        buoyCode,
        buoyName: buoyName || buoyCode,
        seaArea,
        anchorLat: trackPoints.length > 0 ? trackPoints[0].lat : 0,
        anchorLng: trackPoints.length > 0 ? trackPoints[0].lng : 0,
        trackPoints
      };
    } catch {
      return null;
    }
  }

  static validateAndConvert(data: unknown): TelemetryData | null {
    const d = data as Record<string, unknown>;
    
    if (!d.buoyCode || !Array.isArray(d.trackPoints)) {
      return null;
    }

    const validPoints = (d.trackPoints as unknown[])
      .filter((p: unknown) => {
        const point = p as Record<string, unknown>;
        return point.timestamp && 
               typeof point.lat === 'number' && 
               typeof point.lng === 'number';
      })
      .map((p: unknown) => {
        const point = p as Record<string, unknown>;
        return {
          timestamp: point.timestamp as string,
          lat: point.lat as number,
          lng: point.lng as number
        };
      });

    if (validPoints.length === 0) return null;

    return {
      buoyCode: d.buoyCode as string,
      buoyName: (d.buoyName as string) || (d.buoyCode as string),
      seaArea: (d.seaArea as string) || '',
      anchorLat: typeof d.anchorLat === 'number' ? d.anchorLat : validPoints[0].lat,
      anchorLng: typeof d.anchorLng === 'number' ? d.anchorLng : validPoints[0].lng,
      deployDate: (d.deployDate as string) || new Date().toISOString(),
      trackPoints: validPoints
    };
  }

  static async processTelemetryData(telemetryData: TelemetryData): Promise<{
    buoy: Buoy;
    taskId: string;
    pointCount: number;
  }> {
    let buoy = BuoyRepository.getByCode(telemetryData.buoyCode);
    
    if (!buoy) {
      buoy = BuoyRepository.create({
        name: telemetryData.buoyName || telemetryData.buoyCode,
        code: telemetryData.buoyCode,
        seaArea: telemetryData.seaArea || '未知海域',
        anchorLat: telemetryData.anchorLat,
        anchorLng: telemetryData.anchorLng,
        deployDate: telemetryData.deployDate || new Date().toISOString(),
        status: 'active'
      });
    }

    const task = TaskRepository.create(buoy.id);

    const trackPoints: Omit<TrackPoint, 'id' | 'createdAt'>[] = telemetryData.trackPoints.map(p => ({
      buoyId: buoy!.id,
      taskId: task.id,
      timestamp: p.timestamp,
      originalLat: p.lat,
      originalLng: p.lng,
      source: 'telemetry'
    }));

    TrackRepository.bulkCreate(trackPoints);

    return {
      buoy: buoy!,
      taskId: task.id,
      pointCount: trackPoints.length
    };
  }

  static generateMockTelemetry(buoyCode: string, days: number = 7): TelemetryData {
    const trackPoints: { timestamp: string; lat: number; lng: number }[] = [];
    const baseLat = 30 + Math.random() * 5;
    const baseLng = 120 + Math.random() * 5;
    
    const now = Date.now();
    const interval = 30 * 60 * 1000;
    const totalPoints = Math.floor((days * 24 * 60 * 60 * 1000) / interval);

    for (let i = 0; i < totalPoints; i++) {
      const timestamp = new Date(now - (totalPoints - i) * interval).toISOString();
      const driftFactor = i / totalPoints;
      const lat = baseLat + driftFactor * (Math.random() - 0.5) * 0.5;
      const lng = baseLng + driftFactor * (Math.random() - 0.5) * 0.5;
      
      trackPoints.push({ timestamp, lat, lng });
    }

    return {
      buoyCode,
      buoyName: `浮标 ${buoyCode}`,
      seaArea: ['东海', '南海', '黄海', '渤海'][Math.floor(Math.random() * 4)],
      anchorLat: baseLat,
      anchorLng: baseLng,
      deployDate: new Date(now - days * 24 * 60 * 60 * 1000).toISOString(),
      trackPoints
    };
  }
}
