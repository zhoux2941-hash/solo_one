import { Router, Request, Response } from 'express';
import { washArchiveService } from '../services/WashArchiveService';
import { backgroundTaskService } from '../services/BackgroundTaskService';
import { archiveStore } from '../store';
import {
  EntryRegistrationData,
  WashCompletionData,
  SamplingReviewData,
  ExitReleaseData,
  AnomalyType,
} from '../types';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((err) => {
      console.error('API Error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error',
      });
    });
  };
};

router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'running',
      timestamp: Date.now(),
      service: 'hazardous-vehicle-wash-archive',
    },
  });
});

router.post(
  '/records/entry',
  asyncHandler(async (req: Request, res: Response) => {
    const data: EntryRegistrationData = req.body;
    const requiredFields = [
      'plateNumber',
      'driverName',
      'driverPhone',
      'cargoType',
      'hazardLevel',
      'expectedWashType',
      'operator',
    ];
    const missing = requiredFields.filter((f) => !(f in data));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `缺少必填字段: ${missing.join(', ')}`,
      });
    }

    const record = washArchiveService.entryRegistration(data);
    res.json({
      success: true,
      data: record,
    });
  })
);

router.post(
  '/records/wash',
  asyncHandler(async (req: Request, res: Response) => {
    const data: WashCompletionData = req.body;
    const requiredFields = [
      'plateNumber',
      'washType',
      'washDuration',
      'detergent',
      'waterTemp',
      'pressure',
      'operator',
    ];
    const missing = requiredFields.filter((f) => !(f in data));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `缺少必填字段: ${missing.join(', ')}`,
      });
    }

    const record = washArchiveService.washCompletion(data);
    res.json({
      success: true,
      data: record,
    });
  })
);

router.post(
  '/records/sampling',
  asyncHandler(async (req: Request, res: Response) => {
    const data: SamplingReviewData = req.body;
    const requiredFields = [
      'plateNumber',
      'samplingPoints',
      'testItems',
      'testResult',
      'tester',
      'operator',
    ];
    const missing = requiredFields.filter((f) => !(f in data));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `缺少必填字段: ${missing.join(', ')}`,
      });
    }

    const record = washArchiveService.samplingReview(data);
    res.json({
      success: true,
      data: record,
    });
  })
);

router.post(
  '/records/exit',
  asyncHandler(async (req: Request, res: Response) => {
    const data: ExitReleaseData = req.body;
    const requiredFields = ['plateNumber', 'gateNumber', 'destination', 'operator'];
    const missing = requiredFields.filter((f) => !(f in data));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `缺少必填字段: ${missing.join(', ')}`,
      });
    }

    const record = washArchiveService.exitRelease(data);
    res.json({
      success: true,
      data: record,
    });
  })
);

router.get(
  '/vehicles/:plateNumber/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { plateNumber } = req.params;
    const status = archiveStore.getVehicleStatus(plateNumber);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: `未找到车辆 ${plateNumber} 的状态信息`,
      });
    }

    res.json({
      success: true,
      data: status,
    });
  })
);

router.get(
  '/vehicles',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, abnormal } = req.query;
    let statuses = archiveStore.getAllVehicleStatuses();

    if (status) {
      statuses = statuses.filter((s) => s.currentStatus === status);
    }

    if (abnormal === 'true') {
      statuses = statuses.filter((s) => s.lastAnomaly !== null);
    } else if (abnormal === 'false') {
      statuses = statuses.filter((s) => s.lastAnomaly === null);
    }

    res.json({
      success: true,
      data: statuses,
      total: statuses.length,
    });
  })
);

router.get(
  '/vehicles/:plateNumber/trace',
  asyncHandler(async (req: Request, res: Response) => {
    const { plateNumber } = req.params;
    const chains = washArchiveService.getTraceChainsByPlate(plateNumber);

    if (chains.length === 0) {
      return res.status(404).json({
        success: false,
        error: `未找到车辆 ${plateNumber} 的洗消记录`,
      });
    }

    res.json({
      success: true,
      data: chains,
      total: chains.length,
    });
  })
);

router.get(
  '/trace/:chainId',
  asyncHandler(async (req: Request, res: Response) => {
    const { chainId } = req.params;
    const chain = washArchiveService.getTraceChain(chainId);

    if (!chain) {
      return res.status(404).json({
        success: false,
        error: `未找到追溯链 ${chainId}`,
      });
    }

    res.json({
      success: true,
      data: chain,
    });
  })
);

router.get(
  '/chains/active',
  asyncHandler(async (req: Request, res: Response) => {
    const activeChains = backgroundTaskService.getActiveChains();
    res.json({
      success: true,
      data: activeChains,
      total: activeChains.length,
    });
  })
);

