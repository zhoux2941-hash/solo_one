const { Server } = require('socket.io');
const http = require('http');
const config = require('../config');
const logger = require('../utils/logger');
const framePipeline = require('./framePipeline');
const zmqClient = require('./zmqClient');

class WebSocketService {
  constructor() {
    this.io = null;
    this.statsPushInterval = null;
    this.connectedClients = new Map();
  }

  attach(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this._setupHandlers();
    this._startStatsPush();

    framePipeline.on('frame:available', (frameData) => {
      this._broadcastFrame(frameData);
    });

    framePipeline.on('stats:update', (stats) => {
      this._broadcastStats(stats);
    });

    logger.info('WebSocket service attached');
  }

  _setupHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { clientId: socket.id });
      
      this.connectedClients.set(socket.id, {
        id: socket.id,
        subscribedStreams: new Set(),
        connectedAt: Date.now()
      });

      socket.on('stream:subscribe', (streamId) => {
        this._subscribeToStream(socket, streamId);
      });

      socket.on('stream:unsubscribe', (streamId) => {
        this._unsubscribeFromStream(socket, streamId);
      });

      socket.on('stream:list', () => {
        const streams = framePipeline.getActiveStreams();
        socket.emit('stream:list', { success: true, streams });
      });

      socket.on('stats:request', (streamId = null) => {
        const stats = framePipeline.getStreamStats(streamId);
        socket.emit('stats:update', { success: true, stats, streamId });
      });

      socket.on('system:stats', async () => {
        const result = await zmqClient.getStats();
        if (result && result.success) {
          socket.emit('system:stats', {
            success: true,
            serverStats: result.server_stats,
            streamStats: result.stats
          });
        }
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { clientId: socket.id });
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.subscribedStreams.forEach(streamId => {
            framePipeline.removeViewer(streamId, socket.id);
          });
        }
        this.connectedClients.delete(socket.id);
      });
    });
  }

  _subscribeToStream(socket, streamId) {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    const streams = framePipeline.getActiveStreams();
    const streamExists = streams.some(s => s.streamId === streamId);

    if (!streamExists) {
      socket.emit('stream:error', { 
        success: false, 
        error: `Stream ${streamId} not found` 
      });
      return;
    }

    client.subscribedStreams.add(streamId);
    framePipeline.addViewer(streamId, socket.id);
    
    socket.join(`stream:${streamId}`);
    
    logger.info('Client subscribed to stream', { 
      clientId: socket.id, 
      streamId 
    });

    socket.emit('stream:subscribed', { 
      success: true, 
      streamId,
      stats: framePipeline.getStreamStats(streamId)
    });
  }

  _unsubscribeFromStream(socket, streamId) {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    client.subscribedStreams.delete(streamId);
    framePipeline.removeViewer(streamId, socket.id);
    socket.leave(`stream:${streamId}`);

    logger.info('Client unsubscribed from stream', { 
      clientId: socket.id, 
      streamId 
    });

    socket.emit('stream:unsubscribed', { success: true, streamId });
  }

  _broadcastFrame(frameData) {
    const { streamId, frame, ...metadata } = frameData;
    
    this.io.to(`stream:${streamId}`).emit('frame:data', {
      streamId,
      frame: frame.toString('base64'),
      ...metadata
    });
  }

  _broadcastStats(stats) {
    this.io.emit('stats:update', {
      success: true,
      stats,
      timestamp: Date.now()
    });
  }

  _startStatsPush() {
    this.statsPushInterval = setInterval(async () => {
      try {
        const streamStats = framePipeline.getStreamStats();
        const pythonStats = await zmqClient.getStats();

        const systemStats = {
          timestamp: Date.now(),
          streamStats,
          serverStats: pythonStats?.server_stats || {},
          pythonStats: pythonStats?.stats || {},
          connectedClients: this.connectedClients.size
        };

        this.io.emit('system:stats', systemStats);
      } catch (error) {
        logger.error('Stats push error', { error: error.message });
      }
    }, 1000);
  }

  stop() {
    if (this.statsPushInterval) {
      clearInterval(this.statsPushInterval);
    }
    if (this.io) {
      this.io.close();
    }
    logger.info('WebSocket service stopped');
  }

  getConnectedClients() {
    return this.connectedClients.size;
  }
}

const websocketService = new WebSocketService();
module.exports = websocketService;
