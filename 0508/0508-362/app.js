let medicines = [
    { id: 'M001', name: '阿莫西林胶囊', spec: '0.25g*24粒', stock: 120, threshold: 50, usage: '口服，一次2粒，一日3次', category: '抗生素', ingredients: ['阿莫西林', '青霉素类'], contraindications: ['青霉素过敏者禁用', '传染性单核细胞增多症患者禁用'] },
    { id: 'M002', name: '布洛芬缓释胶囊', spec: '0.3g*20粒', stock: 80, threshold: 40, usage: '口服，一次1粒，一日2次', category: '解热镇痛', ingredients: ['布洛芬'], contraindications: ['对阿司匹林或其他非甾体抗炎药过敏者禁用', '活动性消化道溃疡患者禁用', '孕妇及哺乳期妇女禁用'] },
    { id: 'M003', name: '复方感冒灵颗粒', spec: '10g*9袋', stock: 45, threshold: 30, usage: '开水冲服，一次1袋，一日3次', category: '感冒药', ingredients: ['对乙酰氨基酚', '马来酸氯苯那敏', '咖啡因'], contraindications: ['严重肝肾功能不全者禁用', '对马来酸氯苯那敏过敏者禁用'] },
    { id: 'M004', name: '蒙脱石散', spec: '3g*10袋', stock: 25, threshold: 20, usage: '倒入半杯温水，摇匀后服用', category: '止泻药', ingredients: ['蒙脱石'], contraindications: ['对蒙脱石过敏者禁用'] },
    { id: 'M005', name: '氯雷他定片', spec: '10mg*6片', stock: 18, threshold: 15, usage: '口服，一次1片，一日1次', category: '抗过敏药', ingredients: ['氯雷他定'], contraindications: ['对氯雷他定或其他抗组胺药过敏者禁用'] },
    { id: 'M006', name: '板蓝根颗粒', spec: '10g*20袋', stock: 60, threshold: 30, usage: '开水冲服，一次1袋，一日3次', category: '中成药', ingredients: ['板蓝根'], contraindications: ['对板蓝根过敏者禁用', '虚寒体质者慎用'] },
    { id: 'M007', name: '奥美拉唑肠溶胶囊', spec: '20mg*14粒', stock: 35, threshold: 20, usage: '口服，一次1粒，一日1次', category: '胃药', ingredients: ['奥美拉唑'], contraindications: ['对奥美拉唑或苯并咪唑类过敏者禁用', '严重肾功能不全者禁用'] },
    { id: 'M008', name: '云南白药创可贴', spec: '100片/盒', stock: 200, threshold: 80, usage: '外用，贴于患处', category: '外用药', ingredients: ['云南白药'], contraindications: ['对云南白药过敏者禁用', '孕妇禁用'] }
];

let prescriptions = [
    { id: 'P20260526001', patientName: '张三', patientId: '2021001', diagnosis: '上呼吸道感染', medicines: [{ medicineId: 'M001', medicineName: '阿莫西林胶囊', quantity: 2 }, { medicineId: 'M003', medicineName: '复方感冒灵颗粒', quantity: 1 }], status: 'pending', createdAt: new Date().toISOString(), queueNumber: null },
    { id: 'P20260526002', patientName: '李四', patientId: '2021002', diagnosis: '发热头痛', medicines: [{ medicineId: 'M002', medicineName: '布洛芬缓释胶囊', quantity: 1 }], status: 'filling', createdAt: new Date(Date.now() - 1800000).toISOString(), queueNumber: 101 }
];

let completedRecords = [];
let purchaseOrders = [];
let medicineRowCount = 0;
let currentPrescriptionId = null;
let isDrawing = false;
let signatureCanvas = null;
let signatureCtx = null;

