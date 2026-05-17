const API_BASE = '/api';

async function request(url, options = {}) {
    try {
        const response = await fetch(API_BASE + url, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                ...options.headers
            },
            ...options
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return { code: 500, message: '网络错误', data: null };
    }
}

const PlayerAPI = {
    register: (username, nickname, rank) => 
        request('/player/register', {
            method: 'POST',
            body: `username=${encodeURIComponent(username)}&nickname=${encodeURIComponent(nickname)}&rank=${rank}`
        }),
    
    login: (username) => 
        request('/player/login', {
            method: 'POST',
            body: `username=${encodeURIComponent(username)}`
        }),
    
    logout: (playerId) => 
        request('/player/logout', {
            method: 'POST',
            body: `playerId=${playerId}`
        }),
    
    heartbeat: (playerId) => 
        request('/player/heartbeat', {
            method: 'POST',
            body: `playerId=${playerId}`
        }),
    
    getPlayer: (playerId) => request(`/player/${playerId}`),
    
    getAllPlayers: () => request('/player/list'),
    
    getOnlinePlayers: () => request('/player/online'),
    
    getAvailablePlayers: () => request('/player/available'),
    
    getOnlineCount: () => request('/player/online/count'),
    
    getRanks: () => request('/player/ranks')
};

const RoomAPI = {
    create: (ownerId, roomName, roomType, gameMode, minRank, maxRank, password) => {
        let body = `ownerId=${ownerId}&roomName=${encodeURIComponent(roomName)}&roomType=${roomType}&gameMode=${gameMode}`;
        if (minRank) body += `&minRank=${minRank}`;
        if (maxRank) body += `&maxRank=${maxRank}`;
        if (password) body += `&password=${encodeURIComponent(password)}`;
        return request('/room/create', { method: 'POST', body });
    },
    
    join: (playerId, roomNumber, password) => {
        let body = `playerId=${playerId}&roomNumber=${roomNumber}`;
        if (password) body += `&password=${encodeURIComponent(password)}`;
        return request('/room/join', { method: 'POST', body });
    },
    
    leave: (playerId, roomId) => 
        request('/room/leave', {
            method: 'POST',
            body: `playerId=${playerId}&roomId=${roomId}`
        }),
    
    disband: (roomId, operatorId) => 
        request('/room/disband', {
            method: 'POST',
            body: `roomId=${roomId}&operatorId=${operatorId}`
        }),
    
    startGame: (roomId, operatorId) => 
        request('/room/start', {
            method: 'POST',
            body: `roomId=${roomId}&operatorId=${operatorId}`
        }),
    
    endGame: (roomId) => 
        request('/room/end', {
            method: 'POST',
            body: `roomId=${roomId}`
        }),
    
    startMatching: (roomId, operatorId) => 
        request('/room/matching/start', {
            method: 'POST',
            body: `roomId=${roomId}&operatorId=${operatorId}`
        }),
    
    stopMatching: (roomId, operatorId) => 
        request('/room/matching/stop', {
            method: 'POST',
            body: `roomId=${roomId}&operatorId=${operatorId}`
        }),
    
    changeTeam: (playerId, roomId, targetTeam) => 
        request('/room/team/change', {
            method: 'POST',
            body: `playerId=${playerId}&roomId=${roomId}&targetTeam=${targetTeam}`
        }),
    
    getRoom: (roomId) => request(`/room/${roomId}`),
    
    getRoomByNumber: (roomNumber) => request(`/room/number/${roomNumber}`),
    
    getAllRooms: () => request('/room/list'),
    
    getPublicRooms: () => request('/room/public'),
    
    getMatchingRooms: () => request('/room/matching'),
    
    getTypes: () => request('/room/types'),
    
    getModes: () => request('/room/modes'),
    
    getStatuses: () => request('/room/statuses'),
    
    getBalance: (roomId) => request(`/room/${roomId}/balance'),
    
    isBalanced: (roomId) => request(`/room/${roomId}/isBalanced`)
};

const LogAPI = {
    getRoomLogs: (roomId) => request(`/log/room/${roomId}`),
    getPlayerLogs: (playerId) => request(`/log/player/${playerId}`),
    getRecentLogs: () => request('/log/recent'),
    getAllLogs: () => request('/log/all'),
    getTypes: () => request('/log/types')
};