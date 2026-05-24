import express from 'express';
import { mockCabinets, mockCabinetVersions } from '../../shared/mockData';

const router = express.Router();

const cabinetsData = [...mockCabinets];
let cabinetVersionsData = [...mockCabinetVersions];

router.get('/', (req, res) => {
  res.json({ success: true, data: cabinetsData });
});

router.get('/:id', (req, res) => {
  const cabinet = cabinetsData.find(c => c.id === req.params.id);
  if (!cabinet) {
    return res.status(404).json({ success: false, message: '柜位不存在' });
  }
  res.json({ success: true, data: cabinet });
});

router.get('/:id/versions', (req, res) => {
  const versions = cabinetVersionsData.filter(v => v.cabinetId === req.params.id);
  res.json({ success: true, data: versions });
});

router.get('/:id/versions/latest', (req, res) => {
  const versions = cabinetVersionsData.filter(v => v.cabinetId === req.params.id);
  const latest = versions.sort((a, b) => b.version - a.version)[0];
  
  if (!latest) {
    return res.status(404).json({ success: false, message: '未找到版本记录' });
  }
  
  res.json({ success: true, data: latest });
});

router.post('/:id/versions', (req, res) => {
  const cabinet = cabinetsData.find(c => c.id === req.params.id);
  if (!cabinet) {
    return res.status(404).json({ success: false, message: '柜位不存在' });
  }
  
  const currentVersions = cabinetVersionsData.filter(v => v.cabinetId === req.params.id);
  const newVersion = {
    id: `ver-${Date.now()}`,
    version: (currentVersions.length || 0) + 1,
    cabinetId: req.params.id,
    cabinetName: cabinet.name,
    layout: req.body.layout,
    createdAt: new Date().toISOString(),
    createdBy: req.body.createdBy || '系统',
    note: req.body.note,
  };
  
  cabinetVersionsData.push(newVersion);
  res.status(201).json({ success: true, data: newVersion, message: '版本已创建' });
});

export default router;
