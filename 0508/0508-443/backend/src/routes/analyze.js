const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config');
const tsAnalyzer = require('../modules/tsAnalyzer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.ensureDirSync(config.uploadsDir);
    cb(null, config.uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.ts' || ext === '.mts' || ext === '.m2ts') {
      cb(null, true);
    } else {
      cb(new Error('Only TS files only'));
    }
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const analysis = await tsAnalyzer.analyzeTsFile(req.file.path);
    
    setTimeout(async () => {
      try {
        await fs.remove(req.file.path);
      } catch (err) {
        console.warn('Could not remove uploaded file:', err.message);
      }
    }, 60000);

    res.json({
      fileName: req.file.originalname,
      fileSize: req.file.size,
      analysis
    });
  } catch (err) {
    if (req.file) {
      try {
        await fs.remove(req.file.path);
      } catch (removeErr) {
          console.warn('Could not remove uploaded file:', removeErr.message);
        }
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
