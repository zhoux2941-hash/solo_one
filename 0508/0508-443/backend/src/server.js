const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs-extra');

const config = require('./config');
const db = require('./database');
const streamMonitor = require('./modules/streamMonitor');
const streamRecorder = require('./modules/streamRecorder');
const alertManager = require('./modules/alertManager');
const tsAnalyzer = require('./modules/tsAnalyzer');

const streamsRouter = require('./routes/streams');
const alertsRouter = require('./routes/alerts');
const recordingsRouter = require('./routes/recordings');
const analyzeRouter = require('./routes/analyze');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

fs.ensureDirSync(config.recordingsDir);
fs.ensureDirSync(config.uploadsDir);

app.use('/api/streams', streamsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/recordings', recordingsRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/recordings', express.static(config.recordingsDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

streamMonitor.setSocketIO(io);
alertManager.setSocketIO(io);
streamRecorder.setSocketIO(io);

db.init().then(() => {
  console.log('Database initialized');
  return streamMonitor.loadStreamsFromDB();
}).then(() => {
  console.log('Streams loaded');
  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}).catch(err => {
  console.error('Initialization error:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await streamMonitor.stopAllMonitors();
  await streamRecorder.stopAllRecordings();
  await db.close();
  process.exit(0);
});

module.exports = { app, server, io };
