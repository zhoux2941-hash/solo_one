const { EventEmitter } = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');

class JsonRpcServer extends EventEmitter {
  constructor(port, paymentProcessor, usbManager) {
    super();
    this.port = port;
    this.paymentProcessor = paymentProcessor;
    this.usbManager = usbManager;
    this.wss = null;
    this.clients = new Set();
    this.activeRequests = new Map();
    this.requestHandlers = this.setupHandlers();
  }

  setupHandlers() {
    return {
      'device.list': this.handleDeviceList.bind(this),
      'device.connect': this.handleDeviceConnect.bind(this),
      'device.simulate.connect': this.handleSimulateConnect.bind(this),
      'device.simulate.disconnect': this.handleSimulateDisconnect.bind(this),

      'fingerprint.capture': this.handleFingerprintCapture.bind(this),
      'fingerprint.verify': this.handleFingerprintVerify.bind(this),
      'fingerprint.list': this.handleFingerprintList.bind(this),
      'fingerprint.delete': this.handleFingerprintDelete.bind(this),

      'payment.request': this.handlePaymentRequest.bind(this),
      'payment.confirm': this.handlePaymentConfirm.bind(this),
      'payment.cancel': this.handlePaymentCancel.bind(this),
      'payment.status': this.handlePaymentStatus.bind(this),
      'payment.history': this.handlePaymentHistory.bind(this),

      'receipt.print': this.handleReceiptPrint.bind(this),
      'receipt.pdf': this.handleReceiptPDF.bind(this),

      'offline.list': this.handleOfflineList.bind(this),
      'offline.retry': this.handleOfflineRetry.bind(this),

      'request.cancel': this.handleRequestCancel.bind(this),

      'terminal.status': this.handleTerminalStatus.bind(this)
    };
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });

    this.wss.on('connection', (ws, req) => {
      console.log('新的WebSocket连接:', req.socket.remoteAddress);
      this.clients.add(ws);

      const welcomeMsg = this.createResponse(null, {
        status: 'connected',
        terminal: {
          name: '指纹支付终端模拟器',
          version: '1.0.0',
          wsPort: this.port
        }
      });
      ws.send(JSON.stringify(welcomeMsg));

      ws.on('message', (data) => {
        this.handleMessage(ws, data);
      });

      ws.on('close', () => {
        console.log('WebSocket连接断开');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
        this.clients.delete(ws);
      });
    });

    console.log(`WebSocket服务器已启动，监听端口 ${this.port}`);
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
  }

  broadcast(message) {
    const msgString = typeof message === 'string' ? message : JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msgString);
      }
    });
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());

      if (Array.isArray(message)) {
        this.handleBatchRequest(ws, message);
      } else {
        this.handleSingleRequest(ws, message);
      }

    } catch (error) {
      const errorResponse = this.createErrorResponse(null, -32700, 'Parse error', {
        details: error.message
      });
      this.sendToClient(ws, errorResponse);
    }
  }

  handleBatchRequest(ws, requests) {
    const responses = [];
    requests.forEach(request => {
      try {
        const response = this.processRequest(request);
        if (response) responses.push(response);
      } catch (e) {
        responses.push(this.createErrorResponse(request.id, -32603, 'Internal error', {
          details: e.message
        }));
      }
    });
    this.sendToClient(ws, responses);
  }

  handleSingleRequest(ws, request) {
    const response = this.processRequest(request);
    if (response) {
      this.sendToClient(ws, response);
    }
  }

  processRequest(request) {
    if (!request.jsonrpc || request.jsonrpc !== '2.0') {
      return this.createErrorResponse(request.id, -32600, 'Invalid Request', {
        details: 'jsonrpc must be "2.0"'
      });
    }

    if (!request.method || typeof request.method !== 'string') {
      return this.createErrorResponse(request.id, -32600, 'Invalid Request', {
        details: 'method is required and must be a string'
      });
    }

    const handler = this.requestHandlers[request.method];
    if (!handler) {
      return this.createErrorResponse(request.id, -32601, 'Method not found', {
        method: request.method
      });
    }

    try {
      const params = request.params || {};
      
      const cancellation = { cancelled: false };
      if (request.id !== undefined && request.id !== null) {
        this.activeRequests.set(request.id, {
          method: request.method,
          params,
          cancellation,
          startTime: Date.now()
        });
      }

      const result = handler(params, cancellation, request.id);

      const cleanup = () => {
        if (request.id !== undefined && request.id !== null) {
          this.activeRequests.delete(request.id);
        }
      };

      if (result && typeof result.then === 'function') {
        return result
          .then(res => {
            cleanup();
            return this.createResponse(request.id, res);
          })
          .catch(err => {
            cleanup();
            if (err.message === 'CANCELLED') {
              return this.createErrorResponse(request.id, -32001, 'Request cancelled', {
                reason: 'Client requested cancellation'
              });
            }
            return this.createErrorResponse(request.id, -32000, err.message, {
              stack: err.stack
            });
          });
      }

      cleanup();
      return this.createResponse(request.id, result);

    } catch (error) {
      if (request.id !== undefined && request.id !== null) {
        this.activeRequests.delete(request.id);
      }
      return this.createErrorResponse(request.id, -32603, error.message, {
        details: error.stack
      });
    }
  }

  createResponse(id, result) {
    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  createErrorResponse(id, code, message, data) {
    const error = {
      code,
      message
    };
    if (data) error.data = data;

    return {
      jsonrpc: '2.0',
      id,
      error
    };
  }

  handleDeviceList() {
    return {
      devices: this.usbManager.getDevices()
    };
  }

  handleDeviceConnect(params) {
    const { deviceId } = params;
    return this.usbManager.connectDevice(deviceId);
  }

  handleSimulateConnect() {
    return this.usbManager.simulateDeviceConnect();
  }

  handleSimulateDisconnect() {
    return this.usbManager.simulateDeviceDisconnect();
  }

  async handleFingerprintCapture(params) {
    const { userId, fingerName, timeout } = params;
    return this.paymentProcessor.fingerprintManager.captureFingerprint({
      userId,
      fingerName,
      timeout
    });
  }

  async handleFingerprintVerify(params) {
    const { templateId, fingerprintData, userId } = params;
    if (userId) {
      return this.paymentProcessor.fingerprintManager.verifyFingerprintForUser(
        userId,
        fingerprintData
      );
    }
    return this.paymentProcessor.fingerprintManager.verifyFingerprint(
      templateId,
      fingerprintData
    );
  }

  handleFingerprintList() {
    return {
      templates: this.paymentProcessor.fingerprintManager.listTemplates()
    };
  }

  handleFingerprintDelete(params) {
    const { templateId } = params;
    const success = this.paymentProcessor.fingerprintManager.deleteTemplate(templateId);
    return { success };
  }

  async handlePaymentRequest(params) {
    const { amount, merchantId = 'MERCHANT_001', merchantName = '示例商家', currency = 'CNY' } = params;
    return this.paymentProcessor.createPaymentRequest({
      amount,
      merchantId,
      merchantName,
      currency
    });
  }

  async handlePaymentConfirm(params, cancellation) {
    const { paymentId, fingerprintData, userId } = params;
    if (fingerprintData) {
      return this.paymentProcessor.confirmPaymentWithFingerprint(paymentId, fingerprintData);
    }
    return this.paymentProcessor.confirmFingerprint(paymentId, userId, cancellation);
  }

  handlePaymentCancel(params) {
    const { paymentId } = params;
    return this.paymentProcessor.cancelPayment(paymentId);
  }

  handlePaymentStatus(params) {
    const { paymentId } = params;
    return this.paymentProcessor.getPaymentStatus(paymentId);
  }

  handlePaymentHistory(params) {
    const { limit = 20 } = params;
    return {
      payments: this.paymentProcessor.getHistory(limit)
    };
  }

  handleRequestCancel(params) {
    const { originalRequestId, originalMethod, reason } = params;
    
    console.log(`收到取消请求: originalRequestId=${originalRequestId}, method=${originalMethod}, reason=${reason}`);
    
    const activeRequest = this.activeRequests.get(originalRequestId);
    if (activeRequest) {
      activeRequest.cancellation.cancelled = true;
      
      if (originalMethod === 'payment.confirm') {
        const { paymentId } = activeRequest.params;
        if (paymentId) {
          this.paymentProcessor.cancelPayment(paymentId);
        }
      }
      
      console.log(`请求已标记为取消: requestId=${originalRequestId}`);
      return {
        success: true,
        cancelledRequestId: originalRequestId,
        reason
      };
    }
    
    return {
      success: false,
      message: 'Request not found or already completed'
    };
  }

  async handleReceiptPrint(params) {
    const { paymentId } = params;
    return this.paymentProcessor.printerManager.printReceipt(paymentId);
  }

  async handleReceiptPDF(params) {
    const { paymentId } = params;
    return this.paymentProcessor.printerManager.generateReceiptPDF(paymentId);
  }

  handleOfflineList() {
    return {
      pending: this.paymentProcessor.offlineManager.getPendingPayments()
    };
  }

  handleOfflineRetry() {
    return this.paymentProcessor.offlineManager.retryAllPending();
  }

  handleTerminalStatus() {
    const devices = this.usbManager.getDevices();
    const connectedDevice = this.usbManager.getConnectedDevice();
    return {
      isOnline: this.paymentProcessor.offlineManager.isOnline(),
      hasDevice: !!connectedDevice,
      device: connectedDevice,
      devices,
      pendingCount: this.paymentProcessor.offlineManager.getPendingCount(),
      fingerprintCount: this.paymentProcessor.fingerprintManager.getTemplateCount(),
      wsPort: this.port
    };
  }
}

module.exports = JsonRpcServer;
