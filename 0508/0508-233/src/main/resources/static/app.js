const API_BASE = '/api';
let currentUser = null;

function init() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    }

    document.getElementById('regRole').addEventListener('change', function() {
        document.getElementById('craftsmanFields').style.display = this.value === 'CRAFTSMAN' ? 'block' : 'none';
    });
}

function switchLoginTab(tab) {
    const tabs = document.querySelectorAll('#loginPage .tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainApp();
        } else {
            alert(data.message || '登录失败');
        }
    } catch (error) {
        alert('登录失败，请检查服务是否启动');
    }
}

async function register() {
    const user = {
        username: document.getElementById('regUsername').value,
        password: document.getElementById('regPassword').value,
        realName: document.getElementById('regRealName').value,
        phone: document.getElementById('regPhone').value,
        role: document.getElementById('regRole').value
    };

    if (user.role === 'CRAFTSMAN') {
        user.craftsmanProfile = document.getElementById('regProfile').value;
        user.craftsmanSkills = document.getElementById('regSkills').value;
        user.experienceYears = parseInt(document.getElementById('regExperience').value) || 0;
        user.craftsmanStatus = 'PENDING';
    }

    try {
        const response = await fetch(`${API_BASE}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const data = await response.json();

        if (data.success) {
            alert('注册成功！' + (user.role === 'CRAFTSMAN' ? '请等待管理员审核。' : ''));
            switchLoginTab('login');
        } else {
            alert(data.message || '注册失败');
        }
    } catch (error) {
        alert('注册失败');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function showMainApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('usernameDisplay').textContent = currentUser.realName + ' (' + getRoleName(currentUser.role) + ')';
    document.getElementById('userInfo').style.display = 'block';

    setupNavigation();
    loadDashboard();
}

function getRoleName(role) {
    const names = { CUSTOMER: '客户', CRAFTSMAN: '匠人', ADMIN: '管理员' };
    return names[role] || role;
}

function setupNavigation() {
    const navBar = document.getElementById('navBar');
    let navHtml = '<button class="active" onclick="showPage(\'homePage\')">🏠 首页</button>';
    navHtml += '<button onclick="showPage(\'materialsPage\')">🎨 原材料库</button>';
    navHtml += '<button onclick="showPage(\'productsPage\')">💎 作品展示</button>';
    navHtml += '<button onclick="showPage(\'craftsmenPage\')">👨‍🎨 匠人列表</button>';
    navHtml += '<button onclick="showPage(\'ordersPage\')">📝 我的订单</button>';

    if (currentUser.role === 'ADMIN') {
        navHtml += '<button onclick="showPage(\'adminPage\')">⚙️ 管理后台</button>';
        document.getElementById('addMaterialBtn').style.display = 'inline-block';
    }

    if (currentUser.role === 'CRAFTSMAN') {
        document.getElementById('addProductBtn').style.display = 'inline-block';
        document.getElementById('pricingSection').style.display = 'block';
    }

    navBar.innerHTML = navHtml;
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    event?.target?.classList.add('active');

    switch(pageId) {
        case 'homePage': loadDashboard(); break;
        case 'materialsPage': loadMaterials(); break;
        case 'productsPage': loadProducts(); break;
        case 'craftsmenPage': loadCraftsmen(); break;
        case 'ordersPage': loadOrders(); break;
        case 'adminPage': loadAdminPage(); break;
    }
}

async function loadDashboard() {
    try {
        const [materials, products, craftsmen, orders] = await Promise.all([
            fetch(`${API_BASE}/materials`).then(r => r.json()),
            fetch(`${API_BASE}/products/published`).then(r => r.json()),
            fetch(`${API_BASE}/users/craftsmen/approved`).then(r => r.json()),
            fetch(`${API_BASE}/orders`).then(r => r.json())
        ]);

        document.getElementById('statMaterials').textContent = materials.length;
        document.getElementById('statProducts').textContent = products.length;
        document.getElementById('statCraftsmen').textContent = craftsmen.length;
        document.getElementById('statOrders').textContent = orders.length;

        renderProducts(products.slice(0, 4), 'featuredProducts');
    } catch (error) {
        console.error('加载数据失败', error);
    }
}

async function loadMaterials() {
    const category = document.getElementById('materialCategoryFilter').value;
    let url = `${API_BASE}/materials`;
    if (category) {
        url = `${API_BASE}/materials/category/${category}`;
    }

    try {
        const response = await fetch(url);
        const materials = await response.json();
        renderMaterials(materials);
    } catch (error) {
        console.error('加载材料失败', error);
    }
}

async function searchMaterials() {
    const name = document.getElementById('materialSearch').value;
    if (name) {
        try {
            const response = await fetch(`${API_BASE}/materials/search?name=${encodeURIComponent(name)}`);
            const materials = await response.json();
            renderMaterials(materials);
        } catch (error) {
            console.error('搜索失败', error);
        }
    } else {
        loadMaterials();
    }
}

function renderMaterials(materials) {
    const container = document.getElementById('materialsList');
    if (materials.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">暂无材料数据</p>';
        return;
    }

    container.innerHTML = materials.map(m => `
        <div class="card">
            <h3>${m.name}</h3>
            <span class="category-tag">${getCategoryName(m.category)}</span>
            <p><strong>材质：</strong>${m.material || '-'}</p>
            <p><strong>规格：</strong>${m.sizeSpec || '-'}</p>
            <p><strong>产地：</strong>${m.origin || '-'}</p>
            <p><strong>库存：</strong>${m.stockQuantity || 0} ${m.unit || ''}</p>
            <div class="price">¥${m.referencePrice || 0}</div>
            ${(currentUser.role === 'ADMIN') ? `
                <div class="actions">
                    <button class="btn btn-primary" onclick="editMaterial(${m.id})">编辑</button>
                    <button class="btn btn-danger" onclick="deleteMaterial(${m.id})">删除</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function getCategoryName(category) {
    const names = {
        BODHI_SEED: '菩提子类', JADE: '玉石类', WOOD: '木质类',
        METAL: '金属隔片', TASSLE: '流苏配饰', CORD: '绳线类',
        BEAD: '配珠类', OTHER: '其他'
    };
    return names[category] || category;
}

function showMaterialModal() {
    document.getElementById('materialModalTitle').textContent = '添加原材料';
    document.getElementById('materialId').value = '';
    document.getElementById('materialName').value = '';
    document.getElementById('materialCategory').value = 'BODHI_SEED';
    document.getElementById('materialMaterial').value = '';
    document.getElementById('materialSize').value = '';
    document.getElementById('materialPrice').value = '';
    document.getElementById('materialStock').value = '';
    document.getElementById('materialUnit').value = '';
    document.getElementById('materialOrigin').value = '';
    document.getElementById('materialPattern').value = '';
    document.getElementById('materialDesc').value = '';
    document.getElementById('materialModal').classList.add('active');
}

function closeMaterialModal() {
    document.getElementById('materialModal').classList.remove('active');
}

async function editMaterial(id) {
    try {
        const response = await fetch(`${API_BASE}/materials/${id}`);
        const m = await response.json();

        document.getElementById('materialModalTitle').textContent = '编辑原材料';
        document.getElementById('materialId').value = m.id;
        document.getElementById('materialName').value = m.name || '';
        document.getElementById('materialCategory').value = m.category || 'BODHI_SEED';
        document.getElementById('materialMaterial').value = m.material || '';
        document.getElementById('materialSize').value = m.sizeSpec || '';
        document.getElementById('materialPrice').value = m.referencePrice || '';
        document.getElementById('materialStock').value = m.stockQuantity || '';
        document.getElementById('materialUnit').value = m.unit || '';
        document.getElementById('materialOrigin').value = m.origin || '';
        document.getElementById('materialPattern').value = m.patternDescription || '';
        document.getElementById('materialDesc').value = m.description || '';
        document.getElementById('materialModal').classList.add('active');
    } catch (error) {
        alert('加载材料信息失败');
    }
}

async function saveMaterial() {
    const id = document.getElementById('materialId').value;
    const material = {
        name: document.getElementById('materialName').value,
        category: document.getElementById('materialCategory').value,
        material: document.getElementById('materialMaterial').value,
        sizeSpec: document.getElementById('materialSize').value,
        referencePrice: parseFloat(document.getElementById('materialPrice').value) || 0,
        stockQuantity: parseInt(document.getElementById('materialStock').value) || 0,
        unit: document.getElementById('materialUnit').value,
        origin: document.getElementById('materialOrigin').value,
        patternDescription: document.getElementById('materialPattern').value,
        description: document.getElementById('materialDesc').value
    };

    try {
        const url = id ? `${API_BASE}/materials/${id}` : `${API_BASE}/materials`;
        const method = id ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(material)
        });

        closeMaterialModal();
        loadMaterials();
        alert('保存成功');
    } catch (error) {
        alert('保存失败');
    }
}

async function deleteMaterial(id) {
    const result = window.confirm('确定要删除这个材料吗？');
    if (result !== true) {
        return;
    }

    try {
        await fetch(`${API_BASE}/materials/${id}`, { method: 'DELETE' });
        loadMaterials();
        alert('删除成功');
    } catch (error) {
        alert('删除失败');
    }
}

async function loadProducts() {
    const style = document.getElementById('productStyleFilter').value;
    let url = `${API_BASE}/products/published`;
    if (style) {
        url = `${API_BASE}/products/style/${style}`;
    }

    try {
        const response = await fetch(url);
        const products = await response.json();
        renderProducts(products, 'productsList');
    } catch (error) {
        console.error('加载作品失败', error);
    }
}

function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (products.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">暂无作品数据</p>';
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="card">
            <h3>${p.name}</h3>
            <span class="category-tag">${getStyleName(p.style)}</span>
            <p><strong>浏览：</strong>${p.viewCount || 0} 次</p>
            <p><strong>喜欢：</strong>${p.likeCount || 0} 次</p>
            <p style="margin-top: 10px;">${(p.description || '').substring(0, 100)}...</p>
            <div class="price">¥${p.price || 0}</div>
            ${(currentUser.role === 'CRAFTSMAN' && p.craftsman && p.craftsman.id === currentUser.id) ? `
                <div class="actions">
                    <button class="btn btn-primary" onclick="editProduct(${p.id})">编辑</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${p.id})">删除</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function getStyleName(style) {
    const names = {
        ANCIENT_STYLE: '古风', MODERN_STYLE: '现代风',
        ETHNIC_STYLE: '民族风', MINIMALIST: '极简风', LUXURY: '奢华风'
    };
    return names[style] || style;
}

function showProductModal() {
    document.getElementById('productModalTitle').textContent = '发布作品';
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productStyle').value = 'ANCIENT_STYLE';
    document.getElementById('productPrice').value = '';
    document.getElementById('productMaterials').value = '';
    document.getElementById('productDesc').value = '';
    document.getElementById('productPublished').value = 'true';
    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

async function editProduct(id) {
    try {
        const response = await fetch(`${API_BASE}/products/${id}`);
        const p = await response.json();

        document.getElementById('productModalTitle').textContent = '编辑作品';
        document.getElementById('productId').value = p.id;
        document.getElementById('productName').value = p.name || '';
        document.getElementById('productStyle').value = p.style || 'ANCIENT_STYLE';
        document.getElementById('productPrice').value = p.price || '';
        document.getElementById('productMaterials').value = p.materialList || '';
        document.getElementById('productDesc').value = p.description || '';
        document.getElementById('productPublished').value = p.isPublished ? 'true' : 'false';
        document.getElementById('productModal').classList.add('active');
    } catch (error) {
        alert('加载作品信息失败');
    }
}

async function saveProduct() {
    const id = document.getElementById('productId').value;
    const product = {
        name: document.getElementById('productName').value,
        style: document.getElementById('productStyle').value,
        price: parseFloat(document.getElementById('productPrice').value) || 0,
        materialList: document.getElementById('productMaterials').value,
        description: document.getElementById('productDesc').value,
        isPublished: document.getElementById('productPublished').value === 'true'
    };

    try {
        const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products/craftsman/${currentUser.id}`;
        const method = id ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });

        closeProductModal();
        loadProducts();
        alert('保存成功');
    } catch (error) {
        alert('保存失败');
    }
}

async function deleteProduct(id) {
    const result = window.confirm('确定要删除这个作品吗？');
    if (result !== true) {
        return;
    }

    try {
        await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
        loadProducts();
        alert('删除成功');
    } catch (error) {
        alert('删除失败');
    }
}

async function loadCraftsmen() {
    try {
        const response = await fetch(`${API_BASE}/users/craftsmen/approved`);
        const craftsmen = await response.json();
        renderCraftsmen(craftsmen);
    } catch (error) {
        console.error('加载匠人失败', error);
    }
}

function renderCraftsmen(craftsmen) {
    const container = document.getElementById('craftsmenList');
    if (craftsmen.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">暂无匠人数据</p>';
        return;
    }

    container.innerHTML = craftsmen.map(c => `
        <div class="card">
            <h3>${c.realName}</h3>
            <span class="badge badge-approved">已认证</span>
            <p><strong>从业年限：</strong>${c.experienceYears || 0} 年</p>
            <p><strong>技能：</strong>${c.craftsmanSkills || '-'}</p>
            <p style="margin-top: 10px;"><strong>简介：</strong>${(c.craftsmanProfile || '').substring(0, 100)}...</p>
        </div>
    `).join('');
}

async function loadOrders() {
    const status = document.getElementById('orderStatusFilter').value;
    let url = `${API_BASE}/orders`;

    if (currentUser.role === 'CUSTOMER') {
        url = `${API_BASE}/orders/customer/${currentUser.id}`;
    } else if (currentUser.role === 'CRAFTSMAN') {
        url = `${API_BASE}/orders/craftsman/${currentUser.id}`;
        if (status) {
            url = `${API_BASE}/orders/craftsman/${currentUser.id}/status/${status}`;
        }
    }

    try {
        const response = await fetch(url);
        const orders = await response.json();
        renderOrders(orders);
    } catch (error) {
        console.error('加载订单失败', error);
    }
}

function renderOrders(orders) {
    const container = document.getElementById('ordersList');
    if (orders.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">暂无订单数据</p>';
        return;
    }

    container.innerHTML = orders.map(o => `
        <div class="card">
            <h3>${o.braceletName}</h3>
            <span class="status-badge status-${o.status}">${getStatusName(o.status)}</span>
            <p><strong>订单号：</strong>${o.orderNo}</p>
            <p><strong>创建时间：</strong>${new Date(o.createdAt).toLocaleString()}</p>
            ${o.estimatedPrice ? `<p><strong>预估价格：</strong>¥${o.estimatedPrice}</p>` : ''}
            ${o.finalPrice ? `<p><strong>最终价格：</strong>¥${o.finalPrice}</p>` : ''}
            <div class="actions">
                <button class="btn btn-secondary" onclick="viewOrderDetail(${o.id})">查看详情</button>
                ${(currentUser.role === 'CRAFTSMAN' && o.status !== 'DELIVERED' && o.status !== 'CANCELLED') ? `
                    <button class="btn btn-primary" onclick="updateOrderStatus(${o.id}, '${getNextStatus(o.status)}')">${getStatusActionName(o.status)}</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function getStatusName(status) {
    const names = {
        PENDING_CONFIRM: '待确认', CONFIRMED: '已确认',
        IN_PRODUCTION: '制作中', COMPLETED: '已完成',
        DELIVERED: '已交付', CANCELLED: '已取消'
    };
    return names[status] || status;
}

function getNextStatus(status) {
    const flow = {
        PENDING_CONFIRM: 'CONFIRMED',
        CONFIRMED: 'IN_PRODUCTION',
        IN_PRODUCTION: 'COMPLETED',
        COMPLETED: 'DELIVERED'
    };
    return flow[status] || status;
}

function getStatusActionName(status) {
    const actions = {
        PENDING_CONFIRM: '确认订单',
        CONFIRMED: '开始制作',
        IN_PRODUCTION: '完成制作',
        COMPLETED: '交付订单'
    };
    return actions[status] || '更新状态';
}

function showOrderModal() {
    document.getElementById('orderName').value = '';
    document.getElementById('orderRequirements').value = '';
    document.getElementById('orderPhone').value = currentUser.phone || '';
    document.getElementById('orderAddress').value = '';
    document.getElementById('orderRemark').value = '';
    document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

async function submitOrder() {
    const order = {
        braceletName: document.getElementById('orderName').value,
        customRequirements: document.getElementById('orderRequirements').value,
        customerPhone: document.getElementById('orderPhone').value,
        customerAddress: document.getElementById('orderAddress').value,
        remark: document.getElementById('orderRemark').value
    };

    try {
        await fetch(`${API_BASE}/orders/customer/${currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });

        closeOrderModal();
        loadOrders();
        alert('定制订单提交成功！');
    } catch (error) {
        alert('提交失败');
    }
}

async function viewOrderDetail(id) {
    try {
        const response = await fetch(`${API_BASE}/orders/${id}`);
        const order = await response.json();

        document.getElementById('orderDetailContent').innerHTML = `
            <p><strong>订单号：</strong>${order.orderNo}</p>
            <p><strong>手串名称：</strong>${order.braceletName}</p>
            <p><strong>状态：</strong><span class="status-badge status-${order.status}">${getStatusName(order.status)}</span></p>
            <p><strong>创建时间：</strong>${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>定制要求：</strong>${order.customRequirements || '-'}</p>
            ${order.materialConfig ? `<p><strong>材料配置：</strong>${order.materialConfig}</p>` : ''}
            ${order.estimatedPrice ? `<p><strong>预估价格：</strong>¥${order.estimatedPrice}</p>` : ''}
            ${order.finalPrice ? `<p><strong>最终价格：</strong>¥${order.finalPrice}</p>` : ''}
            <p><strong>联系电话：</strong>${order.customerPhone || '-'}</p>
            <p><strong>收货地址：</strong>${order.customerAddress || '-'}</p>
            ${order.remark ? `<p><strong>备注：</strong>${order.remark}</p>` : ''}
        `;
        document.getElementById('orderDetailModal').classList.add('active');
    } catch (error) {
        alert('加载订单详情失败');
    }
}

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal').classList.remove('active');
}

async function updateOrderStatus(orderId, status) {
    const result = window.confirm(`确定要将订单状态更新为"${getStatusName(status)}"吗？`);
    if (result !== true) {
        return;
    }

    try {
        await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        loadOrders();
        alert('状态更新成功');
    } catch (error) {
        alert('更新失败');
    }
}

async function loadAdminPage() {
    try {
        const response = await fetch(`${API_BASE}/users/craftsmen/pending`);
        const craftsmen = await response.json();
        renderPendingCraftsmen(craftsmen);

        if (currentUser.role === 'CRAFTSMAN') {
            loadPricingSchemes();
        }
    } catch (error) {
        console.error('加载管理页面失败', error);
    }
}

function renderPendingCraftsmen(craftsmen) {
    const container = document.getElementById('pendingCraftsmen');
    if (craftsmen.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">暂无待审核匠人</p>';
        return;
    }

    container.innerHTML = craftsmen.map(c => `
        <div class="card">
            <h3>${c.realName}</h3>
            <span class="badge badge-pending">待审核</span>
            <p><strong>用户名：</strong>${c.username}</p>
            <p><strong>手机号：</strong>${c.phone || '-'}</p>
            <p><strong>从业年限：</strong>${c.experienceYears || 0} 年</p>
            <p><strong>技能：</strong>${c.craftsmanSkills || '-'}</p>
            <p><strong>简介：</strong>${(c.craftsmanProfile || '').substring(0, 100)}...</p>
            ${(currentUser.role === 'ADMIN') ? `
                <div class="actions">
                    <button class="btn btn-success" onclick="approveCraftsman(${c.id})">通过</button>
                    <button class="btn btn-danger" onclick="rejectCraftsman(${c.id})">拒绝</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function approveCraftsman(id) {
    const result = window.confirm('确定要通过该匠人的认证申请吗？');
    if (result !== true) {
        return;
    }

    try {
        await fetch(`${API_BASE}/users/craftsmen/${id}/approve`, { method: 'POST' });
        loadAdminPage();
        alert('认证通过');
    } catch (error) {
        alert('操作失败');
    }
}

async function rejectCraftsman(id) {
    const result = window.confirm('确定要拒绝该匠人的认证申请吗？');
    if (result !== true) {
        return;
    }

    try {
        await fetch(`${API_BASE}/users/craftsmen/${id}/reject`, { method: 'POST' });
        loadAdminPage();
        alert('已拒绝');
    } catch (error) {
        alert('操作失败');
    }
}

async function loadPricingSchemes() {
    try {
        const response = await fetch(`${API_BASE}/pricing/craftsman/${currentUser.id}`);
        const schemes = await response.json();
        renderPricingSchemes(schemes);
    } catch (error) {
        console.error('加载定价方案失败', error);
    }
}

function renderPricingSchemes(schemes) {
    const container = document.getElementById('pricingList');
    if (schemes.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">暂无定价方案</p>';
        return;
    }

    container.innerHTML = schemes.map(s => `
        <div class="card">
            <h3>${s.name} ${s.isDefault ? '<span class="badge badge-approved">默认</span>' : ''}</h3>
            <p><strong>类型：</strong>${getPricingTypeName(s.type)}</p>
            ${s.basePrice ? `<p><strong>基础价格：</strong>¥${s.basePrice}</p>` : ''}
            ${s.laborCostPercentage ? `<p><strong>手工费比例：</strong>${s.laborCostPercentage}%</p>` : ''}
            ${s.fixedLaborCost ? `<p><strong>固定手工费：</strong>¥${s.fixedLaborCost}</p>` : ''}
            <p><strong>描述：</strong>${(s.description || '').substring(0, 50)}...</p>
            <div class="actions">
                <button class="btn btn-primary" onclick="setDefaultPricing(${s.id})">设为默认</button>
                <button class="btn btn-danger" onclick="deletePricing(${s.id})">删除</button>
            </div>
        </div>
    `).join('');
}

function getPricingTypeName(type) {
    const names = { PERCENTAGE: '材料百分比', FIXED: '固定手工费', TIERED: '阶梯定价' };
    return names[type] || type;
}

function showPricingModal() {
    document.getElementById('pricingId').value = '';
    document.getElementById('pricingName').value = '';
    document.getElementById('pricingType').value = 'PERCENTAGE';
    document.getElementById('pricingBasePrice').value = '';
    document.getElementById('pricingPercentage').value = '';
    document.getElementById('pricingFixedCost').value = '';
    document.getElementById('pricingDesc').value = '';
    document.getElementById('pricingDefault').value = 'false';
    document.getElementById('pricingModal').classList.add('active');
}

function closePricingModal() {
    document.getElementById('pricingModal').classList.remove('active');
}

async function savePricing() {
    const pricing = {
        name: document.getElementById('pricingName').value,
        type: document.getElementById('pricingType').value,
        basePrice: parseFloat(document.getElementById('pricingBasePrice').value) || null,
        laborCostPercentage: parseFloat(document.getElementById('pricingPercentage').value) || null,
        fixedLaborCost: parseFloat(document.getElementById('pricingFixedCost').value) || null,
        description: document.getElementById('pricingDesc').value,
        isDefault: document.getElementById('pricingDefault').value === 'true'
    };

    try {
        await fetch(`${API_BASE}/pricing/craftsman/${currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pricing)
        });

        closePricingModal();
        loadPricingSchemes();
        alert('保存成功');
    } catch (error) {
        alert('保存失败');
    }
}

async function setDefaultPricing(id) {
    try {
        await fetch(`${API_BASE}/pricing/craftsman/${currentUser.id}/default/${id}`, { method: 'POST' });
        loadPricingSchemes();
        alert('已设为默认定价方案');
    } catch (error) {
        alert('设置失败');
    }
}

async function deletePricing(id) {
    const result = window.confirm('确定要删除这个定价方案吗？');
    if (result !== true) {
        return;
    }

    try {
        await fetch(`${API_BASE}/pricing/${id}`, { method: 'DELETE' });
        loadPricingSchemes();
        alert('删除成功');
    } catch (error) {
        alert('删除失败');
    }
}

init();