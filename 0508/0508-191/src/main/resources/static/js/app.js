let currentUser = null;

function init() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        
        loadMyBooks();
        loadMyRequests();
        loadReceivedRequests();
        loadActiveDrifts();
    }
    
    loadPopularBooksPreview();
    loadAvailableBooks();
    loadPopularBooks();
}

function updateAuthUI() {
    const authArea = document.getElementById('authArea');
    const publishBtn = document.getElementById('publishBtn');
    
    if (currentUser) {
        authArea.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${currentUser.nickname.charAt(0)}</div>
                <span>${currentUser.nickname}</span>
                <button onclick="logout()" class="btn btn-secondary btn-sm">退出</button>
            </div>
        `;
        if (publishBtn) publishBtn.style.display = 'inline-block';
    } else {
        authArea.innerHTML = `
            <button onclick="showLoginModal()" class="btn btn-primary">登录</button>
            <button onclick="showRegisterModal()" class="btn btn-secondary">注册</button>
        `;
        if (publishBtn) publishBtn.style.display = 'none';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    showMessage('已退出登录');
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageName + 'Page').classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    if (pageName === 'my' && currentUser) {
        loadMyBooks();
        loadMyRequests();
        loadReceivedRequests();
        loadActiveDrifts();
    }
}

function showMyTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showLoginModal() {
    showModal('loginModal');
}

function showRegisterModal() {
    showModal('registerModal');
}

function showPublishModal() {
    if (!currentUser) {
        showMessage('请先登录');
        showLoginModal();
        return;
    }
    showModal('publishModal');
}

function showDriftModal(bookId, bookTitle) {
    if (!currentUser) {
        showMessage('请先登录');
        showLoginModal();
        return;
    }
    document.getElementById('driftBookId').value = bookId;
    document.getElementById('driftBookTitle').value = bookTitle;
    showModal('driftModal');
}

function showCheckinModal(driftId, bookTitle) {
    document.getElementById('checkinDriftId').value = driftId;
    document.getElementById('checkinBookTitle').value = bookTitle;
    loadCheckinHistory(driftId);
    showModal('checkinModal');
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = await API.login({ username, password });
    if (result.success) {
        currentUser = result.data;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal('loginModal');
        showMessage('登录成功');
        
        loadMyBooks();
        loadMyRequests();
        loadReceivedRequests();
        loadActiveDrifts();
    } else {
        showMessage(result.message || '登录失败');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value;
    const nickname = document.getElementById('regNickname').value;
    const password = document.getElementById('regPassword').value;
    
    const result = await API.register({ username, nickname, password });
    if (result.success) {
        currentUser = result.data;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal('registerModal');
        showMessage('注册成功，已自动登录');
        
        loadMyBooks();
        loadMyRequests();
        loadReceivedRequests();
        loadActiveDrifts();
    } else {
        showMessage(result.message || '注册失败');
    }
}

async function handlePublish(event) {
    event.preventDefault();
    const book = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        publisher: document.getElementById('bookPublisher').value,
        totalPages: parseInt(document.getElementById('bookTotalPages').value) || 0,
        coverImage: document.getElementById('bookCoverImage').value,
        description: document.getElementById('bookDescription').value,
        ownerId: currentUser.id
    };
    
    const result = await API.publishBook(book);
    if (result.success) {
        showMessage('发布成功');
        closeModal('publishModal');
        loadAvailableBooks();
        loadMyBooks();
    } else {
        showMessage(result.message || '发布失败');
    }
}

async function handleDriftRequest(event) {
    event.preventDefault();
    const bookId = parseInt(document.getElementById('driftBookId').value);
    const returnDate = document.getElementById('driftReturnDate').value;
    
    const result = await API.requestDrift({
        bookId,
        requesterId: currentUser.id,
        returnDate
    });
    
    if (result.success) {
        showMessage('申请成功');
        closeModal('driftModal');
        loadMyRequests();
    } else {
        showMessage(result.message || '申请失败');
    }
}

async function handleCheckin(event) {
    event.preventDefault();
    const driftId = parseInt(document.getElementById('checkinDriftId').value);
    const pagesRead = parseInt(document.getElementById('checkinPagesRead').value);
    const note = document.getElementById('checkinNote').value;
    
    const result = await API.checkin({
        driftId,
        userId: currentUser.id,
        pagesRead,
        note
    });
    
    if (result.success) {
        showMessage('打卡成功');
        loadCheckinHistory(driftId);
        loadActiveDrifts();
        document.getElementById('checkinPagesRead').value = '';
        document.getElementById('checkinNote').value = '';
    } else {
        showMessage(result.message || '打卡失败');
    }
}

async function confirmDrift(driftId) {
    const result = await API.confirmDrift(driftId);
    if (result.success) {
        showMessage('已确认');
        loadReceivedRequests();
        loadMyRequests();
        loadActiveDrifts();
        loadAvailableBooks();
    } else {
        showMessage(result.message || '操作失败');
    }
}

async function rejectDrift(driftId) {
    const result = await API.rejectDrift(driftId);
    if (result.success) {
        showMessage('已拒绝');
        loadReceivedRequests();
        loadMyRequests();
        loadAvailableBooks();
    } else {
        showMessage(result.message || '操作失败');
    }
}

async function completeDrift(driftId) {
    if (!confirm('确认图书已归还？')) return;
    const result = await API.completeDrift(driftId);
    if (result.success) {
        showMessage('归还成功');
        loadReceivedRequests();
        loadMyRequests();
        loadActiveDrifts();
        loadAvailableBooks();
    } else {
        showMessage(result.message || '操作失败');
    }
}

async function loadPopularBooksPreview() {
    const result = await API.getPopularBooks();
    if (result.success && result.data && result.data.length > 0) {
        const books = result.data.slice(0, 4);
        renderBooks('popularBooksPreview', books);
    } else {
        document.getElementById('popularBooksPreview').innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><p>暂无热门图书</p></div>';
    }
}

async function loadAvailableBooks() {
    const result = await API.getAvailableBooks();
    if (result.success) {
        renderBooks('booksList', result.data);
    }
}

async function loadPopularBooks() {
    const result = await API.getPopularBooks();
    if (result.success) {
        renderPopularBooks('popularBooksList', result.data);
    }
}

async function loadMyBooks() {
    if (!currentUser) return;
    const result = await API.getMyBooks(currentUser.id);
    if (result.success) {
        renderBooks('myBooksList', result.data, true);
    }
}

async function loadMyRequests() {
    if (!currentUser) return;
    const result = await API.getMyRequests(currentUser.id);
    if (result.success) {
        renderRequests('myRequestsList', result.data, false);
    }
}

async function loadReceivedRequests() {
    if (!currentUser) return;
    const result = await API.getReceivedRequests(currentUser.id);
    if (result.success) {
        renderRequests('receivedRequestsList', result.data, true);
    }
}

async function loadActiveDrifts() {
    if (!currentUser) return;
    const result = await API.getActiveDrifts(currentUser.id);
    if (result.success) {
        renderActiveDrifts('activeDriftsList', result.data);
    }
}

async function loadCheckinHistory(driftId) {
    const result = await API.getCheckinsByDrift(driftId);
    if (result.success) {
        renderCheckinHistory(result.data);
    }
}

function renderBooks(containerId, books, isMyBooks = false) {
    const container = document.getElementById(containerId);
    if (!books || books.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><p>暂无图书</p></div>';
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-card">
            <div class="book-cover">
                ${book.coverImage ? `<img src="${book.coverImage}" alt="${book.title}" style="width:100%;height:100%;object-fit:cover;">` : '📖'}
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author || '未知作者'}</p>
                <div class="book-meta">
                    <span class="book-owner">发布者: ${book.ownerName || '未知'}</span>
                    <span class="book-status status-${book.status.toLowerCase()}">${getStatusText(book.status)}</span>
                </div>
                <div class="book-stats">
                    <span>👁 ${book.totalCheckins || 0} 次打卡</span>
                    <span>📊 ${(book.avgProgress || 0).toFixed(1)}% 平均进度</span>
                </div>
                ${!isMyBooks && book.status === 'AVAILABLE' && currentUser ? 
                    `<div class="book-actions">
                        <button onclick="showDriftModal(${book.id}, '${book.title}')" class="btn btn-primary btn-sm">申请漂流</button>
                    </div>` : ''}
            </div>
        </div>
    `).join('');
}

