import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { getResource, FILES_DIR, PIECE_LENGTH } from './torrent-creator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../data/uploads');
fs.ensureDirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

export function serveResource(req, res) {
  const infoHash = req.params.infoHash;
  const resource = getResource(infoHash);
  
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const range = req.headers.range;
  
  if (range) {
    servePartialContent(req, res, resource, range);
  } else {
    serveFullContent(req, res, resource);
  }
}

function serveFullContent(req, res, resource) {
  const filePath = resource.filePath;
  
  res.setHeader('Content-Type', getContentType(resource.name));
  res.setHeader('Content-Length', resource.size);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('X-P2P-InfoHash', resource.infoHash);
  res.setHeader('X-P2P-Pieces', resource.pieces);
  res.setHeader('X-P2P-Piece-Length', resource.pieceLength);
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}

function servePartialContent(req, res, resource, range) {
  const filePath = resource.filePath;
  const size = resource.size;
  
  const parts = range.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
  const chunkSize = end - start + 1;

  res.setHeader('Content-Type', getContentType(resource.name));
  res.setHeader('Content-Length', chunkSize);
  res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
  res.setHeader('Accept-Ranges', 'bytes');
  res.status(206);

  const fileStream = fs.createReadStream(filePath, { start, end });
  fileStream.pipe(res);
}

export function servePiece(req, res) {
  const infoHash = req.params.infoHash;
  const pieceIndex = parseInt(req.params.index, 10);
  const resource = getResource(infoHash);

  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const start = pieceIndex * PIECE_LENGTH;
  const end = Math.min(start + PIECE_LENGTH - 1, resource.size - 1);

  if (start >= resource.size) {
    return res.status(416).json({ error: 'Invalid piece index' });
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', end - start + 1);
  res.setHeader('X-Piece-Index', pieceIndex);

  const fileStream = fs.createReadStream(resource.filePath, { start, end });
  fileStream.pipe(res);
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.txt': 'text/plain'
  };
  return types[ext] || 'application/octet-stream';
}

export { upload };
