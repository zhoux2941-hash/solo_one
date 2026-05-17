let announcementsCurrentPage = 1;
let announcementsPageSize = 10;
let announcementsTotalPages = 1;

function initAnnouncementsPage() {
    document.getElementById('page-announcements').innerHTML = `
        <div class="card">
            <div class="page-header">
                <h1>公告管理</h1>
                <button class="btn btn-primary" id="addAnnouncementBtn">发布公告</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>标题</th>
                            <th>置顶</th>
                            <th>发布人</th>
                            <th>发布时间</th>
                            <th>有效期至</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="announcementsTableBody"></tbody>
                </table>
            </div>

            <div class="pagination" id="announcementsPagination"></div>
        </div>

        <div class="modal-overlay hidden" id="announcementModal">
            <div class="modal">
                <div class="modal-header">
                    <h2 id="announcementModalTitle">发布公告</h2>
                    <button class="modal-close" id="closeAnnouncementModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="announcementForm">
                        <input type="hidden" id="announcementId">
                        <div class="form-row">
                            <label class="required">标题</label>
                            <input type="text" class="form-control" id="announcementTitle" required>
                        </div>
                        <div class="form-row">
                            <label class="required">内容</label>
                            <textarea class="form-control" id="announcementContent" rows="6" required style="resize: vertical;"></textarea>
                        </div>
                        <div class="form-row">
                            <label>置顶</label>
                            <select class="form-control" id="announcementIsTop">
                                <option value="false">否</option>
                                <option value="true">是</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>有效期至</label>
                            <input type="datetime-local" class="form-control" id="announcementExpireTime">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="cancelAnnouncementBtn">取消</button>
                    <button class="btn btn-primary" id="saveAnnouncementBtn">保存</button>
                </div>
            </div>
        </div>

        <div class="modal-overlay hidden" id="announcementDetailModal">
            <div class="modal" style="max-width: 700px;">
                <div class="modal-header">
                    <h2 id="announcementDetailTitle">公告详情</h2>
                    <button class="modal-close" id="closeAnnouncementDetailModal">&times;</button>
                </div>
                <div class="modal-body" id="announcementDetailContent">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="closeAnnouncementDetailBtn">关闭</button>
                </div>
            </div>
        </div>
    `;

    bindAnnouncementsEvents();
    loadAnnouncements();
}

function bindAnnouncementsEvents() {
    document.getElementById('addAnnouncementBtn').addEventListener('click', () => openAnnouncementModal());
    document.getElementById('closeAnnouncementModal').addEventListener('click', () => closeAnnouncementModal());
    document.getElementById('cancelAnnouncementBtn').addEventListener('click', () => closeAnnouncementModal());
    document.getElementById('saveAnnouncementBtn').addEventListener('click', saveAnnouncement);
    document.getElementById('closeAnnouncementDetailModal').addEventListener('click', () => closeAnnouncementDetailModal());
    document.getElementById('closeAnnouncementDetailBtn').addEventListener('click', () => closeAnnouncementDetailModal());
}

async function loadAnnouncements() {
    try {
        const params = {
            page: announcementsCurrentPage,
            size: announcementsPageSize
        };

        const result = await api.announcement.list(params);
        announcementsTotalPages = result.data.totalPages;
        renderAnnouncementsTable(result.data.content);
        renderAnnouncementsPagination();
    } catch (error) {
        console.error('Load announcements failed:', error);
    }
}

