const { app, BrowserWindow, ipcMain, dialog, print, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const Database = require('better-sqlite3');
const csv = require('csv-parser');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();
}

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'express-labels.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT,
      tracking_no TEXT,
      shipper_code TEXT,
      shipper_name TEXT,
      shipper_phone TEXT,
      shipper_province TEXT,
      shipper_city TEXT,
      shipper_district TEXT,
      shipper_address TEXT,
      name TEXT,
      province TEXT,
      city TEXT,
      district TEXT,
      address TEXT,
      phone TEXT,
      product TEXT,
      product_type TEXT,
      weight REAL,
      quantity INTEGER,
      pay_type TEXT,
      remark TEXT,
      print_template TEXT,
      template_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      paper_width REAL,
      paper_height REAL,
      name_x REAL,
      name_y REAL,
      name_font_size REAL,
      address_x REAL,
      address_y REAL,
      address_font_size REAL,
      phone_x REAL,
      phone_y REAL,
      phone_font_size REAL,
      product_x REAL,
      product_y REAL,
      product_font_size REAL,
      tracking_no_x REAL,
      tracking_no_y REAL,
      tracking_no_font_size REAL,
      shipper_x REAL,
      shipper_y REAL,
      shipper_font_size REAL,
      is_preset INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS print_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      template_id INTEGER,
      printed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );

    CREATE TABLE IF NOT EXISTS api_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT,
      e_business_id TEXT,
      app_key TEXT,
      is_sandbox INTEGER DEFAULT 1,
      customer_name TEXT,
      customer_pwd TEXT,
      month_code TEXT,
      shipper_name TEXT,
      shipper_phone TEXT,
      shipper_province TEXT,
      shipper_city TEXT,
      shipper_district TEXT,
      shipper_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates').get();
  if (templateCount.count === 0) {
    const insertTemplate = db.prepare(`
      INSERT INTO templates (
        name, paper_width, paper_height,
        name_x, name_y, name_font_size,
        address_x, address_y, address_font_size,
        phone_x, phone_y, phone_font_size,
        product_x, product_y, product_font_size,
        tracking_no_x, tracking_no_y, tracking_no_font_size,
        shipper_x, shipper_y, shipper_font_size,
        is_preset
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertTemplate.run(
      '顺丰快递', 100, 150,
      20, 30, 14,
      20, 60, 12,
      20, 100, 13,
      20, 120, 11,
      50, 10, 16,
      20, 135, 10
    );

    insertTemplate.run(
      '中通快递', 100, 150,
      25, 35, 14,
      25, 65, 12,
      25, 105, 13,
      25, 125, 11,
      55, 12, 16,
      25, 138, 10
    );

    insertTemplate.run(
      '圆通快递', 100, 150,
      22, 32, 14,
      22, 62, 12,
      22, 102, 13,
      22, 122, 11,
      52, 11, 16,
      22, 136, 10
    );
  }
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('import-csv', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });

  if (result.canceled) return { success: false, message: '已取消' };

  const filePath = result.filePaths[0];
  const results = [];

  return new Promise((resolve) => {
    fs.createReadStream(filePath, 'utf-8')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const insertOrder = db.prepare(`
          INSERT INTO orders (name, address, phone, product)
          VALUES (?, ?, ?, ?)
        `);

        let successCount = 0;
        const transaction = db.transaction((rows) => {
          for (const row of rows) {
            insertOrder.run(row.name, row.address, row.phone, row.product);
            successCount++;
          }
        });

        try {
          transaction(results);
          resolve({ success: true, count: successCount });
        } catch (error) {
          resolve({ success: false, message: error.message });
        }
      })
      .on('error', (error) => {
        resolve({ success: false, message: error.message });
      });
  });
});

ipcMain.handle('get-orders', (event, page = 1, pageSize = 20) => {
  const offset = (page - 1) * pageSize;
  const orders = db.prepare(`
    SELECT o.*, 
      (SELECT COUNT(*) FROM print_records pr WHERE pr.order_id = o.id) as print_count
    FROM orders o
    ORDER BY o.id DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM orders').get();

  return { orders, total: total.count, page, pageSize };
});

