let currentUser = null;
let socket = null;
let selectedPorts = [];
let currentFlashTaskId = null;
let isPortConnected = false;
let currentDebugPort = null;

document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initNavigation();
    initModals();
});

function initLogin() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const result = await API.login(username, password);
        
        if (result.success) {
            currentUser = result.data;
            showMainContainer();
            initSocket();
            loadDashboard();
        } else {
            showToast(result.error, 'error');
        }
    });

    document.getElementById('btnLogout').addEventListener('click', async () => {
        if (currentUser) {
            await API.logout(currentUser.id);
        }
        currentUser = null;
        if (socket) {
            socket.disconnect();
        }
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('mainContainer').style.display = 'none';
    });
}

function showMainContainer() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'flex';
    document.getElementById('currentUser').textContent = currentUser.realName || currentUser.username;
}

function initSocket() {
    socket = io('http://localhost:3000');
    
    socket.on('flashStatus', (data) => {
        if (data.taskId === currentFlashTaskId) {
            updateFlashStatus(data);
        }
    });

    socket.on('connect', () => {
        console.log('Socket connected');
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });
}

function initNavigation() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
}

function navigateTo(page) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
    });
    document.getElementById(`page-${page}`).style.display = 'block';

    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'firmware':
            loadFirmwareList();
            break;
        case 'flash':
            loadFlashPage();
            break;
        case 'debug':
            loadDebugPage();
            break;
        case 'history':
            loadHistory();
            break;
        case 'logs':
            loadLogs();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

async function loadDashboard() {
    const firmwareResult = await API.getFirmwareList(1, 1);
    document.getElementById('statFirmwareCount').textContent = firmwareResult.data?.total || 0;

    const portsResult = await API.scanPorts();
    document.getElementById('statDeviceCount').textContent = portsResult.data?.length || 0;

    const historyResult = await API.getFlashHistory(1, 100);
    const today = new Date().toDateString();
    const todayTasks = historyResult.data?.list?.filter(t => 
        new Date(t.created_at).toDateString() === today
    ) || [];
    
    document.getElementById('statTaskCount').textContent = todayTasks.length;
    
    if (todayTasks.length > 0) {
        const successCount = todayTasks.filter(t => t.status === 'success').length;
        const rate = Math.round((successCount / todayTasks.length) * 100);
        document.getElementById('statSuccessRate').textContent = rate + '%';
    } else {
        document.getElementById('statSuccessRate').textContent = '0%';
    }
}

async function loadFirmwareList() {
  const result = await API.getFirmwareList(1, 50);
  
  if (result.success) {
    const tbody = document.getElementById('firmwareTableBody');
    tbody.innerHTML = result.data.list.map(firmware => `
      <tr>
        <td>
          ${firmware.file_name}
          ${firmware.is_encrypted ? '<span class="badge badge-warning" title="检测到固件可能已加密">🔒加密</span>' : ''}
        </td>
        <td>${firmware.version}</td>
        <td>${firmware.hardware_model}</td>
        <td>${formatFileSize(firmware.file_size)}</td>
        <td>
          0x${firmware.start_address ? firmware.start_address.toString(16).toUpperCase() : '0'}
        </td>
        <td>${formatDate(firmware.created_at)}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="showFirmwareDetail(${firmware.id})">详情</button>
          <button class="btn btn-sm btn-danger" onclick="deleteFirmware(${firmware.id})">删除</button>
        </td>
      </tr>
    `).join('');
  }
}

