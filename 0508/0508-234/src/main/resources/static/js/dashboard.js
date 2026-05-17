document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            document.getElementById('totalUsers').textContent = users.length;
            document.getElementById('activeUsers').textContent = users.filter(u => u.enabled).length;
            document.getElementById('disabledUsers').textContent = users.filter(u => !u.enabled).length;
        }

        const stationsResponse = await fetch('/api/stations');
        if (stationsResponse.ok) {
            const stations = await stationsResponse.json();
            document.getElementById('totalStations').textContent = stations.length;
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}
