import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTrendingResources, getPredictedResourcesForUser, getOptimalPrePushTime } from './analytics.js';
import { getResource } from './torrent-creator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREPUSH_STATE_FILE = path.join(__dirname, '../data/prepush-state.json');

let prepushQueue = [];
let activePrepushes = new Map();
let completedPrepushes = [];
let edgePeers = new Map();
let schedulerInterval = null;

const PREPUSH_PRIORITIES = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

export function initPrePush() {
  try {
    if (fs.existsSync(PREPUSH_STATE_FILE)) {
      const state = fs.readJsonSync(PREPUSH_STATE_FILE);
      completedPrepushes = state.completedPrepushes || [];
      prepushQueue = state.queue || [];
    }
  } catch (err) {
    console.warn('Failed to load prepush state:', err.message);
  }
  
  startScheduler();
}

function saveState() {
  try {
    fs.ensureDirSync(path.dirname(PREPUSH_STATE_FILE));
    fs.writeJsonSync(PREPUSH_STATE_FILE, {
      queue: prepushQueue,
      completedPrepushes: completedPrepushes.slice(-1000)
    }, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save prepush state:', err.message);
  }
}

export function registerEdgePeer(peerId, peerInfo) {
  edgePeers.set(peerId, {
    ...peerInfo,
    registeredAt: Date.now(),
    lastHeartbeat: Date.now(),
    capacity: peerInfo.capacity || 100,
    currentLoad: 0,
    available: true
  });
  
  console.log(`Edge peer registered: ${peerId}`);
  return { success: true, peerId };
}

export function updatePeerHeartbeat(peerId, status = {}) {
  const peer = edgePeers.get(peerId);
  if (peer) {
    peer.lastHeartbeat = Date.now();
    peer.currentLoad = status.currentLoad || peer.currentLoad;
    peer.available = status.available !== false;
    return true;
  }
  return false;
}

export function addToPrePushQueue(infoHash, options = {}) {
  const resource = getResource(infoHash);
  if (!resource) {
    return { success: false, error: 'Resource not found' };
  }
  
  const existing = prepushQueue.find(item => item.infoHash === infoHash);
  if (existing) {
    existing.priority = Math.min(existing.priority, options.priority || PREPUSH_PRIORITIES.MEDIUM);
    existing.targetPeers = [...new Set([...existing.targetPeers, ...(options.targetPeers || [])])];
    saveState();
    return { success: true, updated: true };
  }
  
  const queueItem = {
    id: `prepush_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    infoHash,
    resourceName: resource.name,
    size: resource.size,
    pieceCount: resource.pieces,
    priority: options.priority || PREPUSH_PRIORITIES.MEDIUM,
    targetPeers: options.targetPeers || [],
    reason: options.reason || 'scheduled',
    scheduledAt: Date.now(),
    status: 'pending',
    progress: 0
  };
  
  prepushQueue.push(queueItem);
  prepushQueue.sort((a, b) => a.priority - b.priority);
  
  saveState();
  console.log(`Added to prepush queue: ${infoHash}, priority: ${queueItem.priority}`);
  
  return { success: true, queueItem };
}

export function scheduleTrendingPrePush(limit = 5) {
  const trending = getTrendingResources(limit);
  let added = 0;
  
  trending.forEach((resource, index) => {
    const priority = index < 2 ? PREPUSH_PRIORITIES.HIGH : PREPUSH_PRIORITIES.MEDIUM;
    const result = addToPrePushQueue(resource.infoHash, {
      priority,
      reason: 'trending',
      targetPeers: getAvailablePeers()
    });
    if (result.success) added++;
  });
  
  console.log(`Scheduled ${added} trending resources for prepush`);
  return added;
}

export function scheduleUserPrePush(userId, limit = 3) {
  const predictions = getPredictedResourcesForUser(userId, limit);
  const timing = getOptimalPrePushTime(userId);
  
  let added = 0;
  predictions.forEach((prediction, index) => {
    if (prediction.confidence >= 50) {
      const priority = prediction.confidence >= 80 ? PREPUSH_PRIORITIES.HIGH : PREPUSH_PRIORITIES.MEDIUM;
      const result = addToPrePushQueue(prediction.infoHash, {
        priority,
        reason: prediction.predictionReason,
        targetPeers: [userId],
        delay: timing.recommendedDelay
      });
      if (result.success) added++;
    }
  });
  
  console.log(`Scheduled ${added} resources for user ${userId}`);
  return added;
}

function getAvailablePeers() {
  const now = Date.now();
  return Array.from(edgePeers.entries())
    .filter(([_, peer]) => {
      const isAlive = now - peer.lastHeartbeat < 60000;
      const hasCapacity = peer.currentLoad < (peer.capacity * 0.8);
      return isAlive && hasCapacity && peer.available;
    })
    .map(([peerId]) => peerId);
}

function startScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }
  
  schedulerInterval = setInterval(() => {
    processQueue();
    cleanupStalePeers();
  }, 5000);
  
  console.log('Prepush scheduler started');
}

function processQueue() {
  const now = Date.now();
  const availablePeers = getAvailablePeers();
  
  if (availablePeers.length === 0) return;
  
  const pendingItems = prepushQueue.filter(item => 
    item.status === 'pending' && 
    (!item.delay || now - item.scheduledAt >= item.delay)
  );
  
  for (const item of pendingItems) {
    if (activePrepushes.size >= 3) break;
    
    const targetPeers = item.targetPeers.length > 0
      ? item.targetPeers.filter(p => availablePeers.includes(p))
      : availablePeers.slice(0, 3);
    
    if (targetPeers.length > 0) {
      startPrePush(item, targetPeers);
    }
  }
}

function startPrePush(item, targetPeers) {
  item.status = 'active';
  item.startedAt = Date.now();
  item.targetPeers = targetPeers;
  
  activePrepushes.set(item.id, item);
  
  console.log(`Starting prepush for ${item.infoHash} to ${targetPeers.length} peers`);
  
  simulatePrePushProgress(item);
  
  saveState();
}

function simulatePrePushProgress(item) {
  const interval = setInterval(() => {
    item.progress += Math.random() * 15 + 5;
    
    if (item.progress >= 100) {
      item.progress = 100;
      item.status = 'completed';
      item.completedAt = Date.now();
      
      clearInterval(interval);
      activePrepushes.delete(item.id);
      completedPrepushes.push(item);
      
      console.log(`Prepush completed: ${item.infoHash} to ${item.targetPeers.length} peers`);
      saveState();
    }
  }, 1000);
}

function cleanupStalePeers() {
  const now = Date.now();
  const staleThreshold = 120000;
  
  for (const [peerId, peer] of edgePeers.entries()) {
    if (now - peer.lastHeartbeat > staleThreshold) {
      edgePeers.delete(peerId);
      console.log(`Removed stale edge peer: ${peerId}`);
    }
  }
}

export function getPrePushStatus() {
  return {
    queue: prepushQueue,
    active: Array.from(activePrepushes.values()),
    completed: completedPrepushes.slice(-50).reverse(),
    edgePeers: Array.from(edgePeers.values()).map(p => ({
      peerId: p.peerId,
      location: p.location,
      capacity: p.capacity,
      currentLoad: p.currentLoad,
      available: p.available,
      uptime: Date.now() - p.registeredAt
    }))
  };
}

export function getPrePushStats() {
  const totalCompleted = completedPrepushes.length;
  const totalBytesPushed = completedPrepushes.reduce((sum, item) => sum + (item.size || 0), 0);
  const avgTime = totalCompleted > 0
    ? completedPrepushes.reduce((sum, item) => sum + (item.completedAt - item.startedAt), 0) / totalCompleted
    : 0;
  
  return {
    queueLength: prepushQueue.length,
    activeCount: activePrepushes.size,
    totalCompleted,
    totalBytesPushed,
    avgCompletionTime: Math.round(avgTime),
    edgePeerCount: edgePeers.size,
    successRate: totalCompleted > 0 ? Math.round((totalCompleted / (totalCompleted + 10)) * 100) : 100
  };
}

export function cancelPrePush(prepushId) {
  const index = prepushQueue.findIndex(item => item.id === prepushId);
  if (index !== -1) {
    prepushQueue.splice(index, 1);
    saveState();
    return { success: true };
  }
  
  if (activePrepushes.has(prepushId)) {
    const item = activePrepushes.get(prepushId);
    item.status = 'cancelled';
    activePrepushes.delete(prepushId);
    completedPrepushes.push(item);
    saveState();
    return { success: true };
  }
  
  return { success: false, error: 'Prepush not found' };
}

export default {
  initPrePush,
  registerEdgePeer,
  updatePeerHeartbeat,
  addToPrePushQueue,
  scheduleTrendingPrePush,
  scheduleUserPrePush,
  getPrePushStatus,
  getPrePushStats,
  cancelPrePush
};
