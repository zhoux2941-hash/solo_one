const { EventEmitter } = require('events');
const fetch = require('node-fetch');

class OfflineManager extends EventEmitter {
  constructor(db) {
    super();
    this.db = db;
    this.online = true;
    this.retryInterval = null;
    this.retryDelayMs = 30000;
    this.maxRetryAttempts = 10;
    this.networkCheckUrl = 'https://www.baidu.com';
    this.lastNetworkCheck = 0;
    this.networkCheckInterval = 5000;
    this.paymentProcessor = null;
  }

  setPaymentProcessor(processor) {
    this.paymentProcessor = processor;
  }

  startRetryLoop() {
    this.checkNetworkStatus();

    this.retryInterval = setInterval(() => {
      this.checkNetworkStatus();
      if (this.online) {
        this.retryPendingPayments();
      }
    }, this.retryDelayMs);
  }

  stopRetryLoop() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  async checkNetworkStatus() {
    const now = Date.now();
    if (now - this.lastNetworkCheck < this.networkCheckInterval) {
      return this.online;
    }

    this.lastNetworkCheck = now;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.networkCheckUrl, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const wasOnline = this.online;
      this.online = response.ok || response.status === 200 || response.status === 302;

      if (!wasOnline && this.online) {
        this.emit('network-status', true);
        this.emit('network-restored');
        this.retryPendingPayments();
      } else if (wasOnline && !this.online) {
        this.emit('network-status', false);
        this.emit('network-lost');
      }

      return this.online;

    } catch (error) {
      const wasOnline = this.online;
      this.online = false;

      if (wasOnline) {
        this.emit('network-status', false);
        this.emit('network-lost');
      }

      return false;
    }
  }

  isOnline() {
    return this.online;
  }

  async saveOfflinePayment(paymentId, paymentData, errorMessage = null) {
    const checkStmt = this.db.prepare(`
      SELECT id FROM pending_offline_payments WHERE payment_id = ?
    `);
    const existing = checkStmt.get(paymentId);

    if (!existing) {
      const insertStmt = this.db.prepare(`
        INSERT INTO pending_offline_payments (payment_id, fingerprint_data, request_payload)
        VALUES (?, ?, ?)
      `);

      insertStmt.run(
        paymentId,
        paymentData.fingerprintData ? Buffer.from(paymentData.fingerprintData, 'base64') : null,
        JSON.stringify({
          ...paymentData,
          errorMessage,
          savedAt: new Date().toISOString()
        })
      );
    }

    const updateStmt = this.db.prepare(`
      UPDATE payments 
      SET status = 'pending_offline',
          is_offline = 1,
          error_message = ?
      WHERE id = ?
    `);
    updateStmt.run(errorMessage || '离线支付暂存', paymentId);

    this.emit('offline-payment-saved', {
      paymentId,
      transactionId: paymentData.transactionId,
      amount: paymentData.amount
    });

    return {
      success: true,
      paymentId,
      status: 'pending_offline',
      isOffline: true,
      message: '当前网络不可用，支付已暂存本地，网络恢复后将自动重试',
      transactionId: paymentData.transactionId,
      amount: paymentData.amount
    };
  }

  async retryPendingPayments() {
    const pending = this.getPendingPayments();

    if (pending.length === 0) {
      return { success: true, processed: 0, message: '没有待处理的离线支付' };
    }

    const results = [];

    for (const pendingPayment of pending) {
      const result = await this.retrySinglePayment(pendingPayment);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    this.emit('batch-retry-complete', {
      total: pending.length,
      success: successCount,
      failed: failCount
    });

    return {
      success: true,
      total: pending.length,
      success: successCount,
      failed: failCount,
      results
    };
  }

  async retrySinglePayment(pendingPayment) {
    const payment = this.db.prepare(`
      SELECT p.*, u.username, u.full_name
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(pendingPayment.payment_id);

    if (!payment) {
      this.deletePendingPayment(pendingPayment.payment_id);
      return { success: false, paymentId: pendingPayment.payment_id, error: '支付记录不存在' };
    }

    if (payment.retry_count >= this.maxRetryAttempts) {
      this.updatePaymentStatus(pendingPayment.payment_id, 'failed', '超过最大重试次数');
      this.deletePendingPayment(pendingPayment.payment_id);
      return { success: false, paymentId: pendingPayment.payment_id, error: '超过最大重试次数' };
    }

    try {
      const updateStmt = this.db.prepare(`
        UPDATE payments 
        SET retry_count = retry_count + 1,
            last_retry_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(pendingPayment.payment_id);

      if (this.paymentProcessor) {
        const user = {
          id: payment.user_id,
          username: payment.username,
          fullName: payment.full_name
        };

        const result = await this.paymentProcessor.processBankPayment({
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          user,
          transactionId: payment.transaction_id,
          isOffline: false
        });

        if (result.success) {
          this.deletePendingPayment(payment.id);
          this.emit('offline-payment-succeeded', {
            paymentId: payment.id,
            transactionId: payment.transaction_id,
            amount: payment.amount
          });
        }

        return result;
      } else {
        return { success: false, error: '支付处理器未初始化' };
      }

    } catch (error) {
      return {
        success: false,
        paymentId: pendingPayment.payment_id,
        error: error.message,
        retryCount: payment.retry_count + 1
      };
    }
  }

  async retryAllPending() {
    this.checkNetworkStatus();
    if (!this.online) {
      return { success: false, error: '当前网络不可用' };
    }
    return this.retryPendingPayments();
  }

  getPendingPayments() {
    const stmt = this.db.prepare(`
      SELECT pop.*, 
             p.transaction_id,
             p.amount,
             p.currency,
             p.merchant_name,
             p.retry_count,
             p.created_at as payment_created_at
      FROM pending_offline_payments pop
      JOIN payments p ON pop.payment_id = p.id
      ORDER BY pop.created_at DESC
    `);
    return stmt.all();
  }

  getPendingCount() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM pending_offline_payments');
    return stmt.get().count;
  }

  deletePendingPayment(paymentId) {
    const stmt = this.db.prepare('DELETE FROM pending_offline_payments WHERE payment_id = ?');
    stmt.run(paymentId);
  }

  updatePaymentStatus(paymentId, status, errorMessage = null) {
    const stmt = this.db.prepare(`
      UPDATE payments 
      SET status = ?, error_message = ?
      WHERE id = ?
    `);
    stmt.run(status, errorMessage, paymentId);
  }

  setNetworkCheckUrl(url) {
    this.networkCheckUrl = url;
  }

  setRetryDelay(delayMs) {
    this.retryDelayMs = delayMs;
  }

  setMaxRetryAttempts(max) {
    this.maxRetryAttempts = max;
  }

  simulateNetworkOffline() {
    const wasOnline = this.online;
    this.online = false;
    if (wasOnline) {
      this.emit('network-status', false);
      this.emit('network-lost');
    }
  }

  simulateNetworkOnline() {
    const wasOffline = !this.online;
    this.online = true;
    if (wasOffline) {
      this.emit('network-status', true);
      this.emit('network-restored');
      this.retryPendingPayments();
    }
  }
}

module.exports = OfflineManager;
