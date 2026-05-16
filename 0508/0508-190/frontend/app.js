const API_BASE_URL = 'http://localhost:8080/api';
const PAGE_SIZE = 10;

const paginationState = {
    assets: { page: 0, status: null },
    applications: { page: 0 },
    approval: { page: 0 },
    return: { page: 0 },
    overdue: { page: 0 }
};

const ASSET_TYPE_LABELS = {
    LAPTOP: '笔记本电脑',
    MONITOR: '显示器',
    KEYBOARD: '键盘',
    MOUSE: '鼠标',
    HEADSET: '耳机',
    DOCKING_STATION: '扩展坞',
    OTHER: '其他'
};

const ASSET_STATUS_LABELS = {
    IN_STOCK: '在库',
    ALLOCATED: '已领用',
    UNDER_REPAIR: '维修中'
};

const APPLICATION_STATUS_LABELS = {
    PENDING: '待审批',
    APPROVED: '已通过',
    REJECTED: '已拒绝'
};

document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    loadAssets();
    setupEventListeners();
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
            
            if (tabId === 'assets') loadAssets();
            if (tabId === 'applications') {
                loadAvailableAssets();
                loadApplications();
            }
            if (tabId === 'approval') loadPendingApplications();
            if (tabId === 'return') loadAllocatedAssets();
            if (tabId === 'reports') loadReports();
        });
    });
}

function setupEventListeners() {
    document.getElementById('statusFilter').addEventListener('change', loadAssets);
    document.getElementById('addAssetForm').addEventListener('submit', handleAddAsset);
    document.getElementById('applicationForm').addEventListener('submit', handleApplyAsset);
    
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('modal');
        if (e.target === modal) closeModal();
    });
}

async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        if (!response.ok) {
            const errorMessage = (data && data.message) ? data.message : (typeof data === 'string' ? data : '请求失败');
            throw new Error(errorMessage);
        }
        return data;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

function renderPagination(containerId, pageData, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { currentPage, totalPages, totalElements, pageSize } = pageData;
    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalElements);

    let html = `
        <div class="pagination-container">
            <div class="pagination-info">
                显示 ${start} - ${end} 条，共 ${totalElements} 条
            </div>
            <div class="pagination-buttons">
                <button class="pagination-btn" onclick="${onPageChange}(0)" ${currentPage === 0 ? 'disabled' : ''}>首页</button>
                <button class="pagination-btn" onclick="${onPageChange}(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>上一页</button>
    `;

    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn pagination-btn-page ${i === currentPage ? 'active' : ''}" onclick="${onPageChange}(${i})">${i + 1}</button>`;
    }

    html += `
                <button class="pagination-btn" onclick="${onPageChange}(${currentPage + 1})" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>下一页</button>
                <button class="pagination-btn" onclick="${onPageChange}(${totalPages - 1})" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>末页</button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

async function loadAssets(page = 0) {
    const statusFilter = document.getElementById('statusFilter').value;
    paginationState.assets.page = page;
    paginationState.assets.status = statusFilter || null;
    
    let url = `${API_BASE_URL}/assets/page?page=${page}&size=${PAGE_SIZE}`;
    if (statusFilter) {
        url = `${API_BASE_URL}/assets/status/${statusFilter}/page?page=${page}&size=${PAGE_SIZE}`;
    }
    
    const result = await fetchAPI(url);
    const tbody = document.querySelector('#assetsTable tbody');
    tbody.innerHTML = '';
    
    if (result.content.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📦</div>
                    <div>暂无资产数据</div>
                </td>
            </tr>
        `;
        document.getElementById('assetsPagination').innerHTML = '';
        return;
    }
    
    result.content.forEach(asset => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asset.assetNumber}</td>
            <td>${ASSET_TYPE_LABELS[asset.type] || asset.type}</td>
            <td>${asset.brand}</td>
            <td>${asset.purchaseDate || '-'}</td>
            <td><span class="status-badge status-${asset.status}">${ASSET_STATUS_LABELS[asset.status]}</span></td>
            <td>${asset.currentHolder || '-'}</td>
            <td>${asset.holderDepartment || '-'}</td>
            <td>${asset.allocateDate || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editAssetStatus(${asset.id})">修改状态</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAsset(${asset.id})">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    renderPagination('assetsPagination', result, 'changeAssetsPage');
}

