const { EventEmitter } = require('events');
const crypto = require('crypto');
const fetch = require('node-fetch');

class PaymentProcessor extends EventEmitter {
  constructor(db, fingerprintManager, printerManager, offlineManager) {
    super();
    this.db = db;
    this.fingerprintManager = fingerprintManager;
    this.printerManager = printerManager;
    this.offlineManager = offlineManager;
    this.pendingPayments = new Map();

    this.fingerprintManager.on('capture-started', (data) => {
      this.emit('payment-status', {
        type: 'fingerprint_capture_started',
        ...data
      });
    });

    this.fingerprintManager.on('capture-progress', (data) => {
      this.emit('payment-status', {
        type: 'fingerprint_capture_progress',
        ...data
      });
    });

    this.fingerprintManager.on('capture-completed', (data) => {
      this.emit('payment-status', {
        type: 'fingerprint_capture_completed',
        ...data
      });
    });

    this.fingerprintManager.on('verification-success', (data) => {
      this.emit('payment-status', {
        type: 'fingerprint_verified',
        ...data
      });
    });

    this.fingerprintManager.on('verification-failed', (data) => {
      this.emit('payment-status', {
        type: 'fingerprint_verification_failed',
        ...data
      });
    });
  }

  generateTransactionId() {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(6).toString('hex').toUpperCase();
    return `FP${timestamp}${random}`;
  }

