import { Router } from 'express';
import * as colorController from '../controllers/color.controller';

const router = Router();

router.post('/convert/rgb-to-all', colorController.convertRgbToAll);
router.post('/convert/cmyk-to-all', colorController.convertCmykToAll);
router.post('/convert/pantone-to-all', colorController.convertPantoneToAll);
router.post('/convert/hex-to-all', colorController.convertHexToAll);

router.get('/pantone/search', colorController.searchPantone);
router.get('/pantone/list', colorController.listPantone);
router.post('/pantone/match', colorController.matchPantone);
router.get('/pantone/categories', colorController.getCategories);
router.get('/pantone/presets', colorController.getPresetColors);

router.post('/delta-e/cie2000', colorController.calculateDeltaE);

router.post('/overprint/calculate', colorController.calculateOverprint);

router.post('/export/report-data', colorController.getReportData);

export default router;
