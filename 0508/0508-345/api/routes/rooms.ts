import { Router, Request, Response } from 'express';
import { rooms } from '../data/store.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json(rooms);
});

export default router;