function changeAssetsPage(page) {
    loadAssets(page);
}

async function handleAddAsset(e) {
    e.preventDefault();
    
    const asset = {
        assetNumber: document.getElementById('assetNumber').value,
        type: document.getElementById('assetType').value,
        brand: document.getElementById('brand').value,
        purchaseDate: document.getElementById('purchaseDate').value,
        remarks: document.getElementById('remarks').value
    };
    
    await fetchAPI(`${API_BASE_URL}/assets`, {
        method: 'POST',
        body: JSON.stringify(asset)
    });
    
    showToast('资产入库成功！');
    document.getElementById('addAssetForm').reset();
    loadAssets();
}

async function editAssetStatus(id) {
    const asset = await fetchAPI(`${API_BASE_URL}/assets/${id}`);
    
    const modalBody = document.getElementById('modalBody');
    document.getElementById('modalTitle').textContent = '修改资产状态';
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label>资产编号</label>
            <input type="text" value="${asset.assetNumber}" disabled>
        </div>
        <div class="form-group">
            <label>当前状态</label>
            <select id="newAssetStatus">
                <option value="IN_STOCK" ${asset.status === 'IN_STOCK' ? 'selected' : ''}>在库</option>
                <option value="ALLOCATED" ${asset.status === 'ALLOCATED' ? 'selected' : ''}>已领用</option>
                <option value="UNDER_REPAIR" ${asset.status === 'UNDER_REPAIR' ? 'selected' : ''}>维修中</option>
            </select>
        </div>
        <div class="modal-footer">
            <button class="btn btn-danger" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" onclick="saveAssetStatus(${id})">保存</button>
        </div>
    `;
    
    document.getElementById('modal').style.display = 'block';
}

async function saveAssetStatus(id) {
    const status = document.getElementById('newAssetStatus').value;
    
    await fetchAPI(`${API_BASE_URL}/assets/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
    
    showToast('状态修改成功！');
    closeModal();
    loadAssets();
}

async function deleteAsset(id) {
    if (!confirm('确定要删除该资产吗？')) return;
    
    await fetchAPI(`${API_BASE_URL}/assets/${id}`, {
        method: 'DELETE'
    });
    
    showToast('删除成功！');
    loadAssets();
}

async function loadAvailableAssets() {
    const inStockAssets = await fetchAPI(`${API_BASE_URL}/assets/status/IN_STOCK`);
    const select = document.getElementById('applyAsset');
    select.innerHTML = '<option value="">请选择可领用资产</option>';
    
    inStockAssets.forEach(asset => {
        const option = document.createElement('option');
        option.value = asset.id;
        option.textContent = `${asset.assetNumber} - ${ASSET_TYPE_LABELS[asset.type]} (${asset.brand})`;
        select.appendChild(option);
    });
}

async function handleApplyAsset(e) {
    e.preventDefault();
    
    const application = {
        applicantName: document.getElementById('applicantName').value,
        applicantDepartment: document.getElementById('applicantDepartment').value,
        asset: { id: parseInt(document.getElementById('applyAsset').value) },
        reason: document.getElementById('applyReason').value,
        expectedReturnDate: document.getElementById('expectedReturnDate').value || null
    };
    
    await fetchAPI(`${API_BASE_URL}/applications`, {
        method: 'POST',
        body: JSON.stringify(application)
    });
    
    showToast('申请提交成功！');
    document.getElementById('applicationForm').reset();
    loadApplications();
    loadAvailableAssets();
}

