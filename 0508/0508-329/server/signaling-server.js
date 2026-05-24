import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import http from 'http';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map();
const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function broadcastToRoom(roomId, message, excludeId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.forEach(clientId => {
    if (clientId !== excludeId) {
      const client = clients.get(clientId);
      if (client && client.ws.readyState === 1) {
        client.ws.send(JSON.stringify(message));
      }
    }
  });
}

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substring(2, 10);
  console.log(`[${new Date().toISOString()}] Client connected: ${clientId}`);

  clients.set(clientId, {
    ws,
    roomId: null,
    role: null
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(clientId, message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    const client = clients.get(clientId);
    if (client && client.roomId) {
      const room = rooms.get(client.roomId);
      if (room) {
        room.delete(clientId);
        broadcastToRoom(client.roomId, {
          type: 'peer-disconnected',
          peerId: clientId,
          role: client.role
        });
        
        if (room.size === 0) {
          rooms.delete(client.roomId);
          console.log(`Room ${client.roomId} deleted (empty)`);
        }
      }
    }
    clients.delete(clientId);
    console.log(`[${new Date().toISOString()}] Client disconnected: ${clientId}`);
  });

  ws.onerror = (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  };
});

function handleMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'create-room':
      const roomId = generateRoomId();
      rooms.set(roomId, new Set([clientId]));
      client.roomId = roomId;
      client.role = message.role || 'surgeon';
      
      client.ws.send(JSON.stringify({
        type: 'room-created',
        roomId,
        clientId
      }));
      console.log(`Room created: ${roomId} by ${clientId} (${client.role})`);
      break;

    case 'join-room':
      const joinRoomId = message.roomId.toUpperCase();
      const targetRoom = rooms.get(joinRoomId);
      
      if (!targetRoom) {
        client.ws.send(JSON.stringify({
          type: 'error',
          message: 'Room not found'
        }));
        return;
      }

      if (targetRoom.size >= 2) {
        client.ws.send(JSON.stringify({
          type: 'error',
          message: 'Room is full'
        }));
        return;
      }

      targetRoom.add(clientId);
      client.roomId = joinRoomId;
      client.role = message.role || 'expert';

      const peers = [];
      targetRoom.forEach(id => {
        if (id !== clientId) {
          peers.push({
            id,
            role: clients.get(id)?.role
          });
        }
      });

      client.ws.send(JSON.stringify({
        type: 'joined-room',
        roomId: joinRoomId,
        clientId,
        peers
      }));

      broadcastToRoom(joinRoomId, {
        type: 'peer-joined',
        peerId: clientId,
        role: client.role
      }, clientId);
      
      console.log(`Client ${clientId} joined room ${joinRoomId}`);
      break;

    case 'offer':
    case 'answer':
    case 'ice-candidate':
      broadcastToRoom(client.roomId, {
        ...message,
        from: clientId
      }, clientId);
      break;

    case 'annotation':
      broadcastToRoom(client.roomId, {
        type: 'annotation',
        data: message.data,
        timestamp: Date.now(),
        from: clientId
      }, clientId);
      break;

    case 'clear-annotations':
      broadcastToRoom(client.roomId, {
        type: 'clear-annotations',
        from: clientId
      }, clientId);
      break;

    case 'sync-request':
      broadcastToRoom(client.roomId, {
        type: 'sync-request',
        timestamp: message.timestamp,
        from: clientId
      }, clientId);
      break;

    case 'sync-response':
      const targetClient = clients.get(message.to);
      if (targetClient) {
        targetClient.ws.send(JSON.stringify({
          type: 'sync-response',
          requestTime: message.requestTime,
          responseTime: Date.now(),
          from: clientId
        }));
      }
      break;

    default:
      console.log('Unknown message type:', message.type);
  }
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    clients: clients.size
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
