const api = window.electronAPI;

const state = {
  currentCard: null,
  detectedCards: [],
  cards: [],
  isMonitoring: false,
  isEmulating: false,
  currentEmulatedCard: null,
  heatmapChart: null,
  timeChart: null,
  locationChart: null
};

const utils = {
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  },

  formatUID(uid) {
    if (!uid) return '-';
    return uid.toUpperCase();
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  showModal(title, content) {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    modal.style.display = 'flex';
  },

  hideModal() {
    document.getElementById('modal').style.display = 'none';
  }
};

const tabController = {
  init() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const tabId = item.dataset.tab;
        this.switchTab(tabId);
      });
    });

    document.getElementById('modalClose').addEventListener('click', () => utils.hideModal());
    document.querySelector('.modal-overlay').addEventListener('click', () => utils.hideModal());
  },

  switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    if (tabId === 'cards') {
      cardManager.loadCards();
    } else if (tabId === 'emulate') {
      emulateController.loadEmulateCards();
    } else if (tabId === 'audit') {
      auditController.loadAuditCards();
    } else if (tabId === 'crack') {
      crackController.loadCrackCards();
    } else if (tabId === 'logs') {
      logController.loadLogs();
    }
  }
};

const readerController = {
  async init() {
    this.updateReaderStatus();
    this.setupEventListeners();
  },

  async updateReaderStatus() {
    try {
      const status = await api.reader.getStatus();
      const statusDot = document.getElementById('statusDot');
      const statusText = document.getElementById('statusText');
      const readerName = document.getElementById('readerName');
      const readerStatusInfo = document.getElementById('readerStatusInfo');

      if (status.readers.length > 0) {
        statusDot.classList.add('connected');
        statusDot.classList.remove('emulating');
        statusText.textContent = '读卡器已连接';
        readerName.textContent = status.currentReader || status.readers[0];
        readerStatusInfo.textContent = '在线';

        if (status.isEmulating) {
          statusDot.classList.add('emulating');
          statusDot.classList.remove('connected');
          statusText.textContent = '模拟中';
          readerStatusInfo.textContent = '卡片模拟模式';
        }
      } else {
        statusDot.classList.remove('connected', 'emulating');
        statusText.textContent = '读卡器未连接';
        readerName.textContent = '-';
        readerStatusInfo.textContent = '离线';
      }
    } catch (e) {
      console.error('更新读卡器状态失败:', e);
    }
  },

  setupEventListeners() {
    api.on('reader-connected', (name) => {
      utils.showToast(`读卡器已连接: ${name}`, 'success');
      this.updateReaderStatus();
    });

    api.on('reader-disconnected', (name) => {
      utils.showToast(`读卡器已断开: ${name}`, 'warning');
      this.updateReaderStatus();
    });

    api.on('reader-error', (error) => {
      utils.showToast(`读卡器错误: ${error}`, 'error');
      this.updateReaderStatus();
    });
  }
};

