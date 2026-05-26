import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { AppDataSource } from './data-source';
import { seedDatabase } from './seed';
import authRoutes from './routes/auth';
import paperRoutes from './routes/papers';
import reviewRoutes from './routes/reviews';
import chairRoutes from './routes/chair';

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chair', chairRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '学术会议投稿系统 API 运行正常' });
});

AppDataSource.initialize()
  .then(async () => {
    console.log('数据库连接成功');
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('数据库连接失败:', error);
    process.exit(1);
  });
