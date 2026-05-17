let suppliesCurrentPage = 1;
let suppliesPageSize = 10;
let suppliesTotalPages = 1;
let currentSupplyId = null;

function initSuppliesPage() {
    document.getElementById('page-supplies').innerHTML = `
        <div class="card">
            <div class="page-header">
                <h1>办公用品管理</h1>
                <button class="btn btn-primary" id="addSupplyBtn">新增用品</button>
            </div>

            <div class="stats-row" style="margin-bottom: 20px;">
                <div class="stat-card" style="padding: 15px; background: #fff3cd;">
                    <h3 id="lowStockCount">0</h3>
                    <p style="color: #856404;">库存预警</p>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>名称</th>
                            <th>分类</th>
                            <th>库存数量</th>
                            <th>最低预警线</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="suppliesTableBody"></tbody>
                </table>
            </div>

            <div class="pagination" id="suppliesPagination"></div>
        </div>

        <div class="modal-overlay hidden" id="supplyModal">
            <div class="modal">
                <div class="modal-header">
                    <h2 id="supplyModalTitle">新增用品</h2>
                    <button class="modal-close" id="closeSupplyModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="supplyForm">
                        <input type="hidden" id="supplyId">
                        <div class="form-row">
                            <label class="required">用品名称</label>
                            <input type="text" class="form-control" id="supplyName" required>
                        </div>
                        <div class="form-row">
                            <label class="required">分类</label>
                            <input type="text" class="form-control" id="supplyCategory" required>
                        </div>
                        <div class="form-row">
                            <label class="required">库存数量</label>
                            <input type="number" class="form-control" id="supplyQuantity" min="0" required>
                        </div>
                        <div class="form-row">
                            <label class="required">最低预警线</label>
                            <input type="number" class="form-control" id="supplyMinWarning" min="1" required>
                        </div>
                        <div class="form-row">
                            <label>备注</label>
                            <textarea class="form-control" id="supplyDescription" rows="3" style="resize: vertical;"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="cancelSupplyBtn">取消</button>
                    <button class="btn btn-primary" id="saveSupplyBtn">保存</button>
                </div>
            </div>
        </div>

        <div class="modal-overlay hidden" id="stockInModal">
            <div class="modal">
                <div class="modal-header">
                    <h2>入库登记</h2>
                    <button class="modal-close" id="closeStockInModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="stockInForm">
                        <div class="form-row">
                            <label>用品名称</label>
                            <input type="text" class="form-control" id="stockInSupplyName" readonly>
                        </div>
                        <div class="form-row">
                            <label>当前库存</label>
                            <input type="text" class="form-control" id="stockInCurrentQuantity" readonly>
                        </div>
                        <div class="form-row">
                            <label class="required">入库数量</label>
                            <input type="number" class="form-control" id="stockInQuantity" min="1" required>
                        </div>
                        <div class="form-row">
                            <label>备注</label>
                            <textarea class="form-control" id="stockInRemark" rows="3" style="resize: vertical;"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="cancelStockInBtn">取消</button>
                    <button class="btn btn-primary" id="confirmStockInBtn">确认入库</button>
                </div>
            </div>
        </div>

        <div class="modal-overlay hidden" id="stockOutModal">
            <div class="modal">
                <div class="modal-header">
                    <h2>出库登记</h2>
                    <button class="modal-close" id="closeStockOutModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="stockOutForm">
                        <div class="form-row">
                            <label>用品名称</label>
                            <input type="text" class="form-control" id="stockOutSupplyName" readonly>
                        </div>
                        <div class="form-row">
                            <label>当前库存</label>
                            <input type="text" class="form-control" id="stockOutCurrentQuantity" readonly>
                        </div>
                        <div class="form-row">
                            <label class="required">出库数量</label>
                            <input type="number" class="form-control" id="stockOutQuantity" min="1" required>
                        </div>
                        <div class="form-row">
                            <label>备注</label>
                            <textarea class="form-control" id="stockOutRemark" rows="3" style="resize: vertical;"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="cancelStockOutBtn">取消</button>
                    <button class="btn btn-primary" id="confirmStockOutBtn">确认出库</button>
                </div>
            </div>
        </div>

        <div class="modal-overlay hidden" id="supplyRecordModal">
            <div class="modal" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>出入库记录</h2>
                    <button class="modal-close" id="closeSupplyRecordModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>类型</th>
                                    <th>数量</th>
                                    <th>操作人</th>
                                    <th>操作时间</th>
                                    <th>备注</th>
                                </tr>
                            </thead>
                            <tbody id="supplyRecordsTableBody"></tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="closeSupplyRecordBtn">关闭</button>
                </div>
            </div>
        </div>
    `;

    bindSuppliesEvents();
    loadLowStockCount();
    loadSupplies();
}

