import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANALYTICS_FILE = path.join(__dirname, '../data/analytics.json');
const ACCESS_LOG_FILE = path.join(__dirname, '../data/access.log');

let accessLogs = [];
let resourceStats = {};
let userPatterns = {};

const TIME_WINDOWS = {
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  '6hour': 6 * 60 * 60 * 1000,
  '1day': 24 * 60 * 60 * 1000
};

export function initAnalytics() {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const data = fs.readJsonSync(ANALYTICS_FILE);
      resourceStats = data.resourceStats || {};
      userPatterns = data.userPatterns || {};
      accessLogs = data.accessLogs || [];
    }
  } catch (err) {
    console.warn('Failed to load analytics, using defaults:', err.message);
  }
}

function saveAnalytics() {
  try {
    fs.ensureDirSync(path.dirname(ANALYTICS_FILE));
    fs.writeJsonSync(ANALYTICS_FILE, {
      resourceStats,
      userPatterns,
      accessLogs: accessLogs.slice(-10000)
    }, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save analytics:', err.message);
  }
}

export function recordAccess(infoHash, userId, clientInfo = {}) {
  const now = Date.now();
  
  const logEntry = {
    timestamp: now,
    infoHash,
    userId,
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
    referrer: clientInfo.referrer,
    loadTime: clientInfo.loadTime,
    source: clientInfo.source
  };
  
  accessLogs.push(logEntry);
  
  if (!resourceStats[infoHash]) {
    resourceStats[infoHash] = {
      totalAccesses: 0,
      uniqueUsers: new Set(),
      accessTimes: [],
      hourlyAccess: {},
      dailyAccess: {},
      trendScore: 0,
      popularityScore: 0,
      lastAccessed: 0,
      avgLoadTime: 0,
      totalLoadTime: 0
    };
  }
  
  const stats = resourceStats[infoHash];
  stats.totalAccesses++;
  stats.uniqueUsers.add(userId);
  stats.accessTimes.push(now);
  stats.lastAccessed = now;
  
  const hourKey = new Date(now).getHours();
  stats.hourlyAccess[hourKey] = (stats.hourlyAccess[hourKey] || 0) + 1;
  
  const dayKey = new Date(now).getDay();
  stats.dailyAccess[dayKey] = (stats.dailyAccess[dayKey] || 0) + 1;
  
  if (clientInfo.loadTime) {
    stats.totalLoadTime += clientInfo.loadTime;
    stats.avgLoadTime = stats.totalLoadTime / stats.totalAccesses;
  }
  
  if (!userPatterns[userId]) {
    userPatterns[userId] = {
      accessHistory: [],
      favoriteResources: {},
      activeHours: {},
      lastActive: 0
    };
  }
  
  const userPattern = userPatterns[userId];
  userPattern.accessHistory.push({ infoHash, timestamp: now });
  userPattern.favoriteResources[infoHash] = (userPattern.favoriteResources[infoHash] || 0) + 1;
  userPattern.activeHours[hourKey] = (userPattern.activeHours[hourKey] || 0) + 1;
  userPattern.lastActive = now;
  
  calculateTrendScore(infoHash);
  calculatePopularityScore(infoHash);
  
  saveAnalytics();
  
  return logEntry;
}

function calculateTrendScore(infoHash) {
  const stats = resourceStats[infoHash];
  if (!stats) return 0;
  
  const now = Date.now();
  const recentAccesses = stats.accessTimes.filter(t => now - t < TIME_WINDOWS['15min']).length;
  const earlierAccesses = stats.accessTimes.filter(t => 
    now - t >= TIME_WINDOWS['15min'] && now - t < TIME_WINDOWS['30min']
  ).length;
  
  const trend = earlierAccesses > 0 ? (recentAccesses - earlierAccesses) / earlierAccesses : recentAccesses * 2;
  stats.trendScore = Math.max(0, Math.min(100, 50 + trend * 50));
  
  return stats.trendScore;
}

function calculatePopularityScore(infoHash) {
  const stats = resourceStats[infoHash];
  if (!stats) return 0;
  
  const now = Date.now();
  const recencyScore = stats.lastAccessed > 0 ? Math.max(0, 100 - (now - stats.lastAccessed) / 3600000) : 0;
  const frequencyScore = Math.min(100, stats.totalAccesses * 5);
  const uniqueScore = Math.min(100, stats.uniqueUsers.size * 10);
  
  const weightedScore = (
    recencyScore * 0.3 +
    frequencyScore * 0.4 +
    uniqueScore * 0.2 +
    stats.trendScore * 0.1
  );
  
  stats.popularityScore = Math.round(weightedScore);
  
  return stats.popularityScore;
}

export function getTrendingResources(limit = 10) {
  return Object.entries(resourceStats)
    .map(([infoHash, stats]) => ({
      infoHash,
      trendScore: stats.trendScore,
      popularityScore: stats.popularityScore,
      totalAccesses: stats.totalAccesses,
      uniqueUsers: stats.uniqueUsers.size,
      lastAccessed: stats.lastAccessed
    }))
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit);
}

