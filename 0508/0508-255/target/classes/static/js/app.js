let currentPage = 'players';
let currentPlayerId = 1;
let currentTeamId = 1;
let teams = [];
let players = [];

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadPage(currentPage);
});

function initNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            loadPage(e.target.dataset.page);
        });
    });
}

async function loadPage(page) {
    currentPage = page;
    const content = document.getElementById('content');
    
    switch(page) {
        case 'players':
            await renderPlayersPage();
            break;
        case 'friends':
            await renderFriendsPage();
            break;
        case 'blacklist':
            await renderBlacklistPage();
            break;
        case 'teams':
            await renderTeamsPage();
            break;
        case 'team-members':
            await renderTeamMembersPage();
            break;
        case 'activities':
            await renderActivitiesPage();
            break;
        case 'welfares':
            await renderWelfaresPage();
            break;
    }
}

async function renderPlayersPage() {
    players = await api.getPlayers();
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="page-header">
            <h2>👥 玩家管理</h2>
            <button class="btn btn-primary" onclick="openPlayerModal()">+ 新增玩家</button>
        </div>
        <div class="search-bar">
            <input type="text" id="playerSearch" placeholder="搜索玩家昵称..." onkeyup="searchPlayers()">
        </div>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>用户名</th>
                    <th>昵称</th>
                    <th>等级</th>
                    <th>注册时间</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody id="playersTableBody">
                ${players.map(p => `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.username}</td>
                        <td>${p.nickname}</td>
                        <td><span class="badge">Lv.${p.level}</span></td>
                        <td>${p.createTime ? new Date(p.createTime).toLocaleDateString() : '-'}</td>
                        <td>
                            <button class="btn btn-small btn-info" onclick="selectPlayer(${p.id})">选择</button>
                            <button class="btn btn-small btn-danger" onclick="deletePlayer(${p.id})">删除</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function searchPlayers() {
    const keyword = document.getElementById('playerSearch').value;
    if (keyword.trim() === '') {
        renderPlayersPage();
        return;
    }
    const results = await api.searchPlayers(keyword);
    const tbody = document.getElementById('playersTableBody');
    tbody.innerHTML = results.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.username}</td>
            <td>${p.nickname}</td>
            <td><span class="badge">Lv.${p.level}</span></td>
            <td>${p.createTime ? new Date(p.createTime).toLocaleDateString() : '-'}</td>
            <td>
                <button class="btn btn-small btn-info" onclick="selectPlayer(${p.id})">选择</button>
                <button class="btn btn-small btn-danger" onclick="deletePlayer(${p.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function selectPlayer(id) {
    currentPlayerId = id;
    alert(`已选择玩家 ID: ${id}`);
}

async function deletePlayer(id) {
    if (confirm('确定要删除该玩家吗？')) {
        await api.deletePlayer(id);
        loadPage('players');
    }
}

function openPlayerModal(player = null) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${player ? '编辑玩家' : '新增玩家'}</h3>
                <button class="close-btn" onclick="closeModal(this)">&times;</button>
            </div>
            <form onsubmit="savePlayer(event, ${player ? player.id : 'null'})">
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" id="playerUsername" value="${player ? player.username : ''}" required>
                </div>
                <div class="form-group">
                    <label>昵称</label>
                    <input type="text" id="playerNickname" value="${player ? player.nickname : ''}" required>
                </div>
                <div class="form-group">
                    <label>等级</label>
                    <input type="number" id="playerLevel" value="${player ? player.level : 1}" min="1" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="closeModal(this)">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function savePlayer(event, id) {
    event.preventDefault();
    const player = {
        username: document.getElementById('playerUsername').value,
        nickname: document.getElementById('playerNickname').value,
        level: parseInt(document.getElementById('playerLevel').value)
    };
    
    if (id) {
        await api.updatePlayer(id, player);
    } else {
        await api.createPlayer(player);
    }
    closeAllModals();
    loadPage('players');
}

async function renderFriendsPage() {
    const friends = await api.getFriends(currentPlayerId);
    
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="page-header">
            <h2>👫 好友关系</h2>
            <button class="btn btn-primary" onclick="openAddFriendModal()">+ 添加好友</button>
        </div>
        <p style="margin-bottom: 20px;">当前玩家 ID: ${currentPlayerId} | 好友数量: ${friends.length}</p>
        ${friends.length === 0 ? `
            <div class="empty-state">
                <h3>暂无好友</h3>
                <p>点击上方按钮添加好友吧！</p>
            </div>
        ` : `
            <table>
                <thead>
                    <tr>
                        <th>好友ID</th>
                        <th>好友昵称</th>
                        <th>添加时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${friends.map(f => `
                        <tr>
                            <td>${f.friendId}</td>
                            <td>${f.friendNickname}</td>
                            <td>${f.createTime ? new Date(f.createTime).toLocaleDateString() : '-'}</td>
                            <td>
                                <button class="btn btn-small btn-danger" onclick="removeFriend(${f.playerId}, ${f.friendId})">删除好友</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `}
    `;
}

function openAddFriendModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>添加好友</h3>
                <button class="close-btn" onclick="closeModal(this)">&times;</button>
            </div>
            <form onsubmit="addFriend(event)">
                <div class="form-group">
                    <label>当前玩家ID</label>
                    <input type="number" id="currentPlayerId" value="${currentPlayerId}" readonly>
                </div>
                <div class="form-group">
                    <label>好友玩家ID</label>
                    <input type="number" id="friendPlayerId" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="closeModal(this)">取消</button>
                    <button type="submit" class="btn btn-primary">添加</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function addFriend(event) {
    event.preventDefault();
    const playerId = parseInt(document.getElementById('currentPlayerId').value);
    const friendId = parseInt(document.getElementById('friendPlayerId').value);
    
    try {
        await api.addFriend(playerId, friendId);
        closeAllModals();
        loadPage('friends');
    } catch (e) {
        alert('添加失败：' + e.message);
    }
}

async function removeFriend(playerId, friendId) {
    if (confirm('确定要删除该好友吗？')) {
        await api.removeFriend(playerId, friendId);
        loadPage('friends');
    }
}

async function renderBlacklistPage() {
    const blacklists = await api.getAllBlacklists();
    
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="page-header">
            <h2>🚫 黑名单管理</h2>
            <button class="btn btn-primary" onclick="openAddBlacklistModal()">+ 添加到黑名单</button>
        </div>
        ${blacklists.length === 0 ? `
            <div class="empty-state">
                <h3>黑名单为空</h3>
            </div>
        ` : `
            <table>
                <thead>
                    <tr>
                        <th>玩家ID</th>
                        <th>被拉黑玩家</th>
                        <th>拉黑原因</th>
                        <th>拉黑时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${blacklists.map(b => `
                        <tr>
                            <td>${b.playerId}</td>
                            <td>${b.blockedNickname}</td>
                            <td>${b.reason}</td>
                            <td>${b.createTime ? new Date(b.createTime).toLocaleDateString() : '-'}</td>
                            <td>
                                <button class="btn btn-small btn-success" onclick="removeFromBlacklist(${b.playerId}, ${b.blockedPlayerId})">解除</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `}
    `;
}

function openAddBlacklistModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>添加到黑名单</h3>
                <button class="close-btn" onclick="closeModal(this)">&times;</button>
            </div>
            <form onsubmit="addToBlacklist(event)">
                <div class="form-group">
                    <label>当前玩家ID</label>
                    <input type="number" id="blacklistPlayerId" value="${currentPlayerId}" readonly>
                </div>
                <div class="form-group">
                    <label>被拉黑玩家ID</label>
                    <input type="number" id="blockedPlayerId" required>
                </div>
                <div class="form-group">
                    <label>拉黑原因</label>
                    <textarea id="blacklistReason" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="closeModal(this)">取消</button>
                    <button type="submit" class="btn btn-primary">拉黑</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function addToBlacklist(event) {
    event.preventDefault();
    const playerId = parseInt(document.getElementById('blacklistPlayerId').value);
    const blockedPlayerId = parseInt(document.getElementById('blockedPlayerId').value);
    const reason = document.getElementById('blacklistReason').value;
    
    try {
        await api.addToBlacklist(playerId, blockedPlayerId, reason);
        closeAllModals();
        loadPage('blacklist');
    } catch (e) {
        alert('操作失败');
    }
}

async function removeFromBlacklist(playerId, blockedPlayerId) {
    if (confirm('确定要解除拉黑吗？')) {
        await api.removeFromBlacklist(playerId, blockedPlayerId);
        loadPage('blacklist');
    }
}

async function renderTeamsPage() {
    teams = await api.getTeams();
    
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="page-header">
            <h2>⚔️ 战队管理</h2>
            <button class="btn btn-primary" onclick="openTeamModal()">+ 创建战队</button>
        </div>
        <div class="filter-bar">
            <select id="teamStatusFilter" onchange="filterTeams()">
                <option value="">全部状态</option>
                <option value="PENDING">待审批</option>
                <option value="APPROVED">已通过</option>
                <option value="REJECTED">已拒绝</option>
            </select>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>${teams.length}</h3>
                <p>战队总数</p>
            </div>
            <div class="stat-card">
                <h3>${teams.filter(t => t.status === 'PENDING').length}</h3>
                <p>待审批</p>
            </div>
            <div class="stat-card">
                <h3>${teams.filter(t => t.status === 'APPROVED').length}</h3>
                <p>已通过</p>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>战队名称</th>
                    <th>队长</th>
                    <th>人数</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody id="teamsTableBody">
                ${teams.map(t => `
                    <tr>
                        <td>${t.id}</td>
                        <td>${t.name}</td>
                        <td>${t.leaderName}</td>
                        <td>${t.currentMembers}/${t.maxMembers}</td>
                        <td><span class="status-badge status-${t.status.toLowerCase()}">${getStatusText(t.status)}</span></td>
                        <td>${t.createTime ? new Date(t.createTime).toLocaleDateString() : '-'}</td>
                        <td>
                            <button class="btn btn-small btn-info" onclick="selectTeam(${t.id})">选择</button>
                            ${t.status === 'PENDING' ? `
                                <button class="btn btn-small btn-success" onclick="approveTeam(${t.id})">通过</button>
                                <button class="btn btn-small btn-danger" onclick="openRejectModal(${t.id})">拒绝</button>
                            ` : ''}
                            <button class="btn btn-small btn-warning" onclick="openTeamModal(${t.id})">编辑</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getStatusText(status) {
    const map = { 'PENDING': '待审批', 'APPROVED': '已通过', 'REJECTED': '已拒绝' };
    return map[status] || status;
}

async function filterTeams() {
    const status = document.getElementById('teamStatusFilter').value;
    if (status === '') {
        renderTeamsPage();
        return;
    }
    const filtered = await api.getTeamsByStatus(status);
    const tbody = document.getElementById('teamsTableBody');
    tbody.innerHTML = filtered.map(t => `
        <tr>
            <td>${t.id}</td>
            <td>${t.name}</td>
            <td>${t.leaderName}</td>
            <td>${t.currentMembers}/${t.maxMembers}</td>
            <td><span class="status-badge status-${t.status.toLowerCase()}">${getStatusText(t.status)}</span></td>
            <td>${t.createTime ? new Date(t.createTime).toLocaleDateString() : '-'}</td>
            <td>
                <button class="btn btn-small btn-info" onclick="selectTeam(${t.id})">选择</button>
                ${t.status === 'PENDING' ? `
                    <button class="btn btn-small btn-success" onclick="approveTeam(${t.id})">通过</button>
                    <button class="btn btn-small btn-danger" onclick="openRejectModal(${t.id})">拒绝</button>
                ` : ''}
                <button class="btn btn-small btn-warning" onclick="openTeamModal(${t.id})">编辑</button>
            </td>
        </tr>
    `).join('');
}

function selectTeam(id) {
    currentTeamId = id;
    alert(`已选择战队 ID: ${id}`);
}

async function approveTeam(id) {
    if (confirm('确定要通过该战队申请吗？')) {
        await api.approveTeam(id);
        loadPage('teams');
    }
}

function openRejectModal(teamId) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>拒绝战队申请</h3>
                <button class="close-btn" onclick="closeModal(this)">&times;</button>
            </div>
            <form onsubmit="rejectTeam(event, ${teamId})">
                <div class="form-group">
                    <label>拒绝原因</label>
                    <textarea id="rejectReason" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="closeModal(this)">取消</button>
                    <button type="submit" class="btn btn-danger">拒绝</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function rejectTeam(event, teamId) {
    event.preventDefault();
    const reason = document.getElementById('rejectReason').value;
    await api.rejectTeam(teamId, reason);
    closeAllModals();
    loadPage('teams');
}

async function openTeamModal(teamId = null) {
    let team = null;
    if (teamId) {
        team = await api.getTeam(teamId);
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${team ? '编辑战队' : '创建战队'}</h3>
                <button class="close-btn" onclick="closeModal(this)">&times;</button>
            </div>
            <form onsubmit="saveTeam(event, ${teamId})">
                <div class="form-group">
                    <label>战队名称</label>
                    <input type="text" id="teamName" value="${team ? team.name : ''}" required>
                </div>
                <div class="form-group">
                    <label>战队描述</label>
                    <textarea id="teamDescription" required>${team ? team.description : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>队长ID</label>
                    <input type="number" id="teamLeaderId" value="${team ? team.leaderId : currentPlayerId}" required>
                </div>
                <div class="form-group">
                    <label>队长名称</label>
                    <input type="text" id="teamLeaderName" value="${team ? team.leaderName : ''}" required>
                </div>
                <div class="form-group">
                    <label>最大人数</label>
                    <input type="number" id="teamMaxMembers" value="${team ? team.maxMembers : 50}" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="closeModal(this)">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveTeam(event, teamId) {
    event.preventDefault();
    const team = {
        name: document.getElementById('teamName').value,
        description: document.getElementById('teamDescription').value,
        leaderId: parseInt(document.getElementById('teamLeaderId').value),
        leaderName: document.getElementById('teamLeaderName').value,
        maxMembers: parseInt(document.getElementById('teamMaxMembers').value)
    };
    
    if (teamId) {
        await api.updateTeam(teamId, team);
    } else {
        await api.createTeam(team);
    }
    closeAllModals();
    loadPage('teams');
}

async function renderTeamMembersPage() {
    const members = await api.getTeamMembers(currentTeamId);
    const team = await api.getTeam(currentTeamId);
    
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="page-header">
            <h2>👥 战队成员管理</h2>
            <button class="btn btn-primary" onclick="openAddMemberModal()">+ 添加成员</button>
        </div>
        <p style="margin-bottom: 20px;">当前战队: ${team.name} (ID: ${currentTeamId}) | 成员数: ${members.length}/${team.maxMembers}</p>
        ${members.length === 0 ? `
            <div class="empty-state">
                <h3>暂无成员</h3>
            </div>
        ` : `
            <table>
                <thead>
                    <tr>
                        <th>玩家ID</th>
                        <th>玩家名称</th>
                        <th>职位</th>
                        <th>加入时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${members.map(m => `
                        <tr>
                            <td>${m.playerId}</td>
                            <td>${m.playerName}</td>
                            <td><span class="role-badge role-${m.role.toLowerCase()}">${getRoleText(m.role)}</span></td>
                            <td>${m.joinTime ? new Date(m.joinTime).toLocaleDateString() : '-'}</td>
                            <td>
                                <select onchange="changeRole(${m.teamId}, ${m.playerId}, this.value)" style="padding: 5px;">
                                    <option value="MEMBER" ${m.role === 'MEMBER' ? 'selected' : ''}>普通队员</option>
                                    <option value="MANAGER" ${m.role === 'MANAGER' ? 'selected' : ''}>管理员</option>
                                    <option value="CAPTAIN" ${m.role === 'CAPTAIN' ? 'selected' : ''}>队长</option>
                                </select>
                                ${m.role !== 'CAPTAIN' ? `
                                    <button class="btn btn-small btn-danger" onclick="removeMember(${m.teamId}, ${m.playerId})">移除</button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `}
    `;
}

function getRoleText(role) {
    const map = { 'CAPTAIN': '队长', 'MANAGER': '管理员', 'MEMBER': '普通队员' };
    return map[role] || role;
}

function openAddMemberModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>添加战队成员</h3>
                <button class="close-btn" onclick="closeModal(this)">&times;</button>
            </div>
            <form onsubmit="addTeamMember(event)">
                <div class="form-group">
                    <label>战队ID</label>
                    <input type="number" id="memberTeamId" value="${currentTeamId}" readonly>
                </div>
                <div class="form-group">
                    <label>玩家ID</label>
                    <input type="number" id="memberPlayerId" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="closeModal(this)">取消</button>
                    <button type="submit" class="btn btn-primary">添加</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function addTeamMember(event) {
    event.preventDefault();
    const teamId = parseInt(document.getElementById('memberTeamId').value);
    const playerId = parseInt(document.getElementById('memberPlayerId').value);
    
    try {
        await api.addTeamMember(teamId, playerId);
        closeAllModals();
        loadPage('team-members');
    } catch (e) {
        alert('添加失败');
    }
}

async function changeRole(teamId, playerId, role) {
    await api.updateMemberRole(teamId, playerId, role);
}

async function removeMember(teamId, playerId) {
    if (confirm('确定要移除该成员吗？')) {
        await api.removeTeamMember(teamId, playerId);
        loadPage('team-members');
    }
}

async function renderActivitiesPage() {
    const activities = await api.getTeamActivities(currentTeamId);
    const team = await api.getTeam(currentTeamId);
    
    const totalActivity = activities.reduce((sum, a) => sum + (a.totalActivity || 0), 0);
    const avgActiveMembers = activities.length > 0 
        ? Math.round(activities.reduce((sum, a) => sum + (a.activeMembers || 0), 0) / activities.length)
        : 0;
    
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="page-header">
            <h2>📊 战队活跃度统计</h2>
            <button class="btn btn-primary" onclick="openRecordActivityModal()">+ 记录活跃度</button>
        </div>
        <p style="margin-bottom: 20px;">当前战队: ${team.name} (ID: ${currentTeamId})</p>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>${totalActivity}</h3>
                <p>总活跃度</p>
            </div>
            <div class="stat-card">
                <h3>${avgActiveMembers}</h3>
                <p>平均活跃人数</p>
            </div>
            <div class="stat-card">
                <h3>${activities.length}</h3>
                <p>统计天数</p>
            </div>
        </div>
        ${activities.length > 0 ? `
            <div class="activity-chart">
                <h4 style="margin-bottom: 15px;">活跃度趋势</h4>
                <div class="chart-bars">
                    ${activities.slice(-7).map((a, i) => {
                        const max = Math.max(...activities.map(x => x.totalActivity || 0));
                        const height = max > 0 ? (a.totalActivity || 0) / max * 100 : 0;
                        return `
                            <div class="chart-bar" style="height: ${height}%;">
                                <span class="chart-bar-value">${a.totalActivity || 0}</span>
                                <span class="chart-bar-label">${a.activityDate ? a.activityDate.slice(5) : ''}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : ''}
        ${activities.length === 0 ? `
            <div class="empty-state">
                <h3>暂无活跃度数据</h3>
            </div>
        ` : `
            <table>
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>活跃人数</th>
                        <th>当日活跃度</th>
                    </tr>
                </thead>
                <tbody>
                    ${activities.map(a => `
                        <tr>
                            <td>${a.activityDate || '-'}</td>
                            <td>${a.activeMembers || 0}</td>
                            <td>${a.totalActivity || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `}
    `;
}

function openRecordActivityModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>记录活跃度</h3>
                <button class="close-btn" onclick="closeModal(this)">&times;</button>
            </div>
            <form onsubmit="recordActivity(event)">
                <div class="form-group">
                    <label>战队ID</label>
                    <input type="number" id="activityTeamId" value="${currentTeamId}" readonly>
                </div>
                <div class="form-group">
                    <label>活跃度点数</label>
                    <input type="number" id="activityPoints" required min="1">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="closeModal(this)">取消</button>
                    <button type="submit" class="btn btn-primary">记录</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function recordActivity(event) {
    event.preventDefault();
    const teamId = parseInt(document.getElementById('activityTeamId').value);
    const points = parseInt(document.getElementById('activityPoints').value);
    
    await api.recordActivity(teamId, points);
    closeAllModals();
    loadPage('activities');
}

async function renderWelfaresPage() {
    const welfares = await api.getTeamWelfares(currentTeamId);
    const team = await api.getTeam(currentTeamId);
    
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="page-header">
            <h2>🎁 战队福利管理</h2>
            <button class="btn btn-primary" onclick="openWelfareModal()">+ 新增福利</button>
        </div>
        <p style="margin-bottom: 20px;">当前战队: ${team.name} (ID: ${currentTeamId})</p>
        ${welfares.length === 0 ? `
            <div class="empty-state">
                <h3>暂无福利配置</h3>
            </div>
        ` : welfares.map(w => `
            <div class="welfare-card ${w.enabled ? 'enabled' : 'disabled'}">
                <div class="welfare-header">
                    <h4>${w.welfareName}</h4>
                    <span class="welfare-type">${getWelfareTypeText(w.welfareType)}</span>
                </div>
                <p style="color: #666; margin-bottom: 10px;">${w.description}</p>
                <div class="welfare-reward">
                    🎁 奖励: ${w.reward}</div>
                <div style="margin-top: 15px;">
                    <button class="btn btn-small ${w.enabled ? 'btn-warning' : 'btn-success'}" 
                            onclick="toggleWelfare(${w.id})">
                        ${w.enabled ? '禁用' : '启用'}
                    </button>
                    <button class="btn btn-small btn-info" onclick="openWelfareModal(${w.id})">编辑</button>
                    <button class="btn btn-small btn-danger" onclick="deleteWelfare(${w.id})">删除</button>
                </div>
            </div>
        `).join('')}
    `;
}

function getWelfareTypeText(type) {
    const map = { 'DAILY_CHECKIN': '每日签到', 'TEAM_TASK': '团队任务', 'OTHER': '其他' };
    return map[type] || type;
}

async function openWelfareModal(welfareId = null) {
    let welfare = null;
    if (welfareId) {
        const welfares = await api.getTeamWelfares(currentTeamId);
        welfare = welfares.find(w => w.id === welfareId);
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${welfare ? '编辑福利' : '新增福利'}</h3>
                <button class="close-btn" onclick="closeModal(this)">&times;</button>
            </div>
            <form onsubmit="saveWelfare(event, ${welfareId})">
                <input type="hidden" id="welfareTeamId" value="${currentTeamId}">
                <div class="form-group">
                    <label>福利名称</label>
                    <input type="text" id="welfareName" value="${welfare ? welfare.welfareName : ''}" required>
                </div>
                <div class="form-group">
                    <label>福利类型</label>
                    <select id="welfareType" required>
                        <option value="DAILY_CHECKIN" ${welfare && welfare.welfareType === 'DAILY_CHECKIN' ? 'selected' : ''}>每日签到</option>
                        <option value="TEAM_TASK" ${welfare && welfare.welfareType === 'TEAM_TASK' ? 'selected' : ''}>团队任务</option>
                        <option value="OTHER" ${welfare && welfare.welfareType === 'OTHER' ? 'selected' : ''}>其他</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>福利描述</label>
                    <textarea id="welfareDescription" required>${welfare ? welfare.description : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>奖励内容</label>
                    <input type="text" id="welfareReward" value="${welfare ? welfare.reward : ''}" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="closeModal(this)">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveWelfare(event, welfareId) {
    event.preventDefault();
    const welfare = {
        teamId: parseInt(document.getElementById('welfareTeamId').value),
        welfareName: document.getElementById('welfareName').value,
        welfareType: document.getElementById('welfareType').value,
        description: document.getElementById('welfareDescription').value,
        reward: document.getElementById('welfareReward').value
    };
    
    if (welfareId) {
        await api.updateWelfare(welfareId, welfare);
    } else {
        await api.createWelfare(welfare);
    }
    closeAllModals();
    loadPage('welfares');
}

async function toggleWelfare(id) {
    await api.toggleWelfareStatus(id);
    loadPage('welfares');
}

async function deleteWelfare(id) {
    if (confirm('确定要删除该福利吗？')) {
        await api.deleteWelfare(id);
        loadPage('welfares');
    }
}

function closeModal(btn) {
    btn.closest('.modal').remove();
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.remove());
}
