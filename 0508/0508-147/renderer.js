const api = window.api;

let mixedPaints = [];
let nextPaintId = 1;

let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let currentUsageId = null;

const addBrandSelect = document.getElementById('add-brand');
const addTypeSelect = document.getElementById('add-type');
const addPaintSelect = document.getElementById('add-paint');
const addRatioPaintEl = document.getElementById('add-ratio-paint');
const addRatioThinnerEl = document.getElementById('add-ratio-thinner');
const addRatioSourceEl = document.getElementById('add-ratio-source');
const addMixRatioEl = document.getElementById('add-mix-ratio');
const mixedPaintsListEl = document.getElementById('mixed-paints-list');
const paintBreakdownEl = document.getElementById('paint-breakdown');
const totalMlEl = document.getElementById('total-ml');
const mixedRatioPaintEl = document.getElementById('mixed-ratio-paint');
const mixedRatioThinnerEl = document.getElementById('mixed-ratio-thinner');
const totalPaintMlEl = document.getElementById('total-paint-ml');
const totalThinnerMlEl = document.getElementById('total-thinner-ml');
const recommendedPressureEl = document.getElementById('recommended-pressure');
const recordMixingBtn = document.getElementById('record-mixing');
const historyListEl = document.getElementById('history-list');
const toastEl = document.getElementById('toast');

const timerTimeEl = document.querySelector('.timer-time');
const timerStatusEl = document.getElementById('timer-status');
const usageTypeSelect = document.getElementById('usage-type');
const typeCleanIntervalEl = document.getElementById('type-clean-interval');
const startTimerBtn = document.getElementById('start-timer');
const pauseTimerBtn = document.getElementById('pause-timer');
const stopTimerBtn = document.getElementById('stop-timer');
const sprayGunStatusEl = document.getElementById('spray-gun-status');
const reminderListEl = document.getElementById('reminder-list');
const cleanSettingsListEl = document.getElementById('clean-settings-list');

let paintTypes = [];
let sprayGunSettings = [];

function showToast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.className = 'toast show' + (isError ? ' error' : '');
  
  setTimeout(() => {
    toastEl.className = 'toast';
  }, 3000);
}

async function init() {
  await loadBrands();
  await loadPaintTypes();
  await loadSprayGunSettings();
  setupEventListeners();
  setupTabNavigation();
  updateCalculations();
  await refreshUsageStatus();
}

async function loadBrands() {
  const brands = await api.getBrands();
  addBrandSelect.innerHTML = '<option value="">-- 请选择品牌 --</option>';
  brands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand.id;
    option.textContent = brand.name;
    addBrandSelect.appendChild(option);
  });
}

async function loadPaintTypes() {
  paintTypes = await api.getPaintTypes();
  addTypeSelect.innerHTML = '<option value="">-- 请选择类型 --</option>';
  usageTypeSelect.innerHTML = '<option value="">-- 请选择类型 --</option>';
  
  paintTypes.forEach(type => {
    const option1 = document.createElement('option');
    option1.value = type.id;
    option1.textContent = type.name;
    addTypeSelect.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = type.id;
    option2.textContent = type.name;
    usageTypeSelect.appendChild(option2);
  });
}

async function loadSprayGunSettings() {
  sprayGunSettings = await api.getSprayGunSettings();
  renderCleanSettings();
}

function renderCleanSettings() {
  cleanSettingsListEl.innerHTML = sprayGunSettings.map(setting => `
    <div class="clean-setting-item">
      <div class="setting-type">${setting.type_name}</div>
      <div class="setting-input">
        <input type="number" 
               class="form-input setting-value" 
               value="${setting.clean_interval_minutes}" 
               min="5" 
               max="120"
               data-type-id="${setting.paint_type_id}"
               onchange="updateCleanSetting(${setting.paint_type_id}, this.value)">
        <span class="setting-unit">分钟</span>
      </div>
    </div>
  `).join('');
}

async function updateCleanSetting(typeId, value) {
  const minutes = parseInt(value);
  if (minutes < 5 || minutes > 120) {
    showToast('清洗周期必须在 5-120 分钟之间', true);
    return;
  }
  
  await api.updateSprayGunSetting(typeId, minutes);
  await loadSprayGunSettings();
  
  if (usageTypeSelect.value == typeId) {
    updateTypeCleanInfo();
  }
  
  showToast('清洗周期已更新');
}