const monitorController = {
  _lastEmulateUid: null,
  _lastEmulateTime: 0,
  DEBOUNCE_MS: 500,

  init() {
    this.setupButtons();
    this.setupEventListeners();
  },

  setupButtons() {
    document.getElementById('startMonitorBtn').addEventListener('click', () => this.startMonitoring());
    document.getElementById('stopMonitorBtn').addEventListener('click', () => this.stopMonitoring());
    document.getElementById('quickEmulateBtn').addEventListener('click', () => this.quickEmulate());
  },

  setupEventListeners() {
    api.on('card-detected', (cardInfo) => {
      this.handleCardDetected(cardInfo);
    });

    api.on('card-removed', () => {
      this.handleCardRemoved();
    });

    api.on('card-can-emulate', (cardInfo) => {
      this.showEmulatePrompt(cardInfo);
    });
  },

  startMonitoring() {
    api.monitor.start();
    state.isMonitoring = true;
    document.getElementById('startMonitorBtn').disabled = true;
    document.getElementById('stopMonitorBtn').disabled = false;
    utils.showToast('开始监控NFC卡片', 'info');
  },

  stopMonitoring() {
    api.monitor.stop();
    state.isMonitoring = false;
    document.getElementById('startMonitorBtn').disabled = false;
    document.getElementById('stopMonitorBtn').disabled = true;
    utils.showToast('停止监控NFC卡片', 'info');
  },

  handleCardDetected(cardInfo) {
    state.currentCard = cardInfo;
    state.detectedCards.unshift({
      ...cardInfo,
      timestamp: new Date().toISOString(),
      canEmulate: false
    });

    if (state.detectedCards.length > 50) {
      state.detectedCards.pop();
    }

    this.updateCardInfo(cardInfo);
    this.updateDetectionHistory();
    utils.showToast(`检测到卡片: ${cardInfo.uid}`, 'info');
  },

  handleCardRemoved() {
    state.currentCard = null;
    document.getElementById('detectedUid').textContent = '-';
    document.getElementById('detectedSak').textContent = '-';
    document.getElementById('detectedAtqa').textContent = '-';
    document.getElementById('detectedType').textContent = '-';
    document.getElementById('emulatePrompt').style.display = 'none';
  },

  updateCardInfo(cardInfo) {
    document.getElementById('detectedUid').textContent = utils.formatUID(cardInfo.uid);
    document.getElementById('detectedSak').textContent = cardInfo.sak;
    document.getElementById('detectedAtqa').textContent = cardInfo.atqa;
    document.getElementById('detectedType').textContent = cardInfo.type;
  },

  showEmulatePrompt(cardInfo) {
    const now = Date.now();
    const sameCard = this._lastEmulateUid === cardInfo.uid;
    const withinDebounce = (now - this._lastEmulateTime) < this.DEBOUNCE_MS;

    if (sameCard && withinDebounce) {
      return;
    }

    this._lastEmulateUid = cardInfo.uid;
    this._lastEmulateTime = now;

    const lastCard = state.detectedCards[0];
    if (lastCard && lastCard.uid === cardInfo.uid) {
      lastCard.canEmulate = true;
      this.updateDetectionHistory();
    }

    document.getElementById('emulatePrompt').style.display = 'flex';
  },

  async quickEmulate() {
    if (!state.currentCard) {
      utils.showToast('没有检测到卡片', 'error');
      return;
    }

    try {
      const location = prompt('请输入模拟位置（可选）:');
      await api.emulate.start({ uid: state.currentCard.uid, location });
      state.isEmulating = true;
      state.currentEmulatedCard = state.currentCard;
      
      document.getElementById('activeCardName').textContent = state.currentCard.uid;
      utils.showToast(`开始模拟卡片: ${state.currentCard.uid}`, 'success');
      readerController.updateReaderStatus();
    } catch (e) {
      utils.showToast(`模拟失败: ${e.message}`, 'error');
    }
  },

  updateDetectionHistory() {
    const tbody = document.getElementById('detectionHistory');
    if (state.detectedCards.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无检测记录</td></tr>';
      return;
    }

    tbody.innerHTML = state.detectedCards.slice(0, 20).map(card => `
      <tr>
        <td>${utils.formatDate(card.timestamp)}</td>
        <td><code>${utils.formatUID(card.uid)}</code></td>
        <td>${card.sak}</td>
        <td>${card.atqa}</td>
        <td>${card.canEmulate ? 
          '<span class="badge badge-success">可模拟</span>' : 
          '<span class="badge badge-warning">未知</span>'}
        </td>
      </tr>
    `).join('');
  }
};

