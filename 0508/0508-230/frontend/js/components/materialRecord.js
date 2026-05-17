let recordCurrentPage = 1;
let recordKeyword = '';

function loadMaterialRecordPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">物资出入库管理</div>
                <div>
                    <button class="btn btn-success" onclick="showStockInModal()">+ 入库登记</button>
                    <button class="btn btn-warning" onclick="showStockOutModal()" style="margin-left: 10px;">+ 出库登记</button>
                    <button class="btn btn-danger" onclick="showStockLossModal()" style="margin-left: 10px;">+ 损耗登记</button>
                </div>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="recordKeyword" placeholder="记录编码/物资名称">
                </div>
                <div class="filter-item">
                    <label class="filter-label">类型</label>
                    <select class="filter-input" id="recordTypeFilter">
                        <option value="">全部</option>
                        <option value="入库">入库</option>
                        <option value="出库">出库</option>
                        <option value="损耗">损耗</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="searchRecord()">搜索</button>
                <button class="btn btn-default" onclick="resetRecordSearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>记录编码</th>
                        <th>物资名称</th>
                        <th>类型</th>
                        <th>数量</th>
                        <th>单价</th>
                        <th>总金额</th>
                        <th>供应商/接收人</th>
                        <th>原因</th>
                        <th>操作时间</th>
                    </tr>
                </thead>
                <tbody id="recordTableBody"></tbody>
            </table>
            <div class="pagination" id="recordPagination"></div>
        </div>

        <div class="modal" id="stockInModal" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <div class="modal-title">入库登记</div>
                    <button class="modal-close" onclick="closeStockInModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="stockInForm">
                        <div class="form-group">
                            <label class="form-label">选择物资 <span style="color: #f56c6c;">*</span></label>
                            <select name="materialId" id="stockInMaterialId" class="form-input">
                                <option value="">请选择物资</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">入库数量 <span style="color: #f56c6c;">*</span></label>
                                <input type="number" name="quantity" class="form-input" min="1" placeholder="请输入入库数量">
                            </div>
                            <div class="form-group">
                                <label class="form-label">单价（元）</label>
                                <input type="number" name="unitPrice" class="form-input" step="0.01" placeholder="请输入单价">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">供应商</label>
                            <input type="text" name="supplier" class="form-input" placeholder="请输入供应商">
                        </div>
                        <div class="form-group">
                            <label class="form-label">入库原因</label>
                            <input type="text" name="reason" class="form-input" placeholder="请输入入库原因">
                        </div>
                        <div class="form-group">
                            <label class="form-label">备注</label>
                            <textarea name="remark" class="form-input" rows="2" placeholder="请输入备注"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeStockInModal()">取消</button>
                    <button class="btn btn-primary" onclick="submitStockIn()">确认入库</button>
                </div>
            </div>
        </div>

        <div class="modal" id="stockOutModal" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <div class="modal-title">出库登记</div>
                    <button class="modal-close" onclick="closeStockOutModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="stockOutForm">
                        <div class="form-group">
                            <label class="form-label">选择物资 <span style="color: #f56c6c;">*</span></label>
                            <select name="materialId" id="stockOutMaterialId" class="form-input">
                                <option value="">请选择物资</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">出库数量 <span style="color: #f56c6c;">*</span></label>
                            <input type="number" name="quantity" class="form-input" min="1" placeholder="请输入出库数量">
                        </div>
                        <div class="form-group">
                            <label class="form-label">接收人</label>
                            <input type="text" name="receiver" class="form-input" placeholder="请输入接收人">
                        </div>
                        <div class="form-group">
                            <label class="form-label">出库原因</label>
                            <input type="text" name="reason" class="form-input" placeholder="请输入出库原因">
                        </div>
                        <div class="form-group">
                            <label class="form-label">备注</label>
                            <textarea name="remark" class="form-input" rows="2" placeholder="请输入备注"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeStockOutModal()">取消</button>
                    <button class="btn btn-primary" onclick="submitStockOut()">确认出库</button>
                </div>
            </div>
        </div>

        <div class="modal" id="stockLossModal" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <div class="modal-title">损耗登记</div>
                    <button class="modal-close" onclick="closeStockLossModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="stockLossForm">
                        <div class="form-group">
                            <label class="form-label">选择物资 <span style="color: #f56c6c;">*</span></label>
                            <select name="materialId" id="stockLossMaterialId" class="form-input">
                                <option value="">请选择物资</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">损耗数量 <span style="color: #f56c6c;">*</span></label>
                            <input type="number" name="quantity" class="form-input" min="1" placeholder="请输入损耗数量">
                        </div>
                        <div class="form-group">
                            <label class="form-label">损耗原因</label>
                            <input type="text" name="reason" class="form-input" placeholder="请输入损耗原因">
                        </div>
                        <div class="form-group">
                            <label class="form-label">备注</label>
                            <textarea name="remark" class="form-input" rows="2" placeholder="请输入备注"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeStockLossModal()">取消</button>
                    <button class="btn btn-primary" onclick="submitStockLoss()">确认登记</button>
                </div>
            </div>
        </div>
    `;

    loadRecordList();
    loadMaterialOptions();
}

function loadMaterialOptions() {
    Request.get('/api/material/page', { status: '正常', size: 1000 }).then(res => {
        if (res.code === 200) {
            const options = res.data.content.map(m => 
                `<option value="${m.id}">${m.materialName} (库存: ${m.currentStock})</option>`
            ).join('');
            
            const stockInSelect = document.getElementById('stockInMaterialId');
            const stockOutSelect = document.getElementById('stockOutMaterialId');
            const stockLossSelect = document.getElementById('stockLossMaterialId');
            
            if (stockInSelect) stockInSelect.innerHTML = '<option value="">请选择物资</option>' + options;
            if (stockOutSelect) stockOutSelect.innerHTML = '<option value="">请选择物资</option>' + options;
            if (stockLossSelect) stockLossSelect.innerHTML = '<option value="">请选择物资</option>' + options;
        }
    }).catch(err => {
        console.error('加载物资列表失败:', err);
    });
}

function loadRecordList() {
    const recordType = document.getElementById('recordTypeFilter') ? document.getElementById('recordTypeFilter').value : '';
    
    Request.get('/api/material-record/page', {
        keyword: recordKeyword,
        recordType: recordType,
        page: recordCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const tbody = document.getElementById('recordTableBody');
            if (tbody) {
                if (!pageData.content || pageData.content.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" class="no-data">暂无数据</td></tr>';
                } else {
                    tbody.innerHTML = pageData.content.map(row => `
                        <tr>
                            <td>${row.recordCode}</td>
                            <td>${row.material ? row.material.materialName : '-'}</td>
                            <td>${getRecordTypeLabel(row.recordType)}</td>
                            <td>${row.quantity}</td>
                            <td>${row.unitPrice || '-'}</td>
                            <td>${row.totalAmount || '-'}</td>
                            <td>${row.supplier || row.receiver || '-'}</td>
                            <td>${row.reason || '-'}</td>
                            <td>${row.createTime ? row.createTime.substring(0, 16) : '-'}</td>
                        </tr>
                    `).join('');
                }
            }
            renderRecordPagination(pageData.number + 1, pageData.totalPages);
        }
    }).catch(err => {
        console.error('加载记录列表失败:', err);
        Common.showToast('加载失败', 'error');
    });
}

function getRecordTypeLabel(recordType) {
    switch(recordType) {
        case '入库':
            return '<span style="color: #67c23a;">入库</span>';
        case '出库':
            return '<span style="color: #e6a23c;">出库</span>';
        case '损耗':
            return '<span style="color: #f56c6c;">损耗</span>';
        default:
            return recordType;
    }
}

function renderRecordPagination(page, totalPages) {
    const pagination = document.getElementById('recordPagination');
    if (!pagination) return;
    
    if (!totalPages || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goRecordPage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goRecordPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goRecordPage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goRecordPage(page) {
    recordCurrentPage = page;
    loadRecordList();
}

function searchRecord() {
    recordKeyword = document.getElementById('recordKeyword').value;
    recordCurrentPage = 1;
    loadRecordList();
}

function resetRecordSearch() {
    document.getElementById('recordKeyword').value = '';
    document.getElementById('recordTypeFilter').value = '';
    recordKeyword = '';
    recordCurrentPage = 1;
    loadRecordList();
}

function showStockInModal() {
    Common.clearForm('stockInForm');
    document.getElementById('stockInModal').style.display = 'flex';
    loadMaterialOptions();
}

function closeStockInModal() {
    document.getElementById('stockInModal').style.display = 'none';
}

function submitStockIn() {
    const formData = Common.getFormData('stockInForm');

    if (!formData.materialId) {
        Common.showToast('请选择物资', 'error');
        return;
    }
    if (!formData.quantity) {
        Common.showToast('请输入入库数量', 'error');
        return;
    }

    const submitData = {
        materialId: parseInt(formData.materialId),
        quantity: parseInt(formData.quantity),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        supplier: formData.supplier,
        reason: formData.reason,
        remark: formData.remark
    };

    Request.post('/api/material-record/stock-in', submitData).then(res => {
        if (res.code === 200) {
            Common.showToast('入库成功');
            closeStockInModal();
            loadRecordList();
        } else {
            Common.showToast(res.message || '入库失败', 'error');
        }
    }).catch(err => {
        console.error('入库失败:', err);
        Common.showToast('入库失败，请检查网络', 'error');
    });
}

function showStockOutModal() {
    Common.clearForm('stockOutForm');
    document.getElementById('stockOutModal').style.display = 'flex';
    loadMaterialOptions();
}

function closeStockOutModal() {
    document.getElementById('stockOutModal').style.display = 'none';
}

function submitStockOut() {
    const formData = Common.getFormData('stockOutForm');

    if (!formData.materialId) {
        Common.showToast('请选择物资', 'error');
        return;
    }
    if (!formData.quantity) {
        Common.showToast('请输入出库数量', 'error');
        return;
    }

    const submitData = {
        materialId: parseInt(formData.materialId),
        quantity: parseInt(formData.quantity),
        receiver: formData.receiver,
        reason: formData.reason,
        remark: formData.remark
    };

    Request.post('/api/material-record/stock-out', submitData).then(res => {
        if (res.code === 200) {
            Common.showToast('出库成功');
            closeStockOutModal();
            loadRecordList();
        } else {
            Common.showToast(res.message || '出库失败', 'error');
        }
    }).catch(err => {
        console.error('出库失败:', err);
        Common.showToast('出库失败，请检查网络', 'error');
    });
}

function showStockLossModal() {
    Common.clearForm('stockLossForm');
    document.getElementById('stockLossModal').style.display = 'flex';
    loadMaterialOptions();
}

function closeStockLossModal() {
    document.getElementById('stockLossModal').style.display = 'none';
}

function submitStockLoss() {
    const formData = Common.getFormData('stockLossForm');

    if (!formData.materialId) {
        Common.showToast('请选择物资', 'error');
        return;
    }
    if (!formData.quantity) {
        Common.showToast('请输入损耗数量', 'error');
        return;
    }

    const submitData = {
        materialId: parseInt(formData.materialId),
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
        remark: formData.remark
    };

    Request.post('/api/material-record/stock-loss', submitData).then(res => {
        if (res.code === 200) {
            Common.showToast('损耗登记成功');
            closeStockLossModal();
            loadRecordList();
        } else {
            Common.showToast(res.message || '登记失败', 'error');
        }
    }).catch(err => {
        console.error('登记失败:', err);
        Common.showToast('登记失败，请检查网络', 'error');
    });
}
