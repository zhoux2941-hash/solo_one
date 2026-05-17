let currentUser = null;
let currentRoom = null;
let heartbeatInterval = null;
let refreshInterval = null;
let playerCache = {};

function init() {
    loadRanks();
    loadGameModes();
    updateStats();
    loadPlayers();
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainSection();
        startHeartbeat();
    }
}

async function loadRanks() {
    const result = await PlayerAPI.getRanks();
    if (result.code === 200) {
        const selects = ['regRank', 'minRank', 'maxRank'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '<option value="">不限</option>';
                result.data.forEach(rank => {
                    select.innerHTML += `<option value="${rank}">${rank}</option>`;
                });
            }
        });
    }
}

async function loadGameModes() {
    const result = await RoomAPI.getModes();
    if (result.code === 200) {
        const select = document.getElementById('gameMode');
        select.innerHTML = '';
        result.data.forEach(mode => {
            select.innerHTML += `<option value="${mode}">${mode}</option>`;
        });
    }
}

async function loadPlayers() {
    const result = await PlayerAPI.getAllPlayers();
    if (result.code === 200 && result.data) {
        result.data.forEach(player => {
            playerCache[player.id] = player;
        });
    }
}

function getPlayerNickname(playerId) {
    const player = playerCache[playerId];
    if (player) {
        return player.nickname || player.username || `玩家${playerId}`;
    }
    return `玩家${playerId}`;
}

async function getRoomBalanceInfo(roomId) {
    const result = await RoomAPI.getBalance(roomId);
    if (result.code === 200) {
        return result.data;
    }
    return null;
}

function getBalanceClass(score) {
    if (score >= 80) return 'balance-excellent';
    if (score >= 60) return 'balance-good';
    if (score >= 40) return 'balance-fair';
    return 'balance-poor';
}

async function login() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert('请输入用户名');
        return;
    }
    
    const result = await PlayerAPI.login(username);
    if (result.code === 200) {
        currentUser = result.data;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainSection();
        startHeartbeat();
        alert('登录成功！');
    } else {
        alert(result.message);
    }
}

async function register() {
    const username = document.getElementById('regUsername').value.trim();
    const nickname = document.getElementById('regNickname').value.trim();
    const rank = document.getElementById('regRank').value;
    
    if (!username || !nickname) {
        alert('请填写完整信息');
        return;
    }
    
    const result = await PlayerAPI.register(username, nickname, rank);
    if (result.code === 200) {
        alert('注册成功！请登录');
        showLogin();
    } else {
        alert(result.message);
    }
}

async function logout() {
    if (currentUser) {
        await PlayerAPI.logout(currentUser.id);
    }
    stopHeartbeat();
    stopAutoRefresh();
    currentUser = null;
    currentRoom = null;
    localStorage.removeItem('currentUser');
    showLoginSection();
    alert('已退出登录');
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('registerSection').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
}

function showLoginSection() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('mainSection').style.display = 'none';
}

function showMainSection() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('mainSection').style.display = 'block';
    
    const nickname = currentUser.nickname || currentUser.username || '玩家';
    const rank = currentUser.rank || '未设置';
    document.getElementById('currentUser').textContent = 
        `欢迎, ${nickname} (${rank})`;
    
    document.getElementById('roomType').onchange = (e) => {
        document.getElementById('passwordGroup').style.display = 
            e.target.value === 'PRIVATE' ? 'block' : 'none';
    };
    
    refreshRooms();
    refreshLogs();
    startAutoRefresh();
}

function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.textContent.toLowerCase().includes(tabName.toLowerCase())
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    document.getElementById(tabName + 'Tab').style.display = 'block';
    
    if (tabName === 'myRoom') {
        refreshMyRoom();
    } else if (tabName === 'rooms') {
        refreshRooms();
    } else if (tabName === 'logs') {
        refreshLogs();
    }
}

async function refreshRooms() {
    const result = await RoomAPI.getPublicRooms();
    if (result.code === 200) {
        renderRoomsList(result.data);
    }
}

