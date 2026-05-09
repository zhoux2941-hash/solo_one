<template>
  <div class="dashboard-layout">
    <div class="left-panel">
      <div class="stats-row">
        <div class="stat-card purple">
          <div class="stat-title">📋 待分配订单</div>
          <div class="stat-value purple">{{ pendingOrdersCount }}</div>
        </div>
        <div class="stat-card green">
          <div class="stat-title">🟢 低风险</div>
          <div class="stat-value green">{{ stats.green }}</div>
        </div>
        <div class="stat-card yellow">
          <div class="stat-title">🟡 中风险</div>
          <div class="stat-value yellow">{{ stats.yellow }}</div>
        </div>
        <div class="stat-card red">
          <div class="stat-title">🔴 高风险</div>
          <div class="stat-value red">{{ stats.red }}</div>
        </div>
      </div>

      <div class="card map-container">
        <div class="card-title">🗺️ 实时位置地图</div>
        <div id="map"></div>
      </div>
    </div>

    <div class="right-panel">
      <div class="card dispatch-panel">
        <div class="card-title">
          🧠 智能派单建议
          <button class="refresh-btn" @click="fetchPendingOrders">刷新</button>
        </div>
        
        <div class="pending-list" v-if="Object.keys(pendingOrders).length > 0">
          <div 
            v-for="(recommendations, orderId) in pendingOrders" 
            :key="orderId" 
            class="pending-order-card"
          >
            <div class="order-header">
              <span class="order-id">📦 {{ orderId }}</span>
              <span class="order-badge">待分配</span>
            </div>
            
            <div class="recommendations-list" v-if="recommendations && recommendations.length > 0">
              <div 
                v-for="(rec, idx) in recommendations" 
                :key="rec.riderId"
                class="rider-recommendation-card"
                :class="{ 'best-match': idx === 0 }"
              >
                <div class="rider-header">
                  <div class="rider-avatar" :style="{ background: getRankColor(idx) }">
                    {{ idx + 1 }}
                  </div>
                  <div class="rider-main">
                    <div class="rider-name">
                      🛵 {{ rec.riderName }}
                      <span v-if="idx === 0" class="best-badge">✨ 推荐</span>
                    </div>
                    <div class="rider-reason">{{ rec.recommendationReason }}</div>
                  </div>
                  <div class="rider-score">
                    <div class="score-number">{{ (rec.score * 100).toFixed(0) }}</div>
                    <div class="score-label">综合分</div>
                  </div>
                </div>
                
                <div class="rider-stats">
                  <div class="stat-item">
                    <span class="stat-label">📍距离</span>
                    <span class="stat-value">{{ rec.distanceToMerchant?.toFixed(2) }} km</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">📦负载</span>
                    <span class="stat-value">{{ rec.currentOrders }} 单</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">⏱️准点</span>
                    <span class="stat-value">{{ rec.onTimeRate?.toFixed(1) }}%</span>
                  </div>
                </div>
                
                <div class="score-breakdown">
                  <div class="score-bar-item">
                    <span class="bar-label">距离</span>
                    <div class="bar-track">
                      <div class="bar-fill distance" :style="{ width: rec.distanceScore + '%' }"></div>
                    </div>
                    <span class="bar-value">{{ rec.distanceScore?.toFixed(0) }}</span>
                  </div>
                  <div class="score-bar-item">
                    <span class="bar-label">负载</span>
                    <div class="bar-track">
                      <div class="bar-fill load" :style="{ width: rec.loadScore + '%' }"></div>
                    </div>
                    <span class="bar-value">{{ rec.loadScore?.toFixed(0) }}</span>
                  </div>
                  <div class="score-bar-item">
                    <span class="bar-label">准点</span>
                    <div class="bar-track">
                      <div class="bar-fill ontime" :style="{ width: rec.onTimeScore + '%' }"></div>
                    </div>
                    <span class="bar-value">{{ rec.onTimeScore?.toFixed(0) }}</span>
                  </div>
                </div>
                
                <button 
                  class="assign-btn" 
                  @click="assignOrder(orderId, rec.riderId)"
                  :class="{ 'primary': idx === 0 }"
                >
                  ✅ 分配给 {{ rec.riderName }}
                </button>
              </div>
            </div>
            
            <div v-else class="no-recommendation">
              暂无可用骑手推荐
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <div class="empty-icon">✅</div>
          <div class="empty-text">所有订单已分配</div>
        </div>
      </div>

      <div class="card risk-panel">
        <div class="card-title">⚠️ 超时风险面板</div>
        <div class="risk-list">
          <div
            v-for="rider in sortedRiders"
            :key="rider.riderId"
            class="risk-item"
            :class="'risk-' + rider.riskLevel.toLowerCase()"
            @click="focusOnRider(rider)"
          >
            <div class="risk-header">
              <span class="rider-name">🛵 {{ rider.riderName }}</span>
              <span class="risk-badge" :class="'risk-badge-' + rider.riskLevel.toLowerCase()">
                {{ riskLabel(rider.riskLevel) }}
              </span>
            </div>
            <div class="risk-details">
              <span>📦 {{ rider.orderId }}</span>
            </div>
            <div class="risk-details">
              <span>⏱️ 剩余 {{ rider.remainingMinutes }} 分钟</span>
              <span>📐 预计 {{ rider.estimatedTime }} 分钟</span>
            </div>
            <div class="risk-distance">
              <span>📍 距商家 {{ rider.distanceToMerchant?.toFixed(2) }} km</span>
            </div>
          </div>
          <div v-if="sortedRiders.length === 0" class="risk-item empty">
            暂无配送中订单
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'
import axios from 'axios'