function bindSuppliesEvents() {
    document.getElementById('addSupplyBtn').addEventListener('click', () => openSupplyModal());
    document.getElementById('closeSupplyModal').addEventListener('click', () => closeSupplyModal());
    document.getElementById('cancelSupplyBtn').addEventListener('click', () => closeSupplyModal());
    document.getElementById('saveSupplyBtn').addEventListener('click', saveSupply);
    
    document.getElementById('closeStockInModal').addEventListener('click', () => closeStockInModal());
    document.getElementById('cancelStockInBtn').addEventListener('click', () => closeStockInModal());
    document.getElementById('confirmStockInBtn').addEventListener('click', confirmStockIn);
    
    document.getElementById('closeStockOutModal').addEventListener('click', () => closeStockOutModal());
    document.getElementById('cancelStockOutBtn').addEventListener('click', () => closeStockOutModal());
    document.getElementById('confirmStockOutBtn').addEventListener('click', confirmStockOut);
    
    document.getElementById('closeSupplyRecordModal').addEventListener('click', () => closeSupplyRecordModal());
    document.getElementById('closeSupplyRecordBtn').addEventListener('click', () => closeSupplyRecordModal());
}

async function loadLowStockCount() {
    try {
        const result = await api.supply.lowStockCount();
        document.getElementById('lowStockCount').textContent = result.data;
    } catch (error) {
        console.error('Load low stock count failed:', error);
    }
}

async function loadSupplies() {
    try {
        const params = {
            page: suppliesCurrentPage,
            size: suppliesPageSize
        };

        const result = await api.supply.list(params);
        suppliesTotalPages = result.data.totalPages;
        renderSuppliesTable(result.data.content);
        renderSuppliesPagination();
    } catch (error) {
        console.error('Load supplies failed:', error);
    }
}

