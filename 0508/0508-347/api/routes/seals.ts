import express from 'express';
import { mockSeals } from '../../shared/mockData';

const router = express.Router();

let sealsData = [...mockSeals];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = sealsData;
  
  if (status) {
    filtered = filtered.filter(s => s.status === status);
  }
  
  res.json({ success: true, data: filtered });
});

router.get('/:id', (req, res) => {
  const seal = sealsData.find(s => s.id === req.params.id);
  if (!seal) {
    return res.status(404).json({ success: false, message: '封签不存在' });
  }
  res.json({ success: true, data: seal });
});

router.post('/', (req, res) => {
  const newSeal = {
    id: `seal-${Date.now()}`,
    ...req.body,
    sealedAt: new Date().toISOString(),
  };
  sealsData.push(newSeal);
  res.status(201).json({ success: true, data: newSeal, message: '封签已创建' });
});

router.put('/:id/unseal', (req, res) => {
  const index = sealsData.findIndex(s => s.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: '封签不存在' });
  }
  
  sealsData[index] = {
    ...sealsData[index],
    status: 'unsealed' as const,
    unsealedAt: new Date().toISOString(),
  };
  
  res.json({ 
    success: true, 
    data: sealsData[index],
    message: '封签已解封' 
  });
});

export default router;
