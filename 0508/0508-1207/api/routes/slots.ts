import { Router } from 'express';
import {
  addSlot,
  interviews,
  listInterviewsByClub,
  removeSlot,
  slots,
} from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const clubId = req.query.clubId ? Number(req.query.clubId) : undefined;
  const list = slots
    .filter((s) => (clubId ? s.clubId === clubId : true))
    .map((s) => ({
      ...s,
      used: interviews.filter((i) => i.slotId === s.id).length,
    }))
    .sort((a, b) =>
      a.date === b.date
        ? a.startTime.localeCompare(b.startTime)
        : a.date.localeCompare(b.date),
    );
  res.json({ success: true, slots: list });
});

router.post('/', (req, res) => {
  const { clubId, date, startTime, endTime, capacity, location } = req.body as {
    clubId?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
    capacity?: number;
    location?: string;
  };
  if (!clubId || !date || !startTime || !endTime || !capacity || !location) {
    res.status(400).json({ success: false, error: '请填写完整信息' });
    return;
  }
  const s = addSlot({
    clubId,
    date,
    startTime,
    endTime,
    capacity,
    location,
  });
  res.json({ success: true, slot: s });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  removeSlot(id);
  res.json({ success: true });
});

router.get('/interviews', (req, res) => {
  const clubId = req.query.clubId ? Number(req.query.clubId) : undefined;
  if (!clubId) {
    res.status(400).json({ success: false, error: '缺少 clubId' });
    return;
  }
  const list = listInterviewsByClub(clubId).map(({ interview, slot, app }) => ({
    interview,
    slot,
    application: app,
  }));
  res.json({ success: true, interviews: list });
});

export default router;