const QueueService = (function() {
    let _queue = [];
    let _currentCall = null;
    let _currentWindow = 1;
    let _maxWindow = 3;
    let _baseNumber = 100;
    let _callbacks = [];

    function _notifyListeners(event, data) {
        _callbacks.forEach(cb => {
            if (typeof cb === 'function') {
                cb(event, data);
            }
        });
    }

    function _generateQueueNumber() {
        if (_queue.length === 0) {
            return _baseNumber + 1;
        }
        return Math.max(..._queue.map(q => q.queueNumber)) + 1;
    }

    function _getNextWindow() {
        const window = _currentWindow;
        _currentWindow = _currentWindow >= _maxWindow ? 1 : _currentWindow + 1;
        return window;
    }

    function _speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    }

    return {
        init: function(config = {}) {
            if (config.baseNumber !== undefined) _baseNumber = config.baseNumber;
            if (config.maxWindow !== undefined) _maxWindow = config.maxWindow;
            if (config.window !== undefined) _currentWindow = config.window;
            _notifyListeners('init', { queue: _queue, currentCall: _currentCall });
        },

        subscribe: function(callback) {
            if (typeof callback === 'function') {
                _callbacks.push(callback);
            }
        },

        unsubscribe: function(callback) {
            _callbacks = _callbacks.filter(cb => cb !== callback);
        },

        enqueue: function(patientInfo) {
            const queueNumber = _generateQueueNumber();
            const window = _getNextWindow();
            
            const queueItem = {
                queueNumber,
                patientName: patientInfo.patientName,
                patientId: patientInfo.patientId,
                prescriptionId: patientInfo.prescriptionId,
                window,
                createdAt: new Date().toISOString()
            };
            
            _queue.push(queueItem);
            _notifyListeners('enqueue', queueItem);
            
            if (!_currentCall) {
                this.callNext();
            }
            
            return queueItem;
        },

        dequeue: function() {
            if (_queue.length === 0) {
                return null;
            }
            const removed = _queue.shift();
            _notifyListeners('dequeue', removed);
            return removed;
        },

        remove: function(prescriptionId) {
            const index = _queue.findIndex(q => q.prescriptionId === prescriptionId);
            if (index !== -1) {
                const removed = _queue.splice(index, 1)[0];
                _notifyListeners('remove', removed);
                return removed;
            }
            return null;
        },

        callNext: function() {
            if (_queue.length === 0) {
                const oldCall = _currentCall;
                _currentCall = null;
                _notifyListeners('currentCleared', oldCall);
                return null;
            }
            
            _currentCall = _queue[0];
            _notifyListeners('call', _currentCall);
            
            _speak(`请 ${_currentCall.queueNumber} 号患者到 ${_currentCall.window} 号窗口取药`);
            
            return _currentCall;
        },

        manualCallNext: function() {
            if (_queue.length === 0) {
                return { success: false, message: '暂无排队患者' };
            }
            
            if (_currentCall) {
                this.dequeue();
            }
            
            const nextCall = this.callNext();
            return { success: true, data: nextCall };
        },

        repeatCall: function() {
            if (!_currentCall) {
                return { success: false, message: '当前没有正在叫号的患者' };
            }
            
            _speak(`请 ${_currentCall.queueNumber} 号患者到 ${_currentCall.window} 号窗口取药`);
            _notifyListeners('repeat', _currentCall);
            
            return { success: true, data: _currentCall };
        },

        getCurrentCall: function() {
            return _currentCall;
        },

        getQueue: function() {
            return [..._queue];
        },

        getWaitingQueue: function() {
            return _queue.slice(1);
        },

        getQueueLength: function() {
            return _queue.length;
        },

        getWaitingCount: function() {
            return Math.max(0, _queue.length - 1);
        },

        getPosition: function(prescriptionId) {
            const index = _queue.findIndex(q => q.prescriptionId === prescriptionId);
            if (index === -1) return null;
            return index + 1;
        },

        getByPrescriptionId: function(prescriptionId) {
            return _queue.find(q => q.prescriptionId === prescriptionId) || null;
        },

        getByQueueNumber: function(queueNumber) {
            return _queue.find(q => q.queueNumber === queueNumber) || null;
        },

        isCurrentCall: function(prescriptionId) {
            return _currentCall && _currentCall.prescriptionId === prescriptionId;
        },

        clear: function() {
            const oldQueue = [..._queue];
            const oldCall = _currentCall;
            _queue = [];
            _currentCall = null;
            _notifyListeners('clear', { queue: oldQueue, currentCall: oldCall });
        },

        getStats: function() {
            return {
                total: _queue.length,
                waiting: this.getWaitingCount(),
                currentNumber: _currentCall ? _currentCall.queueNumber : null,
                currentWindow: _currentCall ? _currentCall.window : null,
                nextWindow: _currentWindow
            };
        },

        exportState: function() {
            return {
                queue: [..._queue],
                currentCall: _currentCall,
                currentWindow: _currentWindow,
                stats: this.getStats()
            };
        }
    };
})();

let patientAllergies = {
    '2021001': { patientName: '张三', allergies: ['青霉素', '阿司匹林'] },
    '2021003': { patientName: '王五', allergies: ['马来酸氯苯那敏', '海鲜'] }
};

document.addEventListener('DOMContentLoaded', function() {
    QueueService.init({ baseNumber: 100, maxWindow: 3, window: 1 });
    
    QueueService.subscribe(function(event, data) {
        console.log('QueueService Event:', event, data);
        if (['call', 'enqueue', 'dequeue', 'remove', 'clear', 'currentCleared', 'init'].includes(event)) {
            updateQueueDisplay();
        }
    });
    
    initRoleSwitcher();
    initMedicineRows();
    updateRecentPrescriptions();
    updatePharmacyView();
    updateAdminView();
    checkLowStock();
});

function initRoleSwitcher() {
    const roleBtns = document.querySelectorAll('.role-btn');
    roleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            roleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const role = this.dataset.role;
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById(role + '-view').classList.add('active');
            
            if (role === 'pharmacy') {
                updatePharmacyView();
            } else if (role === 'admin') {
                updateAdminView();
            }
        });
    });
}

function initMedicineRows() {
    addMedicineRow();
    addMedicineRow();
}

function addMedicineRow() {
    const medicineList = document.getElementById('medicineList');
    const rowId = 'medRow' + (++medicineRowCount);
    
    const row = document.createElement('div');
    row.className = 'medicine-row';
    row.id = rowId;
    row.innerHTML = `
        <select class="medicine-select" onchange="updateUsage(this)">
            <option value="">请选择药品</option>
            ${medicines.map(m => `<option value="${m.id}" data-stock="${m.stock}">${m.name} (${m.spec})</option>`).join('')}
        </select>
        <input type="text" class="med-usage" placeholder="用法用量" readonly>
        <input type="number" class="med-quantity" placeholder="数量" min="1" value="1">
        <span class="med-stock-info">库存: -</span>
        <button class="remove-btn" onclick="removeMedicineRow('${rowId}')">删除</button>
    `;
    medicineList.appendChild(row);
}