async function loadPaintsForSelection() {
  const brandId = addBrandSelect.value;
  const typeId = addTypeSelect.value;
  
  addPaintSelect.innerHTML = '<option value="">-- 请选择颜色 --</option>';
  resetAdderRatio();
  
  if (!brandId || !typeId) {
    return;
  }
  
  const paints = await api.getPaints(brandId, typeId);
  
  paints.forEach(paint => {
    const option = document.createElement('option');
    option.value = paint.id;
    option.textContent = `${paint.code} - ${paint.name}`;
    option.dataset.paint = JSON.stringify(paint);
    addPaintSelect.appendChild(option);
  });
  
  if (paints.length === 0) {
    addPaintSelect.innerHTML = '<option value="">-- 该类型暂无颜色 --</option>';
  }
}

async function selectPaintForAdding() {
  const paintId = addPaintSelect.value;
  
  if (!paintId) {
    resetAdderRatio();
    return;
  }
  
  const selectedOption = addPaintSelect.options[addPaintSelect.selectedIndex];
  const paint = JSON.parse(selectedOption.dataset.paint);
  
  if (paint.custom_ratio_paint) {
    addRatioPaintEl.value = paint.custom_ratio_paint;
    addRatioThinnerEl.value = paint.custom_ratio_thinner;
    addRatioSourceEl.textContent = '自定义偏好';
  } else {
    addRatioPaintEl.value = paint.default_ratio_paint;
    addRatioThinnerEl.value = paint.default_ratio_thinner;
    addRatioSourceEl.textContent = '默认比例';
  }
}

function resetAdderRatio() {
  addRatioPaintEl.value = 1;
  addRatioThinnerEl.value = 1;
  addRatioSourceEl.textContent = '默认比例';
}

function updateTypeCleanInfo() {
  const typeId = usageTypeSelect.value;
  if (!typeId) {
    typeCleanIntervalEl.textContent = '-- 分钟';
    return;
  }
  
  const setting = sprayGunSettings.find(s => s.paint_type_id == typeId);
  if (setting) {
    typeCleanIntervalEl.textContent = `${setting.clean_interval_minutes} 分钟`;
  }
}

function addToMixedList() {
  const paintId = addPaintSelect.value;
  const ratioPaint = parseInt(addRatioPaintEl.value);
  const ratioThinner = parseInt(addRatioThinnerEl.value);
  const mixRatio = parseInt(addMixRatioEl.value);
  
  if (!paintId) {
    showToast('请先选择油漆', true);
    return;
  }
  
  if (ratioPaint < 1 || ratioThinner < 1 || ratioPaint > 10 || ratioThinner > 10) {
    showToast('稀释比例必须在 1-10 之间', true);
    return;
  }
  
  if (mixRatio < 1 || mixRatio > 100) {
    showToast('混合比例必须在 1-100 之间', true);
    return;
  }
  
  const selectedOption = addPaintSelect.options[addPaintSelect.selectedIndex];
  const paint = JSON.parse(selectedOption.dataset.paint);
  
  const mixedPaint = {
    uid: nextPaintId++,
    paintId: paint.id,
    code: paint.code,
    name: paint.name,
    brandName: paint.brand_name,
    typeName: paint.type_name,
    ratioPaint: ratioPaint,
    ratioThinner: ratioThinner,
    mixRatio: mixRatio,
    pressure: paint.recommended_pressure
  };
  
  mixedPaints.push(mixedPaint);
  renderMixedPaints();
  updateCalculations();
  showToast('已添加到混合列表');
}

function removeFromMixedList(uid) {
  mixedPaints = mixedPaints.filter(p => p.uid !== uid);
  renderMixedPaints();
  updateCalculations();
}

function updateMixRatio(uid, newRatio) {
  const paint = mixedPaints.find(p => p.uid === uid);
  if (paint) {
    paint.mixRatio = parseInt(newRatio) || 1;
    updateCalculations();
  }
}

function clearAllMixed() {
  if (mixedPaints.length === 0) return;
  if (confirm('确定要清空混合列表吗？')) {
    mixedPaints = [];
    renderMixedPaints();
    updateCalculations();
  }
}