ipcMain.handle('get-templates', () => {
  return db.prepare('SELECT * FROM templates ORDER BY is_preset DESC, id ASC').all();
});

ipcMain.handle('save-template', (event, template) => {
  if (template.id) {
    const updateTemplate = db.prepare(`
      UPDATE templates SET
        name = ?, paper_width = ?, paper_height = ?,
        name_x = ?, name_y = ?, name_font_size = ?,
        address_x = ?, address_y = ?, address_font_size = ?,
        phone_x = ?, phone_y = ?, phone_font_size = ?,
        product_x = ?, product_y = ?, product_font_size = ?
      WHERE id = ?
    `);

    updateTemplate.run(
      template.name, template.paper_width, template.paper_height,
      template.name_x, template.name_y, template.name_font_size,
      template.address_x, template.address_y, template.address_font_size,
      template.phone_x, template.phone_y, template.phone_font_size,
      template.product_x, template.product_y, template.product_font_size,
      template.id
    );

    return { success: true, id: template.id };
  } else {
    const insertTemplate = db.prepare(`
      INSERT INTO templates (
        name, paper_width, paper_height,
        name_x, name_y, name_font_size,
        address_x, address_y, address_font_size,
        phone_x, phone_y, phone_font_size,
        product_x, product_y, product_font_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertTemplate.run(
      template.name, template.paper_width, template.paper_height,
      template.name_x, template.name_y, template.name_font_size,
      template.address_x, template.address_y, template.address_font_size,
      template.phone_x, template.phone_y, template.phone_font_size,
      template.product_x, template.product_y, template.product_font_size
    );

    return { success: true, id: result.lastInsertRowid };
  }
});

ipcMain.handle('delete-template', (event, id) => {
  db.prepare('DELETE FROM templates WHERE id = ?').run(id);
  return { success: true };
});

ipcMain.handle('get-print-records', (event, orderId) => {
  return db.prepare(`
    SELECT pr.*, t.name as template_name
    FROM print_records pr
    JOIN templates t ON pr.template_id = t.id
    WHERE pr.order_id = ?
    ORDER BY pr.printed_at DESC
  `).all(orderId);
});

ipcMain.handle('generate-preview-html', (event, orderIds, templateId) => {
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  if (!template) return { success: false, message: '模板不存在' };

  const orders = db.prepare(`
    SELECT * FROM orders WHERE id IN (${orderIds.map(() => '?').join(',')})
  `).all(...orderIds);

  let labelsHtml = '';
  for (const order of orders) {
    labelsHtml += `
      <div class="label" style="width: ${template.paper_width}mm; height: ${template.paper_height}mm;">
        <div class="field name" style="left: ${template.name_x}mm; top: ${template.name_y}mm; font-size: ${template.name_font_size}pt;">
          ${order.name}
        </div>
        <div class="field address" style="left: ${template.address_x}mm; top: ${template.address_y}mm; font-size: ${template.address_font_size}pt;">
          ${order.address}
        </div>
        <div class="field phone" style="left: ${template.phone_x}mm; top: ${template.phone_y}mm; font-size: ${template.phone_font_size}pt;">
          ${order.phone}
        </div>
        <div class="field product" style="left: ${template.product_x}mm; top: ${template.product_y}mm; font-size: ${template.product_font_size}pt;">
          ${order.product}
        </div>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>打印预览</title>
      <style>
        @media screen {
          body { background: #f0f0f0; padding: 20px; }
        }
        @media print {
          body { margin: 0; padding: 0; }
        }
        .label {
          position: relative;
          background: white;
          border: 1px solid #ccc;
          margin: 10px auto;
          page-break-after: always;
          box-sizing: border-box;
        }
        .field {
          position: absolute;
          font-family: 'Microsoft YaHei', sans-serif;
          color: black;
        }
      </style>
    </head>
    <body>
      ${labelsHtml}
    </body>
    </html>
  `;

  return { success: true, html };
});

ipcMain.handle('print-labels', async (event, orderIds, templateId) => {
  const result = await event.sender.executeJavaScript(`window.generatePreviewHtml(${JSON.stringify(orderIds)}, ${templateId})`);
  if (!result.success) return result;

  const previewWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  await previewWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(result.html)}`);

  return new Promise((resolve) => {
    previewWindow.webContents.print({}, (success, errorType) => {
      if (success) {
        const insertRecord = db.prepare(`
          INSERT INTO print_records (order_id, template_id)
          VALUES (?, ?)
        `);
        
        const transaction = db.transaction((ids) => {
          for (const id of ids) {
            insertRecord.run(id, templateId);
          }
        });
        transaction(orderIds);
      }
      previewWindow.close();
      resolve({ success });
    });
  });
});

ipcMain.handle('print-preview', async (event, orderIds, templateId) => {
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  if (!template) return { success: false, message: '模板不存在' };

  const orders = db.prepare(`
    SELECT * FROM orders WHERE id IN (${orderIds.map(() => '?').join(',')})
  `).all(...orderIds);

  let labelsHtml = '';
  for (const order of orders) {
    labelsHtml += `
      <div class="label" style="width: ${template.paper_width}mm; height: ${template.paper_height}mm;">
        <div class="field name" style="left: ${template.name_x}mm; top: ${template.name_y}mm; font-size: ${template.name_font_size}pt;">
          ${order.name}
        </div>
        <div class="field address" style="left: ${template.address_x}mm; top: ${template.address_y}mm; font-size: ${template.address_font_size}pt;">
          ${order.address}
        </div>
        <div class="field phone" style="left: ${template.phone_x}mm; top: ${template.phone_y}mm; font-size: ${template.phone_font_size}pt;">
          ${order.phone}
        </div>
        <div class="field product" style="left: ${template.product_x}mm; top: ${template.product_y}mm; font-size: ${template.product_font_size}pt;">
          ${order.product}
        </div>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>打印预览</title>
      <style>
        body { background: #f0f0f0; padding: 20px; font-family: 'Microsoft YaHei', sans-serif; }
        .toolbar {
          text-align: center;
          margin-bottom: 20px;
        }
        .toolbar button {
          padding: 10px 20px;
          font-size: 14px;
          cursor: pointer;
        }
        .label {
          position: relative;
          background: white;
          border: 1px solid #ccc;
          margin: 10px auto;
          page-break-after: always;
          box-sizing: border-box;
        }
        .field {
          position: absolute;
          color: black;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .toolbar { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <button onclick="window.print()">打印</button>
        <button onclick="window.close()">关闭</button>
      </div>
      ${labelsHtml}
    </body>
    </html>
  `;

  const previewWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: '打印预览',
    webPreferences: {
      nodeIntegration: false
    }
  });

  await previewWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  previewWindow.show();

  return { success: true };
});

function kdniaoSign(str, key) {
  return crypto.createHash('md5').update(str + key).digest('base64');
}

function kdniaoEncrypt(content, key) {
  return crypto.createHash('md5').update(content + key).digest('base64');
}

function kdniaoRequest(requestData, requestType, eBusinessId, appKey, isSandbox = true) {
  return new Promise((resolve, reject) => {
    const jsonStr = JSON.stringify(requestData);
    const dataSign = kdniaoEncrypt(jsonStr, appKey);
    
    const postData = new URLSearchParams({
      'RequestData': encodeURIComponent(jsonStr),
      'EBusinessID': eBusinessId,
      'RequestType': requestType,
      'DataSign': encodeURIComponent(dataSign),
      'DataType': '2'
    }).toString();

    const host = isSandbox ? 'sandboxapi.kdniao.com' : 'api.kdniao.com';
    const path = isSandbox ? '/Ebusiness/EbusinessOrderHandle.aspx' : '/Ebusiness/EbusinessOrderHandle.aspx';

    const options = {
      hostname: host,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

ipcMain.handle('get-api-config', () => {
  const config = db.prepare('SELECT * FROM api_config WHERE provider = ?').get('kdniao');
  return config || null;
});

ipcMain.handle('save-api-config', (event, config) => {
  const existing = db.prepare('SELECT id FROM api_config WHERE provider = ?').get('kdniao');
  
  if (existing) {
    db.prepare(`
      UPDATE api_config SET 
        e_business_id = ?, app_key = ?, is_sandbox = ?,
        customer_name = ?, customer_pwd = ?, month_code = ?,
        shipper_name = ?, shipper_phone = ?, shipper_province = ?,
        shipper_city = ?, shipper_district = ?, shipper_address = ?
      WHERE provider = 'kdniao'
    `).run(
      config.e_business_id, config.app_key, config.is_sandbox ? 1 : 0,
      config.customer_name, config.customer_pwd, config.month_code,
      config.shipper_name, config.shipper_phone, config.shipper_province,
      config.shipper_city, config.shipper_district, config.shipper_address
    );
  } else {
    db.prepare(`
      INSERT INTO api_config (
        provider, e_business_id, app_key, is_sandbox,
        customer_name, customer_pwd, month_code,
        shipper_name, shipper_phone, shipper_province,
        shipper_city, shipper_district, shipper_address
      ) VALUES ('kdniao', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      config.e_business_id, config.app_key, config.is_sandbox ? 1 : 0,
      config.customer_name, config.customer_pwd, config.month_code,
      config.shipper_name, config.shipper_phone, config.shipper_province,
      config.shipper_city, config.shipper_district, config.shipper_address
    );
  }
  
  return { success: true };
});

ipcMain.handle('get-shipper-codes', () => {
  return [
    { code: 'SF', name: '顺丰速运' },
    { code: 'ZTO', name: '中通快递' },
    { code: 'YTO', name: '圆通速递' },
    { code: 'YD', name: '韵达速递' },
    { code: 'EMS', name: 'EMS' },
    { code: 'JD', name: '京东物流' },
    { code: 'DBL', name: '德邦快递' },
    { code: 'STO', name: '申通快递' },
    { code: 'HTKY', name: '百世快递' },
    { code: 'YUNDA', name: '韵达快递' }
  ];
});

ipcMain.handle('create-e-label', async (event, orderInfo) => {
  const config = db.prepare('SELECT * FROM api_config WHERE provider = ?').get('kdniao');
  
  if (!config || !config.e_business_id || !config.app_key) {
    return { success: false, message: '请先配置快递鸟API密钥' };
  }

  const isSandbox = config.is_sandbox === 1;
  
  const requestData = {
    OrderCode: orderInfo.order_no || 'ORD' + Date.now(),
    ShipperCode: orderInfo.shipper_code,
    PayType: orderInfo.pay_type || '1',
    ExpType: '1',
    CustomerName: orderInfo.customer_name || '',
    CustomerPwd: orderInfo.customer_pwd || '',
    MonthCode: orderInfo.month_code || '',
    SendSite: orderInfo.send_site || '',
    SendStaff: orderInfo.send_staff || '',
    Quantity: 1,
    Weight: orderInfo.weight || 1,
    Remark: orderInfo.remark || '',
    IsReturnPrintTemplate: '1',
    TemplateSize: '',
    Sender: {
      Name: orderInfo.shipper_name,
      Mobile: orderInfo.shipper_phone,
      ProvinceName: orderInfo.shipper_province,
      CityName: orderInfo.shipper_city,
      ExpAreaName: orderInfo.shipper_district,
      Address: orderInfo.shipper_address
    },
    Receiver: {
      Name: orderInfo.name,
      Mobile: orderInfo.phone,
      ProvinceName: orderInfo.province,
      CityName: orderInfo.city,
      ExpAreaName: orderInfo.district,
      Address: orderInfo.address
    },
    Commodity: [
      {
        GoodsName: orderInfo.product,
        Goodsquantity: orderInfo.quantity || 1,
        GoodsWeight: orderInfo.weight || 1
      }
    ],
    AddService: []
  };

  try {
    const result = await kdniaoRequest(requestData, '1007', config.e_business_id, config.app_key, isSandbox);
    
    if (result.Success === true || result.Success === 'true') {
      const orderNo = result.Order ? result.Order.OrderCode : result.OrderCode;
      const trackingNo = result.Order ? result.Order.LogisticCode : result.LogisticCode;
      const printTemplate = result.PrintTemplate;
      const templateUrl = result.TemplateUrl;

      const fullAddress = [
        orderInfo.province,
        orderInfo.city,
        orderInfo.district,
        orderInfo.address
      ].filter(Boolean).join('');

      const shipperFullAddress = [
        orderInfo.shipper_province,
        orderInfo.shipper_city,
        orderInfo.shipper_district,
        orderInfo.shipper_address
      ].filter(Boolean).join('');

      const shipperInfo = db.prepare('SELECT * FROM templates WHERE name LIKE ?').get(`%${orderInfo.shipper_code}%`);

      const insertResult = db.prepare(`
        INSERT INTO orders (
          order_no, tracking_no, shipper_code,
          shipper_name, shipper_phone, shipper_province, shipper_city, shipper_district, shipper_address,
          name, province, city, district, address, phone,
          product, weight, quantity, remark,
          print_template, template_url,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        orderNo, trackingNo, orderInfo.shipper_code,
        orderInfo.shipper_name, orderInfo.shipper_phone, orderInfo.shipper_province, orderInfo.shipper_city, orderInfo.shipper_district, shipperFullAddress,
        orderInfo.name, orderInfo.province, orderInfo.city, orderInfo.district, fullAddress, orderInfo.phone,
        orderInfo.product, orderInfo.weight, orderInfo.quantity, orderInfo.remark,
        printTemplate, templateUrl
      );

      return {
        success: true,
        order_id: insertResult.lastInsertRowid,
        order_no: orderNo,
        tracking_no: trackingNo,
        print_template: printTemplate,
        template_url: templateUrl
      };
    } else {
      return { success: false, message: result.Reason || '申请电子面单失败' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('print-template-from-api', async (event, orderId) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  if (!order.print_template) {
    return { success: false, message: '该订单没有电子面单模板' };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>电子面单</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          @page { size: 100mm 150mm; margin: 0; }
        }
        body { 
          font-family: 'Microsoft YaHei', sans-serif; 
          margin: 0; 
          padding: 0;
        }
        .toolbar {
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          display: flex;
          gap: 10px;
        }
        .toolbar button {
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
        }
        .label-container {
          width: 100mm;
          height: 150mm;
          overflow: hidden;
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <button onclick="window.print()">打印</button>
        <button onclick="window.close()">关闭</button>
      </div>
      <div class="label-container">
        ${order.print_template}
      </div>
    </body>
    </html>
  `;

  const previewWindow = new BrowserWindow({
    width: 600,
    height: 800,
    title: '电子面单 - ' + order.tracking_no,
    webPreferences: {
      nodeIntegration: false
    }
  });

  await previewWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  previewWindow.show();

  return { success: true };
});

ipcMain.handle('get-order-detail', (event, orderId) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return { success: false, message: '订单不存在' };
  }
  return { success: true, order };
});

ipcMain.handle('delete-order', (event, orderId) => {
  db.prepare('DELETE FROM print_records WHERE order_id = ?').run(orderId);
  db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
  return { success: true };
});
