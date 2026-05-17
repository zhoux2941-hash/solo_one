let positionsCurrentPage = 1;
let positionsPageSize = 10;
let positionsTotalPages = 1;

function initPositionsPage() {
    document.getElementById('page-positions').innerHTML = `
        <div class="card">
            <div class="page-header">
                <h1>岗位管理</h1>
                <button class="btn btn-primary" id="addPositionBtn">新增岗位</button>
            </div>
            
            <div class="search-bar">
                <div class="form-group">
                    <label>岗位名称</label>
                    <input type="text" class="form-control" id="searchPositionName" placeholder="请输入岗位名称">
                </div>
                <div class="form-group">
                    <label>岗位等级</label>
                    <select class="form-control" id="searchPositionLevel">
                        <option value="">全部</option>
                        <option value="初级">初级</option>
                        <option value="中级">中级</option>
                        <option value="高级">高级</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>所属部门</label>
                    <select class="form-control" id="searchPositionDept">
                        <option value="">全部</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="searchPositionBtn">搜索</button>
                <button class="btn btn-default" id="resetPositionSearchBtn">重置</button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>岗位名称</th>
                            <th>岗位等级</th>
                            <th>所属部门</th>
                            <th>人数</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="positionsTableBody"></tbody>
                </table>
            </div>

            <div class="pagination" id="positionsPagination"></div>
        </div>

        <div class="modal-overlay hidden" id="positionModal">
            <div class="modal">
                <div class="modal-header">
                    <h2 id="positionModalTitle">新增岗位</h2>
                    <button class="modal-close" id="closePositionModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="positionForm">
                        <input type="hidden" id="positionId">
                        <div class="form-row">
                            <label class="required">岗位名称</label>
                            <input type="text" class="form-control" id="positionName" required>
                        </div>
                        <div class="form-row">
                            <label>岗位等级</label>
                            <select class="form-control" id="positionLevel">
                                <option value="">请选择</option>
                                <option value="初级">初级</option>
                                <option value="中级">中级</option>
                                <option value="高级">高级</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>所属部门</label>
                            <select class="form-control" id="positionDepartmentId">
                                <option value="">无</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>岗位描述</label>
                            <textarea class="form-control" id="positionDescription" rows="3"></textarea>
                        </div>
                        <div class="form-row">
                            <label>状态</label>
                            <select class="form-control" id="positionEnabled">
                                <option value="true">启用</option>
                                <option value="false">禁用</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="cancelPositionBtn">取消</button>
                    <button class="btn btn-primary" id="savePositionBtn">保存</button>
                </div>
            </div>
        </div>

        <div class="modal-overlay hidden" id="positionDetailModal">
            <div class="modal modal-large">
                <div class="modal-header">
                    <h2>岗位详情</h2>
                    <button class="modal-close" id="closePositionDetailModal">&times;</button>
                </div>
                <div class="modal-body" id="positionDetailBody"></div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="closePositionDetailBtn">关闭</button>
                </div>
            </div>
        </div>
    `;

    bindPositionsEvents();
    loadDepartmentsForPositionSearch();
    loadDepartmentsForPositionForm();
    loadPositions();
}

function bindPositionsEvents() {
    document.getElementById('addPositionBtn').addEventListener('click', () => openPositionModal());
    document.getElementById('searchPositionBtn').addEventListener('click', () => {
        positionsCurrentPage = 1;
        loadPositions();
    });
    document.getElementById('resetPositionSearchBtn').addEventListener('click', () => {
        document.getElementById('searchPositionName').value = '';
        document.getElementById('searchPositionLevel').value = '';
        document.getElementById('searchPositionDept').value = '';
        positionsCurrentPage = 1;
        loadPositions();
    });
    document.getElementById('closePositionModal').addEventListener('click', () => closePositionModal());
    document.getElementById('cancelPositionBtn').addEventListener('click', () => closePositionModal());
    document.getElementById('savePositionBtn').addEventListener('click', savePosition);
    document.getElementById('closePositionDetailModal').addEventListener('click', () => closePositionDetailModal());
    document.getElementById('closePositionDetailBtn').addEventListener('click', () => closePositionDetailModal());
}

