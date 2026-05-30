import { Router } from 'express';
import type { ConnectionService } from '../services/connectionService';

export const createConnectionRouter = (connectionService: ConnectionService): Router => {
  const router = Router();

  router.get('/', (req, res) => {
    try {
      const constellationId = req.query.constellation_id !== undefined
        ? parseInt(req.query.constellation_id as string, 10)
        : undefined;

      if (constellationId !== undefined && isNaN(constellationId)) {
        return res.status(400).json({ error: 'Invalid constellation_id parameter' });
      }

      const connections = connectionService.getAllConnections(constellationId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch connections' });
    }
  });

  router.get('/constellation/:constellationId', (req, res) => {
    try {
      const constellationId = parseInt(req.params.constellationId, 10);

      if (isNaN(constellationId)) {
        return res.status(400).json({ error: 'Invalid constellation ID' });
      }

      const connections = connectionService.getConnectionsByConstellation(constellationId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch connections by constellation' });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid connection ID' });
      }

      const connection = connectionService.getConnectionById(id);

      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      res.json(connection);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch connection' });
    }
  });

  return router;
};