function removeMedicineRow(rowId) {
    const row = document.getElementById(rowId);
    if (row && document.querySelectorAll('.medicine-row').length > 1) {
        row.remove();
    }
}

function updateUsage(selectEl) {
    const row = selectEl.closest('.medicine-row');
    const usageInput = row.querySelector('.med-usage');
    const stockInfo = row.querySelector('.med-stock-info');
    
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const medicineId = selectEl.value;
    
    if (medicineId) {
        const medicine = medicines.find(m => m.id === medicineId);
        if (medicine) {
            usageInput.value = medicine.usage;
            stockInfo.textContent = `库存: ${medicine.stock}`;
            checkSingleMedicineAllergy(medicineId, row);
        }
    } else {
        usageInput.value = '';
        stockInfo.textContent = '库存: -';
        clearRowWarning(row);
    }
    
    checkAllMedicineAllergies();
}

function checkPatientAllergies() {
    const patientId = document.getElementById('patientId').value.trim();
    const allergySection = document.getElementById('allergyAlertSection');
    const allergyList = document.getElementById('allergyList');
    
    if (!patientId) {
        allergySection.classList.add('hidden');
        checkAllMedicineAllergies();
        return;
    }
    
    const patientData = patientAllergies[patientId];
    
    if (patientData && patientData.allergies.length > 0) {
        allergySection.classList.remove('hidden');
        allergyList.innerHTML = patientData.allergies.map(a => 
            `<span class="allergy-tag">${a}</span>`
        ).join('');
        
        const patientNameInput = document.getElementById('patientName');
        if (patientNameInput && !patientNameInput.value) {
            patientNameInput.value = patientData.patientName;
        }
    } else {
        allergySection.classList.add('hidden');
    }
    
    checkAllMedicineAllergies();
}

function checkSingleMedicineAllergy(medicineId, rowElement) {
    const patientId = document.getElementById('patientId').value.trim();
    const patientData = patientAllergies[patientId];
    
    clearRowWarning(rowElement);
    
    if (!patientData || !patientData.allergies || patientData.allergies.length === 0) {
        return false;
    }
    
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return false;
    
    const matchedAllergies = [];
    
    patientData.allergies.forEach(allergy => {
        if (medicine.ingredients && medicine.ingredients.some(ing => 
            ing.toLowerCase().includes(allergy.toLowerCase()) || 
            allergy.toLowerCase().includes(ing.toLowerCase())
        )) {
            matchedAllergies.push(allergy);
        }
        
        if (medicine.contraindications && medicine.contraindications.some(c => 
            c.toLowerCase().includes(allergy.toLowerCase())
        )) {
            if (!matchedAllergies.includes(allergy)) {
                matchedAllergies.push(allergy);
            }
        }
    });
    
    if (matchedAllergies.length > 0) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'row-allergy-warning';
        warningDiv.innerHTML = `
            <span style="color: #d32f2f;">⚠️ 过敏警告：</span>
            患者对「${matchedAllergies.join('、')}」过敏，
            ${medicine.name} 含相关成分，请谨慎使用！
        `;
        rowElement.appendChild(warningDiv);
        rowElement.classList.add('has-allergy-warning');
        return true;
    }
    
    return false;
}

