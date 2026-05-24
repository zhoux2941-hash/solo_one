import { Router, Request, Response } from 'express';
import { escorts } from '../data/store.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json(escorts);
});

export default router;