function loadDepartmentsForPositionSearch() {
    try {
        const select = document.getElementById('searchPositionDept');
        renderDepartmentSelect(select, true);
    } catch (error) {
        console.error('Load departments for search failed:', error);
    }
}

function loadDepartmentsForPositionForm() {
    try {
        const select = document.getElementById('positionDepartmentId');
        renderDepartmentSelect(select, true);
    } catch (error) {
        console.error('Load departments for form failed:', error);
    }
}

function refreshPositionDepartmentSelects() {
    loadDepartmentsForPositionSearch();
    loadDepartmentsForPositionForm();
}

async function loadPositions() {
    try {
        const params = {
            page: positionsCurrentPage,
            size: positionsPageSize
        };
        
        const name = document.getElementById('searchPositionName').value;
        const level = document.getElementById('searchPositionLevel').value;
        const departmentId = document.getElementById('searchPositionDept').value;
        
        if (name) params.name = name;
        if (level) params.level = level;
        if (departmentId) params.departmentId = departmentId;

        const result = await api.position.list(params);
        positionsTotalPages = result.data.totalPages;
        
        const positions = result.data.content;
        for (let position of positions) {
            const stats = await api.position.statistics(position.id);
            position.employeeCount = stats.data.employeeCount;
        }
        
        renderPositionsTable(positions);
        renderPositionsPagination();
    } catch (error) {
        console.error('Load positions failed:', error);
    }
}