function clearRowWarning(rowElement) {
    const existingWarning = rowElement.querySelector('.row-allergy-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    rowElement.classList.remove('has-allergy-warning');
}

function checkAllMedicineAllergies() {
    const patientId = document.getElementById('patientId').value.trim();
    const patientData = patientAllergies[patientId];
    const warningsContainer = document.getElementById('selectedMedicineWarnings');
    
    warningsContainer.innerHTML = '';
    
    if (!patientData || !patientData.allergies || patientData.allergies.length === 0) {
        return [];
    }
    
    const medicineRows = document.querySelectorAll('.medicine-row');
    const allWarnings = [];
    
    medicineRows.forEach(row => {
        const selectEl = row.querySelector('.medicine-select');
        if (selectEl && selectEl.value) {
            const medicine = medicines.find(m => m.id === selectEl.value);
            if (medicine) {
                patientData.allergies.forEach(allergy => {
                    const hasMatch = (medicine.ingredients && medicine.ingredients.some(ing => 
                        ing.toLowerCase().includes(allergy.toLowerCase()) || 
                        allergy.toLowerCase().includes(ing.toLowerCase())
                    )) || (medicine.contraindications && medicine.contraindications.some(c => 
                        c.toLowerCase().includes(allergy.toLowerCase())
                    ));
                    
                    if (hasMatch) {
                        allWarnings.push({
                            medicine: medicine.name,
                            allergy: allergy,
                            ingredients: medicine.ingredients
                        });
                    }
                });
            }
        }
    });
    
    if (allWarnings.length > 0) {
        const uniqueWarnings = [...new Map(allWarnings.map(w => [w.medicine + w.allergy, w])).values()];
        warningsContainer.innerHTML = `
            <div class="allergy-alert severe">
                <span class="allergy-icon">🚨</span>
                <div class="allergy-content">
                    <strong>严重过敏警告</strong>
                    <div>以下所选药品与患者过敏史冲突：</div>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        ${uniqueWarnings.map(w => `
                            <li>
                                <strong>${w.medicine}</strong> 
                                <span style="color: #d32f2f;">→ 患者对「${w.allergy}」过敏</span>
                                <div style="font-size: 12px; color: #666;">
                                    药品成分：${w.ingredients ? w.ingredients.join('、') : '未知'}
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
    
    return allWarnings;
}

function submitPrescription() {
    const patientName = document.getElementById('patientName').value.trim();
    const patientId = document.getElementById('patientId').value.trim();
    const diagnosis = document.getElementById('diagnosis').value.trim();
    
    if (!patientName || !patientId || !diagnosis) {
        showToast('请填写完整的患者信息', 'error');
        return;
    }
    
    const medicineRows = document.querySelectorAll('.medicine-row');
    const selectedMedicines = [];
    
    medicineRows.forEach(row => {
        const selectEl = row.querySelector('.medicine-select');
        const quantityEl = row.querySelector('.med-quantity');
        const usageEl = row.querySelector('.med-usage');
        
        if (selectEl.value && quantityEl.value) {
            const medicine = medicines.find(m => m.id === selectEl.value);
            if (medicine) {
                selectedMedicines.push({
                    medicineId: medicine.id,
                    medicineName: medicine.name,
                    usage: usageEl.value,
                    quantity: parseInt(quantityEl.value)
                });
            }
        }
    });
    
    if (selectedMedicines.length === 0) {
        showToast('请至少选择一种药品', 'error');
        return;
    }
    
    const allergyWarnings = checkAllMedicineAllergies();
    
    if (allergyWarnings.length > 0) {
        const uniqueWarnings = [...new Map(allergyWarnings.map(w => [w.medicine + w.allergy, w])).values()];
        showAllergyWarningModal(patientName, patientId, diagnosis, selectedMedicines, uniqueWarnings);
    } else {
        confirmSubmitPrescription(patientName, patientId, diagnosis, selectedMedicines);
    }
}

function showAllergyWarningModal(patientName, patientId, diagnosis, selectedMedicines, warnings) {
    const warningsHtml = warnings.map(w => `
        <div style="background: #fff3e0; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #ff9800;">
            <strong style="color: #e65100;">${w.medicine}</strong>
            <div style="font-size: 13px; color: #666; margin-top: 5px;">
                患者对「<span style="color: #d32f2f; font-weight: 600;">${w.allergy}</span>」过敏
            </div>
            <div style="font-size: 12px; color: #888; margin-top: 3px;">
                药品成分：${w.ingredients ? w.ingredients.join('、') : '未知'}
            </div>
        </div>
    `).join('');
    
    showModal(
        '⚠️ 严重过敏警告',
        `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px;">🚨</div>
                <div style="font-size: 16px; color: #d32f2f; font-weight: 600;">
                    检测到 ${warnings.length} 项过敏风险！
                </div>
            </div>
            <div style="margin-bottom: 15px;">
                <strong>患者：</strong>${patientName} (${patientId})
            </div>
            ${warningsHtml}
            <div style="background: #ffebee; padding: 12px; border-radius: 6px; margin-top: 15px;">
                <div style="color: #c62828; font-size: 14px;">
                    <strong>⚠️ 请确认：</strong>您是否确认要提交此处方？
                    请确保已评估用药风险并采取必要措施。
                </div>
            </div>
            <div style="margin-top: 15px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="confirmAllergyRisk" style="width: auto;">
                    <span style="font-size: 13px;">我已确认过敏风险，坚持提交此处方</span>
                </label>
            </div>
        `,
        [
            { text: '取消', class: 'btn-secondary', action: closeModal },
            { text: '确认提交', class: 'btn-danger', action: () => {
                const confirmed = document.getElementById('confirmAllergyRisk').checked;
                if (!confirmed) {
                    showToast('请勾选确认框以确认过敏风险', 'warning');
                    return;
                }
                closeModal();
                confirmSubmitPrescription(patientName, patientId, diagnosis, selectedMedicines);
            }}
        ]
    );
}

function confirmSubmitPrescription(patientName, patientId, diagnosis, selectedMedicines) {
    const prescriptionId = 'P' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + 
                           String(prescriptions.length + 1).padStart(3, '0');
    
    const prescription = {
        id: prescriptionId,
        patientName,
        patientId,
        diagnosis,
        medicines: selectedMedicines,
        status: 'pending',
        createdAt: new Date().toISOString(),
        queueNumber: null,
        hasAllergyWarning: selectedMedicines.some(m => {
            const medicine = medicines.find(med => med.id === m.medicineId);
            const patientData = patientAllergies[patientId];
            if (!patientData || !patientData.allergies) return false;
            return patientData.allergies.some(allergy => 
                (medicine.ingredients && medicine.ingredients.some(ing => 
                    ing.toLowerCase().includes(allergy.toLowerCase()) || 
                    allergy.toLowerCase().includes(ing.toLowerCase())
                )) || (medicine.contraindications && medicine.contraindications.some(c => 
                    c.toLowerCase().includes(allergy.toLowerCase())
                ))
            );
        })
    };
    
    prescriptions.unshift(prescription);
    
    document.getElementById('patientName').value = '';
    document.getElementById('patientId').value = '';
    document.getElementById('diagnosis').value = '';
    document.getElementById('allergyAlertSection').classList.add('hidden');
    document.getElementById('selectedMedicineWarnings').innerHTML = '';
    document.getElementById('medicineList').innerHTML = '';
    medicineRowCount = 0;
    initMedicineRows();
    
    updateRecentPrescriptions();
    showToast(`处方 ${prescriptionId} 已提交`, 'success');
}

function updateRecentPrescriptions() {
    const tbody = document.getElementById('recentPrescriptions');
    const recent = prescriptions.slice(0, 10);
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">暂无处方记录</td></tr>';
        return;
    }
    
    tbody.innerHTML = recent.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.patientName}</td>
            <td>${p.patientId}</td>
            <td>${p.diagnosis}</td>
            <td>${p.medicines.length} 种</td>
            <td><span class="status-badge status-${p.status}">${getStatusText(p.status)}</span></td>
            <td>${formatTime(p.createdAt)}</td>
        </tr>
    `).join('');
}

function getStatusText(status) {
    const texts = {
        pending: '待配药',
        filling: '配药中',
        ready: '待取药',
        completed: '已完成'
    };
    return texts[status] || status;
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updatePharmacyView() {
    updateQueueDisplay();
    updatePrescriptionsToFill();
    updateInventorySummary();
}

function updateQueueDisplay() {
    const currentCallEl = document.getElementById('currentCallNumber');
    const callInfoEl = document.getElementById('currentCallInfo');
    const callWindowEl = document.getElementById('currentCallWindow');
    const queueListEl = document.getElementById('queueList');
    
    const currentCall = QueueService.getCurrentCall();
    
    if (currentCall) {
        currentCallEl.textContent = currentCall.queueNumber;
        callInfoEl.textContent = `${currentCall.patientName} - ${currentCall.patientId}`;
        callWindowEl.textContent = `窗口: ${currentCall.window}`;
    } else {
        currentCallEl.textContent = '--';
        callInfoEl.textContent = '等待叫号...';
        callWindowEl.textContent = '窗口: --';
    }
    
    const waitingQueue = QueueService.getWaitingQueue();
    
    if (waitingQueue.length === 0) {
        queueListEl.innerHTML = '<div class="empty-state" style="color: rgba(255,255,255,0.7);">暂无等待患者</div>';
        return;
    }
    
    queueListEl.innerHTML = waitingQueue.map((item, index) => `
        <div class="queue-item">
            <div>
                <div class="queue-number">${item.queueNumber}</div>
                <div class="queue-patient">${item.patientName}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 12px; opacity: 0.8;">第 ${index + 2} 位</div>
                <div style="font-size: 12px; opacity: 0.8;">${item.window}号窗口</div>
            </div>
        </div>
    `).join('');
}

function updatePrescriptionsToFill() {
    const container = document.getElementById('prescriptionsToFill');
    const toFill = prescriptions.filter(p => p.status === 'pending' || p.status === 'filling' || p.status === 'ready');
    
    if (toFill.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无待配药处方</div>';
        return;
    }
    
    container.innerHTML = toFill.map(p => `
        <div class="prescription-card">
            <h4>${p.patientName} - ${p.patientId}</h4>
            <div class="prescription-meta">
                处方号: ${p.id} | 诊断: ${p.diagnosis}
            </div>
            <div class="medicines">
                ${p.medicines.map(m => `${m.medicineName} × ${m.quantity}盒`).join(', ')}
            </div>
            <div class="actions">
                ${p.status === 'pending' ? `<button class="btn btn-primary" onclick="startFilling('${p.id}')">开始配药</button>` : ''}
                ${p.status === 'filling' ? `<button class="btn btn-success" onclick="callPatient('${p.id}')">叫号取药</button>` : ''}
                ${p.status === 'ready' ? `<span class="status-badge status-ready">已叫号，等待取药</span>` : ''}
            </div>
        </div>
    `).join('');
}

function startFilling(prescriptionId) {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;
    
    let hasLowStock = false;
    prescription.medicines.forEach(m => {
        const medicine = medicines.find(med => med.id === m.medicineId);
        if (medicine && medicine.stock < m.quantity) {
            hasLowStock = true;
            showToast(`${medicine.name} 库存不足`, 'error');
        }
    });
    
    if (hasLowStock) return;
    
    prescription.status = 'filling';
    updatePharmacyView();
    showToast('开始配药', 'success');
}

function callPatient(prescriptionId) {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;
    
    prescription.medicines.forEach(m => {
        const medicine = medicines.find(med => med.id === m.medicineId);
        if (medicine) {
            medicine.stock -= m.quantity;
        }
    });
    
    const queueItem = QueueService.enqueue({
        patientName: prescription.patientName,
        patientId: prescription.patientId,
        prescriptionId: prescription.id
    });
    
    prescription.queueNumber = queueItem.queueNumber;
    prescription.status = 'ready';
    prescription.window = queueItem.window;
    
    updatePharmacyView();
    updateAdminView();
    checkLowStock();
    showToast(`${prescription.patientName} 已加入排队，号码: ${queueItem.queueNumber}`, 'success');
}

function manualCallNext() {
    const result = QueueService.manualCallNext();
    
    if (result.success) {
        updateQueueDisplay();
        showToast(`正在叫号: ${result.data.queueNumber}`, 'success');
    } else {
        showToast(result.message, 'warning');
    }
}

function repeatCurrentCall() {
    const result = QueueService.repeatCall();
    
    if (result.success) {
        showToast('重复播报', 'info');
    } else {
        showToast(result.message, 'warning');
    }
}

function updateInventorySummary() {
    const container = document.getElementById('inventorySummary');
    const lowStockItems = medicines.filter(m => m.stock <= m.threshold);
    
    let html = '';
    
    if (lowStockItems.length > 0) {
        html += '<div style="grid-column: 1/-1; margin-bottom: 15px;">';
        html += '<div class="alert-box" style="margin-bottom: 10px;">';
        html += `<span class="alert-info">⚠️ 有 ${lowStockItems.length} 种药品库存不足</span>`;
        html += '<button class="alert-action" onclick="switchToAdmin()">查看详情</button>';
        html += '</div></div>';
    }
    
    medicines.slice(0, 4).forEach(m => {
        const isLow = m.stock <= m.threshold;
        html += `
            <div class="inventory-item ${isLow ? 'low-stock' : ''}">
                <h5>${m.name}</h5>
                <div class="stock-info">规格: ${m.spec}</div>
                <div class="stock-count">${m.stock} 盒</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function switchToAdmin() {
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-role="admin"]').classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('admin-view').classList.add('active');
    updateAdminView();
}

