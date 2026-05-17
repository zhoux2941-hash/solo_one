let catCurrentPage = 1;
let catKeyword = '';

function loadCategoryPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">业态分类管理</div>
                <button class="btn btn-primary" onclick="showCatModal()">+ 新增分类</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="catKeyword" placeholder="分类名称/编码">
                </div>
                <button class="btn btn-primary" onclick="searchCat()">搜索</button>
                <button class="btn btn-default" onclick="resetCatSearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>分类编码</th>
                        <th>分类名称</th>
                        <th>图标</th>
                        <th>状态</th>
                        <th>排序</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="catTableBody"></tbody>
            </table>
            <div class="pagination" id="catPagination"></div>
        </div>

        <div class="modal" id="catModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title" id="catModalTitle">新增分类</div>
                    <button class="modal-close" onclick="closeCatModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="catForm">
                        <input type="hidden" name="id" id="catId">
                        <div class="form-group">
                            <label class="form-label">分类编码 <span style="color: #f56c6c;">*</span></label>
                            <input type="text" name="categoryCode" id="categoryCode" class="form-input" placeholder="请输入分类编码">
                            <div id="categoryCode_error" class="error-message"></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">分类名称 <span style="color: #f56c6c;">*</span></label>
                            <input type="text" name="categoryName" id="categoryName" class="form-input" placeholder="请输入分类名称">
                            <div id="categoryName_error" class="error-message"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">图标</label>
                                <input type="text" name="icon" id="icon" class="form-input" placeholder="请输入图标">
                            </div>
                            <div class="form-group">
                                <label class="form-label">排序</label>
                                <input type="number" name="sortOrder" id="catSortOrder" class="form-input" value="0">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <select name="status" id="catStatus" class="form-input">
                                <option value="true">启用</option>
                                <option value="false">禁用</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeCatModal()">取消</button>
                    <button class="btn btn-primary" onclick="saveCat()">保存</button>
                </div>
            </div>
        </div>
    `;

    loadCatList();
}

function loadCatList() {
    Request.get('/api/category/page', {
        keyword: catKeyword,
        page: catCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const columns = [
                { field: 'categoryCode' },
                { field: 'categoryName' },
                { field: 'icon', render: row => row.icon || '-' },
                { field: 'status', render: row => row.status ? '<span style="color: #67c23a;">启用</span>' : '<span style="color: #f56c6c;">禁用</span>' },
                { field: 'sortOrder' },
                { 
                    render: row => `
                        <button class="btn btn-primary btn-small" onclick="editCat(${row.id})">编辑</button>
                        <button class="btn btn-danger btn-small" onclick="deleteCat(${row.id})">删除</button>
                    `
                }
            ];
            Common.renderTable('catTableBody', pageData.content, columns);
            renderCatPagination(pageData.number + 1, pageData.totalPages);
        }
    });
}

function renderCatPagination(page, totalPages) {
    const pagination = document.getElementById('catPagination');
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goCatPage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goCatPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goCatPage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goCatPage(page) {
    catCurrentPage = page;
    loadCatList();
}

function searchCat() {
    catKeyword = document.getElementById('catKeyword').value;
    catCurrentPage = 1;
    loadCatList();
}

function resetCatSearch() {
    document.getElementById('catKeyword').value = '';
    catKeyword = '';
    catCurrentPage = 1;
    loadCatList();
}

function showCatModal() {
    document.getElementById('catModalTitle').textContent = '新增分类';
    Common.clearForm('catForm');
    document.getElementById('catModal').style.display = 'flex';
}

function closeCatModal() {
    document.getElementById('catModal').style.display = 'none';
}

function editCat(id) {
    Request.get('/api/category/' + id).then(res => {
        if (res.code === 200) {
            document.getElementById('catModalTitle').textContent = '编辑分类';
            const data = res.data;
            document.getElementById('catId').value = data.id;
            document.getElementById('categoryCode').value = data.categoryCode;
            document.getElementById('categoryName').value = data.categoryName;
            document.getElementById('icon').value = data.icon || '';
            document.getElementById('catSortOrder').value = data.sortOrder || 0;
            document.getElementById('catStatus').value = String(data.status);
            document.getElementById('catModal').style.display = 'flex';
        }
    });
}

function saveCat() {
    const formData = Common.getFormData('catForm');
    
    const schema = {
        categoryCode: [{ rule: 'required', message: '请输入分类编码' }],
        categoryName: [{ rule: 'required', message: '请输入分类名称' }]
    };
    
    const { isValid, errors } = Validator.validateForm(formData, schema);
    
    Validator.clearAllErrors();
    if (!isValid) {
        for (const field in errors) {
            Validator.showError(field, errors[field]);
        }
        return;
    }

    formData.status = formData.status === 'true';
    formData.sortOrder = parseInt(formData.sortOrder) || 0;
    if (formData.id) {
        formData.id = parseInt(formData.id);
    } else {
        delete formData.id;
    }

    Request.post('/api/category', formData).then(res => {
        if (res.code === 200) {
            Common.showToast('保存成功');
            closeCatModal();
            loadCatList();
        } else {
            Common.showToast(res.message, 'error');
        }
    }).catch(err => {
        Common.showToast(err.message || '保存失败', 'error');
    });
}

function deleteCat(id) {
    Common.showConfirm('确定要删除该分类吗？', () => {
        Request.delete('/api/category/' + id).then(res => {
            if (res.code === 200) {
                Common.showToast('删除成功');
                loadCatList();
            } else {
                Common.showToast(res.message, 'error');
            }
        });
    });
}