async function loadApplications(page = 0) {
    paginationState.applications.page = page;
    const result = await fetchAPI(`${API_BASE_URL}/applications/page?page=${page}&size=${PAGE_SIZE}`);
    const tbody = document.querySelector('#applicationsTable tbody');
    tbody.innerHTML = '';
    
    if (result.content.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
                    <div>暂无申请记录</div>
                </td>
            </tr>
        `;
        document.getElementById('applicationsPagination').innerHTML = '';
        return;
    }
    
    result.content.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(app.applicationTime)}</td>
            <td>${app.asset ? app.asset.assetNumber : '-'}</td>
            <td>${app.asset ? ASSET_TYPE_LABELS[app.asset.type] : '-'}</td>
            <td>${app.expectedReturnDate || '-'}</td>
            <td><span class="status-badge status-${app.status}">${APPLICATION_STATUS_LABELS[app.status]}</span></td>
            <td>${app.approver || '-'}</td>
            <td>${app.approvalTime ? formatDateTime(app.approvalTime) : '-'}</td>
        `;
        tbody.appendChild(row);
    });
    
    renderPagination('applicationsPagination', result, 'changeApplicationsPage');
}

function changeApplicationsPage(page) {
    loadApplications(page);
}

async function loadPendingApplications(page = 0) {
    paginationState.approval.page = page;
    const result = await fetchAPI(`${API_BASE_URL}/applications/status/PENDING/page?page=${page}&size=${PAGE_SIZE}`);
    const tbody = document.querySelector('#approvalTable tbody');
    tbody.innerHTML = '';
    
    if (result.content.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                    <div>暂无待审批申请</div>
                </td>
            </tr>
        `;
        document.getElementById('approvalPagination').innerHTML = '';
        return;
    }
    
    result.content.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(app.applicationTime)}</td>
            <td>${app.applicantName}</td>
            <td>${app.applicantDepartment}</td>
            <td>${app.asset ? app.asset.assetNumber : '-'}</td>
            <td>${app.asset ? ASSET_TYPE_LABELS[app.asset.type] : '-'}</td>
            <td>${app.reason || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-success" onclick="approveApplication(${app.id})">通过</button>
                    <button class="btn btn-sm btn-danger" onclick="showRejectModal(${app.id})">拒绝</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    renderPagination('approvalPagination', result, 'changeApprovalPage');
}

function changeApprovalPage(page) {
    loadPendingApplications(page);
}

async function approveApplication(id) {
    if (!confirm('确定要通过该申请吗？')) return;
    
    await fetchAPI(`${API_BASE_URL}/applications/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ approver: 'IT Admin' })
    });
    
    showToast('审批通过！');
    loadPendingApplications();
    loadAssets();
}

function showRejectModal(id) {
    const modalBody = document.getElementById('modalBody');
    document.getElementById('modalTitle').textContent = '拒绝申请';
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label>拒绝原因</label>
            <textarea id="rejectReason" rows="3" placeholder="请输入拒绝原因..."></textarea>
        </div>
        <div class="modal-footer">
            <button class="btn btn-danger" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" onclick="rejectApplication(${id})">确认拒绝</button>
        </div>
    `;
    
    document.getElementById('modal').style.display = 'block';
}

async function rejectApplication(id) {
    const reason = document.getElementById('rejectReason').value;
    
    await fetchAPI(`${API_BASE_URL}/applications/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ approver: 'IT Admin', reason })
    });
    
    showToast('已拒绝申请！');
    closeModal();
    loadPendingApplications();
}

