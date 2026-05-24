import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { SaveVersionRequest, SaveVersionResponse, VersionRecord } from '../../shared/types';

const router = Router();

interface VersionStorage {
  records: VersionRecord[];
}

const versionStorage: VersionStorage = {
  records: [],
};

router.post('/save', (req: Request<unknown, unknown, SaveVersionRequest>, res: Response<SaveVersionResponse>) => {
  const { layerData, operator, description, snapshot } = req.body;

  if (!layerData || !operator) {
    return res.status(400).json({
      success: false,
      versionId: '',
      timestamp: '',
    } as SaveVersionResponse);
  }

  const versionId = uuidv4();
  const timestamp = new Date().toISOString();

  const record: VersionRecord = {
    id: versionId,
    timestamp,
    operator,
    description: description || '',
    layerData,
    snapshotUrl: snapshot,
  };

  versionStorage.records.unshift(record);

  if (versionStorage.records.length > 100) {
    versionStorage.records = versionStorage.records.slice(0, 100);
  }

  res.json({
    success: true,
    versionId,
    timestamp,
  });
});

router.get('/list', (req: Request, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const records = versionStorage.records.slice(startIndex, endIndex);

  res.json({
    success: true,
    records,
    total: versionStorage.records.length,
    page,
    pageSize,
  });
});

router.get('/:id', (req: Request<{ id: string }>, res) => {
  const { id } = req.params;
  const record = versionStorage.records.find((r) => r.id === id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Version not found',
    });
  }

  res.json({
    success: true,
    record,
  });
});

router.delete('/:id', (req: Request<{ id: string }>, res) => {
  const { id } = req.params;
  const index = versionStorage.records.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Version not found',
    });
  }

  versionStorage.records.splice(index, 1);

  res.json({
    success: true,
    message: 'Version deleted',
  });
});

export default router;