async function showFirmwareDetail(id) {
  const result = await API.getFirmwareDetail(id);
  
  if (result.success) {
    const fw = result.data;
    let detailHtml = `
      <h3>固件详情</h3>
      <table class="detail-table">
        <tr><td>文件名:</td><td>${fw.file_name}</td></tr>
        <tr><td>版本:</td><td>${fw.version}</td></tr>
        <tr><td>硬件型号:</td><td>${fw.hardware_model}</td></tr>
        <tr><td>文件大小:</td><td>${formatFileSize(fw.file_size)}</td></tr>
        <tr><td>起始地址:</td><td>0x${fw.start_address ? fw.start_address.toString(16).toUpperCase() : '0'}</td></tr>
        <tr><td>文件类型:</td><td>${fw.file_type || fw.file_name.split('.').pop().toUpperCase()}</td></tr>
        <tr><td>MD5:</td><td><code>${fw.md5_hash}</code></td></tr>
        <tr><td>加密检测:</td><td>${fw.is_encrypted ? '<span style="color: #ffc107;">🔒 检测到可能已加密</span>' : '<span style="color: #28a745;">✓ 未检测到加密</span>'}</td></tr>
        <tr><td>上传时间:</td><td>${formatDateTime(fw.created_at)}</td></tr>
    `;
    
    if (fw.warnings && fw.warnings.length > 0) {
      detailHtml += `
        <tr><td>解析警告:</td><td style="color: #dc3545;">
          <ul style="margin: 0; padding-left: 20px;">
            ${fw.warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </td></tr>
      `;
    }
    
    detailHtml += `</table>`;
    
    const modalHtml = `
      <div class="modal show" id="firmwareDetailModal" style="display: flex;">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h3>固件详情</h3>
            <span class="close" onclick="document.getElementById('firmwareDetailModal').remove()">&times;</span>
          </div>
          <div class="modal-body">
            ${detailHtml}
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="document.getElementById('firmwareDetailModal').remove()">关闭</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } else {
    showToast('获取固件详情失败', 'error');
  }
}

async function deleteFirmware(id) {
    if (confirm('确定要删除此固件吗？')) {
        const result = await API.deleteFirmware(id);
        if (result.success) {
            showToast('删除成功', 'success');
            loadFirmwareList();
        } else {
            showToast(result.error, 'error');
        }
    }
}

async function loadFlashPage() {
    await loadPortsWithDevices();
    await loadFirmwareSelect();
    
    document.getElementById('btnRefreshPorts').addEventListener('click', loadPortsWithDevices);
    document.getElementById('btnStartFlash').addEventListener('click', startFlash);
    document.getElementById('btnCancelFlash').addEventListener('click', cancelFlash);
}

async function loadPortsWithDevices() {
    const result = await API.scanPortsWithDevices();
    
    if (result.success) {
        const grid = document.getElementById('portsGrid');
        grid.innerHTML = result.data.map(port => {
            const isKnownDevice = port.deviceInfo !== null;
            const deviceId = port.deviceInfo?.id || port.deviceId;
            const serialNum = port.deviceInfo?.serial_number || port.serialNumber;
            
            return `
                <div class="port-item ${isKnownDevice ? 'port-known' : 'port-unknown'}" 
                     data-port="${port.path}" 
                     data-device-id="${deviceId || ''}"
                     onclick="togglePortSelection('${port.path}', ${deviceId || 'null'})">
                    <div class="port-header">
                        <span class="port-name">${port.path}</span>
                        ${isKnownDevice ? '<span class="device-badge device-known">已注册</span>' : '<span class="device-badge device-unknown">新设备</span>'}
                    </div>
                    <div class="port-info">
                        ${serialNum ? `SN: ${serialNum.substring(0, 15)}${serialNum.length > 15 ? '...' : ''}` : ''}
                        ${port.deviceInfo?.hardware_model ? ` | 型号: ${port.deviceInfo.hardware_model}` : port.manufacturer || ''}
                    </div>
                    ${!isKnownDevice ? `
                        <button class="btn btn-sm btn-outline mt-2" onclick="event.stopPropagation(); registerDevice('${port.path}', '${port.serialNumber || ''}', '${port.pnpId || ''}', '${port.vendorId || ''}', '${port.productId || ''}', '${port.manufacturer || ''}')">
                            注册设备
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        selectedPorts = [];
    }
}

function togglePortSelection(port, deviceId = null) {
    const index = selectedPorts.findIndex(p => p.port === port);
    const item = document.querySelector(`[data-port="${port}"]`);
    
    if (index === -1) {
        selectedPorts.push({ port, deviceId });
        item.classList.add('selected');
    } else {
        selectedPorts.splice(index, 1);
        item.classList.remove('selected');
    }
    
    updateSelectedPortsDisplay();
}

function updateSelectedPortsDisplay() {
    const countEl = document.getElementById('selectedPortsCount');
    if (countEl) {
        countEl.textContent = `已选择 ${selectedPorts.length} 个设备`;
    }
}

async function registerDevice(portName, serialNumber, pnpId, vendorId, productId, manufacturer) {
    const hardwareModel = prompt('请输入硬件型号:', 'STM32');
    
    const result = await API.registerDevice({
        portName,
        serialNumber: serialNumber || undefined,
        hardwareModel: hardwareModel || undefined,
        pnpId: pnpId || undefined,
        vendorId: vendorId || undefined,
        productId: productId || undefined,
        manufacturer: manufacturer || undefined
    });
    
    if (result.success) {
        showToast('设备注册成功', 'success');
        await loadPortsWithDevices();
    } else {
        showToast(result.error || '注册失败', 'error');
    }
}

async function loadFirmwareSelect() {
    const result = await API.getFirmwareList(1, 100);
    
    if (result.success) {
        const select = document.getElementById('flashFirmwareSelect');
        select.innerHTML = '<option value="">请选择固件</option>' + 
            result.data.list.map(f => `
                <option value="${f.id}">${f.file_name} (${f.version})</option>
            `).join('');
    }
}

let flashHeartbeatInterval = null;

async function startFlash() {
    const firmwareId = document.getElementById('flashFirmwareSelect').value;
    
    if (!firmwareId) {
        showToast('请选择固件', 'error');
        return;
    }
    
    if (selectedPorts.length === 0) {
        showToast('请选择至少一个设备', 'error');
        return;
    }
    
    const portNames = selectedPorts.map(p => p.port);
    const result = await API.startFlash(firmwareId, portNames, currentUser?.id);
    
    if (result.success) {
        currentFlashTaskId = result.data.taskId;
        document.getElementById('flashStatusCard').style.display = 'block';
        document.getElementById('btnStartFlash').style.display = 'none';
        document.getElementById('btnCancelFlash').style.display = 'inline-block';
        
        startFlashHeartbeat();
        showToast('烧录任务已开始', 'success');
    } else {
        showToast(result.error, 'error');
    }
}

function startFlashHeartbeat() {
    if (flashHeartbeatInterval) {
        clearInterval(flashHeartbeatInterval);
    }
    
    flashHeartbeatInterval = setInterval(async () => {
        if (!currentFlashTaskId) {
            stopFlashHeartbeat();
            return;
        }
        
        try {
            const result = await API.getFlashStatus(currentFlashTaskId);
            if (result.success && result.data) {
                updateFlashStatus(result.data);
            }
        } catch (e) {
            console.error('心跳获取状态失败:', e);
        }
    }, 500);
}

function stopFlashHeartbeat() {
    if (flashHeartbeatInterval) {
        clearInterval(flashHeartbeatInterval);
        flashHeartbeatInterval = null;
    }
}

async function cancelFlash() {
    if (!currentFlashTaskId) return;
    
    const result = await API.cancelFlash(currentFlashTaskId, currentUser?.id);
    
    if (result.success) {
        showToast('烧录任务已取消', 'success');
        document.getElementById('btnStartFlash').style.display = 'inline-block';
        document.getElementById('btnCancelFlash').style.display = 'none';
        stopFlashHeartbeat();
        currentFlashTaskId = null;
    }
}

function updateFlashStatus(data) {
    const container = document.getElementById('flashStatusContainer');
    const hasFailed = data.failedCount > 0;
    const isFinished = ['success', 'failed', 'partial', 'cancelled'].includes(data.status);
    
    container.innerHTML = `
        <div class="flash-summary">
            <div class="flash-summary-item">
                <span class="flash-summary-label">任务状态</span>
                <span class="status-badge" style="background: ${getStatusColor(data.status)}; color: white;">${getFriendlyStatus(data.status)}</span>
            </div>
            <div class="flash-summary-item">
                <span class="flash-summary-label">设备统计</span>
                <span class="flash-summary-value">成功: ${data.successCount} / 失败: ${data.failedCount} / 总数: ${data.totalCount}</span>
            </div>
            ${hasFailed && isFinished ? `
                <button class="btn btn-sm btn-warning" onclick="retryFailedDevices()" style="margin-left: auto;">
                    重试失败设备
                </button>
            ` : ''}
        </div>
        
        ${data.devices.map(device => `
            <div class="device-flash-item">
                <div class="device-flash-header">
                    <span class="device-flash-name">
                        ${device.port}
                        ${device.retries > 0 ? `<span class="retry-badge" title="已重试 ${device.retries} 次">⟳ ${device.retries}</span>` : ''}
                    </span>
                    <span class="status-badge" style="background: ${getStatusColor(device.status)}; color: white;">${getFriendlyStatus(device.status)}</span>
                </div>
                
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill ${device.progress === 100 ? 'progress-complete' : ''}" style="width: ${device.progress}%; background: linear-gradient(90deg, ${getStatusColor(device.status)}, ${getStatusColor(device.status)}dd);"></div>
                    </div>
                    <span class="progress-percent">${device.progress}%</span>
                </div>
                
                ${device.speed || device.bytesSent ? `
                    <div class="progress-stats">
                        <span>速度: ${device.speed || '--'}</span>
                        <span>已发送: ${device.bytesSent || '--'} / ${device.totalBytes || '--'}</span>
                        <span>剩余: ${device.eta || '--'}</span>
                    </div>
                ` : ''}
                
                ${device.error ? `<div class="flash-error">错误: ${device.error}</div>` : ''}
            </div>
        `).join('')}
    `;
    
    if (isFinished) {
        document.getElementById('btnStartFlash').style.display = 'inline-block';
        document.getElementById('btnCancelFlash').style.display = 'none';
        stopFlashHeartbeat();
        currentFlashTaskId = null;
    }
}

async function retryFailedDevices() {
    if (!currentFlashTaskId) {
        showToast('没有活动的烧录任务', 'error');
        return;
    }
    
    try {
        const result = await API.retryFailedFlash(currentFlashTaskId, currentUser?.id);
        if (result.success) {
            showToast(`正在重试 ${result.data.retryCount} 个设备`, 'success');
            startFlashHeartbeat();
        } else {
            showToast(result.error || '重试失败', 'error');
        }
    } catch (e) {
        showToast('重试失败: ' + e.message, 'error');
    }
}

function getFriendlyStatus(status) {
    const statusMap = {
        'pending': '等待中',
        'running': '烧录中',
        'success': '成功',
        'failed': '失败',
        'cancelled': '已取消',
        'partial': '部分成功',
        'retrying': '重试中'
    };
    return statusMap[status] || status;
}

function getStatusColor(status) {
    const colorMap = {
        'pending': '#ffc107',
        'running': '#007bff',
        'success': '#28a745',
        'failed': '#dc3545',
        'cancelled': '#6c757d',
        'partial': '#fd7e14',
        'retrying': '#ff8c00'
    };
    return colorMap[status] || '#6c757d';
}

async function loadDebugPage() {
    await loadDebugPorts();
    
    document.getElementById('btnConnectPort').addEventListener('click', connectPort);
    document.getElementById('btnDisconnectPort').addEventListener('click', disconnectPort);
    document.getElementById('btnSendData').addEventListener('click', sendDebugData);
    document.getElementById('btnClearLog').addEventListener('click', clearDebugLog);
    
    loadDebugLogs();
}

async function loadDebugPorts() {
    const result = await API.scanPorts();
    
    if (result.success) {
        const select = document.getElementById('debugPortSelect');
        select.innerHTML = '<option value="">请选择串口</option>' + 
            result.data.map(p => `
                <option value="${p.path}">${p.path} (${p.manufacturer || '未知'})</option>
            `).join('');
    }
}

async function connectPort() {
    const port = document.getElementById('debugPortSelect').value;
    const baudRate = parseInt(document.getElementById('debugBaudRate').value);
    
    if (!port) {
        showToast('请选择串口', 'error');
        return;
    }
    
    const result = await API.connectPort(port, baudRate);
    
    if (result.success) {
        isPortConnected = true;
        currentDebugPort = port;
        document.getElementById('btnConnectPort').style.display = 'none';
        document.getElementById('btnDisconnectPort').style.display = 'inline-block';
        showToast('串口已连接', 'success');
    } else {
        showToast(result.error, 'error');
    }
}

async function disconnectPort() {
    if (!currentDebugPort) return;
    
    const result = await API.disconnectPort(currentDebugPort);
    
    if (result.success) {
        isPortConnected = false;
        currentDebugPort = null;
        document.getElementById('btnConnectPort').style.display = 'inline-block';
        document.getElementById('btnDisconnectPort').style.display = 'none';
        showToast('串口已断开', 'success');
    }
}

async function sendDebugData() {
    if (!isPortConnected || !currentDebugPort) {
        showToast('请先连接串口', 'error');
        return;
    }
    
    const data = document.getElementById('debugSendData').value;
    
    if (!data) {
        showToast('请输入要发送的数据', 'error');
        return;
    }
    
    const result = await API.sendData(currentDebugPort, data);
    
    if (result.success) {
        document.getElementById('debugSendData').value = '';
        addDebugLog('tx', data);
    } else {
        showToast(result.error, 'error');
    }
}

async function loadDebugLogs() {
    const result = await API.getDebugLogs(1, 50);
    
    if (result.success) {
        const container = document.getElementById('debugLogContainer');
        container.innerHTML = result.data.list
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map(log => `
                <div class="log-entry log-${log.direction}">
                    <span class="log-time">${formatTime(log.created_at)}</span>
                    [${log.direction.toUpperCase()}] ${escapeHtml(log.data)}
                </div>
            `).join('');
        
        container.scrollTop = container.scrollHeight;
    }
}

function addDebugLog(direction, data) {
    const container = document.getElementById('debugLogContainer');
    const time = new Date().toLocaleTimeString();
    
    container.innerHTML += `
        <div class="log-entry log-${direction}">
            <span class="log-time">${time}</span>
            [${direction.toUpperCase()}] ${escapeHtml(data)}
        </div>
    `;
    
    container.scrollTop = container.scrollHeight;
}

async function clearDebugLog() {
    await API.clearDebugLogs();
    document.getElementById('debugLogContainer').innerHTML = '';
}

async function loadHistory() {
    const result = await API.getFlashHistory(1, 50);
    
    if (result.success) {
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = result.data.list.map(task => `
            <tr>
                <td>${task.task_id.substring(0, 8)}...</td>
                <td>${task.file_name || '-'}</td>
                <td>${task.version || '-'}</td>
                <td>${task.device_count}</td>
                <td>${task.success_count}</td>
                <td>${task.failed_count}</td>
                <td><span class="status-badge status-${task.status}">${task.status}</span></td>
                <td>${formatDate(task.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="showTaskDetails('${task.task_id}')">详情</button>
                </td>
            </tr>
        `).join('');
    }
}

async function showTaskDetails(taskId) {
    const result = await API.getFlashRecords(taskId);
    
    if (result.success) {
        alert(`任务 ${taskId} 的烧录记录:\n` + 
            result.data.map(r => 
                `${r.port_name}: ${r.status} (${r.progress}%)${r.error_message ? ' - ' + r.error_message : ''}`
            ).join('\n')
        );
    }
}

async function loadLogs() {
    const result = await API.getOperationLogs(1, 100);
    
    if (result.success) {
        const tbody = document.getElementById('logsTableBody');
        tbody.innerHTML = result.data.list.map(log => `
            <tr>
                <td>${formatDateTime(log.created_at)}</td>
                <td>${log.username || '-'}</td>
                <td>${log.module}</td>
                <td>${log.action}</td>
                <td>${log.details || '-'}</td>
            </tr>
        `).join('');
    }
}

async function loadUsers() {
    const result = await API.getUsers();
    
    if (result.success) {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = result.data.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.real_name || '-'}</td>
                <td>${user.role === 'admin' ? '管理员' : '操作员'}</td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    ${user.id !== 1 ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">删除</button>
                    ` : '-'}
                </td>
            </tr>
        `).join('');
    }
}

async function deleteUser(id) {
    if (confirm('确定要删除此用户吗？')) {
        const result = await API.deleteUser(id);
        if (result.success) {
            showToast('删除成功', 'success');
            loadUsers();
        } else {
            showToast(result.error, 'error');
        }
    }
}

function initModals() {
    document.getElementById('btnUploadFirmware').addEventListener('click', () => {
        openModal('uploadFirmwareModal');
    });
    
    document.getElementById('btnConfirmUpload').addEventListener('click', async () => {
        const fileInput = document.getElementById('firmwareFile');
        const description = document.getElementById('firmwareDescription').value;
        
        if (!fileInput.files[0]) {
            showToast('请选择固件文件', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('firmware', fileInput.files[0]);
        formData.append('description', description);
        if (currentUser) {
            formData.append('uploaderId', currentUser.id);
        }
        
        const result = await API.uploadFirmware(formData);
        
        if (result.success) {
            showToast('上传成功', 'success');
            closeModal('uploadFirmwareModal');
            fileInput.value = '';
            document.getElementById('firmwareDescription').value = '';
            loadFirmwareList();
        } else {
            showToast(result.error, 'error');
        }
    });
    
    document.getElementById('btnAddUser').addEventListener('click', () => {
        openModal('addUserModal');
    });
    
    document.getElementById('btnConfirmAddUser').addEventListener('click', async () => {
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const realName = document.getElementById('newRealName').value;
        const role = document.getElementById('newRole').value;
        
        if (!username || !password) {
            showToast('请填写用户名和密码', 'error');
            return;
        }
        
        const result = await API.createUser({
            username,
            password,
            realName,
            role,
            operatorId: currentUser?.id
        });
        
        if (result.success) {
            showToast('添加成功', 'success');
            closeModal('addUserModal');
            document.getElementById('newUsername').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newRealName').value = '';
            loadUsers();
        } else {
            showToast(result.error, 'error');
        }
    });
}

function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
