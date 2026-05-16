const API_BASE = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    loadFirmwareList();
    loadUpgradeRecords();
    loadStatistics();
    initUploadForm();
});

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(this.dataset.tab).classList.add('active');

            if (this.dataset.tab === 'firmware') {
                loadFirmwareList();
            } else if (this.dataset.tab === 'upgrades') {
                loadUpgradeRecords();
            } else if (this.dataset.tab === 'statistics') {
                loadStatistics();
            }
        });
    });
}

function toggleFileInput() {
    const mockUpload = document.getElementById('mockUpload').checked;
    const fileInputGroup = document.getElementById('fileInputGroup');
    const fileInput = document.getElementById('file');
    
    if (mockUpload) {
        fileInputGroup.style.opacity = '0.5';
        fileInput.required = false;
    } else {
        fileInputGroup.style.opacity = '1';
        fileInput.required = true;
    }
}

function validateVersion(version) {
    const pattern = /^\d+\.\d+\.\d+$/;
    return pattern.test(version);
}

function showMessage(elementId, message, isSuccess) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.className = isSuccess ? 'message success' : 'message error';
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    if (isSuccess) {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}

function initUploadForm() {
    const fileInput = document.getElementById('file');
    fileInput.addEventListener('change', function() {
        document.getElementById('fileName').textContent = 
            this.files.length > 0 ? '已选择: ' + this.files[0].name : '';
    });

    document.getElementById('uploadForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const version = document.getElementById('version').value.trim();
        const deviceModel = document.getElementById('deviceModel').value;
        const description = document.getElementById('description').value;
        const file = document.getElementById('file').files[0];
        const mockUpload = document.getElementById('mockUpload').checked;

        const messageDiv = document.getElementById('uploadMessage');

        if (!version) {
            showMessage('uploadMessage', '请输入版本号！', false);
            return;
        }

        if (!validateVersion(version)) {
            showMessage('uploadMessage', '版本号格式不正确，请使用 主版本.次版本.修订号 格式（如: 1.0.0）', false);
            return;
        }

        if (!deviceModel) {
            showMessage('uploadMessage', '请选择设备型号！', false);
            return;
        }

        if (!mockUpload && !file) {
            showMessage('uploadMessage', '请选择固件文件，或勾选「模拟上传」！', false);
            return;
        }

        try {
            let response;
            if (mockUpload) {
                response = await fetch(`${API_BASE}/firmware/upload-mock`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        version,
                        deviceModel,
                        description,
                        fileName: `firmware_${version}.bin`,
                        fileSize: 1048576
                    })
                });
            } else {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('version', version);
                formData.append('deviceModel', deviceModel);
                formData.append('description', description);

                response = await fetch(`${API_BASE}/firmware/upload`, {
                    method: 'POST',
                    body: formData
                });
            }

            const data = await response.json();
            
            if (data.success) {
                showMessage('uploadMessage', '固件上传成功！', true);
                document.getElementById('uploadForm').reset();
                document.getElementById('fileName').textContent = '';
                toggleFileInput();
            } else {
                showMessage('uploadMessage', data.message || '上传失败', false);
            }
        } catch (error) {
            showMessage('uploadMessage', '上传失败: ' + error.message, false);
        }
    });
}

