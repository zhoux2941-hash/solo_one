const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const db = require('./database');
const flashService = require('./services/flashService');
const serialRouter = require('./routes/serial');
const firmwareRouter = require('./routes/firmware');
const flashRouter = require('./routes/flash');
const userRouter = require('./routes/user');
const logRouter = require('./routes/log');
const deviceRouter = require('./routes/device');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => {
  req.io = io;
  req.db = db;
  next();
});

app.use('/api/serial', serialRouter);
app.use('/api/firmware', firmwareRouter);
app.use('/api/flash', flashRouter);
app.use('/api/user', userRouter);
app.use('/api/log', logRouter);
app.use('/api/device', deviceRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3000;
let serverInstance;

async function startServer() {
  try {
    await db.init();
    console.log('Database initialized successfully');
    
    flashService.initScheduler(db, io);
    console.log('Flash scheduler initialized successfully');
    
    serverInstance = server.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running on http://127.0.0.1:${PORT}`);
    });
    
    return serverInstance;
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

function stopServer() {
  if (serverInstance) {
    serverInstance.close();
    console.log('Server stopped');
  }
  db.close();
}

module.exports = { startServer, stopServer, io };