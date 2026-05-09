<template>
  <div>
    <h1 class="page-title">批量轨迹查看</h1>

    <div class="search-bar">
      <el-input
        v-model="searchNo"
        placeholder="搜索包裹单号"
        clearable
        style="width: 250px;"
        @keyup.enter="filterPackages"
      >
        <template #append>
          <el-button @click="filterPackages">搜索</el-button>
        </template>
      </el-input>
      <el-select v-model="filterStatus" @change="filterPackages" placeholder="状态筛选" clearable style="width: 150px;">
        <el-option label="全部" value="" />
        <el-option label="揽收" value="PICKUP" />
        <el-option label="运输中" value="IN_TRANSIT" />
        <el-option label="派送" value="DISPATCH" />
        <el-option label="签收" value="SIGNED" />
      </el-select>
      <el-button type="primary" @click="loadData">
        <el-icon><Refresh /></el-icon>
        加载数据
      </el-button>
      <el-button type="success" @click="loadAllSummaries">
        <el-icon><Document /></el-icon>
        加载概要轨迹
      </el-button>
    </div>

    <div v-if="loading" class="chart-container" style="text-align: center; padding: 50px;">
      <el-loading text="正在加载数据..." />
    </div>

    <div v-else-if="filteredSummaries.length === 0" class="chart-container">
      <el-empty description="暂无数据，请先加载概要轨迹" />
    </div>

    <div v-else>
      <div class="chart-container">
        <div class="chart-title">
          📋 包裹列表（共 {{ filteredSummaries.length }} 个，已选中 {{ selectedCount }} 个）
        </div>
        <el-table
          :data="filteredSummaries"
          border
          max-height="350"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="packageNo" label="包裹单号" width="200" />
          <el-table-column label="线路" width="180">
            <template #default="scope">
              <el-tag type="primary" size="small">{{ scope.row.senderCity }}</el-tag>
              <span style="margin: 0 5px;">→</span>
              <el-tag type="success" size="small">{{ scope.row.receiverCity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="currentStatusDescription" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.currentStatus)" size="small">
                {{ scope.row.currentStatusDescription }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalDistance" label="距离(km)" width="100" />
          <el-table-column prop="totalHours" label="耗时(小时)" width="100" />
          <el-table-column label="操作" width="250">
            <template #default="scope">
              <el-button type="primary" link @click="showSummaryOnMap(scope.row)">
                地图定位
              </el-button>
              <el-button type="warning" link @click="loadTrackDetail(scope.row)">
                加载轨迹
              </el-button>
              <el-button type="success" link @click="goToTrack(scope.row.packageId)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="chart-container">
        <div class="chart-title">
          🗺️ 轨迹地图（显示 {{ visiblePackages.length }} 个包裹）
          <span style="font-size: 14px; font-weight: normal; color: #909399; margin-left: 20px;">
            <el-tag type="primary" size="small">概要</el-tag>
            <el-tag type="success" size="small" style="margin-left: 10px;">已加载</el-tag>
          </span>
        </div>
        <div ref="mapRef" class="map-container"></div>
      </div>

      <div v-if="loadedTracks.size > 0" class="chart-container">
        <div class="chart-title">
          📦 已加载详细轨迹（{{ loadedTracks.size }} 个）
        </div>
        <el-table :data="Array.from(loadedTracks.values())" border max-height="300">
          <el-table-column prop="packageNo" label="包裹单号" width="200" />
          <el-table-column label="线路" width="180">
            <template #default="scope">
              <el-tag type="primary" size="small">{{ scope.row.senderCity }}</el-tag>
              <span style="margin: 0 5px;">→</span>
              <el-tag type="success" size="small">{{ scope.row.receiverCity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="trackCount" label="轨迹点数" width="100" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button type="warning" link @click="focusOnPackage(scope.row.packageId)">
                聚焦
              </el-button>
              <el-button type="danger" link @click="unloadTrack(scope.row.packageId)">
                卸载
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { packageApi, trackApi, batchApi } from '../api'
import { Refresh, Document } from '@element-plus/icons-vue'

const router = useRouter()
const mapRef = ref(null)
let map = null

const loading = ref(false)
const searchNo = ref('')
const filterStatus = ref('')
const selectedRows = ref([])
const allSummaries = ref([])
const filteredSummaries = ref([])

const loadedTracks = reactive(new Map())
const summaryMarkers = ref(new Map())
const trackPolylines = ref(new Map())

const selectedCount = computed(() => selectedRows.value.length)
const visiblePackages = computed(() => {
  return [
    ...Array.from(loadedTracks.values()),
    ...allSummaries.value.filter(s => !loadedTracks.has(s.packageId))
  ]
})

const loadData = async () => {
  loading.value = true
  try {
    const packages = await packageApi.getAll()
    const packageIds = packages.map(p => p.packageId)
    
    if (packageIds.length > 0) {
      const batchSize = 100
      const batches = []
      for (let i = 0; i < packageIds.length; i += batchSize) {
        batches.push(packageIds.slice(i, i + batchSize))
      }
      
      allSummaries.value = []
      for (const batch of batches) {
        const summaries = await batchApi.getBatchTrackSummary(batch)
        allSummaries.value.push(...summaries)
      }
      
      filterPackages()
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const loadAllSummaries = async () => {
  loading.value = true
  try {
    allSummaries.value = await batchApi.getAllTrackSummaries()
    filterPackages()
  } catch (error) {
    console.error('加载概要轨迹失败:', error)
  } finally {
    loading.value = false
  }
}

const filterPackages = () => {
  let result = [...allSummaries.value]
  
  if (searchNo.value) {
    result = result.filter(s => 
      s.packageNo.toLowerCase().includes(searchNo.value.toLowerCase())
    )
  }
  
  if (filterStatus.value) {
    result = result.filter(s => s.currentStatus === filterStatus.value)
  }
  
  filteredSummaries.value = result
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
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

const initMap = () => {
  if (!mapRef.value) return

  if (map) {
    map.remove()
  }

  map = L.map(mapRef.value).setView([35.8617, 104.1954], 4)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
}

const showSummaryOnMap = (summary) => {
  if (!summary.pickup || !summary.latest) return

  const fromLatLng = [summary.pickup.latitude, summary.pickup.longitude]
  const toLatLng = [summary.latest.latitude, summary.latest.longitude]

  if (summaryMarkers.value.has(summary.packageId)) {
    const existing = summaryMarkers.value.get(summary.packageId)
    map.removeLayer(existing.line)
    map.removeLayer(existing.startMarker)
    map.removeLayer(existing.endMarker)
  }

  const polyline = L.polyline([fromLatLng, toLatLng], {
    color: '#409EFF',
    weight: 3,
    dashArray: '5, 5',
    opacity: 0.8
  }).addTo(map)

  const startIcon = L.divIcon({
    className: 'summary-start-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background: #409EFF;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })

  const startMarker = L.marker(fromLatLng, { icon: startIcon }).addTo(map)
  startMarker.bindTooltip(`
    <strong>${summary.packageNo}</strong><br/>
    出发: ${summary.senderCity}<br/>
    状态: ${summary.currentStatusDescription}
  `)

  const endIcon = L.divIcon({
    className: 'summary-end-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background: ${summary.isCompleted ? '#67C23A' : '#E6A23C'};
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })

  const endMarker = L.marker(toLatLng, { icon: endIcon }).addTo(map)
  endMarker.bindTooltip(`
    <strong>${summary.packageNo}</strong><br/>
    到达: ${summary.receiverCity}<br/>
    ${summary.isCompleted ? '已签收' : '运输中'}
  `)

  summaryMarkers.value.set(summary.packageId, {
    line: polyline,
    startMarker,
    endMarker
  })

  const bounds = L.latLngBounds([fromLatLng, toLatLng])
  map.fitBounds(bounds, { padding: [50, 50] })
}

const loadTrackDetail = async (summary) => {
  if (loadedTracks.has(summary.packageId)) {
    focusOnPackage(summary.packageId)
    return
  }

  try {
    const tracks = await trackApi.getByPackageId(summary.packageId)
    
    loadedTracks.set(summary.packageId, {
      packageId: summary.packageId,
      packageNo: summary.packageNo,
      senderCity: summary.senderCity,
      receiverCity: summary.receiverCity,
      trackCount: tracks.length,
      tracks: tracks
    })

    if (summaryMarkers.value.has(summary.packageId)) {
      const existing = summaryMarkers.value.get(summary.packageId)
      map.removeLayer(existing.line)
      map.removeLayer(existing.startMarker)
      map.removeLayer(existing.endMarker)
      summaryMarkers.value.delete(summary.packageId)
    }

    drawDetailedTrack(summary.packageId, tracks)
  } catch (error) {
    console.error('加载轨迹详情失败:', error)
  }
}

const drawDetailedTrack = (packageId, tracks) => {
  if (tracks.length < 2) return

  const reversedTracks = [...tracks].reverse()
  const latlngs = reversedTracks.map(t => [t.latitude, t.longitude])

  const polyline = L.polyline(latlngs, {
    color: '#67C23A',
    weight: 4,
    opacity: 0.9
  }).addTo(map)

  const markers = []

  reversedTracks.forEach((track, index) => {
    const icon = L.divIcon({
      className: `detailed-marker-${index}`,
      html: `<div style="
        width: 24px;
        height: 24px;
        background: ${getTrackColor(track.status)};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">${index + 1}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })

    const marker = L.marker([track.latitude, track.longitude], { icon }).addTo(map)
    marker.bindPopup(`
      <div style="min-width: 180px;">
        <strong>${track.location}</strong><br/>
        ${track.statusDescription}<br/>
        ${formatDate(track.timestamp)}
        ${track.stayDurationHours ? `<br/>停留: ${track.stayDurationHours}小时` : ''}
      </div>
    `)
    markers.push(marker)
  })

  trackPolylines.value.set(packageId, {
    polyline,
    markers
  })

  const bounds = L.latLngBounds(latlngs)
  map.fitBounds(bounds, { padding: [50, 50] })
}

const getTrackColor = (status) => {
  const colors = {
    'PICKUP': '#67c23a',
    'IN_TRANSIT': '#409EFF',
    'DISPATCH': '#e6a23c',
    'SIGNED': '#f56c6c'
  }
  return colors[status] || '#909399'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const focusOnPackage = (packageId) => {
  if (trackPolylines.value.has(packageId)) {
    const trackData = trackPolylines.value.get(packageId)
    if (trackData.markers.length > 0) {
      const latlngs = trackData.markers.map(m => m.getLatLng())
      const bounds = L.latLngBounds(latlngs)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  } else if (summaryMarkers.value.has(packageId)) {
    showSummaryOnMap(allSummaries.value.find(s => s.packageId === packageId))
  }
}

const unloadTrack = (packageId) => {
  if (trackPolylines.value.has(packageId)) {
    const trackData = trackPolylines.value.get(packageId)
    map.removeLayer(trackData.polyline)
    trackData.markers.forEach(m => map.removeLayer(m))
    trackPolylines.value.delete(packageId)
  }
  
  loadedTracks.delete(packageId)
  
  const summary = allSummaries.value.find(s => s.packageId === packageId)
  if (summary) {
    showSummaryOnMap(summary)
  }
}

const goToTrack = (packageId) => {
  router.push(`/packages/${packageId}`)
}

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  if (map) map.remove()
})
</script>

<style scoped>
:deep(.summary-start-marker),
:deep(.summary-end-marker),
:deep(.detailed-marker-0),
:deep(.detailed-marker-1),
:deep(.detailed-marker-2),
:deep(.detailed-marker-3),
:deep(.detailed-marker-4),
:deep(.detailed-marker-5),
:deep(.detailed-marker-6),
:deep(.detailed-marker-7),
:deep(.detailed-marker-8),
:deep(.detailed-marker-9),
:deep(.detailed-marker-10) {
  background: transparent !important;
  border: none !important;
}
</style>
