import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { startTracker, getCurrentPeerCount } from './tracker.js';
import { initStats, getStats, recordDownload, recordUpload, recordP2PHit, recordP2PMiss } from './stats.js';
import { createTorrentForFile, getTorrentFile, listResources, getResource } from './torrent-creator.js';
import { serveResource, upload } from './resource-server.js';
import { 
  initAnalytics, 
  recordAccess, 
  getTrendingResources, 
  getPredictedResourcesForUser,
  getOptimalPrePushTime,
  getResourceStats,
  getAllResourceStats,
  getAnalyticsSummary
} from './analytics.js';
import {
  initPrePush,
  registerEdgePeer,
  updatePeerHeartbeat,
  addToPrePushQueue,
  scheduleTrendingPrePush,
  scheduleUserPrePush,
  getPrePushStatus,
  getPrePushStats,
  cancelPrePush
} from './prepush.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const TRACKER_PORT = process.env.TRACKER_PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/sdk', express.static(path.join(__dirname, '../sdk')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

initStats();
initAnalytics();
initPrePush();

setInterval(() => {
  scheduleTrendingPrePush(5);
}, 300000);

app.get('/api/stats', (req, res) => {
  res.json(getStats());
});

app.get('/api/stats/resource/:infoHash', (req, res) => {
  const stats = getStats();
  const infoHash = req.params.infoHash;
  
  const resourceStats = stats.resources[infoHash] || {
    p2pHits: 0,
    p2pMisses: 0,
    p2pDownloaded: 0,
    cdnDownloaded: 0,
    uploaded: 0,
    peers: 0
  };
  
  const currentPeers = getCurrentPeerCount(infoHash);
  resourceStats.peers = Math.max(resourceStats.peers || 0, currentPeers);
  
  res.json(resourceStats);
});

app.get('/api/resources', (req, res) => {
  const resources = listResources();
  const analyticsStats = getAllResourceStats();
  
  const resourcesWithDetails = resources.map(r => ({
    ...r,
    currentPeers: getCurrentPeerCount(r.infoHash),
    analytics: analyticsStats[r.infoHash] || null
  }));
  
  res.json(resourcesWithDetails);
});

app.get('/api/torrent/:infoHash', (req, res) => {
  const torrent = getTorrentFile(req.params.infoHash);
  if (torrent) {
    res.setHeader('Content-Type', 'application/x-bittorrent');
    res.send(torrent);
  } else {
    res.status(404).json({ error: 'Torrent not found' });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const result = await createTorrentForFile(req.file.path, req.file.originalname);
    
    addToPrePushQueue(result.infoHash, {
      priority: 0,
      reason: 'new_upload',
      targetPeers: []
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/resource/:infoHash', (req, res) => {
  const startTime = Date.now();
  const infoHash = req.params.infoHash;
  const userId = req.query.userId || 'anonymous';
  
  res.on('finish', () => {
    const loadTime = Date.now() - startTime;
    recordAccess(infoHash, userId, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referrer'),
      loadTime,
      source: res.getHeader('X-Source') || 'cdn'
    });
  });
  
  serveResource(req, res);
});

app.post('/api/stats/download', (req, res) => {
  const { infoHash, bytes, source, userId } = req.body;
  recordDownload(infoHash, bytes, source);
  if (source === 'p2p') {
    recordP2PHit(infoHash);
  } else {
    recordP2PMiss(infoHash);
  }
  res.json({ success: true });
});

app.post('/api/stats/upload', (req, res) => {
  const { infoHash, bytes } = req.body;
  recordUpload(infoHash, bytes);
  res.json({ success: true });
});

app.get('/api/tracker/info', (req, res) => {
  res.json({ 
    trackerUrl: `ws://localhost:${TRACKER_PORT}`,
    httpTrackerUrl: `http://localhost:${TRACKER_PORT}/announce`
  });
});

app.get('/api/analytics/summary', (req, res) => {
  res.json(getAnalyticsSummary());
});

app.get('/api/analytics/trending', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const trending = getTrendingResources(limit);
  
  const trendingWithDetails = trending.map(t => {
    const resource = getResource(t.infoHash);
    return {
      ...t,
      resourceName: resource?.name || 'Unknown',
      resourceSize: resource?.size || 0
    };
  });
  
  res.json(trendingWithDetails);
});

app.get('/api/analytics/predict/:userId', (req, res) => {
  const userId = req.params.userId;
  const limit = parseInt(req.query.limit) || 5;
  const predictions = getPredictedResourcesForUser(userId, limit);
  
  const predictionsWithDetails = predictions.map(p => {
    const resource = getResource(p.infoHash);
    return {
      ...p,
      resourceName: resource?.name || 'Unknown',
      resourceSize: resource?.size || 0
    };
  });
  
  res.json(predictionsWithDetails);
});

app.get('/api/analytics/optimal-time/:userId', (req, res) => {
  const userId = req.params.userId;
  res.json(getOptimalPrePushTime(userId));
});

app.post('/api/analytics/access', (req, res) => {
  const { infoHash, userId, clientInfo } = req.body;
  const log = recordAccess(infoHash, userId || 'anonymous', clientInfo || {});
  res.json({ success: true, log });
});

app.post('/api/prepush/register', (req, res) => {
  const { peerId, peerInfo } = req.body;
  const result = registerEdgePeer(peerId || `peer_${Date.now()}`, peerInfo || {});
  res.json(result);
});

app.post('/api/prepush/heartbeat', (req, res) => {
  const { peerId, status } = req.body;
  const success = updatePeerHeartbeat(peerId, status || {});
  res.json({ success, timestamp: Date.now() });
});

app.post('/api/prepush/add', (req, res) => {
  const { infoHash, options } = req.body;
  const result = addToPrePushQueue(infoHash, options || {});
  res.json(result);
});

app.post('/api/prepush/schedule-trending', (req, res) => {
  const limit = req.body.limit || 5;
  const count = scheduleTrendingPrePush(limit);
  res.json({ success: true, scheduled: count });
});

app.post('/api/prepush/schedule-user/:userId', (req, res) => {
  const userId = req.params.userId;
  const limit = req.body.limit || 3;
  const count = scheduleUserPrePush(userId, limit);
  res.json({ success: true, scheduled: count });
});

app.get('/api/prepush/status', (req, res) => {
  res.json(getPrePushStatus());
});

app.get('/api/prepush/stats', (req, res) => {
  res.json(getPrePushStats());
});

app.post('/api/prepush/cancel/:prepushId', (req, res) => {
  const result = cancelPrePush(req.params.prepushId);
  res.json(result);
});

console.log('Starting P2P CDN server...');

const server = app.listen(PORT, () => {
  console.log(`✅ Express server started on port ${PORT}`);
  
  startTracker(TRACKER_PORT).then(() => {
    console.log('========================================');
    console.log('🚀 P2P CDN 系统启动成功!');
    console.log('========================================');
    console.log(`📡 主服务: http://localhost:${PORT}`);
    console.log(`🔗 Tracker: ws://localhost:${TRACKER_PORT}`);
    console.log(`📊 管理面板: http://localhost:${PORT}/admin/`);
    console.log(`📦 SDK: http://localhost:${PORT}/sdk/p2p-cdn-sdk.js`);
    console.log(`🌐 演示页面: http://localhost:${PORT}/`);
    console.log('========================================');
    console.log('💡 低热度资源优化已启用:');
    console.log('   • 节点 < 3 时启用 P2P/CDN 竞速下载');
    console.log('   • 低节点时 P2P 超时缩短为 1.5 秒');
    console.log('   • 前 2 个分片使用 CDN 预热加速首屏');
    console.log('========================================');
    console.log('🚀 资源预推送功能已启用:');
    console.log('   • 基于访问模式预测热门资源');
    console.log('   • 用户空闲时自动预推送分片');
    console.log('   • 按优先级队列调度推送任务');
    console.log('========================================');
  }).catch(err => {
    console.error('❌ Failed to start tracker:', err.message);
    console.log('⚠️  Server running without P2P tracker functionality');
  });
});