const riders = ref([])
const pendingOrders = ref({})

let map = null
let markers = {}
let refreshInterval = null
let pendingRefreshInterval = null

const stats = computed(() => {
  const result = { total: riders.value.length, green: 0, yellow: 0, red: 0 }
  riders.value.forEach(r => {
    const level = (r.riskLevel || 'green').toLowerCase()
    result[level] = (result[level] || 0) + 1
  })
  return result
})

const pendingOrdersCount = computed(() => {
  return Object.keys(pendingOrders.value).length
})

const sortedRiders = computed(() => {
  const priority = { RED: 0, YELLOW: 1, GREEN: 2 }
  return [...riders.value].sort((a, b) => {
    const pa = priority[a.riskLevel] ?? 2
    const pb = priority[b.riskLevel] ?? 2
    if (pa !== pb) {
      return pa - pb
    }
    return (a.remainingMinutes ?? 0) - (b.remainingMinutes ?? 0)
  })
})

const riskLabel = (level) => {
  const labels = { GREEN: '正常', YELLOW: '关注', RED: '危险' }
  return labels[level] || '未知'
}

const getRankColor = (idx) => {
  const colors = ['#667eea', '#28a745', '#17a2b8']
  return colors[idx] || '#6c757d'
}

const initMap = () => {
  map = L.map('map', {
    center: [39.915, 116.405],
    zoom: 12
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
}

const getMarkerColor = (riskLevel) => {
  const colors = {
    GREEN: '#28a745',
    YELLOW: '#ffc107',
    RED: '#dc3545'
  }
  return colors[riskLevel] || '#007bff'
}

const createCustomIcon = (riskLevel, name) => {
  const color = getMarkerColor(riskLevel)
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        text-align: center;
      ">
        ${name ? name.charAt(0) : '?'}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  })
}

const updateMarkers = () => {
  if (!map) return

  const activeRiderIds = new Set()

  riders.value.forEach(rider => {
    if (!rider.lat || !rider.lng) return
    activeRiderIds.add(rider.riderId)

    const popupContent = `
      <div style="padding: 8px;">
        <strong>🛵 ${rider.riderName || rider.riderId}</strong><br/>
        订单: ${rider.orderId || '无'}<br/>
        剩余时间: ${rider.remainingMinutes || 0} 分钟<br/>
        预计耗时: ${rider.estimatedTime || 0} 分钟<br/>
        风险: ${riskLabel(rider.riskLevel)}<br/>
        距商家: ${(rider.distanceToMerchant || 0).toFixed(2)} km
      </div>
    `

    if (markers[rider.riderId]) {
      markers[rider.riderId].setLatLng([rider.lat, rider.lng])
      markers[rider.riderId].setIcon(createCustomIcon(rider.riskLevel, rider.riderName))
      markers[rider.riderId].setPopupContent(popupContent)
    } else {
      markers[rider.riderId] = L.marker([rider.lat, rider.lng], {
        icon: createCustomIcon(rider.riskLevel, rider.riderName)
      })
      markers[rider.riderId].addTo(map)
      markers[rider.riderId].bindPopup(popupContent)
    }
  })

  Object.keys(markers).forEach(id => {
    if (!activeRiderIds.has(id)) {
      map.removeLayer(markers[id])
      delete markers[id]
    }
  })

  if (riders.value.length > 0) {
    const validRiders = riders.value.filter(r => r.lat && r.lng)
    if (validRiders.length > 0) {
      const bounds = L.latLngBounds(validRiders.map(r => [r.lat, r.lng]))
      try {
        map.fitBounds(bounds, { padding: [50, 50] })
      } catch (e) {
        console.log('fitBounds error')
      }
    }
  }
}

const focusOnRider = (rider) => {
  if (map && rider.lat && rider.lng) {
    map.setView([rider.lat, rider.lng], 14)
    markers[rider.riderId]?.openPopup()
  }
}

const fetchRiders = async () => {
  try {
    const response = await axios.get('/api/dispatch/riders')
    riders.value = response.data || []
    updateMarkers()
  } catch (error) {
    console.error('Failed to fetch riders:', error)
  }
}

const fetchPendingOrders = async () => {
  try {
    const response = await axios.get('/api/dispatch/pending')
    pendingOrders.value = response.data || {}
  } catch (error) {
    console.error('Failed to fetch pending orders:', error)
    pendingOrders.value = {}
  }
}

const assignOrder = async (orderId, riderId) => {
  try {
    await axios.post('/api/dispatch/assign', {
      orderId,
      riderId
    })
    alert(`订单 ${orderId} 已成功分配给骑手`)
    await Promise.all([fetchRiders(), fetchPendingOrders()])
  } catch (error) {
    console.error('Failed to assign order:', error)
    alert('分配失败: ' + (error.response?.data || error.message))
  }
}

onMounted(async () => {
  await nextTick()
  initMap()
  await Promise.all([fetchRiders(), fetchPendingOrders()])

  refreshInterval = setInterval(() => {
    fetchRiders()
  }, 10000)

  pendingRefreshInterval = setInterval(() => {
    fetchPendingOrders()
  }, 15000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (pendingRefreshInterval) clearInterval(pendingRefreshInterval)
  if (map) map.remove()
})
</script>