async function loadFirmwareList() {
    try {
        const response = await fetch(`${API_BASE}/firmware/list`);
        const firmwareList = await response.json();
        
        const tbody = document.getElementById('firmwareTableBody');
        tbody.innerHTML = firmwareList.map(fw => `
            <tr>
                <td>${fw.id}</td>
                <td><strong>${fw.version}</strong></td>
                <td>${fw.deviceModel}</td>
                <td>${fw.fileName}</td>
                <td>${fw.fileSize}</td>
                <td>${formatDate(fw.releaseTime)}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteFirmware(${fw.id})">删除</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('加载固件列表失败:', error);
    }
}

async function deleteFirmware(id) {
    if (!confirm('确定要删除此固件吗？')) return;
    
    try {
        await fetch(`${API_BASE}/firmware/${id}`, { method: 'DELETE' });
        loadFirmwareList();
    } catch (error) {
        console.error('删除失败:', error);
    }
}

async function loadUpgradeRecords() {
    try {
        const response = await fetch(`${API_BASE}/device/upgrades`);
        const upgrades = await response.json();
        
        const tbody = document.getElementById('upgradeTableBody');
        const recentUpgrades = upgrades.slice(0, 10);
        
        tbody.innerHTML = recentUpgrades.map(upgrade => `
            <tr>
                <td>${upgrade.id}</td>
                <td>${upgrade.deviceId}</td>
                <td>${upgrade.deviceModel}</td>
                <td>${upgrade.currentVersion}</td>
                <td>${upgrade.targetVersion}</td>
                <td>${getStatusBadge(upgrade.status)}</td>
                <td>${formatDate(upgrade.startTime)}</td>
                <td>${upgrade.completeTime ? formatDate(upgrade.completeTime) : '-'}</td>
            </tr>
        `).join('');
        
        if (upgrades.length > 10) {
            const moreRow = document.createElement('tr');
            moreRow.innerHTML = `
                <td colspan="8" style="text-align: center; color: #666; font-style: italic;">
                    共 ${upgrades.length} 条记录，仅显示最近 10 条
                </td>
            `;
            tbody.appendChild(moreRow);
        }
    } catch (error) {
        console.error('加载升级记录失败:', error);
    }
}

function getStatusBadge(status) {
    const badges = {
        'DOWNLOADING': '<span class="badge badge-downloading">下载中</span>',
        'SUCCESS': '<span class="badge badge-success">成功</span>',
        'FAILED': '<span class="badge badge-failed">失败</span>'
    };
    return badges[status] || status;
}

async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE}/device/statistics`);
        const stats = await response.json();
        
        const content = document.getElementById('statsContent');
        
        let successRatesHtml = '';
        if (stats.successRates) {
            successRatesHtml = Object.entries(stats.successRates).map(([model, rate]) => `
                <div class="stat-card">
                    <h3>${model} 升级成功率</h3>
                    <div class="value">${rate.toFixed(1)}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${rate}%"></div>
                    </div>
                </div>
            `).join('');
        }

        let versionDistHtml = '';
        if (stats.versionDistribution) {
            const maxCount = Math.max(...Object.values(stats.versionDistribution), 1);
            versionDistHtml = `
                <div style="margin-top: 30px;">
                    <h3 style="margin-bottom: 20px;">升级版本分布</h3>
                    ${Object.entries(stats.versionDistribution).map(([version, count]) => `
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span><strong>${version}</strong></span>
                                <span>${count} 台设备</span>
                            </div>
                            <div class="version-bar">
                                <div class="version-fill" style="width: ${(count / maxCount) * 100}%"></div>
                                <span class="version-label">${version}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        content.innerHTML = `
            <div class="stats-grid">
                ${successRatesHtml}
            </div>
            ${versionDistHtml}
        `;
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

let currentUpgradeId = null;

async function checkUpgrade() {
    const deviceId = document.getElementById('simDeviceId').value.trim();
    const deviceModel = document.getElementById('simDeviceModel').value;
    const currentVersion = document.getElementById('simCurrentVersion').value.trim();
    const resultDiv = document.getElementById('simResult');

    if (!deviceId) {
        showMessage('simMessage', '请输入设备ID！', false);
        return;
    }

    if (!deviceModel) {
        showMessage('simMessage', '请选择设备型号！', false);
        return;
    }

    if (!currentVersion) {
        showMessage('simMessage', '请输入当前版本！', false);
        return;
    }

    if (!validateVersion(currentVersion)) {
        showMessage('simMessage', '版本号格式不正确，请使用 主版本.次版本.修订号 格式（如: 1.0.0）', false);
        return;
    }

    document.getElementById('simMessage').style.display = 'none';
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p>正在检查更新...</p>';

    try {
        const response = await fetch(`${API_BASE}/device/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId, deviceModel, currentVersion })
        });

        const data = await response.json();
        
        if (data.upgradeAvailable) {
            currentUpgradeId = data.upgradeId;
            resultDiv.innerHTML = `
                <h3 style="color: #667eea; margin-bottom: 15px;">✨ 发现新版本！</h3>
                <p><strong>版本号:</strong> ${data.version}</p>
                <p><strong>描述:</strong> ${data.description || '无'}</p>
                <p><strong>文件大小:</strong> ${data.fileSize}</p>
                <p><strong>发布时间:</strong> ${formatDate(data.releaseTime)}</p>
                <p style="margin-top: 15px;">
                    <button class="btn btn-primary" onclick="simulateDownload()">模拟下载并升级</button>
                    <button class="btn btn-danger" style="margin-left: 10px; background: #e74c3c;" onclick="simulateFailed()">模拟失败</button>
                </p>
            `;
        } else {
            resultDiv.innerHTML = `
                <h3 style="color: #28a745; margin-bottom: 15px;">✅ 当前已是最新版本</h3>
                <p>设备ID: ${deviceId}</p>
                <p>设备型号: ${deviceModel}</p>
                <p>当前版本: ${currentVersion}</p>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <h3 style="color: #e74c3c;">检查失败</h3>
            <p>${error.message}</p>
        `;
    }
}

async function simulateDownload() {
    const resultDiv = document.getElementById('simResult');
    resultDiv.innerHTML = '<p>正在下载固件...</p><p>(模拟下载中，请稍候...)</p>';

    setTimeout(async () => {
        try {
            const response = await fetch(`${API_BASE}/device/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    upgradeId: currentUpgradeId,
                    success: true,
                    failureReason: ''
                })
            });

            const data = await response.json();
            
            if (data.success) {
                resultDiv.innerHTML = `
                    <h3 style="color: #28a745; margin-bottom: 15px;">🎉 升级成功！</h3>
                    <p>固件已成功下载并安装</p>
                    <p>设备已升级到最新版本</p>
                `;
            }
        } catch (error) {
            resultDiv.innerHTML = `<p style="color: #e74c3c;">上报失败: ${error.message}</p>`;
        }
    }, 2000);
}

async function simulateFailed() {
    const resultDiv = document.getElementById('simResult');

    try {
        const response = await fetch(`${API_BASE}/device/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                upgradeId: currentUpgradeId,
                success: false,
                failureReason: '下载校验失败'
            })
        });

        const data = await response.json();
        
        if (data.success) {
            resultDiv.innerHTML = `
                <h3 style="color: #e74c3c; margin-bottom: 15px;">❌ 升级失败</h3>
                <p>原因: 下载校验失败</p>
                <p>设备将保持当前版本</p>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #e74c3c;">上报失败: ${error.message}</p>`;
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
