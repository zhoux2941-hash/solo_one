let materialCurrentPage = 1;
let materialKeyword = '';

function loadMaterialPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">物资库存管理</div>
                <button class="btn btn-primary" onclick="showMaterialModal()">+ 新增物资</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="materialKeyword" placeholder="物资编码/名称">
                </div>
                <div class="filter-item">
                    <label class="filter-label">状态</label>
                    <select class="filter-input" id="materialStatusFilter">
                        <option value="">全部</option>
                        <option value="正常">正常</option>
                        <option value="停用">停用</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label class="filter-label">类别</label>
                    <select class="filter-input" id="materialCategoryFilter">
                        <option value="">全部</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="searchMaterial()">搜索</button>
                <button class="btn btn-default" onclick="resetMaterialSearch()">重置</button>
            </div>
            <div id="lowStockAlert" style="display: none; background: #fef0f0; color: #f56c6c; padding: 10px 15px; margin-bottom: 15px; border-radius: 4px;">
                <strong>⚠️ 库存预警：</strong>有 <span id="lowStockCount">0</span> 种物资库存低于最低库存线，请及时补充！
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>物资编码</th>
                        <th>物资名称</th>
                        <th>类别</th>
                        <th>规格</th>
                        <th>单位</th>
                        <th>单价</th>
                        <th>当前库存</th>
                        <th>最低库存</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="materialTableBody"></tbody>
            </table>
            <div class="pagination" id="materialPagination"></div>
        </div>

        <div class="modal" id="materialModal" style="display: none;">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <div class="modal-title" id="materialModalTitle">新增物资</div>
                    <button class="modal-close" onclick="closeMaterialModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="materialForm">
                        <input type="hidden" id="materialId">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">物资名称 <span style="color: #f56c6c;">*</span></label>
                                <input type="text" name="materialName" class="form-input" placeholder="请输入物资名称">
                            </div>
                            <div class="form-group">
                                <label class="form-label">类别 <span style="color: #f56c6c;">*</span></label>
                                <select name="categoryId" id="materialCategoryId" class="form-input">
                                    <option value="">请选择类别</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">规格</label>
                                <input type="text" name="specification" class="form-input" placeholder="请输入规格">
                            </div>
                            <div class="form-group">
                                <label class="form-label">单位</label>
                                <input type="text" name="unit" class="form-input" placeholder="请输入单位">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">单价（元）</label>
                                <input type="number" name="unitPrice" class="form-input" step="0.01" placeholder="请输入单价">
                            </div>
                            <div class="form-group">
                                <label class="form-label">存放位置</label>
                                <input type="text" name="storageLocation" class="form-input" placeholder="请输入存放位置">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">最低库存</label>
                                <input type="number" name="minStock" class="form-input" value="10" placeholder="请输入最低库存">
                            </div>
                            <div class="form-group">
                                <label class="form-label">最高库存</label>
                                <input type="number" name="maxStock" class="form-input" value="1000" placeholder="请输入最高库存">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <select name="status" class="form-input">
                                <option value="正常">正常</option>
                                <option value="停用">停用</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">备注</label>
                            <textarea name="remark" class="form-input" rows="2" placeholder="请输入备注"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeMaterialModal()">取消</button>
                    <button class="btn btn-primary" onclick="submitMaterial()">保存</button>
                </div>
            </div>
        </div>
    `;

    loadMaterialList();
    loadCategoryOptions();
    checkLowStock();
}

function loadCategoryOptions() {
    Request.get('/api/material-category/list', { status: '启用' }).then(res => {
        if (res.code === 200) {
            const filterSelect = document.getElementById('materialCategoryFilter');
            const formSelect = document.getElementById('materialCategoryId');
            const options = res.data.map(c => `<option value="${c.id}">${c.categoryName}</option>`).join('');
            
            if (filterSelect) {
                const currentValue = filterSelect.value;
                filterSelect.innerHTML = '<option value="">全部</option>' + options;
                filterSelect.value = currentValue;
            }
            if (formSelect) {
                const currentValue = formSelect.value;
                formSelect.innerHTML = '<option value="">请选择类别</option>' + options;
                formSelect.value = currentValue;
            }
        }
    }).catch(err => {
        console.error('加载类别列表失败:', err);
    });
}

function checkLowStock() {
    Request.get('/api/material/low-stock/count').then(res => {
        if (res.code === 200 && res.data > 0) {
            document.getElementById('lowStockCount').textContent = res.data;
            document.getElementById('lowStockAlert').style.display = 'block';
        }
    }).catch(err => {
        console.error('检查库存预警失败:', err);
    });
}

function loadMaterialList() {
    const status = document.getElementById('materialStatusFilter') ? document.getElementById('materialStatusFilter').value : '';
    const categoryId = document.getElementById('materialCategoryFilter') ? document.getElementById('materialCategoryFilter').value : '';
    
    Request.get('/api/material/page', {
        keyword: materialKeyword,
        status: status,
        categoryId: categoryId || null,
        page: materialCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const tbody = document.getElementById('materialTableBody');
            if (tbody) {
                if (!pageData.content || pageData.content.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="10" class="no-data">暂无数据</td></tr>';
                } else {
                    tbody.innerHTML = pageData.content.map(row => `
                        <tr style="${row.currentStock <= row.minStock ? 'background: #fef0f0;' : ''}">
                            <td>${row.materialCode}</td>
                            <td>${row.materialName}</td>
                            <td>${row.category ? row.category.categoryName : '-'}</td>
                            <td>${row.specification || '-'}</td>
                            <td>${row.unit || '-'}</td>
                            <td>${row.unitPrice || '-'}</td>
                            <td style="${row.currentStock <= row.minStock ? 'color: #f56c6c; font-weight: bold;' : ''}">${row.currentStock}</td>
                            <td>${row.minStock}</td>
                            <td>${getMaterialStatusLabel(row.status)}</td>
                            <td>
                                <button class="btn btn-primary btn-small" onclick="editMaterial(${row.id})">编辑</button>
                                <button class="btn btn-danger btn-small" onclick="deleteMaterial(${row.id})">删除</button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
            renderMaterialPagination(pageData.number + 1, pageData.totalPages);
        }
    }).catch(err => {
        console.error('加载物资列表失败:', err);
        Common.showToast('加载失败', 'error');
    });
}

