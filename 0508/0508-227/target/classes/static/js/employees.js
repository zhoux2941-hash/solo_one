let employeesCurrentPage = 1;
let employeesPageSize = 10;
let employeesTotalPages = 1;

function initEmployeesPage() {
    document.getElementById('page-employees').innerHTML = `
        <div class="card">
            <div class="page-header">
                <h1>员工档案管理</h1>
                <button class="btn btn-primary" id="addEmployeeBtn">新增档案</button>
            </div>
            
            <div class="search-bar">
                <div class="form-group">
                    <label>员工姓名</label>
                    <input type="text" class="form-control" id="searchEmployeeName" placeholder="请输入姓名">
                </div>
                <div class="form-group">
                    <label>所属部门</label>
                    <select class="form-control" id="searchEmployeeDept">
                        <option value="">全部</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>所属岗位</label>
                    <select class="form-control" id="searchEmployeePosition">
                        <option value="">全部</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="searchEmployeeBtn">搜索</button>
                <button class="btn btn-default" id="resetEmployeeSearchBtn">重置</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>姓名</th>
                            <th>身份证号</th>
                            <th>手机号</th>
                            <th>所属部门</th>
                            <th>所属岗位</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="employeesTableBody"></tbody>
                </table>
            </div>

            <div class="pagination" id="employeesPagination"></div>
        </div>

        <div class="modal-overlay hidden" id="employeeModal">
            <div class="modal modal-large">
                <div class="modal-header">
                    <h2 id="employeeModalTitle">新增员工档案</h2>
                    <button class="modal-close" id="closeEmployeeModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="employeeForm">
                        <input type="hidden" id="employeeId">
                        <div class="form-grid">
                            <div class="form-row">
                                <label class="required">姓名</label>
                                <input type="text" class="form-control" id="employeeName" required>
                            </div>
                            <div class="form-row">
                                <label class="required">身份证号</label>
                                <input type="text" class="form-control" id="employeeIdCard" required maxlength="18">
                            </div>
                            <div class="form-row">
                                <label>手机号</label>
                                <input type="text" class="form-control" id="employeePhone" maxlength="11">
                            </div>
                            <div class="form-row">
                                <label>邮箱</label>
                                <input type="email" class="form-control" id="employeeEmail">
                            </div>
                            <div class="form-row">
                                <label>入职日期</label>
                                <input type="date" class="form-control" id="employeeEntryDate">
                            </div>
                            <div class="form-row">
                                <label>学历</label>
                                <select class="form-control" id="employeeEducation">
                                    <option value="">请选择</option>
                                    <option value="大专">大专</option>
                                    <option value="本科">本科</option>
                                    <option value="硕士">硕士</option>
                                    <option value="博士">博士</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label>紧急联系人</label>
                                <input type="text" class="form-control" id="employeeEmergencyContact">
                            </div>
                            <div class="form-row">
                                <label>紧急联系电话</label>
                                <input type="text" class="form-control" id="employeeEmergencyPhone" maxlength="11">
                            </div>
                            <div class="form-row">
                                <label>关联用户</label>
                                <select class="form-control" id="employeeUserId">
                                    <option value="">无</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label>所属部门</label>
                                <select class="form-control" id="employeeDepartmentId">
                                    <option value="">无</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label>所属岗位</label>
                                <select class="form-control" id="employeePositionId">
                                    <option value="">无</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label>附件</label>
                                <input type="text" class="form-control" id="employeeAttachment" placeholder="请输入附件链接">
                            </div>
                            <div class="form-row">
                                <label>状态</label>
                                <select class="form-control" id="employeeEnabled">
                                    <option value="true">在职</option>
                                    <option value="false">离职</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="cancelEmployeeBtn">取消</button>
                    <button class="btn btn-primary" id="saveEmployeeBtn">保存</button>
                </div>
            </div>
        </div>

        <div class="modal-overlay hidden" id="employeeDetailModal">
            <div class="modal modal-large">
                <div class="modal-header">
                    <h2>员工档案详情</h2>
                    <button class="modal-close" id="closeEmployeeDetailModal">&times;</button>
                </div>
                <div class="modal-body" id="employeeDetailBody"></div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="closeEmployeeDetailBtn">关闭</button>
                </div>
            </div>
        </div>
    `;

    bindEmployeesEvents();
    loadDepartmentsForEmployeeSearch();
    loadPositionsForEmployeeSearch();
    loadDepartmentsForEmployeeForm();
    loadPositionsForEmployeeForm();
    loadUsersForEmployeeForm();
    loadEmployees();
}

