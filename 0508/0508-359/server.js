const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const CHUNK_SIZE = 1024 * 1024;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const CHUNKS_DIR = path.join(__dirname, 'chunks');
const THUMBNAIL_DIR = path.join(__dirname, 'uploads', 'thumbnails');

[UPLOAD_DIR, CHUNKS_DIR, THUMBNAIL_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { orders: [], orderItems: [] };
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { orders: [], orderItems: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function generateOrderNo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000).toString();
  return `DC${year}${month}${day}${random}`;
}

function generateFileHash(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateThumbnail(inputPath, outputPath, maxSize = 300) {
  return new Promise((resolve) => {
    fs.copyFile(inputPath, outputPath, (err) => {
      if (err) {
        resolve(null);
      } else {
        resolve(outputPath);
      }
    });
  });
}

const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { fileId } = req.body;
    const chunkDir = path.join(CHUNKS_DIR, fileId);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }
    cb(null, chunkDir);
  },
  filename: (req, file, cb) => {
    const { chunkIndex } = req.body;
    cb(null, chunkIndex);
  }
});

const chunkUpload = multer({ storage: chunkStorage });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/api/orders', upload.array('photos', 10), (req, res) => {
  try {
    const { customer_name, phone, items } = req.body;
    const parsedItems = JSON.parse(items);
    const orderId = generateOrderNo();
    const now = new Date().toISOString();

    let totalAmount = 0;
    parsedItems.forEach(item => {
      const itemTotal = item.quantity * item.unit_price;
      totalAmount = Math.round((totalAmount + itemTotal) * 100) / 100;
    });

    const db = readDB();

    const newOrder = {
      id: orderId,
      customer_name,
      phone,
      total_amount: Math.round(totalAmount * 100) / 100,
      status: '已收衣',
      created_at: now,
      updated_at: now
    };

    db.orders.push(newOrder);

    const stainMarkers = req.body.stain_markers ? JSON.parse(req.body.stain_markers) : {};
    
    parsedItems.forEach((item, index) => {
      let photoPath = null;
      if (req.files && req.files[index]) {
        photoPath = `/uploads/${req.files[index].filename}`;
      }
      const markers = stainMarkers[index] || [];
      db.orderItems.push({
        id: Date.now() + index,
        order_id: orderId,
        clothing_type: item.clothing_type,
        quantity: item.quantity,
        unit_price: Math.round(item.unit_price * 100) / 100,
        photo_path: photoPath,
        stain_markers: markers
      });
    });

    writeDB(db);
    res.json({ success: true, orderId, totalAmount });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/orders/create-with-paths', (req, res) => {
  try {
    const { customer_name, phone, items, photo_paths, stain_markers } = req.body;
    const orderId = generateOrderNo();
    const now = new Date().toISOString();

    let totalAmount = 0;
    items.forEach(item => {
      const itemTotal = item.quantity * item.unit_price;
      totalAmount = Math.round((totalAmount + itemTotal) * 100) / 100;
    });

    const db = readDB();

    const newOrder = {
      id: orderId,
      customer_name,
      phone,
      total_amount: Math.round(totalAmount * 100) / 100,
      status: '已收衣',
      created_at: now,
      updated_at: now
    };

    db.orders.push(newOrder);

    items.forEach((item, index) => {
      const photoPath = photo_paths && photo_paths[index] ? photo_paths[index] : null;
      const markers = stain_markers && stain_markers[index] ? stain_markers[index] : [];
      db.orderItems.push({
        id: Date.now() + index,
        order_id: orderId,
        clothing_type: item.clothing_type,
        quantity: item.quantity,
        unit_price: Math.round(item.unit_price * 100) / 100,
        photo_path: photoPath,
        stain_markers: markers
      });
    });

    writeDB(db);
    res.json({ success: true, orderId, totalAmount });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    const { status, date } = req.query;
    const db = readDB();

    let filteredOrders = db.orders;

    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(o => o.status === status);
    }

    if (date) {
      filteredOrders = filteredOrders.filter(o => {
        const orderDate = new Date(o.created_at).toISOString().split('T')[0];
        return orderDate === date;
      });
    }

    const ordersWithSummary = filteredOrders.map(order => {
      const items = db.orderItems.filter(i => i.order_id === order.id);
      const itemsSummary = items.map(i => `${i.clothing_type}x${i.quantity}`).join(', ');
      return {
        ...order,
        items_summary: itemsSummary,
        item_count: items.length
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, orders: ordersWithSummary });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const db = readDB();
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }
    const items = db.orderItems.filter(i => i.order_id === req.params.id);
    order.items = items;
    res.json({ success: true, order });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['已收衣', '洗涤中', '已完成', '已取衣'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: '无效的订单状态' });
    }

    const db = readDB();
    const orderIndex = db.orders.findIndex(o => o.id === req.params.id);

    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const now = new Date().toISOString();
    db.orders[orderIndex].status = status;
    db.orders[orderIndex].updated_at = now;

    writeDB(db);
    res.json({ success: true });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/orders/phone/:phone', (req, res) => {
  try {
    const db = readDB();
    const orders = db.orders.filter(o => o.phone === req.params.phone);

    const ordersWithSummary = orders.map(order => {
      const items = db.orderItems.filter(i => i.order_id === order.id);
      const itemsSummary = items.map(i => `${i.clothing_type}x${i.quantity}`).join(', ');
      return {
        ...order,
        items_summary: itemsSummary
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, orders: ordersWithSummary });
  } catch (error) {
    console.error('查询订单失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/receipt/:orderId', (req, res) => {
  try {
    const db = readDB();
    const order = db.orders.find(o => o.id === req.params.orderId);
    if (!order) {
      return res.status(404).send('订单不存在');
    }
    const items = db.orderItems.filter(i => i.order_id === req.params.orderId);

    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>干洗店小票 - ${order.id}</title>
  <style>
    body {
      font-family: 'Microsoft YaHei', sans-serif;
      width: 300px;
      margin: 0 auto;
      padding: 10px;
      font-size: 14px;
    }
    .receipt-header {
      text-align: center;
      border-bottom: 1px dashed #333;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .receipt-header h1 {
      font-size: 18px;
      margin: 0 0 5px 0;
    }
    .receipt-header p {
      margin: 2px 0;
      font-size: 12px;
    }
    .order-info {
      border-bottom: 1px dashed #333;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .order-info p {
      margin: 3px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .items-table th, .items-table td {
      text-align: left;
      padding: 3px 0;
      font-size: 13px;
    }
    .items-table th {
      border-bottom: 1px dashed #333;
    }
    .items-table .item-row td {
      border-bottom: 1px dotted #ccc;
    }
    .stain-note {
      font-size: 12px;
      color: #e74c3c;
      margin-top: 2px;
    }
    .total {
      text-align: right;
      font-size: 16px;
      font-weight: bold;
      padding: 10px 0;
      border-top: 1px dashed #333;
    }
    .receipt-footer {
      text-align: center;
      margin-top: 15px;
      font-size: 12px;
    }
    .status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      background: #e3f2fd;
      color: #1976d2;
      font-weight: bold;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .no-print {
        display: none;
      }
    }
    .no-print {
      text-align: center;
      margin-top: 20px;
    }
    .print-btn {
      padding: 10px 20px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="receipt-header">
    <h1>洁净干洗店</h1>
    <p>地址：XXX街道XXX号</p>
    <p>电话：400-XXX-XXXX</p>
  </div>

  <div class="order-info">
    <p><strong>订单号：</strong>${order.id}</p>
    <p><strong>客户姓名：</strong>${order.customer_name}</p>
    <p><strong>联系电话：</strong>${order.phone}</p>
    <p><strong>收衣时间：</strong>${new Date(order.created_at).toLocaleString('zh-CN')}</p>
    <p><strong>订单状态：</strong><span class="status">${order.status}</span></p>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>衣物类型</th>
        <th>数量</th>
        <th>单价</th>
        <th>小计</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => {
        const itemTotal = Math.round(item.quantity * item.unit_price * 100) / 100;
        const hasMarkers = item.stain_markers && item.stain_markers.length > 0;
        return `
        <tr class="item-row">
          <td>
            ${item.clothing_type}
            ${hasMarkers ? `<div class="stain-note">🎯 污渍标记: ${item.stain_markers.length}处</div>` : ''}
          </td>
          <td>${item.quantity}</td>
          <td>¥${item.unit_price.toFixed(2)}</td>
          <td>¥${itemTotal.toFixed(2)}</td>
        </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="total">
    合计：¥${order.total_amount.toFixed(2)}
  </div>

  <div class="receipt-footer">
    <p>预计取衣时间：3天后</p>
    <p>感谢您的惠顾！</p>
    <p>请妥善保管此小票</p>
  </div>

  <div class="no-print">
    <button class="print-btn" onclick="window.print()">打印小票</button>
  </div>
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    console.error('生成小票失败:', error);
    res.status(500).send('生成小票失败');
  }
});

app.post('/api/upload/chunk', chunkUpload.single('chunk'), (req, res) => {
  try {
    const { fileId, chunkIndex, totalChunks } = req.body;

    if (!fileId || chunkIndex === undefined) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    const chunkDir = path.join(CHUNKS_DIR, fileId);
    const chunkPath = path.join(chunkDir, chunkIndex);

    if (!fs.existsSync(chunkPath)) {
      return res.status(404).json({ success: false, error: '分片未找到' });
    }

    const files = fs.readdirSync(chunkDir);
    const uploadedChunks = files.filter(f => !isNaN(parseInt(f))).length;

    res.json({
      success: true,
      uploadedChunks,
      totalChunks: parseInt(totalChunks) || 0
    });
  } catch (error) {
    console.error('上传分片失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/upload/merge', async (req, res) => {
  try {
    const { fileId, fileName, totalChunks, generateThumbnail: shouldGenerateThumbnail } = req.body;

    if (!fileId || !fileName) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    const chunkDir = path.join(CHUNKS_DIR, fileId);
    if (!fs.existsSync(chunkDir)) {
      return res.status(404).json({ success: false, error: '分片目录不存在' });
    }

    const chunkFiles = fs.readdirSync(chunkDir)
      .filter(f => !isNaN(parseInt(f)))
      .sort((a, b) => parseInt(a) - parseInt(b));

    if (chunkFiles.length !== parseInt(totalChunks)) {
      return res.status(400).json({
        success: false,
        error: `分片数量不匹配，期望 ${totalChunks} 个，实际 ${chunkFiles.length} 个`
      });
    }

    const ext = path.extname(fileName);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    const writeStream = fs.createWriteStream(filePath);

    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(chunkDir, chunkFile);
      const chunkBuffer = fs.readFileSync(chunkPath);
      writeStream.write(chunkBuffer);
    }

    writeStream.end();

    writeStream.on('finish', async () => {
      let thumbnailPath = null;

      if (shouldGenerateThumbnail && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase())) {
        try {
          const thumbName = `thumb_${uniqueName}`;
          const thumbOutputPath = path.join(THUMBNAIL_DIR, thumbName);
          await generateThumbnail(filePath, thumbOutputPath);
          thumbnailPath = `/uploads/thumbnails/${thumbName}`;
        } catch (e) {
          console.warn('缩略图生成失败:', e.message);
        }
      }

      fs.rmSync(chunkDir, { recursive: true, force: true });

      res.json({
        success: true,
        filePath: `/uploads/${uniqueName}`,
        thumbnailPath
      });
    });

    writeStream.on('error', (error) => {
      console.error('合并文件失败:', error);
      res.status(500).json({ success: false, error: error.message });
    });

  } catch (error) {
    console.error('合并文件失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/upload/thumbnail', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传图片' });
    }

    const ext = path.extname(req.file.originalname);
    const thumbName = `thumb_${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const thumbOutputPath = path.join(THUMBNAIL_DIR, thumbName);

    try {
      await generateThumbnail(req.file.path, thumbOutputPath);
      res.json({
        success: true,
        thumbnailPath: `/uploads/thumbnails/${thumbName}`
      });
    } catch (e) {
      res.json({
        success: true,
        thumbnailPath: `/uploads/${req.file.filename}`
      });
    }
  } catch (error) {
    console.error('生成缩略图失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/upload/check/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const chunkDir = path.join(CHUNKS_DIR, fileId);

    if (!fs.existsSync(chunkDir)) {
      return res.json({ success: true, uploadedChunks: [] });
    }

    const uploadedChunks = fs.readdirSync(chunkDir)
      .filter(f => !isNaN(parseInt(f)))
      .map(f => parseInt(f))
      .sort((a, b) => a - b);

    res.json({ success: true, uploadedChunks });
  } catch (error) {
    console.error('检查上传状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/upload/chunks/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const chunkDir = path.join(CHUNKS_DIR, fileId);

    if (fs.existsSync(chunkDir)) {
      fs.rmSync(chunkDir, { recursive: true, force: true });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('清除分片失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  干洗店订单管理系统已启动`);
  console.log(`========================================`);
  console.log(`  主页:     http://localhost:${PORT}`);
  console.log(`  店员端:   http://localhost:${PORT}/staff.html`);
  console.log(`  用户查询: http://localhost:${PORT}/query.html`);
  console.log(`========================================`);
});