function renderPositionsTable(positions) {
    const tbody = document.getElementById('positionsTableBody');
    
    if (positions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = positions.map(position => `
        <tr>
            <td>${position.id}</td>
            <td>${position.name}</td>
            <td>${position.level || '-'}</td>
            <td>${position.department ? position.department.name : '-'}</td>
            <td>${position.employeeCount || 0}</td>
            <td><span class="status-badge ${position.enabled ? 'status-enabled' : 'status-disabled'}">${position.enabled ? '启用' : '禁用'}</span></td>
            <td>
                <button class="btn btn-primary btn-small" onclick="viewPositionDetail(${position.id})">详情</button>
                <button class="btn btn-primary btn-small" onclick="editPosition(${position.id})">编辑</button>
                <button class="btn btn-warning btn-small" onclick="togglePositionStatus(${position.id}, ${position.enabled})">${position.enabled ? '禁用' : '启用'}</button>
                <button class="btn btn-danger btn-small" onclick="deletePosition(${position.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function renderPositionsPagination() {
    const pagination = document.getElementById('positionsPagination');
    pagination.innerHTML = `
        <button class="btn btn-default btn-small" onclick="goToPositionsPage(${positionsCurrentPage - 1})" ${positionsCurrentPage <= 1 ? 'disabled' : ''}>上一页</button>
        <span>第 ${positionsCurrentPage} / ${positionsTotalPages} 页</span>
        <button class="btn btn-default btn-small" onclick="goToPositionsPage(${positionsCurrentPage + 1})" ${positionsCurrentPage >= positionsTotalPages ? 'disabled' : ''}>下一页</button>
    `;
}

function goToPositionsPage(page) {
    if (page < 1 || page > positionsTotalPages) return;
    positionsCurrentPage = page;
    loadPositions();
}

function openPositionModal(positionId = null) {
    const modal = document.getElementById('positionModal');
    const title = document.getElementById('positionModalTitle');

    if (positionId) {
        title.textContent = '编辑岗位';
        loadPositionDetail(positionId);
    } else {
        title.textContent = '新增岗位';
        document.getElementById('positionId').value = '';
        document.getElementById('positionName').value = '';
        document.getElementById('positionLevel').value = '';
        document.getElementById('positionDepartmentId').value = '';
        document.getElementById('positionDescription').value = '';
        document.getElementById('positionEnabled').value = 'true';
    }

    modal.classList.remove('hidden');
}

function closePositionModal() {
    document.getElementById('positionModal').classList.add('hidden');
}

async function loadPositionDetail(id) {
    try {
        const result = await api.position.get(id);
        const position = result.data;
        document.getElementById('positionId').value = position.id;
        document.getElementById('positionName').value = position.name;
        document.getElementById('positionLevel').value = position.level || '';
        document.getElementById('positionDepartmentId').value = position.department ? position.department.id : '';
        document.getElementById('positionDescription').value = position.description || '';
        document.getElementById('positionEnabled').value = String(position.enabled);
    } catch (error) {
        console.error('Load position detail failed:', error);
    }
}

async function savePosition() {
    const id = document.getElementById('positionId').value;
    const name = document.getElementById('positionName').value.trim();

    if (!name) {
        showToast('请输入岗位名称', 'error');
        document.getElementById('positionName').focus();
        return;
    }

    const data = {
        name: name,
        level: document.getElementById('positionLevel').value || null,
        departmentId: document.getElementById('positionDepartmentId').value || null,
        description: document.getElementById('positionDescription').value.trim(),
        enabled: document.getElementById('positionEnabled').value === 'true'
    };

    try {
        if (id) {
            await api.position.update(id, data);
            showToast('更新成功', 'success');
        } else {
            await api.position.create(data);
            showToast('创建成功', 'success');
        }
        closePositionModal();
        loadPositions();
    } catch (error) {
        console.error('Save position failed:', error);
    }
}

function editPosition(id) {
    openPositionModal(id);
}

async function togglePositionStatus(id, currentStatus) {
    if (!confirm(`确定要${currentStatus ? '禁用' : '启用'}该岗位吗？`)) return;
    
    try {
        await api.position.toggleStatus(id);
        showToast('操作成功', 'success');
        loadPositions();
    } catch (error) {
        console.error('Toggle position status failed:', error);
    }
}

async function deletePosition(id) {
    if (!confirm('确定要删除该岗位吗？')) return;
    
    try {
        await api.position.delete(id);
        showToast('删除成功', 'success');
        loadPositions();
    } catch (error) {
        console.error('Delete position failed:', error);
    }
}

async function viewPositionDetail(id) {
    try {
        const [positionResult, employeesResult] = await Promise.all([
            api.position.get(id),
            api.position.employees(id)
        ]);
        
        const position = positionResult.data;
        const employees = employeesResult.data;
        
        const detailBody = document.getElementById('positionDetailBody');
        detailBody.innerHTML = `
            <div class="detail-section">
                <h3>基本信息</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>岗位名称：</label>
                        <span>${position.name}</span>
                    </div>
                    <div class="detail-item">
                        <label>岗位等级：</label>
                        <span>${position.level || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>所属部门：</label>
                        <span>${position.department ? position.department.name : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>状态：</label>
                        <span>${position.enabled ? '启用' : '禁用'}</span>
                    </div>
                </div>
            </div>
            <div class="detail-section">
                <h3>岗位描述</h3>
                <p>${position.description || '暂无描述'}</p>
            </div>
            <div class="detail-section">
                <h3>绑定员工 (${employees.length}人)</h3>
                ${employees.length > 0 ? `
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>姓名</th>
                                <th>手机号</th>
                                <th>邮箱</th>
                                <th>所属部门</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${employees.map(emp => `
                                <tr>
                                    <td>${emp.name}</td>
                                    <td>${emp.phone || '-'}</td>
                                    <td>${emp.email || '-'}</td>
                                    <td>${emp.department ? emp.department.name : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>暂无绑定员工</p>'}
            </div>
        `;
        
        document.getElementById('positionDetailModal').classList.remove('hidden');
    } catch (error) {
        console.error('Load position detail failed:', error);
    }
}

function closePositionDetailModal() {
    document.getElementById('positionDetailModal').classList.add('hidden');
}
