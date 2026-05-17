let deptCurrentPage = 1;
let deptKeyword = '';

function loadDepartmentPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">部门管理</div>
                <button class="btn btn-primary" onclick="showDeptModal()">+ 新增部门</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="deptKeyword" placeholder="部门名称/编码">
                </div>
                <button class="btn btn-primary" onclick="searchDept()">搜索</button>
                <button class="btn btn-default" onclick="resetDeptSearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>部门编码</th>
                        <th>部门名称</th>
                        <th>负责人</th>
                        <th>联系电话</th>
                        <th>状态</th>
                        <th>排序</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="deptTableBody"></tbody>
            </table>
            <div class="pagination" id="deptPagination"></div>
        </div>

        <div class="modal" id="deptModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title" id="deptModalTitle">新增部门</div>
                    <button class="modal-close" onclick="closeDeptModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="deptForm">
                        <input type="hidden" name="id" id="deptId">
                        <div class="form-group">
                            <label class="form-label">部门编码 <span style="color: #f56c6c;">*</span></label>
                            <input type="text" name="deptCode" id="deptCode" class="form-input" placeholder="请输入部门编码">
                            <div id="deptCode_error" class="error-message"></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">部门名称 <span style="color: #f56c6c;">*</span></label>
                            <input type="text" name="deptName" id="deptName" class="form-input" placeholder="请输入部门名称">
                            <div id="deptName_error" class="error-message"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">负责人</label>
                                <input type="text" name="manager" id="manager" class="form-input" placeholder="请输入负责人">
                            </div>
                            <div class="form-group">
                                <label class="form-label">联系电话</label>
                                <input type="text" name="phone" id="phone" class="form-input" placeholder="请输入联系电话">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">排序</label>
                                <input type="number" name="sortOrder" id="sortOrder" class="form-input" value="0">
                            </div>
                            <div class="form-group">
                                <label class="form-label">状态</label>
                                <select name="status" id="status" class="form-input">
                                    <option value="true">启用</option>
                                    <option value="false">禁用</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeDeptModal()">取消</button>
                    <button class="btn btn-primary" onclick="saveDept()">保存</button>
                </div>
            </div>
        </div>
    `;

    loadDeptList();
}

function loadDeptList() {
    Request.get('/api/department/page', {
        keyword: deptKeyword,
        page: deptCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const columns = [
                { field: 'deptCode' },
                { field: 'deptName' },
                { field: 'manager' },
                { field: 'phone' },
                { field: 'status', render: row => row.status ? '<span style="color: #67c23a;">启用</span>' : '<span style="color: #f56c6c;">禁用</span>' },
                { field: 'sortOrder' },
                { 
                    render: row => `
                        <button class="btn btn-primary btn-small" onclick="editDept(${row.id})">编辑</button>
                        <button class="btn btn-danger btn-small" onclick="deleteDept(${row.id})">删除</button>
                    `
                }
            ];
            const tbody = document.getElementById('deptTableBody');
            if (tbody) {
                if (!pageData.content || pageData.content.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="${columns.length}" class="no-data">暂无数据</td></tr>`;
                } else {
                    tbody.innerHTML = pageData.content.map(row => `
                        <tr>
                            ${columns.map(col => `<td>${col.render ? col.render(row) : (row[col.field] !== undefined ? row[col.field] : '')}</td>`).join('')}
                        </tr>
                    `).join('');
                }
            }
            renderDeptPagination(pageData.number + 1, pageData.totalPages);
        }
    }).catch(err => {
        console.error('加载部门列表失败:', err);
        Common.showToast('加载失败', 'error');
    });
}

function renderDeptPagination(page, totalPages) {
    const pagination = document.getElementById('deptPagination');
    if (!pagination) return;
    
    if (!totalPages || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goDeptPage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goDeptPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goDeptPage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goDeptPage(page) {
    deptCurrentPage = page;
    loadDeptList();
}

function searchDept() {
    deptKeyword = document.getElementById('deptKeyword').value;
    deptCurrentPage = 1;
    loadDeptList();
}

function resetDeptSearch() {
    document.getElementById('deptKeyword').value = '';
    deptKeyword = '';
    deptCurrentPage = 1;
    loadDeptList();
}

function showDeptModal() {
    document.getElementById('deptModalTitle').textContent = '新增部门';
    Common.clearForm('deptForm');
    document.getElementById('deptModal').style.display = 'flex';
}

function closeDeptModal() {
    document.getElementById('deptModal').style.display = 'none';
}

function editDept(id) {
    Request.get('/api/department/' + id).then(res => {
        if (res.code === 200) {
            document.getElementById('deptModalTitle').textContent = '编辑部门';
            const data = res.data;
            document.getElementById('deptId').value = data.id;
            document.getElementById('deptCode').value = data.deptCode;
            document.getElementById('deptName').value = data.deptName;
            document.getElementById('manager').value = data.manager || '';
            document.getElementById('phone').value = data.phone || '';
            document.getElementById('sortOrder').value = data.sortOrder || 0;
            document.getElementById('status').value = String(data.status);
            document.getElementById('deptModal').style.display = 'flex';
        }
    });
}

function saveDept() {
    const formData = Common.getFormData('deptForm');
    console.log('保存部门数据:', formData);
    
    const schema = {
        deptCode: [{ rule: 'required', message: '请输入部门编码' }],
        deptName: [{ rule: 'required', message: '请输入部门名称' }]
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
        deptCode: formData.deptCode,
        deptName: formData.deptName,
        manager: formData.manager,
        phone: formData.phone,
        sortOrder: parseInt(formData.sortOrder) || 0,
        status: formData.status === 'true'
    };

    if (formData.id) {
        submitData.id = parseInt(formData.id);
    }

    console.log('提交数据:', submitData);

    Request.post('/api/department', submitData).then(res => {
        console.log('保存响应:', res);
        if (res.code === 200) {
            Common.showToast('保存成功');
            closeDeptModal();
            loadDeptList();
        } else {
            Common.showToast(res.message || '保存失败', 'error');
        }
    }).catch(err => {
        console.error('保存错误:', err);
        Common.showToast('保存失败，请检查网络', 'error');
    });
}

function deleteDept(id) {
    Common.showConfirm('确定要删除该部门吗？', () => {
        Request.delete('/api/department/' + id).then(res => {
            console.log('删除响应:', res);
            if (res.code === 200) {
                Common.showToast('删除成功');
                loadDeptList();
            } else {
                Common.showToast(res.message || '删除失败', 'error');
            }
        }).catch(err => {
            console.error('删除错误:', err);
            Common.showToast('删除失败，请检查网络', 'error');
        });
    });
}
