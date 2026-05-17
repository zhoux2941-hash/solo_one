const API_BASE = 'http://localhost:8080/api/pigs';

let currentPigId = null;
let currentSlaughterPigId = null;

document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    loadPendingDisposal();
    loadPendingQuarantine();
    queryByStatus();
    
    const slaughterRfidInput = document.getElementById('slaughterRfid');
    if (slaughterRfidInput) {
        slaughterRfidInput.addEventListener('change', searchPigForSlaughter);
    }

    const plateInput = document.getElementById('transportVehicle');
    if (plateInput) {
        plateInput.addEventListener('input', function() {
            const plate = this.value.trim().toUpperCase();
            this.value = plate;
            const tip = document.getElementById('plateValidationTip');
            
            if (!plate) {
                tip.textContent = '';
                tip.className = 'validation-tip';
                this.classList.remove('valid', 'invalid');
                return;
            }

            if (validatePlateNumber(plate)) {
                tip.textContent = '车牌格式正确';
                tip.className = 'validation-tip valid';
                this.classList.remove('invalid');
                this.classList.add('valid');
            } else {
                tip.textContent = '格式不正确，请输入有效车牌号';
                tip.className = 'validation-tip invalid';
                this.classList.remove('valid');
                this.classList.add('invalid');
            }
        });

        plateInput.addEventListener('blur', function() {
            const plate = this.value.trim();
            if (plate && !validatePlateNumber(plate)) {
                showToast('车牌号码格式不正确，请检查', 'error');
            }
        });
    }
});

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'disposal') {
                loadPendingDisposal();
            }
            if (tabId === 'quarantine') {
                loadPendingQuarantine();
            }
        });
    });
}

async function loadPendingQuarantine() {
    try {
        const response = await fetch(`${API_BASE}/status/入场登记`);
        if (response.ok) {
            const pigs = await response.json();
            const container = document.getElementById('pendingQuarantineList');
            
            if (pigs.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        暂无待检疫的生猪
                    </div>
                `;
            } else {
                container.innerHTML = pigs.map(pig => `
                    <div class="pending-item" onclick="selectPigForQuarantine(${pig.id})">
                        <div class="pending-item-info">
                            <p class="rfid-tag">🏷️ ${pig.rfidTag}</p>
                            <p>📍 产地: ${pig.origin}</p>
                            <p>🕐 入场: ${formatDate(pig.entryTime)}</p>
                        </div>
                        <button class="btn-quick" onclick="event.stopPropagation(); quickQuarantine(${pig.id})">快速检疫</button>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('加载待检疫列表失败', error);
    }
}

async function selectPigForQuarantine(pigId) {
    try {
        const response = await fetch(`${API_BASE}/${pigId}`);
        if (response.ok) {
            const pig = await response.json();
            currentPigId = pig.id;
            document.getElementById('searchRfid').value = pig.rfidTag;
            displayPigInfo(pig, 'quarantinePigInfo');
            document.getElementById('quarantineForm').style.display = 'block';
            document.getElementById('quarantineOfficer').focus();
        }
    } catch (error) {
        showToast('加载生猪信息失败', 'error');
    }
}

async function quickQuarantine(pigId) {
    try {
        const response = await fetch(`${API_BASE}/${pigId}`);
        if (response.ok) {
            const pig = await response.json();
            currentPigId = pig.id;
            document.getElementById('searchRfid').value = pig.rfidTag;
            displayPigInfo(pig, 'quarantinePigInfo');
            document.getElementById('quarantineForm').style.display = 'block';
            document.getElementById('quarantineOfficer').focus();
            showToast('已选择该生猪，请填写检疫信息', 'success');
        }
    } catch (error) {
        showToast('加载生猪信息失败', 'error');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function generateRfid() {
    return 'RFID' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
}

function simulateScan() {
    document.getElementById('rfidTag').value = generateRfid();
    showToast('RFID耳标扫描成功！', 'success');
}

function simulateSlaughterScan() {
    document.getElementById('slaughterRfid').value = generateRfid();
    showToast('屠宰线自动扫描成功！', 'success');
}

function validatePlateNumber(plate) {
    if (!plate) return true;
    
    const plateRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]?$/;
    const newEnergyRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使][A-Z][DF][A-Z0-9]{5}$/;
    
    const isValid = plateRegex.test(plate) || newEnergyRegex.test(plate);
    return isValid;
}

async function registerPig() {
    const rfidTag = document.getElementById('rfidTag').value;
    const origin = document.getElementById('origin').value;
    const immuneRecord = document.getElementById('immuneRecord').value;
    const transportVehicle = document.getElementById('transportVehicle').value;

    if (!rfidTag || !origin) {
        showToast('请填写必填字段（耳标编号和产地）', 'error');
        return;
    }

    if (transportVehicle && !validatePlateNumber(transportVehicle)) {
        showToast('车牌号码格式不正确，请输入有效的车牌号（如：京A12345、沪AD12345）', 'error');
        document.getElementById('transportVehicle').focus();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rfidTag, origin, immuneRecord, transportVehicle })
        });

        if (response.ok) {
            showToast('生猪入场登记成功！', 'success');
            document.getElementById('rfidTag').value = '';
            document.getElementById('origin').value = '';
            document.getElementById('immuneRecord').value = '';
            document.getElementById('transportVehicle').value = '';
            document.getElementById('plateValidationTip').textContent = '';
            document.getElementById('plateValidationTip').className = 'validation-tip';
            document.getElementById('transportVehicle').classList.remove('valid', 'invalid');
        } else {
            const errorMsg = await response.text();
            showToast(errorMsg || '登记失败，可能耳标已存在', 'error');
        }
    } catch (error) {
        showToast('网络错误，请检查后端服务', 'error');
    }
}

