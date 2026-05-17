let usersCurrentPage = 1;
let usersPageSize = 10;
let usersTotalPages = 1;

function initUsersPage() {
    document.getElementById('page-users').innerHTML = `
        <div class="card">
            <div class="page-header">
                <h1>用户管理</h1>
                <button class="btn btn-primary" id="addUserBtn">新增用户</button>
            </div>
            
            <div class="search-bar">
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" class="form-control" id="searchUsername" placeholder="请输入用户名">
                </div>
                <div class="form-group">
                    <label>真实姓名</label>
                    <input type="text" class="form-control" id="searchRealName" placeholder="请输入真实姓名">
                </div>
                <div class="form-group">
                    <label>所属部门</label>
                    <select class="form-control" id="searchDepartmentId">
                        <option value="">全部</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="searchUserBtn">搜索</button>
                <button class="btn btn-default" id="resetUserSearchBtn">重置</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用户名</th>
                            <th>真实姓名</th>
                            <th>手机号</th>
                            <th>邮箱</th>
                            <th>角色</th>
                            <th>所属部门</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody"></tbody>
                </table>
            </div>

            <div class="pagination" id="usersPagination"></div>
        </div>

        <div class="modal-overlay hidden" id="userModal">
            <div class="modal">
                <div class="modal-header">
                    <h2 id="userModalTitle">新增用户</h2>
                    <button class="modal-close" id="closeUserModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="userForm">
                        <input type="hidden" id="userId">
                        <div class="form-row">
                            <label class="required">用户名</label>
                            <input type="text" class="form-control" id="userUsername" required>
                        </div>
                        <div class="form-row">
                            <label id="passwordLabel">密码</label>
                            <input type="password" class="form-control" id="userPassword">
                        </div>
                        <div class="form-row">
                            <label class="required">真实姓名</label>
                            <input type="text" class="form-control" id="userRealName" required>
                        </div>
                        <div class="form-row">
                            <label>手机号</label>
                            <input type="text" class="form-control" id="userPhone">
                        </div>
                        <div class="form-row">
                            <label>邮箱</label>
                            <input type="email" class="form-control" id="userEmail">
                        </div>
                        <div class="form-row">
                            <label>角色</label>
                            <select class="form-control" id="userRole">
                                <option value="EMPLOYEE">普通员工</option>
                                <option value="ADMIN">管理员</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>所属部门</label>
                            <select class="form-control" id="userDepartmentId">
                                <option value="">无</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>状态</label>
                            <select class="form-control" id="userEnabled">
                                <option value="true">启用</option>
                                <option value="false">禁用</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="cancelUserBtn">取消</button>
                    <button class="btn btn-primary" id="saveUserBtn">保存</button>
                </div>
            </div>
        </div>
    `;

    bindUsersEvents();
    loadDepartmentsForSearch();
    loadDepartmentsForForm();
    loadUsers();
}

function bindUsersEvents() {
    document.getElementById('addUserBtn').addEventListener('click', () => openUserModal());
    document.getElementById('searchUserBtn').addEventListener('click', () => {
        usersCurrentPage = 1;
        loadUsers();
    });
    document.getElementById('resetUserSearchBtn').addEventListener('click', () => {
        document.getElementById('searchUsername').value = '';
        document.getElementById('searchRealName').value = '';
        document.getElementById('searchDepartmentId').value = '';
        usersCurrentPage = 1;
        loadUsers();
    });
    document.getElementById('closeUserModal').addEventListener('click', () => closeUserModal());
    document.getElementById('cancelUserBtn').addEventListener('click', () => closeUserModal());
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);
}

function loadDepartmentsForSearch() {
    try {
        const select = document.getElementById('searchDepartmentId');
        renderDepartmentSelect(select, true);
    } catch (error) {
        console.error('Load departments for search failed:', error);
    }
}

function loadDepartmentsForForm() {
    try {
        const select = document.getElementById('userDepartmentId');
        renderDepartmentSelect(select, true);
    } catch (error) {
        console.error('Load departments for form failed:', error);
    }
}

function refreshUserDepartmentSelects() {
    loadDepartmentsForSearch();
    loadDepartmentsForForm();
}

