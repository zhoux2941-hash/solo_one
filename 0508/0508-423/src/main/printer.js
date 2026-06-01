const { EventEmitter } = require('events');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class PrinterManager extends EventEmitter {
  constructor(db) {
    super();
    this.db = db;
    this.receiptsDir = path.join(os.tmpdir(), 'fingerprint-pay-receipts');
    this.ensureReceiptsDir();
  }

  ensureReceiptsDir() {
    if (!fs.existsSync(this.receiptsDir)) {
      fs.mkdirSync(this.receiptsDir, { recursive: true });
    }
  }

  listPrinters() {
    const printers = [];

    try {
      const electron = require('electron');
      if (electron.app && electron.BrowserWindow) {
        const win = electron.BrowserWindow.getFocusedWindow();
        if (win) {
          const webContents = win.webContents;
          const printerList = webContents.getPrinters();
          return printerList;
        }
      }
    } catch (e) {
      console.warn('无法通过Electron获取打印机列表:', e.message);
    }

    return printers.length > 0 ? printers : [
      {
        name: 'Microsoft Print to PDF',
        displayName: 'Microsoft Print to PDF',
        isDefault: true,
        status: 'ready'
      },
      {
        name: 'POS-Printer-58mm',
        displayName: 'POS小票打印机 (58mm)',
        isDefault: false,
        status: 'ready'
      },
      {
        name: 'Virtual-Printer',
        displayName: '虚拟打印机 (生成PDF)',
        isDefault: false,
        status: 'ready'
      }
    ];
  }

  async printReceipt(paymentId) {
    const payment = this.getPaymentWithDetails(paymentId);
    if (!payment) {
      return { success: false, error: '支付记录不存在' };
    }

    if (payment.status !== 'completed') {
      return { success: false, error: '支付未完成，无法打印小票' };
    }

    try {
      const pdfResult = await this.generateReceiptPDF(paymentId);

      if (!pdfResult.success) {
        return pdfResult;
      }

      const printResult = await this.sendToPrinter(pdfResult.pdfPath);

      const updateStmt = this.db.prepare(`
        UPDATE receipts SET printed_at = CURRENT_TIMESTAMP WHERE payment_id = ?
      `);
      updateStmt.run(paymentId);

      this.emit('receipt-printed', {
        paymentId,
        pdfPath: pdfResult.pdfPath
      });

      return {
        success: true,
        paymentId,
        pdfPath: pdfResult.pdfPath,
        printerResult: printResult
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async generateReceiptPDF(paymentId) {
    const payment = this.getPaymentWithDetails(paymentId);
    if (!payment) {
      return { success: false, error: '支付记录不存在' };
    }

    return new Promise((resolve, reject) => {
      try {
        const fileName = `receipt-${payment.transaction_id}.pdf`;
        const filePath = path.join(this.receiptsDir, fileName);

        const doc = new PDFDocument({
          size: [226.77, 500],
          margin: 10,
          info: {
            Title: `支付小票 - ${payment.transaction_id}`,
            Author: '指纹支付终端',
            Subject: '支付凭证'
          }
        });

        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        const centerX = 226.77 / 2;

        doc.fontSize(14).text('指纹支付终端', { align: 'center' });
        doc.fontSize(10).text('FINGERPRINT PAY TERMINAL', { align: 'center' });
        doc.moveDown();

        doc.fontSize(8).text('================================', { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(10).text('商户名称:', { continued: true });
        doc.fontSize(9).text(payment.merchant_name);

        doc.fontSize(10).text('商户编号:', { continued: true });
        doc.fontSize(9).text(payment.merchant_id);
        doc.moveDown(0.5);

        doc.fontSize(8).text('--------------------------------', { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(10).text('交易时间:', { continued: true });
        doc.fontSize(9).text(new Date(payment.completed_at || payment.created_at).toLocaleString('zh-CN'));

        doc.fontSize(10).text('订单号:', { continued: true });
        doc.fontSize(9).text(payment.transaction_id);
        doc.moveDown(0.5);

        doc.fontSize(8).text('--------------------------------', { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(10).text('付款用户:', { continued: true });
        doc.fontSize(9).text(payment.full_name || payment.username || '匿名用户');

        doc.fontSize(10).text('支付方式:', { continued: true });
        doc.fontSize(9).text('指纹支付');

        if (payment.finger_used) {
          doc.fontSize(10).text('验证指纹:', { continued: true });
          doc.fontSize(9).text(payment.finger_used);
        }
        doc.moveDown(0.5);

        doc.fontSize(8).text('--------------------------------', { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(16).text('消费金额', { align: 'center' });
        doc.fontSize(24).text(`¥ ${payment.amount.toFixed(2)}`, { align: 'center' });
        doc.fontSize(10).text(payment.currency || 'CNY', { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(8).text('--------------------------------', { align: 'center' });
        doc.moveDown(0.5);

        if (payment.bank_transaction_id) {
          doc.fontSize(10).text('银行流水:', { continued: true });
          doc.fontSize(9).text(payment.bank_transaction_id);
        }

        if (payment.bank_response_code) {
          doc.fontSize(10).text('响应代码:', { continued: true });
          doc.fontSize(9).text(payment.bank_response_code);
        }
        doc.moveDown(0.5);

        doc.fontSize(8).text('================================', { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(10).text('支付状态:', { continued: true });
        doc.fontSize(9).fillColor('green').text('成功 ✓');
        doc.fillColor('black');

        doc.moveDown(1);
        doc.fontSize(8).text('本凭证由指纹支付终端自动生成', { align: 'center' });
        doc.fontSize(8).text('如需退换货请出示此凭证', { align: 'center' });

        if (payment.is_offline) {
          doc.moveDown(0.5);
          doc.fontSize(7).fillColor('orange').text('* 离线支付，已同步完成', { align: 'center' });
          doc.fillColor('black');
        }

        doc.end();

        writeStream.on('finish', () => {
          const receiptData = JSON.stringify(this.generateReceiptJSON(payment));

          const stmt = this.db.prepare(`
            INSERT INTO receipts (payment_id, receipt_data, pdf_path, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(payment_id) DO UPDATE SET
              receipt_data = excluded.receipt_data,
              pdf_path = excluded.pdf_path
          `);
          stmt.run(paymentId, receiptData, filePath);

          resolve({
            success: true,
            paymentId,
            pdfPath: filePath,
            fileName
          });
        });

        writeStream.on('error', (err) => {
          reject(err);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  generateReceiptJSON(payment) {
    return {
      version: '1.0',
      transactionId: payment.transaction_id,
      merchant: {
        id: payment.merchant_id,
        name: payment.merchant_name
      },
      payment: {
        amount: payment.amount,
        currency: payment.currency,
        method: 'fingerprint',
        status: payment.status
      },
      user: {
        id: payment.user_id,
        name: payment.full_name || payment.username
      },
      fingerprint: {
        templateId: payment.fingerprint_template_id,
        fingerName: payment.finger_used
      },
      bank: {
        transactionId: payment.bank_transaction_id,
        responseCode: payment.bank_response_code
      },
      timestamps: {
        created: payment.created_at,
        completed: payment.completed_at,
        printed: new Date().toISOString()
      }
    };
  }

  async sendToPrinter(pdfPath) {
    const platform = os.platform();

    try {
      if (platform === 'win32') {
        const result = await this.printOnWindows(pdfPath);
        return { platform: 'windows', ...result };
      } else if (platform === 'darwin') {
        const result = await this.printOnMac(pdfPath);
        return { platform: 'macos', ...result };
      } else {
        const result = await this.printOnLinux(pdfPath);
        return { platform: 'linux', ...result };
      }
    } catch (error) {
      console.warn('直接打印失败，使用PDF文件替代:', error.message);
      return {
        success: true,
        method: 'pdf',
        message: '已生成PDF文件，请手动打印',
        pdfPath
      };
    }
  }

  async printOnWindows(pdfPath) {
    try {
      const { stdout, stderr } = await execAsync(
        `powershell -Command "Start-Process -FilePath '${pdfPath}' -Verb Print -PassThru"`
      );
      return { success: true, stdout, stderr };
    } catch (e) {
      const { stdout, stderr } = await execAsync(
        `rundll32 printui.dll,PrintUIEntry /y /n "Microsoft Print to PDF" && print /d:"Microsoft Print to PDF" "${pdfPath}"`
      );
      return { success: true, stdout, stderr };
    }
  }

  async printOnMac(pdfPath) {
    const { stdout, stderr } = await execAsync(`lpr "${pdfPath}"`);
    return { success: true, stdout, stderr };
  }

  async printOnLinux(pdfPath) {
    const { stdout, stderr } = await execAsync(`lp "${pdfPath}"`);
    return { success: true, stdout, stderr };
  }

  getPaymentWithDetails(paymentId) {
    const stmt = this.db.prepare(`
      SELECT p.*, u.username, u.full_name,
             ft.finger_name as finger_used,
             r.pdf_path as existing_pdf
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN fingerprint_templates ft ON p.fingerprint_template_id = ft.id
      LEFT JOIN receipts r ON r.payment_id = p.id
      WHERE p.id = ?
    `);
    return stmt.get(paymentId);
  }

  openPDF(pdfPath) {
    const platform = os.platform();
    let command;

    if (platform === 'win32') {
      command = `start "" "${pdfPath}"`;
    } else if (platform === 'darwin') {
      command = `open "${pdfPath}"`;
    } else {
      command = `xdg-open "${pdfPath}"`;
    }

    exec(command, (error) => {
      if (error) {
        console.error('打开PDF失败:', error);
      }
    });
  }

  getReceiptsDir() {
    return this.receiptsDir;
  }

  cleanupOldReceipts(maxAgeDays = 30) {
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    fs.readdir(this.receiptsDir, (err, files) => {
      if (err) return;

      files.forEach(file => {
        const filePath = path.join(this.receiptsDir, file);
        fs.stat(filePath, (err, stats) => {
          if (!err && now - stats.mtimeMs > maxAge) {
            fs.unlink(filePath, () => {});
          }
        });
      });
    });
  }
}

module.exports = PrinterManager;
