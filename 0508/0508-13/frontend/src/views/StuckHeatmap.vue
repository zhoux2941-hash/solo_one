<template>
  <div>
    <h1 class="page-title">滞留热力图</h1>

    <div class="search-bar">
      <el-button type="primary" @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
      <el-button type="warning" @click="refreshFromServer">
        <el-icon><Loading /></el-icon>
        强制刷新缓存
      </el-button>
    </div>

    <div v-if="stuckCenters.length === 0" class="chart-container">
      <el-empty description="暂无滞留包裹数据" />
    </div>

    <div v-else class="chart-container">
      <div class="chart-title">🗺️ 转运中心滞留情况（超过24小时未离开）</div>
      <div ref="mapRef" class="map-container"></div>
    </div>

    <div v-if="stuckCenters.length > 0" class="chart-container">
      <div class="chart-title">📋 滞留详情列表</div>
      <el-table :data="stuckCenters" border>
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="centerName" label="转运中心" width="200" />
        <el-table-column prop="location" label="城市" width="120" />
        <el-table-column prop="stuckCount" label="滞留包裹数" width="150">
          <template #default="scope">
            <el-tag :type="getCountTagType(scope.row.stuckCount)">
              {{ scope.row.stuckCount }} 件
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stuckHours" label="平均滞留时长" width="150">
          <template #default="scope">
            {{ scope.row.stuckHours }} 小时
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'
import { statisticsApi } from '../api'
import { Refresh, Loading } from '@element-plus/icons-vue'

const mapRef = ref(null)
const stuckCenters = ref([])
let map = null

const loadData = async () => {
  try {
    const data = await statisticsApi.getStuckCenters()
    stuckCenters.value = data || []
    await nextTick()
    initMap()
  } catch (error) {
    console.error('加载滞留数据失败:', error)
  }
}

const refreshFromServer = async () => {
  try {
    const data = await statisticsApi.refreshStuckCenters()
    stuckCenters.value = data || []
    await nextTick()
    initMap()
  } catch (error) {
    console.error('刷新滞留数据失败:', error)
  }
}

const initMap = () => {
  if (!mapRef.value || stuckCenters.value.length === 0) return

  if (map) {
    map.remove()
  }

  map = L.map(mapRef.value).setView([35.8617, 104.1954], 4)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  const maxCount = Math.max(...stuckCenters.value.map(c => c.stuckCount))

  const latlngs = []
  stuckCenters.value.forEach(center => {
    latlngs.push([center.latitude, center.longitude])
    
    const intensity = center.stuckCount / maxCount
    const radius = 20 + intensity * 60
    const color = getHeatColor(intensity)

    const circle = L.circleMarker([center.latitude, center.longitude], {
      radius: radius,
      color: color,
      fillColor: color,
      fillOpacity: 0.6,
      weight: 2
    }).addTo(map)

    circle.bindPopup(`
      <div style="min-width: 200px;">
        <strong>${center.centerName}</strong><br/>
        滞留包裹数: ${center.stuckCount} 件<br/>
        平均滞留时长: ${center.stuckHours} 小时
      </div>
    `)
  })

  if (latlngs.length > 0) {
    const bounds = L.latLngBounds(latlngs)
    map.fitBounds(bounds, { padding: [80, 80] })
  }
}

const getHeatColor = (intensity) => {
  if (intensity < 0.3) return '#67C23A'
  if (intensity < 0.6) return '#E6A23C'
  return '#F56C6C'
}

const getCountTagType = (count) => {
  if (count < 5) return 'success'
  if (count < 15) return 'warning'
  return 'danger'
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})
</script>
