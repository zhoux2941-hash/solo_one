<template>
  <div class="page-container">
    <h2 class="page-title">观测热力图</h2>
    
    <el-card class="card heatmap-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><MapLocation /></el-icon>
          <span>全球ISS观测分布</span>
          <el-tag type="info" effect="dark">共 {{ totalPoints }} 条观测记录</el-tag>
        </div>
      </template>
      
      <div class="map-controls">
        <el-button-group>
          <el-button type="primary" @click="refreshData" :loading="loading" :icon="Refresh">
            刷新数据
          </el-button>
          <el-button @click="toggleHeatmap" :type="showHeatmap ? 'warning' : ''">
            {{ showHeatmap ? '隐藏热力图' : '显示热力图' }}
          </el-button>
          <el-button @click="centerMap" :icon="Location">
            定位到当前位置
          </el-button>
        </el-button-group>
        
        <div class="legend">
          <div class="legend-item">
            <div class="color-bar"></div>
            <span>低密度</span>
            <span>高密度</span>
          </div>
        </div>
      </div>
      
      <div ref="mapContainer" class="map-container"></div>
      
      <div v-if="selectedPoint" class="point-info">
        <h4><el-icon><InfoFilled /></el-icon> 选中观测点详情</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="纬度">
            {{ selectedPoint.lat.toFixed(4) }}°
          </el-descriptions-item>
          <el-descriptions-item label="经度">
            {{ selectedPoint.lng.toFixed(4) }}°
          </el-descriptions-item>
          <el-descriptions-item label="观测时间">
            {{ formatDateTime(selectedPoint.observedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="事件ID">
            <el-tag type="info" size="small">{{ selectedPoint.passEventId?.substring(0, 8) }}...</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ selectedPoint.description || '无描述' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Location, MapLocation, InfoFilled } from '@element-plus/icons-vue'
import L from 'leaflet'
import 'leaflet.heat'
import { getHeatmapData } from '@/api'
import { formatDateTime } from '@/utils/format'

const mapContainer = ref(null)
const loading = ref(false)
const totalPoints = ref(0)
const showHeatmap = ref(true)
const selectedPoint = ref(null)

let map = null
let heatLayer = null
let markers = []
let markerLayer = null

const initMap = () => {
  if (!mapContainer.value) return
  
  map = L.map(mapContainer.value, {
    center: [35, 105],
    zoom: 4,
    worldCopyJump: true
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  
  loadHeatmapData()
}

const loadHeatmapData = async () => {
  loading.value = true
  
  try {
    const response = await getHeatmapData()
    
    if (response.success) {
      totalPoints.value = response.total || 0
      
      clearLayers()
      
      if (response.points && response.points.length > 0) {
        const heatPoints = response.points.map(point => [
          point.lat,
          point.lng,
          0.5
        ])

        heatLayer = L.heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: {
            0.4: 'blue',
            0.6: 'cyan',
            0.7: 'lime',
            0.8: 'yellow',
            1.0: 'red'
          }
        })

        if (showHeatmap.value) {
          heatLayer.addTo(map)
        }

        response.points.forEach(point => {
          const marker = L.marker([point.lat, point.lng], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div class="marker-dot"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            })
          })

          marker.bindPopup(`
            <div class="popup-content">
              <strong>观测记录</strong><br/>
              纬度: ${point.lat.toFixed(4)}<br/>
              经度: ${point.lng.toFixed(4)}<br/>
              时间: ${formatDateTime(point.observedAt)}
              ${point.description ? `<br/>描述: ${point.description}` : ''}
            </div>
          `)

          marker.on('click', () => {
            selectedPoint.value = point
          })

          markers.push(marker)
          markerLayer.addLayer(marker)
        })

        ElMessage.success(`加载了 ${response.points.length} 条观测记录`)
      } else {
        ElMessage.info('暂无观测数据，快去打卡吧！')
      }
    } else {
      ElMessage.error(response.error || '加载热力图数据失败')
    }
  } catch (error) {
    console.error('Heatmap error:', error)
    ElMessage.error('加载热力图数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const clearLayers = () => {
  if (heatLayer) {
    map.removeLayer(heatLayer)
    heatLayer = null
  }
  
  markers.forEach(marker => {
    markerLayer.removeLayer(marker)
  })
  markers = []
  
  selectedPoint.value = null
}

const refreshData = () => {
  loadHeatmapData()
}

const toggleHeatmap = () => {
  showHeatmap.value = !showHeatmap.value
  
  if (heatLayer) {
    if (showHeatmap.value) {
      heatLayer.addTo(map)
    } else {
      map.removeLayer(heatLayer)
    }
  }
}

const centerMap = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        map.setView([latitude, longitude], 10)
        ElMessage.success('已定位到当前位置')
      },
      (error) => {
        ElMessage.error('无法获取当前位置')
        console.error('Geolocation error:', error)
      }
    )
  } else {
    ElMessage.warning('浏览器不支持地理位置服务')
  }
}

onMounted(async () => {
  await nextTick()
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style lang="scss" scoped>
.heatmap-card {
  height: calc(100vh - 220px);
  display: flex;
  flex-direction: column;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  
  .el-tag {
    margin-left: auto;
  }
}

.map-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.legend {
  display: flex;
  align-items: center;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    
    .color-bar {
      width: 120px;
      height: 12px;
      border-radius: 6px;
      background: linear-gradient(to right, blue, cyan, lime, yellow, red);
    }
  }
}

.map-container {
  flex: 1;
  min-height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a2e;
}

.point-info {
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  
  h4 {
    margin: 0 0 15px 0;
    color: #00d4ff;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  :deep(.el-descriptions__label),
  :deep(.el-descriptions__content) {
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>

<style>
.custom-marker {
  background: none;
  border: none;
}

.marker-dot {
  width: 12px;
  height: 12px;
  background: #ff6b6b;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.popup-content {
  font-size: 13px;
  line-height: 1.6;
}
</style>