  async createPaymentRequest(paymentData) {
    const { amount, merchantId, merchantName, currency = 'CNY' } = paymentData;

    if (!amount || amount <= 0) {
      return { success: false, error: '金额必须大于0' };
    }

    const transactionId = this.generateTransactionId();

    const insertStmt = this.db.prepare(`
      INSERT INTO payments (
        transaction_id, merchant_id, merchant_name, amount, currency,
        status, is_offline
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const isOffline = !this.offlineManager.isOnline();

    const info = insertStmt.run(
      transactionId,
      merchantId,
      merchantName,
      amount,
      currency,
      'awaiting_fingerprint',
      isOffline ? 1 : 0
    );

    const paymentId = info.lastInsertRowid;

    this.logTransaction(paymentId, 'payment_created', 'pending', JSON.stringify(paymentData));

    const payment = this.getPaymentById(paymentId);

    this.emit('payment-status', {
      type: 'payment_requested',
      paymentId,
      transactionId,
      amount,
      currency,
      merchantName,
      status: 'awaiting_fingerprint',
      isOffline
    });

    this.pendingPayments.set(paymentId, {
      ...payment,
      createdAt: Date.now()
    });

    return {
      success: true,
      paymentId,
      transactionId,
      amount,
      currency,
      merchantName,
      status: 'awaiting_fingerprint',
      isOffline,
      message: isOffline ? '当前处于离线模式，支付将暂存本地' : '请用户按指纹验证'
    };
  }

  async simulatePaymentRequest(amount) {
    return this.createPaymentRequest({
      amount,
      merchantId: 'MERCHANT_SIM',
      merchantName: '模拟商家',
      currency: 'CNY'
    });
  }

  async confirmFingerprint(paymentId, userId = null, cancellation = null) {
    const payment = this.getPaymentById(paymentId);
    if (!payment) {
      return { success: false, error: '支付记录不存在' };
    }

    if (payment.status !== 'awaiting_fingerprint') {
      return { success: false, error: '支付状态不正确' };
    }

    if (cancellation && cancellation.cancelled) {
      throw new Error('CANCELLED');
    }

    this.emit('payment-status', {
      type: 'fingerprint_requested',
      paymentId,
      message: '请将手指放在指纹采集器上...'
    });

    const captureResult = await this.fingerprintManager.captureFingerprint({
      userId: userId || 1,
      timeout: 30000,
      cancellation
    });

    if (!captureResult.success) {
      this.updatePaymentStatus(paymentId, 'failed', captureResult.error);
      this.logTransaction(paymentId, 'fingerprint_capture_failed', 'failed', captureResult.error);
      return { success: false, error: captureResult.error };
    }

    if (cancellation && cancellation.cancelled) {
      throw new Error('CANCELLED');
    }

    return this.confirmPaymentWithFingerprint(paymentId, captureResult.fingerprintData);
  }

  async confirmPaymentWithFingerprint(paymentId, fingerprintData) {
    const payment = this.getPaymentById(paymentId);
    if (!payment) {
      return { success: false, error: '支付记录不存在' };
    }

    if (payment.status !== 'awaiting_fingerprint') {
      return { success: false, error: '支付状态不正确' };
    }

    this.emit('payment-status', {
      type: 'verifying_fingerprint',
      paymentId,
      message: '正在验证指纹...'
    });

    const verifyResult = this.fingerprintManager.findMatchingTemplate(fingerprintData);

    if (!verifyResult.success || !verifyResult.match) {
      this.updatePaymentStatus(paymentId, 'failed', '指纹验证失败');
      this.logTransaction(paymentId, 'fingerprint_verify_failed', 'failed', verifyResult.error);

      this.emit('payment-status', {
        type: 'fingerprint_verification_failed',
        paymentId,
        error: verifyResult.error
      });

      return {
        success: false,
        error: verifyResult.error || '指纹验证失败',
        matchScore: verifyResult.matchScore
      };
    }

    this.logTransaction(
      paymentId,
      'fingerprint_verified',
      'verifying',
      `User: ${verifyResult.user.username}, Score: ${verifyResult.matchScore}`
    );

    const updateStmt = this.db.prepare(`
      UPDATE payments 
      SET user_id = ?, fingerprint_template_id = ?, status = 'processing'
      WHERE id = ?
    `);
    updateStmt.run(verifyResult.user.id, verifyResult.templateId, paymentId);

    this.emit('payment-status', {
      type: 'processing_payment',
      paymentId,
      user: verifyResult.user,
      message: '正在处理支付...'
    });

    const processResult = await this.processBankPayment({
      paymentId,
      amount: payment.amount,
      currency: payment.currency,
      user: verifyResult.user,
      transactionId: payment.transaction_id,
      isOffline: payment.is_offline
    });

    return processResult;
  }

  async processBankPayment(paymentData) {
    const { paymentId, amount, currency, user, transactionId, isOffline } = paymentData;

    this.emit('payment-status', {
      type: 'bank_processing',
      paymentId,
      message: '正在连接银行服务器...'
    });

    if (isOffline) {
      return this.offlineManager.saveOfflinePayment(paymentId, paymentData);
    }

    try {
      const bankResult = await this.mockBankDeduct({
        transactionId,
        amount,
        currency,
        userId: user.id,
        username: user.username,
        cardNumber: this.getUserCardNumber(user.id)
      });

      if (bankResult.success) {
        const updateStmt = this.db.prepare(`
          UPDATE payments 
          SET status = 'completed', 
              bank_response_code = ?,
              bank_transaction_id = ?,
              completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        updateStmt.run(bankResult.responseCode, bankResult.bankTransactionId, paymentId);

        this.updateUserBalance(user.id, -amount);

        this.logTransaction(
          paymentId,
          'payment_completed',
          'completed',
          JSON.stringify(bankResult)
        );

        this.emit('payment-status', {
          type: 'payment_completed',
          paymentId,
          transactionId,
          amount,
          currency,
          user,
          bankResult,
          message: '支付成功！'
        });

        this.pendingPayments.delete(paymentId);

        const printResult = await this.printerManager.generateReceiptPDF(paymentId);

        return {
          success: true,
          paymentId,
          transactionId,
          amount,
          currency,
          status: 'completed',
          user,
          bankResult,
          receiptPath: printResult.pdfPath
        };
      } else {
        this.updatePaymentStatus(paymentId, 'failed', bankResult.error);
        this.logTransaction(
          paymentId,
          'bank_declined',
          'failed',
          bankResult.error
        );

        this.emit('payment-status', {
          type: 'payment_failed',
          paymentId,
          error: bankResult.error
        });

        return {
          success: false,
          error: bankResult.error,
          bankResult
        };
      }

    } catch (error) {
      console.error('银行支付处理错误:', error);
      return this.offlineManager.saveOfflinePayment(paymentId, paymentData, error.message);
    }
  }

  async mockBankDeduct(deductData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.05;

        if (success) {
          resolve({
            success: true,
            responseCode: '0000',
            responseMessage: '扣款成功',
            bankTransactionId: 'BANK' + Date.now().toString() + crypto.randomBytes(4).toString('hex').toUpperCase(),
            timestamp: new Date().toISOString(),
            ...deductData
          });
        } else {
          resolve({
            success: false,
            responseCode: '5001',
            responseMessage: '余额不足',
            error: '账户余额不足，请充值后重试',
            timestamp: new Date().toISOString()
          });
        }
      }, 1500 + Math.random() * 1000);
    });
  }

  getUserCardNumber(userId) {
    const stmt = this.db.prepare('SELECT card_number FROM users WHERE id = ?');
    const user = stmt.get(userId);
    return user ? user.card_number : null;
  }

  updateUserBalance(userId, amountDelta) {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(amountDelta, userId);
  }

  updatePaymentStatus(paymentId, status, errorMessage = null) {
    const stmt = this.db.prepare(`
      UPDATE payments 
      SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, errorMessage, paymentId);
  }

  logTransaction(paymentId, action, status, details) {
    const stmt = this.db.prepare(`
      INSERT INTO transaction_logs (payment_id, action, status, details)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(paymentId, action, status, details);
  }

  getPaymentById(paymentId) {
    const stmt = this.db.prepare(`
      SELECT p.*, u.username, u.full_name
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `);
    return stmt.get(paymentId);
  }

  getPaymentStatus(paymentId) {
    const payment = this.getPaymentById(paymentId);
    if (!payment) {
      return { success: false, error: '支付记录不存在' };
    }

    return {
      success: true,
      paymentId,
      transactionId: payment.transaction_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      merchantName: payment.merchant_name,
      errorMessage: payment.error_message,
      isOffline: !!payment.is_offline,
      createdAt: payment.created_at,
      completedAt: payment.completed_at
    };
  }

  getHistory(limit = 20) {
    const stmt = this.db.prepare(`
      SELECT p.*, u.username, u.full_name,
             ft.finger_name as finger_used
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN fingerprint_templates ft ON p.fingerprint_template_id = ft.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  cancelPayment(paymentId) {
    const payment = this.getPaymentById(paymentId);
    if (!payment) {
      return { success: false, error: '支付记录不存在' };
    }

    if (payment.status !== 'awaiting_fingerprint' && payment.status !== 'pending') {
      return { success: false, error: '该支付状态无法取消' };
    }

    this.updatePaymentStatus(paymentId, 'cancelled', '用户取消');
    this.logTransaction(paymentId, 'payment_cancelled', 'cancelled', '用户主动取消');

    this.pendingPayments.delete(paymentId);

    this.emit('payment-status', {
      type: 'payment_cancelled',
      paymentId
    });

    return { success: true, paymentId, status: 'cancelled' };
  }

  retryOfflinePayment(paymentId) {
    const payment = this.getPaymentById(paymentId);
    if (!payment || !payment.is_offline) {
      return { success: false, error: '不是离线支付记录' };
    }

    const user = {
      id: payment.user_id,
      username: payment.username,
      fullName: payment.full_name
    };

    return this.processBankPayment({
      paymentId,
      amount: payment.amount,
      currency: payment.currency,
      user,
      transactionId: payment.transaction_id,
      isOffline: false
    });
  }
}

module.exports = PaymentProcessor;
