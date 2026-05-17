const API_BASE = 'http://localhost:8080/api';

const paginationState = {
    materials: { page: 0, size: 10, totalElements: 0, totalPages: 0 },
    films: { page: 0, size: 10, totalElements: 0, totalPages: 0 },
    process: { page: 0, size: 10, totalElements: 0, totalPages: 0 },
    products: { page: 0, size: 10, totalElements: 0, totalPages: 0 }
};

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadDashboard();
    initModals();
});

function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');

            switch(section) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'materials':
                    loadMaterials();
                    break;
                case 'films':
                    loadFilms();
                    break;
                case 'process':
                    loadProcessFilms();
                    break;
                case 'products':
                    loadProducts();
                    break;
            }
        });
    });
}

async function loadDashboard() {
    try {
        const [materials, films, products] = await Promise.all([
            fetch(`${API_BASE}/materials`).then(r => r.json()),
            fetch(`${API_BASE}/films`).then(r => r.json()),
            fetch(`${API_BASE}/finished-products`).then(r => r.json())
        ]);

        document.getElementById('stat-materials').textContent = materials.length;
        document.getElementById('stat-films').textContent = films.length;
        document.getElementById('stat-processing').textContent = films.filter(f => 
            f.status === 'PROCESSING').length;
        document.getElementById('stat-completed').textContent = products.filter(p => 
            p.status === 'DELIVERED').length;
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

function renderPagination(type, totalElements, totalPages) {
    const state = paginationState[type];
    const containerId = `${type}-pagination`;
    const container = document.getElementById(containerId);
    
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    let html = `
        <button class="pagination-btn" onclick="changePage('${type}', ${state.page - 1})" ${state.page === 0 ? 'disabled' : ''}>上一页</button>
        <span class="pagination-info">第 ${state.page + 1} / ${totalPages} 页，共 ${totalElements} 条</span>
        <button class="pagination-btn" onclick="changePage('${type}', ${state.page + 1})" ${state.page >= totalPages - 1 ? 'disabled' : ''}>下一页</button>
        <select class="page-size-select" onchange="changePageSize('${type}', this.value)">
            <option value="5" ${state.size === 5 ? 'selected' : ''}>5条/页</option>
            <option value="10" ${state.size === 10 ? 'selected' : ''}>10条/页</option>
            <option value="20" ${state.size === 20 ? 'selected' : ''}>20条/页</option>
            <option value="50" ${state.size === 50 ? 'selected' : ''}>50条/页</option>
        </select>
    `;
    
    container.innerHTML = html;
}

function changePage(type, page) {
    if (page >= 0) {
        paginationState[type].page = page;
        
        switch(type) {
            case 'materials': loadMaterials(); break;
            case 'films': loadFilms(); break;
            case 'process': loadProcessFilms(); break;
            case 'products': loadProducts(); break;
        }
    }
}

function changePageSize(type, size) {
    paginationState[type].size = parseInt(size);
    paginationState[type].page = 0;
    
    switch(type) {
        case 'materials': loadMaterials(); break;
        case 'films': loadFilms(); break;
        case 'process': loadProcessFilms(); break;
        case 'products': loadProducts(); break;
    }
}

function adjustPageAfterDelete(type, currentPageCount) {
    const state = paginationState[type];
    if (currentPageCount === 1 && state.page > 0) {
        state.page--;
        return true;
    }
    return false;
}

async function loadMaterials() {
    try {
        const state = paginationState.materials;
        const pageData = await fetch(`${API_BASE}/materials/page?page=${state.page}&size=${state.size}`).then(r => r.json());
        
        if (pageData.content.length === 0 && state.page > 0) {
            state.page--;
            return loadMaterials();
        }

        const tbody = document.querySelector('#materials-table tbody');
        tbody.innerHTML = '';

        pageData.content.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${m.name}</td>
                <td>${getMaterialTypeLabel(m.type)}</td>
                <td>${m.quantity} ${m.unit}</td>
                <td>${m.supplier || '-'}</td>
                <td>${m.notes || '-'}</td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="editMaterial(${m.id})">编辑</button>
                    <button class="btn btn-secondary btn-small" onclick="deleteMaterial(${m.id})">删除</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination('materials', pageData.totalElements, pageData.totalPages);
    } catch (error) {
        console.error('加载耗材失败:', error);
    }
}

function getMaterialTypeLabel(type) {
    const labels = {
        'DEVELOPER': '显影液',
        'FIXER': '定影液',
        'STOP_BATH': '停影液',
        'WETTING_AGENT': '去水渍液',
        'PAPER': '相纸',
        'OTHER': '其他'
    };
    return labels[type] || type;
}

async function loadFilms() {
    try {
        const state = paginationState.films;
        const pageData = await fetch(`${API_BASE}/films/page?page=${state.page}&size=${state.size}`).then(r => r.json());
        
        if (pageData.content.length === 0 && state.page > 0) {
            state.page--;
            return loadFilms();
        }

        const tbody = document.querySelector('#films-table tbody');
        tbody.innerHTML = '';

        pageData.content.forEach(f => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${f.customerName}</td>
                <td>${f.filmType}</td>
                <td>${f.filmBrand || '-'}</td>
                <td>${f.iso || '-'}</td>
                <td>${f.rolls}</td>
                <td>${f.receivedDate}</td>
                <td><span class="status-badge status-${f.status.toLowerCase()}">${getStatusLabel(f.status)}</span></td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="editFilm(${f.id})">编辑</button>
                    <button class="btn btn-secondary btn-small" onclick="deleteFilm(${f.id})">删除</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination('films', pageData.totalElements, pageData.totalPages);
    } catch (error) {
        console.error('加载底片失败:', error);
    }
}

function getStatusLabel(status) {
    const labels = {
        'RECEIVED': '已接收',
        'PROCESSING': '冲洗中',
        'COMPLETED': '已完成',
        'DELIVERED': '已交付'
    };
    return labels[status] || status;
}

async function loadProcessFilms() {
    try {
        const state = paginationState.process;
        const filmsPage = await fetch(`${API_BASE}/films/page?page=${state.page}&size=${state.size}`).then(r => r.json());
        
        if (filmsPage.content.length === 0 && state.page > 0) {
            state.page--;
            return loadProcessFilms();
        }

        const tbody = document.querySelector('#process-films-list');
        tbody.innerHTML = '';

        const products = await fetch(`${API_BASE}/finished-products`).then(r => r.json());
        const productFilmIds = new Set(products.map(p => p.filmId));

        filmsPage.content.forEach(f => {
            const hasProduct = productFilmIds.has(f.id);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${f.id}</td>
                <td>${f.customerName}</td>
                <td>${f.filmType}</td>
                <td>${f.rolls}</td>
                <td><span class="status-badge status-${f.status.toLowerCase()}">${getStatusLabel(f.status)}</span></td>
                <td>
                    <button class="btn btn-primary btn-small" onclick="viewProcessSteps(${f.id})">查看工序</button>
                    <button class="btn btn-secondary btn-small" onclick="addProcessStep(${f.id})">添加工序</button>
                    ${hasProduct 
                        ? `<button class="btn btn-secondary btn-small" onclick="editProductByFilmId(${f.id})">编辑成品</button>`
                        : `<button class="btn btn-primary btn-small" onclick="createProductFromFilm(${f.id})">归档成品</button>`
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination('process', filmsPage.totalElements, filmsPage.totalPages);
    } catch (error) {
        console.error('加载冲洗列表失败:', error);
    }
}

async function viewProcessSteps(filmId) {
    try {
        const steps = await fetch(`${API_BASE}/process-steps/film/${filmId}`).then(r => r.json());
        const container = document.getElementById('process-steps-container');
        container.innerHTML = '';

        if (steps.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无工序记录</div>';
        } else {
            const timeline = document.createElement('div');
            timeline.className = 'step-timeline';
            steps.forEach(step => {
                const item = document.createElement('div');
                item.className = 'step-item';
                item.innerHTML = `
                    <div class="step-type">${getStepTypeLabel(step.stepType)}</div>
                    <div class="step-details">
                        ${step.startTime ? `开始: ${step.startTime.replace('T', ' ')}` : ''}
                        ${step.duration ? ` | 时长: ${step.duration}分钟` : ''}
                        ${step.temperature ? ` | 温度: ${step.temperature}°C` : ''}
                        ${step.solutionUsed ? `<br>药水: ${step.solutionUsed}` : ''}
                        ${step.operatorName ? ` | 操作员: ${step.operatorName}` : ''}
                        ${step.notes ? `<br>备注: ${step.notes}` : ''}
                    </div>
                `;
                timeline.appendChild(item);
            });
            container.appendChild(timeline);
        }

        document.getElementById('process-steps-modal').classList.add('active');
    } catch (error) {
        console.error('加载工序失败:', error);
    }
}

function getStepTypeLabel(type) {
    const labels = {
        'DEVELOPING': '显影',
        'STOP_BATH': '停影',
        'FIXING': '定影',
        'WASHING': '水洗',
        'WETTING': '去水渍',
        'DRYING': '晾干',
        'SCANNING': '扫描'
    };
    return labels[type] || type;
}

function addProcessStep(filmId) {
    document.getElementById('process-step-form').dataset.filmId = filmId;
    document.getElementById('process-step-modal').classList.add('active');
}

async function loadProducts() {
    try {
        const state = paginationState.products;
        const productsPage = await fetch(`${API_BASE}/finished-products/page?page=${state.page}&size=${state.size}`).then(r => r.json());
        
        if (productsPage.content.length === 0 && state.page > 0) {
            state.page--;
            return loadProducts();
        }

        const films = await fetch(`${API_BASE}/films`).then(r => r.json());
        const filmMap = new Map(films.map(f => [f.id, f]));

        const tbody = document.querySelector('#products-table tbody');
        tbody.innerHTML = '';

        productsPage.content.forEach(p => {
            const film = filmMap.get(p.filmId);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.filmId}</td>
                <td>${film ? film.customerName : '-'}</td>
                <td>${p.photosCount}</td>
                <td>${p.negativesCount || '-'}</td>
                <td>${p.scansCount || '-'}</td>
                <td>${p.deliveryMethod || '-'}</td>
                <td><span class="status-badge status-${p.status.toLowerCase()}">${getStatusLabel(p.status)}</span></td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="editProduct(${p.id})">编辑</button>
                    <button class="btn btn-secondary btn-small" onclick="deleteProduct(${p.id})">删除</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination('products', productsPage.totalElements, productsPage.totalPages);
    } catch (error) {
        console.error('加载成品失败:', error);
    }
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    if (modalId === 'product-modal') {
        loadProductFilmSelect();
    }
    if (modalId === 'film-modal') {
        const filmId = document.getElementById('film-id').value;
        if (!filmId) {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('film-received-date').value = today;
        }
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    const form = document.querySelector(`#${modalId} form`);
    if (form) form.reset();
}

function initModals() {
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                const form = modal.querySelector('form');
                if (form) form.reset();
            }
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                const form = modal.querySelector('form');
                if (form) form.reset();
            }
        });
    });

    document.getElementById('material-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.quantity = parseInt(data.quantity) || 0;
        data.capacity = parseInt(data.capacity) || null;
        
        const isEdit = data.id && data.id !== '';
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${API_BASE}/materials/${data.id}` : `${API_BASE}/materials`;
        if (!isEdit) delete data.id;

        try {
            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            closeModal('material-modal');
            loadMaterials();
            loadDashboard();
        } catch (error) {
            console.error('保存耗材失败:', error);
        }
    });

    document.getElementById('film-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.iso = parseInt(data.iso) || null;
        data.rolls = parseInt(data.rolls) || 1;
        
        const isEdit = data.id && data.id !== '';
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${API_BASE}/films/${data.id}` : `${API_BASE}/films`;
        if (!isEdit) {
            data.status = 'RECEIVED';
            delete data.id;
        }

        try {
            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            closeModal('film-modal');
            loadFilms();
            loadDashboard();
        } catch (error) {
            console.error('保存底片失败:', error);
        }
    });

    document.getElementById('process-step-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const filmId = parseInt(e.target.dataset.filmId);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.filmId = filmId;
        data.duration = parseInt(data.duration) || null;
        data.temperature = data.temperature ? parseFloat(data.temperature) : null;
        if (data.startTime) data.startTime += ':00';
        if (data.endTime) data.endTime += ':00';

        try {
            await fetch(`${API_BASE}/process-steps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            await fetch(`${API_BASE}/films/${filmId}/status?status=PROCESSING`, {
                method: 'PUT'
            });
            closeModal('process-step-modal');
            loadProcessFilms();
            loadDashboard();
        } catch (error) {
            console.error('保存工序失败:', error);
        }
    });

    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.filmId = parseInt(data.filmId);
        data.photosCount = parseInt(data.photosCount) || 0;
        data.negativesCount = parseInt(data.negativesCount) || null;
        data.scansCount = parseInt(data.scansCount) || null;
        
        const isEdit = data.id && data.id !== '';
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${API_BASE}/finished-products/${data.id}` : `${API_BASE}/finished-products`;
        if (!isEdit) delete data.id;

        try {
            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (data.status === 'COMPLETED' || data.status === 'DELIVERED') {
                await fetch(`${API_BASE}/films/${data.filmId}/status?status=${data.status}`, {
                    method: 'PUT'
                });
            }
            closeModal('product-modal');
            loadProducts();
            loadDashboard();
        } catch (error) {
            console.error('保存成品失败:', error);
        }
    });

    loadProductFilmSelect();
}

async function loadProductFilmSelect() {
    try {
        const films = await fetch(`${API_BASE}/films`).then(r => r.json());
        const select = document.getElementById('product-film-id');
        select.innerHTML = '<option value="">选择底片</option>';
        films.forEach(f => {
            const option = document.createElement('option');
            option.value = f.id;
            option.textContent = `${f.id} - ${f.customerName} (${f.filmType})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('加载底片列表失败:', error);
    }
}

async function editMaterial(id) {
    try {
        const material = await fetch(`${API_BASE}/materials/${id}`).then(r => r.json());
        document.getElementById('material-id').value = material.id;
        document.getElementById('material-name').value = material.name;
        document.getElementById('material-type').value = material.type;
        document.getElementById('material-quantity').value = material.quantity;
        document.getElementById('material-unit').value = material.unit;
        document.getElementById('material-capacity').value = material.capacity || '';
        document.getElementById('material-supplier').value = material.supplier || '';
        document.getElementById('material-notes').value = material.notes || '';
        openModal('material-modal');
    } catch (error) {
        console.error('加载耗材信息失败:', error);
    }
}

async function deleteMaterial(id) {
    if (confirm('确定要删除这个耗材吗？')) {
        try {
            await fetch(`${API_BASE}/materials/${id}`, { method: 'DELETE' });
            loadMaterials();
            loadDashboard();
        } catch (error) {
            console.error('删除耗材失败:', error);
        }
    }
}

async function editFilm(id) {
    try {
        const film = await fetch(`${API_BASE}/films/${id}`).then(r => r.json());
        document.getElementById('film-id').value = film.id;
        document.getElementById('film-customer-name').value = film.customerName;
        document.getElementById('film-contact').value = film.contactInfo || '';
        document.getElementById('film-type').value = film.filmType;
        document.getElementById('film-brand').value = film.filmBrand || '';
        document.getElementById('film-iso').value = film.iso || '';
        document.getElementById('film-rolls').value = film.rolls;
        document.getElementById('film-received-date').value = film.receivedDate;
        document.getElementById('film-requirements').value = film.specialRequirements || '';
        document.getElementById('film-notes').value = film.notes || '';
        openModal('film-modal');
    } catch (error) {
        console.error('加载底片信息失败:', error);
    }
}

async function deleteFilm(id) {
    if (confirm('确定要删除这个底片记录吗？')) {
        try {
            await fetch(`${API_BASE}/films/${id}`, { method: 'DELETE' });
            loadFilms();
            loadDashboard();
        } catch (error) {
            console.error('删除底片失败:', error);
        }
    }
}

async function createProductFromFilm(filmId) {
    try {
        await loadProductFilmSelect();
        document.getElementById('product-id').value = '';
        document.getElementById('product-film-id').value = filmId;
        document.getElementById('product-photos').value = '';
        document.getElementById('product-negatives').value = '';
        document.getElementById('product-scans').value = '';
        document.getElementById('product-print-size').value = '';
        document.getElementById('product-delivery-method').value = '';
        document.getElementById('product-delivery-date').value = '';
        document.getElementById('product-delivered-to').value = '';
        document.getElementById('product-status').value = 'COMPLETED';
        document.getElementById('product-notes').value = '';
        openModal('product-modal');
    } catch (error) {
        console.error('创建成品失败:', error);
    }
}

async function editProductByFilmId(filmId) {
    try {
        const product = await fetch(`${API_BASE}/finished-products/film/${filmId}`).then(r => r.json());
        await loadProductFilmSelect();
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-film-id').value = product.filmId;
        document.getElementById('product-photos').value = product.photosCount;
        document.getElementById('product-negatives').value = product.negativesCount || '';
        document.getElementById('product-scans').value = product.scansCount || '';
        document.getElementById('product-print-size').value = product.printSize || '';
        document.getElementById('product-delivery-method').value = product.deliveryMethod || '';
        document.getElementById('product-delivery-date').value = product.deliveryDate || '';
        document.getElementById('product-delivered-to').value = product.deliveredTo || '';
        document.getElementById('product-status').value = product.status;
        document.getElementById('product-notes').value = product.notes || '';
        openModal('product-modal');
    } catch (error) {
        console.error('加载成品信息失败:', error);
    }
}

async function editProduct(id) {
    try {
        const product = await fetch(`${API_BASE}/finished-products/${id}`).then(r => r.json());
        await loadProductFilmSelect();
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-film-id').value = product.filmId;
        document.getElementById('product-photos').value = product.photosCount;
        document.getElementById('product-negatives').value = product.negativesCount || '';
        document.getElementById('product-scans').value = product.scansCount || '';
        document.getElementById('product-print-size').value = product.printSize || '';
        document.getElementById('product-delivery-method').value = product.deliveryMethod || '';
        document.getElementById('product-delivery-date').value = product.deliveryDate || '';
        document.getElementById('product-delivered-to').value = product.deliveredTo || '';
        document.getElementById('product-status').value = product.status;
        document.getElementById('product-notes').value = product.notes || '';
        openModal('product-modal');
    } catch (error) {
        console.error('加载成品信息失败:', error);
    }
}

async function deleteProduct(id) {
    if (confirm('确定要删除这个成品记录吗？')) {
        try {
            await fetch(`${API_BASE}/finished-products/${id}`, { method: 'DELETE' });
            loadProducts();
            loadDashboard();
        } catch (error) {
            console.error('删除成品失败:', error);
        }
    }
}