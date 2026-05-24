import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface SnapshotRecord {
  id: string;
  timestamp: string;
  type: 'manual' | 'scheduled' | 'nightly';
  name: string;
  description?: string;
  imageUrl?: string;
  layerData?: unknown;
}

const snapshotStorage: SnapshotRecord[] = [];

router.post('/generate', (req: Request, res) => {
  const { type = 'manual', name, description, layerData } = req.body;

  const snapshotId = uuidv4();
  const timestamp = new Date().toISOString();

  const record: SnapshotRecord = {
    id: snapshotId,
    timestamp,
    type,
    name: name || `快照_${new Date().toLocaleDateString('zh-CN')}`,
    description,
    layerData,
    imageUrl: `/snapshots/${snapshotId}.png`,
  };

  snapshotStorage.unshift(record);

  if (snapshotStorage.length > 50) {
    snapshotStorage.pop();
  }

  res.json({
    success: true,
    snapshotId,
    timestamp,
    message: '快照生成成功',
  });
});

router.get('/list', (req: Request, res) => {
  const type = req.query.type as string;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  let filtered = snapshotStorage;
  if (type) {
    filtered = snapshotStorage.filter((s) => s.type === type);
  }

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const records = filtered.slice(startIndex, endIndex);

  res.json({
    success: true,
    records,
    total: filtered.length,
    page,
    pageSize,
  });
});

router.get('/nightly/latest', (req: Request, res) => {
  const nightlySnapshots = snapshotStorage.filter((s) => s.type === 'nightly');

  if (nightlySnapshots.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No nightly snapshots found',
    });
  }

  res.json({
    success: true,
    snapshot: nightlySnapshots[0],
  });
});

router.get('/:id', (req: Request<{ id: string }>, res) => {
  const { id } = req.params;
  const snapshot = snapshotStorage.find((s) => s.id === id);

  if (!snapshot) {
    return res.status(404).json({
      success: false,
      message: 'Snapshot not found',
    });
  }

  res.json({
    success: true,
    snapshot,
  });
});

router.delete('/:id', (req: Request<{ id: string }>, res) => {
  const { id } = req.params;
  const index = snapshotStorage.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Snapshot not found',
    });
  }

  snapshotStorage.splice(index, 1);

  res.json({
    success: true,
    message: 'Snapshot deleted',
  });
});

export default router;
