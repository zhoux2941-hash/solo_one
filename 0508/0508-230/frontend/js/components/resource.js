let resCurrentPage = 1;
let resKeyword = '';
let resCategoryId = '';
let resStatus = '';

function loadResourcePage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">业态资源管理</div>
                <button class="btn btn-primary" onclick="showResModal()">+ 新增资源</button>
            </div>
            <div class="filter-bar">
                <div class="filter-item">
                    <label class="filter-label">关键词</label>
                    <input type="text" class="filter-input" id="resKeyword" placeholder="资源名称/编码">
                </div>
                <div class="filter-item">
                    <label class="filter-label">业态分类</label>
                    <select class="filter-input" id="resCatFilter">
                        <option value="">全部</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label class="filter-label">状态</label>
                    <select class="filter-input" id="resStatusFilter">
                        <option value="">全部</option>
                        <option value="开放">开放</option>
                        <option value="维护中">维护中</option>
                        <option value="关闭">关闭</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="searchRes()">搜索</button>
                <button class="btn btn-default" onclick="resetResSearch()">重置</button>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>资源编码</th>
                        <th>资源名称</th>
                        <th>业态分类</th>
                        <th>位置</th>
                        <th>容纳上限</th>
                        <th>收费标准</th>
                        <th>运维负责人</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="resTableBody"></tbody>
            </table>
            <div class="pagination" id="resPagination"></div>
        </div>

        <div class="modal" id="resModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title" id="resModalTitle">新增资源</div>
                    <button class="modal-close" onclick="closeResModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="resForm">
                        <input type="hidden" name="id" id="resId">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">资源编码 <span style="color: #f56c6c;">*</span></label>
                                <input type="text" name="resourceCode" id="resourceCode" class="form-input" placeholder="请输入资源编码">
                                <div id="resourceCode_error" class="error-message"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">资源名称 <span style="color: #f56c6c;">*</span></label>
                                <input type="text" name="resourceName" id="resourceName" class="form-input" placeholder="请输入资源名称">
                                <div id="resourceName_error" class="error-message"></div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">业态分类 <span style="color: #f56c6c;">*</span></label>
                                <select name="categoryId" id="resCategory" class="form-input">
                                    <option value="">请选择</option>
                                </select>
                                <div id="categoryId_error" class="error-message"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">位置</label>
                                <input type="text" name="location" id="location" class="form-input" placeholder="请输入位置">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">开放时间</label>
                                <input type="time" name="openTime" id="openTime" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">关闭时间</label>
                                <input type="time" name="closeTime" id="closeTime" class="form-input">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">容纳上限</label>
                                <input type="number" name="capacity" id="capacity" class="form-input" placeholder="请输入容纳上限">
                            </div>
                            <div class="form-group">
                                <label class="form-label">收费标准（元）</label>
                                <input type="number" step="0.01" name="price" id="price" class="form-input" placeholder="请输入收费标准">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">收费说明</label>
                                <input type="text" name="chargeStandard" id="chargeStandard" class="form-input" placeholder="请输入收费说明">
                            </div>
                            <div class="form-group">
                                <label class="form-label">运维负责人</label>
                                <select name="managerId" id="resManager" class="form-input">
                                    <option value="">请选择</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <select name="status" id="resStatus" class="form-input">
                                <option value="开放">开放</option>
                                <option value="维护中">维护中</option>
                                <option value="关闭">关闭</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">资源描述</label>
                            <textarea name="description" id="description" class="form-input" rows="3" placeholder="请输入资源描述"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" onclick="closeResModal()">取消</button>
                    <button class="btn btn-primary" onclick="saveRes()">保存</button>
                </div>
            </div>
        </div>
    `;

    loadCatOptions();
    loadEmpOptions();
    loadResList();
}

function loadCatOptions() {
    Request.get('/api/category/active').then(res => {
        if (res.code === 200) {
            Common.renderSelect('resCatFilter', res.data, 'id', 'categoryName');
            Common.renderSelect('resCategory', res.data, 'id', 'categoryName');
        }
    });
}

function loadEmpOptions() {
    Request.get('/api/employee/list').then(res => {
        if (res.code === 200) {
            const activeEmps = res.data.filter(emp => emp.status === '在职');
            Common.renderSelect('resManager', activeEmps, 'id', 'name');
        }
    });
}

function loadResList() {
    Request.get('/api/resource/page', {
        keyword: resKeyword,
        categoryId: resCategoryId,
        status: resStatus,
        page: resCurrentPage,
        size: 10
    }).then(res => {
        if (res.code === 200) {
            const pageData = res.data;
            const tbody = document.getElementById('resTableBody');
            if (tbody) {
                if (!pageData.content || pageData.content.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" class="no-data">暂无数据</td></tr>';
                } else {
                    tbody.innerHTML = pageData.content.map(row => `
                        <tr>
                            <td>${row.resourceCode}</td>
                            <td>${row.resourceName}</td>
                            <td>${row.category ? row.category.categoryName : '-'}</td>
                            <td>${row.location || '-'}</td>
                            <td>${row.capacity || '-'}</td>
                            <td>${row.price ? '¥' + row.price : '-'}</td>
                            <td>${row.manager ? row.manager.name : '-'}</td>
                            <td>${row.status === '开放' ? '<span style="color: #67c23a;">开放</span>' : 
                                row.status === '维护中' ? '<span style="color: #e6a23c;">维护中</span>' : 
                                '<span style="color: #f56c6c;">关闭</span>'}</td>
                            <td>
                                <button class="btn btn-primary btn-small" onclick="editRes(${row.id})">编辑</button>
                                <button class="btn btn-danger btn-small" onclick="deleteRes(${row.id})">删除</button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
            renderResPagination(pageData.number + 1, pageData.totalPages);
        }
    }).catch(err => {
        console.error('加载资源列表失败:', err);
        Common.showToast('加载失败', 'error');
    });
}

