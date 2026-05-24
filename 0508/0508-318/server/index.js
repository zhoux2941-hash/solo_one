const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  const defaultConfig = {
    scenes: [
      {
        id: 'entrance',
        name: '展厅入口',
        image: 'https://picsum.photos/2048/1024?random=1',
        position: { x: 50, y: 75 }
      },
      {
        id: 'gallery1',
        name: '一号展厅',
        image: 'https://picsum.photos/2048/1024?random=2',
        position: { x: 50, y: 25 }
      },
      {
        id: 'gallery2',
        name: '二号展厅',
        image: 'https://picsum.photos/2048/1024?random=3',
        position: { x: 150, y: 25 }
      }
    ],
    hotspots: [
      {
        sceneId: 'entrance',
        position: { x: 0, y: 0, z: -400 },
        type: 'navigate',
        target: 'gallery1',
        title: '前往一号展厅'
      },
      {
        sceneId: 'entrance',
        position: { x: 300, y: 0, z: 0 },
        type: 'info',
        title: '欢迎来到虚拟展厅',
        description: '本展厅展示了各种珍贵艺术品，请自由探索。',
        image: 'https://picsum.photos/400/300?random=10'
      },
      {
        sceneId: 'gallery1',
        position: { x: 0, y: 0, z: 400 },
        type: 'navigate',
        target: 'entrance',
        title: '返回入口'
      },
      {
        sceneId: 'gallery1',
        position: { x: 0, y: 0, z: -400 },
        type: 'navigate',
        target: 'gallery2',
        title: '前往二号展厅'
      }
    ]
  };
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'panorama-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.get('/api/config', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json(config);
  } catch (e) {
    res.status(500).json({ error: '无法读取配置文件' });
  }
});

app.post('/api/config', (req, res) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: '配置保存成功' });
  } catch (e) {
    res.status(500).json({ error: '无法保存配置文件' });
  }
});

app.post('/api/upload', upload.single('panorama'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const originalPath = req.file.path;
    const compressedFilename = `compressed-${req.file.filename}`;
    const compressedPath = path.join(uploadsDir, compressedFilename);

    const image = sharp(originalPath);
    const metadata = await image.metadata();

    const targetWidth = Math.min(metadata.width || 4096, 4096);
    const targetHeight = Math.min(metadata.height || 2048, 2048);

    await image
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(compressedPath);

    const originalSize = fs.statSync(originalPath).size;
    const compressedSize = fs.statSync(compressedPath).size;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    fs.unlinkSync(originalPath);

    res.json({ 
      success: true, 
      url: `/uploads/${compressedFilename}`,
      filename: compressedFilename,
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
      compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)} MB`,
      compressionRatio: `${compressionRatio}%`
    });
  } catch (e) {
    console.error('Upload error:', e);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: '文件上传失败' });
  }
});

app.post('/api/upload-model', upload.single('model'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.gltf' && ext !== '.glb') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: '只支持GLTF/GLB格式的3D模型' });
    }

    const finalFilename = req.file.filename;
    const fileSize = fs.statSync(req.file.path).size;

    res.json({ 
      success: true, 
      url: `/uploads/${finalFilename}`,
      filename: finalFilename,
      size: `${(fileSize / 1024 / 1024).toFixed(2)} MB`
    });
  } catch (e) {
    console.error('Model upload error:', e);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: '模型上传失败' });
  }
});

app.get('/api/scenes', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json(config.scenes);
  } catch (e) {
    res.status(500).json({ error: '无法读取场景列表' });
  }
});

app.post('/api/scenes', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const newScene = {
      id: 'scene_' + Date.now(),
      name: req.body.name || '新场景',
      image: req.body.image || '',
      position: req.body.position || { x: 100, y: 100 }
    };
    config.scenes.push(newScene);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true, scene: newScene });
  } catch (e) {
    res.status(500).json({ error: '无法创建场景' });
  }
});

app.put('/api/scenes/:id', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const sceneIndex = config.scenes.findIndex(s => s.id === req.params.id);
    
    if (sceneIndex === -1) {
      return res.status(404).json({ error: '场景不存在' });
    }
    
    config.scenes[sceneIndex] = { ...config.scenes[sceneIndex], ...req.body };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true, scene: config.scenes[sceneIndex] });
  } catch (e) {
    res.status(500).json({ error: '无法更新场景' });
  }
});

app.delete('/api/scenes/:id', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.scenes = config.scenes.filter(s => s.id !== req.params.id);
    config.hotspots = config.hotspots.filter(h => h.sceneId !== req.params.id);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '无法删除场景' });
  }
});

app.get('/api/hotspots', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json(config.hotspots);
  } catch (e) {
    res.status(500).json({ error: '无法读取热点列表' });
  }
});

app.post('/api/hotspots', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const newHotspot = {
      id: 'hotspot_' + Date.now(),
      sceneId: req.body.sceneId,
      position: req.body.position || { x: 0, y: 0, z: -400 },
      type: req.body.type || 'navigate',
      target: req.body.target || '',
      title: req.body.title || '热点',
      description: req.body.description || '',
      image: req.body.image || ''
    };
    config.hotspots.push(newHotspot);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true, hotspot: newHotspot });
  } catch (e) {
    res.status(500).json({ error: '无法创建热点' });
  }
});

app.put('/api/hotspots/:id', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const hotspotIndex = config.hotspots.findIndex(h => h.id === req.params.id);
    
    if (hotspotIndex === -1) {
      return res.status(404).json({ error: '热点不存在' });
    }
    
    config.hotspots[hotspotIndex] = { ...config.hotspots[hotspotIndex], ...req.body };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true, hotspot: config.hotspots[hotspotIndex] });
  } catch (e) {
    res.status(500).json({ error: '无法更新热点' });
  }
});

app.delete('/api/hotspots/:id', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.hotspots = config.hotspots.filter(h => h.id !== req.params.id);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '无法删除热点' });
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});