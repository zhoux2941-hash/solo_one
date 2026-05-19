import WebTorrent from 'webtorrent';
import parseTorrent from 'parse-torrent';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TORRENTS_DIR = path.join(__dirname, '../data/torrents');
const FILES_DIR = path.join(__dirname, '../data/files');
const PIECE_LENGTH = 1 * 1024 * 1024;

fs.ensureDirSync(TORRENTS_DIR);
fs.ensureDirSync(FILES_DIR);

const resources = new Map();

function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

export function createTorrentForFile(filePath, originalName) {
  return new Promise((resolve, reject) => {
    try {
      const fileHash = generateFileHash(filePath);
      const destPath = path.join(FILES_DIR, fileHash + path.extname(originalName));
      
      if (!fs.existsSync(destPath)) {
        fs.copySync(filePath, destPath);
      }

      const client = new WebTorrent();
      
      const torrentOptions = {
        name: originalName,
        pieceLength: PIECE_LENGTH,
        private: false,
        comment: 'P2P CDN Torrent',
        createdBy: 'P2P CDN System',
        announceList: [
          `ws://localhost:8000`,
          `http://localhost:8000/announce`,
          'wss://tracker.openwebtorrent.com',
          'wss://tracker.btorrent.xyz'
        ]
      };

      client.seed(destPath, torrentOptions, (torrent) => {
        const torrentFilePath = path.join(TORRENTS_DIR, `${torrent.infoHash}.torrent`);
        fs.writeFileSync(torrentFilePath, torrent.torrentFile);

        const resourceInfo = {
          infoHash: torrent.infoHash,
          name: originalName,
          fileName: fileHash + path.extname(originalName),
          filePath: destPath,
          torrentPath: torrentFilePath,
          size: torrent.length,
          pieceLength: torrent.pieceLength,
          pieces: torrent.pieces.length,
          magnetURI: torrent.magnetURI,
          createdAt: Date.now()
        };

        resources.set(torrent.infoHash, resourceInfo);

        client.destroy(() => {
          resolve({
            infoHash: torrent.infoHash,
            name: originalName,
            size: torrent.length,
            magnetURI: torrent.magnetURI,
            pieceLength: torrent.pieceLength,
            pieces: torrent.pieces.length
          });
        });
      });

      client.on('error', (err) => {
        client.destroy();
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}

export function getTorrentFile(infoHash) {
  const torrentPath = path.join(TORRENTS_DIR, `${infoHash}.torrent`);
  if (fs.existsSync(torrentPath)) {
    return fs.readFileSync(torrentPath);
  }
  return null;
}

export function getResource(infoHash) {
  return resources.get(infoHash);
}

export function listResources() {
  return Array.from(resources.values());
}

export function getTorrentFilePath(infoHash) {
  return path.join(TORRENTS_DIR, `${infoHash}.torrent`);
}

export { FILES_DIR, PIECE_LENGTH };
