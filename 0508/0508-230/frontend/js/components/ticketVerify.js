let verifyCurrentPage = 1;
let verifyKeyword = '';

function loadTicketVerifyPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
            <div class="card" style="margin-bottom: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff;">
                <div style="font-size: 28px; font-weight: 600;" id="todayVerifyCount">0</div>
                <div style="opacity: 0.9;">今日核销总数</div>
            </div>
            <div class="card" style="margin-bottom: 0; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #fff;">
                <div style="font-size: 28px; font-weight: 600;" id="unusedCount">0</div>
                <div style="opacity: 0.9;">未使用票据</div>
            </div>
            <div class="card" style="margin-bottom: 0; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff;">
                <div style="font-size: 28px; font-weight: 600;" id="usedCount">0</div>
                <div style="opacity: 0.9;">已使用票据</div>
            </div>
            <div class="card" style="margin-bottom: 0; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: #fff;">
                <div style="font-size: 28px; font-weight: 600;" id="verifyRate">0%</div>
                <div style="opacity: 0.9;">核销率</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">入园核销</div>
                <button class="btn btn-primary" onclick="showVerifyModal()">扫码核销</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="verifyKeyword" placeholder="票据编码/游客姓名">
                </div>
                <button class="btn btn-primary" onclick="searchVerify()">搜索</button>
                <button class="btn btn-default" onclick="resetVerifySearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>票据编码</th>
                        <th>票种类型</th>
                        <th>游客姓名</th>
                        <th>联系电话</th>
                        <th>核销时间</th>
                        <th>操作员</th>
                    </tr>
                </thead>
                <tbody id="verifyTableBody"></tbody>
            </table>
            <div class="pagination" id="verifyPagination"></div>
        </div>

        <div class="modal" id="verifyModal" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <div class="modal-title">票据核销</div>
                    <button class="modal-close" onclick="closeVerifyModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="verifyForm">
                        <div class="form-group">
                            <label class="form-label">票据编码 <span style="color: #f56c6c;">*</span></label>
                            <input type="text" name="ticketCode" id="verifyTicketCode" class="form-input" placeholder="请输入或扫描票据编码">
                        </div>
                        <div class="form-group">
                            <label class="form-label">游客姓名</label>
                            <input type="text" name="visitorName" id="visitorName" class="form-input" placeholder="请输入游客姓名">
                        </div>
                        <div class="form-group">
                            <label class="form-label">联系电话</label>
                            <input type="text" name="visitorPhone" id="visitorPhone" class="form-input" placeholder="请输入联系电话">
                        </div>
                    </form>
                    <div id="ticketInfo" style="display: none; margin-top: 15px; padding: 15px; background: #f5f7fa; border-radius: 4px;">
                        <div style="font-weight: 500; margin-bottom: 10px;">票据信息</div>
                        <div id="ticketInfoContent"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeVerifyModal()">取消</button>
                    <button class="btn btn-primary" onclick="queryTicket()">查询</button>
                    <button class="btn btn-success" onclick="submitVerify()">确认核销</button>
                </div>
            </div>
        </div>
    `;

    loadStatistics();
    loadVerifyList();
}

function loadStatistics() {
    Request.get('/api/ticket/statistics/today').then(res => {
        if (res.code === 200) {
            const data = res.data;
            document.getElementById('todayVerifyCount').textContent = data.todayVerified || 0;
            document.getElementById('unusedCount').textContent = data.totalUnused || 0;
            document.getElementById('usedCount').textContent = data.totalUsed || 0;
            const total = (data.totalUnused || 0) + (data.totalUsed || 0);
            const rate = total > 0 ? Math.round((data.totalUsed || 0) / total * 100) : 0;
            document.getElementById('verifyRate').textContent = rate + '%';
        }
    });
}

function loadVerifyList() {
    Request.get('/api/verify-record/page', {
        keyword: verifyKeyword,
        page: verifyCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const tbody = document.getElementById('verifyTableBody');
            if (tbody) {
                if (!pageData.content || pageData.content.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="no-data">暂无数据</td></tr>';
                } else {
                    tbody.innerHTML = pageData.content.map(row => `
                        <tr>
                            <td>${row.ticketCode}</td>
                            <td>${row.ticketType ? row.ticketType.typeName : '-'}</td>
                            <td>${row.visitorName || '-'}</td>
                            <td>${row.visitorPhone || '-'}</td>
                            <td>${row.createTime ? row.createTime.substring(0, 16) : '-'}</td>
                            <td>${row.operator ? row.operator.name : '-'}</td>
                        </tr>
                    `).join('');
                }
            }
            renderVerifyPagination(pageData.number + 1, pageData.totalPages);
        }
    }).catch(err => {
        console.error('加载核销记录失败:', err);
        Common.showToast('加载失败', 'error');
    });
}

function renderVerifyPagination(page, totalPages) {
    const pagination = document.getElementById('verifyPagination');
    if (!pagination) return;
    
    if (!totalPages || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goVerifyPage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goVerifyPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goVerifyPage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goVerifyPage(page) {
    verifyCurrentPage = page;
    loadVerifyList();
}

function searchVerify() {
    verifyKeyword = document.getElementById('verifyKeyword').value;
    verifyCurrentPage = 1;
    loadVerifyList();
}

function resetVerifySearch() {
    document.getElementById('verifyKeyword').value = '';
    verifyKeyword = '';
    verifyCurrentPage = 1;
    loadVerifyList();
}

function showVerifyModal() {
    Common.clearForm('verifyForm');
    document.getElementById('ticketInfo').style.display = 'none';
    document.getElementById('verifyModal').style.display = 'flex';
}

function closeVerifyModal() {
    document.getElementById('verifyModal').style.display = 'none';
}

function queryTicket() {
    const ticketCode = document.getElementById('verifyTicketCode').value;
    if (!ticketCode) {
        Common.showToast('请输入票据编码', 'error');
        return;
    }

    Request.get('/api/ticket/code/' + ticketCode).then(res => {
        if (res.code === 200) {
            const ticket = res.data;
            const ticketInfo = document.getElementById('ticketInfo');
            const ticketInfoContent = document.getElementById('ticketInfoContent');
            ticketInfo.style.display = 'block';
            ticketInfoContent.innerHTML = `
                <div style="margin-bottom: 8px;"><strong>票种：</strong>${ticket.ticketType ? ticket.ticketType.typeName : '-'}</div>
                <div style="margin-bottom: 8px;"><strong>票价：</strong>¥${ticket.salePrice}</div>
                <div style="margin-bottom: 8px;"><strong>状态：</strong>${getStatusLabel(ticket.status)}</div>
                <div style="margin-bottom: 8px;"><strong>售票时间：</strong>${ticket.saleTime ? ticket.saleTime.substring(0, 16) : '-'}</div>
                <div><strong>有效期至：</strong>${ticket.expireTime ? ticket.expireTime.substring(0, 16) : '永久有效'}</div>
            `;
        } else {
            Common.showToast(res.message || '票据不存在', 'error');
        }
    }).catch(err => {
        console.error('查询票据失败:', err);
        Common.showToast('查询失败，请检查网络', 'error');
    });
}

function submitVerify() {
    const formData = Common.getFormData('verifyForm');
    
    if (!formData.ticketCode) {
        Common.showToast('请输入票据编码', 'error');
        return;
    }

    const submitData = {
        ticketCode: formData.ticketCode,
        visitorName: formData.visitorName,
        visitorPhone: formData.visitorPhone
    };

    Request.post('/api/ticket/verify', submitData).then(res => {
        if (res.code === 200) {
            Common.showToast('核销成功');
            closeVerifyModal();
            loadStatistics();
            loadVerifyList();
        } else {
            Common.showToast(res.message || '核销失败', 'error');
        }
    }).catch(err => {
        console.error('核销错误:', err);
        Common.showToast('核销失败，请检查网络', 'error');
    });
}

function getStatusLabel(status) {
    switch(status) {
        case '未使用':
            return '<span style="color: #409eff;">未使用</span>';
        case '已使用':
            return '<span style="color: #67c23a;">已使用</span>';
        case '已过期':
            return '<span style="color: #e6a23c;">已过期</span>';
        case '已作废':
            return '<span style="color: #f56c6c;">已作废</span>';
        default:
            return status;
    }
}
