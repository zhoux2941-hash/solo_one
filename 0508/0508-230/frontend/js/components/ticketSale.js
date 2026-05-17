let saleCurrentPage = 1;
let saleKeyword = '';

function loadTicketSalePage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">售票管理</div>
                <button class="btn btn-primary" onclick="showSaleModal()">+ 售票登记</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="saleKeyword" placeholder="票据编码/购票人">
                </div>
                <div class="filter-item">
                    <label class="filter-label">状态</label>
                    <select class="filter-input" id="saleStatusFilter">
                        <option value="">全部</option>
                        <option value="未使用">未使用</option>
                        <option value="已使用">已使用</option>
                        <option value="已过期">已过期</option>
                        <option value="已作废">已作废</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="searchTicket()">搜索</button>
                <button class="btn btn-default" onclick="resetSearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>票据编码</th>
                        <th>票种类型</th>
                        <th>票价</th>
                        <th>购票人</th>
                        <th>联系电话</th>
                        <th>售票时间</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="saleTableBody"></tbody>
            </table>
            <div class="pagination" id="salePagination"></div>
        </div>

        <div class="modal" id="saleModal" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <div class="modal-title">售票登记</div>
                    <button class="modal-close" onclick="closeSaleModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="saleForm">
                        <div class="form-group">
                            <label class="form-label">选择票种 <span style="color: #f56c6c;">*</span></label>
                            <select name="ticketTypeId" id="saleTicketType" class="form-input">
                                <option value="">请选择票种</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">售票数量 <span style="color: #f56c6c;">*</span></label>
                            <input type="number" name="quantity" id="saleQuantity" class="form-input" value="1" min="1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">购票人姓名</label>
                            <input type="text" name="buyerName" id="buyerName" class="form-input" placeholder="请输入购票人姓名">
                        </div>
                        <div class="form-group">
                            <label class="form-label">联系电话</label>
                            <input type="text" name="buyerPhone" id="buyerPhone" class="form-input" placeholder="请输入联系电话">
                        </div>
                        <div class="form-group">
                            <label class="form-label">身份证号</label>
                            <input type="text" name="buyerIdCard" id="buyerIdCard" class="form-input" placeholder="请输入身份证号">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeSaleModal()">取消</button>
                    <button class="btn btn-primary" onclick="submitSale()">确认售票</button>
                </div>
            </div>
        </div>
    `;

    loadTicketList();
}

function loadTicketTypeOptions() {
    Request.get('/api/ticket-type/active').then(res => {
        if (res.code === 200) {
            const select = document.getElementById('saleTicketType');
            if (select) {
                select.innerHTML = '<option value="">请选择票种</option>' + 
                    res.data.map(t => `<option value="${t.id}">${t.typeName} - ¥${t.price}</option>`).join('');
            }
        }
    });
}

function loadTicketList() {
    const status = document.getElementById('saleStatusFilter') ? document.getElementById('saleStatusFilter').value : '';
    Request.get('/api/ticket/page', {
        keyword: saleKeyword,
        status: status,
        page: saleCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const tbody = document.getElementById('saleTableBody');
            if (tbody) {
                if (!pageData.content || pageData.content.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" class="no-data">暂无数据</td></tr>';
                } else {
                    tbody.innerHTML = pageData.content.map(row => `
                        <tr>
                            <td>${row.ticketCode}</td>
                            <td>${row.ticketType ? row.ticketType.typeName : '-'}</td>
                            <td>¥${row.salePrice}</td>
                            <td>${row.buyerName || '-'}</td>
                            <td>${row.buyerPhone || '-'}</td>
                            <td>${row.saleTime ? row.saleTime.substring(0, 16) : '-'}</td>
                            <td>${getStatusLabel(row.status)}</td>
                            <td>
                                ${row.status === '未使用' ? `<button class="btn btn-danger btn-small" onclick="voidTicket(${row.id})">作废</button>` : '-'}
                            </td>
                        </tr>
                    `).join('');
                }
            }
            renderSalePagination(pageData.number + 1, pageData.totalPages);
        }
    }).catch(err => {
        console.error('加载售票列表失败:', err);
        Common.showToast('加载失败', 'error');
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

function renderSalePagination(page, totalPages) {
    const pagination = document.getElementById('salePagination');
    if (!pagination) return;
    
    if (!totalPages || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goSalePage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goSalePage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goSalePage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goSalePage(page) {
    saleCurrentPage = page;
    loadTicketList();
}

function searchTicket() {
    saleKeyword = document.getElementById('saleKeyword').value;
    saleCurrentPage = 1;
    loadTicketList();
}

function resetSearch() {
    document.getElementById('saleKeyword').value = '';
    document.getElementById('saleStatusFilter').value = '';
    saleKeyword = '';
    saleCurrentPage = 1;
    loadTicketList();
}

function showSaleModal() {
    Common.clearForm('saleForm');
    document.getElementById('saleQuantity').value = 1;
    document.getElementById('saleModal').style.display = 'flex';
    loadTicketTypeOptions();
}

function closeSaleModal() {
    document.getElementById('saleModal').style.display = 'none';
}

function submitSale() {
    const formData = Common.getFormData('saleForm');
    
    if (!formData.ticketTypeId || !formData.quantity) {
        Common.showToast('请选择票种并填写数量', 'error');
        return;
    }

    const submitData = {
        ticketTypeId: parseInt(formData.ticketTypeId),
        quantity: parseInt(formData.quantity),
        buyerName: formData.buyerName,
        buyerPhone: formData.buyerPhone,
        buyerIdCard: formData.buyerIdCard
    };

    Request.post('/api/ticket/sell', submitData).then(res => {
        if (res.code === 200) {
            Common.showToast('售票成功');
            closeSaleModal();
            loadTicketList();
        } else {
            Common.showToast(res.message || '售票失败', 'error');
        }
    }).catch(err => {
        console.error('售票错误:', err);
        Common.showToast('售票失败，请检查网络', 'error');
    });
}

function voidTicket(id) {
    Common.showConfirm('确定要作废该票据吗？', () => {
        Request.post('/api/ticket/void/' + id).then(res => {
            if (res.code === 200) {
                Common.showToast('作废成功');
                loadTicketList();
            } else {
                Common.showToast(res.message || '作废失败', 'error');
            }
        }).catch(err => {
            console.error('作废错误:', err);
            Common.showToast('作废失败，请检查网络', 'error');
        });
    });
}
