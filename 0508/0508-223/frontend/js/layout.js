function renderHeader() {
    const user = getCurrentUser();
    if (!user) return '';

    return `
        <header class="header">
            <div class="header-content">
                <div class="logo">建筑施工现场管控系统</div>
                <div class="header-right">
                    <div class="user-info">
                        <span>欢迎，${user.realName}</span>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="logout()">退出登录</button>
                </div>
            </div>
        </header>
    `;
}

function renderNav(activePage) {
    const navItems = [
        { id: 'project', name: '项目管理', path: 'project.html' },
        { id: 'area', name: '施工区域管理', path: 'area.html' },
        { id: 'worker', name: '工人管理', path: 'worker.html' },
        { id: 'attendance', name: '考勤管理', path: 'attendance.html' },
        { id: 'workhour', name: '工时汇总', path: 'workhour.html' },
    ];

    return `
        <nav class="nav">
            <ul class="nav-list">
                ${navItems.map(item => `
                    <li class="nav-item ${activePage === item.id ? 'active' : ''}" 
                        onclick="window.location.href='${item.path}'">
                        ${item.name}
                    </li>
                `).join('')}
            </ul>
        </nav>
    `;
}

function renderModal(modalId, title, content) {
    return `
        <div id="${modalId}" class="modal-overlay hidden">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="closeModal('${modalId}')">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        </div>
    `;
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function logout() {
    await http.post('/api/auth/logout');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function initPage(activePage) {
    checkAuth();

    const headerHtml = renderHeader();
    const navHtml = renderNav(activePage);

    const headerContainer = document.createElement('div');
    headerContainer.innerHTML = headerHtml + navHtml;
    document.body.insertBefore(headerContainer, document.body.firstChild);
}

function renderPagination(containerId, pageNum, pageSize, total, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const totalPages = Math.ceil(total / pageSize);

    let html = '<div class="pagination">';
    html += `<span class="pagination-info">共 ${total} 条，第 ${pageNum}/${totalPages || 1} 页</span>`;

    html += `<button class="pagination-btn" onclick="${onPageChange}(1)" ${pageNum === 1 ? 'disabled' : ''}>首页</button>`;
    html += `<button class="pagination-btn" onclick="${onPageChange}(${pageNum - 1})" ${pageNum === 1 ? 'disabled' : ''}>上一页</button>`;

    const startPage = Math.max(1, pageNum - 2);
    const endPage = Math.min(totalPages, pageNum + 2);

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === pageNum ? 'active' : ''}" onclick="${onPageChange}(${i})">${i}</button>`;
    }

    html += `<button class="pagination-btn" onclick="${onPageChange}(${pageNum + 1})" ${pageNum === totalPages || totalPages === 0 ? 'disabled' : ''}>下一页</button>`;
    html += `<button class="pagination-btn" onclick="${onPageChange}(${totalPages})" ${pageNum === totalPages || totalPages === 0 ? 'disabled' : ''}>末页</button>`;
    html += '</div>';

    container.innerHTML = html;
}
