import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { invertImage, enhanceEdges, detectPatternType } from '../services/imageService.js';
import { recommendPatterns } from '../services/patternService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.bmp', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 png, jpg, jpeg, bmp, webp 格式的图片'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

interface BatchTask {
  batchId: string;
  items: BatchItem[];
  createdAt: Date;
}

interface BatchItem {
  id: string;
  originalFilename: string;
  originalPath: string;
  processedPath?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  recommendations?: any[];
  error?: string;
}

const tasks = new Map<string, {
  originalPath: string;
  invertedPath?: string;
  enhancedPath?: string;
  direction?: string;
  features?: any;
}>();

const batchTasks = new Map<string, BatchTask>();

const router = Router();

router.post('/invert', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: '请上传图片文件' });
      return;
    }

    const direction = req.body.direction === 'yin2yang' ? 'yin2yang' : 'yang2yin';
    const intensity = parseFloat(req.body.intensity) || 1.0;
    const taskId = uuidv4();

    const originalPath = req.file.path;
    const invertedFilename = `inverted_${path.basename(originalPath)}`;
    const invertedPath = path.join(uploadsDir, invertedFilename);

    await invertImage(originalPath, invertedPath, direction, intensity);

    const features = await detectPatternType(originalPath);

    tasks.set(taskId, {
      originalPath,
      invertedPath,
      direction,
      features,
    });

    res.json({
      success: true,
      taskId,
      invertedUrl: `/uploads/${invertedFilename}`,
      originalUrl: `/uploads/${path.basename(originalPath)}`,
      direction,
      features,
    });
  } catch (error) {
    console.error('Invert error:', error);
    res.status(500).json({ success: false, error: '图像反转处理失败' });
  }
});

router.post('/batch/invert', upload.array('images', 50), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ success: false, error: '请上传至少一张图片' });
      return;
    }

    const direction = req.body.direction === 'yin2yang' ? 'yin2yang' : 'yang2yin';
    const intensity = parseFloat(req.body.intensity) || 1.0;
    const batchId = uuidv4();

    const items: BatchItem[] = req.files.map((file) => ({
      id: uuidv4(),
      originalFilename: file.originalname,
      originalPath: file.path,
      status: 'pending',
    }));

    batchTasks.set(batchId, {
      batchId,
      items,
      createdAt: new Date(),
    });

    (async () => {
      for (const item of items) {
        try {
          item.status = 'processing';
          const processedFilename = `batch_${batchId}_processed_${path.basename(item.originalFilename, path.extname(item.originalFilename))}.png`;
          const processedPath = path.join(uploadsDir, processedFilename);

          await invertImage(item.originalPath, processedPath, direction, intensity);

          const features = await detectPatternType(item.originalPath);
          const recs = recommendPatterns(features);

          item.processedPath = processedPath;
          item.recommendations = recs;
          item.status = 'completed';
        } catch (error) {
          item.status = 'error';
          item.error = error instanceof Error ? error.message : '处理失败';
        }
      }
    })();

    res.json({
      success: true,
      batchId,
      total: items.length,
      items: items.map((i) => ({
        id: i.id,
        filename: i.originalFilename,
        status: i.status,
      })),
    });
  } catch (error) {
    console.error('Batch invert error:', error);
    res.status(500).json({ success: false, error: '批量处理初始化失败' });
  }
});

