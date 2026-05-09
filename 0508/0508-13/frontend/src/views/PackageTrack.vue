<template>
  <div>
    <div class="search-bar">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
    </div>

    <el-card v-if="pkg" class="package-info" shadow="never">
      <template #header>
        <div class="card-header">
          <span>📦 {{ pkg.packageNo }}</span>
          <el-tag :type="getStatusTagType(pkg.currentStatus)" size="large">
            {{ pkg.currentStatusDescription }}
          </el-tag>
        </div>
      </template>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">发件人：</span>
          <span class="value">{{ pkg.sender }}</span>
        </div>
        <div class="info-item">
          <span class="label">出发城市：</span>
          <span class="value">{{ pkg.senderCity }}</span>
        </div>
        <div class="info-item">
          <span class="label">收件人：</span>
          <span class="value">{{ pkg.receiver }}</span>
        </div>
        <div class="info-item">
          <span class="label">目的城市：</span>
          <span class="value">{{ pkg.receiverCity }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="chart-container" shadow="never" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>🗺️ 运输轨迹</span>
          <el-button-group>
            <el-button :type="isAnimating ? 'danger' : 'primary'" @click="toggleAnimation">
              {{ isAnimating ? '停止动画' : '播放动画' }}
            </el-button>
            <el-button @click="resetMap">重置视角</el-button>
          </el-button-group>
        </div>
      </template>
      <div ref="mapRef" class="map-container"></div>
    </el-card>

    <el-card class="track-list" shadow="never" style="margin-top: 20px;">
      <template #header>
        <span>📋 轨迹详情</span>
      </template>
      <div v-for="(track, index) in tracks" :key="track.trackId" class="track-item">
        <div :class="['track-dot', `track-dot-${track.status.toLowerCase()}`]"></div>
        <div class="track-content">
          <div class="track-location">{{ track.location }}</div>
          <div class="track-status">{{ track.statusDescription }}{{ track.remark ? ' - ' + track.remark : '' }}</div>
          <div class="track-time">{{ formatDate(track.timestamp) }}</div>
          <div v-if="track.stayDurationHours" class="track-duration">
            停留时长：{{ track.stayDurationHours }} 小时
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import L from 'leaflet'
import { packageApi, trackApi } from '../api'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const mapRef = ref(null)
let map = null
let polyline = null
let currentMarker = null
let animationMarker = null
let animationInterval = null

const pkg = ref(null)
const tracks = ref([])
const isAnimating = ref(false)
const animationProgress = ref(0)

const goBack = () => {
  router.push('/packages')
}

const getStatusTagType = (status) => {
  const types = {
    'PICKUP': 'success',
    'IN_TRANSIT': 'primary',
    'DISPATCH': 'warning',
    'SIGNED': 'danger'
  }
  return types[status] || 'info'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const loadData = async () => {
  const packageId = route.params.id
  try {
    pkg.value = await packageApi.getById(packageId)
    const trackData = await trackApi.getByPackageId(packageId)
    tracks.value = trackData
    await nextTick()
    initMap()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const initMap = () => {
  if (!mapRef.value || tracks.value.length === 0) return

  if (map) {
    map.remove()
  }

  const reversedTracks = [...tracks.value].reverse()
  const latlngs = reversedTracks.map(t => [t.latitude, t.longitude])

  map = L.map(mapRef.value).setView(latlngs[0], 5)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  const bounds = L.latLngBounds(latlngs)
  map.fitBounds(bounds, { padding: [50, 50] })

  polyline = L.polyline(latlngs, {
    color: '#409EFF',
    weight: 4,
    opacity: 0.8,
    dashArray: '10, 10'
  }).addTo(map)

  reversedTracks.forEach((track, index) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 30px;
        height: 30px;
        background: ${getStatusColor(track.status)};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
      ">${index + 1}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })

    const marker = L.marker([track.latitude, track.longitude], { icon })
    marker.addTo(map)

    marker.bindPopup(`
      <div style="min-width: 200px;">
        <strong>${track.location}</strong><br/>
        ${track.statusDescription}<br/>
        ${formatDate(track.timestamp)}
        ${track.stayDurationHours ? `<br/>停留: ${track.stayDurationHours}小时` : ''}
      </div>
    `)
  })

  const lastTrack = reversedTracks[reversedTracks.length - 1]
  currentMarker = L.marker([lastTrack.latitude, lastTrack.longitude], {
    icon: L.divIcon({
      className: 'current-marker',
      html: `<div style="
        width: 40px;
        height: 40px;
        background: #f56c6c;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 0 10px rgba(245, 108, 108, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">🚚</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  }).addTo(map)
}

const getStatusColor = (status) => {
  const colors = {
    'PICKUP': '#67c23a',
    'IN_TRANSIT': '#409EFF',
    'DISPATCH': '#e6a23c',
    'SIGNED': '#f56c6c'
  }
  return colors[status] || '#909399'
}

const toggleAnimation = () => {
  if (isAnimating.value) {
    stopAnimation()
  } else {
    startAnimation()
  }
}

const startAnimation = () => {
  if (tracks.value.length < 2) return
  
  isAnimating.value = true
  animationProgress.value = 0
  
  const reversedTracks = [...tracks.value].reverse()
  const totalDistance = calculateTotalDistance(reversedTracks)
  const duration = 5000
  const startTime = Date.now()

  if (currentMarker) {
    map.removeLayer(currentMarker)
  }

  animationMarker = L.marker(reversedTracks[0], {
    icon: L.divIcon({
      className: 'animation-marker',
      html: `<div style="
        width: 40px;
        height: 40px;
        background: #409EFF;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 0 15px rgba(64, 158, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      ">🚚</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  }).addTo(map)

  const animate = () => {
    if (!isAnimating.value) return

    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    const traveledDistance = progress * totalDistance
    const position = getPositionAtDistance(reversedTracks, traveledDistance)
    
    animationMarker.setLatLng(position)
    animationProgress.value = progress * 100

    if (progress < 1) {
      animationInterval = requestAnimationFrame(animate)
    } else {
      isAnimating.value = false
      const lastTrack = reversedTracks[reversedTracks.length - 1]
      currentMarker = L.marker([lastTrack.latitude, lastTrack.longitude], {
        icon: L.divIcon({
          className: 'current-marker',
          html: `<div style="
            width: 40px;
            height: 40px;
            background: #f56c6c;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 0 10px rgba(245, 108, 108, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
          ">🚚</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(map)
      map.removeLayer(animationMarker)
    }
  }

  animate()
}

const stopAnimation = () => {
  isAnimating.value = false
  if (animationInterval) {
    cancelAnimationFrame(animationInterval)
  }
  if (animationMarker) {
    map.removeLayer(animationMarker)
  }
  const reversedTracks = [...tracks.value].reverse()
  const lastTrack = reversedTracks[reversedTracks.length - 1]
  currentMarker = L.marker([lastTrack.latitude, lastTrack.longitude], {
    icon: L.divIcon({
      className: 'current-marker',
      html: `<div style="
        width: 40px;
        height: 40px;
        background: #f56c6c;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 0 10px rgba(245, 108, 108, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
      ">🚚</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  }).addTo(map)
}

const resetMap = () => {
  if (tracks.value.length === 0 || !map) return
  const reversedTracks = [...tracks.value].reverse()
  const latlngs = reversedTracks.map(t => [t.latitude, t.longitude])
  const bounds = L.latLngBounds(latlngs)
  map.fitBounds(bounds, { padding: [50, 50] })
}

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const calculateTotalDistance = (tracks) => {
  let total = 0
  for (let i = 0; i < tracks.length - 1; i++) {
    total += calculateDistance(
      tracks[i].latitude, tracks[i].longitude,
      tracks[i + 1].latitude, tracks[i + 1].longitude
    )
  }
  return total
}

const getPositionAtDistance = (tracks, targetDistance) => {
  let accumulated = 0
  
  for (let i = 0; i < tracks.length - 1; i++) {
    const segmentDistance = calculateDistance(
      tracks[i].latitude, tracks[i].longitude,
      tracks[i + 1].latitude, tracks[i + 1].longitude
    )
    
    if (accumulated + segmentDistance >= targetDistance) {
      const remaining = targetDistance - accumulated
      const ratio = remaining / segmentDistance
      return [
        tracks[i].latitude + (tracks[i + 1].latitude - tracks[i].latitude) * ratio,
        tracks[i].longitude + (tracks[i + 1].longitude - tracks[i].longitude) * ratio
      ]
    }
    
    accumulated += segmentDistance
  }
  
  const last = tracks[tracks.length - 1]
  return [last.latitude, last.longitude]
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (animationInterval) {
    cancelAnimationFrame(animationInterval)
  }
  if (map) {
    map.remove()
  }
})
</script>

<style scoped>
.package-info {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.info-item .label {
  color: #909399;
  font-size: 14px;
}

.info-item .value {
  color: #303133;
  font-weight: bold;
  margin-left: 5px;
}

:deep(.custom-marker) {
  background: transparent !important;
  border: none !important;
}

:deep(.animation-marker) {
  background: transparent !important;
  border: none !important;
}

:deep(.current-marker) {
  background: transparent !important;
  border: none !important;
}
</style>
