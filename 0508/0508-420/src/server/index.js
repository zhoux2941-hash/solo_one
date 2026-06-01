const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const nodes = new Map();

io.on('connection', (socket) => {
  console.log('节点连接:', socket.id);

  socket.on('register', (data) => {
    const nodeInfo = {
      id: socket.id,
      name: data.name,
      ip: data.ip,
      port: data.port,
      online: true,
      socket
    };
    nodes.set(socket.id, nodeInfo);
    broadcastNodeList();
    console.log('节点注册:', data.name, data.ip);
  });

  socket.on('get-nodes', () => {
    const nodeList = Array.from(nodes.values())
      .filter(n => n.id !== socket.id)
      .map(n => ({
        id: n.id,
        name: n.name,
        ip: n.ip,
        port: n.port,
        online: n.online
      }));
    socket.emit('nodes-list', nodeList);
  });

  socket.on('signal', (data) => {
    const target = nodes.get(data.targetId);
    if (target) {
      target.socket.emit('signal', {
        from: socket.id,
        signal: data.signal,
        fromName: nodes.get(socket.id)?.name || '未知节点'
      });
    }
  });

  socket.on('signal-answer', (data) => {
    const target = nodes.get(data.targetId);
    if (target) {
      target.socket.emit('signal-answer', {
        from: socket.id,
        signal: data.signal
      });
    }
  });

  socket.on('disconnect', () => {
    nodes.delete(socket.id);
    broadcastNodeList();
    console.log('节点断开:', socket.id);
  });
});

function broadcastNodeList() {
  const nodeList = Array.from(nodes.values()).map(n => ({
    id: n.id,
    name: n.name,
    ip: n.ip,
    port: n.port,
    online: n.online
  }));
  io.emit('nodes-update', nodeList);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`信令服务器运行在端口 ${PORT}`);
});