async function searchPigForQuarantine() {
    const rfid = document.getElementById('searchRfid').value;
    if (!rfid) {
        showToast('请输入耳标编号', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/rfid/${rfid}`);
        if (response.ok) {
            const pig = await response.json();
            currentPigId = pig.id;
            displayPigInfo(pig, 'quarantinePigInfo');
            document.getElementById('quarantineForm').style.display = 'block';
        } else {
            showToast('未找到该生猪信息', 'error');
            document.getElementById('quarantinePigInfo').innerHTML = '';
            document.getElementById('quarantineForm').style.display = 'none';
        }
    } catch (error) {
        showToast('网络错误', 'error');
    }
}

function displayPigInfo(pig, elementId) {
    const container = document.getElementById(elementId);
    container.innerHTML = `
        <h4>生猪信息</h4>
        <p><strong>ID:</strong> ${pig.id}</p>
        <p><strong>耳标:</strong> ${pig.rfidTag}</p>
        <p><strong>产地:</strong> ${pig.origin}</p>
        <p><strong>状态:</strong> <span class="status-badge status-${pig.status}">${pig.status}</span></p>
        ${pig.quarantineResult ? `<p><strong>检疫结果:</strong> ${pig.quarantineResult}</p>` : ''}
        ${pig.carcassId ? `<p><strong>胴体编号:</strong> ${pig.carcassId}</p>` : ''}
    `;
}

async function submitQuarantine() {
    if (!currentPigId) {
        showToast('请先搜索生猪', 'error');
        return;
    }

    const result = document.getElementById('quarantineResult').value;
    const officer = document.getElementById('quarantineOfficer').value;

    if (!officer) {
        showToast('请输入检疫员姓名', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${currentPigId}/quarantine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result, officer })
        });

        if (response.ok) {
            const pig = await response.json();
            displayPigInfo(pig, 'quarantinePigInfo');
            showToast(`检疫结果提交成功！${result === '合格' ? '已进入待宰圈' : '已标记为不合格'}`, 'success');
            document.getElementById('quarantineForm').style.display = 'none';
            document.getElementById('searchRfid').value = '';
            loadPendingQuarantine();
        } else {
            showToast('提交失败', 'error');
        }
    } catch (error) {
        showToast('网络错误', 'error');
    }
}

async function searchPigForSlaughter() {
    const rfid = document.getElementById('slaughterRfid').value;
    if (!rfid) {
        showToast('请输入耳标编号', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/rfid/${rfid}`);
        if (response.ok) {
            const pig = await response.json();
            if (pig.status !== '待宰圈') {
                showToast('该生猪不在待宰圈，无法屠宰', 'error');
                return;
            }
            currentSlaughterPigId = pig.id;
            displayPigInfo(pig, 'slaughterPigInfo');
            document.getElementById('slaughterForm').style.display = 'block';
        } else {
            showToast('未找到该生猪信息', 'error');
            document.getElementById('slaughterPigInfo').innerHTML = '';
            document.getElementById('slaughterForm').style.display = 'none';
        }
    } catch (error) {
        showToast('网络错误', 'error');
    }
}

