import { Router } from 'express';
import multer from 'multer';
import { TaskController } from '../controllers/TaskController.js';
import { BuoyController } from '../controllers/BuoyController.js';
import { VerificationController } from '../controllers/VerificationController.js';
import { ExportController } from '../controllers/ExportController.js';

const router = Router();
const upload = multer();

router.post('/telemetry/upload', upload.array('files', 50), TaskController.uploadTelemetry);
router.post('/telemetry/mock', TaskController.createMockData);

router.get('/tasks', TaskController.getTasks);
router.get('/tasks/stats', TaskController.getTaskStats);
router.get('/tasks/:id', TaskController.getTaskById);

router.get('/buoys', BuoyController.getAllBuoys);
router.get('/buoys/sea-areas', BuoyController.getSeaAreas);
router.get('/buoys/:id', BuoyController.getBuoyById);
router.get('/buoys/:id/track', BuoyController.getBuoyTrack);
router.get('/buoys/:id/gaps', BuoyController.getBuoyGaps);
router.get('/buoys/:id/drift-statistics', BuoyController.getDriftStatistics);
router.get('/buoys/:id/anchor-comparison', BuoyController.getAnchorComparison);
router.post('/buoys/:id/backfill', upload.single('file'), BuoyController.uploadBackfill);

router.post('/verification/:gapId/confirm', VerificationController.confirmBackfill);
router.post('/verification/:gapId/reject', VerificationController.rejectBackfill);
router.get('/verification/:gapId/history', VerificationController.getVerificationHistory);

router.get('/export/batch/summary', ExportController.exportBatchSummary);
router.get('/export/:id/summary', ExportController.exportSummary);
router.get('/export/:id/track', ExportController.exportTrack);
router.get('/export/:id/preview', ExportController.getSummaryPreview);

export default router;
