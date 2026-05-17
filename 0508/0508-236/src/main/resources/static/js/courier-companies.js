let currentPage = 0;
let pageSize = 10;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', function() {
    loadCompanies();
    setupCompanyForm();
});

async function loadCompanies() {
    try {
        const response = await fetch(`/api/courier-companies/page?page=${currentPage}&size=${pageSize}`);
        if (response.ok) {
            const data = await response.json();
            renderCompaniesTable(data.content);
            renderPagination(data);
        }
    } catch (error) {
        console.error('加载快递公司列表失败:', error);
    }
}

function renderCompaniesTable(companies) {
    const tbody = document.getElementById('companyTableBody');
    if (companies.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: #6c757d; padding: 24px;">
                    暂无数据
                </td>
            </tr>
        `;
        return;
    }
    tbody.innerHTML = companies.map(company => `
        <tr>
            <td>${company.id}</td>
            <td>${company.companyName}</td>
            <td>${company.companyCode}</td>
            <td>${company.contactPerson || '-'}</td>
            <td>${PhoneUtils.formatPhone(company.contactPhone)}</td>
            <td>${company.serviceArea || '-'}</td>
            <td><span class="badge ${company.enabled ? 'badge-enabled' : 'badge-disabled'}">${company.enabled ? '启用' : '禁用'}</span></td>
            <td>${formatDate(company.createTime)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-success" onclick="editCompany(${company.id})">编辑</button>
                    <button class="btn ${company.enabled ? 'btn-warning' : 'btn-primary'}" onclick="toggleCompanyStatus(${company.id})">${company.enabled ? '禁用' : '启用'}</button>
                    <button class="btn btn-danger btn-delete" onclick="deleteCompany(${company.id})">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination(pageData) {
    totalPages = pageData.totalPages;
    const paginationContainer = document.getElementById('companyPagination');

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
        loadCompanies();
    }
}

function changePageSize(size) {
    pageSize = parseInt(size);
    currentPage = 0;
    loadCompanies();
}

function openCompanyModal() {
    document.getElementById('modalTitle').textContent = '添加快递公司';
    document.getElementById('companyForm').reset();
    document.getElementById('companyId').value = '';
    document.getElementById('companyModal').classList.add('show');
}

function closeCompanyModal() {
    document.getElementById('companyModal').classList.remove('show');
}

function editCompany(id) {
    fetch(`/api/courier-companies/${id}`)
        .then(response => response.json())
        .then(company => {
            document.getElementById('modalTitle').textContent = '编辑快递公司';
            document.getElementById('companyId').value = company.id;
            document.getElementById('formCompanyName').value = company.companyName;
            document.getElementById('formCompanyCode').value = company.companyCode;
            document.getElementById('formContactPerson').value = company.contactPerson || '';
            document.getElementById('formContactPhone').value = PhoneUtils.formatPhone(company.contactPhone);
            document.getElementById('formApiUrl').value = company.apiUrl || '';
            document.getElementById('formApiKey').value = company.apiKey || '';
            document.getElementById('formApiSecret').value = company.apiSecret || '';
            document.getElementById('formDeliveryRules').value = company.deliveryRules || '';
            document.getElementById('formServiceArea').value = company.serviceArea || '';
            document.getElementById('formSettlementMethod').value = company.settlementMethod || '';
            document.getElementById('formEnabled').value = company.enabled.toString();
            document.getElementById('formRemark').value = company.remark || '';
            document.getElementById('companyModal').classList.add('show');
        })
        .catch(error => console.error('加载快递公司详情失败:', error));
}

function setupCompanyForm() {
    const form = document.getElementById('companyForm');
    const phoneInput = document.getElementById('formContactPhone');

    phoneInput.addEventListener('input', function() {
        PhoneUtils.formatInput(this);
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const phone = document.getElementById('formContactPhone').value;
        if (phone && !PhoneUtils.isValidPhone(phone)) {
            alert('电话格式不正确，请输入手机号或固定电话');
            document.getElementById('formContactPhone').focus();
            return;
        }

        const companyId = document.getElementById('companyId').value;
        const companyData = {
            companyName: document.getElementById('formCompanyName').value,
            companyCode: document.getElementById('formCompanyCode').value,
            contactPerson: document.getElementById('formContactPerson').value,
            contactPhone: PhoneUtils.cleanPhone(document.getElementById('formContactPhone').value),
            apiUrl: document.getElementById('formApiUrl').value,
            apiKey: document.getElementById('formApiKey').value,
            apiSecret: document.getElementById('formApiSecret').value,
            deliveryRules: document.getElementById('formDeliveryRules').value,
            serviceArea: document.getElementById('formServiceArea').value,
            settlementMethod: document.getElementById('formSettlementMethod').value,
            enabled: document.getElementById('formEnabled').value === 'true',
            remark: document.getElementById('formRemark').value
        };

        try {
            let response;
            if (companyId) {
                response = await fetch(`/api/courier-companies/${companyId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(companyData)
                });
            } else {
                response = await fetch('/api/courier-companies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(companyData)
                });
            }

            if (response.ok) {
                closeCompanyModal();
                loadCompanies();
            } else {
                const error = await response.json();
                alert(error.message || '操作失败');
            }
        } catch (error) {
            console.error('保存快递公司失败:', error);
            alert('操作失败');
        }
    });
}

async function toggleCompanyStatus(id) {
    try {
        const response = await fetch(`/api/courier-companies/${id}/toggle-status`, {
            method: 'PUT'
        });
        if (response.ok) {
            loadCompanies();
        }
    } catch (error) {
        console.error('切换快递公司状态失败:', error);
    }
}

async function deleteCompany(id) {
    const confirmed = window.confirm('确定要删除该快递公司吗？\n\n此操作不可恢复！');
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch(`/api/courier-companies/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('删除成功！');
            loadCompanies();
        } else {
            alert('删除失败，请重试！');
        }
    } catch (error) {
        console.error('删除快递公司失败:', error);
        alert('删除失败，请重试！');
    }
}
