const API_BASE = 'http://localhost:5000/api';

async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    });
    return response.json();
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function loadPools() {
    const data = await apiFetch('/admin/pools');
    if (data.success) {
        renderPoolList(data.data);
    }
}

function renderPoolList(pools) {
    const container = document.getElementById('poolList');
    if (!container) return;

    if (pools.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#999">暂无卡池，请创建</div>';
        return;
    }

    container.innerHTML = pools.map(pool => `
        <div class="pool-item">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
                <div>
                    <h4 style="margin-bottom:5px">${pool.name} <small style="color:#666">${pool.version}</small></h4>
                    <p style="color:#666; font-size:0.9em; margin-bottom:5px">${pool.description || '无描述'}</p>
                    <p style="font-size:0.85em; color:#888">
                        保底阈值: ${pool.pity_threshold} | 
                        状态: ${pool.is_active ? '<span style="color:#11998e">启用</span>' : '<span style="color:#f5576c">禁用</span>'}
                        | 卡牌数: ${pool.cards.length}
                    </p>
                </div>
            </div>
            <div style="margin-top:10px">
                <h5 style="margin-bottom:8px">卡牌列表:</h5>
                <div style="display:flex; flex-wrap:wrap; gap:5px">
                    ${pool.cards.map(card => `
                        <span style="
                            padding:4px 10px;
                            border-radius:12px;
                            font-size:0.8em;
                            background:${getRarityColor(card.rarity)}20;
                            color:${getRarityColor(card.rarity)};
                            border:1px solid ${getRarityColor(card.rarity)};
                        ">
                            ${card.name} (${(card.probability * 100).toFixed(1)}%)
                            <button onclick="deleteCard(${card.id})" style="
                                margin-left:5px;
                                background:none;
                                border:none;
                                color:${getRarityColor(card.rarity)};
                                cursor:pointer;
                                font-size:0.9em;
                            ">×</button>
                        </span>
                    `).join('')}
                </div>
            </div>
            <div class="pool-actions">
                <button class="btn btn-primary btn-sm" onclick="openEditPoolModal(${pool.id})">编辑</button>
                <button class="btn btn-success btn-sm" onclick="openAddCardModal(${pool.id})">添加卡牌</button>
                <button class="btn btn-sm" onclick="normalizeProbabilities(${pool.id})" style="background:#ffc107;color:#333">归一化概率</button>
                <button class="btn btn-danger btn-sm" onclick="deletePool(${pool.id})">删除</button>
            </div>
        </div>
    `).join('');
}

function getRarityColor(rarity) {
    const colors = {
        'SSR': '#ffd700',
        'SR': '#9370db',
        'R': '#4169e1',
        'N': '#808080',
    };
    return colors[rarity] || '#808080';
}

function openCreatePoolModal() {
    document.getElementById('poolForm').reset();
    document.getElementById('poolForm').dataset.mode = 'create';
    document.getElementById('poolForm').dataset.poolId = '';
    document.getElementById('modalTitle').textContent = '创建卡池';
    document.getElementById('poolModal').classList.add('active');
}

async function openEditPoolModal(poolId) {
    const data = await apiFetch('/admin/pools');
    if (!data.success) return;

    const pool = data.data.find(p => p.id === poolId);
    if (!pool) return;

    document.getElementById('poolName').value = pool.name;
    document.getElementById('poolDescription').value = pool.description || '';
    document.getElementById('poolPityThreshold').value = pool.pity_threshold;
    document.getElementById('poolVersion').value = pool.version;
    document.getElementById('poolIsActive').checked = pool.is_active === 1;

    document.getElementById('poolForm').dataset.mode = 'edit';
    document.getElementById('poolForm').dataset.poolId = poolId;
    document.getElementById('modalTitle').textContent = '编辑卡池';
    document.getElementById('poolModal').classList.add('active');
}

function closePoolModal() {
    document.getElementById('poolModal').classList.remove('active');
}

async function savePool(e) {
    e.preventDefault();

    const form = e.target;
    const mode = form.dataset.mode;
    const poolId = form.dataset.poolId;

    const poolData = {
        name: form.poolName.value,
        description: form.poolDescription.value,
        pity_threshold: parseInt(form.poolPityThreshold.value),
        version: form.poolVersion.value,
        is_active: form.poolIsActive.checked ? 1 : 0,
    };

    let result;
    if (mode === 'create') {
        result = await apiFetch('/admin/pools', {
            method: 'POST',
            body: JSON.stringify(poolData),
        });
    } else {
        result = await apiFetch(`/admin/pools/${poolId}`, {
            method: 'PUT',
            body: JSON.stringify(poolData),
        });
    }

    if (result.success) {
        showToast(mode === 'create' ? '卡池创建成功' : '卡池更新成功', 'success');
        closePoolModal();
        loadPools();
    } else {
        showToast(result.message || '操作失败', 'error');
    }
}

async function deletePool(poolId) {
    if (!confirm('确定要删除这个卡池吗？相关卡牌和记录也会被删除。')) return;

    const result = await apiFetch(`/admin/pools/${poolId}`, {
        method: 'DELETE',
    });

    if (result.success) {
        showToast('卡池删除成功', 'success');
        loadPools();
    } else {
        showToast('删除失败', 'error');
    }
}

function openAddCardModal(poolId) {
    document.getElementById('cardForm').reset();
    document.getElementById('cardForm').dataset.poolId = poolId;
    document.getElementById('cardModal').classList.add('active');
}

function closeCardModal() {
    document.getElementById('cardModal').classList.remove('active');
}

async function saveCard(e) {
    e.preventDefault();

    const form = e.target;
    const poolId = parseInt(form.dataset.poolId);

    const cardData = {
        pool_id: poolId,
        name: form.cardName.value,
        rarity: form.cardRarity.value,
        probability: parseFloat(form.cardProbability.value),
        image_url: form.cardImageUrl.value,
    };

    const result = await apiFetch('/admin/cards', {
        method: 'POST',
        body: JSON.stringify(cardData),
    });

    if (result.success) {
        showToast('卡牌添加成功', 'success');
        closeCardModal();
        loadPools();
    } else {
        showToast(result.message || '添加失败', 'error');
    }
}

async function deleteCard(cardId) {
    if (!confirm('确定要删除这张卡牌吗？')) return;

    const result = await apiFetch(`/admin/cards/${cardId}`, {
        method: 'DELETE',
    });

    if (result.success) {
        showToast('卡牌删除成功', 'success');
        loadPools();
    } else {
        showToast('删除失败', 'error');
    }
}

async function normalizeProbabilities(poolId) {
    const result = await apiFetch(`/admin/normalize-probabilities/${poolId}`, {
        method: 'POST',
    });

    if (result.success) {
        showToast('概率归一化成功', 'success');
        loadPools();
    } else {
        showToast('操作失败', 'error');
    }
}

async function init() {
    await loadPools();
}

init();
