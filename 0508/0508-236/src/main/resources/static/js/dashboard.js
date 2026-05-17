document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            document.getElementById('totalUsers').textContent = users.length;
        }

        const stationsResponse = await fetch('/api/stations');
        if (stationsResponse.ok) {
            const stations = await stationsResponse.json();
            document.getElementById('totalStations').textContent = stations.length;
        }

        const companiesResponse = await fetch('/api/courier-companies');
        if (companiesResponse.ok) {
            const companies = await companiesResponse.json();
            document.getElementById('totalCourierCompanies').textContent = companies.length;
        }

        const residentsResponse = await fetch('/api/residents');
        if (residentsResponse.ok) {
            const residents = await residentsResponse.json();
            document.getElementById('totalResidents').textContent = residents.length;
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}