function renderMixedPaints() {
  if (mixedPaints.length === 0) {
    mixedPaintsListEl.innerHTML = `
      <div class="empty-state-small">
        <p>请从左侧添加油漆</p>
      </div>
    `;
    return;
  }
  
  mixedPaintsListEl.innerHTML = mixedPaints.map(paint => `
    <div class="mixed-paint-item" data-uid="${paint.uid}">
      <div class="mixed-paint-info">
        <div class="mixed-paint-code">${paint.code}</div>
        <div class="mixed-paint-detail">${paint.brandName} - ${paint.name}</div>
        <div class="mixed-paint-ratio">稀释比例: ${paint.ratioPaint}:${paint.ratioThinner}</div>
      </div>
      <div class="mixed-paint-controls">
        <div class="mix-ratio-control">
          <label>混合比例</label>
          <input type="number" 
                 class="form-input mix-ratio-input-inline" 
                 value="${paint.mixRatio}" 
                 min="1" 
                 max="100"
                 onchange="updateMixRatio(${paint.uid}, this.value)">
          <span class="ratio-unit">份</span>
        </div>
        <button class="btn btn-danger btn-small" onclick="removeFromMixedList(${paint.uid})">
          ✕
        </button>
      </div>
    </div>
  `).join('');
}

function calculateCombinedRatio() {
  if (mixedPaints.length === 0) {
    return { paintRatio: 1, thinnerRatio: 1, avgPressure: null };
  }
  
  let totalWeight = 0;
  let totalPaintParts = 0;
  let totalThinnerParts = 0;
  let totalPressureWeight = 0;
  let totalPressure = 0;
  
  mixedPaints.forEach(paint => {
    const weight = paint.mixRatio;
    totalWeight += weight;
    
    const paintParts = paint.ratioPaint * weight;
    const thinnerParts = paint.ratioThinner * weight;
    
    totalPaintParts += paintParts;
    totalThinnerParts += thinnerParts;
    
    if (paint.pressure) {
      totalPressure += paint.pressure * weight;
      totalPressureWeight += weight;
    }
  });
  
  const gcd = findGCD(totalPaintParts, totalThinnerParts);
  
  const avgPressure = totalPressureWeight > 0 
    ? (totalPressure / totalPressureWeight).toFixed(1) 
    : null;
  
  return {
    paintRatio: Math.round(totalPaintParts / gcd),
    thinnerRatio: Math.round(totalThinnerParts / gcd),
    avgPressure
  };
}

function findGCD(a, b) {
  a = Math.round(a);
  b = Math.round(b);
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a || 1;
}

