const API_BASE = 'http://localhost:8080/api';

const api = {
    async getPlayers() {
        const response = await fetch(`${API_BASE}/players`);
        return response.json();
    },

    async getPlayer(id) {
        const response = await fetch(`${API_BASE}/players/${id}`);
        return response.json();
    },

    async createPlayer(player) {
        const response = await fetch(`${API_BASE}/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(player)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '创建玩家失败');
        }
        return response.json();
    },

    async updatePlayer(id, player) {
        const response = await fetch(`${API_BASE}/players/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(player)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '更新玩家失败');
        }
        return response.json();
    },

    async deletePlayer(id) {
        await fetch(`${API_BASE}/players/${id}`, { method: 'DELETE' });
    },

    async searchPlayers(nickname) {
        const response = await fetch(`${API_BASE}/players/search?nickname=${nickname}`);
        return response.json();
    },

    async getPlayersWithPagination(page, size) {
        const response = await fetch(`${API_BASE}/players/page?page=${page}&size=${size}`);
        return response.json();
    },

    async getFriends(playerId) {
        const response = await fetch(`${API_BASE}/friends/${playerId}`);
        return response.json();
    },

    async addFriend(playerId, friendId) {
        const response = await fetch(`${API_BASE}/friends`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, friendId })
        });
        return response.json();
    },

    async removeFriend(playerId, friendId) {
        await fetch(`${API_BASE}/friends?playerId=${playerId}&friendId=${friendId}`, {
            method: 'DELETE'
        });
    },

    async getFriendsWithPagination(playerId, page, size) {
        const response = await fetch(`${API_BASE}/friends/${playerId}/page?page=${page}&size=${size}`);
        return response.json();
    },

    async getBlacklist(playerId) {
        const response = await fetch(`${API_BASE}/blacklist/${playerId}`);
        return response.json();
    },

    async getAllBlacklists() {
        const response = await fetch(`${API_BASE}/blacklist`);
        return response.json();
    },

    async addToBlacklist(playerId, blockedPlayerId, reason) {
        const response = await fetch(`${API_BASE}/blacklist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, blockedPlayerId, reason })
        });
        return response.json();
    },

    async removeFromBlacklist(playerId, blockedPlayerId) {
        await fetch(`${API_BASE}/blacklist?playerId=${playerId}&blockedPlayerId=${blockedPlayerId}`, {
            method: 'DELETE'
        });
    },

    async getBlacklistWithPagination(playerId, page, size) {
        let url = `${API_BASE}/blacklist/page?page=${page}&size=${size}`;
        if (playerId) {
            url += `&playerId=${playerId}`;
        }
        const response = await fetch(url);
        return response.json();
    },

    async getTeams() {
        const response = await fetch(`${API_BASE}/teams`);
        return response.json();
    },

    async getTeamsByStatus(status) {
        const response = await fetch(`${API_BASE}/teams/status/${status}`);
        return response.json();
    },

    async getTeam(id) {
        const response = await fetch(`${API_BASE}/teams/${id}`);
        return response.json();
    },

    async createTeam(team) {
        const response = await fetch(`${API_BASE}/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(team)
        });
        return response.json();
    },

    async approveTeam(id) {
        const response = await fetch(`${API_BASE}/teams/${id}/approve`, {
            method: 'PUT'
        });
        return response.json();
    },

    async rejectTeam(id, reason) {
        const response = await fetch(`${API_BASE}/teams/${id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        return response.json();
    },

    async updateTeam(id, team) {
        const response = await fetch(`${API_BASE}/teams/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(team)
        });
        return response.json();
    },

    async deleteTeam(id) {
        await fetch(`${API_BASE}/teams/${id}`, { method: 'DELETE' });
    },

    async getTeamsWithPagination(status, page, size) {
        let url = `${API_BASE}/teams/page?page=${page}&size=${size}`;
        if (status) {
            url += `&status=${status}`;
        }
        const response = await fetch(url);
        return response.json();
    },

    async getTeamMembers(teamId) {
        const response = await fetch(`${API_BASE}/team-members/team/${teamId}`);
        return response.json();
    },

    async getPlayerTeams(playerId) {
        const response = await fetch(`${API_BASE}/team-members/player/${playerId}`);
        return response.json();
    },

    async addTeamMember(teamId, playerId) {
        const response = await fetch(`${API_BASE}/team-members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId, playerId })
        });
        return response.json();
    },

    async updateMemberRole(teamId, playerId, role) {
        const response = await fetch(`${API_BASE}/team-members/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId, playerId, role })
        });
        return response.json();
    },

    async removeTeamMember(teamId, playerId) {
        await fetch(`${API_BASE}/team-members?teamId=${teamId}&playerId=${playerId}`, {
            method: 'DELETE'
        });
    },

    async getTeamMembersWithPagination(teamId, page, size) {
        const response = await fetch(`${API_BASE}/team-members/team/${teamId}/page?page=${page}&size=${size}`);
        return response.json();
    },

    async getTeamActivities(teamId) {
        const response = await fetch(`${API_BASE}/team-activities/team/${teamId}`);
        return response.json();
    },

    async recordActivity(teamId, activityPoints) {
        const response = await fetch(`${API_BASE}/team-activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId, activityPoints })
        });
        return response.json();
    },

    async getTeamWelfares(teamId) {
        const response = await fetch(`${API_BASE}/team-welfares/team/${teamId}`);
        return response.json();
    },

    async createWelfare(welfare) {
        const response = await fetch(`${API_BASE}/team-welfares`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(welfare)
        });
        return response.json();
    },

    async updateWelfare(id, welfare) {
        const response = await fetch(`${API_BASE}/team-welfares/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(welfare)
        });
        return response.json();
    },

    async toggleWelfareStatus(id) {
        const response = await fetch(`${API_BASE}/team-welfares/${id}/toggle`, {
            method: 'PUT'
        });
        return response.json();
    },

    async deleteWelfare(id) {
        await fetch(`${API_BASE}/team-welfares/${id}`, { method: 'DELETE' });
    }
};
