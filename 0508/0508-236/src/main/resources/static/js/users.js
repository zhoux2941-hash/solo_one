let currentPage = 0;
let pageSize = 10;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    setupUserForm();
});

async function loadUsers() {
    try {
        const response = await fetch(`/api/users/page?page=${currentPage}&size=${pageSize}`);
        if (response.ok) {
            const data = await response.json();
            renderUsersTable(data.content);
            renderPagination(data);
        }
    } catch (error) {
        console.error('加载用户列表失败:', error);
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('userTableBody');
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #6c757d; padding: 24px;">
                    暂无数据
                </td>
            </tr>
        `;
        return;
    }
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.realName}</td>
            <td>${PhoneUtils.formatPhone(user.phone)}</td>
            <td><span class="badge ${getRoleBadgeClass(user.role)}">${getRoleText(user.role)}</span></td>
            <td><span class="badge ${user.enabled ? 'badge-enabled' : 'badge-disabled'}">${user.enabled ? '启用' : '禁用'}</span></td>
            <td>${formatDate(user.createTime)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-success" onclick="editUser(${user.id})">编辑</button>
                    <button class="btn ${user.enabled ? 'btn-warning' : 'btn-primary'}" onclick="toggleUserStatus(${user.id})">${user.enabled ? '禁用' : '启用'}</button>
                    <button class="btn btn-danger btn-delete" onclick="deleteUser(${user.id})">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination(pageData) {
    totalPages = pageData.totalPages;
    const paginationContainer = document.getElementById('userPagination');

    let pageNumbers = generatePageNumbers(pageData.page, pageData.totalPages);

    paginationContainer.innerHTML = `
        <div class="pagination-info">
            共 ${pageData.totalElements} 条记录，第 ${pageData.page + 1} / ${pageData.totalPages} 页，每页
            <select class="page-size-select" onchange="changePageSize(this.value)">
                <option value="5" ${pageData.size === 5 ? 'selected' : ''}>5</option>
                <option value="10" ${pageData.size === 10 ? 'selected' : ''}>10</option>
                <option value="20" ${pageData.size === 20 ? 'selected' : ''}>20</option>
                <option value="50" ${pageData.size === 50 ? 'selected' : ''}>50</option>
            </select>
            条
        </div>
        <div class="pagination">
            <button class="pagination-btn" onclick="goToPage(0)" ${pageData.first ? 'disabled' : ''}>首页</button>
            <button class="pagination-btn" onclick="goToPage(${pageData.page - 1})" ${pageData.first ? 'disabled' : ''}>上一页</button>
            ${pageNumbers.map(num => `
                <button class="pagination-btn ${num === pageData.page ? 'active' : ''}" onclick="goToPage(${num})">${num + 1}</button>
            `).join('')}
            <button class="pagination-btn" onclick="goToPage(${pageData.page + 1})" ${pageData.last ? 'disabled' : ''}>下一页</button>
            <button class="pagination-btn" onclick="goToPage(${pageData.totalPages - 1})" ${pageData.last ? 'disabled' : ''}>末页</button>
        </div>
    `;
}

function generatePageNumbers(current, total) {
    const pages = [];
    if (total <= 7) {
        for (let i = 0; i < total; i++) {
            pages.push(i);
        }
    } else if (current <= 3) {
        for (let i = 0; i < 5; i++) {
            pages.push(i);
        }
        pages.push(total - 2);
        pages.push(total - 1);
    } else if (current >= total - 4) {
        pages.push(0);
        pages.push(1);
        for (let i = total - 5; i < total; i++) {
            pages.push(i);
        }
    } else {
        pages.push(0);
        pages.push(1);
        for (let i = current - 1; i <= current + 1; i++) {
            pages.push(i);
        }
        pages.push(total - 2);
        pages.push(total - 1);
    }
    return pages;
}

function goToPage(page) {
    if (page >= 0 && page < totalPages) {
        currentPage = page;
        loadUsers();
    }
}

function changePageSize(size) {
    pageSize = parseInt(size);
    currentPage = 0;
    loadUsers();
}

function openUserModal() {
    document.getElementById('modalTitle').textContent = '添加用户';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModal').classList.add('show');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

function editUser(id) {
    fetch(`/api/users/${id}`)
        .then(response => response.json())
        .then(user => {
            document.getElementById('modalTitle').textContent = '编辑用户';
            document.getElementById('userId').value = user.id;
            document.getElementById('formUsername').value = user.username;
            document.getElementById('formPassword').value = '';
            document.getElementById('formPassword').required = false;
            document.getElementById('formRealName').value = user.realName;
            document.getElementById('formPhone').value = PhoneUtils.formatPhone(user.phone);
            document.getElementById('formRole').value = user.role;
            document.getElementById('formEnabled').value = user.enabled.toString();
            document.getElementById('userModal').classList.add('show');
        })
        .catch(error => console.error('加载用户详情失败:', error));
}

function setupUserForm() {
    const form = document.getElementById('userForm');
    const phoneInput = document.getElementById('formPhone');

    phoneInput.addEventListener('input', function() {
        PhoneUtils.formatInput(this);
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const phone = document.getElementById('formPhone').value;
        if (phone && !PhoneUtils.isValidMobile(phone)) {
            alert('手机号格式不正确，请输入11位有效手机号');
            document.getElementById('formPhone').focus();
            return;
        }

        const userId = document.getElementById('userId').value;
        const userData = {
            username: document.getElementById('formUsername').value,
            password: document.getElementById('formPassword').value,
            realName: document.getElementById('formRealName').value,
            phone: PhoneUtils.cleanPhone(document.getElementById('formPhone').value),
            role: document.getElementById('formRole').value,
            enabled: document.getElementById('formEnabled').value === 'true'
        };

        try {
            let response;
            if (userId) {
                response = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
            } else {
                response = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
            }

            if (response.ok) {
                closeUserModal();
                loadUsers();
            } else {
                const error = await response.json();
                alert(error.message || '操作失败');
            }
        } catch (error) {
            console.error('保存用户失败:', error);
            alert('操作失败');
        }
    });
}

async function toggleUserStatus(id) {
    try {
        const response = await fetch(`/api/users/${id}/toggle-status`, {
            method: 'PUT'
        });
        if (response.ok) {
            loadUsers();
        }
    } catch (error) {
        console.error('切换用户状态失败:', error);
    }
}

async function deleteUser(id) {
    const confirmed = window.confirm('确定要删除该用户吗？\n\n此操作不可恢复！');
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('删除成功！');
            loadUsers();
        } else {
            alert('删除失败，请重试！');
        }
    } catch (error) {
        console.error('删除用户失败:', error);
        alert('删除失败，请重试！');
    }
}
