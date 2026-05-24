import express from 'express';
import { mockAcceptances } from '../../shared/mockData';

const router = express.Router();

let acceptancesData = [...mockAcceptances];

router.get('/', (req, res) => {
  const { specimenId, condition } = req.query;
  let filtered = acceptancesData;
  
  if (specimenId) {
    filtered = filtered.filter(a => a.specimenId === specimenId);
  }
  if (condition) {
    filtered = filtered.filter(a => a.condition === condition);
  }
  
  res.json({ success: true, data: filtered });
});

router.get('/:id', (req, res) => {
  const acceptance = acceptancesData.find(a => a.id === req.params.id);
  if (!acceptance) {
    return res.status(404).json({ success: false, message: '验收记录不存在' });
  }
  res.json({ success: true, data: acceptance });
});

router.post('/', (req, res) => {
  const newAcceptance = {
    id: `acc-${Date.now()}`,
    ...req.body,
    acceptedAt: new Date().toISOString(),
  };
  acceptancesData.push(newAcceptance);
  res.status(201).json({ success: true, data: newAcceptance, message: '验收已记录' });
});

export default router;