async function associateCarcass() {
    if (!currentSlaughterPigId) {
        showToast('请先扫描耳标', 'error');
        return;
    }

    const carcassId = document.getElementById('carcassId').value;
    if (!carcassId) {
        showToast('请输入胴体编号', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${currentSlaughterPigId}/associate-carcass`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carcassId })
        });

        if (response.ok) {
            const pig = await response.json();
            displayPigInfo(pig, 'slaughterPigInfo');
            showToast('胴体关联成功！追溯链已建立', 'success');
            document.getElementById('slaughterForm').style.display = 'none';
            document.getElementById('slaughterRfid').value = '';
            document.getElementById('carcassId').value = '';
        } else {
            showToast('关联失败', 'error');
        }
    } catch (error) {
        showToast('网络错误', 'error');
    }
}

async function loadPendingDisposal() {
    try {
        const response = await fetch(`${API_BASE}/status/不合格-待处理`);
        if (response.ok) {
            const pigs = await response.json();
            const container = document.getElementById('pendingDisposalList');
            
            if (pigs.length === 0) {
                container.innerHTML = '<p style="color: #155724;">暂无待处理的不合格生猪</p>';
            } else {
                container.innerHTML = pigs.map(pig => `
                    <div class="disposal-item">
                        <span>ID: ${pig.id}</span> | 耳标: ${pig.rfidTag} | 产地: ${pig.origin}
                        <br>检疫员: ${pig.quarantineOfficer} | 时间: ${formatDate(pig.quarantineTime)}
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('加载待处理列表失败', error);
    }
}

async function submitDisposal() {
    const pigId = document.getElementById('disposalPigId').value;
    const disposalInfo = document.getElementById('disposalInfo').value;

    if (!pigId || !disposalInfo) {
        showToast('请填写完整信息', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${pigId}/dispose`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ disposalInfo })
        });

        if (response.ok) {
            showToast('无害化处理已上报完成！', 'success');
            document.getElementById('disposalPigId').value = '';
            document.getElementById('disposalInfo').value = '';
            loadPendingDisposal();
        } else {
            showToast('处理失败，请检查生猪ID', 'error');
        }
    } catch (error) {
        showToast('网络错误', 'error');
    }
}

async function queryByStatus() {
    const status = document.getElementById('queryStatus').value;
    let url = API_BASE;
    
    if (status) {
        url = `${API_BASE}/status/${encodeURIComponent(status)}`;
    }

    try {
        const response = await fetch(url);
        if (response.ok) {
            const pigs = await response.json();
            displayQueryResults(pigs);
        }
    } catch (error) {
        showToast('查询失败', 'error');
    }
}

function displayQueryResults(pigs) {
    const container = document.getElementById('queryResults');
    
    if (pigs.length === 0) {
        container.innerHTML = '<p>暂无数据</p>';
        return;
    }

    container.innerHTML = `
        <p style="margin-bottom: 15px; color: #495057;">共找到 ${pigs.length} 条记录</p>
        ${pigs.map(pig => `
            <div class="result-item">
                <h5>生猪 #${pig.id} - ${pig.rfidTag}</h5>
                <p><strong>状态:</strong> <span class="status-badge status-${pig.status}">${pig.status}</span></p>
                <p><strong>产地:</strong> ${pig.origin}</p>
                <p><strong>入场时间:</strong> ${formatDate(pig.entryTime)}</p>
                ${pig.quarantineResult ? `<p><strong>检疫结果:</strong> ${pig.quarantineResult} (检疫员: ${pig.quarantineOfficer})</p>` : ''}
                ${pig.carcassId ? `<p><strong>胴体编号:</strong> ${pig.carcassId}</p>` : ''}
                ${pig.disposalInfo ? `<p><strong>处理方式:</strong> ${pig.disposalInfo}</p>` : ''}
            </div>
        `).join('')}
    `;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return dateStr.replace('T', ' ').substring(0, 19);
}