function renderPopularBooks(containerId, books) {
    const container = document.getElementById(containerId);
    if (!books || books.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏆</div><p>暂无排行数据</p></div>';
        return;
    }
    
    container.innerHTML = books.map((book, index) => `
        <div class="popular-item">
            <div class="popular-rank ${index < 3 ? `rank-${index + 1}` : 'rank-other'}">${index + 1}</div>
            <div class="popular-book-info">
                <div class="popular-book-title">${book.title}</div>
                <div class="popular-book-author">${book.author || '未知作者'}</div>
            </div>
            <div class="popular-stats">
                <div class="popular-checkins">${book.borrowCount || 0}</div>
                <div class="popular-checkins-label">次借阅</div>
            </div>
        </div>
    `).join('');
}

function renderRequests(containerId, requests, isReceived = false) {
    const container = document.getElementById(containerId);
    if (!requests || requests.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>暂无申请记录</p></div>';
        return;
    }
    
    container.innerHTML = requests.map(req => `
        <div class="request-item">
            <div class="request-header">
                <span class="request-book">${req.bookTitle}</span>
                <span class="request-status status-${req.status.toLowerCase()}">${getStatusText(req.status)}</span>
            </div>
            <div class="request-meta">
                ${isReceived ? `申请人: ${req.requesterName}` : `图书主人: ${req.ownerName}`}
                <br>申请时间: ${formatDate(req.requestTime)}
                ${req.returnDate ? `<br>预约归还: ${req.returnDate}` : ''}
            </div>
            ${isReceived && req.status === 'PENDING' ? `
                <div class="request-actions">
                    <button onclick="confirmDrift(${req.id})" class="btn btn-success btn-sm">确认</button>
                    <button onclick="rejectDrift(${req.id})" class="btn btn-danger btn-sm">拒绝</button>
                </div>
            ` : ''}
            ${!isReceived && req.status === 'DRIFTING' ? `
                <div class="request-actions">
                    <button onclick="showCheckinModal(${req.id}, '${req.bookTitle}')" class="btn btn-primary btn-sm">去打卡</button>
                </div>
            ` : ''}
            ${isReceived && req.status === 'DRIFTING' ? `
                <div class="request-actions">
                    <button onclick="completeDrift(${req.id})" class="btn btn-success btn-sm">确认归还</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderActiveDrifts(containerId, drifts) {
    const container = document.getElementById(containerId);
    if (!drifts || drifts.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📖</div><p>暂无正在漂流的图书</p></div>';
        return;
    }
    
    container.innerHTML = drifts.map(drift => `
        <div class="checkin-card">
            <div class="checkin-header">
                <span class="checkin-book-title">${drift.bookTitle}</span>
                <button onclick="showCheckinModal(${drift.id}, '${drift.bookTitle}')" class="btn btn-primary btn-sm">今日打卡</button>
            </div>
            <div class="checkin-progress">
                <div class="checkin-progress-bar" style="width: 0%"></div>
            </div>
            <div class="checkin-progress-text">归还日期: ${drift.returnDate || '未设置'}</div>
        </div>
    `).join('');
}

function renderCheckinHistory(checkins) {
    const container = document.getElementById('checkinHistory');
    if (!checkins || checkins.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;">暂无打卡记录</p>';
        return;
    }
    
    container.innerHTML = `
        <h4>打卡历史</h4>
        ${checkins.map(checkin => `
            <div class="checkin-history-item">
                <div class="checkin-history-date">${formatDate(checkin.checkinDate || checkin.createTime)}</div>
                <div class="checkin-history-pages">阅读了 ${checkin.pagesRead} 页</div>
                ${checkin.note ? `<div class="checkin-history-note">${checkin.note}</div>` : ''}
            </div>
        `).join('')}
    `;
}

function getStatusText(status) {
    const statusMap = {
        'AVAILABLE': '可漂流',
        'DRIFTING': '漂流中',
        'PENDING': '待确认',
        'COMPLETED': '已完成',
        'REJECTED': '已拒绝'
    };
    return statusMap[status] || status;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
}

function showMessage(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        z-index: 9999;
        animation: fadeInOut 2s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(style);

init();