const analyzeController = {
  init() {
    this.setupButtons();
    this.setupEventListeners();
  },

  setupButtons() {
    document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeCard());
    document.getElementById('dumpJsonBtn').addEventListener('click', () => this.dumpToJson());
  },

  setupEventListeners() {
    api.on('analyze:progress', (data) => {
      this.updateProgress(data.progress, `正在分析扇区 ${data.sector}`);
    });
  },

  async analyzeCard() {
    if (!state.currentCard) {
      utils.showToast('请先将卡片放在读卡器上', 'error');
      return;
    }

    try {
      document.getElementById('analyzeBtn').disabled = true;
      this.updateProgress(0, '开始分析...');

      const result = await api.card.analyze(state.currentCard.uid);
      
      this.updateProgress(100, '分析完成');
      this.displaySectors(result.sectors);
      this.displayKeys(uid);

      utils.showToast('卡片分析完成', 'success');
    } catch (e) {
      utils.showToast(`分析失败: ${e.message}`, 'error');
    } finally {
      document.getElementById('analyzeBtn').disabled = false;
    }
  },

  updateProgress(progress, status) {
    const percent = Math.round(progress * 100);
    document.getElementById('analyzeProgress').style.width = `${percent}%`;
    document.getElementById('analyzeProgressText').textContent = `${percent}%`;
    document.getElementById('analyzeStatus').textContent = status;
  },

  displaySectors(sectors) {
    const grid = document.getElementById('sectorsGrid');
    
    if (!sectors || sectors.length === 0) {
      grid.innerHTML = '<div class="empty-state">暂无数据</div>';
      return;
    }

    grid.innerHTML = sectors.map(sector => {
      let statusClass = '';
      let statusText = '未加密';
      
      if (sector.isEncrypted) {
        if (sector.isCracked) {
          statusClass = 'cracked';
          statusText = '已破解';
        } else {
          statusClass = 'encrypted';
          statusText = '已加密';
        }
      } else if (sector.keyA || sector.keyB) {
        statusClass = 'partial';
        statusText = '部分读取';
      }

      const keyDisplay = sector.keyA ? 
        `<div class="sector-keys">A: ${sector.keyA.substring(0, 6)}...</div>` : '';

      return `
        <div class="sector-item ${statusClass}" onclick="analyzeController.showSectorDetail(${sector.sectorIndex})">
          <div class="sector-number">扇区 ${sector.sectorIndex}</div>
          <div class="sector-status">${statusText}</div>
          ${keyDisplay}
        </div>
      `;
    }).join('');
  },

  async displayKeys(uid) {
    const keys = await api.keys.getByUid(uid);
    const tbody = document.querySelector('#keysTable tbody');

    if (!keys || keys.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无密钥数据</td></tr>';
      return;
    }

    tbody.innerHTML = keys.map(key => `
      <tr>
        <td>${key.sector_index}</td>
        <td><span class="badge badge-info">${key.key_type}类</span></td>
        <td><code>${key.key_value}</code></td>
        <td>${key.source === 'default' ? '默认密钥' : key.source === 'cracked' ? '已破解' : '导入'}</td>
        <td><span class="badge badge-success">已获取</span></td>
      </tr>
    `).join('');
  },

  showSectorDetail(sectorIndex) {
    const sectors = state.currentCard?.sectors || [];
    const sector = sectors.find(s => s.sectorIndex === sectorIndex);
    
    if (!sector) return;

    const blocksHtml = sector.blocks ? sector.blocks.map(block => `
      <div style="margin-bottom: 10px;">
        <div style="font-weight: 600; margin-bottom: 5px;">块 ${block.blockIndex}:</div>
        <code style="background: #f5f5f5; padding: 5px 10px; border-radius: 4px; display: block; word-break: break-all;">
          ${block.data || '(读取失败)'}
        </code>
      </div>
    `).join('') : '<p>无块数据</p>';

    const content = `
      <div>
        <p><strong>扇区:</strong> ${sectorIndex}</p>
        <p><strong>状态:</strong> ${sector.isEncrypted ? '加密' : '未加密'}</p>
        <p><strong>密钥A:</strong> <code>${sector.keyA || '-'}</code></p>
        <p><strong>密钥B:</strong> <code>${sector.keyB || '-'}</code></p>
        <p><strong>访问条件:</strong> <code>${sector.accessConditions || '-'}</code></p>
        <hr style="margin: 15px 0;">
        <h4 style="margin-bottom: 10px;">块数据:</h4>
        ${blocksHtml}
      </div>
    `;

    utils.showModal(`扇区 ${sectorIndex} 详情`, content);
  },

  async dumpToJson() {
    if (!state.currentCard) {
      utils.showToast('没有可导出的卡片数据', 'error');
      return;
    }

    try {
      const filePath = await api.card.dumpJson(state.currentCard.uid);
      utils.showToast(`数据已导出到: ${filePath}`, 'success');
    } catch (e) {
      utils.showToast(`导出失败: ${e.message}`, 'error');
    }
  }
};

