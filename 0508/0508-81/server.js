const http = require('http');
const { Server } = require('socket.io');

class ScreenShareServer {
  constructor(port = 3000) {
    this.port = port;
    this.server = null;
    this.io = null;
    this.clients = new Map();
    this.currentScreen = null;
    this.drawingHistory = [];
    this.hostId = null;
    this.MAX_DRAWING_HISTORY = 5000;
    this.lastScreenTime = 0;
    this.MIN_SCREEN_INTERVAL = 500;
    this.fileTransfers = new Map();
    this.chatHistory = [];
    this.MAX_CHAT_HISTORY = 100;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer();
      this.io = new Server(this.server, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        }
      });

      this.io.on('connection', (socket) => {
        console.log('客户端连接:', socket.id);

        if (!this.hostId) {
          this.hostId = socket.id;
          socket.emit('role', 'host');
        } else {
          socket.emit('role', 'client');
        }

        this.clients.set(socket.id, {
          id: socket.id,
          name: `用户${this.clients.size + 1}`,
          joinTime: Date.now()
        });

        socket.emit('clientList', Array.from(this.clients.values()));
        socket.broadcast.emit('clientJoined', this.clients.get(socket.id));

        if (this.currentScreen) {
          socket.emit('screenUpdate', this.currentScreen);
        }

        if (this.drawingHistory.length > 0) {
          socket.emit('drawingHistory', this.drawingHistory);
        }

        if (this.chatHistory.length > 0) {
          socket.emit('chatHistory', this.chatHistory);
        }

        socket.on('setName', (name) => {
          const client = this.clients.get(socket.id);
          if (client) {
            client.name = name;
            this.io.emit('clientList', Array.from(this.clients.values()));
          }
        });

        socket.on('screenUpdate', (data) => {
          if (socket.id === this.hostId) {
            const now = Date.now();
            if (now - this.lastScreenTime >= this.MIN_SCREEN_INTERVAL) {
              this.lastScreenTime = now;
              this.currentScreen = data;
              socket.broadcast.emit('screenUpdate', data);
            }
          }
        });

        socket.on('drawing', (data) => {
          const drawData = {
            ...data,
            clientId: socket.id,
            timestamp: Date.now()
          };
          
          this.drawingHistory.push(drawData);
          
          if (this.drawingHistory.length > this.MAX_DRAWING_HISTORY) {
            this.drawingHistory = this.drawingHistory.slice(
              -Math.floor(this.MAX_DRAWING_HISTORY * 0.5)
            );
          }
          
          socket.broadcast.emit('drawing', drawData);
        });

        socket.on('strokeEnd', (data) => {
          socket.broadcast.emit('strokeEnd', data);
        });

        socket.on('clearDrawings', () => {
          if (socket.id === this.hostId) {
            this.drawingHistory = [];
            this.io.emit('clearDrawings');
          }
        });

        socket.on('kickClient', (clientId) => {
          if (socket.id === this.hostId && clientId !== this.hostId) {
            const targetSocket = this.io.sockets.sockets.get(clientId);
            if (targetSocket) {
              targetSocket.emit('kicked');
              targetSocket.disconnect();
              this.clients.delete(clientId);
              this.io.emit('clientLeft', clientId);
              this.io.emit('clientList', Array.from(this.clients.values()));
            }
          }
        });

        socket.on('chatMessage', (data) => {
          const sender = this.clients.get(socket.id);
          const message = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            senderId: socket.id,
            senderName: sender ? sender.name : '匿名用户',
            content: data.content,
            timestamp: Date.now(),
            targetId: data.targetId || null,
            targetName: data.targetName || null
          };

          this.chatHistory.push(message);
          if (this.chatHistory.length > this.MAX_CHAT_HISTORY) {
            this.chatHistory.shift();
          }

          if (data.targetId) {
            const targetSocket = this.io.sockets.sockets.get(data.targetId);
            if (targetSocket) {
              targetSocket.emit('chatMessage', message);
            }
            socket.emit('chatMessage', message);
          } else {
            this.io.emit('chatMessage', message);
          }
        });

        socket.on('fileTransferStart', (data) => {
          const transferId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          const sender = this.clients.get(socket.id);
          
          this.fileTransfers.set(transferId, {
            id: transferId,
            senderId: socket.id,
            senderName: sender ? sender.name : '匿名用户',
            targetId: data.targetId,
            targetName: data.targetName,
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileType: data.fileType,
            totalChunks: data.totalChunks,
            receivedChunks: 0,
            chunks: []
          });

          if (data.targetId) {
            const targetSocket = this.io.sockets.sockets.get(data.targetId);
            if (targetSocket) {
              targetSocket.emit('fileTransferStart', {
                ...this.fileTransfers.get(transferId),
                transferId
              });
            }
          }

          socket.emit('fileTransferReady', { transferId });
        });

        socket.on('fileChunk', (data) => {
          const transfer = this.fileTransfers.get(data.transferId);
          if (!transfer) return;

          transfer.chunks.push(data.chunk);
          transfer.receivedChunks++;

          if (data.targetId) {
            const targetSocket = this.io.sockets.sockets.get(data.targetId);
            if (targetSocket) {
              targetSocket.emit('fileChunk', {
                transferId: data.transferId,
                chunk: data.chunk,
                chunkIndex: data.chunkIndex,
                totalChunks: transfer.totalChunks,
                receivedChunks: transfer.receivedChunks
              });
            }
          }

          if (transfer.receivedChunks >= transfer.totalChunks) {
            if (data.targetId) {
              const targetSocket = this.io.sockets.sockets.get(data.targetId);
              if (targetSocket) {
                targetSocket.emit('fileTransferComplete', {
                  transferId: data.transferId,
                  fileName: transfer.fileName,
                  fileSize: transfer.fileSize,
                  fileType: transfer.fileType,
                  senderName: transfer.senderName
                });
              }
            }
            this.fileTransfers.delete(data.transferId);
          }
        });

        socket.on('fileTransferCancel', (data) => {
          this.fileTransfers.delete(data.transferId);
          if (data.targetId) {
            const targetSocket = this.io.sockets.sockets.get(data.targetId);
            if (targetSocket) {
              targetSocket.emit('fileTransferCancel', data);
            }
          }
        });

        socket.on('disconnect', () => {
          console.log('客户端断开:', socket.id);
          this.clients.delete(socket.id);
          
          if (socket.id === this.hostId) {
            this.hostId = null;
            this.currentScreen = null;
            this.io.emit('hostLeft');
          } else {
            socket.broadcast.emit('clientLeft', socket.id);
            socket.broadcast.emit('clientList', Array.from(this.clients.values()));
          }
        });
      });

      this.server.listen(this.port, '0.0.0.0', () => {
        console.log(`屏幕共享服务器运行在端口 ${this.port}`);
        resolve(this.port);
      });

      this.server.on('error', (err) => {
        reject(err);
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.io = null;
      this.clients.clear();
      this.currentScreen = null;
      this.drawingHistory = [];
      this.hostId = null;
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

module.exports = ScreenShareServer;
