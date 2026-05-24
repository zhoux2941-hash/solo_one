import { Router, Request, Response } from 'express';
import { applications, addApplication, updateApplication, deleteApplication } from '../data/store.js';
import { checkConflicts } from '../services/conflictService.js';
import { approveApplication, rejectApplication } from '../services/approvalService.js';
import { ApplicationCreate, ApplicationUpdate } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json(applications);
});

router.post('/', (req: Request, res: Response) => {
  const data: ApplicationCreate = req.body;
  
  const conflict = checkConflicts(
    data.startTime,
    data.endTime,
    data.roomId,
    data.escorts
  );
  
  if (conflict.hasConflict) {
    return res.status(400).json({
      error: '存在资源冲突',
      conflict,
    });
  }

  const newApp = {
    id: `app-${Date.now()}`,
    ...data,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };
  
  addApplication(newApp);
  res.status(201).json(newApp);
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data: ApplicationUpdate = req.body;
  
  const existing = applications.find(a => a.id === id);
  if (!existing) {
    return res.status(404).json({ error: '申请不存在' });
  }

  if (data.startTime || data.endTime || data.roomId || data.escorts) {
    const conflict = checkConflicts(
      data.startTime || existing.startTime,
      data.endTime || existing.endTime,
      data.roomId || existing.roomId,
      data.escorts || existing.escorts,
      id
    );
    
    if (conflict.hasConflict) {
      return res.status(400).json({
        error: '存在资源冲突',
        conflict,
      });
    }
  }

  const updated = updateApplication(id, data);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: '申请不存在' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = deleteApplication(id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: '申请不存在' });
  }
});

router.post('/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = approveApplication(id);
  if (result.success && result.application) {
    res.json(result.application);
  } else if (result.conflict) {
    res.status(409).json({
      error: result.error,
      conflict: result.conflict,
    });
  } else {
    res.status(404).json({ error: result.error || '申请不存在' });
  }
});

router.post('/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const updated = rejectApplication(id, reason);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: '申请不存在' });
  }
});

export default router;