function renderRoomsList(rooms) {
    const container = document.getElementById('roomsList');
    
    if (rooms.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无公开房间</p>';
        return;
    }
    
    container.innerHTML = rooms.map(room => `
        <div class="room-card">
            <h4>${room.roomName} <small>#${room.roomNumber}</small></h4>
            <div class="room-info">
                <span>🏠 ${room.roomType === 'PUBLIC' ? '公开' : '私密'}</span>
                <span>🎮 ${room.gameMode}</span>
                <span>👥 ${room.currentPlayers}/${room.maxPlayers}</span>
                <span>⭐ ${room.minRank || '不限'} - ${room.maxRank || '不限'}</span>
                <span>👑 ${room.ownerName}</span>
            </div>
            <button onclick="showJoinRoom('${room.roomNumber}')" class="btn btn-primary btn-small">加入房间</button>
        </div>
    `).join('');
    
    container.innerHTML += `
        <div class="join-section">
            <h4>通过房间号加入</h4>
            <div class="join-inputs">
                <input type="text" id="joinRoomNumber" placeholder="输入房间号">
                <input type="text" id="joinPassword" placeholder="密码(私密房间)">
                <button onclick="joinRoomByNumber()" class="btn btn-primary">加入</button>
            </div>
        </div>
    `;
}

function showJoinRoom(roomNumber) {
    const input = document.getElementById('joinRoomNumber');
    if (input) {
        input.value = roomNumber;
    }
}

async function joinRoomByNumber() {
    const roomNumber = document.getElementById('joinRoomNumber').value.trim();
    const password = document.getElementById('joinPassword').value.trim();
    
    if (!roomNumber) {
        alert('请输入房间号');
        return;
    }
    
    const result = await RoomAPI.join(currentUser.id, roomNumber, password);
    if (result.code === 200) {
        currentRoom = result.data;
        alert('加入房间成功！');
        showTab('myRoom');
    } else {
        alert(result.message);
    }
}

async function createRoom() {
    const roomName = document.getElementById('roomName').value.trim();
    const roomType = document.getElementById('roomType').value;
    const gameMode = document.getElementById('gameMode').value;
    const minRank = document.getElementById('minRank').value;
    const maxRank = document.getElementById('maxRank').value;
    const password = document.getElementById('roomPassword').value.trim();
    
    if (!roomName) {
        alert('请输入房间名称');
        return;
    }
    
    const result = await RoomAPI.create(
        currentUser.id, roomName, roomType, gameMode, 
        minRank || null, maxRank || null, roomType === 'PRIVATE' ? password : null
    );
    
    if (result.code === 200) {
        currentRoom = result.data;
        alert('房间创建成功！');
        showTab('myRoom');
    } else {
        alert(result.message);
    }
}

async function refreshMyRoom() {
    if (!currentUser.inRoom) {
        currentRoom = null;
        renderNoRoom();
        return;
    }
    
    if (currentRoom) {
        const result = await RoomAPI.getRoom(currentRoom.id);
        if (result.code === 200) {
            currentRoom = result.data;
            renderMyRoom();
        }
    } else {
        const playerResult = await PlayerAPI.getPlayer(currentUser.id);
        if (playerResult.code === 200 && playerResult.data.currentRoomId) {
            const roomResult = await RoomAPI.getRoom(playerResult.data.currentRoomId);
            if (roomResult.code === 200) {
                currentRoom = roomResult.data;
                renderMyRoom();
            }
        } else {
            renderNoRoom();
        }
    }
}

