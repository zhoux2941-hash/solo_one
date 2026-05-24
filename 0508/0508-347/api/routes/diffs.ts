import express from 'express';
import { mockDiffs } from '../../shared/mockData';

const router = express.Router();

let diffsData = [...mockDiffs];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = diffsData;
  
  if (status) {
    filtered = filtered.filter(d => d.status === status);
  }
  
  res.json({ success: true, data: filtered });
});

router.get('/:id', (req, res) => {
  const diff = diffsData.find(d => d.id === req.params.id);
  if (!diff) {
    return res.status(404).json({ success: false, message: '差异记录不存在' });
  }
  res.json({ success: true, data: diff });
});

router.post('/', (req, res) => {
  const newDiff = {
    id: `diff-${Date.now()}`,
    ...req.body,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };
  diffsData.push(newDiff);
  res.status(201).json({ success: true, data: newDiff, message: '差异已记录' });
});

router.put('/:id/resolve', (req, res) => {
  const index = diffsData.findIndex(d => d.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: '差异记录不存在' });
  }
  
  diffsData[index] = {
    ...diffsData[index],
    status: 'resolved' as const,
    resolvedAt: new Date().toISOString(),
    resolvedBy: req.body.resolvedBy || '系统',
    notes: req.body.notes,
  };
  
  res.json({ 
    success: true, 
    data: diffsData[index],
    message: '差异已解决' 
  });
});

router.put('/:id/approve', (req, res) => {
  const index = diffsData.findIndex(d => d.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: '差异记录不存在' });
  }
  
  diffsData[index] = {
    ...diffsData[index],
    status: 'approved' as const,
  };
  
  res.json({ 
    success: true, 
    data: diffsData[index],
    message: '差异已批准' 
  });
});

export default router;
