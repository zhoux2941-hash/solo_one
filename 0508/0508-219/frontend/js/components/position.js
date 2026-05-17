let posCurrentPage = 1;
let posKeyword = '';

function loadPositionPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">岗位管理</div>
                <button class="btn btn-primary" onclick="showPosModal()">+ 新增岗位</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="posKeyword" placeholder="岗位名称/编码">
                </div>
                <button class="btn btn-primary" onclick="searchPos()">搜索</button>
                <button class="btn btn-default" onclick="resetPosSearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>岗位编码</th>
                        <th>岗位名称</th>
                        <th>级别</th>
                        <th>权限</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="posTableBody"></tbody>
            </table>
            <div class="pagination" id="posPagination"></div>
        </div>

        <div class="modal" id="posModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title" id="posModalTitle">新增岗位</div>
                    <button class="modal-close" onclick="closePosModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="posForm">
                        <input type="hidden" name="id" id="posId">
                        <div class="form-group">
                            <label class="form-label">岗位编码 <span style="color: #f56c6c;">*</span></label>
                            <input type="text" name="positionCode" id="positionCode" class="form-input" placeholder="请输入岗位编码">
                            <div id="positionCode_error" class="error-message"></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">岗位名称 <span style="color: #f56c6c;">*</span></label>
                            <input type="text" name="positionName" id="positionName" class="form-input" placeholder="请输入岗位名称">
                            <div id="positionName_error" class="error-message"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">级别</label>
                                <input type="number" name="level" id="level" class="form-input" value="1">
                            </div>
                            <div class="form-group">
                                <label class="form-label">状态</label>
                                <select name="status" id="posStatus" class="form-input">
                                    <option value="true">启用</option>
                                    <option value="false">禁用</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">权限描述</label>
                            <textarea name="permissions" id="permissions" class="form-input" rows="3" placeholder="请输入权限描述"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closePosModal()">取消</button>
                    <button class="btn btn-primary" onclick="savePos()">保存</button>
                </div>
            </div>
        </div>
    `;

    loadPosList();
}

function loadPosList() {
    Request.get('/api/position/page', {
        keyword: posKeyword,
        page: posCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const tbody = document.getElementById('posTableBody');
            if (tbody) {
                if (!pageData.content || pageData.content.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="no-data">暂无数据</td></tr>';
                } else {
                    tbody.innerHTML = pageData.content.map(row => `
                        <tr>
                            <td>${row.positionCode}</td>
                            <td>${row.positionName}</td>
                            <td>${row.level}</td>
                            <td>${row.permissions ? (row.permissions.length > 20 ? row.permissions.substring(0, 20) + '...' : row.permissions) : '-'}</td>
                            <td>${row.status ? '<span style="color: #67c23a;">启用</span>' : '<span style="color: #f56c6c;">禁用</span>'}</td>
                            <td>
                                <button class="btn btn-primary btn-small" onclick="editPos(${row.id})">编辑</button>
                                <button class="btn btn-danger btn-small" onclick="deletePos(${row.id})">删除</button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
            renderPosPagination(pageData.number + 1, pageData.totalPages);
        }
    }).catch(err => {
        console.error('加载岗位列表失败:', err);
        Common.showToast('加载失败', 'error');
    });
}

function renderPosPagination(page, totalPages) {
    const pagination = document.getElementById('posPagination');
    if (!pagination) return;
    
    if (!totalPages || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goPosPage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goPosPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goPosPage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goPosPage(page) {
    posCurrentPage = page;
    loadPosList();
}

function searchPos() {
    posKeyword = document.getElementById('posKeyword').value;
    posCurrentPage = 1;
    loadPosList();
}

function resetPosSearch() {
    document.getElementById('posKeyword').value = '';
    posKeyword = '';
    posCurrentPage = 1;
    loadPosList();
}

function showPosModal() {
    document.getElementById('posModalTitle').textContent = '新增岗位';
    Common.clearForm('posForm');
    document.getElementById('posModal').style.display = 'flex';
}

function closePosModal() {
    document.getElementById('posModal').style.display = 'none';
}

function editPos(id) {
    Request.get('/api/position/' + id).then(res => {
        if (res.code === 200) {
            document.getElementById('posModalTitle').textContent = '编辑岗位';
            const data = res.data;
            document.getElementById('posId').value = data.id;
            document.getElementById('positionCode').value = data.positionCode;
            document.getElementById('positionName').value = data.positionName;
            document.getElementById('level').value = data.level || 1;
            document.getElementById('posStatus').value = String(data.status);
            document.getElementById('permissions').value = data.permissions || '';
            document.getElementById('posModal').style.display = 'flex';
        }
    });
}

function savePos() {
    const formData = Common.getFormData('posForm');
    console.log('保存岗位数据:', formData);
    
    const schema = {
        positionCode: [{ rule: 'required', message: '请输入岗位编码' }],
        positionName: [{ rule: 'required', message: '请输入岗位名称' }]
    };
    
    const { isValid, errors } = Validator.validateForm(formData, schema);
    
    Validator.clearAllErrors();
    if (!isValid) {
        for (const field in errors) {
            Validator.showError(field, errors[field]);
        }
        return;
    }

    const submitData = {
        positionCode: formData.positionCode,
        positionName: formData.positionName,
        level: parseInt(formData.level) || 1,
        permissions: formData.permissions,
        status: formData.status === 'true'
    };

    if (formData.id) {
        submitData.id = parseInt(formData.id);
    }

    console.log('提交数据:', submitData);

    Request.post('/api/position', submitData).then(res => {
        console.log('保存响应:', res);
        if (res.code === 200) {
            Common.showToast('保存成功');
            closePosModal();
            loadPosList();
        } else {
            Common.showToast(res.message || '保存失败', 'error');
        }
    }).catch(err => {
        console.error('保存错误:', err);
        Common.showToast('保存失败，请检查网络', 'error');
    });
}

function deletePos(id) {
    Common.showConfirm('确定要删除该岗位吗？', () => {
        Request.delete('/api/position/' + id).then(res => {
            console.log('删除响应:', res);
            if (res.code === 200) {
                Common.showToast('删除成功');
                loadPosList();
            } else {
                Common.showToast(res.message || '删除失败', 'error');
            }
        }).catch(err => {
            console.error('删除错误:', err);
            Common.showToast('删除失败，请检查网络', 'error');
        });
    });
}
