let empCurrentPage = 1;
let empKeyword = '';
let empDepartmentId = '';
let empStatus = '';

function loadEmployeePage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">员工管理</div>
                <button class="btn btn-primary" onclick="showEmpModal()">+ 新增员工</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="empKeyword" placeholder="姓名/编号/电话">
                </div>
                <div class="filter-item">
                    <label class="filter-label">所属部门</label>
                    <select class="filter-input" id="empDeptFilter">
                        <option value="">全部</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label class="filter-label">状态</label>
                    <select class="filter-input" id="empStatusFilter">
                        <option value="">全部</option>
                        <option value="在职">在职</option>
                        <option value="离职">离职</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="searchEmp()">搜索</button>
                <button class="btn btn-default" onclick="resetEmpSearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>员工编号</th>
                        <th>姓名</th>
                        <th>性别</th>
                        <th>手机号</th>
                        <th>所属部门</th>
                        <th>岗位</th>
                        <th>状态</th>
                        <th>入职日期</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="empTableBody"></tbody>
            </table>
            <div class="pagination" id="empPagination"></div>
        </div>

        <div class="modal" id="empModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title" id="empModalTitle">新增员工</div>
                    <button class="modal-close" onclick="closeEmpModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="empForm">
                        <input type="hidden" name="id" id="empId">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">员工编号 <span style="color: #f56c6c;">*</span></label>
                                <input type="text" name="empNo" id="empNo" class="form-input" placeholder="请输入员工编号">
                                <div id="empNo_error" class="error-message"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">姓名 <span style="color: #f56c6c;">*</span></label>
                                <input type="text" name="name" id="empName" class="form-input" placeholder="请输入姓名">
                                <div id="name_error" class="error-message"></div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">性别</label>
                                <select name="gender" id="gender" class="form-input">
                                    <option value="">请选择</option>
                                    <option value="男">男</option>
                                    <option value="女">女</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">手机号</label>
                                <input type="text" name="phone" id="empPhone" class="form-input" placeholder="请输入手机号">
                                <div id="phone_error" class="error-message"></div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">所属部门 <span style="color: #f56c6c;">*</span></label>
                                <select name="departmentId" id="empDepartment" class="form-input">
                                    <option value="">请选择</option>
                                </select>
                                <div id="departmentId_error" class="error-message"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">岗位 <span style="color: #f56c6c;">*</span></label>
                                <select name="positionId" id="empPosition" class="form-input">
                                    <option value="">请选择</option>
                                </select>
                                <div id="positionId_error" class="error-message"></div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">身份证号</label>
                                <input type="text" name="idCard" id="idCard" class="form-input" placeholder="请输入身份证号">
                                <div id="idCard_error" class="error-message"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">邮箱</label>
                                <input type="email" name="email" id="email" class="form-input" placeholder="请输入邮箱">
                                <div id="email_error" class="error-message"></div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">入职日期</label>
                                <input type="date" name="entryDate" id="entryDate" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">状态</label>
                                <select name="status" id="empStatus" class="form-input">
                                    <option value="在职">在职</option>
                                    <option value="离职">离职</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">管辖片区</label>
                            <input type="text" name="jurisdictionArea" id="jurisdictionArea" class="form-input" placeholder="请输入管辖片区">
                        </div>
                        <div class="form-group">
                            <label class="form-label">地址</label>
                            <input type="text" name="address" id="address" class="form-input" placeholder="请输入地址">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeEmpModal()">取消</button>
                    <button class="btn btn-primary" onclick="saveEmp()">保存</button>
                </div>
            </div>
        </div>
    `;

    loadDeptOptions();
    loadPosOptions();
    loadEmpList();
}

function loadDeptOptions() {
    Request.get('/api/department/active').then(res => {
        if (res.code === 200) {
            Common.renderSelect('empDeptFilter', res.data, 'id', 'deptName');
            Common.renderSelect('empDepartment', res.data, 'id', 'deptName');
        }
    });
}

function loadPosOptions() {
    Request.get('/api/position/active').then(res => {
        if (res.code === 200) {
            Common.renderSelect('empPosition', res.data, 'id', 'positionName');
        }
    });
}

function loadEmpList() {
    Request.get('/api/employee/page', {
        keyword: empKeyword,
        departmentId: empDepartmentId,
        status: empStatus,
        page: empCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const columns = [
                { field: 'empNo' },
                { field: 'name' },
                { field: 'gender' },
                { field: 'phone' },
                { field: 'department', render: row => row.department ? row.department.deptName : '-' },
                { field: 'position', render: row => row.position ? row.position.positionName : '-' },
                { field: 'status', render: row => row.status === '在职' ? '<span style="color: #67c23a;">在职</span>' : '<span style="color: #f56c6c;">离职</span>' },
                { field: 'entryDate', render: row => row.entryDate || '-' },
                { 
                    render: row => `
                        <button class="btn btn-primary btn-small" onclick="editEmp(${row.id})">编辑</button>
                        <button class="btn btn-danger btn-small" onclick="deleteEmp(${row.id})">删除</button>
                    `
                }
            ];
            Common.renderTable('empTableBody', pageData.content, columns);
            renderEmpPagination(pageData.number + 1, pageData.totalPages);
        }
    });
}

function renderEmpPagination(page, totalPages) {
    const pagination = document.getElementById('empPagination');
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goEmpPage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goEmpPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goEmpPage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goEmpPage(page) {
    empCurrentPage = page;
    loadEmpList();
}

function searchEmp() {
    empKeyword = document.getElementById('empKeyword').value;
    empDepartmentId = document.getElementById('empDeptFilter').value;
    empStatus = document.getElementById('empStatusFilter').value;
    empCurrentPage = 1;
    loadEmpList();
}

function resetEmpSearch() {
    document.getElementById('empKeyword').value = '';
    document.getElementById('empDeptFilter').value = '';
    document.getElementById('empStatusFilter').value = '';
    empKeyword = '';
    empDepartmentId = '';
    empStatus = '';
    empCurrentPage = 1;
    loadEmpList();
}

function showEmpModal() {
    document.getElementById('empModalTitle').textContent = '新增员工';
    Common.clearForm('empForm');
    document.getElementById('empModal').style.display = 'flex';
}

function closeEmpModal() {
    document.getElementById('empModal').style.display = 'none';
}

function editEmp(id) {
    Request.get('/api/employee/' + id).then(res => {
        if (res.code === 200) {
            document.getElementById('empModalTitle').textContent = '编辑员工';
            const data = res.data;
            document.getElementById('empId').value = data.id;
            document.getElementById('empNo').value = data.empNo;
            document.getElementById('empName').value = data.name;
            document.getElementById('gender').value = data.gender || '';
            document.getElementById('empPhone').value = data.phone || '';
            document.getElementById('empDepartment').value = data.department ? data.department.id : '';
            document.getElementById('empPosition').value = data.position ? data.position.id : '';
            document.getElementById('idCard').value = data.idCard || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('entryDate').value = data.entryDate || '';
            document.getElementById('empStatus').value = data.status || '在职';
            document.getElementById('jurisdictionArea').value = data.jurisdictionArea || '';
            document.getElementById('address').value = data.address || '';
            document.getElementById('empModal').style.display = 'flex';
        }
    });
}

function saveEmp() {
    const formData = Common.getFormData('empForm');
    
    const schema = {
        empNo: [{ rule: 'required', message: '请输入员工编号' }],
        name: [{ rule: 'required', message: '请输入姓名' }],
        phone: [{ rule: 'phone', message: '请输入有效的手机号' }],
        idCard: [{ rule: 'idCard', message: '请输入有效的身份证号' }],
        email: [{ rule: 'email', message: '请输入有效的邮箱' }]
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
        empNo: formData.empNo,
        name: formData.name,
        gender: formData.gender,
        phone: formData.phone,
        idCard: formData.idCard,
        email: formData.email,
        entryDate: formData.entryDate,
        status: formData.status,
        jurisdictionArea: formData.jurisdictionArea,
        address: formData.address,
        department: formData.departmentId ? { id: parseInt(formData.departmentId) } : null,
        position: formData.positionId ? { id: parseInt(formData.positionId) } : null
    };

    if (formData.id) {
        submitData.id = parseInt(formData.id);
    }

    Request.post('/api/employee', submitData).then(res => {
        if (res.code === 200) {
            Common.showToast('保存成功');
            closeEmpModal();
            loadEmpList();
        } else {
            Common.showToast(res.message, 'error');
        }
    }).catch(err => {
        Common.showToast(err.message || '保存失败', 'error');
    });
}

function deleteEmp(id) {
    Common.showConfirm('确定要删除该员工吗？', () => {
        Request.delete('/api/employee/' + id).then(res => {
            if (res.code === 200) {
                Common.showToast('删除成功');
                loadEmpList();
            } else {
                Common.showToast(res.message, 'error');
            }
        });
    });
}