async function loadUsers() {
    try {
        const params = {
            page: usersCurrentPage,
            size: usersPageSize
        };
        
        const username = document.getElementById('searchUsername').value;
        const realName = document.getElementById('searchRealName').value;
        const departmentId = document.getElementById('searchDepartmentId').value;
        
        if (username) params.username = username;
        if (realName) params.realName = realName;
        if (departmentId) params.departmentId = departmentId;

        const result = await api.user.list(params);
        usersTotalPages = result.data.totalPages;
        renderUsersTable(result.data.content);
        renderUsersPagination();
    } catch (error) {
        console.error('Load users failed:', error);
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.realName}</td>
            <td>${user.phone || '-'}</td>
            <td>${user.email || '-'}</td>
            <td><span class="role-badge ${user.role === 'ADMIN' ? 'role-admin' : 'role-employee'}">${user.role === 'ADMIN' ? '管理员' : '普通员工'}</span></td>
            <td>${user.department ? user.department.name : '-'}</td>
            <td><span class="status-badge ${user.enabled ? 'status-enabled' : 'status-disabled'}">${user.enabled ? '启用' : '禁用'}</span></td>
            <td>
                <button class="btn btn-primary btn-small" onclick="editUser(${user.id})">编辑</button>
                <button class="btn btn-warning btn-small" onclick="toggleUserStatus(${user.id}, ${user.enabled})">${user.enabled ? '禁用' : '启用'}</button>
                <button class="btn btn-danger btn-small" onclick="deleteUser(${user.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function renderUsersPagination() {
    const pagination = document.getElementById('usersPagination');
    pagination.innerHTML = `
        <button class="btn btn-default btn-small" onclick="goToUsersPage(${usersCurrentPage - 1})" ${usersCurrentPage <= 1 ? 'disabled' : ''}>上一页</button>
        <span>第 ${usersCurrentPage} / ${usersTotalPages} 页</span>
        <button class="btn btn-default btn-small" onclick="goToUsersPage(${usersCurrentPage + 1})" ${usersCurrentPage >= usersTotalPages ? 'disabled' : ''}>下一页</button>
    `;
}

function goToUsersPage(page) {
    if (page < 1 || page > usersTotalPages) return;
    usersCurrentPage = page;
    loadUsers();
}

function openUserModal(userId = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    const passwordLabel = document.getElementById('passwordLabel');

    if (userId) {
        title.textContent = '编辑用户';
        passwordLabel.classList.remove('required');
        loadUserDetail(userId);
    } else {
        title.textContent = '新增用户';
        passwordLabel.classList.add('required');
        document.getElementById('userId').value = '';
        document.getElementById('userUsername').value = '';
        document.getElementById('userPassword').value = '';
        document.getElementById('userRealName').value = '';
        document.getElementById('userPhone').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userRole').value = 'EMPLOYEE';
        document.getElementById('userDepartmentId').value = '';
        document.getElementById('userEnabled').value = 'true';
    }

    modal.classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

async function loadUserDetail(id) {
    try {
        const result = await api.user.get(id);
        const user = result.data;
        document.getElementById('userId').value = user.id;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userPassword').value = '';
        document.getElementById('userRealName').value = user.realName;
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userRole').value = user.role;
        document.getElementById('userDepartmentId').value = user.department ? user.department.id : '';
        document.getElementById('userEnabled').value = String(user.enabled);
    } catch (error) {
        console.error('Load user detail failed:', error);
    }
}

async function saveUser() {
    const id = document.getElementById('userId').value;
    const username = document.getElementById('userUsername').value.trim();
    const realName = document.getElementById('userRealName').value.trim();
    const password = document.getElementById('userPassword').value;

    if (!username) {
        showToast('请输入用户名', 'error');
        document.getElementById('userUsername').focus();
        return;
    }

    if (!realName) {
        showToast('请输入真实姓名', 'error');
        document.getElementById('userRealName').focus();
        return;
    }

    if (!id && !password) {
        showToast('请输入密码', 'error');
        document.getElementById('userPassword').focus();
        return;
    }

    const data = {
        username: username,
        realName: realName,
        phone: document.getElementById('userPhone').value.trim() || null,
        email: document.getElementById('userEmail').value.trim() || null,
        role: document.getElementById('userRole').value,
        departmentId: document.getElementById('userDepartmentId').value || null,
        enabled: document.getElementById('userEnabled').value === 'true'
    };

    if (password) {
        data.password = password;
    }

    try {
        if (id) {
            await api.user.update(id, data);
            showToast('更新成功', 'success');
        } else {
            await api.user.create(data);
            showToast('创建成功', 'success');
        }
        closeUserModal();
        loadUsers();
    } catch (error) {
        console.error('Save user failed:', error);
    }
}

function editUser(id) {
    openUserModal(id);
}

async function toggleUserStatus(id, currentStatus) {
    if (!confirm(`确定要${currentStatus ? '禁用' : '启用'}该用户吗？`)) return;
    
    try {
        await api.user.toggleStatus(id);
        showToast('操作成功', 'success');
        loadUsers();
    } catch (error) {
        console.error('Toggle user status failed:', error);
    }
}

async function deleteUser(id) {
    if (!confirm('确定要删除该用户吗？')) return;
    
    try {
        await api.user.delete(id);
        showToast('删除成功', 'success');
        loadUsers();
    } catch (error) {
        console.error('Delete user failed:', error);
    }
}