function getMaterialStatusLabel(status) {
    switch(status) {
        case '正常':
            return '<span style="color: #67c23a;">正常</span>';
        case '停用':
            return '<span style="color: #f56c6c;">停用</span>';
        default:
            return status;
    }
}

function renderMaterialPagination(page, totalPages) {
    const pagination = document.getElementById('materialPagination');
    if (!pagination) return;
    
    if (!totalPages || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goMaterialPage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goMaterialPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goMaterialPage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goMaterialPage(page) {
    materialCurrentPage = page;
    loadMaterialList();
}

function searchMaterial() {
    materialKeyword = document.getElementById('materialKeyword').value;
    materialCurrentPage = 1;
    loadMaterialList();
}

function resetMaterialSearch() {
    document.getElementById('materialKeyword').value = '';
    document.getElementById('materialStatusFilter').value = '';
    document.getElementById('materialCategoryFilter').value = '';
    materialKeyword = '';
    materialCurrentPage = 1;
    loadMaterialList();
}

function showMaterialModal() {
    document.getElementById('materialModalTitle').textContent = '新增物资';
    document.getElementById('materialId').value = '';
    Common.clearForm('materialForm');
    document.getElementById('materialModal').style.display = 'flex';
}

function closeMaterialModal() {
    document.getElementById('materialModal').style.display = 'none';
}

function editMaterial(id) {
    Request.get('/api/material/' + id).then(res => {
        if (res.code === 200) {
            const data = res.data;
            document.getElementById('materialModalTitle').textContent = '编辑物资';
            document.getElementById('materialId').value = data.id;
            Common.setFormData('materialForm', data);
            if (data.category) {
                document.getElementById('materialCategoryId').value = data.category.id;
            }
            document.getElementById('materialModal').style.display = 'flex';
        }
    }).catch(err => {
        console.error('获取物资信息失败:', err);
        Common.showToast('获取信息失败', 'error');
    });
}

function submitMaterial() {
    const formData = Common.getFormData('materialForm');
    const materialId = document.getElementById('materialId').value;

    if (!formData.materialName) {
        Common.showToast('请输入物资名称', 'error');
        return;
    }
    if (!formData.categoryId) {
        Common.showToast('请选择类别', 'error');
        return;
    }

    const submitData = {
        materialName: formData.materialName,
        categoryId: parseInt(formData.categoryId),
        specification: formData.specification,
        unit: formData.unit,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        minStock: formData.minStock ? parseInt(formData.minStock) : 10,
        maxStock: formData.maxStock ? parseInt(formData.maxStock) : 1000,
        storageLocation: formData.storageLocation,
        status: formData.status,
        remark: formData.remark
    };

    const promise = materialId ? 
        Request.put('/api/material/' + materialId, submitData) : 
        Request.post('/api/material', submitData);

    promise.then(res => {
        if (res.code === 200) {
            Common.showToast(materialId ? '更新成功' : '创建成功');
            closeMaterialModal();
            loadMaterialList();
            checkLowStock();
        } else {
            Common.showToast(res.message || '操作失败', 'error');
        }
    }).catch(err => {
        console.error('提交失败:', err);
        Common.showToast('操作失败，请检查网络', 'error');
    });
}

function deleteMaterial(id) {
    Common.showConfirm('确定要删除该物资吗？', () => {
        Request.delete('/api/material/' + id).then(res => {
            if (res.code === 200) {
                Common.showToast('删除成功');
                loadMaterialList();
                checkLowStock();
            } else {
                Common.showToast(res.message || '删除失败', 'error');
            }
        }).catch(err => {
            console.error('删除失败:', err);
            Common.showToast('删除失败，请检查网络', 'error');
        });
    });
}