function updateAdminView() {
    updateLowStockAlerts();
    updateInventoryTable();
    updatePurchaseHistory();
}

function updateLowStockAlerts() {
    const container = document.getElementById('lowStockAlerts');
    const lowStockItems = medicines.filter(m => m.stock <= m.threshold);
    
    if (lowStockItems.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <div class="alert-box">
            <span class="alert-info">⚠️ 库存预警：${lowStockItems.length} 种药品需要采购</span>
            <button class="alert-action" onclick="purchaseAllLowStock()">一键采购</button>
        </div>
    `;
}

function updateInventoryTable() {
    const tbody = document.getElementById('inventoryTable');
    
    tbody.innerHTML = medicines.map(m => {
        const isLow = m.stock <= m.threshold;
        return `
            <tr>
                <td>${m.id}</td>
                <td>${m.name}</td>
                <td>${m.spec}</td>
                <td><strong>${m.stock}</strong></td>
                <td>${m.threshold}</td>
                <td><span class="status-badge ${isLow ? 'status-low' : 'status-normal'}">${isLow ? '库存不足' : '正常'}</span></td>
                <td>
                    <button class="btn btn-warning" onclick="purchaseMedicine('${m.id}')">采购</button>
                    <button class="btn btn-secondary" onclick="editMedicine('${m.id}')">编辑</button>
                </td>
            </tr>
        `;
    }).join('');
}

function updatePurchaseHistory() {
    const container = document.getElementById('purchaseHistory');
    
    if (purchaseOrders.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无采购记录</div>';
        return;
    }
    
    container.innerHTML = purchaseOrders.map(order => `
        <div class="purchase-record">
            <div class="purchase-info">
                <strong>${order.medicineName}</strong> - 采购数量: ${order.quantity}盒
            </div>
            <div class="purchase-meta">
                操作人: ${order.operator} | 时间: ${formatTime(order.createdAt)}
            </div>
        </div>
    `).join('');
}

function checkLowStock() {
    const lowStockItems = medicines.filter(m => m.stock <= m.threshold);
    if (lowStockItems.length > 0) {
        console.log(`库存预警: ${lowStockItems.length} 种药品库存不足`);
    }
}

function purchaseMedicine(medicineId) {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return;
    
    showModal(
        `采购 ${medicine.name}`,
        `
            <div class="form-group">
                <label>当前库存: ${medicine.stock} 盒</label>
            </div>
            <div class="form-group">
                <label>采购数量</label>
                <input type="number" id="purchaseQuantity" value="50" min="1">
            </div>
            <div class="form-group">
                <label>操作人</label>
                <input type="text" id="purchaseOperator" placeholder="请输入操作人姓名" value="管理员">
            </div>
        `,
        [
            { text: '取消', class: 'btn-secondary', action: closeModal },
            { text: '确认采购', class: 'btn-primary', action: () => confirmPurchase(medicineId) }
        ]
    );
}

function confirmPurchase(medicineId) {
    const quantity = parseInt(document.getElementById('purchaseQuantity').value);
    const operator = document.getElementById('purchaseOperator').value.trim();
    
    if (!quantity || quantity <= 0) {
        showToast('请输入有效的采购数量', 'error');
        return;
    }
    
    if (!operator) {
        showToast('请输入操作人', 'error');
        return;
    }
    
    const medicine = medicines.find(m => m.id === medicineId);
    if (medicine) {
        medicine.stock += quantity;
        
        purchaseOrders.unshift({
            medicineId: medicine.id,
            medicineName: medicine.name,
            quantity,
            operator,
            createdAt: new Date().toISOString()
        });
        
        closeModal();
        updateAdminView();
        showToast(`已采购 ${medicine.name} ${quantity}盒`, 'success');
    }
}

function purchaseAllLowStock() {
    const lowStockItems = medicines.filter(m => m.stock <= m.threshold);
    
    lowStockItems.forEach(m => {
        const purchaseQty = m.threshold * 2 - m.stock;
        m.stock += purchaseQty;
        
        purchaseOrders.unshift({
            medicineId: m.id,
            medicineName: m.name,
            quantity: purchaseQty,
            operator: '管理员',
            createdAt: new Date().toISOString()
        });
    });
    
    updateAdminView();
    showToast(`已采购 ${lowStockItems.length} 种药品`, 'success');
}

function editMedicine(medicineId) {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return;
    
    showModal(
        `编辑 ${medicine.name}`,
        `
            <div class="form-group">
                <label>药品名称</label>
                <input type="text" id="editMedicineName" value="${medicine.name}">
            </div>
            <div class="form-group">
                <label>规格</label>
                <input type="text" id="editMedicineSpec" value="${medicine.spec}">
            </div>
            <div class="form-group">
                <label>库存阈值</label>
                <input type="number" id="editMedicineThreshold" value="${medicine.threshold}" min="1">
            </div>
        `,
        [
            { text: '取消', class: 'btn-secondary', action: closeModal },
            { text: '保存', class: 'btn-primary', action: () => saveMedicineEdit(medicineId) }
        ]
    );
}

function saveMedicineEdit(medicineId) {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return;
    
    medicine.name = document.getElementById('editMedicineName').value;
    medicine.spec = document.getElementById('editMedicineSpec').value;
    medicine.threshold = parseInt(document.getElementById('editMedicineThreshold').value);
    
    closeModal();
    updateAdminView();
    showToast('药品信息已更新', 'success');
}

function openAddMedicineModal() {
    showModal(
        '添加新药品',
        `
            <div class="form-group">
                <label>药品编码</label>
                <input type="text" id="newMedicineId" placeholder="如: M009">
            </div>
            <div class="form-group">
                <label>药品名称</label>
                <input type="text" id="newMedicineName" placeholder="请输入药品名称">
            </div>
            <div class="form-group">
                <label>规格</label>
                <input type="text" id="newMedicineSpec" placeholder="如: 0.25g*24粒">
            </div>
            <div class="form-group">
                <label>初始库存</label>
                <input type="number" id="newMedicineStock" value="100" min="0">
            </div>
            <div class="form-group">
                <label>库存阈值</label>
                <input type="number" id="newMedicineThreshold" value="30" min="1">
            </div>
            <div class="form-group">
                <label>用法用量</label>
                <input type="text" id="newMedicineUsage" placeholder="请输入用法用量">
            </div>
        `,
        [
            { text: '取消', class: 'btn-secondary', action: closeModal },
            { text: '添加', class: 'btn-primary', action: addNewMedicine }
        ]
    );
}

function addNewMedicine() {
    const id = document.getElementById('newMedicineId').value.trim();
    const name = document.getElementById('newMedicineName').value.trim();
    const spec = document.getElementById('newMedicineSpec').value.trim();
    const stock = parseInt(document.getElementById('newMedicineStock').value);
    const threshold = parseInt(document.getElementById('newMedicineThreshold').value);
    const usage = document.getElementById('newMedicineUsage').value.trim();
    
    if (!id || !name || !spec || !usage) {
        showToast('请填写完整的药品信息', 'error');
        return;
    }
    
    if (medicines.find(m => m.id === id)) {
        showToast('药品编码已存在', 'error');
        return;
    }
    
    medicines.push({ id, name, spec, stock, threshold, usage });
    
    closeModal();
    updateAdminView();
    showToast(`已添加药品: ${name}`, 'success');
}

function searchPatientPrescriptions() {
    const patientId = document.getElementById('patientSearchId').value.trim();
    
    if (!patientId) {
        showToast('请输入病历号或校园卡号', 'error');
        return;
    }
    
    const patientPrescriptions = prescriptions.filter(p => p.patientId === patientId);
    
    const container = document.getElementById('patientPrescriptions');
    const recordsContainer = document.getElementById('patientRecords');
    
    if (patientPrescriptions.length === 0) {
        container.innerHTML = '<div class="empty-state">未找到该患者的处方记录</div>';
        recordsContainer.innerHTML = '<div class="empty-state">暂无取药记录</div>';
        return;
    }
    
    const patientName = patientPrescriptions[0].patientName;
    
    container.innerHTML = `
        <h3 style="margin-bottom: 15px;">📋 ${patientName} 的处方列表</h3>
        ${patientPrescriptions.map(p => `
            <div class="patient-prescription-card">
                <div class="prescription-header">
                    <span class="prescription-id">${p.id}</span>
                    <span class="status-badge status-${p.status}">${getStatusText(p.status)}</span>
                </div>
                <div class="diagnosis">诊断: ${p.diagnosis}</div>
                ${p.medicines.map(m => `
                    <div class="medicine-detail">
                        <div class="medicine-name">${m.medicineName} × ${m.quantity}盒</div>
                        <div class="medicine-usage">${m.usage}</div>
                    </div>
                `).join('')}
                ${p.status === 'ready' ? `
                    <div class="confirm-section">
                        <p>您的处方已配好，请凭叫号到窗口取药</p>
                        ${p.queueNumber ? `<p style="font-size: 18px; font-weight: bold; color: #1e88e5;">您的号码: ${p.queueNumber}</p>` : ''}
                        <button class="btn btn-success" onclick="confirmPickup('${p.id}')">确认取药</button>
                    </div>
                ` : ''}
                ${p.status === 'completed' ? `
                    <div class="confirm-section">
                        <p>✅ 已取药</p>
                        <p style="font-size: 13px; color: #666;">取药时间: ${formatTime(p.completedAt)}</p>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    `;
    
    const completedRecords = prescriptions.filter(p => p.patientId === patientId && p.status === 'completed');
    if (completedRecords.length > 0) {
        recordsContainer.innerHTML = `
            <h3>📋 取药记录</h3>
            ${completedRecords.map(p => `
                <div class="patient-prescription-card">
                    <div class="prescription-header">
                        <span class="prescription-id">${p.id}</span>
                        <span class="status-badge status-completed">已完成</span>
                    </div>
                    <div class="diagnosis">诊断: ${p.diagnosis}</div>
                    ${p.medicines.map(m => `
                        <div class="medicine-detail">
                            <div class="medicine-name">${m.medicineName} × ${m.quantity}盒</div>
                        </div>
                    `).join('')}
                    <p style="margin-top: 10px; font-size: 13px; color: #666;">取药时间: ${formatTime(p.completedAt)}</p>
                    ${p.signature ? `<img src="${p.signature}" class="signature-display" alt="签名">` : ''}
                </div>
            `).join('')}
        `;
    } else {
        recordsContainer.innerHTML = '<div class="empty-state">暂无取药记录</div>';
    }
}

function confirmPickup(prescriptionId) {
    currentPrescriptionId = prescriptionId;
    showSignatureCanvas();
}

function showSignatureCanvas() {
    const canvasContainer = document.getElementById('signatureCanvas');
    canvasContainer.classList.remove('hidden');
    canvasContainer.innerHTML = `
        <h3 style="color: white; margin-bottom: 20px;">✍️ 请签名确认取药</h3>
        <canvas id="sigCanvas" width="400" height="200" style="background: white; border-radius: 8px;"></canvas>
        <div class="signature-actions">
            <button class="btn btn-secondary" onclick="clearSignature()">清除</button>
            <button class="btn btn-secondary" onclick="cancelSignature()">取消</button>
            <button class="btn btn-success" onclick="saveSignature()">确认取药</button>
        </div>
    `;
    
    setTimeout(() => {
        signatureCanvas = document.getElementById('sigCanvas');
        signatureCtx = signatureCanvas.getContext('2d');
        
        signatureCanvas.addEventListener('mousedown', startDrawing);
        signatureCanvas.addEventListener('mousemove', draw);
        signatureCanvas.addEventListener('mouseup', stopDrawing);
        signatureCanvas.addEventListener('mouseout', stopDrawing);
        
        signatureCanvas.addEventListener('touchstart', handleTouch);
        signatureCanvas.addEventListener('touchmove', handleTouch);
        signatureCanvas.addEventListener('touchend', stopDrawing);
    }, 100);
}

function startDrawing(e) {
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    signatureCtx.beginPath();
    signatureCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
    if (!isDrawing) return;
    const rect = signatureCanvas.getBoundingClientRect();
    signatureCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    signatureCtx.strokeStyle = '#333';
    signatureCtx.lineWidth = 2;
    signatureCtx.lineCap = 'round';
    signatureCtx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
    };
    
    if (e.type === 'touchstart') {
        startDrawing(mouseEvent);
    } else if (e.type === 'touchmove') {
        draw(mouseEvent);
    }
}

function clearSignature() {
    if (signatureCtx) {
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    }
}

function cancelSignature() {
    document.getElementById('signatureCanvas').classList.add('hidden');
    currentPrescriptionId = null;
}

function saveSignature() {
    if (!signatureCanvas) return;
    
    const signatureData = signatureCanvas.toDataURL();
    
    const prescription = prescriptions.find(p => p.id === currentPrescriptionId);
    if (prescription) {
        prescription.status = 'completed';
        prescription.completedAt = new Date().toISOString();
        prescription.signature = signatureData;
        
        if (QueueService.isCurrentCall(currentPrescriptionId)) {
            QueueService.dequeue();
            QueueService.callNext();
        } else {
            QueueService.remove(currentPrescriptionId);
        }
    }
    
    document.getElementById('signatureCanvas').classList.add('hidden');
    currentPrescriptionId = null;
    
    searchPatientPrescriptions();
    updatePharmacyView();
    showToast('取药确认成功', 'success');
}

function showModal(title, body, buttons) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    
    const footer = document.getElementById('modalFooter');
    footer.innerHTML = '';
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `btn ${btn.class}`;
        button.textContent = btn.text;
        button.onclick = btn.action;
        footer.appendChild(button);
    });
    
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function exportInventoryData() {
    const data = {
        medicines,
        prescriptions,
        purchaseOrders,
        exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('数据导出成功', 'success');
}