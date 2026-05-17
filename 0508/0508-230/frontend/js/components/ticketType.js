let ttCurrentPage = 1;
let ttKeyword = '';
let ttCategory = '';
let ttStatus = '';
let selectedResourceIds = [];

const ticketCategories = [
    { value: '单人票', label: '单人票' },
    { value: '团体票', label: '团体票' },
    { value: '联票', label: '联票' },
    { value: '年卡', label: '年卡' },
    { value: '体验券', label: '体验券' }
];

function loadTicketTypePage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">票种管理</div>
                <button class="btn btn-primary" onclick="showTicketTypeModal()">+ 新增票种</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="ttKeyword" placeholder="票种名称/编码">
                </div>
                <div class="filter-item">
                    <label class="filter-label">票种类型</label>
                    <select class="filter-input" id="ttCategoryFilter">
                        <option value="">全部</option>
                        ${ticketCategories.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-item">
                    <label class="filter-label">状态</label>
                    <select class="filter-input" id="ttStatusFilter">
                        <option value="">全部</option>
                        <option value="启用">启用</option>
                        <option value="停用">停用</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="searchTicketType()">搜索</button>
                <button class="btn btn-default" onclick="resetTicketTypeSearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>票种编码</th>
                        <th>票种名称</th>
                        <th>票种类型</th>
                        <th>票价</th>
                        <th>有效期(天)</th>
                        <th>已售数量</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="ttTableBody"></tbody>
            </table>
            <div class="pagination" id="ttPagination"></div>
        </div>

        <div class="modal" id="ttModal" style="display: none;">
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <div class="modal-title" id="ttModalTitle">新增票种</div>
                    <button class="modal-close" onclick="closeTicketTypeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="ttForm">
                        <input type="hidden" name="id" id="ttId">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">票种编码 <span style="color: #f56c6c;">*</span></label>
                                <input type="text" name="typeCode" id="typeCode" class="form-input" placeholder="请输入票种编码">
                            </div>
                            <div class="form-group">
                                <label class="form-label">票种名称 <span style="color: #f56c6c;">*</span></label>
                                <input type="text" name="typeName" id="typeName" class="form-input" placeholder="请输入票种名称">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">票种类型 <span style="color: #f56c6c;">*</span></label>
                                <select name="ticketCategory" id="ticketCategory" class="form-input">
                                    <option value="">请选择</option>
                                    ${ticketCategories.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">票价（元） <span style="color: #f56c6c;">*</span></label>
                                <input type="number" step="0.01" name="price" id="price" class="form-input" placeholder="请输入票价">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">原价（元）</label>
                                <input type="number" step="0.01" name="originalPrice" id="originalPrice" class="form-input" placeholder="请输入原价">
                            </div>
                            <div class="form-group">
                                <label class="form-label">有效天数</label>
                                <input type="number" name="validDays" id="validDays" class="form-input" placeholder="请输入有效天数">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">限购数量</label>
                                <input type="number" name="maxPurchasePerPerson" id="maxPurchasePerPerson" class="form-input" placeholder="每人限购数量">
                            </div>
                            <div class="form-group">
                                <label class="form-label">库存总量</label>
                                <input type="number" name="totalInventory" id="totalInventory" class="form-input" placeholder="库存总量">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">可用游玩范围</label>
                            <div id="resourceList" style="max-height: 150px; overflow-y: auto; border: 1px solid #dcdfe6; border-radius: 4px; padding: 10px;">
                                <div style="color: #909399; text-align: center;">加载中...</div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <select name="status" id="ttStatus" class="form-input">
                                <option value="启用">启用</option>
                                <option value="停用">停用</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">描述</label>
                            <textarea name="description" id="description" class="form-input" rows="2" placeholder="请输入描述"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">使用规则</label>
                            <textarea name="useRules" id="useRules" class="form-input" rows="2" placeholder="请输入使用规则"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeTicketTypeModal()">取消</button>
                    <button class="btn btn-primary" onclick="saveTicketType()">保存</button>
                </div>
            </div>
        </div>
    `;

    loadTicketTypeList();
}

function loadResourceList() {
    Request.get('/api/resource/list').then(res => {
        if (res.code === 200) {
            const resourceList = document.getElementById('resourceList');
            if (resourceList) {
                resourceList.innerHTML = res.data.map(r => `
                    <label style="display: inline-block; margin-right: 15px; margin-bottom: 8px; cursor: pointer;">
                        <input type="checkbox" value="${r.id}" onchange="toggleResource(${r.id})" 
                            ${selectedResourceIds.includes(r.id) ? 'checked' : ''}>
                        ${r.resourceName}
                    </label>
                `).join('');
            }
        }
    });
}

function toggleResource(id) {
    const index = selectedResourceIds.indexOf(id);
    if (index > -1) {
        selectedResourceIds.splice(index, 1);
    } else {
        selectedResourceIds.push(id);
    }
}

function loadTicketTypeList() {
    Request.get('/api/ticket-type/page', {
        keyword: ttKeyword,
        ticketCategory: ttCategory,
        status: ttStatus,
        page: ttCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const tbody = document.getElementById('ttTableBody');
            if (tbody) {
                if (!pageData.content || pageData.content.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" class="no-data">暂无数据</td></tr>';
                } else {
                    tbody.innerHTML = pageData.content.map(row => `
                        <tr>
                            <td>${row.typeCode}</td>
                            <td>${row.typeName}</td>
                            <td>${row.ticketCategory}</td>
                            <td>¥${row.price}</td>
                            <td>${row.validDays || '-'}</td>
                            <td>${row.soldCount || 0}</td>
                            <td>${row.status === '启用' ? '<span style="color: #67c23a;">启用</span>' : '<span style="color: #f56c6c;">停用</span>'}</td>
                            <td>
                                <button class="btn btn-primary btn-small" onclick="editTicketType(${row.id})">编辑</button>
                                <button class="btn btn-danger btn-small" onclick="deleteTicketType(${row.id})">删除</button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
            renderTicketTypePagination(pageData.number + 1, pageData.totalPages);
        }
    }).catch(err => {
        console.error('加载票种列表失败:', err);
        Common.showToast('加载失败', 'error');
    });
}

