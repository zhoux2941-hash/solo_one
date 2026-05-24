import { BuoyRepository } from '../repositories/BuoyRepository.js';
import { TrackRepository } from '../repositories/TrackRepository.js';
import { VerificationRepository } from '../repositories/VerificationRepository.js';
import { GapRepository } from '../repositories/GapRepository.js';
import { CorrectionService } from './CorrectionService.js';
import type { ExportSummary } from '../../shared/types.js';

export class ExportService {
  static generateBuoySummary(buoyId: string, exportedBy: string = 'system'): ExportSummary | null {
    const buoy = BuoyRepository.getById(buoyId);
    if (!buoy) return null;

    const originalTrack = TrackRepository.getByBuoyId(buoyId, 'telemetry');
    const correctedTrack = originalTrack.filter(p => p.correctedLat !== undefined && p.correctedLng !== undefined);
    const driftStatistics = CorrectionService.getDriftStatistics(buoyId);
    const verificationHistory = VerificationRepository.getByBuoyId(buoyId);
    const allGaps = GapRepository.getByBuoyId(buoyId);

    const verifiedGaps = allGaps.filter(g => g.status === 'verified');
    const totalDuration = allGaps.reduce((sum, g) => sum + g.durationSeconds, 0);

    return {
      buoyInfo: buoy,
      correctionResult: {
        originalTrack,
        correctedTrack,
        driftStatistics
      },
      verificationHistory,
      gapSummary: {
        totalGaps: allGaps.length,
        verifiedGaps: verifiedGaps.length,
        totalDuration
      },
      exportedAt: new Date().toISOString(),
      exportedBy
    };
  }

  static generateJsonSummary(buoyId: string, exportedBy?: string): string {
    const summary = this.generateBuoySummary(buoyId, exportedBy);
    if (!summary) return JSON.stringify({ error: 'Buoy not found' });
    return JSON.stringify(summary, null, 2);
  }

  static generateCsvSummary(buoyId: string, exportedBy?: string): string {
    const summary = this.generateBuoySummary(buoyId, exportedBy);
    if (!summary) return 'Error: Buoy not found';

    let csv = '浮标漂移校正核验摘要\n\n';
    csv += '基本信息\n';
    csv += `浮标名称,${summary.buoyInfo.name}\n`;
    csv += `浮标编号,${summary.buoyInfo.code}\n`;
    csv += `所属海域,${summary.buoyInfo.seaArea}\n`;
    csv += `锚点位置,${summary.buoyInfo.anchorLat},${summary.buoyInfo.anchorLng}\n`;
    csv += `布放日期,${summary.buoyInfo.deployDate}\n\n`;

    csv += '漂移统计\n';
    csv += `最大漂移距离(m),${summary.correctionResult.driftStatistics.maxDrift}\n`;
    csv += `平均漂移距离(m),${summary.correctionResult.driftStatistics.avgDrift}\n`;
    csv += `校正点数量,${summary.correctionResult.driftStatistics.totalCorrections}\n\n`;

    csv += '数据缺口统计\n';
    csv += `总缺口数,${summary.gapSummary.totalGaps}\n`;
    csv += `已核验数,${summary.gapSummary.verifiedGaps}\n`;
    csv += `总缺口时长(秒),${summary.gapSummary.totalDuration}\n\n`;

    csv += '核验记录\n';
    csv += '时间,核验人,结果,备注\n';
    for (const record of summary.verificationHistory) {
      csv += `${record.verifiedAt},${record.verifiedBy},${record.result},${record.comment || ''}\n`;
    }

    csv += '\n导出信息\n';
    csv += `导出时间,${summary.exportedAt}\n`;
    csv += `导出人,${summary.exportedBy}\n`;

    return csv;
  }

  static generateTrackCsv(buoyId: string): string {
    const trackPoints = TrackRepository.getByBuoyId(buoyId);
    
    let csv = '时间,原始纬度,原始经度,校正后纬度,校正后经度,数据源\n';
    
    for (const point of trackPoints) {
      csv += `${point.timestamp},${point.originalLat},${point.originalLng},`;
      csv += `${point.correctedLat ?? ''},${point.correctedLng ?? ''},${point.source}\n`;
    }

    return csv;
  }

  static generateBatchJsonSummary(buoyCodes: string[], exportedBy?: string): string {
    const summaries: any[] = [];
    
    for (const buoyCode of buoyCodes) {
      const buoy = BuoyRepository.getByCode(buoyCode);
      if (buoy) {
        const summary = this.generateBuoySummary(buoy.id, exportedBy);
        if (summary) {
          summaries.push(summary);
        }
      }
    }

    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      exportedBy: exportedBy || 'system',
      buoyCount: summaries.length,
      summaries
    }, null, 2);
  }

  static generateBatchCsvSummary(buoyCodes: string[], exportedBy?: string): string {
    let csv = '批量浮标漂移校正核验摘要\n\n';
    csv += `导出时间,${new Date().toISOString()}\n`;
    csv += `导出人,${exportedBy || 'system'}\n\n`;
    
    csv += '浮标汇总\n';
    csv += '浮标编号,浮标名称,所属海域,最大漂移(m),平均漂移(m),校正点数,缺口总数,已核验数\n';

    for (const buoyCode of buoyCodes) {
      const buoy = BuoyRepository.getByCode(buoyCode);
      if (buoy) {
        const summary = this.generateBuoySummary(buoy.id, exportedBy);
        if (summary) {
          csv += `${summary.buoyInfo.code},${summary.buoyInfo.name},${summary.buoyInfo.seaArea},`;
          csv += `${summary.correctionResult.driftStatistics.maxDrift},`;
          csv += `${summary.correctionResult.driftStatistics.avgDrift},`;
          csv += `${summary.correctionResult.driftStatistics.totalCorrections},`;
          csv += `${summary.gapSummary.totalGaps},`;
          csv += `${summary.gapSummary.verifiedGaps}\n`;
        }
      }
    }

    csv += '\n核验记录明细\n';
    csv += '浮标编号,核验时间,核验人,结果,备注\n';

    for (const buoyCode of buoyCodes) {
      const buoy = BuoyRepository.getByCode(buoyCode);
      if (buoy) {
        const history = VerificationRepository.getByBuoyId(buoy.id);
        for (const record of history) {
          csv += `${buoyCode},${record.verifiedAt},${record.verifiedBy},${record.result},${record.comment || ''}\n`;
        }
      }
    }

    return csv;
  }
}