function renderResPagination(page, totalPages) {
    const pagination = document.getElementById('resPagination');
    if (!pagination) return;
    
    if (!totalPages || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<span>共 ' + totalPages + ' 页</span>';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goResPage(${page - 1})">上一页</button>`;

    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goResPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goResPage(${page + 1})">下一页</button>`;
    pagination.innerHTML = html;
}

function goResPage(page) {
    resCurrentPage = page;
    loadResList();
}

function searchRes() {
    resKeyword = document.getElementById('resKeyword').value;
    resCategoryId = document.getElementById('resCatFilter').value;
    resStatus = document.getElementById('resStatusFilter').value;
    resCurrentPage = 1;
    loadResList();
}

function resetResSearch() {
    document.getElementById('resKeyword').value = '';
    document.getElementById('resCatFilter').value = '';
    document.getElementById('resStatusFilter').value = '';
    resKeyword = '';
    resCategoryId = '';
    resStatus = '';
    resCurrentPage = 1;
    loadResList();
}

function showResModal() {
    document.getElementById('resModalTitle').textContent = '新增资源';
    Common.clearForm('resForm');
    document.getElementById('resModal').style.display = 'flex';
}

function closeResModal() {
    document.getElementById('resModal').style.display = 'none';
}

function editRes(id) {
    Request.get('/api/resource/' + id).then(res => {
        if (res.code === 200) {
            document.getElementById('resModalTitle').textContent = '编辑资源';
            const data = res.data;
            document.getElementById('resId').value = data.id;
            document.getElementById('resourceCode').value = data.resourceCode;
            document.getElementById('resourceName').value = data.resourceName;
            document.getElementById('resCategory').value = data.category ? data.category.id : '';
            document.getElementById('location').value = data.location || '';
            document.getElementById('openTime').value = data.openTime || '';
            document.getElementById('closeTime').value = data.closeTime || '';
            document.getElementById('capacity').value = data.capacity || '';
            document.getElementById('price').value = data.price || '';
            document.getElementById('chargeStandard').value = data.chargeStandard || '';
            document.getElementById('resManager').value = data.manager ? data.manager.id : '';
            document.getElementById('resStatus').value = data.status || '开放';
            document.getElementById('description').value = data.description || '';
            document.getElementById('resModal').style.display = 'flex';
        }
    });
}

function saveRes() {
    const formData = Common.getFormData('resForm');
    console.log('保存资源数据:', formData);
    
    const schema = {
        resourceCode: [{ rule: 'required', message: '请输入资源编码' }],
        resourceName: [{ rule: 'required', message: '请输入资源名称' }],
        categoryId: [{ rule: 'required', message: '请选择业态分类' }]
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
        resourceCode: formData.resourceCode,
        resourceName: formData.resourceName,
        location: formData.location,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        chargeStandard: formData.chargeStandard,
        status: formData.status,
        description: formData.description,
        category: { id: parseInt(formData.categoryId) },
        manager: formData.managerId ? { id: parseInt(formData.managerId) } : null
    };

    if (formData.id) {
        submitData.id = parseInt(formData.id);
    }

    console.log('提交数据:', submitData);

    Request.post('/api/resource', submitData).then(res => {
        console.log('保存响应:', res);
        if (res.code === 200) {
            Common.showToast('保存成功');
            closeResModal();
            loadResList();
        } else {
            Common.showToast(res.message || '保存失败', 'error');
        }
    }).catch(err => {
        console.error('保存错误:', err);
        Common.showToast('保存失败，请检查网络', 'error');
    });
}

function deleteRes(id) {
    Common.showConfirm('确定要删除该资源吗？', () => {
        Request.delete('/api/resource/' + id).then(res => {
            console.log('删除响应:', res);
            if (res.code === 200) {
                Common.showToast('删除成功');
                loadResList();
            } else {
                Common.showToast(res.message || '删除失败', 'error');
            }
        }).catch(err => {
            console.error('删除错误:', err);
            Common.showToast('删除失败，请检查网络', 'error');
        });
    });
}
