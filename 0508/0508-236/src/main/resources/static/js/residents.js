let currentPage = 0;
let pageSize = 10;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', function() {
    loadResidents();
    setupResidentForm();
});

async function loadResidents() {
    try {
        const response = await fetch(`/api/residents/page?page=${currentPage}&size=${pageSize}`);
        if (response.ok) {
            const data = await response.json();
            renderResidentsTable(data.content);
            renderPagination(data);
        }
    } catch (error) {
        console.error('加载居民列表失败:', error);
    }
}

function renderResidentsTable(residents) {
    const tbody = document.getElementById('residentTableBody');
    if (residents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; color: #6c757d; padding: 24px;">
                    暂无数据
                </td>
            </tr>
        `;
        return;
    }
    tbody.innerHTML = residents.map(resident => `
        <tr>
            <td>${resident.id}</td>
            <td>${resident.realName}</td>
            <td>${PhoneUtils.formatPhone(resident.phone)}</td>
            <td>${PhoneUtils.formatPhone(resident.backupPhone)}</td>
            <td>${resident.buildingNumber || '-'}</td>
            <td>${resident.roomNumber || '-'}</td>
            <td>${resident.pickupMethod || '-'}</td>
            <td><span class="badge ${resident.enabled ? 'badge-enabled' : 'badge-disabled'}">${resident.enabled ? '启用' : '禁用'}</span></td>
            <td>${formatDate(resident.createTime)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-success" onclick="editResident(${resident.id})">编辑</button>
                    <button class="btn ${resident.enabled ? 'btn-warning' : 'btn-primary'}" onclick="toggleResidentStatus(${resident.id})">${resident.enabled ? '禁用' : '启用'}</button>
                    <button class="btn btn-danger btn-delete" onclick="deleteResident(${resident.id})">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination(pageData) {
    totalPages = pageData.totalPages;
    const paginationContainer = document.getElementById('residentPagination');

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
        loadResidents();
    }
}

function changePageSize(size) {
    pageSize = parseInt(size);
    currentPage = 0;
    loadResidents();
}

function openResidentModal() {
    document.getElementById('modalTitle').textContent = '添加居民';
    document.getElementById('residentForm').reset();
    document.getElementById('residentId').value = '';
    document.getElementById('residentModal').classList.add('show');
}

function closeResidentModal() {
    document.getElementById('residentModal').classList.remove('show');
}

function editResident(id) {
    fetch(`/api/residents/${id}`)
        .then(response => response.json())
        .then(resident => {
            document.getElementById('modalTitle').textContent = '编辑居民';
            document.getElementById('residentId').value = resident.id;
            document.getElementById('formRealName').value = resident.realName;
            document.getElementById('formPhone').value = PhoneUtils.formatPhone(resident.phone);
            document.getElementById('formBackupPhone').value = PhoneUtils.formatPhone(resident.backupPhone);
            document.getElementById('formBuildingNumber').value = resident.buildingNumber || '';
            document.getElementById('formRoomNumber').value = resident.roomNumber || '';
            document.getElementById('formFullAddress').value = resident.fullAddress || '';
            document.getElementById('formPickupMethod').value = resident.pickupMethod || '';
            document.getElementById('formPickupAddress').value = resident.pickupAddress || '';
            document.getElementById('formDeliveryNotes').value = resident.deliveryNotes || '';
            document.getElementById('formEnabled').value = resident.enabled.toString();
            document.getElementById('formRemark').value = resident.remark || '';
            document.getElementById('residentModal').classList.add('show');
        })
        .catch(error => console.error('加载居民详情失败:', error));
}

function setupResidentForm() {
    const form = document.getElementById('residentForm');
    const phoneInput = document.getElementById('formPhone');
    const backupPhoneInput = document.getElementById('formBackupPhone');

    phoneInput.addEventListener('input', function() {
        PhoneUtils.formatInput(this);
    });

    backupPhoneInput.addEventListener('input', function() {
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

        const backupPhone = document.getElementById('formBackupPhone').value;
        if (backupPhone && !PhoneUtils.isValidMobile(backupPhone)) {
            alert('备用手机号格式不正确，请输入11位有效手机号');
            document.getElementById('formBackupPhone').focus();
            return;
        }

        const residentId = document.getElementById('residentId').value;
        const residentData = {
            realName: document.getElementById('formRealName').value,
            phone: PhoneUtils.cleanPhone(document.getElementById('formPhone').value),
            backupPhone: PhoneUtils.cleanPhone(document.getElementById('formBackupPhone').value),
            buildingNumber: document.getElementById('formBuildingNumber').value,
            roomNumber: document.getElementById('formRoomNumber').value,
            fullAddress: document.getElementById('formFullAddress').value,
            pickupMethod: document.getElementById('formPickupMethod').value,
            pickupAddress: document.getElementById('formPickupAddress').value,
            deliveryNotes: document.getElementById('formDeliveryNotes').value,
            enabled: document.getElementById('formEnabled').value === 'true',
            remark: document.getElementById('formRemark').value
        };

        try {
            let response;
            if (residentId) {
                response = await fetch(`/api/residents/${residentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(residentData)
                });
            } else {
                response = await fetch('/api/residents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(residentData)
                });
            }

            if (response.ok) {
                closeResidentModal();
                loadResidents();
            } else {
                const error = await response.json();
                alert(error.message || '操作失败');
            }
        } catch (error) {
            console.error('保存居民失败:', error);
            alert('操作失败');
        }
    });
}

async function toggleResidentStatus(id) {
    try {
        const response = await fetch(`/api/residents/${id}/toggle-status`, {
            method: 'PUT'
        });
        if (response.ok) {
            loadResidents();
        }
    } catch (error) {
        console.error('切换居民状态失败:', error);
    }
}

async function deleteResident(id) {
    const confirmed = window.confirm('确定要删除该居民吗？\n\n此操作不可恢复！');
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch(`/api/residents/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('删除成功！');
            loadResidents();
        } else {
            alert('删除失败，请重试！');
        }
    } catch (error) {
        console.error('删除居民失败:', error);
        alert('删除失败，请重试！');
    }
}
