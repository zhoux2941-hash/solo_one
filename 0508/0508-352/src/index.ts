import express from 'express';
import routes from './routes';
import { backgroundTaskService } from './services/BackgroundTaskService';
import { archiveStore } from './store';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    path: req.path,
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  危化车洗消归档服务已启动                                   ║
║  Hazardous Vehicle Wash Archive Service                    ║
║                                                            ║
║  服务地址: http://${HOST}:${PORT}                         ║
║  API 前缀: /api                                            ║
║  健康检查: GET /api/health                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  backgroundTaskService.start();
});

const gracefulShutdown = (signal: string) => {
  console.log(`\n收到 ${signal} 信号，正在优雅关闭服务...`);

  backgroundTaskService.stop();
  archiveStore.forcePersist();
  archiveStore.stopAutoPersist();

  server.close((err) => {
    if (err) {
      console.error('关闭服务时出错:', err);
      process.exit(1);
    }
    console.log('服务已成功关闭');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('强制关闭服务（超时）');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server, gracefulShutdown };
export default app;
