import { Router } from 'express';
import type { ConstellationService } from '../services/constellationService';

export const createConstellationRouter = (constellationService: ConstellationService): Router => {
  const router = Router();

  router.get('/', (req, res) => {
    try {
      const type = req.query.type as string | undefined;

      if (type && !['san-yuan', 'er-shi-ba-xiu', 'other'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type parameter. Must be one of: san-yuan, er-shi-ba-xiu, other' });
      }

      const constellations = constellationService.getAllConstellations(type);
      res.json(constellations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch constellations' });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid constellation ID' });
      }

      const constellation = constellationService.getConstellationById(id);

      if (!constellation) {
        return res.status(404).json({ error: 'Constellation not found' });
      }

      res.json(constellation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch constellation' });
    }
  });

  router.get('/name/:name', (req, res) => {
    try {
      const name = decodeURIComponent(req.params.name);

      if (!name) {
        return res.status(400).json({ error: 'Constellation name is required' });
      }

      const constellation = constellationService.getConstellationByName(name);

      if (!constellation) {
        return res.status(404).json({ error: 'Constellation not found' });
      }

      res.json(constellation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch constellation' });
    }
  });

  router.get('/mansion/:mansion', (req, res) => {
    try {
      const mansion = decodeURIComponent(req.params.mansion);

      if (!mansion) {
        return res.status(400).json({ error: 'Mansion name is required' });
      }

      const constellations = constellationService.getConstellationsByMansion(mansion);
      res.json(constellations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch constellations by mansion' });
    }
  });

  return router;
};