function updateCalculations() {
  const totalMl = parseFloat(totalMlEl.value) || 0;
  const combined = calculateCombinedRatio();
  
  mixedRatioPaintEl.textContent = combined.paintRatio;
  mixedRatioThinnerEl.textContent = combined.thinnerRatio;
  recommendedPressureEl.textContent = combined.avgPressure || '--';
  
  if (mixedPaints.length === 0 || totalMl <= 0) {
    paintBreakdownEl.innerHTML = `
      <div class="empty-state-small">
        <p>添加油漆并设置总容量</p>
      </div>
    `;
    totalPaintMlEl.textContent = '0';
    totalThinnerMlEl.textContent = '0';
    recordMixingBtn.disabled = true;
    return;
  }
  
  const totalRatioParts = combined.paintRatio + combined.thinnerRatio;
  const totalPaintMl = (totalMl * combined.paintRatio) / totalRatioParts;
  const totalThinnerMl = (totalMl * combined.thinnerRatio) / totalRatioParts;
  
  totalPaintMlEl.textContent = totalPaintMl.toFixed(2);
  totalThinnerMlEl.textContent = totalThinnerMl.toFixed(2);
  
  const totalMixRatio = mixedPaints.reduce((sum, p) => sum + p.mixRatio, 0);
  const breakdownHtml = mixedPaints.map(paint => {
    const proportion = paint.mixRatio / totalMixRatio;
    const paintOnlyMl = totalPaintMl * proportion;
    
    const paintTotalRatio = paint.ratioPaint + paint.ratioThinner;
    const paintConcentration = paint.ratioPaint / paintTotalRatio;
    const totalForThisPaint = paintOnlyMl / paintConcentration;
    const thinnerForThisPaint = totalForThisPaint - paintOnlyMl;
    
    return `
      <div class="paint-breakdown-item">
        <div class="breakdown-info">
          <span class="breakdown-code">${paint.code}</span>
          <span class="breakdown-name">${paint.name}</span>
          <span class="breakdown-mix">(${paint.mixRatio}份)</span>
        </div>
        <div class="breakdown-amounts">
          <div class="breakdown-amount">
            <span class="amount-label">油漆</span>
            <span class="amount-value">${paintOnlyMl.toFixed(2)}ml</span>
          </div>
          <div class="breakdown-amount">
            <span class="amount-label">稀释剂</span>
            <span class="amount-value">${thinnerForThisPaint.toFixed(2)}ml</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  paintBreakdownEl.innerHTML = breakdownHtml;
  recordMixingBtn.disabled = false;
}

async function recordMixing() {
  if (mixedPaints.length === 0) {
    showToast('请先添加油漆到混合列表', true);
    return;
  }
  
  const totalMl = parseFloat(totalMlEl.value);
  if (!totalMl || totalMl <= 0) {
    showToast('请输入有效的总容量', true);
    return;
  }
  
  const combined = calculateCombinedRatio();
  const totalRatioParts = combined.paintRatio + combined.thinnerRatio;
  const totalPaintMl = (totalMl * combined.paintRatio) / totalRatioParts;
  const totalThinnerMl = (totalMl * combined.thinnerRatio) / totalRatioParts;
  
  const totalMixRatio = mixedPaints.reduce((sum, p) => sum + p.mixRatio, 0);
  
  const items = mixedPaints.map(paint => {
    const proportion = paint.mixRatio / totalMixRatio;
    const paintOnlyMl = totalPaintMl * proportion;
    
    const paintTotalRatio = paint.ratioPaint + paint.ratioThinner;
    const paintConcentration = paint.ratioPaint / paintTotalRatio;
    const totalForThisPaint = paintOnlyMl / paintConcentration;
    const thinnerForThisPaint = totalForThisPaint - paintOnlyMl;
    
    return {
      paintId: paint.paintId,
      paintMl: paintOnlyMl,
      thinnerMl: thinnerForThisPaint,
      ratioPaint: paint.ratioPaint,
      ratioThinner: paint.ratioThinner,
      mixProportion: paint.mixRatio
    };
  });
  
  await api.addMixingRecord({
    totalMl,
    totalPaintMl,
    totalThinnerMl,
    combinedRatioPaint: combined.paintRatio,
    combinedRatioThinner: combined.thinnerRatio,
    recommendedPressure: combined.avgPressure ? parseFloat(combined.avgPressure) : null,
    items
  });
  
  showToast('调配记录已保存');
  loadHistory();
}

async function loadHistory() {
  const history = await api.getHistory(50);
  
  if (history.length === 0) {
    historyListEl.innerHTML = '<div class="empty-state"><p>暂无调配记录</p></div>';
    return;
  }
  
  historyListEl.innerHTML = history.map(record => {
    const paintSummary = record.items.length === 1
      ? `${record.items[0].paint_code} - ${record.items[0].paint_name}`
      : `混合调配 (${record.items.length}种油漆)`;
    
    const paintDetails = record.items.map(item => `
      <div class="history-sub-item">
        <span>${item.paint_code}: 油漆 ${item.paint_ml.toFixed(2)}ml + 稀释剂 ${item.thinner_ml.toFixed(2)}ml</span>
      </div>
    `).join('');
    
    return `
      <div class="history-item">
        <div class="history-paint-info">
          <span class="history-paint-code">${record.is_mixed ? '🎨 混合' : '单一'}</span>
          <span class="history-paint-name">${paintSummary}</span>
          ${paintDetails}
        </div>
        <div class="history-detail">
          <div class="history-detail-label">综合比例</div>
          <div class="history-detail-value">${record.combined_ratio_paint}:${record.combined_ratio_thinner}</div>
        </div>
        <div class="history-detail">
          <div class="history-detail-label">总量</div>
          <div class="history-detail-value">${record.total_ml}ml</div>
        </div>
        <div class="history-detail">
          <div class="history-detail-label">油漆</div>
          <div class="history-detail-value">${record.total_paint_ml.toFixed(2)}ml</div>
        </div>
        <div class="history-detail">
          <div class="history-detail-label">稀释剂</div>
          <div class="history-detail-value">${record.total_thinner_ml.toFixed(2)}ml</div>
        </div>
        <div class="history-time">
          ${formatDate(record.created_at)}
        </div>
      </div>
    `;
  }).join('');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

async function clearHistory() {
  if (confirm('确定要清空所有调配记录吗？此操作不可撤销。')) {
    await api.clearHistory();
    loadHistory();
    showToast('记录已清空');
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function startTimer() {
  const typeId = usageTypeSelect.value;
  if (!typeId) {
    showToast('请先选择油漆类型', true);
    return;
  }
  
  const result = await api.startSprayGunUsage(typeId);
  currentUsageId = result.lastInsertRowid;
  
  timerSeconds = 0;
  isTimerRunning = true;
  
  startTimerBtn.disabled = true;
  pauseTimerBtn.disabled = false;
  stopTimerBtn.disabled = false;
  usageTypeSelect.disabled = true;
  
  timerStatusEl.textContent = '使用中...';
  timerStatusEl.className = 'timer-status status-running';
  
  timerInterval = setInterval(() => {
    timerSeconds++;
    timerTimeEl.textContent = formatTime(timerSeconds);
    checkCleaningReminder();
  }, 1000);
  
  showToast('喷笔使用计时已开始');
}

function pauseTimer() {
  if (!isTimerRunning) return;
  
  isTimerRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  
  startTimerBtn.disabled = false;
  startTimerBtn.textContent = '▶ 继续';
  pauseTimerBtn.disabled = true;
  
  timerStatusEl.textContent = '已暂停';
  timerStatusEl.className = 'timer-status status-paused';
  
  showToast('计时已暂停');
}

async function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  const usageMinutes = Math.max(1, Math.ceil(timerSeconds / 60));
  
  if (currentUsageId) {
    await api.endSprayGunUsage(currentUsageId, usageMinutes);
  }
  
  isTimerRunning = false;
  timerSeconds = 0;
  currentUsageId = null;
  
  timerTimeEl.textContent = '00:00';
  timerStatusEl.textContent = '未开始';
  timerStatusEl.className = 'timer-status';
  
  startTimerBtn.disabled = false;
  startTimerBtn.textContent = '▶ 开始使用';
  pauseTimerBtn.disabled = true;
  stopTimerBtn.disabled = true;
  usageTypeSelect.disabled = false;
  
  showToast(`已记录 ${usageMinutes} 分钟使用时间`);
  await refreshUsageStatus();
}

async function quickAddMinutes(minutes) {
  const typeId = usageTypeSelect.value;
  if (!typeId) {
    showToast('请先选择油漆类型', true);
    return;
  }
  
  const result = await api.startSprayGunUsage(typeId);
  await api.endSprayGunUsage(result.lastInsertRowid, minutes);
  
  showToast(`已添加 ${minutes} 分钟使用时间`);
  await refreshUsageStatus();
}

function checkCleaningReminder() {
  const typeId = usageTypeSelect.value;
  if (!typeId) return;
  
  const setting = sprayGunSettings.find(s => s.paint_type_id == typeId);
  if (!setting) return;
  
  const currentMinutes = timerSeconds / 60;
  if (currentMinutes >= setting.clean_interval_minutes) {
    if (!timerStatusEl.classList.contains('status-warning')) {
      timerStatusEl.textContent = '⚠️ 需要清洗';
      timerStatusEl.className = 'timer-status status-warning';
      showToast('喷笔使用时间过长，建议清洗！', true);
    }
  }
}

async function refreshUsageStatus() {
  const status = await api.getSprayGunUsageStatus();
  
  renderReminderList(status.usageSummary);
  updateHeaderStatus(status.usageSummary);
}

function renderReminderList(usageSummary) {
  if (!usageSummary || usageSummary.length === 0) {
    reminderListEl.innerHTML = `
      <div class="empty-state-small">
        <p>暂无需要清洗的记录</p>
      </div>
    `;
    return;
  }
  
  const needCleaning = usageSummary.filter(u => u.needs_cleaning);
  const upcoming = usageSummary.filter(u => !u.needs_cleaning && u.total_uncleaned_minutes > 0);
  
  let html = '';
  
  if (needCleaning.length > 0) {
    html += '<div class="reminder-section"><h4>⚠️ 需要立即清洗</h4>';
    needCleaning.forEach(usage => {
      html += `
        <div class="reminder-item reminder-danger">
          <div class="reminder-info">
            <span class="reminder-type">${usage.type_name}</span>
            <span class="reminder-time">已使用 ${usage.total_uncleaned_minutes} 分钟</span>
          </div>
          <div class="reminder-progress">
            <div class="progress-bar">
              <div class="progress-fill progress-danger" style="width: 100%"></div>
            </div>
            <span class="progress-text">超过清洗周期!</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  if (upcoming.length > 0) {
    html += '<div class="reminder-section"><h4>⏱️ 累计使用中</h4>';
    upcoming.forEach(usage => {
      const percentage = (usage.total_uncleaned_minutes / usage.clean_interval_minutes) * 100;
      html += `
        <div class="reminder-item">
          <div class="reminder-info">
            <span class="reminder-type">${usage.type_name}</span>
            <span class="reminder-time">已使用 ${usage.total_uncleaned_minutes} / ${usage.clean_interval_minutes} 分钟</span>
          </div>
          <div class="reminder-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <span class="progress-text">剩余 ${usage.remaining_minutes} 分钟</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  if (html === '') {
    html = `
      <div class="empty-state-small">
        <p>暂无需要清洗的记录</p>
      </div>
    `;
  }
  
  reminderListEl.innerHTML = html;
}

function updateHeaderStatus(usageSummary) {
  if (!usageSummary || usageSummary.length === 0) {
    sprayGunStatusEl.className = 'status-indicator status-clean';
    sprayGunStatusEl.innerHTML = '<span class="status-dot"></span> 喷笔状态正常';
    return;
  }
  
  const needsCleaning = usageSummary.some(u => u.needs_cleaning);
  
  if (needsCleaning) {
    sprayGunStatusEl.className = 'status-indicator status-warning';
    sprayGunStatusEl.innerHTML = '<span class="status-dot"></span> ⚠️ 需要清洗喷笔';
  } else {
    const totalMinutes = usageSummary.reduce((sum, u) => sum + u.total_uncleaned_minutes, 0);
    if (totalMinutes > 0) {
      sprayGunStatusEl.className = 'status-indicator status-in-use';
      sprayGunStatusEl.innerHTML = `<span class="status-dot"></span> 累计使用 ${totalMinutes} 分钟`;
    } else {
      sprayGunStatusEl.className = 'status-indicator status-clean';
      sprayGunStatusEl.innerHTML = '<span class="status-dot"></span> 喷笔状态正常';
    }
  }
}

async function markAllCleaned() {
  if (confirm('确定要将所有使用记录标记为已清洗吗？')) {
    await api.markAllSprayGunCleaned();
    await refreshUsageStatus();
    showToast('已标记全部为已清洗');
  }
}

function setupTabNavigation() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
      
      if (tabId === 'history') {
        loadHistory();
      } else if (tabId === 'spraygun') {
        refreshUsageStatus();
        loadSprayGunSettings();
      }
    });
  });
}

function setupEventListeners() {
  addBrandSelect.addEventListener('change', loadPaintsForSelection);
  addTypeSelect.addEventListener('change', loadPaintsForSelection);
  addPaintSelect.addEventListener('change', selectPaintForAdding);
  
  totalMlEl.addEventListener('input', updateCalculations);
  
  document.getElementById('add-paint-btn').addEventListener('click', addToMixedList);
  document.getElementById('clear-all-btn').addEventListener('click', clearAllMixed);
  document.getElementById('record-mixing').addEventListener('click', recordMixing);
  document.getElementById('clear-history').addEventListener('click', clearHistory);
  
  usageTypeSelect.addEventListener('change', updateTypeCleanInfo);
  startTimerBtn.addEventListener('click', startTimer);
  pauseTimerBtn.addEventListener('click', pauseTimer);
  stopTimerBtn.addEventListener('click', stopTimer);
  document.getElementById('mark-all-cleaned').addEventListener('click', markAllCleaned);
  
  document.querySelectorAll('.quick-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const minutes = parseInt(btn.dataset.minutes);
      quickAddMinutes(minutes);
    });
  });
}

window.addToMixedList = addToMixedList;
window.removeFromMixedList = removeFromMixedList;
window.updateMixRatio = updateMixRatio;
window.clearAllMixed = clearAllMixed;
window.updateCleanSetting = updateCleanSetting;

init();
