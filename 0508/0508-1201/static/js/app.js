const API_BASE = 'http://localhost:5000/api';

let currentPoolId = null;
let currentPoolData = null;
let userData = null;
let historyPage = 1;
const HISTORY_PER_PAGE = 20;

async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
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

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

async function loadUserInfo() {
    const data = await apiFetch('/user/info');
    if (data.success) {
        userData = data.data;
        updateUserInfoDisplay();
    }
}

function updateUserInfoDisplay() {
    if (!userData) return;
    const usernameEl = document.querySelector('.user-info .username');
    const freeDrawsEl = document.querySelector('.user-info .free-draws');
    if (usernameEl) usernameEl.textContent = userData.username;
    if (freeDrawsEl) freeDrawsEl.textContent = `免费抽卡: ${userData.free_draws}次`;
}

async function loadPools() {
    const data = await apiFetch('/pools');
    if (data.success) {
        const pools = data.data;
        if (pools.length > 0) {
            currentPoolId = pools[0].id;
            currentPoolData = pools[0];
        }
        renderPoolTabs(pools);
        renderPoolInfo();
    }
}

function renderPoolTabs(pools) {
    const container = document.getElementById('poolTabs');
    if (!container) return;

    const poolNames = [...new Set(pools.map(p => p.name))];
    container.innerHTML = poolNames.map(name => {
        const pool = pools.find(p => p.name === name);
        return `
            <div class="pool-tab ${pool.id === currentPoolId ? 'active' : ''}" data-pool-id="${pool.id}">
                ${name}
                <span class="version">${pool.version}</span>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.pool-tab').forEach(tab => {
        tab.addEventListener('click', async () => {
            const poolId = parseInt(tab.dataset.poolId);
            await switchPool(poolId);
        });
    });
}

async function switchPool(poolId) {
    currentPoolId = poolId;
    const data = await apiFetch('/pools');
    if (data.success) {
        currentPoolData = data.data.find(p => p.id === poolId);
    }

    document.querySelectorAll('.pool-tab').forEach(tab => {
        tab.classList.toggle('active', parseInt(tab.dataset.poolId) === poolId);
    });

    renderPoolInfo();
    clearResults();
}

function renderPoolInfo() {
    if (!currentPoolData) return;
    const container = document.getElementById('poolInfo');
    if (!container) return;

    const cards = currentPoolData.cards || [];
    const ssrCards = cards.filter(c => c.rarity === 'SSR');

    container.innerHTML = `
        <h3>${currentPoolData.name} <small style="color:#666;font-size:0.8em">${currentPoolData.version}</small></h3>
        <p style="color:#666;margin-bottom:10px">${currentPoolData.description || ''}</p>
        <div class="pity-info">
            保底阈值: ${currentPoolData.pity_threshold}抽
            ${ssrCards.length > 0 ? ` | SSR卡牌: ${ssrCards.map(c => c.name).join(', ')}` : ''}
        </div>
        <div style="margin-top:10px">
            ${cards.map(c => `
                <span class="badge rarity-${c.rarity}" style="
                    display:inline-block;
                    padding:4px 10px;
                    margin:3px;
                    border-radius:12px;
                    font-size:0.85em;
                    background:${getRarityColor(c.rarity)}20;
                    color:${getRarityColor(c.rarity)};
                    border:1px solid ${getRarityColor(c.rarity)};
                ">
                    ${c.name} (${(c.probability * 100).toFixed(1)}%)
                </span>
            `).join('')}
        </div>
    `;
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

async function draw(times) {
    if (!currentPoolId) {
        showToast('请先选择卡池', 'error');
        return;
    }

    if (userData && userData.free_draws < times) {
        showToast('免费抽卡次数不足', 'error');
        return;
    }

    const resultsContainer = document.getElementById('drawResults');
    resultsContainer.innerHTML = '<div class="draw-animation"><div class="spinner"></div></div>';

    try {
        const data = await apiFetch('/draw', {
            method: 'POST',
            body: JSON.stringify({
                pool_id: currentPoolId,
                times: times,
            }),
        });

        if (data.success) {
            renderDrawResults(data.data.results);
            userData.free_draws = data.data.remaining_free_draws;
            updateUserInfoDisplay();
            loadStats();
        } else {
            resultsContainer.innerHTML = '';
            showToast(data.message || '抽卡失败', 'error');
        }
    } catch (error) {
        resultsContainer.innerHTML = '';
        showToast('网络错误，请重试', 'error');
    }
}

function renderDrawResults(cards) {
    const container = document.getElementById('drawResults');
    container.innerHTML = cards.map((card, index) => {
        const uniqueKey = `${card.id}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
        return `
        <div class="card rarity-${card.rarity}" data-key="${uniqueKey}" style="animation-delay: ${index * 0.1}s">
            <div class="card-image">
                ${card.image_url
                    ? `<img src="${card.image_url}" alt="${card.name}" onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\'>🎴</div>'">`
                    : '<div class="placeholder">🎴</div>'
                }
            </div>
            <div class="card-body">
                <div class="card-name">${card.name}</div>
                <div class="card-rarity">${card.rarity}</div>
                ${card.is_pity ? '<div class="card-pity">✨ 保底出金！</div>' : ''}
                ${card.is_soft_pity ? `<div class="card-pity" style="color:#ff9800">🔥 概率加成+${card.soft_pity_bonus}%</div>` : ''}
            </div>
        </div>
    `;
    }).join('');
}

function clearResults() {
    const container = document.getElementById('drawResults');
    if (container) container.innerHTML = '';
}

async function loadStats() {
    const data = await apiFetch(`/stats?pool_id=${currentPoolId || ''}`);
    if (data.success) {
        renderStats(data.data);
    }
}

function renderStats(stats) {
    const container = document.getElementById('statsSection');
    if (!container) return;

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.total_draws}</div>
            <div class="stat-label">总抽卡次数</div>
        </div>
        <div class="stat-card ssr">
            <div class="stat-value">${stats.ssr_count}</div>
            <div class="stat-label">SSR数量</div>
        </div>
        <div class="stat-card sr">
            <div class="stat-value">${stats.sr_count}</div>
            <div class="stat-label">SR数量</div>
        </div>
        <div class="stat-card r">
            <div class="stat-value">${stats.r_count}</div>
            <div class="stat-label">R数量</div>
        </div>
        <div class="stat-card n">
            <div class="stat-value">${stats.n_count}</div>
            <div class="stat-label">N数量</div>
        </div>
        <div class="stat-card" style="background:linear-gradient(135deg, #11998e 0%, #38ef7d 100%)">
            <div class="stat-value">${stats.ssr_rate}%</div>
            <div class="stat-label">SSR出货率</div>
        </div>
    `;

    const pityContainer = document.getElementById('pityInfo');
    if (pityContainer && stats.pity_counters.length > 0) {
        pityContainer.innerHTML = stats.pity_counters.map(pc => {
            const pool = currentPoolData && currentPoolData.id === pc.pool_id ? currentPoolData : null;
            const threshold = pool ? pool.pity_threshold : 90;
            const softPityStart = 60;
            const nextDraw = pc.counter + 1;
            let softPityBonus = 0;
            if (nextDraw >= softPityStart && nextDraw < threshold) {
                softPityBonus = (nextDraw - softPityStart + 1);
            }

            const ssrCards = pool ? pool.cards.filter(c => c.rarity === 'SSR') : [];
            const baseSsrProb = ssrCards.length > 0
                ? ssrCards.reduce((sum, c) => sum + c.probability, 0) * 100
                : 2;
            const currentSsrProb = baseSsrProb + softPityBonus;

            const softPityStartPercent = (softPityStart / threshold * 100).toFixed(1);
            const currentPercent = (pc.counter / threshold * 100).toFixed(1);

            return `
                <div style="margin:5px 0; padding:12px; background:#fff3cd; border-radius:8px; font-size:0.9em">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                        <strong>卡池 #${pc.pool_id} 保底进度</strong>
                        <span style="font-weight:bold; color:#d32f2f">${pc.counter}/${threshold}</span>
                    </div>
                    <div style="height:10px; background:#e0e0e0; border-radius:5px; margin-bottom:8px; position:relative; overflow:hidden">
                        <div style="position:absolute; left:0; top:0; bottom:0; width:${softPityStartPercent}%; background:rgba(255, 152, 0, 0.2); border-right:2px dashed #ff9800"></div>
                        <div style="position:absolute; left:${softPityStartPercent}%; top:0; bottom:0; right:0; background:rgba(244, 67, 54, 0.2)"></div>
                        <div style="height:100%; width:${currentPercent}%; background:linear-gradient(90deg, #ffc107, #f44336); border-radius:5px; position:relative; z-index:1; transition:width 0.3s"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.8em; color:#666">
                        <span>← 正常概率</span>
                        <span style="color:#ff9800">软保底 (60抽起) →</span>
                        <span style="color:#f44336">硬保底 (${threshold}抽) →</span>
                    </div>
                    ${softPityBonus > 0 ? `
                        <div style="margin-top:8px; padding:6px 10px; background:rgba(255, 152, 0, 0.1); border-radius:4px; color:#e65100; font-weight:bold">
                            🔥 软保底生效中！下抽SSR概率加成: +${softPityBonus}% (当前: ${currentSsrProb.toFixed(1)}%)
                        </div>
                    ` : `
                        <div style="margin-top:8px; font-size:0.85em; color:#666">
                            基础SSR概率: ${baseSsrProb.toFixed(1)}% ${nextDraw < softPityStart ? `| 距离软保底还有 ${softPityStart - nextDraw} 抽` : ''}
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }
}

async function loadHistory() {
    const data = await apiFetch(`/history?pool_id=${currentPoolId || ''}&page=${historyPage}&per_page=${HISTORY_PER_PAGE}`);
    if (data.success) {
        renderHistory(data.data);
    }
}

function renderHistory(data) {
    const container = document.getElementById('historyList');
    if (!container) return;

    if (data.records.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#999">暂无抽卡记录</div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    container.innerHTML = data.records.map(record => `
        <div class="history-item">
            <div class="item-rarity ${record.rarity}"></div>
            <div class="item-info">
                <div class="item-name">${record.card_name} <span style="color:${getRarityColor(record.rarity)}">[${record.rarity}]</span></div>
                <div class="item-meta">
                    ${record.pool_name} ${record.version}
                    ${record.is_pity ? ' | <span style="color:#f5576c">✨ 硬保底</span>' : ''}
                    ${record.is_soft_pity ? ' | <span style="color:#ff9800">🔥 软保底</span>' : ''}
                    | ${formatDate(record.created_at)}
                </div>
            </div>
        </div>
    `).join('');

    renderPagination(data.total, data.page);
}

function renderPagination(total, currentPage) {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.ceil(total / HISTORY_PER_PAGE);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>
        <span class="page-info">第 ${currentPage} / ${totalPages} 页</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
    `;
}

function changePage(page) {
    historyPage = page;
    loadHistory();
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabId}Tab`);
    });

    if (tabId === 'history') {
        historyPage = 1;
        loadHistory();
    } else if (tabId === 'stats') {
        loadStats();
    }
}

async function init() {
    await loadUserInfo();
    await loadPools();
    loadStats();
}

init();
