import express from 'express';
import { mockSpecimens } from '../../shared/mockData';
import type { Specimen, Position } from '../../shared/types';

const router = express.Router();

let specimensData = [...mockSpecimens];

router.get('/', (req, res) => {
  const { status, cabinetId } = req.query;
  let filtered = specimensData;
  
  if (status) {
    filtered = filtered.filter(s => s.status === status);
  }
  if (cabinetId) {
    filtered = filtered.filter(s => s.originalCabinetId === cabinetId);
  }
  
  res.json({ success: true, data: filtered });
});

router.get('/:id', (req, res) => {
  const specimen = specimensData.find(s => s.id === req.params.id);
  if (!specimen) {
    return res.status(404).json({ success: false, message: '标本不存在' });
  }
  res.json({ success: true, data: specimen });
});

router.put('/:id/position', (req, res) => {
  const { position } = req.body as { position: Position };
  const index = specimensData.findIndex(s => s.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: '标本不存在' });
  }
  
  specimensData[index] = {
    ...specimensData[index],
    currentPosition: position,
  };
  
  res.json({ 
    success: true, 
    data: specimensData[index],
    message: '位置已更新' 
  });
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body as { status: Specimen['status'] };
  const index = specimensData.findIndex(s => s.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: '标本不存在' });
  }
  
  specimensData[index] = {
    ...specimensData[index],
    status,
  };
  
  res.json({ 
    success: true, 
    data: specimensData[index],
    message: '状态已更新' 
  });
});

export default router;
