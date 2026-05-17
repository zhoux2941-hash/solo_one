let deptsCurrentPage = 1;
let deptsPageSize = 10;
let deptsTotalPages = 1;

function initDepartmentsPage() {
    document.getElementById('page-departments').innerHTML = `
        <div class="card">
            <div class="page-header">
                <h1>部门管理</h1>
                <button class="btn btn-primary" id="addDeptBtn">新增部门</button>
            </div>
            
            <div class="search-bar">
                <div class="form-group">
                    <label>部门名称</label>
                    <input type="text" class="form-control" id="searchDeptName" placeholder="请输入部门名称">
                </div>
                <button class="btn btn-primary" id="searchDeptBtn">搜索</button>
                <button class="btn btn-default" id="resetDeptSearchBtn">重置</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>部门名称</th>
                            <th>描述</th>
                            <th>员工数量</th>
                            <th>状态</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="deptsTableBody"></tbody>
                </table>
            </div>

            <div class="pagination" id="deptsPagination"></div>
        </div>

        <div class="modal-overlay hidden" id="deptModal">
            <div class="modal">
                <div class="modal-header">
                    <h2 id="deptModalTitle">新增部门</h2>
                    <button class="modal-close" id="closeDeptModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="deptForm">
                        <input type="hidden" id="deptId">
                        <div class="form-row">
                            <label class="required">部门名称</label>
                            <input type="text" class="form-control" id="deptName" required>
                        </div>
                        <div class="form-row">
                            <label>描述</label>
                            <textarea class="form-control" id="deptDescription" rows="3"></textarea>
                        </div>
                        <div class="form-row">
                            <label>状态</label>
                            <select class="form-control" id="deptEnabled">
                                <option value="true">启用</option>
                                <option value="false">禁用</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="cancelDeptBtn">取消</button>
                    <button class="btn btn-primary" id="saveDeptBtn">保存</button>
                </div>
            </div>
        </div>
    `;

    bindDeptsEvents();
    loadDepartments();
}

function bindDeptsEvents() {
    document.getElementById('addDeptBtn').addEventListener('click', () => openDeptModal());
    document.getElementById('searchDeptBtn').addEventListener('click', () => {
        deptsCurrentPage = 1;
        loadDepartments();
    });
    document.getElementById('resetDeptSearchBtn').addEventListener('click', () => {
        document.getElementById('searchDeptName').value = '';
        deptsCurrentPage = 1;
        loadDepartments();
    });
    document.getElementById('closeDeptModal').addEventListener('click', () => closeDeptModal());
    document.getElementById('cancelDeptBtn').addEventListener('click', () => closeDeptModal());
    document.getElementById('saveDeptBtn').addEventListener('click', saveDepartment);
}

async function loadDepartments() {
    try {
        const params = {
            page: deptsCurrentPage,
            size: deptsPageSize
        };
        
        const name = document.getElementById('searchDeptName').value;
        if (name) params.name = name;

        const result = await api.department.list(params);
        deptsTotalPages = result.data.totalPages;
        
        const deptsWithEmployeeCount = await Promise.all(
            result.data.content.map(async dept => {
                try {
                    const detailResult = await api.department.detail(dept.id);
                    return { ...dept, employeeCount: detailResult.data.employeeCount };
                } catch {
                    return { ...dept, employeeCount: 0 };
                }
            })
        );
        
        renderDeptsTable(deptsWithEmployeeCount);
        renderDeptsPagination();
    } catch (error) {
        console.error('Load departments failed:', error);
    }
}

function renderDeptsTable(departments) {
    const tbody = document.getElementById('deptsTableBody');
    
    if (departments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = departments.map(dept => `
        <tr>
            <td>${dept.id}</td>
            <td>${dept.name}</td>
            <td>${dept.description || '-'}</td>
            <td>${dept.employeeCount || 0} 人</td>
            <td><span class="status-badge ${dept.enabled ? 'status-enabled' : 'status-disabled'}">${dept.enabled ? '启用' : '禁用'}</span></td>
            <td>${formatDate(dept.createTime)}</td>
            <td>
                <button class="btn btn-primary btn-small" onclick="editDepartment(${dept.id})">编辑</button>
                <button class="btn btn-warning btn-small" onclick="toggleDeptStatus(${dept.id}, ${dept.enabled})">${dept.enabled ? '禁用' : '启用'}</button>
                <button class="btn btn-danger btn-small" onclick="deleteDepartment(${dept.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function renderDeptsPagination() {
    const pagination = document.getElementById('deptsPagination');
    pagination.innerHTML = `
        <button class="btn btn-default btn-small" onclick="goToDeptsPage(${deptsCurrentPage - 1})" ${deptsCurrentPage <= 1 ? 'disabled' : ''}>上一页</button>
        <span>第 ${deptsCurrentPage} / ${deptsTotalPages} 页</span>
        <button class="btn btn-default btn-small" onclick="goToDeptsPage(${deptsCurrentPage + 1})" ${deptsCurrentPage >= deptsTotalPages ? 'disabled' : ''}>下一页</button>
    `;
}

function goToDeptsPage(page) {
    if (page < 1 || page > deptsTotalPages) return;
    deptsCurrentPage = page;
    loadDepartments();
}

function openDeptModal(deptId = null) {
    const modal = document.getElementById('deptModal');
    const title = document.getElementById('deptModalTitle');

    if (deptId) {
        title.textContent = '编辑部门';
        loadDeptDetail(deptId);
    } else {
        title.textContent = '新增部门';
        document.getElementById('deptId').value = '';
        document.getElementById('deptName').value = '';
        document.getElementById('deptDescription').value = '';
        document.getElementById('deptEnabled').value = 'true';
    }

    modal.classList.remove('hidden');
}

function closeDeptModal() {
    document.getElementById('deptModal').classList.add('hidden');
}

async function loadDeptDetail(id) {
    try {
        const result = await api.department.get(id);
        const dept = result.data;
        document.getElementById('deptId').value = dept.id;
        document.getElementById('deptName').value = dept.name;
        document.getElementById('deptDescription').value = dept.description || '';
        document.getElementById('deptEnabled').value = String(dept.enabled);
    } catch (error) {
        console.error('Load department detail failed:', error);
    }
}

async function saveDepartment() {
    const id = document.getElementById('deptId').value;
    const data = {
        name: document.getElementById('deptName').value,
        description: document.getElementById('deptDescription').value,
        enabled: document.getElementById('deptEnabled').value === 'true'
    };

    try {
        if (id) {
            await api.department.update(id, data);
            showToast('更新成功', 'success');
        } else {
            await api.department.create(data);
            showToast('创建成功', 'success');
        }
        closeDeptModal();
        loadDepartments();
    } catch (error) {
        console.error('Save department failed:', error);
    }
}

function editDepartment(id) {
    openDeptModal(id);
}

async function toggleDeptStatus(id, currentStatus) {
    if (!confirm(`确定要${currentStatus ? '禁用' : '启用'}该部门吗？`)) return;
    
    try {
        await api.department.toggleStatus(id);
        showToast('操作成功', 'success');
        loadDepartments();
    } catch (error) {
        console.error('Toggle department status failed:', error);
    }
}

async function deleteDepartment(id) {
    if (!confirm('确定要删除该部门吗？如果部门下还有员工则无法删除。')) return;
    
    try {
        await api.department.delete(id);
        showToast('删除成功', 'success');
        loadDepartments();
    } catch (error) {
        console.error('Delete department failed:', error);
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}