import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATS_FILE = path.join(__dirname, '../data/stats.json');

let globalStats = {
  totalP2PHits: 0,
  totalP2PMisses: 0,
  totalP2PDownloaded: 0,
  totalCDNDownloaded: 0,
  totalUploaded: 0,
  activePeers: 0,
  resources: {}
};

export function initStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const savedStats = fs.readJsonSync(STATS_FILE);
      globalStats = { ...globalStats, ...savedStats };
    }
  } catch (err) {
    console.warn('Failed to load stats, using defaults:', err.message);
  }
}

function saveStats() {
  try {
    fs.ensureDirSync(path.dirname(STATS_FILE));
    fs.writeJsonSync(STATS_FILE, globalStats, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save stats:', err.message);
  }
}

function getResourceStats(infoHash) {
  if (!globalStats.resources[infoHash]) {
    globalStats.resources[infoHash] = {
      p2pHits: 0,
      p2pMisses: 0,
      p2pDownloaded: 0,
      cdnDownloaded: 0,
      uploaded: 0,
      peers: 0,
      firstSeen: Date.now()
    };
  }
  return globalStats.resources[infoHash];
}

export function recordP2PHit(infoHash) {
  globalStats.totalP2PHits++;
  getResourceStats(infoHash).p2pHits++;
  saveStats();
}

export function recordP2PMiss(infoHash) {
  globalStats.totalP2PMisses++;
  getResourceStats(infoHash).p2pMisses++;
  saveStats();
}

export function recordDownload(infoHash, bytes, source) {
  if (source === 'p2p') {
    globalStats.totalP2PDownloaded += bytes;
    getResourceStats(infoHash).p2pDownloaded += bytes;
  } else {
    globalStats.totalCDNDownloaded += bytes;
    getResourceStats(infoHash).cdnDownloaded += bytes;
  }
  saveStats();
}

export function recordUpload(infoHash, bytes) {
  globalStats.totalUploaded += bytes;
  getResourceStats(infoHash).uploaded += bytes;
  saveStats();
}

export function updatePeerCount(infoHash, count) {
  getResourceStats(infoHash).peers = count;
  globalStats.activePeers = Object.values(globalStats.resources).reduce((sum, r) => sum + r.peers, 0);
  saveStats();
}

export function getStats() {
  const totalRequests = globalStats.totalP2PHits + globalStats.totalP2PMisses;
  const p2pHitRate = totalRequests > 0 ? (globalStats.totalP2PHits / totalRequests * 100).toFixed(2) : 0;
  
  return {
    ...globalStats,
    p2pHitRate: parseFloat(p2pHitRate),
    totalRequests,
    calculatedAt: Date.now()
  };
}
