const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function broadcastToRoom(roomId, message, excludeId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.users.forEach((user, userId) => {
    if (userId !== excludeId && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', (ws) => {
  let userId = Math.random().toString(36).substring(2, 10);
  let currentRoomId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'create-room':
          const newRoomId = generateRoomId();
          rooms.set(newRoomId, {
            id: newRoomId,
            users: new Map(),
            createdAt: Date.now()
          });
          
          ws.send(JSON.stringify({
            type: 'room-created',
            roomId: newRoomId,
            userId
          }));
          break;

        case 'join-room':
          const { roomId } = message;
          const room = rooms.get(roomId);
          
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: '房间不存在' }));
            return;
          }

          if (room.users.size >= 5) {
            ws.send(JSON.stringify({ type: 'error', message: '房间已满（最多5人）' }));
            return;
          }

          currentRoomId = roomId;
          room.users.set(userId, { ws, userId });

          const userList = Array.from(room.users.keys()).filter(id => id !== userId);
          
          ws.send(JSON.stringify({
            type: 'room-joined',
            roomId,
            userId,
            users: userList
          }));

          broadcastToRoom(roomId, {
            type: 'user-joined',
            userId
          }, userId);
          break;

        case 'signal':
          if (!currentRoomId) return;
          broadcastToRoom(currentRoomId, {
            type: 'signal',
            from: userId,
            to: message.to,
            data: message.data
          }, userId);
          break;

        case 'leave-room':
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              room.users.delete(userId);
              broadcastToRoom(currentRoomId, {
                type: 'user-left',
                userId
              }, userId);
              
              if (room.users.size === 0) {
                rooms.delete(currentRoomId);
              }
            }
            currentRoomId = null;
          }
          break;
      }
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  ws.on('close', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.users.delete(userId);
        broadcastToRoom(currentRoomId, {
          type: 'user-left',
          userId
        }, userId);
        
        if (room.users.size === 0) {
          rooms.delete(currentRoomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
