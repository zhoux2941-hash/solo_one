import { Router } from 'express';
import { clubs } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ success: true, clubs });
});

export default router;
