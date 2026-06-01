class TerminalRenderer {
  constructor() {
    this.currentPage = 'dashboard';
    this.currentPaymentId = null;
    this.isProcessing = false;
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupEventListeners();
    this.loadInitialData();
    this.setupAPIListeners();
  }

  setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        this.switchPage(page);
      });
    });
  }

  switchPage(pageName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageName);
    });

    document.querySelectorAll('.page').forEach(page => {
      page.classList.toggle('active', page.id === `page-${pageName}`);
    });

    this.currentPage = pageName;

    if (pageName === 'devices') this.loadDevices();
    if (pageName === 'fingerprint') this.loadFingerprints();
    if (pageName === 'history') this.loadHistory();
    if (pageName === 'offline') this.loadPendingPayments();
    if (pageName === 'printer') this.loadPrinters();
  }

  setupEventListeners() {
    document.getElementById('btn-simulate').addEventListener('click', () => this.simulatePayment());
    document.getElementById('btn-cancel').addEventListener('click', () => this.cancelPayment());

    document.getElementById('btn-refresh-devices').addEventListener('click', () => this.loadDevices());
    document.getElementById('btn-sim-connect').addEventListener('click', () => this.simulateDeviceConnect());
    document.getElementById('btn-sim-disconnect').addEventListener('click', () => this.simulateDeviceDisconnect());

    document.getElementById('btn-capture-finger').addEventListener('click', () => this.captureFingerprint());

    document.getElementById('btn-retry-all').addEventListener('click', () => this.retryAllPending());

    document.getElementById('btn-refresh-printers').addEventListener('click', () => this.loadPrinters());
  }

  setupAPIListeners() {
    window.terminalAPI.usb.onDeviceConnected((device) => {
      this.showToast(`设备已连接: ${device.product}`, 'info');
      this.updateDeviceStatus(true);
      this.loadDevices();
    });

    window.terminalAPI.usb.onDeviceDisconnected((device) => {
      this.showToast(`设备已断开: ${device.product}`, 'error');
      this.updateDeviceStatus(false);
      this.loadDevices();
    });

    window.terminalAPI.payment.onStatus((status) => {
      this.handlePaymentStatus(status);
    });

    window.terminalAPI.app.onNetworkStatus(({ online }) => {
      this.updateNetworkStatus(online);
    });
  }

  async loadInitialData() {
    try {
      const status = await window.terminalAPI.app.getStatus();
      this.updateNetworkStatus(status.isOnline);
      this.updateDeviceStatus(status.usbDevices.some(d => d.is_connected));
      this.updatePendingCount(status.pendingCount);
      document.getElementById('ws-port').textContent = status.wsPort;
      document.getElementById('stat-fingerprints').textContent = status.fingerprintCount;
      document.getElementById('stat-pending').textContent = status.pendingCount;

      await this.loadUserSelect();
      await this.loadStats();
    } catch (error) {
      console.error('加载初始数据失败:', error);
    }
  }

  async loadUserSelect() {
    const users = await window.terminalAPI.fingerprint.listUsers();
    const select = document.getElementById('user-select');
    if (select && users) {
      select.innerHTML = '<option value="">随机选择已注册用户</option>';
      users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.full_name || user.username} (余额: ¥${user.balance?.toFixed(2) || '0.00'}) - ${user.fingerprint_count || 0}个指纹`;
        select.appendChild(option);
      });
    }
  }

  async loadStats() {
    const history = await window.terminalAPI.payment.getHistory(100);
    const today = new Date().toDateString();
    const todayPayments = history.filter(p => 
      new Date(p.created_at).toDateString() === today && p.status === 'completed'
    );

    const todayTotal = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('stat-today').textContent = `¥${todayTotal.toFixed(2)}`;
    document.getElementById('stat-count').textContent = todayPayments.length;
  }

  updateNetworkStatus(online) {
    const dot = document.getElementById('network-dot');
    const text = document.getElementById('network-text');

    dot.classList.toggle('online', online);
    dot.classList.toggle('offline', !online);
    text.textContent = online ? '在线' : '离线';
  }

  updateDeviceStatus(connected) {
    const dot = document.getElementById('usb-dot');
    const text = document.getElementById('usb-text');

    dot.classList.toggle('online', connected);
    dot.classList.toggle('offline', !connected);
    text.textContent = connected ? '已连接' : '未连接';
  }

  updatePendingCount(count) {
    document.getElementById('pending-count').textContent = count;
    document.getElementById('stat-pending').textContent = count;
  }

  async simulatePayment() {
    if (this.isProcessing) return;

    const amountInput = document.getElementById('amount-input');
    const amount = parseFloat(amountInput.value);
    const userSelect = document.getElementById('user-select');
    const selectedUserId = userSelect ? parseInt(userSelect.value) : null;

    if (!amount || amount <= 0) {
      this.showToast('请输入有效的金额', 'error');
      return;
    }

    this.isProcessing = true;
    document.getElementById('btn-simulate').disabled = true;
    document.getElementById('btn-cancel').style.display = 'inline-block';

    document.getElementById('sim-amount').textContent = `¥${amount.toFixed(2)}`;
    this.setStatus('info', '正在创建支付请求...');
    this.setSensorState('waiting');

    try {
      const result = await window.terminalAPI.payment.simulateRequest(amount);

      if (result.success) {
        this.currentPaymentId = result.paymentId;
        
        let userName = '随机用户';
        if (selectedUserId) {
          const users = await window.terminalAPI.fingerprint.listUsers();
          const user = users.find(u => u.id === selectedUserId);
          userName = user ? user.full_name : userName;
        }
        
        this.setStatus('info', `请${userName}按指纹验证...`);
        this.setSensorState('waiting');

        const confirmResult = await window.terminalAPI.payment.confirmFingerprint(result.paymentId, selectedUserId);

        if (confirmResult.success) {
          this.setSensorState('active');
          this.setStatus('success', `支付成功！订单号: ${result.transactionId}`);

          document.getElementById('stat-fingerprints').textContent = 
            await window.terminalAPI.fingerprint.listTemplates().then(t => t.length);

          await this.loadStats();
          await this.loadHistory();
        } else {
          this.setSensorState('error');
          this.setStatus('error', confirmResult.error || '支付失败');
        }
      } else {
        this.setStatus('error', result.error);
      }
    } catch (error) {
      this.setStatus('error', error.message);
      this.showToast(error.message, 'error');
    } finally {
      this.resetPaymentUI();
    }
  }

  async cancelPayment() {
    if (this.currentPaymentId) {
      await window.terminalAPI.payment.cancel(this.currentPaymentId);
      this.setStatus('info', '支付已取消');
    }
    this.resetPaymentUI();
  }

  resetPaymentUI() {
    this.isProcessing = false;
    this.currentPaymentId = null;
    document.getElementById('btn-simulate').disabled = false;
    document.getElementById('btn-cancel').style.display = 'none';
    document.getElementById('amount-input').value = '';

    setTimeout(() => {
      this.setSensorState('idle');
      this.setStatus('info', '等待支付请求...');
    }, 3000);
  }

  handlePaymentStatus(status) {
    switch (status.type) {
      case 'fingerprint_capture_progress':
        this.showProgress(status.progress);
        break;
      case 'fingerprint_capture_started':
        this.setStatus('info', '请将手指放在指纹采集器上...');
        break;
      case 'fingerprint_capture_completed':
        this.setStatus('info', '指纹采集完成，正在验证...');
        break;
      case 'fingerprint_verified':
        this.setStatus('success', '指纹验证成功');
        break;
      case 'verifying_fingerprint':
        this.setStatus('info', '正在验证指纹...');
        break;
      case 'processing_payment':
        this.setStatus('info', `正在处理支付，用户: ${status.user.fullName}`);
        break;
      case 'bank_processing':
        this.setStatus('info', '正在连接银行服务器...');
        break;
      case 'payment_completed':
        this.setSensorState('active');
        this.setStatus('success', `支付成功！金额: ¥${status.amount.toFixed(2)}`);
        this.showToast(`支付成功: ¥${status.amount.toFixed(2)}`, 'success');
        break;
      case 'payment_failed':
        this.setSensorState('error');
        this.setStatus('error', status.error);
        this.showToast(status.error, 'error');
        break;
      case 'payment_cancelled':
        this.setStatus('info', '支付已取消');
        break;
    }

    if (status.type === 'payment_completed' || status.type === 'payment_failed') {
      this.loadStats();
      this.loadHistory();
      this.loadPendingPayments();
    }
  }

  setStatus(type, message) {
    const el = document.getElementById('status-message');
    el.className = `status-message ${type}`;
    el.textContent = message;
  }

  setSensorState(state) {
    const ring = document.getElementById('sensor-ring');
    const inner = document.getElementById('sensor-inner');
    const icon = inner.querySelector('span') || inner;

    ring.className = 'sensor-ring';
    inner.className = 'sensor-inner';

    if (state === 'active') {
      ring.classList.add('active');
      inner.classList.add('active');
      icon.textContent = '✓';
    } else if (state === 'waiting') {
      ring.classList.add('waiting');
      icon.textContent = '👆';
    } else if (state === 'error') {
      inner.classList.add('error');
      icon.textContent = '✗';
    } else {
      icon.textContent = '👆';
    }
  }

  showProgress(progress) {
    const bar = document.getElementById('progress-bar');
    const fill = document.getElementById('progress-fill');

    if (progress < 100) {
      bar.style.display = 'block';
      fill.style.width = `${progress}%`;
    } else {
      bar.style.display = 'none';
      fill.style.width = '0%';
    }
  }

  async loadDevices() {
    const devices = await window.terminalAPI.usb.getDevices();
    const grid = document.getElementById('devices-grid');

    if (devices.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
          暂无设备
        </div>
      `;
      return;
    }

    grid.innerHTML = devices.map(device => `
      <div class="device-card ${device.is_connected ? 'connected' : ''}">
        <div class="device-header">
          <div class="device-icon">🔌</div>
          <span class="device-status ${device.is_connected ? 'connected' : 'disconnected'}">
            ${device.is_connected ? '已连接' : '已断开'}
          </span>
        </div>
        <div class="device-info">
          <h4>${device.product || '未知设备'}</h4>
          <p>${device.manufacturer || '未知厂商'}</p>
        </div>
        <div class="device-details">
          <div>
            <span>VID:PID</span>
            <span>${device.vendor_id.toString(16).padStart(4, '0')}:${device.product_id.toString(16).padStart(4, '0')}</span>
          </div>
          <div>
            <span>序列号</span>
            <span>${device.serial_number ? device.serial_number.substring(0, 12) + '...' : 'N/A'}</span>
          </div>
          <div>
            <span>类型</span>
            <span>${device.is_virtual ? '虚拟设备' : '物理设备'}</span>
          </div>
          <div>
            <span>最后在线</span>
            <span>${new Date(device.last_seen).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </div>
    `).join('');

    const connectedCount = devices.filter(d => d.is_connected).length;
    this.updateDeviceStatus(connectedCount > 0);
  }

  async simulateDeviceConnect() {
    await window.terminalAPI.usb.simulateConnect();
    this.showToast('已模拟连接虚拟指纹设备', 'info');
  }

  async simulateDeviceDisconnect() {
    await window.terminalAPI.usb.simulateDisconnect();
    this.showToast('已模拟断开虚拟指纹设备', 'info');
  }

  async loadFingerprints() {
    const templates = await window.terminalAPI.fingerprint.listTemplates();
    const grid = document.getElementById('templates-grid');

    if (templates.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
          暂无指纹模板
        </div>
      `;
      return;
    }

    grid.innerHTML = templates.map(t => `
      <div class="template-card">
        <div class="template-header">
          <div class="template-avatar">${t.full_name ? t.full_name[0] : 'U'}</div>
          <div class="template-info">
            <h4>${t.full_name || t.username}</h4>
            <p>@${t.username}</p>
          </div>
        </div>
        <div class="template-meta">
          <span>${t.finger_name || '未知手指'}</span>
          <span class="quality-score">质量: ${t.quality_score}%</span>
        </div>
        <div class="template-meta">
          <span>模板ID: #${t.id}</span>
          <button class="btn btn-danger" style="padding: 4px 10px; font-size: 12px;" 
                  onclick="renderer.deleteFingerprint(${t.id})">删除</button>
        </div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 10px;">
          创建时间: ${new Date(t.created_at).toLocaleString('zh-CN')}
        </div>
      </div>
    `).join('');

    document.getElementById('stat-fingerprints').textContent = templates.length;
  }

  async captureFingerprint() {
    const btn = document.getElementById('btn-capture-finger');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> 采集中...';

    try {
      const result = await window.terminalAPI.fingerprint.capture({
        userId: 1,
        fingerName: '右手拇指'
      });

      if (result.success) {
        this.showToast('指纹采集成功', 'success');
        await this.loadFingerprints();
      } else {
        this.showToast(result.error, 'error');
      }
    } catch (error) {
      this.showToast(error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '采集指纹';
    }
  }

  async deleteFingerprint(templateId) {
    if (confirm('确定要删除这个指纹模板吗？')) {
      const success = await window.terminalAPI.fingerprint.deleteTemplate(templateId);
      if (success) {
        this.showToast('指纹模板已删除', 'info');
        await this.loadFingerprints();
      }
    }
  }

  async loadHistory() {
    const history = await window.terminalAPI.payment.getHistory(50);
    const tbody = document.getElementById('history-body');

    if (history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
            暂无支付记录
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = history.map(p => `
      <tr>
        <td>${new Date(p.created_at).toLocaleString('zh-CN')}</td>
        <td style="font-family: monospace; font-size: 12px;">${p.transaction_id}</td>
        <td>${p.merchant_name}</td>
        <td style="font-weight: 600;">¥${p.amount.toFixed(2)}</td>
        <td>${p.full_name || '-'}</td>
        <td>
          <span class="status-badge ${p.status}">${this.getStatusText(p.status)}</span>
          ${p.is_offline ? ' <span style="font-size: 10px; color: #9c59b6;">[离线]</span>' : ''}
        </td>
        <td>
          ${p.status === 'completed' ? `
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px;"
                    onclick="renderer.printReceipt(${p.id})">打印</button>
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px;"
                    onclick="renderer.generatePDF(${p.id})">PDF</button>
          ` : p.status === 'pending_offline' ? `
            <button class="btn btn-primary" style="padding: 4px 10px; font-size: 12px;"
                    onclick="renderer.retryPayment(${p.id})">重试</button>
          ` : '-'}
        </td>
      </tr>
    `).join('');
  }

  getStatusText(status) {
    const map = {
      'pending': '待处理',
      'awaiting_fingerprint': '等待指纹',
      'processing': '处理中',
      'completed': '已完成',
      'failed': '失败',
      'cancelled': '已取消',
      'pending_offline': '离线待同步'
    };
    return map[status] || status;
  }

  async loadPendingPayments() {
    const pending = await window.terminalAPI.offline.getPending();
    const list = document.getElementById('pending-list');

    this.updatePendingCount(pending.length);

    if (pending.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
          暂无待同步的离线支付
        </div>
      `;
      return;
    }

    list.innerHTML = pending.map(p => `
      <div class="pending-item">
        <div>
          <div style="font-weight: 600;">${p.merchant_name}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 5px;">
            订单号: ${p.transaction_id}
          </div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 3px;">
            ${new Date(p.payment_created_at).toLocaleString('zh-CN')}
            · 重试 ${p.retry_count} 次
          </div>
        </div>
        <div style="text-align: right;">
          <div class="pending-amount">¥${p.amount.toFixed(2)}</div>
          <button class="btn btn-primary" style="margin-top: 10px; padding: 6px 15px; font-size: 12px;"
                  onclick="renderer.retryPayment(${p.payment_id})">重试</button>
        </div>
      </div>
    `).join('');
  }

  async retryAllPending() {
    const result = await window.terminalAPI.offline.retryAll();
    this.showToast(`处理完成: 成功 ${result.success} 笔, 失败 ${result.failed} 笔`, 
      result.failed > 0 ? 'error' : 'success');
    await this.loadPendingPayments();
    await this.loadHistory();
  }

  async retryPayment(paymentId) {
    if (this.paymentProcessor) {
      const result = await this.paymentProcessor.retryOfflinePayment(paymentId);
    }
    await window.terminalAPI.offline.retryAll();
    await this.loadPendingPayments();
    await this.loadHistory();
  }

  async loadPrinters() {
    const printers = await window.terminalAPI.printer.list();
    const list = document.getElementById('printers-list');

    if (printers.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">
          未检测到打印机
        </div>
      `;
      return;
    }

    list.innerHTML = printers.map(p => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
        <div>
          <div style="font-weight: 500;">${p.displayName || p.name}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 3px;">
            ${p.isDefault ? '<span style="color: #00ff88;">默认打印机</span> · ' : ''}
            状态: ${p.status || '就绪'}
          </div>
        </div>
        <div class="status-dot ${p.status === 'ready' ? 'online' : 'offline'}"></div>
      </div>
    `).join('');
  }

  async printReceipt(paymentId) {
    try {
      const result = await window.terminalAPI.printer.printReceipt(paymentId);
      if (result.success) {
        this.showToast('小票已发送到打印机', 'success');
        if (result.pdfPath) {
          console.log('PDF路径:', result.pdfPath);
        }
      } else {
        this.showToast(result.error, 'error');
      }
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  async generatePDF(paymentId) {
    try {
      const result = await window.terminalAPI.printer.generatePDF(paymentId);
      if (result.success) {
        this.showToast(`PDF已生成: ${result.fileName}`, 'success');
      } else {
        this.showToast(result.error, 'error');
      }
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

const renderer = new TerminalRenderer();
window.renderer = renderer;