export function getPredictedResourcesForUser(userId, limit = 5) {
  const userPattern = userPatterns[userId];
  if (!userPattern) {
    return getTrendingResources(limit).map(r => ({ ...r, predictionReason: 'global_trending' }));
  }
  
  const predictions = [];
  const now = Date.now();
  const currentHour = new Date(now).getHours();
  
  const favoriteResources = Object.entries(userPattern.favoriteResources)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  favoriteResources.forEach(([infoHash, count]) => {
    const stats = resourceStats[infoHash];
    if (stats) {
      predictions.push({
        infoHash,
        predictionReason: 'user_favorite',
        confidence: Math.min(100, count * 20),
        popularityScore: stats.popularityScore
      });
    }
  });
  
  const activeHours = Object.entries(userPattern.activeHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));
  
  if (activeHours.includes(currentHour)) {
    const trending = getTrendingResources(3);
    trending.forEach(r => {
      if (!predictions.find(p => p.infoHash === r.infoHash)) {
        predictions.push({
          ...r,
          predictionReason: 'active_hour_trending',
          confidence: 60
        });
      }
    });
  }
  
  const recentAccesses = userPattern.accessHistory.slice(-5);
  recentAccesses.forEach(access => {
    const stats = resourceStats[access.infoHash];
    if (stats && !predictions.find(p => p.infoHash === access.infoHash)) {
      predictions.push({
        infoHash: access.infoHash,
        predictionReason: 'recent_access',
        confidence: 40,
        popularityScore: stats.popularityScore
      });
    }
  });
  
  return predictions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

export function getOptimalPrePushTime(userId) {
  const userPattern = userPatterns[userId];
  if (!userPattern) {
    return { optimal: false, recommendedDelay: 30000 };
  }
  
  const now = Date.now();
  const currentHour = new Date(now).getHours();
  
  const sortedHours = Object.entries(userPattern.activeHours)
    .sort((a, b) => b[1] - a[1]);
  
  if (sortedHours.length === 0) {
    return { optimal: false, recommendedDelay: 30000 };
  }
  
  const mostActiveHour = parseInt(sortedHours[0][0]);
  const hourDiff = (mostActiveHour - currentHour + 24) % 24;
  
  if (hourDiff <= 1 || hourDiff >= 23) {
    return { optimal: true, recommendedDelay: 0, reason: 'current_active_hour' };
  }
  
  if (hourDiff <= 3) {
    return { optimal: true, recommendedDelay: hourDiff * 60 * 1000, reason: 'approaching_active_hour' };
  }
  
  return { 
    optimal: false, 
    recommendedDelay: Math.min(3600000, hourDiff * 60 * 1000),
    nextOptimalHour: mostActiveHour 
  };
}

export function getResourceStats(infoHash) {
  const stats = resourceStats[infoHash];
  if (!stats) return null;
  
  return {
    ...stats,
    uniqueUsers: stats.uniqueUsers.size,
    accessTimes: undefined
  };
}

export function getAllResourceStats() {
  return Object.fromEntries(
    Object.entries(resourceStats).map(([infoHash, stats]) => [
      infoHash,
      {
        ...stats,
        uniqueUsers: stats.uniqueUsers.size,
        accessTimes: undefined
      }
    ])
  );
}

export function getAnalyticsSummary() {
  const totalResources = Object.keys(resourceStats).length;
  const totalAccesses = Object.values(resourceStats).reduce((sum, s) => sum + s.totalAccesses, 0);
  const totalUsers = Object.keys(userPatterns).length;
  const trending = getTrendingResources(5);
  
  return {
    totalResources,
    totalAccesses,
    totalUsers,
    trendingResources: trending,
    lastUpdated: Date.now()
  };
}

export default {
  initAnalytics,
  recordAccess,
  getTrendingResources,
  getPredictedResourcesForUser,
  getOptimalPrePushTime,
  getResourceStats,
  getAllResourceStats,
  getAnalyticsSummary
};