function bindEmployeesEvents() {
    document.getElementById('addEmployeeBtn').addEventListener('click', () => openEmployeeModal());
    document.getElementById('searchEmployeeBtn').addEventListener('click', () => {
        employeesCurrentPage = 1;
        loadEmployees();
    });
    document.getElementById('resetEmployeeSearchBtn').addEventListener('click', () => {
        document.getElementById('searchEmployeeName').value = '';
        document.getElementById('searchEmployeeDept').value = '';
        document.getElementById('searchEmployeePosition').value = '';
        employeesCurrentPage = 1;
        loadEmployees();
    });
    document.getElementById('closeEmployeeModal').addEventListener('click', () => closeEmployeeModal());
    document.getElementById('cancelEmployeeBtn').addEventListener('click', () => closeEmployeeModal());
    document.getElementById('saveEmployeeBtn').addEventListener('click', saveEmployee);
    document.getElementById('closeEmployeeDetailModal').addEventListener('click', () => closeEmployeeDetailModal());
    document.getElementById('closeEmployeeDetailBtn').addEventListener('click', () => closeEmployeeDetailModal());
}

function loadDepartmentsForEmployeeSearch() {
    try {
        const select = document.getElementById('searchEmployeeDept');
        renderDepartmentSelect(select, true);
    } catch (error) {
        console.error('Load departments for search failed:', error);
    }
}