function renderNoRoom() {
    document.getElementById('myRoomInfo').innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999;">
            <p>您当前不在任何房间中</p>
            <p style="margin-top: 10px;">可以在"房间列表"中加入房间，或"创建房间"</p>
        </div>
    `;
}

function renderMyRoom() {
    if (!currentRoom) {
        renderNoRoom();
        return;
    }
    
    const isOwner = currentRoom.ownerId === currentUser.id;
    const inTeam1 = currentRoom.team1Players.includes(currentUser.id);
    const inTeam2 = currentRoom.team2Players.includes(currentUser.id);
    
    let team1Players = currentRoom.team1Players.map(id => {
        const isOwnerPlayer = id === currentRoom.ownerId;
        const isMe = id === currentUser.id;
        const nickname = getPlayerNickname(id);
        return `<div class="player-item ${isOwnerPlayer ? 'player-owner' : ''}">
            ${nickname} ${isOwnerPlayer ? '👑' : ''} ${isMe ? '(我)' : ''}
        </div>`;
    }).join('');
    
    let team2Players = currentRoom.team2Players.map(id => {
        const isOwnerPlayer = id === currentRoom.ownerId;
        const isMe = id === currentUser.id;
        const nickname = getPlayerNickname(id);
        return `<div class="player-item ${isOwnerPlayer ? 'player-owner' : ''}">
            ${nickname} ${isOwnerPlayer ? '👑' : ''} ${isMe ? '(我)' : ''}
        </div>`;
    }).join('');
    
    let actionsHtml = '';
    
    if (currentRoom.status === 'WAITING' || currentRoom.status === 'MATCHING') {
        if (inTeam1) {
            actionsHtml += `<button onclick="changeTeam(2)" class="btn btn-secondary btn-small">切换到红队</button>`;
        } else if (inTeam2) {
            actionsHtml += `<button onclick="changeTeam(1)" class="btn btn-secondary btn-small">切换到蓝队</button>`;
        }
        
        if (isOwner) {
            if (currentRoom.roomType === 'PUBLIC') {
                if (currentRoom.status === 'WAITING') {
                    actionsHtml += `<button onclick="startMatching()" class="btn btn-warning btn-small">开始自动匹配</button>`;
                } else {
                    actionsHtml += `<button onclick="stopMatching()" class="btn btn-warning btn-small">停止匹配</button>`;
                }
            }
            actionsHtml += `<button onclick="startGame()" class="btn btn-success btn-small">开始游戏</button>`;
            actionsHtml += `<button onclick="disbandRoom()" class="btn btn-danger btn-small">解散房间</button>`;
        }
        
        actionsHtml += `<button onclick="leaveRoom()" class="btn btn-secondary btn-small">离开房间</button>`;
    } else if (currentRoom.status === 'PLAYING') {
        actionsHtml += `<button onclick="endGame()" class="btn btn-danger btn-small">结束游戏</button>`;
    }
    
    const balanceInfo = await getRoomBalanceInfo(currentRoom.id);
    
    document.getElementById('myRoomInfo').innerHTML = `
        <div class="room-card">
            <h4>${currentRoom.roomName} <small>#${currentRoom.roomNumber}</small></h4>
            <div class="room-info">
                <span>🏠 ${currentRoom.roomType === 'PUBLIC' ? '公开' : '私密'}</span>
                <span>🎮 ${currentRoom.gameMode}</span>
                <span>👥 ${currentRoom.currentPlayers}/${currentRoom.maxPlayers}</span>
                <span>📊 ${currentRoom.status}</span>
                <span>👑 ${currentRoom.ownerName}</span>
            </div>
            
            ${balanceInfo ? `
            <div class="balance-info">
                <div class="balance-header">
                    <strong>⚖️ 队伍平衡度</strong>
                    <span class="balance-score ${getBalanceClass(balanceInfo.balanceScore)}">
                        ${balanceInfo.balanceScore.toFixed(0)}分
                    </span>
                </div>
                <div class="balance-details">
                    <span>🔵 蓝队平均: ${balanceInfo.team1AverageRank}</span>
                    <span>🔴 红队平均: ${balanceInfo.team2AverageRank}</span>
                    <span>📈 整体平均: ${balanceInfo.overallAverageRank}</span>
                </div>
                ${balanceInfo.balanceScore < 60 && currentRoom.currentPlayers > 0 ? `
                    <div class="balance-warning">
                        ⚠️ 建议调整队伍使平衡度达到60分以上
                    </div>
                ` : ''}
            </div>
            ` : ''}
            
            <div class="teams">
                <div class="team team-1">
                    <h5>🔵 蓝队 (${currentRoom.team1Players.length}人) ${balanceInfo ? `<small>平均: ${balanceInfo.team1AverageRank}</small>` : ''}</h5>
                    ${team1Players || '<p style="color: #999;">暂无玩家</p>'}
                </div>
                <div class="team team-2">
                    <h5>🔴 红队 (${currentRoom.team2Players.length}人) ${balanceInfo ? `<small>平均: ${balanceInfo.team2AverageRank}</small>` : ''}</h5>
                    ${team2Players || '<p style="color: #999;">暂无玩家</p>'}
                </div>
            </div>
            
            <div class="room-actions">
                ${actionsHtml}
            </div>
        </div>
    `;
}

async function changeTeam(targetTeam) {
    const result = await RoomAPI.changeTeam(currentUser.id, currentRoom.id, targetTeam);
    if (result.code === 200) {
        currentRoom = result.data;
        renderMyRoom();
    } else {
        alert(result.message);
    }
}

async function startMatching() {
    const result = await RoomAPI.startMatching(currentRoom.id, currentUser.id);
    if (result.code === 200) {
        currentRoom = result.data;
        renderMyRoom();
        alert('已开始自动匹配玩家');
    } else {
        alert(result.message);
    }
}

async function stopMatching() {
    const result = await RoomAPI.stopMatching(currentRoom.id, currentUser.id);
    if (result.code === 200) {
        currentRoom = result.data;
        renderMyRoom();
        alert('已停止匹配');
    } else {
        alert(result.message);
    }
}

async function startGame() {
    const result = await RoomAPI.startGame(currentRoom.id, currentUser.id);
    if (result.code === 200) {
        currentRoom = result.data;
        renderMyRoom();
        alert('游戏开始！');
    } else {
        alert(result.message);
    }
}

async function endGame() {
    const result = await RoomAPI.endGame(currentRoom.id);
    if (result.code === 200) {
        currentRoom = null;
        currentUser.inRoom = false;
        alert('游戏结束！');
        refreshMyRoom();
    } else {
        alert(result.message);
    }
}

async function leaveRoom() {
    if (!currentRoom) {
        alert('当前不在任何房间中');
        return;
    }
    const result = await RoomAPI.leave(currentUser.id, currentRoom.id);
    if (result.code === 200) {
        currentRoom = null;
        currentUser.inRoom = false;
        alert('已离开房间');
        refreshMyRoom();
    } else {
        alert(result.message || '离开房间失败');
    }
}

async function disbandRoom() {
    if (!currentRoom) {
        alert('当前不在任何房间中');
        return;
    }
    if (!confirm('确定要解散房间吗？')) return;
    
    const result = await RoomAPI.disband(currentRoom.id, currentUser.id);
    if (result.code === 200) {
        currentRoom = null;
        currentUser.inRoom = false;
        alert('房间已解散');
        refreshMyRoom();
    } else {
        alert(result.message || '解散房间失败');
    }
}

async function refreshLogs() {
    const result = await LogAPI.getRecentLogs();
    if (result.code === 200) {
        renderLogs(result.data);
    }
}

function renderLogs(logs) {
    const container = document.getElementById('logsList');
    
    if (logs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无日志</p>';
        return;
    }
    
    container.innerHTML = logs.map(log => `
        <div class="log-item">
            <div>
                <span class="log-type">${log.logType}</span>
                <span class="log-time">${new Date(log.createTime).toLocaleString()}</span>
            </div>
            <div class="log-desc">${log.description}</div>
        </div>
    `).join('');
}

async function updateStats() {
    const onlineResult = await PlayerAPI.getOnlineCount();
    if (onlineResult.code === 200) {
        document.getElementById('onlinePlayers').textContent = `在线玩家: ${onlineResult.data}`;
    }
}

function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(async () => {
        if (currentUser) {
            await PlayerAPI.heartbeat(currentUser.id);
        }
    }, 30000);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

function startAutoRefresh() {
    stopAutoRefresh();
    refreshInterval = setInterval(() => {
        updateStats();
        loadPlayers();
        if (document.getElementById('myRoomTab').style.display !== 'none') {
            refreshMyRoom();
        }
    }, 5000);
}

window.onload = init;