function renderSuppliesTable(supplies) {
    const tbody = document.getElementById('suppliesTableBody');
    
    if (supplies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = supplies.map(supply => {
        const isLowStock = supply.quantity <= supply.minWarning;
        return `
        <tr style="${isLowStock ? 'background: #fff5f5;' : ''}">
            <td>${supply.id}</td>
            <td>${supply.name}</td>
            <td>${supply.category}</td>
            <td>
                <span style="${isLowStock ? 'color: #dc2626; font-weight: bold;' : ''}">
                    ${supply.quantity}
                </span>
            </td>
            <td>${supply.minWarning}</td>
            <td>${formatDateTime(supply.createTime)}</td>
            <td>
                <button class="btn btn-success btn-small" onclick="openStockInModal(${supply.id}, '${supply.name}', ${supply.quantity})">入库</button>
                <button class="btn btn-warning btn-small" onclick="openStockOutModal(${supply.id}, '${supply.name}', ${supply.quantity})">出库</button>
                <button class="btn btn-primary btn-small" onclick="viewSupplyRecords(${supply.id})">记录</button>
                <button class="btn btn-primary btn-small" onclick="editSupply(${supply.id})">编辑</button>
                <button class="btn btn-danger btn-small" onclick="deleteSupply(${supply.id})">删除</button>
            </td>
        </tr>
    `}).join('');
}

function renderSuppliesPagination() {
    const pagination = document.getElementById('suppliesPagination');
    pagination.innerHTML = `
        <button class="btn btn-default btn-small" onclick="goToSuppliesPage(${suppliesCurrentPage - 1})" ${suppliesCurrentPage <= 1 ? 'disabled' : ''}>上一页</button>
        <span>第 ${suppliesCurrentPage} / ${suppliesTotalPages} 页</span>
        <button class="btn btn-default btn-small" onclick="goToSuppliesPage(${suppliesCurrentPage + 1})" ${suppliesCurrentPage >= suppliesTotalPages ? 'disabled' : ''}>下一页</button>
    `;
}

function goToSuppliesPage(page) {
    if (page < 1 || page > suppliesTotalPages) return;
    suppliesCurrentPage = page;
    loadSupplies();
}

function openSupplyModal(id = null) {
    const modal = document.getElementById('supplyModal');
    const title = document.getElementById('supplyModalTitle');

    if (id) {
        title.textContent = '编辑用品';
        loadSupplyDetail(id);
    } else {
        title.textContent = '新增用品';
        document.getElementById('supplyId').value = '';
        document.getElementById('supplyName').value = '';
        document.getElementById('supplyCategory').value = '';
        document.getElementById('supplyQuantity').value = '0';
        document.getElementById('supplyMinWarning').value = '10';
        document.getElementById('supplyDescription').value = '';
    }

    modal.classList.remove('hidden');
}

function closeSupplyModal() {
    document.getElementById('supplyModal').classList.add('hidden');
}

async function loadSupplyDetail(id) {
    try {
        const result = await api.supply.get(id);
        const supply = result.data;
        document.getElementById('supplyId').value = supply.id;
        document.getElementById('supplyName').value = supply.name;
        document.getElementById('supplyCategory').value = supply.category;
        document.getElementById('supplyQuantity').value = supply.quantity;
        document.getElementById('supplyMinWarning').value = supply.minWarning;
        document.getElementById('supplyDescription').value = supply.description || '';
    } catch (error) {
        console.error('Load supply detail failed:', error);
    }
}

async function saveSupply() {
    const id = document.getElementById('supplyId').value;
    const name = document.getElementById('supplyName').value.trim();
    const category = document.getElementById('supplyCategory').value.trim();
    const quantity = parseInt(document.getElementById('supplyQuantity').value);
    const minWarning = parseInt(document.getElementById('supplyMinWarning').value);

    if (!name) {
        showToast('请输入用品名称', 'error');
        document.getElementById('supplyName').focus();
        return;
    }

    if (!category) {
        showToast('请输入分类', 'error');
        document.getElementById('supplyCategory').focus();
        return;
    }

    if (isNaN(quantity) || quantity < 0) {
        showToast('请输入有效的库存数量', 'error');
        document.getElementById('supplyQuantity').focus();
        return;
    }

    if (isNaN(minWarning) || minWarning < 1) {
        showToast('请输入有效的最低预警线', 'error');
        document.getElementById('supplyMinWarning').focus();
        return;
    }

    const data = {
        name: name,
        category: category,
        quantity: quantity,
        minWarning: minWarning,
        description: document.getElementById('supplyDescription').value.trim() || null
    };

    try {
        if (id) {
            await api.supply.update(id, data);
            showToast('更新成功', 'success');
        } else {
            await api.supply.create(data);
            showToast('创建成功', 'success');
        }
        closeSupplyModal();
        loadSupplies();
        loadLowStockCount();
    } catch (error) {
        console.error('Save supply failed:', error);
    }
}

function editSupply(id) {
    openSupplyModal(id);
}

async function deleteSupply(id) {
    if (!confirm('确定要删除该用品吗？')) return;
    
    try {
        await api.supply.delete(id);
        showToast('删除成功', 'success');
        loadSupplies();
        loadLowStockCount();
    } catch (error) {
        console.error('Delete supply failed:', error);
    }
}

function openStockInModal(id, name, currentQuantity) {
    currentSupplyId = id;
    document.getElementById('stockInSupplyName').value = name;
    document.getElementById('stockInCurrentQuantity').value = currentQuantity;
    document.getElementById('stockInQuantity').value = '';
    document.getElementById('stockInRemark').value = '';
    document.getElementById('stockInModal').classList.remove('hidden');
}

function closeStockInModal() {
    document.getElementById('stockInModal').classList.add('hidden');
    currentSupplyId = null;
}

async function confirmStockIn() {
    const quantity = parseInt(document.getElementById('stockInQuantity').value);

    if (isNaN(quantity) || quantity < 1) {
        showToast('请输入有效的入库数量', 'error');
        document.getElementById('stockInQuantity').focus();
        return;
    }

    const data = {
        supplyId: currentSupplyId,
        quantity: quantity,
        remark: document.getElementById('stockInRemark').value.trim() || null
    };

    try {
        await api.supply.stockIn(data);
        showToast('入库成功', 'success');
        closeStockInModal();
        loadSupplies();
        loadLowStockCount();
    } catch (error) {
        console.error('Stock in failed:', error);
    }
}

function openStockOutModal(id, name, currentQuantity) {
    currentSupplyId = id;
    document.getElementById('stockOutSupplyName').value = name;
    document.getElementById('stockOutCurrentQuantity').value = currentQuantity;
    document.getElementById('stockOutQuantity').value = '';
    document.getElementById('stockOutRemark').value = '';
    document.getElementById('stockOutModal').classList.remove('hidden');
}

function closeStockOutModal() {
    document.getElementById('stockOutModal').classList.add('hidden');
    currentSupplyId = null;
}

async function confirmStockOut() {
    const quantity = parseInt(document.getElementById('stockOutQuantity').value);
    const currentQuantity = parseInt(document.getElementById('stockOutCurrentQuantity').value);

    if (isNaN(quantity) || quantity < 1) {
        showToast('请输入有效的出库数量', 'error');
        document.getElementById('stockOutQuantity').focus();
        return;
    }

    if (quantity > currentQuantity) {
        showToast('出库数量不能大于当前库存', 'error');
        document.getElementById('stockOutQuantity').focus();
        return;
    }

    const data = {
        supplyId: currentSupplyId,
        quantity: quantity,
        remark: document.getElementById('stockOutRemark').value.trim() || null
    };

    try {
        await api.supply.stockOut(data);
        showToast('出库成功', 'success');
        closeStockOutModal();
        loadSupplies();
        loadLowStockCount();
    } catch (error) {
        console.error('Stock out failed:', error);
    }
}

async function viewSupplyRecords(id) {
    try {
        const result = await api.supply.records(id, { page: 1, size: 50 });
        const records = result.data.content;

        const tbody = document.getElementById('supplyRecordsTableBody');
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">暂无记录</td></tr>';
        } else {
            tbody.innerHTML = records.map(record => `
                <tr>
                    <td><span class="badge ${record.type === '入库' ? 'badge-success' : 'badge-warning'}">${record.type}</span></td>
                    <td>${record.quantity}</td>
                    <td>${record.operator ? record.operator.realName : '-'}</td>
                    <td>${formatDateTime(record.createTime)}</td>
                    <td>${record.remark || '-'}</td>
                </tr>
            `).join('');
        }

        document.getElementById('supplyRecordModal').classList.remove('hidden');
    } catch (error) {
        console.error('View supply records failed:', error);
    }
}

function closeSupplyRecordModal() {
    document.getElementById('supplyRecordModal').classList.add('hidden');
}
