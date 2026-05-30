import { Router } from 'express';
import type { StarService } from '../services/starService';

export const createStarRouter = (starService: StarService): Router => {
  const router = Router();

  router.get('/', (req, res) => {
    try {
      const magnitudeLte = req.query.magnitude_lte !== undefined
        ? parseFloat(req.query.magnitude_lte as string)
        : undefined;

      if (magnitudeLte !== undefined && isNaN(magnitudeLte)) {
        return res.status(400).json({ error: 'Invalid magnitude_lte parameter' });
      }

      const stars = starService.getAllStars(magnitudeLte);
      res.json(stars);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stars' });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid star ID' });
      }

      const star = starService.getStarById(id);

      if (!star) {
        return res.status(404).json({ error: 'Star not found' });
      }

      res.json(star);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch star' });
    }
  });

  router.get('/constellation/:constellationId', (req, res) => {
    try {
      const constellationId = parseInt(req.params.constellationId, 10);

      if (isNaN(constellationId)) {
        return res.status(400).json({ error: 'Invalid constellation ID' });
      }

      const stars = starService.getStarsByConstellation(constellationId);
      res.json(stars);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stars by constellation' });
    }
  });

  router.get('/xingguan/:xingguan', (req, res) => {
    try {
      const xingguan = req.params.xingguan;

      if (!xingguan) {
        return res.status(400).json({ error: 'Xingguan name is required' });
      }

      const stars = starService.getStarsByXingguan(xingguan);
      res.json(stars);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stars by xingguan' });
    }
  });

  return router;
};