router.post(
  '/anomalies',
  asyncHandler(async (req: Request, res: Response) => {
    const { plateNumber, anomalyType, description, chainId } = req.body;

    if (!plateNumber || !anomalyType || !description) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段: plateNumber, anomalyType, description',
      });
    }

    if (!Object.values(AnomalyType).includes(anomalyType)) {
      return res.status(400).json({
        success: false,
        error: `无效的异常类型: ${anomalyType}`,
      });
    }

    const anomaly = washArchiveService.addAnomaly(
      plateNumber,
      anomalyType,
      description,
      chainId
    );

    res.json({
      success: true,
      data: anomaly,
    });
  })
);

router.put(
  '/anomalies/:anomalyId/resolve',
  asyncHandler(async (req: Request, res: Response) => {
    const { anomalyId } = req.params;
    const { resolvedBy, resolution } = req.body;

    if (!resolvedBy || !resolution) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段: resolvedBy, resolution',
      });
    }

    const anomaly = washArchiveService.resolveAnomaly(
      anomalyId,
      resolvedBy,
      resolution
    );

    if (!anomaly) {
      return res.status(404).json({
        success: false,
        error: `未找到异常记录 ${anomalyId}`,
      });
    }

    res.json({
      success: true,
      data: anomaly,
    });
  })
);

router.get(
  '/anomalies',
  asyncHandler(async (req: Request, res: Response) => {
    const { plateNumber, unresolved, startTime, endTime } = req.query;
    let anomalies;

    if (plateNumber) {
      anomalies = archiveStore.getAnomalyRecordsByPlate(plateNumber as string);
    } else if (startTime && endTime) {
      anomalies = archiveStore.getAnomalyRecordsByTimeRange(
        parseInt(startTime as string),
        parseInt(endTime as string)
      );
    } else {
      anomalies = archiveStore.getUnresolvedAnomalies();
    }

    if (unresolved === 'true') {
      anomalies = anomalies.filter((a) => !a.resolved);
    } else if (unresolved === 'false') {
      anomalies = anomalies.filter((a) => a.resolved);
    }

    res.json({
      success: true,
      data: anomalies,
      total: anomalies.length,
    });
  })
);

router.post(
  '/tasks/record-pull',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await backgroundTaskService.runRecord补拉Task();
    res.json({
      success: true,
      data: result,
    });
  })
);

router.post(
  '/tasks/shift-summary',
  asyncHandler(async (req: Request, res: Response) => {
    const { startTime, endTime, shiftName } = req.body;
    let result;

    if (startTime && endTime && shiftName) {
      result = await backgroundTaskService.runShiftSummaryTask({
        startTime: parseInt(startTime),
        endTime: parseInt(endTime),
        shiftName,
      });
    } else {
      result = await backgroundTaskService.runShiftSummaryTask();
    }

    if (!result) {
      return res.status(400).json({
        success: false,
        error: '交班摘要生成失败',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  })
);

router.get(
  '/shift-summaries',
  asyncHandler(async (req: Request, res: Response) => {
    const { startTime, endTime, latest } = req.query;

    if (latest === 'true') {
      const latest = archiveStore.getLatestShiftSummary();
      return res.json({
        success: true,
        data: latest,
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: '请提供 startTime 和 endTime 参数',
      });
    }

    const summaries = archiveStore.getShiftSummariesByTimeRange(
      parseInt(startTime as string),
      parseInt(endTime as string)
    );

    res.json({
      success: true,
      data: summaries,
      total: summaries.length,
    });
  })
);

router.get(
  '/records',
  asyncHandler(async (req: Request, res: Response) => {
    const { plateNumber, chainId, startTime, endTime } = req.query;
    let records;

    if (chainId) {
      records = archiveStore.getWashRecordsByChain(chainId as string);
    } else if (plateNumber) {
      records = archiveStore.getWashRecordsByPlate(plateNumber as string);
    } else if (startTime && endTime) {
      records = archiveStore.getWashRecordsByTimeRange(
        parseInt(startTime as string),
        parseInt(endTime as string)
      );
    } else {
      records = archiveStore.getAllWashRecords();
    }

    res.json({
      success: true,
      data: records,
      total: records.length,
    });
  })
);

router.delete(
  '/clear',
  asyncHandler(async (req: Request, res: Response) => {
    archiveStore.clearAll();
    res.json({
      success: true,
      message: '所有数据已清空',
    });
  })
);

router.post(
  '/persist',
  asyncHandler(async (req: Request, res: Response) => {
    archiveStore.forcePersist();
    res.json({
      success: true,
      message: '数据已强制持久化',
    });
  })
);

export default router;
