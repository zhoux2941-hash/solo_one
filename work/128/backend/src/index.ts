import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { redisManager, logger } from './utils';
import { roomManager } from './core';
import { SocketHandler } from './network';

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

async function main() {
  try {
    await redisManager.connect();
    await roomManager.loadRoomsFromRedis();
  } catch (error) {
    logger.warn('Redis connection failed, using in-memory storage only');
  }

  const app = express();
  app.use(cors({ origin: CORS_ORIGIN }));
  app.use(express.json());

  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const socketHandler = new SocketHandler(io);

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    socketHandler.handleConnection(socket);
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.get('/rooms', (req, res) => {
    const rooms = roomManager.listAvailableRooms().map(r => r.getPublicState());
    res.json({ rooms });
  });

  httpServer.listen(PORT, () => {
    logger.info(`Mahjong server running on port ${PORT}`);
    logger.info(`CORS origin: ${CORS_ORIGIN}`);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down...');
    await redisManager.disconnect();
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

main().catch((error) => {
  logger.error('Server startup failed:', error);
  process.exit(1);
});
