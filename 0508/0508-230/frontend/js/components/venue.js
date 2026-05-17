let venueCurrentPage = 1;
let venueKeyword = '';

function loadVenuePage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">场地资源管理</div>
                <button class="btn btn-primary" onclick="showVenueModal()">+ 新增场地</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="venueKeyword" placeholder="场地编码/名称">
                </div>
                <div class="filter-item">
                    <label class="filter-label">状态</label>
                    <select class="filter-input" id="venueStatusFilter">
                        <option value="">全部</option>
                        <option value="开放">开放</option>
                        <option value="关闭">关闭</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label class="filter-label">类型</label>
                    <select class="filter-input" id="venueTypeFilter">
                        <option value="">全部</option>
                        <option value="宴会厅">宴会厅</option>
                        <option value="露营场地">露营场地</option>
                        <option value="表演舞台">表演舞台</option>
                        <option value="会议室">会议室</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="searchVenue()">搜索</button>
                <button class="btn btn-default" onclick="resetVenueSearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>场地编码</th>
                        <th>场地名称</th>
                        <th>类型</th>
                        <th>位置</th>
                        <th>容纳人数</th>
                        <th>小时费率</th>
                        <th>日费率</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="venueTableBody"></tbody>
            </table>
            <div class="pagination" id="venuePagination"></div>
        </div>

        <div class="modal" id="venueModal" style="display: none;">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <div class="modal-title" id="venueModalTitle">新增场地</div>
                    <button class="modal-close" onclick="closeVenueModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="venueForm">
                        <input type="hidden" id="venueId">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">场地名称 <span style="color: #f56c6c;">*</span></label>
                                <input type="text" name="venueName" class="form-input" placeholder="请输入场地名称">
                            </div>
                            <div class="form-group">
                                <label class="form-label">场地类型</label>
                                <select name="venueType" class="form-input">
                                    <option value="">请选择类型</option>
                                    <option value="宴会厅">宴会厅</option>
                                    <option value="露营场地">露营场地</option>
                                    <option value="表演舞台">表演舞台</option>
                                    <option value="会议室">会议室</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">位置</label>
                                <input type="text" name="location" class="form-input" placeholder="请输入位置">
                            </div>
                            <div class="form-group">
                                <label class="form-label">容纳人数</label>
                                <input type="number" name="capacity" class="form-input" placeholder="请输入容纳人数">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">小时费率（元）</label>
                                <input type="number" name="hourlyRate" class="form-input" step="0.01" placeholder="请输入小时费率">
                            </div>
                            <div class="form-group">
                                <label class="form-label">日费率（元）</label>
                                <input type="number" name="dailyRate" class="form-input" step="0.01" placeholder="请输入日费率">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">配套设施</label>
                            <input type="text" name="facilities" class="form-input" placeholder="请输入配套设施">
                        </div>
                        <div class="form-group">
                            <label class="form-label">描述</label>
                            <textarea name="description" class="form-input" rows="3" placeholder="请输入描述"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">状态</label>
                                <select name="status" class="form-input">
                                    <option value="开放">开放</option>
                                    <option value="关闭">关闭</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">备注</label>
                            <textarea name="remark" class="form-input" rows="2" placeholder="请输入备注"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeVenueModal()">取消</button>
                    <button class="btn btn-primary" onclick="submitVenue()">保存</button>
                </div>
            </div>
        </div>
    `;

    loadVenueList();
}

function loadVenueList() {
    const status = document.getElementById('venueStatusFilter') ? document.getElementById('venueStatusFilter').value : '';
    const venueType = document.getElementById('venueTypeFilter') ? document.getElementById('venueTypeFilter').value : '';
    
    Request.get('/api/venue/page', {
        keyword: venueKeyword,
        status: status,
        venueType: venueType,
        page: venueCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const tbody = document.getElementById('venueTableBody');
            if (tbody) {
                if (!pageData.content || pageData.content.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" class="no-data">暂无数据</td></tr>';
                } else {
                    tbody.innerHTML = pageData.content.map(row => `
                        <tr>
                            <td>${row.venueCode}</td>
                            <td>${row.venueName}</td>
                            <td>${row.venueType || '-'}</td>
                            <td>${row.location || '-'}</td>
                            <td>${row.capacity || '-'}</td>
                            <td>${row.hourlyRate || '-'}</td>
                            <td>${row.dailyRate || '-'}</td>
                            <td>${getStatusLabel(row.status)}</td>
                            <td>
                                <button class="btn btn-primary btn-small" onclick="editVenue(${row.id})">编辑</button>
                                <button class="btn btn-danger btn-small" onclick="deleteVenue(${row.id})">删除</button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
            renderVenuePagination(pageData.number + 1, pageData.totalPages);
        }
    }).catch(err => {
        console.error('加载场地列表失败:', err);
        Common.showToast('加载失败', 'error');
    });
}

