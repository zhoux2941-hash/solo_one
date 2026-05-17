let bookingCurrentPage = 1;
let bookingKeyword = '';

function loadVenueBookingPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">场地预约管理</div>
                <button class="btn btn-primary" onclick="showBookingModal()">+ 新增预约</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="bookingKeyword" placeholder="预约编码/申请人">
                </div>
                <div class="filter-item">
                    <label class="filter-label">状态</label>
                    <select class="filter-input" id="bookingStatusFilter">
                        <option value="">全部</option>
                        <option value="待审核">待审核</option>
                        <option value="已通过">已通过</option>
                        <option value="已拒绝">已拒绝</option>
                        <option value="已取消">已取消</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="searchBooking()">搜索</button>
                <button class="btn btn-default" onclick="resetBookingSearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>预约编码</th>
                        <th>场地名称</th>
                        <th>申请人</th>
                        <th>联系电话</th>
                        <th>开始时间</th>
                        <th>结束时间</th>
                        <th>费用</th>
                        <th>状态</th>
                        <th>使用状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="bookingTableBody"></tbody>
            </table>
            <div class="pagination" id="bookingPagination"></div>
        </div>

        <div class="modal" id="bookingModal" style="display: none;">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <div class="modal-title" id="bookingModalTitle">新增预约</div>
                    <button class="modal-close" onclick="closeBookingModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="bookingForm">
                        <input type="hidden" id="bookingId">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">选择场地 <span style="color: #f56c6c;">*</span></label>
                                <select name="venueId" id="bookingVenueId" class="form-input">
                                    <option value="">请选择场地</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">申请人 <span style="color: #f56c6c;">*</span></label>
                                <input type="text" name="applicantName" class="form-input" placeholder="请输入申请人姓名">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">联系电话</label>
                                <input type="text" name="applicantPhone" class="form-input" placeholder="请输入联系电话">
                            </div>
                            <div class="form-group">
                                <label class="form-label">公司/单位</label>
                                <input type="text" name="applicantCompany" class="form-input" placeholder="请输入公司名称">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">开始时间 <span style="color: #f56c6c;">*</span></label>
                                <input type="datetime-local" name="startTime" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">结束时间 <span style="color: #f56c6c;">*</span></label>
                                <input type="datetime-local" name="endTime" class="form-input">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">预计人数</label>
                                <input type="number" name="attendeeCount" class="form-input" placeholder="请输入预计人数">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">使用用途</label>
                            <textarea name="usagePurpose" class="form-input" rows="2" placeholder="请输入使用用途"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">备注</label>
                            <textarea name="remark" class="form-input" rows="2" placeholder="请输入备注"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeBookingModal()">取消</button>
                    <button class="btn btn-primary" onclick="checkConflictAndSubmit()">检查冲突并提交</button>
                </div>
            </div>
        </div>

        <div class="modal" id="auditModal" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <div class="modal-title">审核预约</div>
                    <button class="modal-close" onclick="closeAuditModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="auditForm">
                        <input type="hidden" id="auditBookingId">
                        <div class="form-group">
                            <label class="form-label">审核结果 <span style="color: #f56c6c;">*</span></label>
                            <select name="status" class="form-input">
                                <option value="已通过">通过</option>
                                <option value="已拒绝">拒绝</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">审核意见</label>
                            <textarea name="auditRemark" class="form-input" rows="3" placeholder="请输入审核意见"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeAuditModal()">取消</button>
                    <button class="btn btn-primary" onclick="submitAudit()">确认审核</button>
                </div>
            </div>
        </div>
    `;

    loadBookingList();
    loadVenueOptions();
}

function loadVenueOptions() {
    Request.get('/api/venue/list', { status: '开放' }).then(res => {
        if (res.code === 200) {
            const select = document.getElementById('bookingVenueId');
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">请选择场地</option>' + 
                    res.data.map(v => `<option value="${v.id}">${v.venueName}</option>`).join('');
                select.value = currentValue;
            }
        }
    }).catch(err => {
        console.error('加载场地列表失败:', err);
    });
}

function loadBookingList() {
    const status = document.getElementById('bookingStatusFilter') ? document.getElementById('bookingStatusFilter').value : '';
    
    Request.get('/api/venue-booking/page', {
        keyword: bookingKeyword,
        status: status,
        page: bookingCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const tbody = document.getElementById('bookingTableBody');
            if (tbody) {
                if (!pageData.content || pageData.content.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="10" class="no-data">暂无数据</td></tr>';
                } else {
                    tbody.innerHTML = pageData.content.map(row => `
                        <tr>
                            <td>${row.bookingCode}</td>
                            <td>${row.venue ? row.venue.venueName : '-'}</td>
                            <td>${row.applicantName || '-'}</td>
                            <td>${row.applicantPhone || '-'}</td>
                            <td>${row.startTime ? row.startTime.substring(0, 16) : '-'}</td>
                            <td>${row.endTime ? row.endTime.substring(0, 16) : '-'}</td>
                            <td>${row.totalAmount || '-'}</td>
                            <td>${getBookingStatusLabel(row.status)}</td>
                            <td>${getUsageStatusLabel(row.usageStatus)}</td>
                            <td>
                                ${row.status === '待审核' ? `
                                    <button class="btn btn-primary btn-small" onclick="editBooking(${row.id})">编辑</button>
                                    <button class="btn btn-success btn-small" onclick="showAuditModal(${row.id})">审核</button>
                                    <button class="btn btn-warning btn-small" onclick="cancelBooking(${row.id})">取消</button>
                                ` : ''}
                                ${row.status === '已通过' && row.usageStatus === '未使用' ? `
                                    <button class="btn btn-success btn-small" onclick="checkIn(${row.id})">登记使用</button>
                                    <button class="btn btn-warning btn-small" onclick="cancelBooking(${row.id})">取消</button>
                                ` : ''}
                                ${row.status === '已通过' && row.usageStatus === '已使用' && !row.checkOutTime ? `
                                    <button class="btn btn-info btn-small" onclick="checkOut(${row.id})">结束使用</button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('');
                }
            }
            renderBookingPagination(pageData.number + 1, pageData.totalPages);
        }
    }).catch(err => {
        console.error('加载预约列表失败:', err);
        Common.showToast('加载失败', 'error');
    });
}

function getBookingStatusLabel(status) {
    switch(status) {
        case '待审核':
            return '<span style="color: #e6a23c;">待审核</span>';
        case '已通过':
            return '<span style="color: #67c23a;">已通过</span>';
        case '已拒绝':
            return '<span style="color: #f56c6c;">已拒绝</span>';
        case '已取消':
            return '<span style="color: #909399;">已取消</span>';
        default:
            return status;
    }
}

function getUsageStatusLabel(status) {
    switch(status) {
        case '未使用':
            return '<span style="color: #409eff;">未使用</span>';
        case '已使用':
            return '<span style="color: #67c23a;">已使用</span>';
        default:
            return status;
    }
}

function renderBookingPagination(page, totalPages) {
    const pagination = document.getElementById('bookingPagination');
    if (!pagination) return;
    
    if (!totalPages || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goBookingPage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goBookingPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goBookingPage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goBookingPage(page) {
    bookingCurrentPage = page;
    loadBookingList();
}

function searchBooking() {
    bookingKeyword = document.getElementById('bookingKeyword').value;
    bookingCurrentPage = 1;
    loadBookingList();
}

function resetBookingSearch() {
    document.getElementById('bookingKeyword').value = '';
    document.getElementById('bookingStatusFilter').value = '';
    bookingKeyword = '';
    bookingCurrentPage = 1;
    loadBookingList();
}

function showBookingModal() {
    document.getElementById('bookingModalTitle').textContent = '新增预约';
    document.getElementById('bookingId').value = '';
    Common.clearForm('bookingForm');
    document.getElementById('bookingModal').style.display = 'flex';
}

function closeBookingModal() {
    document.getElementById('bookingModal').style.display = 'none';
}

function editBooking(id) {
    Request.get('/api/venue-booking/' + id).then(res => {
        if (res.code === 200) {
            const data = res.data;
            document.getElementById('bookingModalTitle').textContent = '编辑预约';
            document.getElementById('bookingId').value = data.id;
            Common.setFormData('bookingForm', data);
            if (data.venue) {
                document.getElementById('bookingVenueId').value = data.venue.id;
            }
            if (data.startTime) {
                document.querySelector('[name="startTime"]').value = data.startTime.substring(0, 16);
            }
            if (data.endTime) {
                document.querySelector('[name="endTime"]').value = data.endTime.substring(0, 16);
            }
            document.getElementById('bookingModal').style.display = 'flex';
        }
    }).catch(err => {
        console.error('获取预约信息失败:', err);
        Common.showToast('获取信息失败', 'error');
    });
}

function checkConflictAndSubmit() {
    const formData = Common.getFormData('bookingForm');
    const bookingId = document.getElementById('bookingId').value;

    if (!formData.venueId) {
        Common.showToast('请选择场地', 'error');
        return;
    }
    if (!formData.applicantName) {
        Common.showToast('请输入申请人姓名', 'error');
        return;
    }
    if (!formData.startTime || !formData.endTime) {
        Common.showToast('请选择预约时间段', 'error');
        return;
    }

    const params = {
        venueId: formData.venueId,
        startTime: formData.startTime + ':00',
        endTime: formData.endTime + ':00'
    };
    if (bookingId) {
        params.excludeId = bookingId;
    }

    Request.get('/api/venue-booking/check-conflict', params).then(res => {
        if (res.code === 200) {
            if (res.data) {
                Common.showToast('该时间段已被预约，请选择其他时间', 'error');
            } else {
                submitBooking();
            }
        }
    }).catch(err => {
        console.error('检查冲突失败:', err);
        Common.showToast('检查冲突失败', 'error');
    });
}

function submitBooking() {
    const formData = Common.getFormData('bookingForm');
    const bookingId = document.getElementById('bookingId').value;

    const submitData = {
        venueId: parseInt(formData.venueId),
        applicantName: formData.applicantName,
        applicantPhone: formData.applicantPhone,
        applicantCompany: formData.applicantCompany,
        startTime: formData.startTime + ':00',
        endTime: formData.endTime + ':00',
        attendeeCount: formData.attendeeCount ? parseInt(formData.attendeeCount) : null,
        usagePurpose: formData.usagePurpose,
        remark: formData.remark
    };

    const promise = bookingId ? 
        Request.put('/api/venue-booking/' + bookingId, submitData) : 
        Request.post('/api/venue-booking', submitData);

    promise.then(res => {
        if (res.code === 200) {
            Common.showToast(bookingId ? '更新成功' : '预约申请提交成功');
            closeBookingModal();
            loadBookingList();
        } else {
            Common.showToast(res.message || '操作失败', 'error');
        }
    }).catch(err => {
        console.error('提交失败:', err);
        Common.showToast('操作失败，请检查网络', 'error');
    });
}

function showAuditModal(id) {
    document.getElementById('auditBookingId').value = id;
    Common.clearForm('auditForm');
    document.getElementById('auditModal').style.display = 'flex';
}

function closeAuditModal() {
    document.getElementById('auditModal').style.display = 'none';
}

function submitAudit() {
    const id = document.getElementById('auditBookingId').value;
    const formData = Common.getFormData('auditForm');

    Request.post('/api/venue-booking/audit/' + id, {
        status: formData.status,
        auditRemark: formData.auditRemark
    }).then(res => {
        if (res.code === 200) {
            Common.showToast('审核完成');
            closeAuditModal();
            loadBookingList();
        } else {
            Common.showToast(res.message || '审核失败', 'error');
        }
    }).catch(err => {
        console.error('审核失败:', err);
        Common.showToast('审核失败，请检查网络', 'error');
    });
}

function cancelBooking(id) {
    Common.showConfirm('确定要取消该预约吗？', () => {
        Request.post('/api/venue-booking/cancel/' + id).then(res => {
            if (res.code === 200) {
                Common.showToast('取消成功');
                loadBookingList();
            } else {
                Common.showToast(res.message || '取消失败', 'error');
            }
        }).catch(err => {
            console.error('取消失败:', err);
            Common.showToast('取消失败，请检查网络', 'error');
        });
    });
}

function checkIn(id) {
    Common.showConfirm('确定要登记使用吗？', () => {
        Request.post('/api/venue-booking/checkin/' + id).then(res => {
            if (res.code === 200) {
                Common.showToast('登记使用成功');
                loadBookingList();
            } else {
                Common.showToast(res.message || '操作失败', 'error');
            }
        }).catch(err => {
            console.error('操作失败:', err);
            Common.showToast('操作失败，请检查网络', 'error');
        });
    });
}

function checkOut(id) {
    Common.showConfirm('确定要结束使用吗？', () => {
        Request.post('/api/venue-booking/checkout/' + id).then(res => {
            if (res.code === 200) {
                Common.showToast('结束使用成功');
                loadBookingList();
            } else {
                Common.showToast(res.message || '操作失败', 'error');
            }
        }).catch(err => {
            console.error('操作失败:', err);
            Common.showToast('操作失败，请检查网络', 'error');
        });
    });
}
