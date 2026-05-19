(function(global) {
  'use strict';

  class P2PCDNSDK {
    constructor(options = {}) {
      this.options = {
        trackerUrl: options.trackerUrl || 'ws://localhost:8000',
        cdnBaseUrl: options.cdnBaseUrl || 'http://localhost:3000/api/resource',
        apiBaseUrl: options.apiBaseUrl || 'http://localhost:3000/api',
        pieceLength: options.pieceLength || 1024 * 1024,
        p2pTimeout: options.p2pTimeout || 5000,
        p2pTimeoutLowPeers: options.p2pTimeoutLowPeers || 1500,
        minPeersForP2P: options.minPeersForP2P || 3,
        enableRace: options.enableRace !== false,
        enableProgressiveWarmup: options.enableProgressiveWarmup !== false,
        enableP2P: options.enableP2P !== false,
        enableIdlePrepush: options.enableIdlePrepush !== false,
        enableAutoPrepush: options.enableAutoPrepush !== false,
        userId: options.userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        idleThreshold: options.idleThreshold || 30000,
        maxConcurrentPrepush: options.maxConcurrentPrepush || 2,
        debug: options.debug || false
      };

      this.client = null;
      this.torrents = new Map();
      this.peerCounts = new Map();
      this.pendingRequests = new Map();
      this.stats = new Map();
      this.downloadedPieces = new Map();
      this.warmupPieces = new Set();
      
      this.isIdle = false;
      this.lastActivityTime = Date.now();
      this.idleCheckInterval = null;
      
      this.prepushQueue = [];
      this.activePrepushes = new Map();
      this.prepushHistory = [];
      this.peerId = this.options.userId;
      
      this.predictedResources = [];
      this.prePushEnabled = true;
      
      this.init();
      this.setupActivityListeners();
      this.startIdleDetection();
      
      if (this.options.enableAutoPrepush) {
        this.startAutoPrepush();
      }
    }

    init() {
      if (this.options.enableP2P && typeof WebTorrent !== 'undefined') {
        this.client = new WebTorrent({
          tracker: {
            announce: [this.options.trackerUrl]
          }
        });

        this.client.on('error', (err) => {
          this.log('WebTorrent error:', err);
        });

        this.client.on('torrent', (torrent) => {
          this.onTorrentAdded(torrent);
        });

        this.registerAsEdgePeer();
      } else if (this.options.enableP2P) {
        this.loadWebTorrent().then(() => {
          this.init();
        }).catch(() => {
          this.log('WebTorrent not available, using CDN only');
          this.options.enableP2P = false;
        });
      }
    }

    loadWebTorrent() {
      return new Promise((resolve, reject) => {
        if (typeof WebTorrent !== 'undefined') {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    log(...args) {
      if (this.options.debug) {
        console.log('[P2P-CDN]', ...args);
      }
    }

    setupActivityListeners() {
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      const onActivity = () => {
        this.lastActivityTime = Date.now();
        if (this.isIdle) {
          this.isIdle = false;
          this.log('User became active, pausing prepush');
        }
      };

      activityEvents.forEach(event => {
        document.addEventListener(event, onActivity, { passive: true });
      });
    }

    startIdleDetection() {
      this.idleCheckInterval = setInterval(() => {
        const idleTime = Date.now() - this.lastActivityTime;
        
        if (idleTime >= this.options.idleThreshold && !this.isIdle) {
          this.isIdle = true;
          this.log('User is idle, starting background prepush');
          this.processPrepushQueue();
        }
      }, 5000);
    }

    async registerAsEdgePeer() {
      try {
        const response = await fetch(`${this.options.apiBaseUrl}/prepush/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peerId: this.peerId,
            peerInfo: {
              userAgent: navigator.userAgent,
              location: window.location.host,
              capacity: this.options.maxConcurrentPrepush * 10
            }
          })
        });
        
        if (response.ok) {
          this.log('Registered as edge peer:', this.peerId);
          this.startHeartbeat();
        }
      } catch (err) {
        this.log('Failed to register as edge peer:', err);
      }
    }

    startHeartbeat() {
      setInterval(async () => {
        try {
          await fetch(`${this.options.apiBaseUrl}/prepush/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              peerId: this.peerId,
              status: {
                currentLoad: this.activePrepushes.size,
                available: this.isIdle && this.prePushEnabled
              }
            })
          });
        } catch (err) {
        }
      }, 30000);
    }

    async startAutoPrepush() {
      await this.fetchPredictions();
      
      setInterval(async () => {
        if (this.isIdle && this.prePushEnabled) {
          await this.fetchPredictions();
          this.processPrepushQueue();
        }
      }, 60000);
    }

    async fetchPredictions() {
      try {
        const response = await fetch(`${this.options.apiBaseUrl}/analytics/predict/${this.options.userId}`);
        if (response.ok) {
          this.predictedResources = await response.json();
          this.log('Fetched predictions:', this.predictedResources.length, 'resources');
          
          this.predictedResources.forEach(prediction => {
            if (prediction.confidence >= 50) {
              this.addToPrepushQueue(prediction.infoHash, {
                priority: prediction.confidence >= 80 ? 0 : 1,
                reason: prediction.predictionReason,
                confidence: prediction.confidence
              });
            }
          });
        }
      } catch (err) {
        this.log('Failed to fetch predictions:', err);
      }
    }

    addToPrepushQueue(infoHash, options = {}) {
      const existing = this.prepushQueue.find(item => item.infoHash === infoHash);
      if (existing) {
        existing.priority = Math.min(existing.priority, options.priority || 2);
        return;
      }

      const queueItem = {
        id: `prepush_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        infoHash,
        priority: options.priority || 2,
        reason: options.reason || 'manual',
        confidence: options.confidence || 0,
        addedAt: Date.now(),
        status: 'pending',
        progress: 0
      };

      this.prepushQueue.push(queueItem);
      this.prepushQueue.sort((a, b) => a.priority - b.priority);
      
      this.log(`Added to prepush queue: ${infoHash}, reason: ${queueItem.reason}`);
      
      if (this.isIdle) {
        this.processPrepushQueue();
      }
    }

    async processPrepushQueue() {
      if (!this.isIdle || !this.prePushEnabled) return;
      if (this.activePrepushes.size >= this.options.maxConcurrentPrepush) return;
      
      const pendingItems = this.prepushQueue.filter(item => item.status === 'pending');
      
      for (const item of pendingItems) {
        if (this.activePrepushes.size >= this.options.maxConcurrentPrepush) break;
        if (!this.isIdle) break;
        
        await this.startPrepush(item);
      }
    }

    async startPrepush(item) {
      item.status = 'active';
      item.startedAt = Date.now();
      this.activePrepushes.set(item.id, item);
      
      this.log(`Starting prepush: ${item.infoHash}, reason: ${item.reason}`);
      
      try {
        await this.fetchResourcePieces(item.infoHash, 0.3);
        item.status = 'completed';
        item.completedAt = Date.now();
        item.progress = 100;
        
        this.log(`Prepush completed: ${item.infoHash}`);
      } catch (err) {
        item.status = 'failed';
        item.error = err.message;
        this.log(`Prepush failed: ${item.infoHash}`, err);
      }
      
      this.activePrepushes.delete(item.id);
      this.prepushHistory.push(item);
      
      setTimeout(() => this.processPrepushQueue(), 1000);
    }

    async fetchResourcePieces(infoHash, percentage = 1.0) {
      const pieceCount = Math.ceil(10 * percentage);
      
      for (let i = 0; i < pieceCount && this.isIdle; i++) {
        try {
          await this.fetchPiece(infoHash, i);
        } catch (err) {
          this.log(`Failed to fetch piece ${i} for ${infoHash}:`, err);
        }
      }
    }

    cancelPrepush(prepushId) {
      const index = this.prepushQueue.findIndex(item => item.id === prepushId);
      if (index !== -1) {
        this.prepushQueue.splice(index, 1);
        return true;
      }
      
      if (this.activePrepushes.has(prepushId)) {
        this.activePrepushes.delete(prepushId);
        return true;
      }
      
      return false;
    }

    getPrepushStatus() {
      return {
        queue: this.prepushQueue,
        active: Array.from(this.activePrepushes.values()),
        history: this.prepushHistory.slice(-20).reverse(),
        isIdle: this.isIdle,
        idleTime: Date.now() - this.lastActivityTime,
        predictions: this.predictedResources
      };
    }

    async fetchResource(infoHash, options = {}) {
      const resourceKey = infoHash;
      
      if (!this.stats.has(resourceKey)) {
        this.stats.set(resourceKey, {
          p2pHits: 0,
          cdnHits: 0,
          p2pBytes: 0,
          cdnBytes: 0,
          raceWins: { p2p: 0, cdn: 0 },
          prepushHits: 0
        });
      }

      const preCached = this.downloadedPieces.size > 0 && 
        this.downloadedPieces.has(`${infoHash}-0`);
      if (preCached) {
        this.stats.get(resourceKey).prepushHits++;
        this.log('Resource partially pre-cached!');
      }

      this.recordAccess(infoHash);

      if (!this.options.enableP2P || !this.client) {
        this.log('P2P disabled, using CDN directly');
        return this.fetchFromCDNAndRecord(infoHash, options);
      }

      try {
        const peerCount = await this.getPeerCount(infoHash);
        this.log(`Resource ${infoHash} has ${peerCount} peers online`);

        if (peerCount < this.options.minPeersForP2P) {
          this.log(`Low peer count (${peerCount} < ${this.options.minPeersForP2P}), using optimized strategy`);
          
          if (this.options.enableRace) {
            return this.fetchWithRace(infoHash, options, peerCount);
          }
          
          const adjustedTimeout = this.options.p2pTimeoutLowPeers;
          this.log(`Using adjusted P2P timeout: ${adjustedTimeout}ms`);
          
          try {
            const result = await this.fetchFromP2P(infoHash, options, adjustedTimeout);
            if (result) {
              this.log('Fetched from P2P (low peers):', infoHash);
              this.recordStats(infoHash, 'p2p', result.byteLength);
              return result;
            }
          } catch (err) {
            this.log('P2P failed (low peers), falling back to CDN:', err);
          }
        } else {
          this.log(`Sufficient peers (${peerCount}), using P2P first`);
          
          try {
            const result = await this.fetchFromP2P(infoHash, options, this.options.p2pTimeout);
            if (result) {
              this.log('Fetched from P2P:', infoHash);
              this.recordStats(infoHash, 'p2p', result.byteLength);
              return result;
            }
          } catch (err) {
            this.log('P2P fetch failed, falling back to CDN:', err);
          }
        }
      } catch (err) {
        this.log('Peer count check failed, defaulting to CDN:', err);
      }

      return this.fetchFromCDNAndRecord(infoHash, options);
    }

    async recordAccess(infoHash) {
      try {
        await fetch(`${this.options.apiBaseUrl}/analytics/access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            infoHash,
            userId: this.options.userId,
            clientInfo: {
              userAgent: navigator.userAgent,
              referrer: window.location.href
            }
          })
        });
      } catch (err) {
      }
    }

    async fetchWithRace(infoHash, options, peerCount) {
      this.log('Starting race between P2P and CDN');
      
      return new Promise((resolve, reject) => {
        let completed = false;
        let p2pFinished = false;
        let cdnFinished = false;

        const finish = (source, buffer) => {
          if (completed) return;
          completed = true;
          
          this.log(`${source} won the race!`);
          const stats = this.stats.get(infoHash);
          if (stats) {
            stats.raceWins[source]++;
          }
          
          this.recordStats(infoHash, source, buffer.byteLength);
          resolve(buffer);
        };

        const p2pTimeout = peerCount < this.options.minPeersForP2P 
          ? this.options.p2pTimeoutLowPeers 
          : this.options.p2pTimeout;

        this.fetchFromP2P(infoHash, options, p2pTimeout)
          .then(buffer => {
            p2pFinished = true;
            finish('p2p', buffer);
          })
          .catch(err => {
            p2pFinished = true;
            this.log('P2P race lost:', err.message);
            if (cdnFinished && !completed) {
              this.fetchFromCDNAndRecord(infoHash, options).then(resolve).catch(reject);
            }
          });

        this.fetchFromCDN(infoHash, options)
          .then(buffer => {
            cdnFinished = true;
            finish('cdn', buffer);
          })
          .catch(err => {
            cdnFinished = true;
            this.log('CDN race failed:', err.message);
            if (p2pFinished && !completed) {
              reject(err);
            }
          });
      });
    }

    async getPeerCount(infoHash) {
      if (this.peerCounts.has(infoHash)) {
        const cached = this.peerCounts.get(infoHash);
        if (Date.now() - cached.timestamp < 30000) {
          return cached.count;
        }
      }

      try {
        const response = await fetch(`${this.options.apiBaseUrl}/stats/resource/${infoHash}`);
        if (response.ok) {
          const data = await response.json();
          const count = data.peers || 0;
          this.peerCounts.set(infoHash, { count, timestamp: Date.now() });
          return count;
        }
      } catch (err) {
        this.log('Failed to get peer count from API:', err);
      }

      const torrent = this.client.get(infoHash);
      if (torrent) {
        const count = torrent.numPeers || 0;
        this.peerCounts.set(infoHash, { count, timestamp: Date.now() });
        return count;
      }

      return 0;
    }

    async fetchFromP2P(infoHash, options, timeoutMs) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`P2P fetch timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        const torrent = this.client.get(infoHash);
        
        if (torrent) {
          this.downloadTorrent(torrent, resolve, reject, timeout);
        } else {
          const torrentUrl = `${this.options.apiBaseUrl}/torrent/${infoHash}`;
          
          this.client.add(torrentUrl, (torrent) => {
            this.downloadTorrent(torrent, resolve, reject, timeout);
          });
        }
      });
    }

    downloadTorrent(torrent, resolve, reject, timeout) {
      if (torrent.done) {
        clearTimeout(timeout);
        torrent.files[0].getBuffer((err, buffer) => {
          if (err) reject(err);
          else resolve(buffer);
        });
        return;
      }

      torrent.on('done', () => {
        clearTimeout(timeout);
        torrent.files[0].getBuffer((err, buffer) => {
          if (err) reject(err);
          else resolve(buffer);
        });
      });

      torrent.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      torrent.on('download', (bytes) => {
        this.log('Downloaded', bytes, 'bytes from P2P');
      });
    }

    async fetchFromCDNAndRecord(infoHash, options) {
      this.log('Using CDN for:', infoHash);
      const result = await this.fetchFromCDN(infoHash, options);
      this.recordStats(infoHash, 'cdn', result.byteLength);
      return result;
    }

    async fetchFromCDN(infoHash, options = {}) {
      const url = `${this.options.cdnBaseUrl}/${infoHash}`;
      
      const fetchOptions = {
        method: 'GET',
        headers: options.headers || {}
      };

      if (options.range) {
        fetchOptions.headers['Range'] = `bytes=${options.range.start}-${options.range.end || ''}`;
      }

      const response = await fetch(url, fetchOptions);
      
      if (!response.ok && response.status !== 206) {
        throw new Error(`CDN fetch failed: ${response.status}`);
      }

      return response.arrayBuffer();
    }

    async fetchPiece(infoHash, pieceIndex) {
      const pieceKey = `${infoHash}-${pieceIndex}`;
      
      if (this.downloadedPieces.has(pieceKey)) {
        return this.downloadedPieces.get(pieceKey);
      }

      if (this.options.enableProgressiveWarmup && pieceIndex < 2 && !this.warmupPieces.has(pieceKey)) {
        this.log(`Warmup mode: using CDN for piece ${pieceIndex} to speed up initial load`);
        this.warmupPieces.add(pieceKey);
        const piece = await this.fetchPieceFromCDN(infoHash, pieceIndex);
        this.downloadedPieces.set(pieceKey, piece);
        this.recordStats(infoHash, 'cdn', piece.byteLength);
        return piece;
      }

      if (this.options.enableP2P && this.client) {
        try {
          const peerCount = await this.getPeerCount(infoHash);
          
          if (peerCount >= this.options.minPeersForP2P) {
            const piece = await this.fetchPieceFromP2P(infoHash, pieceIndex);
            if (piece) {
              this.downloadedPieces.set(pieceKey, piece);
              this.recordStats(infoHash, 'p2p', piece.byteLength);
              return piece;
            }
          }
        } catch (err) {
          this.log('P2P piece fetch failed:', err);
        }
      }

      const piece = await this.fetchPieceFromCDN(infoHash, pieceIndex);
      this.downloadedPieces.set(pieceKey, piece);
      this.recordStats(infoHash, 'cdn', piece.byteLength);
      return piece;
    }

    async fetchPieceFromP2P(infoHash, pieceIndex) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('P2P piece fetch timeout'));
        }, 3000);

        const torrent = this.client.get(infoHash);
        
        if (!torrent) {
          clearTimeout(timeout);
          reject(new Error('Torrent not found'));
          return;
        }

        if (torrent.bitfield.get(pieceIndex)) {
          clearTimeout(timeout);
          torrent.files[0].getBuffer((err, buffer) => {
            if (err) {
              reject(err);
              return;
            }
            
            const start = pieceIndex * this.options.pieceLength;
            const end = Math.min(start + this.options.pieceLength, buffer.byteLength);
            resolve(buffer.slice(start, end));
          });
        } else {
          torrent.once(`piece${pieceIndex}`, () => {
            clearTimeout(timeout);
            this.fetchPieceFromP2P(infoHash, pieceIndex).then(resolve).catch(reject);
          });
        }
      });
    }

    async fetchPieceFromCDN(infoHash, pieceIndex) {
      const start = pieceIndex * this.options.pieceLength;
      const end = start + this.options.pieceLength - 1;
      
      const response = await fetch(`${this.options.cdnBaseUrl}/${infoHash}`, {
        headers: {
          'Range': `bytes=${start}-${end}`
        }
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`CDN piece fetch failed: ${response.status}`);
      }

      return response.arrayBuffer();
    }

    recordStats(infoHash, source, bytes) {
      const stats = this.stats.get(infoHash) || { 
        p2pHits: 0, 
        cdnHits: 0, 
        p2pBytes: 0, 
        cdnBytes: 0,
        raceWins: { p2p: 0, cdn: 0 },
        prepushHits: 0
      };
      
      if (source === 'p2p') {
        stats.p2pHits++;
        stats.p2pBytes += bytes;
      } else {
        stats.cdnHits++;
        stats.cdnBytes += bytes;
      }
      
      this.stats.set(infoHash, stats);
      this.reportStatsToServer(infoHash, bytes, source);
    }

    async reportStatsToServer(infoHash, bytes, source) {
      try {
        await fetch(`${this.options.apiBaseUrl}/stats/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ infoHash, bytes, source, userId: this.options.userId })
        });
      } catch (err) {
        this.log('Failed to report stats:', err);
      }
    }

    onTorrentAdded(torrent) {
      this.log('Torrent added:', torrent.infoHash);
      this.torrents.set(torrent.infoHash, torrent);

      torrent.on('wire', (wire) => {
        this.log('New peer connected, total peers:', torrent.numPeers);
        this.peerCounts.set(torrent.infoHash, { 
          count: torrent.numPeers, 
          timestamp: Date.now() 
        });
      });

      torrent.on('upload', (bytes) => {
        this.log('Uploaded', bytes, 'bytes to peers');
        this.reportUploadStats(torrent.infoHash, bytes);
      });
    }

    async reportUploadStats(infoHash, bytes) {
      try {
        await fetch(`${this.options.apiBaseUrl}/stats/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ infoHash, bytes })
        });
      } catch (err) {
        this.log('Failed to report upload stats:', err);
      }
    }

    async injectScript(infoHash) {
      const buffer = await this.fetchResource(infoHash);
      const blob = new Blob([buffer], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      
      const script = document.createElement('script');
      script.src = url;
      document.head.appendChild(script);
      
      return script;
    }

    async injectStylesheet(infoHash) {
      const buffer = await this.fetchResource(infoHash);
      const blob = new Blob([buffer], { type: 'text/css' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
      
      return link;
    }

    async injectImage(infoHash, elementId) {
      const buffer = await this.fetchResource(infoHash);
      const blob = new Blob([buffer], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      
      const img = elementId ? document.getElementById(elementId) : new Image();
      if (img) {
        img.src = url;
      }
      
      return img;
    }

    getStats(infoHash) {
      if (infoHash) {
        return this.stats.get(infoHash);
      }
      return Object.fromEntries(this.stats);
    }

    destroy() {
      if (this.idleCheckInterval) {
        clearInterval(this.idleCheckInterval);
      }
      if (this.client) {
        this.client.destroy();
      }
    }
  }

  global.P2PCDNSDK = P2PCDNSDK;

  if (typeof define === 'function' && define.amd) {
    define(function() { return P2PCDNSDK; });
  }

})(typeof window !== 'undefined' ? window : this);
