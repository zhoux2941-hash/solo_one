const API_BASE_URL = '/api';

async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(API_BASE_URL + url, options);
        if (!response.ok) {
            throw new Error('请求失败');
        }
        return await response.json();
    } catch (error) {
        console.error('API请求错误:', error);
        alert('操作失败，请重试');
        throw error;
    }
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function getStatusBadge(status) {
    if (!status) {
        return '<span class="badge badge-secondary">-</span>';
    }
    const statusMap = {
        '正常': '<span class="badge badge-success">正常</span>',
        '使用中': '<span class="badge badge-info">使用中</span>',
        '已离开': '<span class="badge badge-warning">已离开</span>',
        '已预订': '<span class="badge badge-info">已预订</span>',
        '露营中': '<span class="badge badge-success">露营中</span>',
        '已完成': '<span class="badge badge-success">已完成</span>',
        '待维护': '<span class="badge badge-danger">待维护</span>',
        '良好': '<span class="badge badge-success">良好</span>',
        '一般': '<span class="badge badge-warning">一般</span>',
        '较差': '<span class="badge badge-danger">较差</span>'
    };
    return statusMap[status] || status;
}

function getAreaTypeLabel(type) {
    if (!type) {
        return '-';
    }
    const typeMap = {
        '休闲区': '休闲区',
        '生火区': '生火区',
        '取水区': '取水区',
        '帐篷区': '帐篷区',
        '观景区': '观景区'
    };
    return typeMap[type] || type;
}

function getFacilityTypeLabel(type) {
    if (!type) {
        return '-';
    }
    const typeMap = {
        '厕所': '厕所',
        '遮阳棚': '遮阳棚',
        '照明': '照明',
        '洗漱': '洗漱',
        '烧烤': '烧烤',
        '桌椅': '桌椅'
    };
    return typeMap[type] || type;
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
    }
}

window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let i = 0; i < modals.length; i++) {
        if (event.target === modals[i]) {
            modals[i].style.display = 'none';
        }
    }
}

function renderTable(tableBodyId, data, columns, actionCallback) {
    const tbody = document.getElementById(tableBodyId);
    if (!data || data.length === 0) {
        const colCount = columns.length + (actionCallback ? 1 : 0);
        tbody.innerHTML = '<tr><td colspan="' + colCount + '" style="text-align:center;padding:30px;color:#999;">暂无数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(item => {
        let row = '<tr>';
        columns.forEach(col => {
            if (col.render) {
                row += '<td>' + col.render(item) + '</td>';
            } else {
                const value = item[col.field];
                row += '<td>' + (value !== null && value !== undefined ? value : '-') + '</td>';
            }
        });
        if (actionCallback) {
            row += '<td>' + actionCallback(item) + '</td>';
        }
        row += '</tr>';
        return row;
    }).join('');
}

function getNumberValue(value, defaultValue = null) {
    if (value === '' || value === null || value === undefined) {
        return defaultValue;
    }
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
}

function renderPagination(containerId, pageData, onPageChange) {
    const container = document.getElementById(containerId);
    const { totalPages, currentPage, totalElements, pageSize } = pageData;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    const startItem = currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);
    
    container.innerHTML = `
        <button class="pagination-btn" onclick="${onPageChange}(0)" ${currentPage === 0 ? 'disabled' : ''}>首页</button>
        <button class="pagination-btn" onclick="${onPageChange}(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>上一页</button>
        <span class="pagination-info">第 ${currentPage + 1} / ${totalPages} 页，共 ${totalElements} 条</span>
        <button class="pagination-btn" onclick="${onPageChange}(${currentPage + 1})" ${currentPage === totalPages - 1 ? 'disabled' : ''}>下一页</button>
        <button class="pagination-btn" onclick="${onPageChange}(${totalPages - 1})" ${currentPage === totalPages - 1 ? 'disabled' : ''}>末页</button>
        <span class="pagination-info">跳转到</span>
        <input type="number" class="page-input" id="pageJumpInput" min="1" max="${totalPages}" value="${currentPage + 1}" 
               onchange="handlePageJump(this, ${totalPages}, '${onPageChange}')">
        <span class="pagination-info">页</span>
    `;
}

function handlePageJump(input, totalPages, onPageChange) {
    let page = parseInt(input.value) - 1;
    page = Math.max(0, Math.min(page, totalPages - 1));
    window[onPageChange](page);
}