async function loadAllocatedAssets(page = 0) {
    paginationState.return.page = page;
    const result = await fetchAPI(`${API_BASE_URL}/assets/status/ALLOCATED/page?page=${page}&size=${PAGE_SIZE}`);
    const tbody = document.querySelector('#returnTable tbody');
    tbody.innerHTML = '';
    
    if (result.content.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📦</div>
                    <div>暂无已领用的资产</div>
                    <div style="font-size: 12px; margin-top: 5px;">请先在"领用申请"页面提交申请并通过审批</div>
                </td>
            </tr>
        `;
        document.getElementById('returnPagination').innerHTML = '';
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    result.content.forEach(asset => {
        const allocateDate = parseDate(asset.allocateDate);
        allocateDate.setHours(0, 0, 0, 0);
        const daysAllocated = Math.floor((today - allocateDate) / (1000 * 60 * 60 * 24));
        const isOverdue = daysAllocated > 30;
        
        const row = document.createElement('tr');
        if (isOverdue) row.classList.add('overdue');
        
        row.innerHTML = `
            <td>${asset.assetNumber}</td>
            <td>${ASSET_TYPE_LABELS[asset.type]}</td>
            <td>${asset.brand}</td>
            <td>${asset.currentHolder}</td>
            <td>${asset.holderDepartment}</td>
            <td>${asset.allocateDate}</td>
            <td>${isOverdue ? '<span class="overdue-badge">已超期</span>' : '正常'}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="showReturnModal(${asset.id})">归还</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    renderPagination('returnPagination', result, 'changeReturnPage');
}

function changeReturnPage(page) {
    loadAllocatedAssets(page);
}

function showReturnModal(id) {
    const modalBody = document.getElementById('modalBody');
    document.getElementById('modalTitle').textContent = '资产归还';
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label>归还检查备注</label>
            <textarea id="returnRemarks" rows="3" placeholder="记录资产状态、是否有损坏等..."></textarea>
        </div>
        <div class="modal-footer">
            <button class="btn btn-danger" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" onclick="returnAsset(${id})">确认归还</button>
        </div>
    `;
    
    document.getElementById('modal').style.display = 'block';
}

async function returnAsset(id) {
    const remarks = document.getElementById('returnRemarks').value;
    
    await fetchAPI(`${API_BASE_URL}/assets/${id}/return`, {
        method: 'PUT',
        body: JSON.stringify({ remarks })
    });
    
    showToast('资产归还成功！');
    closeModal();
    loadAllocatedAssets();
    loadAssets();
}

async function loadReports() {
    const stats = await fetchAPI(`${API_BASE_URL}/assets/statistics/departments`);
    const statsTbody = document.querySelector('#departmentStatsTable tbody');
    statsTbody.innerHTML = '';
    
    Object.entries(stats).forEach(([dept, data]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dept}</td>
            <td>${data.total}</td>
            <td>${data.allocated}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="rate-bar">
                        <div class="rate-fill" style="width: ${data.rate}%;"></div>
                    </div>
                    <span>${data.rate}%</span>
                </div>
            </td>
        `;
        statsTbody.appendChild(row);
    });
    
    loadOverdueAssets();
}

async function loadOverdueAssets(page = 0) {
    paginationState.overdue.page = page;
    const result = await fetchAPI(`${API_BASE_URL}/assets/overdue/page?days=30&page=${page}&size=${PAGE_SIZE}`);
    const overdueTbody = document.querySelector('#overdueTable tbody');
    overdueTbody.innerHTML = '';
    
    if (result.content.length === 0) {
        overdueTbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                    <div>暂无超期资产</div>
                </td>
            </tr>
        `;
        document.getElementById('overduePagination').innerHTML = '';
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    result.content.forEach(asset => {
        const allocateDate = parseDate(asset.allocateDate);
        allocateDate.setHours(0, 0, 0, 0);
        const daysAllocated = Math.floor((today - allocateDate) / (1000 * 60 * 60 * 24));
        const isOverdue = daysAllocated > 30;
        
        const row = document.createElement('tr');
        if (isOverdue) row.classList.add('overdue');
        
        row.innerHTML = `
            <td>${asset.assetNumber}</td>
            <td>${ASSET_TYPE_LABELS[asset.type]}</td>
            <td>${asset.brand}</td>
            <td>${asset.currentHolder}</td>
            <td>${asset.holderDepartment}</td>
            <td>${asset.allocateDate}</td>
            <td>${daysAllocated} 天${isOverdue ? ' <span style="color:#dc3545;font-weight:bold;">(超期)</span>' : ''}</td>
        `;
        overdueTbody.appendChild(row);
    });
    
    renderPagination('overduePagination', result, 'changeOverduePage');
}

function changeOverduePage(page) {
    loadOverdueAssets(page);
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr.includes('T')) {
        return new Date(dateStr);
    }
    const parts = dateStr.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';
    const date = parseDate(dateTimeStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
