const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../client')));

const db = require('./models');
const batchRoutes = require('./routes/batches');
const timelineRoutes = require('./routes/timeline');
const lossRoutes = require('./routes/loss');
const reportRoutes = require('./routes/reports');

app.use('/api/batches', batchRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/loss', lossRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '换浆损耗复盘系统服务运行中' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

db.sequelize.sync().then(async () => {
  console.log('数据库连接成功');
  const initData = require('./initData');
  await initData.initSampleData();
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('数据库连接失败:', err);
});

module.exports = app;