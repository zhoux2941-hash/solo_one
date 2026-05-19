const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const firmwareService = require('../services/firmwareService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('firmware'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请选择固件文件' });
    }

    const parsed = await firmwareService.parseFirmwareFile(
      req.file.path,
      req.file.originalname
    );

    const { description, uploaderId } = req.body;

    const result = await req.db.run(
      `INSERT INTO firmware 
       (file_name, file_path, file_size, version, hardware_model, description, md5_hash, file_type, start_address, is_encrypted, encryption_type, parse_method, warnings, uploader_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parsed.fileName,
        parsed.filePath,
        parsed.fileSize,
        parsed.version,
        parsed.hardwareModel,
        description || '',
        parsed.md5Hash,
        parsed.fileType,
        parsed.startAddress,
        parsed.isEncrypted ? 1 : 0,
        parsed.encryptionType || '',
        parsed.parseMethod || 'standard',
        parsed.warnings ? JSON.stringify(parsed.warnings) : null,
        uploaderId || null
      ]
    );

    require('fs').unlinkSync(req.file.path);

    await req.db.run(
      `INSERT INTO operation_logs (user_id, action, module, details)
       VALUES (?, ?, ?, ?)`,
      [uploaderId || null, '上传固件', '固件管理', `上传固件: ${parsed.fileName}, 版本: ${parsed.version}`]
    );

    res.json({
      success: true,
      data: {
        id: result.lastID,
        fileName: parsed.fileName,
        version: parsed.version,
        hardwareModel: parsed.hardwareModel,
        fileSize: parsed.fileSize
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, hardwareModel } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereClause = '';
    const params = [];
    
    if (hardwareModel) {
      whereClause = 'WHERE hardware_model LIKE ?';
      params.push(`%${hardwareModel}%`);
    }
    
    params.push(parseInt(pageSize), parseInt(offset));
    
    const firmware = await req.db.all(
      `SELECT f.*, u.username as uploader_name 
       FROM firmware f 
       LEFT JOIN users u ON f.uploader_id = u.id 
       ${whereClause}
       ORDER BY f.created_at DESC 
       LIMIT ? OFFSET ?`,
      params
    );

    const totalResult = await req.db.get(
      `SELECT COUNT(*) as total FROM firmware ${whereClause}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      success: true,
      data: {
        list: firmware,
        total: totalResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const firmware = await req.db.get(
      `SELECT f.*, u.username as uploader_name 
       FROM firmware f 
       LEFT JOIN users u ON f.uploader_id = u.id 
       WHERE f.id = ?`,
      [req.params.id]
    );

    if (!firmware) {
      return res.status(404).json({ success: false, error: '固件不存在' });
    }

    if (firmware.warnings) {
      try {
        firmware.warnings = JSON.parse(firmware.warnings);
      } catch (e) {
        firmware.warnings = [];
      }
    }

    res.json({ success: true, data: firmware });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const firmware = await req.db.get(
      `SELECT f.*, u.username as uploader_name 
       FROM firmware f 
       LEFT JOIN users u ON f.uploader_id = u.id 
       WHERE f.id = ?`,
      [req.params.id]
    );

    if (!firmware) {
      return res.status(404).json({ success: false, error: '固件不存在' });
    }

    if (firmware.warnings) {
      try {
        firmware.warnings = JSON.parse(firmware.warnings);
      } catch (e) {
        firmware.warnings = [];
      }
    }

    res.json({ success: true, data: firmware });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const firmware = await req.db.get('SELECT * FROM firmware WHERE id = ?', [req.params.id]);
    if (!firmware) {
      return res.status(404).json({ success: false, error: '固件不存在' });
    }

    firmwareService.deleteFirmwareFile(firmware.file_path);

    await req.db.run('DELETE FROM firmware WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/versions/:hardwareModel', async (req, res) => {
  try {
    const versions = await req.db.all(
      `SELECT id, version, file_name, created_at 
       FROM firmware 
       WHERE hardware_model = ? 
       ORDER BY created_at DESC`,
      [req.params.hardwareModel]
    );

    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
