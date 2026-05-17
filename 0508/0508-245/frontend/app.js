const API_BASE = 'http://localhost:8080/api';
const WS_URL = 'ws://localhost:8080/ws';

let map;
let shipMarkers = {};
let areaPolygons = {};
let heatmapLayer = null;
let heatmapVisible = false;
let ws = null;

function initMap() {
    map = L.map('map').setView([31.2, 121.9], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

function connectWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.onopen = function() {
        console.log('WebSocket connected');
    };

    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        
        if (message.type === 'ship_update') {
            updateShipMarker(message.data);
            updateShipList();
            updateStatistics();
        } else if (message.type === 'alert') {
            addAlert(message.data);
            updateAlertCount();
        }
    };

    ws.onclose = function() {
        console.log('WebSocket disconnected, reconnecting...');
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

function createShipIcon(isWarning) {
    const color = isWarning ? '#ff4d4f' : '#1890ff';
    return L.divIcon({
        className: 'ship-marker',
        html: `<div class="ship-icon ${isWarning ? 'warning' : ''}" style="background:${color};">🚢</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

function updateShipMarker(shipData) {
    const { mmsi, name, lng, lat, speed, isInsideArea, timestamp } = shipData;

    if (shipMarkers[mmsi]) {
        map.removeLayer(shipMarkers[mmsi].marker);
        map.removeLayer(shipMarkers[mmsi].label);
    }

    const marker = L.marker([lat, lng], {
        icon: createShipIcon(isInsideArea)
    }).addTo(map);

    const label = L.marker([lat, lng], {
        icon: L.divIcon({
            className: '',
            html: `<div class="ship-label">${name}</div>`,
            iconSize: [60, 20],
            iconAnchor: [30, -10]
        }),
        interactive: false
    }).addTo(map);

    const popupContent = `
        <div style="min-width:150px;">
            <strong>${name}</strong><br>
            MMSI: ${mmsi}<br>
            速度: ${speed ? speed.toFixed(1) : 0} 节<br>
            状态: ${isInsideArea ? '<span style="color:#ff4d4f">⚠️ 越界</span>' : '<span style="color:#52c41a">正常</span>'}
        </div>
    `;
    marker.bindPopup(popupContent);

    shipMarkers[mmsi] = { marker, label, data: shipData };
}

async function loadProtectedAreas() {
    try {
        const response = await fetch(`${API_BASE}/areas`);
        const areas = await response.json();
        
        areas.forEach(area => {
            const latLngs = area.coordinates.map(coord => [coord.lat, coord.lng]);
            
            const polygon = L.polygon(latLngs, {
                color: '#52c41a',
                fillColor: '#52c41a',
                fillOpacity: 0.2,
                weight: 2
            }).addTo(map);

            polygon.bindPopup(`
                <strong>${area.name}</strong><br>
                ${area.description || ''}
            `);

            areaPolygons[area.id] = polygon;
        });

        updateAreaList(areas);
    } catch (error) {
        console.error('Failed to load protected areas:', error);
    }
}

async function loadShips() {
    try {
        const response = await fetch(`${API_BASE}/ships`);
        const ships = await response.json();
        
        ships.forEach(ship => {
            if (ship.currentLng && ship.currentLat) {
                updateShipMarker({
                    mmsi: ship.mmsi,
                    name: ship.name,
                    lng: ship.currentLng,
                    lat: ship.currentLat,
                    speed: ship.speed,
                    isInsideArea: ship.isInsideArea,
                    timestamp: ship.lastReportTime
                });
            }
        });

        updateShipList();
        updateStatistics();
    } catch (error) {
        console.error('Failed to load ships:', error);
    }
}

async function loadAlerts() {
    try {
        const response = await fetch(`${API_BASE}/reports/alerts`);
        const alerts = await response.json();
        
        const alertList = document.getElementById('alertList');
        alertList.innerHTML = '';

        if (alerts.length === 0) {
            alertList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <p>暂无告警记录</p>
                </div>
            `;
        } else {
            alerts.forEach(alert => {
                addAlertToList(alert);
            });
        }

        updateAlertCount();
    } catch (error) {
        console.error('Failed to load alerts:', error);
    }
}

async function loadReports() {
    try {
        const response = await fetch(`${API_BASE}/reports/ship-statistics`);
        const stats = await response.json();
        
        const rankingList = document.getElementById('violationRanking');
        rankingList.innerHTML = '';

        if (stats.length === 0) {
            rankingList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <p>暂无越界记录</p>
                </div>
            `;
        } else {
            stats.slice(0, 5).forEach((stat, index) => {
                const item = document.createElement('div');
                item.className = 'violation-item';
                item.innerHTML = `
                    <span class="violation-name">#${index + 1} ${stat.mmsi}</span>
                    <span class="violation-count">${stat.violationCount} 次</span>
                `;
                rankingList.appendChild(item);
            });
        }
    } catch (error) {
        console.error('Failed to load reports:', error);
    }
}

async function loadHeatmapData() {
    try {
        const response = await fetch(`${API_BASE}/reports/heatmap`);
        const data = await response.json();
        
        const heatPoints = data.map(item => [item.lat, item.lng, Math.min(item.count * 10, 1)]);
        
        if (heatmapLayer) {
            map.removeLayer(heatmapLayer);
        }

        heatmapLayer = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 15,
            maxZoom: 15
        });
    } catch (error) {
        console.error('Failed to load heatmap data:', error);
    }
}

function toggleHeatmap() {
    if (!heatmapLayer) {
        if (heatmapVisible) {
            map.removeLayer(heatmapLayer);
            heatmapVisible = false;
        } else {
            heatmapLayer.addTo(map);
            heatmapVisible = true;
        }
    } else {
        loadHeatmapData().then(() => {
            if (heatmapLayer) {
                heatmapLayer.addTo(map);
                heatmapVisible = true;
            }
        });
    }
}

function updateAreaList(areas) {
    const areaList = document.getElementById('areaList');
    areaList.innerHTML = '';

    areas.forEach(area => {
        const card = document.createElement('div');
        card.className = 'area-card';
        card.innerHTML = `
            <h4>${area.name}</h4>
            <p>${area.description || '暂无描述'}</p>
            <p>顶点数: ${area.coordinates.length}</p>
        `;
        areaList.appendChild(card);
    });
}

function updateShipList() {
    const shipList = document.getElementById('shipList');
    shipList.innerHTML = '';

    const ships = Object.values(shipMarkers).map(m => m.data);

    if (ships.length === 0) {
        shipList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🚢</div>
                <p>暂无船舶数据</p>
            </div>
        `;
        return;
    }

    ships.forEach(ship => {
        const card = document.createElement('div');
        card.className = `ship-card ${ship.isInsideArea ? 'warning' : ''}`;
        card.innerHTML = `
            <div class="ship-info">
                <h4>${ship.name}</h4>
                <p>MMSI: ${ship.mmsi}</p>
                <p>速度: ${ship.speed ? ship.speed.toFixed(1) : 0} 节</p>
            </div>
            <span class="ship-status ${ship.isInsideArea ? 'status-warning' : 'status-normal'}">
                ${ship.isInsideArea ? '越界' : '正常'}
            </span>
        `;
        card.onclick = () => {
            map.setView([ship.lat, ship.lng], 14);
            shipMarkers[ship.mmsi].marker.openPopup();
        };
        shipList.appendChild(card);
    });
}

function addAlert(alertData) {
    addAlertToList(alertData);
}

function addAlertToList(alert) {
    const alertList = document.getElementById('alertList');
    
    const emptyState = alertList.querySelector('.empty-state');
    if (emptyState) {
        alertList.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = 'alert-item';
    const time = new Date(alert.timestamp || alert.alertTime).toLocaleString('zh-CN');
    item.innerHTML = `
        <h4>⚠️ 船舶越界告警</h4>
        <p><strong>船舶:</strong> ${alert.shipName} (${alert.shipMmsi})</p>
        <p><strong>区域:</strong> ${alert.areaName}</p>
        <p><strong>位置:</strong> ${alert.lng.toFixed(4)}, ${alert.lat.toFixed(4)}</p>
        <div class="alert-time">${time}</div>
        <button class="btn btn-danger" style="margin-top:10px;font-size:11px;padding:5px 10px;" onclick="acknowledgeAlert(${alert.id})">确认告警</button>
    `;
    
    alertList.insertBefore(item, alertList.firstChild);
}

async function acknowledgeAlert(id) {
    try {
        await fetch(`${API_BASE}/reports/alerts/${id}/acknowledge`, {
            method: 'PUT'
        });
        loadAlerts();
    } catch (error) {
        console.error('Failed to acknowledge alert:', error);
    }
}

function updateStatistics() {
    const ships = Object.values(shipMarkers).map(m => m.data);
    const total = ships.length;
    const warnings = ships.filter(s => s.isInsideArea).length;
    const normal = total - warnings;

    document.getElementById('totalShips').textContent = total;
    document.getElementById('normalShips').textContent = normal;
    document.getElementById('warningShips').textContent = warnings;
    document.getElementById('shipCount').textContent = total;
}

function updateAlertCount() {
    const alertCount = document.querySelectorAll('#alertList .alert-item').length;
    document.getElementById('alertCount').textContent = alertCount;
}

function centerMap() {
    map.setView([31.2, 121.9], 11);
}

function initTabs() {
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');

            if (tabName === 'reports') {
                loadReports();
                loadHeatmapData();
            } else if (tabName === 'alerts') {
                loadAlerts();
            }
        });
    });
}

async function init() {
    initMap();
    initTabs();
    
    await loadProtectedAreas();
    await loadShips();
    await loadAlerts();
    
    connectWebSocket();

    setInterval(() => {
        loadReports();
        loadHeatmapData();
    }, 60000);
}

document.addEventListener('DOMContentLoaded', init);