function renderTicketTypePagination(page, totalPages) {
    const pagination = document.getElementById('ttPagination');
    if (!pagination) return;
    
    if (!totalPages || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goTTPage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goTTPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goTTPage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goTTPage(page) {
    ttCurrentPage = page;
    loadTicketTypeList();
}

function searchTicketType() {
    ttKeyword = document.getElementById('ttKeyword').value;
    ttCategory = document.getElementById('ttCategoryFilter').value;
    ttStatus = document.getElementById('ttStatusFilter').value;
    ttCurrentPage = 1;
    loadTicketTypeList();
}

function resetTicketTypeSearch() {
    document.getElementById('ttKeyword').value = '';
    document.getElementById('ttCategoryFilter').value = '';
    document.getElementById('ttStatusFilter').value = '';
    ttKeyword = '';
    ttCategory = '';
    ttStatus = '';
    ttCurrentPage = 1;
    loadTicketTypeList();
}

function showTicketTypeModal() {
    document.getElementById('ttModalTitle').textContent = '新增票种';
    Common.clearForm('ttForm');
    selectedResourceIds = [];
    document.getElementById('ttModal').style.display = 'flex';
    loadResourceList();
}

function closeTicketTypeModal() {
    document.getElementById('ttModal').style.display = 'none';
}

function editTicketType(id) {
    Request.get('/api/ticket-type/' + id).then(res => {
        if (res.code === 200) {
            document.getElementById('ttModalTitle').textContent = '编辑票种';
            const data = res.data;
            document.getElementById('ttId').value = data.id;
            document.getElementById('typeCode').value = data.typeCode;
            document.getElementById('typeName').value = data.typeName;
            document.getElementById('ticketCategory').value = data.ticketCategory;
            document.getElementById('price').value = data.price;
            document.getElementById('originalPrice').value = data.originalPrice || '';
            document.getElementById('validDays').value = data.validDays || '';
            document.getElementById('maxPurchasePerPerson').value = data.maxPurchasePerPerson || '';
            document.getElementById('totalInventory').value = data.totalInventory || '';
            document.getElementById('ttStatus').value = data.status;
            document.getElementById('description').value = data.description || '';
            document.getElementById('useRules').value = data.useRules || '';
            
            selectedResourceIds = data.availableResources ? data.availableResources.map(r => r.id) : [];
            
            document.getElementById('ttModal').style.display = 'flex';
            loadResourceList();
        }
    });
}

function saveTicketType() {
    const formData = Common.getFormData('ttForm');
    
    const submitData = {
        typeCode: formData.typeCode,
        typeName: formData.typeName,
        ticketCategory: formData.ticketCategory,
        price: formData.price,
        originalPrice: formData.originalPrice || null,
        validDays: formData.validDays ? parseInt(formData.validDays) : null,
        maxPurchasePerPerson: formData.maxPurchasePerPerson ? parseInt(formData.maxPurchasePerPerson) : null,
        totalInventory: formData.totalInventory ? parseInt(formData.totalInventory) : null,
        status: formData.status,
        description: formData.description,
        useRules: formData.useRules,
        resourceIds: selectedResourceIds
    };

    if (formData.id) {
        submitData.id = parseInt(formData.id);
    }

    if (!submitData.typeCode || !submitData.typeName || !submitData.ticketCategory || !submitData.price) {
        Common.showToast('请填写必填项', 'error');
        return;
    }

    Request.post('/api/ticket-type', submitData).then(res => {
        if (res.code === 200) {
            Common.showToast('保存成功');
            closeTicketTypeModal();
            loadTicketTypeList();
        } else {
            Common.showToast(res.message || '保存失败', 'error');
        }
    }).catch(err => {
        console.error('保存错误:', err);
        Common.showToast('保存失败，请检查网络', 'error');
    });
}

function deleteTicketType(id) {
    Common.showConfirm('确定要删除该票种吗？', () => {
        Request.delete('/api/ticket-type/' + id).then(res => {
            if (res.code === 200) {
                Common.showToast('删除成功');
                loadTicketTypeList();
            } else {
                Common.showToast(res.message || '删除失败', 'error');
            }
        }).catch(err => {
            console.error('删除错误:', err);
            Common.showToast('删除失败，请检查网络', 'error');
        });
    });
}
