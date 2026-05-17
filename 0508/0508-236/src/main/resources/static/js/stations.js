let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let searchKeyword = '';

document.addEventListener('DOMContentLoaded', function() {
    loadStations();
    setupStationForm();
});

async function loadStations() {
    try {
        let url = '';
        if (searchKeyword) {
            url = `/api/stations/search/page?name=${encodeURIComponent(searchKeyword)}&page=${currentPage}&size=${pageSize}`;
        } else {
            url = `/api/stations/page?page=${currentPage}&size=${pageSize}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            renderStationsTable(data.content);
            renderPagination(data);
        }
    } catch (error) {
        console.error('加载驿站列表失败:', error);
    }
}

async function searchStations() {
    searchKeyword = document.getElementById('searchInput').value.trim();
    currentPage = 0;
    await loadStations();
}

function renderStationsTable(stations) {
    const tbody = document.getElementById('stationTableBody');
    if (stations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: #6c757d; padding: 24px;">
                    暂无数据
                </td>
            </tr>
        `;
        return;
    }
    tbody.innerHTML = stations.map(station => `
        <tr>
            <td>${station.id}</td>
            <td><strong>${station.stationName}</strong></td>
            <td>${station.address || '-'}</td>
            <td>${station.serviceScope || '-'}</td>
            <td>${station.businessHours || '-'}</td>
            <td>${station.governingCommunity || '-'}</td>
            <td>${PhoneUtils.formatPhone(station.contactPhone)}</td>
            <td>${station.manager || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-success" onclick="editStation(${station.id})">编辑</button>
                    <button class="btn btn-danger btn-delete" onclick="deleteStation(${station.id})">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination(pageData) {
    totalPages = pageData.totalPages;
    const paginationContainer = document.getElementById('stationPagination');

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
        loadStations();
    }
}

function changePageSize(size) {
    pageSize = parseInt(size);
    currentPage = 0;
    loadStations();
}

function openStationModal() {
    document.getElementById('modalTitle').textContent = '添加驿站';
    document.getElementById('stationForm').reset();
    document.getElementById('stationId').value = '';
    document.getElementById('stationModal').classList.add('show');
}

function closeStationModal() {
    document.getElementById('stationModal').classList.remove('show');
}

function editStation(id) {
    fetch(`/api/stations/${id}`)
        .then(response => response.json())
        .then(station => {
            document.getElementById('modalTitle').textContent = '编辑驿站';
            document.getElementById('stationId').value = station.id;
            document.getElementById('formStationName').value = station.stationName || '';
            document.getElementById('formAddress').value = station.address || '';
            document.getElementById('formServiceScope').value = station.serviceScope || '';
            document.getElementById('formBusinessHours').value = station.businessHours || '';
            document.getElementById('formGoverningCommunity').value = station.governingCommunity || '';
            document.getElementById('formContactPhone').value = PhoneUtils.formatPhone(station.contactPhone);
            document.getElementById('formManager').value = station.manager || '';
            document.getElementById('formDescription').value = station.description || '';
            document.getElementById('stationModal').classList.add('show');
        })
        .catch(error => console.error('加载驿站详情失败:', error));
}

function setupStationForm() {
    const form = document.getElementById('stationForm');
    const phoneInput = document.getElementById('formContactPhone');

    phoneInput.addEventListener('input', function() {
        PhoneUtils.formatInput(this);
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const contactPhone = document.getElementById('formContactPhone').value;
        if (contactPhone && !PhoneUtils.isValidPhone(contactPhone)) {
            alert('电话格式不正确，请输入11位手机号或固定电话（如：010-12345678）');
            document.getElementById('formContactPhone').focus();
            return;
        }

        const stationId = document.getElementById('stationId').value;
        const stationData = {
            stationName: document.getElementById('formStationName').value,
            address: document.getElementById('formAddress').value,
            serviceScope: document.getElementById('formServiceScope').value,
            businessHours: document.getElementById('formBusinessHours').value,
            governingCommunity: document.getElementById('formGoverningCommunity').value,
            contactPhone: PhoneUtils.cleanPhone(document.getElementById('formContactPhone').value),
            manager: document.getElementById('formManager').value,
            description: document.getElementById('formDescription').value
        };

        try {
            let response;
            if (stationId) {
                response = await fetch(`/api/stations/${stationId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stationData)
                });
            } else {
                response = await fetch('/api/stations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stationData)
                });
            }

            if (response.ok) {
                closeStationModal();
                loadStations();
            } else {
                const error = await response.json();
                alert(error.message || '操作失败');
            }
        } catch (error) {
            console.error('保存驿站失败:', error);
            alert('操作失败');
        }
    });
}

async function deleteStation(id) {
    const confirmed = window.confirm('确定要删除该驿站吗？\n\n此操作不可恢复！');
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch(`/api/stations/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('删除成功！');
            loadStations();
        } else {
            alert('删除失败，请重试！');
        }
    } catch (error) {
        console.error('删除驿站失败:', error);
        alert('删除失败，请重试！');
    }
}