router.get('/batch/:batchId/status', (req: Request, res: Response): void => {
  try {
    const { batchId } = req.params;
    const task = batchTasks.get(batchId);

    if (!task) {
      res.status(404).json({ success: false, error: '批次不存在' });
      return;
    }

    const completed = task.items.filter((i) => i.status === 'completed').length;
    const errors = task.items.filter((i) => i.status === 'error').length;
    const pending = task.items.filter((i) => i.status === 'pending').length;
    const processing = task.items.filter((i) => i.status === 'processing').length;

    res.json({
      success: true,
      batchId,
      total: task.items.length,
      completed,
      errors,
      pending,
      processing,
      progress: completed / task.items.length,
      items: task.items.map((i) => ({
        id: i.id,
        filename: i.originalFilename,
        status: i.status,
        error: i.error,
        processedUrl: i.processedPath ? `/uploads/${path.basename(i.processedPath)}` : undefined,
        originalUrl: `/uploads/${path.basename(i.originalPath)}`,
        recommendations: i.recommendations,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取批次状态失败' });
  }
});

router.get('/batch/:batchId/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const task = batchTasks.get(batchId);

    if (!task) {
      res.status(404).json({ success: false, error: '批次不存在' });
      return;
    }

    const completedItems = task.items.filter((i) => i.status === 'completed' && i.processedPath);

    if (completedItems.length === 0) {
      res.status(400).json({ success: false, error: '没有可导出的已处理图像' });
      return;
    }

    if (completedItems.length === 1) {
      const item = completedItems[0];
      if (item.processedPath) {
        res.download(item.processedPath, `wadang_${item.id}.png`);
      }
      return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (const item of completedItems) {
      if (item.processedPath && fs.existsSync(item.processedPath)) {
        const data = fs.readFileSync(item.processedPath);
        const filename = `wadang_${path.basename(item.originalFilename, path.extname(item.originalFilename))}_inverted.png`;
        zip.file(filename, data);
      }
    }

    const content = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="wadang_batch_${batchId}.zip"`);
    res.send(content);
  } catch (error) {
    console.error('Batch export error:', error);
    res.status(500).json({ success: false, error: '批量导出失败' });
  }
});

router.post('/enhance', async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, algorithm, strength } = req.body;

    if (!taskId || !tasks.has(taskId)) {
      res.status(400).json({ success: false, error: '无效的任务ID' });
      return;
    }

    const task = tasks.get(taskId)!;
    const sourcePath = task.invertedPath || task.originalPath;
    const algo = algorithm === 'laplacian' ? 'laplacian' : 'sobel';
    const str = parseFloat(strength) || 1.0;

    const enhancedFilename = `enhanced_${path.basename(sourcePath)}`;
    const enhancedPath = path.join(uploadsDir, enhancedFilename);

    await enhanceEdges(sourcePath, enhancedPath, algo, str);

    task.enhancedPath = enhancedPath;

    res.json({
      success: true,
      taskId,
      enhancedUrl: `/uploads/${enhancedFilename}`,
      algorithm: algo,
      strength: str,
    });
  } catch (error) {
    console.error('Enhance error:', error);
    res.status(500).json({ success: false, error: '边缘增强处理失败' });
  }
});

router.get('/export/:taskId', (req: Request, res: Response): void => {
  try {
    const { taskId } = req.params;

    if (!tasks.has(taskId)) {
      res.status(404).json({ success: false, error: '任务不存在' });
      return;
    }

    const task = tasks.get(taskId)!;
    const exportPath = task.enhancedPath || task.invertedPath || task.originalPath;

    if (!exportPath || !fs.existsSync(exportPath)) {
      res.status(404).json({ success: false, error: '导出文件不存在' });
      return;
    }

    res.download(exportPath, `wadang_inverted_${taskId}.png`);
  } catch (error) {
    res.status(500).json({ success: false, error: '导出失败' });
  }
});

router.post('/recommend', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    let imageFeatures;

    if (req.file) {
      imageFeatures = await detectPatternType(req.file.path);
    } else if (req.body.taskId && tasks.has(req.body.taskId)) {
      const task = tasks.get(req.body.taskId)!;
      if (task.features) {
        imageFeatures = task.features;
      } else {
        const sourcePath = task.originalPath;
        imageFeatures = await detectPatternType(sourcePath);
      }
    } else if (req.body.imageBase64) {
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const tempPath = path.join(uploadsDir, `temp_rec_${uuidv4()}.png`);
      fs.writeFileSync(tempPath, buffer);
      try {
        imageFeatures = await detectPatternType(tempPath);
      } finally {
        try { fs.unlinkSync(tempPath); } catch {}
      }
    } else {
      res.status(400).json({ success: false, error: '请上传图片或提供有效的任务ID' });
      return;
    }

    const recommendations = recommendPatterns(imageFeatures);

    res.json({
      success: true,
      imageFeatures,
      recommendations,
    });
  } catch (error) {
    console.error('Recommend error:', error);
    res.status(500).json({ success: false, error: '纹饰推荐分析失败' });
  }
});

export default router;