async function loadPositionsForEmployeeSearch() {
    try {
        const result = await api.position.enabled();
        const select = document.getElementById('searchEmployeePosition');
        result.data.forEach(pos => {
            const option = document.createElement('option');
            option.value = pos.id;
            option.textContent = pos.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Load positions failed:', error);
    }
}

function loadDepartmentsForEmployeeForm() {
    try {
        const select = document.getElementById('employeeDepartmentId');
        renderDepartmentSelect(select, true);
    } catch (error) {
        console.error('Load departments for form failed:', error);
    }
}

function refreshEmployeeDepartmentSelects() {
    loadDepartmentsForEmployeeSearch();
    loadDepartmentsForEmployeeForm();
}

async function loadPositionsForEmployeeForm() {
    try {
        const result = await api.position.enabled();
        const select = document.getElementById('employeePositionId');
        while (select.options.length > 1) {
            select.remove(1);
        }
        result.data.forEach(pos => {
            const option = document.createElement('option');
            option.value = pos.id;
            option.textContent = pos.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Load positions failed:', error);
    }
}

async function loadUsersForEmployeeForm() {
    try {
        const result = await api.user.list({ page: 1, size: 100 });
        const select = document.getElementById('employeeUserId');
        while (select.options.length > 1) {
            select.remove(1);
        }
        result.data.content.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.realName + ' (' + user.username + ')';
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Load users failed:', error);
    }
}

async function loadEmployees() {
    try {
        const params = {
            page: employeesCurrentPage,
            size: employeesPageSize
        };
        
        const name = document.getElementById('searchEmployeeName').value;
        const departmentId = document.getElementById('searchEmployeeDept').value;
        const positionId = document.getElementById('searchEmployeePosition').value;
        
        if (name) params.name = name;
        if (departmentId) params.departmentId = departmentId;
        if (positionId) params.positionId = positionId;

        const result = await api.employee.list(params);
        employeesTotalPages = result.data.totalPages;
        renderEmployeesTable(result.data.content);
        renderEmployeesPagination();
    } catch (error) {
        console.error('Load employees failed:', error);
    }
}

function renderEmployeesTable(employees) {
    const tbody = document.getElementById('employeesTableBody');
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td>${emp.id}</td>
            <td>${emp.name}</td>
            <td>${emp.idCard.substring(0, 6) + '********' + emp.idCard.substring(14)}</td>
            <td>${emp.phone || '-'}</td>
            <td>${emp.department ? emp.department.name : '-'}</td>
            <td>${emp.position ? emp.position.name : '-'}</td>
            <td><span class="status-badge ${emp.enabled ? 'status-enabled' : 'status-disabled'}">${emp.enabled ? '在职' : '离职'}</span></td>
            <td>
                <button class="btn btn-primary btn-small" onclick="viewEmployeeDetail(${emp.id})">详情</button>
                <button class="btn btn-primary btn-small" onclick="editEmployee(${emp.id})">编辑</button>
                <button class="btn btn-danger btn-small" onclick="deleteEmployee(${emp.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function renderEmployeesPagination() {
    const pagination = document.getElementById('employeesPagination');
    pagination.innerHTML = `
        <button class="btn btn-default btn-small" onclick="goToEmployeesPage(${employeesCurrentPage - 1})" ${employeesCurrentPage <= 1 ? 'disabled' : ''}>上一页</button>
        <span>第 ${employeesCurrentPage} / ${employeesTotalPages} 页</span>
        <button class="btn btn-default btn-small" onclick="goToEmployeesPage(${employeesCurrentPage + 1})" ${employeesCurrentPage >= employeesTotalPages ? 'disabled' : ''}>下一页</button>
    `;
}

function goToEmployeesPage(page) {
    if (page < 1 || page > employeesTotalPages) return;
    employeesCurrentPage = page;
    loadEmployees();
}

function openEmployeeModal(employeeId = null) {
    const modal = document.getElementById('employeeModal');
    const title = document.getElementById('employeeModalTitle');

    if (employeeId) {
        title.textContent = '编辑员工档案';
        loadEmployeeDetail(employeeId);
    } else {
        title.textContent = '新增员工档案';
        document.getElementById('employeeId').value = '';
        document.getElementById('employeeName').value = '';
        document.getElementById('employeeIdCard').value = '';
        document.getElementById('employeePhone').value = '';
        document.getElementById('employeeEmail').value = '';
        document.getElementById('employeeEntryDate').value = '';
        document.getElementById('employeeEducation').value = '';
        document.getElementById('employeeEmergencyContact').value = '';
        document.getElementById('employeeEmergencyPhone').value = '';
        document.getElementById('employeeUserId').value = '';
        document.getElementById('employeeDepartmentId').value = '';
        document.getElementById('employeePositionId').value = '';
        document.getElementById('employeeAttachment').value = '';
        document.getElementById('employeeEnabled').value = 'true';
    }

    modal.classList.remove('hidden');
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').classList.add('hidden');
}

async function loadEmployeeDetail(id) {
    try {
        const result = await api.employee.get(id);
        const emp = result.data;
        document.getElementById('employeeId').value = emp.id;
        document.getElementById('employeeName').value = emp.name;
        document.getElementById('employeeIdCard').value = emp.idCard;
        document.getElementById('employeePhone').value = emp.phone || '';
        document.getElementById('employeeEmail').value = emp.email || '';
        document.getElementById('employeeEntryDate').value = emp.entryDate || '';
        document.getElementById('employeeEducation').value = emp.education || '';
        document.getElementById('employeeEmergencyContact').value = emp.emergencyContact || '';
        document.getElementById('employeeEmergencyPhone').value = emp.emergencyPhone || '';
        document.getElementById('employeeUserId').value = emp.user ? emp.user.id : '';
        document.getElementById('employeeDepartmentId').value = emp.department ? emp.department.id : '';
        document.getElementById('employeePositionId').value = emp.position ? emp.position.id : '';
        document.getElementById('employeeAttachment').value = emp.attachment || '';
        document.getElementById('employeeEnabled').value = String(emp.enabled);
    } catch (error) {
        console.error('Load employee detail failed:', error);
    }
}

function validateIdCard(idCard) {
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
    return idCardRegex.test(idCard);
}

async function saveEmployee() {
    const id = document.getElementById('employeeId').value;
    const name = document.getElementById('employeeName').value.trim();
    const idCard = document.getElementById('employeeIdCard').value.trim();

    if (!name) {
        showToast('请输入姓名', 'error');
        document.getElementById('employeeName').focus();
        return;
    }

    if (!idCard) {
        showToast('请输入身份证号', 'error');
        document.getElementById('employeeIdCard').focus();
        return;
    }

    if (!validateIdCard(idCard)) {
        showToast('身份证号格式不正确', 'error');
        document.getElementById('employeeIdCard').focus();
        return;
    }

    const data = {
        name: name,
        idCard: idCard,
        phone: document.getElementById('employeePhone').value.trim() || null,
        email: document.getElementById('employeeEmail').value.trim() || null,
        entryDate: document.getElementById('employeeEntryDate').value || null,
        education: document.getElementById('employeeEducation').value || null,
        emergencyContact: document.getElementById('employeeEmergencyContact').value.trim() || null,
        emergencyPhone: document.getElementById('employeeEmergencyPhone').value.trim() || null,
        userId: document.getElementById('employeeUserId').value || null,
        departmentId: document.getElementById('employeeDepartmentId').value || null,
        positionId: document.getElementById('employeePositionId').value || null,
        attachment: document.getElementById('employeeAttachment').value.trim() || null,
        enabled: document.getElementById('employeeEnabled').value === 'true'
    };

    try {
        if (id) {
            await api.employee.update(id, data);
            showToast('更新成功', 'success');
        } else {
            await api.employee.create(data);
            showToast('创建成功', 'success');
        }
        closeEmployeeModal();
        loadEmployees();
    } catch (error) {
        console.error('Save employee failed:', error);
    }
}

function editEmployee(id) {
    openEmployeeModal(id);
}

async function deleteEmployee(id) {
    if (!confirm('确定要删除该员工档案吗？')) return;
    
    try {
        await api.employee.delete(id);
        showToast('删除成功', 'success');
        loadEmployees();
    } catch (error) {
        console.error('Delete employee failed:', error);
    }
}

async function viewEmployeeDetail(id) {
    try {
        const result = await api.employee.get(id);
        const emp = result.data;
        
        const detailBody = document.getElementById('employeeDetailBody');
        detailBody.innerHTML = `
            <div class="detail-section">
                <h3>基本信息</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>姓名：</label>
                        <span>${emp.name}</span>
                    </div>
                    <div class="detail-item">
                        <label>身份证号：</label>
                        <span>${emp.idCard}</span>
                    </div>
                    <div class="detail-item">
                        <label>手机号：</label>
                        <span>${emp.phone || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>邮箱：</label>
                        <span>${emp.email || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>入职日期：</label>
                        <span>${emp.entryDate || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>学历：</label>
                        <span>${emp.education || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>紧急联系人：</label>
                        <span>${emp.emergencyContact || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>紧急联系电话：</label>
                        <span>${emp.emergencyPhone || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>所属部门：</label>
                        <span>${emp.department ? emp.department.name : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>所属岗位：</label>
                        <span>${emp.position ? emp.position.name : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>关联用户：</label>
                        <span>${emp.user ? emp.user.realName + ' (' + emp.user.username + ')' : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>状态：</label>
                        <span>${emp.enabled ? '在职' : '离职'}</span>
                    </div>
                </div>
            </div>
            <div class="detail-section">
                <h3>附件信息</h3>
                ${emp.attachment ? `<a href="${emp.attachment}" target="_blank">${emp.attachment}</a>` : '<p>暂无附件</p>'}
            </div>
        `;
        
        document.getElementById('employeeDetailModal').classList.remove('hidden');
    } catch (error) {
        console.error('Load employee detail failed:', error);
    }
}

function closeEmployeeDetailModal() {
    document.getElementById('employeeDetailModal').classList.add('hidden');
}
