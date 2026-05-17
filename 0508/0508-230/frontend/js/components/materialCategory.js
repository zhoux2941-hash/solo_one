let categoryKeyword = '';

function loadMaterialCategoryPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">物资类别管理</div>
                <button class="btn btn-primary" onclick="showCategoryModal()">+ 新增类别</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="categoryKeyword" placeholder="类别编码/名称">
                </div>
                <div class="filter-item">
                    <label class="filter-label">状态</label>
                    <select class="filter-input" id="categoryStatusFilter">
                        <option value="">全部</option>
                        <option value="启用">启用</option>
                        <option value="停用">停用</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="searchCategory()">搜索</button>
                <button class="btn btn-default" onclick="resetCategorySearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>类别编码</th>
                        <th>类别名称</th>
                        <th>描述</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="categoryTableBody"></tbody>
            </table>
        </div>

        <div class="modal" id="categoryModal" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <div class="modal-title" id="categoryModalTitle">新增类别</div>
                    <button class="modal-close" onclick="closeCategoryModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="categoryForm">
                        <input type="hidden" id="categoryId">
                        <div class="form-group">
                            <label class="form-label">类别名称 <span style="color: #f56c6c;">*</span></label>
                            <input type="text" name="categoryName" class="form-input" placeholder="请输入类别名称">
                        </div>
                        <div class="form-group">
                            <label class="form-label">描述</label>
                            <textarea name="description" class="form-input" rows="3" placeholder="请输入描述"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <select name="status" class="form-input">
                                <option value="启用">启用</option>
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
                    <button class="btn btn-default" onclick="closeCategoryModal()">取消</button>
                    <button class="btn btn-primary" onclick="submitCategory()">保存</button>
                </div>
            </div>
        </div>
    `;

    loadCategoryList();
}

function loadCategoryList() {
    const status = document.getElementById('categoryStatusFilter') ? document.getElementById('categoryStatusFilter').value : '';
    
    Request.get('/api/material-category/list', {
        keyword: categoryKeyword,
        status: status
    }).then(res => {
        if (res.code === 200) {
            const tbody = document.getElementById('categoryTableBody');
            if (tbody) {
                if (!res.data || res.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="no-data">暂无数据</td></tr>';
                } else {
                    tbody.innerHTML = res.data.map(row => `
                        <tr>
                            <td>${row.categoryCode}</td>
                            <td>${row.categoryName}</td>
                            <td>${row.description || '-'}</td>
                            <td>${getCategoryStatusLabel(row.status)}</td>
                            <td>
                                <button class="btn btn-primary btn-small" onclick="editCategory(${row.id})">编辑</button>
                                <button class="btn btn-danger btn-small" onclick="deleteCategory(${row.id})">删除</button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
        }
    }).catch(err => {
        console.error('加载类别列表失败:', err);
        Common.showToast('加载失败', 'error');
    });
}

function getCategoryStatusLabel(status) {
    switch(status) {
        case '启用':
            return '<span style="color: #67c23a;">启用</span>';
        case '停用':
            return '<span style="color: #f56c6c;">停用</span>';
        default:
            return status;
    }
}

function searchCategory() {
    categoryKeyword = document.getElementById('categoryKeyword').value;
    loadCategoryList();
}

function resetCategorySearch() {
    document.getElementById('categoryKeyword').value = '';
    document.getElementById('categoryStatusFilter').value = '';
    categoryKeyword = '';
    loadCategoryList();
}

function showCategoryModal() {
    document.getElementById('categoryModalTitle').textContent = '新增类别';
    document.getElementById('categoryId').value = '';
    Common.clearForm('categoryForm');
    document.getElementById('categoryModal').style.display = 'flex';
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

function editCategory(id) {
    Request.get('/api/material-category/' + id).then(res => {
        if (res.code === 200) {
            const data = res.data;
            document.getElementById('categoryModalTitle').textContent = '编辑类别';
            document.getElementById('categoryId').value = data.id;
            Common.setFormData('categoryForm', data);
            document.getElementById('categoryModal').style.display = 'flex';
        }
    }).catch(err => {
        console.error('获取类别信息失败:', err);
        Common.showToast('获取信息失败', 'error');
    });
}

function submitCategory() {
    const formData = Common.getFormData('categoryForm');
    const categoryId = document.getElementById('categoryId').value;

    if (!formData.categoryName) {
        Common.showToast('请输入类别名称', 'error');
        return;
    }

    const submitData = {
        categoryName: formData.categoryName,
        description: formData.description,
        status: formData.status,
        remark: formData.remark
    };

    const promise = categoryId ? 
        Request.put('/api/material-category/' + categoryId, submitData) : 
        Request.post('/api/material-category', submitData);

    promise.then(res => {
        if (res.code === 200) {
            Common.showToast(categoryId ? '更新成功' : '创建成功');
            closeCategoryModal();
            loadCategoryList();
        } else {
            Common.showToast(res.message || '操作失败', 'error');
        }
    }).catch(err => {
        console.error('提交失败:', err);
        Common.showToast('操作失败，请检查网络', 'error');
    });
}

function deleteCategory(id) {
    Common.showConfirm('确定要删除该类别吗？', () => {
        Request.delete('/api/material-category/' + id).then(res => {
            if (res.code === 200) {
                Common.showToast('删除成功');
                loadCategoryList();
            } else {
                Common.showToast(res.message || '删除失败', 'error');
            }
        }).catch(err => {
            console.error('删除失败:', err);
            Common.showToast('删除失败，请检查网络', 'error');
        });
    });
}