function getStatusLabel(status) {
    switch(status) {
        case '开放':
            return '<span style="color: #67c23a;">开放</span>';
        case '关闭':
            return '<span style="color: #f56c6c;">关闭</span>';
        default:
            return status;
    }
}

function renderVenuePagination(page, totalPages) {
    const pagination = document.getElementById('venuePagination');
    if (!pagination) return;
    
    if (!totalPages || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goVenuePage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goVenuePage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goVenuePage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goVenuePage(page) {
    venueCurrentPage = page;
    loadVenueList();
}

function searchVenue() {
    venueKeyword = document.getElementById('venueKeyword').value;
    venueCurrentPage = 1;
    loadVenueList();
}

function resetVenueSearch() {
    document.getElementById('venueKeyword').value = '';
    document.getElementById('venueStatusFilter').value = '';
    document.getElementById('venueTypeFilter').value = '';
    venueKeyword = '';
    venueCurrentPage = 1;
    loadVenueList();
}

function showVenueModal() {
    document.getElementById('venueModalTitle').textContent = '新增场地';
    document.getElementById('venueId').value = '';
    Common.clearForm('venueForm');
    document.getElementById('venueModal').style.display = 'flex';
}

function closeVenueModal() {
    document.getElementById('venueModal').style.display = 'none';
}

function editVenue(id) {
    Request.get('/api/venue/' + id).then(res => {
        if (res.code === 200) {
            const data = res.data;
            document.getElementById('venueModalTitle').textContent = '编辑场地';
            document.getElementById('venueId').value = data.id;
            Common.setFormData('venueForm', data);
            document.getElementById('venueModal').style.display = 'flex';
        }
    }).catch(err => {
        console.error('获取场地信息失败:', err);
        Common.showToast('获取信息失败', 'error');
    });
}

function submitVenue() {
    const formData = Common.getFormData('venueForm');
    const venueId = document.getElementById('venueId').value;

    if (!formData.venueName) {
        Common.showToast('请输入场地名称', 'error');
        return;
    }

    const submitData = {
        venueName: formData.venueName,
        venueType: formData.venueType,
        location: formData.location,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : null,
        facilities: formData.facilities,
        description: formData.description,
        status: formData.status,
        remark: formData.remark
    };

    const promise = venueId ? 
        Request.put('/api/venue/' + venueId, submitData) : 
        Request.post('/api/venue', submitData);

    promise.then(res => {
        if (res.code === 200) {
            Common.showToast(venueId ? '更新成功' : '创建成功');
            closeVenueModal();
            loadVenueList();
        } else {
            Common.showToast(res.message || '操作失败', 'error');
        }
    }).catch(err => {
        console.error('提交失败:', err);
        Common.showToast('操作失败，请检查网络', 'error');
    });
}

function deleteVenue(id) {
    Common.showConfirm('确定要删除该场地吗？', () => {
        Request.delete('/api/venue/' + id).then(res => {
            if (res.code === 200) {
                Common.showToast('删除成功');
                loadVenueList();
            } else {
                Common.showToast(res.message || '删除失败', 'error');
            }
        }).catch(err => {
            console.error('删除失败:', err);
            Common.showToast('删除失败，请检查网络', 'error');
        });
    });
}