function renderAnnouncementsTable(announcements) {
    const tbody = document.getElementById('announcementsTableBody');
    
    if (announcements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = announcements.map(ann => `
        <tr>
            <td>${ann.id}</td>
            <td>${ann.isTop ? '<span class="badge badge-warning">置顶</span> ' : ''}${ann.title}</td>
            <td>${ann.isTop ? '是' : '否'}</td>
            <td>${ann.creator ? ann.creator.realName : '-'}</td>
            <td>${formatDateTime(ann.createTime)}</td>
            <td>${ann.expireTime ? formatDateTime(ann.expireTime) : '永久有效'}</td>
            <td>
                <button class="btn btn-primary btn-small" onclick="viewAnnouncement(${ann.id})">查看</button>
                <button class="btn btn-primary btn-small" onclick="editAnnouncement(${ann.id})">编辑</button>
                <button class="btn btn-danger btn-small" onclick="deleteAnnouncement(${ann.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function renderAnnouncementsPagination() {
    const pagination = document.getElementById('announcementsPagination');
    pagination.innerHTML = `
        <button class="btn btn-default btn-small" onclick="goToAnnouncementsPage(${announcementsCurrentPage - 1})" ${announcementsCurrentPage <= 1 ? 'disabled' : ''}>上一页</button>
        <span>第 ${announcementsCurrentPage} / ${announcementsTotalPages} 页</span>
        <button class="btn btn-default btn-small" onclick="goToAnnouncementsPage(${announcementsCurrentPage + 1})" ${announcementsCurrentPage >= announcementsTotalPages ? 'disabled' : ''}>下一页</button>
    `;
}

function goToAnnouncementsPage(page) {
    if (page < 1 || page > announcementsTotalPages) return;
    announcementsCurrentPage = page;
    loadAnnouncements();
}

function openAnnouncementModal(id = null) {
    const modal = document.getElementById('announcementModal');
    const title = document.getElementById('announcementModalTitle');

    if (id) {
        title.textContent = '编辑公告';
        loadAnnouncementDetail(id);
    } else {
        title.textContent = '发布公告';
        document.getElementById('announcementId').value = '';
        document.getElementById('announcementTitle').value = '';
        document.getElementById('announcementContent').value = '';
        document.getElementById('announcementIsTop').value = 'false';
        document.getElementById('announcementExpireTime').value = '';
    }

    modal.classList.remove('hidden');
}

function closeAnnouncementModal() {
    document.getElementById('announcementModal').classList.add('hidden');
}

async function loadAnnouncementDetail(id) {
    try {
        const result = await api.announcement.get(id);
        const ann = result.data.announcement;
        document.getElementById('announcementId').value = ann.id;
        document.getElementById('announcementTitle').value = ann.title;
        document.getElementById('announcementContent').value = ann.content;
        document.getElementById('announcementIsTop').value = String(ann.isTop);
        document.getElementById('announcementExpireTime').value = ann.expireTime ? formatDateTimeLocal(ann.expireTime) : '';
    } catch (error) {
        console.error('Load announcement detail failed:', error);
    }
}

async function saveAnnouncement() {
    const id = document.getElementById('announcementId').value;
    const title = document.getElementById('announcementTitle').value.trim();
    const content = document.getElementById('announcementContent').value.trim();

    if (!title) {
        showToast('请输入标题', 'error');
        document.getElementById('announcementTitle').focus();
        return;
    }

    if (!content) {
        showToast('请输入内容', 'error');
        document.getElementById('announcementContent').focus();
        return;
    }

    const expireTimeValue = document.getElementById('announcementExpireTime').value;
    const data = {
        title: title,
        content: content,
        isTop: document.getElementById('announcementIsTop').value === 'true',
        expireTime: expireTimeValue ? formatDateTimeForApi(expireTimeValue) : null
    };

    try {
        if (id) {
            await api.announcement.update(id, data);
            showToast('更新成功', 'success');
        } else {
            await api.announcement.create(data);
            showToast('发布成功', 'success');
        }
        closeAnnouncementModal();
        loadAnnouncements();
    } catch (error) {
        console.error('Save announcement failed:', error);
    }
}

function editAnnouncement(id) {
    openAnnouncementModal(id);
}

async function viewAnnouncement(id) {
    try {
        const result = await api.announcement.get(id);
        const { announcement, readCount, hasRead } = result.data;

        await api.announcement.markAsRead(id);

        document.getElementById('announcementDetailTitle').textContent = announcement.title;
        document.getElementById('announcementDetailContent').innerHTML = `
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; margin-right: 20px;">发布人：${announcement.creator ? announcement.creator.realName : '-'}</span>
                <span style="color: #6b7280; margin-right: 20px;">发布时间：${formatDateTime(announcement.createTime)}</span>
                <span style="color: #6b7280;">阅读人数：${readCount}</span>
            </div>
            <div style="line-height: 1.8; color: #333;">
                ${announcement.content.replace(/\n/g, '<br>')}
            </div>
        `;

        document.getElementById('announcementDetailModal').classList.remove('hidden');
    } catch (error) {
        console.error('View announcement failed:', error);
    }
}

function closeAnnouncementDetailModal() {
    document.getElementById('announcementDetailModal').classList.add('hidden');
}

async function deleteAnnouncement(id) {
    if (!confirm('确定要删除该公告吗？')) return;
    
    try {
        await api.announcement.delete(id);
        showToast('删除成功', 'success');
        loadAnnouncements();
    } catch (error) {
        console.error('Delete announcement failed:', error);
    }
}

async function checkNewAnnouncements() {
    try {
        const result = await api.announcement.unreadCount();
        const count = result.data;
        if (count > 0) {
            showToast(`您有 ${count} 条新公告未读`, 'info');
        }
    } catch (error) {
        console.error('Check new announcements failed:', error);
    }
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';
    const date = new Date(dateTimeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatDateTimeLocal(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTimeForApi(dateTimeLocal) {
    if (!dateTimeLocal) return null;
    const date = new Date(dateTimeLocal);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
}