const cardManager = {
  init() {
    this.setupButtons();
  },

  setupButtons() {
    document.getElementById('refreshCardsBtn').addEventListener('click', () => this.loadCards());
    document.getElementById('importCardBtn').addEventListener('click', () => this.importCard());
  },

  async loadCards() {
    try {
      const cards = await api.cards.getAll();
      state.cards = cards;
      this.renderCards();
    } catch (e) {
      utils.showToast(`加载卡片失败: ${e.message}`, 'error');
    }
  },

  renderCards() {
    const container = document.getElementById('cardsList');
    
    if (state.cards.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无卡片数据，请先读取或导入卡片</div>';
      return;
    }

    container.innerHTML = state.cards.map(card => {
      const sectorCount = card.sectors?.length || 0;
      const keyCount = card.keys?.length || 0;
      const isActive = card.is_active;

      return `
        <div class="card-item ${isActive ? 'active' : ''}">
          <div class="card-header">
            <div class="card-name">${card.name}</div>
            <span class="card-badge ${isActive ? 'active' : ''}">${isActive ? '当前模拟' : '已存储'}</span>
          </div>
          <div class="card-uid">${utils.formatUID(card.uid)}</div>
          <div class="card-meta">
            <span>SAK: ${card.sak}</span>
            <span>ATQA: ${card.atqa}</span>
          </div>
          <div class="card-meta">
            <span>扇区: ${sectorCount}/16</span>
            <span>密钥: ${keyCount}</span>
          </div>
          <div class="card-actions">
            <button class="btn btn-sm btn-primary" onclick="cardManager.setActive('${card.uid}')">设为当前</button>
            <button class="btn btn-sm btn-secondary" onclick="cardManager.exportCard('${card.uid}')">导出</button>
            <button class="btn btn-sm btn-success" onclick="cardManager.quickEmulate('${card.uid}')">模拟</button>
            <button class="btn btn-sm btn-warning" onclick="cardManager.renameCard('${card.uid}')">重命名</button>
            <button class="btn btn-sm btn-danger" onclick="cardManager.deleteCard('${card.uid}')">删除</button>
          </div>
        </div>
      `;
    }).join('');
  },

  async setActive(uid) {
    try {
      await api.cards.setActive(uid);
      const card = state.cards.find(c => c.uid === uid);
      document.getElementById('activeCardName').textContent = card?.name || uid;
      this.loadCards();
      utils.showToast('已设为当前卡片', 'success');
    } catch (e) {
      utils.showToast(`设置失败: ${e.message}`, 'error');
    }
  },

  async quickEmulate(uid) {
    try {
      const location = prompt('请输入模拟位置（可选）:');
      await api.emulate.start({ uid, location });
      state.isEmulating = true;
      
      const card = state.cards.find(c => c.uid === uid);
      document.getElementById('activeCardName').textContent = card?.name || uid;
      
      utils.showToast(`开始模拟: ${card?.name || uid}`, 'success');
      readerController.updateReaderStatus();
      this.loadCards();
    } catch (e) {
      utils.showToast(`模拟失败: ${e.message}`, 'error');
    }
  },

  async exportCard(uid) {
    try {
      const dumpData = await api.cards.export(uid);
      const result = await api.dialog.saveFile({
        title: '导出卡片数据',
        defaultPath: `card_${uid}.json`,
        filters: [{ name: 'JSON文件', extensions: ['json'] }]
      });

      if (!result.canceled) {
        await api.fs.writeFile(result.filePath, JSON.stringify(dumpData, null, 2));
        utils.showToast('卡片数据已导出', 'success');
      }
    } catch (e) {
      utils.showToast(`导出失败: ${e.message}`, 'error');
    }
  },

  async renameCard(uid) {
    const card = state.cards.find(c => c.uid === uid);
    const newName = prompt('请输入新名称:', card?.name);
    
    if (newName && newName.trim()) {
      try {
        await api.cards.updateName({ uid, name: newName.trim() });
        this.loadCards();
        utils.showToast('名称已更新', 'success');
      } catch (e) {
        utils.showToast(`重命名失败: ${e.message}`, 'error');
      }
    }
  },

  async deleteCard(uid) {
    if (confirm('确定要删除这张卡片吗？所有相关数据都将被删除。')) {
      try {
        await api.cards.delete(uid);
        this.loadCards();
        utils.showToast('卡片已删除', 'success');
      } catch (e) {
        utils.showToast(`删除失败: ${e.message}`, 'error');
      }
    }
  },

  async importCard() {
    try {
      const result = await api.dialog.openFile({
        title: '导入卡片数据',
        filters: [{ name: 'JSON文件', extensions: ['json'] }],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const content = await api.fs.readFile(result.filePaths[0]);
        const dumpData = JSON.parse(content);
        await api.cards.import(dumpData);
        this.loadCards();
        utils.showToast('卡片数据已导入', 'success');
      }
    } catch (e) {
      utils.showToast(`导入失败: ${e.message}`, 'error');
    }
  }
};

const emulateController = {
  init() {
    this.setupButtons();
    this.loadEmulateCards();
  },

  setupButtons() {
    document.getElementById('stopEmulateBtn').addEventListener('click', () => this.stopEmulation());
  },

  async loadEmulateCards() {
    try {
      const cards = await api.cards.getAll();
      state.cards = cards;
      this.renderEmulateCards();
      this.updateEmulateStatus();
    } catch (e) {
      utils.showToast(`加载卡片失败: ${e.message}`, 'error');
    }
  },

  renderEmulateCards() {
    const tbody = document.getElementById('emulateCardsList');

    if (state.cards.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无可用卡片</td></tr>';
      return;
    }

    tbody.innerHTML = state.cards.map(card => {
      const hasData = card.sectors && card.sectors.length > 0;
      const isActive = card.is_active;

      return `
        <tr>
          <td>
            <input type="radio" name="emulateCard" value="${card.uid}" ${isActive ? 'checked' : ''}>
          </td>
          <td>${card.name}</td>
          <td><code>${utils.formatUID(card.uid)}</code></td>
          <td>${card.sak}</td>
          <td>${card.atqa}</td>
          <td>
            <button class="btn btn-sm btn-primary" 
                    onclick="emulateController.startEmulation('${card.uid}')"
                    ${!hasData ? 'disabled' : ''}>
              ${!hasData ? '无数据' : '开始模拟'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  async startEmulation(uid) {
    try {
      const location = document.getElementById('emulateLocation').value;
      await api.emulate.start({ uid, location });
      
      state.isEmulating = true;
      state.currentEmulatedCard = state.cards.find(c => c.uid === uid);
      
      document.getElementById('stopEmulateBtn').disabled = false;
      
      const card = state.cards.find(c => c.uid === uid);
      document.getElementById('activeCardName').textContent = card?.name || uid;
      
      this.updateEmulateStatus();
      this.loadAccessRecords(uid);
      
      utils.showToast(`开始模拟: ${card?.name || uid}`, 'success');
      readerController.updateReaderStatus();
    } catch (e) {
      utils.showToast(`模拟失败: ${e.message}`, 'error');
    }
  },

  async stopEmulation() {
    try {
      await api.emulate.stop();
      state.isEmulating = false;
      state.currentEmulatedCard = null;
      
      document.getElementById('stopEmulateBtn').disabled = true;
      document.getElementById('activeCardName').textContent = '无';
      
      this.updateEmulateStatus();
      utils.showToast('已停止模拟', 'info');
      readerController.updateReaderStatus();
    } catch (e) {
      utils.showToast(`停止失败: ${e.message}`, 'error');
    }
  },

  async updateEmulateStatus() {
    const status = await api.emulate.status();
    const indicator = document.querySelector('.emulate-status-indicator');
    const title = document.getElementById('emulateStatusTitle');
    const desc = document.getElementById('emulateStatusDesc');

    if (status.isEmulating && status.card) {
      indicator.classList.add('active');
      indicator.querySelector('.status-icon').textContent = '▶️';
      title.textContent = `正在模拟: ${status.card.name}`;
      desc.textContent = `UID: ${utils.formatUID(status.card.uid)} | 读卡器: ${status.reader || '未知'}`;
    } else {
      indicator.classList.remove('active');
      indicator.querySelector('.status-icon').textContent = '⏸️';
      title.textContent = '未开始模拟';
      desc.textContent = '请从下方选择要模拟的卡片';
    }
  },

  async loadAccessRecords(uid) {
    try {
      const records = await api.audit.getRecords({ uid });
      const tbody = document.getElementById('accessRecords');

      if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">暂无访问记录</td></tr>';
        return;
      }

      tbody.innerHTML = records.slice(0, 20).map(record => {
        const actionText = record.action === 'emulate' ? '模拟访问' :
                         record.action === 'emulate_start' ? '开始模拟' : '停止模拟';
        const actionClass = record.action === 'emulate' ? 'badge-success' :
                          record.action === 'emulate_start' ? 'badge-info' : 'badge-warning';

        return `
          <tr>
            <td>${utils.formatDate(record.timestamp)}</td>
            <td><span class="badge ${actionClass}">${actionText}</span></td>
            <td>${record.reader_id || '-'}</td>
            <td>${record.location || '-'}</td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.error('加载访问记录失败:', e);
    }
  }
};

const crackController = {
  init() {
    this.setupButtons();
    this.setupEventListeners();
    this.loadCrackHistory();
  },

  setupButtons() {
    document.getElementById('startNestedCrackBtn').addEventListener('click', () => this.startNestedCrack());
    document.getElementById('startBruteForceBtn').addEventListener('click', () => this.startBruteForce());
    document.getElementById('stopCrackBtn').addEventListener('click', () => this.stopCrack());
  },

  setupEventListeners() {
    api.on('crack:progress', (data) => {
      this.updateCrackProgress(data);
    });
  },

  async loadCrackCards() {
    try {
      const cards = await api.cards.getAll();
      state.cards = cards;
      
      const select = document.getElementById('crackUid');
      select.innerHTML = '<option value="">请选择卡片</option>' + 
        cards.map(card => `<option value="${card.uid}">${card.name} (${utils.formatUID(card.uid)})</option>`).join('');

      const sectorSelect = document.getElementById('crackSector');
      sectorSelect.innerHTML = '<option value="">请选择扇区</option>' +
        Array.from({ length: 16 }, (_, i) => `<option value="${i}">扇区 ${i}</option>`).join('');

      select.addEventListener('change', () => this.loadCardKeys(select.value));
    } catch (e) {
      console.error('加载破解卡片失败:', e);
    }
  },

  async loadCardKeys(uid) {
    if (!uid) return;
    
    try {
      const keys = await api.keys.getByUid(uid);
      const knownKeyInput = document.getElementById('knownKey');
      
      if (keys.length > 0) {
        knownKeyInput.placeholder = `已找到 ${keys.length} 个密钥，可留空自动选择`;
      }
    } catch (e) {
      console.error('加载卡片密钥失败:', e);
    }
  },

  async startNestedCrack() {
    const uid = document.getElementById('crackUid').value;
    const sectorIndex = parseInt(document.getElementById('crackSector').value);
    const targetKeyType = document.getElementById('crackKeyType').value;
    const knownKey = document.getElementById('knownKey').value;
    const knownKeyType = document.getElementById('knownKeyType').value;

    if (!uid || isNaN(sectorIndex)) {
      utils.showToast('请选择卡片和目标扇区', 'error');
      return;
    }

    try {
      document.getElementById('startNestedCrackBtn').disabled = true;
      document.getElementById('startBruteForceBtn').disabled = true;
      document.getElementById('stopCrackBtn').disabled = false;
      document.getElementById('crackResult').style.display = 'none';

      this.updateCrackProgress({ progress: 0, sectorIndex, checked: 0, total: 1000 });

      const result = await api.crack.start({
        uid,
        sectorIndex,
        knownKey,
        knownKeyType,
        targetKeyType
      });

      if (result) {
        this.showCrackResult(result);
        utils.showToast(`密钥破解成功: ${result}`, 'success');
        this.loadCrackHistory();
      } else {
        utils.showToast('未能破解密钥，请尝试暴力破解', 'warning');
      }
    } catch (e) {
      utils.showToast(`破解失败: ${e.message}`, 'error');
    } finally {
      document.getElementById('startNestedCrackBtn').disabled = false;
      document.getElementById('startBruteForceBtn').disabled = false;
      document.getElementById('stopCrackBtn').disabled = true;
    }
  },

  async startBruteForce() {
    const uid = document.getElementById('crackUid').value;
    const sectorIndex = parseInt(document.getElementById('crackSector').value);
    const targetKeyType = document.getElementById('crackKeyType').value;

    if (!uid || isNaN(sectorIndex)) {
      utils.showToast('请选择卡片和目标扇区', 'error');
      return;
    }

    try {
      document.getElementById('startNestedCrackBtn').disabled = true;
      document.getElementById('startBruteForceBtn').disabled = true;
      document.getElementById('stopCrackBtn').disabled = false;
      document.getElementById('crackResult').style.display = 'none';

      this.updateCrackProgress({ progress: 0, sectorIndex, checked: 0, total: 1000 });

      const result = await api.crack.bruteForce({
        uid,
        sectorIndex,
        targetKeyType
      });

      if (result) {
        this.showCrackResult(result);
        utils.showToast(`暴力破解成功: ${result}`, 'success');
        this.loadCrackHistory();
      } else {
        utils.showToast('暴力破解未能找到密钥', 'warning');
      }
    } catch (e) {
      utils.showToast(`破解失败: ${e.message}`, 'error');
    } finally {
      document.getElementById('startNestedCrackBtn').disabled = false;
      document.getElementById('startBruteForceBtn').disabled = false;
      document.getElementById('stopCrackBtn').disabled = true;
    }
  },

  async stopCrack() {
    try {
      await api.crack.stop();
      document.getElementById('crackStatus').textContent = '破解已停止';
      utils.showToast('已停止破解', 'info');
    } catch (e) {
      console.error('停止破解失败:', e);
    }
  },

  updateCrackProgress(data) {
    const percent = Math.round(data.progress * 100);
    document.getElementById('crackProgress').style.width = `${percent}%`;
    document.getElementById('crackProgressText').textContent = `${percent}%`;
    
    let status = `正在破解扇区 ${data.sectorIndex}... 已尝试 ${data.checked}/${data.total}`;
    if (data.currentKey) {
      status += ` 当前尝试: ${data.currentKey}`;
    }
    document.getElementById('crackStatus').textContent = status;
  },

  showCrackResult(key) {
    document.getElementById('crackResult').style.display = 'block';
    document.getElementById('crackedKeyValue').textContent = key;
    document.getElementById('crackStatus').textContent = '破解完成！';
  },

  async loadCrackHistory() {
    try {
      const keys = await api.keys.getByUid(document.getElementById('crackUid').value) || [];
      const tbody = document.querySelector('#crackHistory tbody');

      if (keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无破解记录</td></tr>';
        return;
      }

      tbody.innerHTML = keys.map(key => `
        <tr>
          <td>${utils.formatDate(key.created_at)}</td>
          <td><code>${utils.formatUID(key.uid)}</code></td>
          <td>${key.sector_index}</td>
          <td><span class="badge badge-info">${key.key_type}类</span></td>
          <td><code>${key.key_value}</code></td>
          <td>${key.source === 'default' ? '默认' : key.source === 'cracked' ? '嵌套攻击' : key.source === 'bruteforce' ? '暴力破解' : '导入'}</td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('加载破解历史失败:', e);
    }
  }
};

const auditController = {
  init() {
    this.setupButtons();
  },

  setupButtons() {
    document.getElementById('queryStatsBtn').addEventListener('click', () => this.queryStatistics());
    document.getElementById('generateReportBtn').addEventListener('click', () => this.generateReport());
    document.getElementById('generateSummaryBtn').addEventListener('click', () => this.generateSummary());
  },

  async loadAuditCards() {
    try {
      const cards = await api.cards.getAll();
      state.cards = cards;
      
      const select = document.getElementById('auditCard');
      select.innerHTML = '<option value="">请选择卡片</option>' + 
        cards.map(card => `<option value="${card.uid}">${card.name} (${utils.formatUID(card.uid)})</option>`).join('');
    } catch (e) {
      console.error('加载审计卡片失败:', e);
    }
  },

  async queryStatistics() {
    const uid = document.getElementById('auditCard').value;
    const startDate = document.getElementById('auditStartDate').value;
    const endDate = document.getElementById('auditEndDate').value;

    if (!uid) {
      utils.showToast('请选择要查询的卡片', 'error');
      return;
    }

    try {
      const stats = await api.report.getStats({ uid, startDate, endDate });
      this.displayStatistics(stats);
    } catch (e) {
      utils.showToast(`查询失败: ${e.message}`, 'error');
    }
  },

  displayStatistics(stats) {
    document.getElementById('statTotalEmulates').textContent = stats.summary.totalEmulates;
    document.getElementById('statLocations').textContent = stats.summary.uniqueLocations;
    document.getElementById('statReaders').textContent = stats.summary.uniqueReaders;
    document.getElementById('statRecords').textContent = stats.summary.totalRecords;

    this.renderHeatmap(stats.heatmap);
    this.renderTimeChart(stats.byTime);
    this.renderLocationChart(stats.byLocation);
  },

  renderHeatmap(heatmapData) {
    const ctx = document.getElementById('heatmapChart');
    
    if (state.heatmapChart) {
      state.heatmapChart.destroy();
    }

    const data = Array(7).fill(null).map(() => Array(24).fill(0));
    heatmapData.forEach(item => {
      data[parseInt(item.day_of_week)][parseInt(item.hour)] = item.count;
    });

    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    const datasets = days.map((day, dayIdx) => ({
      label: day,
      data: data[dayIdx],
      backgroundColor: `hsla(${dayIdx * 50}, 70%, 60%, 0.7)`
    }));

    state.heatmapChart = new Chart(ctx, {
      type: 'bar',
      data: { labels: hours, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: '使用频率热力图 (按星期/小时)' },
          legend: { position: 'bottom' }
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  },

  renderTimeChart(timeData) {
    const ctx = document.getElementById('timeChart');
    
    if (state.timeChart) {
      state.timeChart.destroy();
    }

    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const counts = Array(24).fill(0);
    timeData.forEach(item => {
      counts[parseInt(item.hour)] = item.count;
    });

    state.timeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [{
          label: '使用次数',
          data: counts,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: '24小时时间分布' } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  },

  renderLocationChart(locationData) {
    const ctx = document.getElementById('locationChart');
    
    if (state.locationChart) {
      state.locationChart.destroy();
    }

    const labels = locationData.map(d => d.location || d.reader_id || '未知');
    const data = locationData.map(d => d.count);

    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)'
    ];

    state.locationChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels.length > 0 ? labels : ['无数据'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: colors.slice(0, Math.max(labels.length, 1))
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: '按地点使用分布' },
          legend: { position: 'right' }
        }
      }
    });
  },

  async generateReport() {
    const uid = document.getElementById('auditCard').value;
    const startDate = document.getElementById('auditStartDate').value;
    const endDate = document.getElementById('auditEndDate').value;

    if (!uid) {
      utils.showToast('请选择要生成报告的卡片', 'error');
      return;
    }

    try {
      const filePath = await api.report.generatePDF({ uid, startDate, endDate });
      if (filePath) {
        utils.showToast(`报告已生成: ${filePath}`, 'success');
      }
    } catch (e) {
      utils.showToast(`生成报告失败: ${e.message}`, 'error');
    }
  },

  async generateSummary() {
    const startDate = document.getElementById('auditStartDate').value;
    const endDate = document.getElementById('auditEndDate').value;

    try {
      const filePath = await api.report.generateSummary({ startDate, endDate });
      if (filePath) {
        utils.showToast(`汇总报告已生成: ${filePath}`, 'success');
      }
    } catch (e) {
      utils.showToast(`生成报告失败: ${e.message}`, 'error');
    }
  }
};

const logController = {
  init() {
    this.setupButtons();
  },

  setupButtons() {
    document.getElementById('refreshLogsBtn').addEventListener('click', () => this.loadLogs());
    document.getElementById('logTypeFilter').addEventListener('change', () => this.loadLogs());
  },

  async loadLogs() {
    try {
      const type = document.getElementById('logTypeFilter').value;
      let logs;
      
      if (type) {
        logs = await api.logs.getByType({ type, limit: 200 });
      } else {
        logs = await api.logs.get({ limit: 200 });
      }

      this.renderLogs(logs);
    } catch (e) {
      utils.showToast(`加载日志失败: ${e.message}`, 'error');
    }
  },

  renderLogs(logs) {
    const tbody = document.querySelector('#logsTable tbody');

    if (!logs || logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无日志记录</td></tr>';
      return;
    }

    const operationLabels = {
      card_detected: { label: '卡片检测', class: 'badge-info' },
      analyze_start: { label: '分析开始', class: 'badge-warning' },
      analyze_complete: { label: '分析完成', class: 'badge-success' },
      emulation_start: { label: '模拟开始', class: 'badge-info' },
      emulation_stop: { label: '模拟停止', class: 'badge-warning' },
      reader_access: { label: '门禁访问', class: 'badge-success' },
      crack_start: { label: '破解开始', class: 'badge-warning' },
      crack_success: { label: '破解成功', class: 'badge-success' },
      crack_failed: { label: '破解失败', class: 'badge-danger' },
      card_added: { label: '卡片添加', class: 'badge-success' },
      card_deleted: { label: '卡片删除', class: 'badge-danger' },
      card_imported: { label: '卡片导入', class: 'badge-success' },
      report_generated: { label: '报告生成', class: 'badge-info' },
      dump_json: { label: '数据导出', class: 'badge-info' }
    };

    tbody.innerHTML = logs.map(log => {
      const op = operationLabels[log.operation_type] || { label: log.operation_type, class: 'badge-secondary' };
      let details = '-';
      
      try {
        const parsed = JSON.parse(log.details);
        details = Object.entries(parsed)
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join(', ');
      } catch (e) {
        details = log.details;
      }

      return `
        <tr>
          <td>${utils.formatDate(log.created_at)}</td>
          <td><span class="badge ${op.class}">${op.label}</span></td>
          <td>${log.uid ? `<code>${utils.formatUID(log.uid)}</code>` : '-'}</td>
          <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${details}">${details}</td>
          <td>${log.operator}</td>
        </tr>
      `;
    }).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  tabController.init();
  readerController.init();
  monitorController.init();
  analyzeController.init();
  cardManager.init();
  emulateController.init();
  crackController.init();
  auditController.init();
  logController.init();

  setInterval(() => {
    readerController.updateReaderStatus();
  }, 5000);
});

window.analyzeController = analyzeController;
window.cardManager = cardManager;
window.emulateController = emulateController;
