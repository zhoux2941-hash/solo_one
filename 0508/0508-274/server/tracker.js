import { Server } from 'bittorrent-tracker';
import { updatePeerCount } from './stats.js';

let trackerServer = null;
let currentSwarm = {};

export async function startTracker(port) {
  console.log('Starting tracker server...');
  
  try {
    trackerServer = new Server({
      udp: false,
      http: true,
      ws: true,
      stats: true,
      filter: function (infoHash, params, cb) {
        cb(null);
      }
    });

    trackerServer.on('error', function (err) {
      console.error('Tracker error:', err.message);
    });

    trackerServer.on('warning', function (err) {
      console.warn('Tracker warning:', err.message);
    });

    trackerServer.on('start', function (addr) {
      console.log('Tracker started on:', addr);
    });

    trackerServer.on('complete', function (peer) {
      console.log('Peer completed download:', peer.ip);
    });

    trackerServer.on('update', function () {
      if (trackerServer && trackerServer.torrents) {
        currentSwarm = {};
        Object.keys(trackerServer.torrents).forEach(infoHash => {
          const swarm = trackerServer.torrents[infoHash];
          if (swarm) {
            const peerCount = swarm.complete + swarm.incomplete;
            updatePeerCount(infoHash, peerCount);
            currentSwarm[infoHash] = peerCount;
          }
        });
      }
    });

    return new Promise((resolve, reject) => {
      trackerServer.listen(port, (err) => {
        if (err) {
          console.error('Failed to start tracker:', err);
          reject(err);
        } else {
          console.log(`✅ Tracker server listening on port ${port}`);
          resolve(trackerServer);
        }
      });
    });

  } catch (error) {
    console.error('Failed to create tracker server:', error);
    throw error;
  }
}

export function getTrackerStats() {
  if (!trackerServer || !trackerServer.torrents) return null;
  return {
    torrents: Object.keys(trackerServer.torrents).length,
    swarms: trackerServer.torrents
  };
}

export function getCurrentPeerCount(infoHash) {
  return currentSwarm[infoHash] || 0;
}
