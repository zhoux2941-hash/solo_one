<template>
  <div>
    <h1 class="page-title">聚合路径地图</h1>

    <div class="search-bar">
      <el-select v-model="aggregationMode" @change="loadData" style="width: 150px;">
        <el-option label="按线路聚合" value="route" />
        <el-option label="按状态聚合" value="status" />
      </el-select>
      <el-button type="primary" @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
      <el-button type="warning" @click="refreshAggregation">
        <el-icon><Loading /></el-icon>
        刷新聚合缓存
      </el-button>
    </div>

    <div v-if="routeAggregations.length === 0" class="chart-container">
      <el-empty description="暂无数据" />
    </div>

    <div v-else>
      <div class="chart-container">
        <div class="chart-title">🗺️ 线路聚合地图（共 {{ routeAggregations.length }} 条线路）</div>
        <div ref="mapRef" class="map-container"></div>
      </div>

      <div class="chart-container">
        <div class="chart-title">📊 线路统计</div>
        <el-table :data="routeAggregations" border max-height="400">
          <el-table-column type="index" label="排名" width="80" />
          <el-table-column label="线路" width="200">
            <template #default="scope">
              <el-tag type="primary">{{ scope.row.fromCity }}</el-tag>
              <span style="margin: 0 8px;">→</span>
              <el-tag type="success">{{ scope.row.toCity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalPackages" label="包裹数" width="120">
            <template #default="scope">
              <el-tag :type="getPackageCountTagType(scope.row.totalPackages)">
                {{ scope.row.totalPackages }} 件
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="avgDistance" label="平均距离(km)" width="130" />
          <el-table-column prop="avgDurationHours" label="平均时效(小时)" width="140" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="primary" link @click="showRouteDetails(scope.row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="detailDialogVisible"
      title="线路详情"
      width="90%"
      top="5vh"
    >
      <div v-if="selectedRoute">
        <div style="margin-bottom: 15px;">
          <el-tag type="primary" size="large">{{ selectedRoute.fromCity }}</el-tag>
          <span style="margin: 0 10px;">→</span>
          <el-tag type="success" size="large">{{ selectedRoute.toCity }}</el-tag>
          <span style="margin-left: 20px;">
            共 <strong>{{ selectedRoute.totalPackages }}</strong> 个包裹
          </span>
        </div>

        <div v-if="selectedRoute.samplePackageIds && selectedRoute.samplePackageIds.length > 0">
          <h3 style="margin-bottom: 10px;">代表性包裹</h3>
          <el-table :data="samplePackages" border>
            <el-table-column prop="packageNo" label="包裹单号" width="200" />
            <el-table-column prop="currentStatusDescription" label="状态" width="120">
              <template #default="scope">
                <el-tag :type="getStatusTagType(scope.row.currentStatus)">
                  {{ scope.row.currentStatusDescription }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalDistance" label="距离(km)" width="100" />
            <el-table-column prop="totalHours" label="耗时(小时)" width="100" />
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="primary" link @click="goToTrack(scope.row.packageId)">
                  轨迹详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="selectedRoute.samplePackageIds && selectedRoute.samplePackageIds.length > 0" style="margin-top: 20px;">
          <h3 style="margin-bottom: 10px;">代表性路径</h3>
          <div ref="detailMapRef" class="map-container" style="height: 350px;"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { batchApi } from '../api'
import { Refresh, Loading } from '@element-plus/icons-vue'

const router = useRouter()
const mapRef = ref(null)
const detailMapRef = ref(null)
let map = null
let detailMap = null

const aggregationMode = ref('route')
const routeAggregations = ref([])

const detailDialogVisible = ref(false)
const selectedRoute = ref(null)
const samplePackages = ref([])

const loadData = async () => {
  try {
    const data = await batchApi.getRouteAggregation()
    routeAggregations.value = data || []
    await nextTick()
    initMap()
  } catch (error) {
    console.error('加载线路聚合数据失败:', error)
  }
}

const refreshAggregation = async () => {
  try {
    const data = await batchApi.refreshRouteAggregation()
    routeAggregations.value = data || []
    await nextTick()
    initMap()
  } catch (error) {
    console.error('刷新聚合数据失败:', error)
  }
}

const initMap = () => {
  if (!mapRef.value || routeAggregations.value.length === 0) return

  if (map) {
    map.remove()
  }

  map = L.map(mapRef.value).setView([35.8617, 104.1954], 4)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  const maxPackages = Math.max(...routeAggregations.value.map(r => r.totalPackages))

  const latlngs = []

  routeAggregations.value.forEach((route, index) => {
    if (!route.fromLatitude || !route.toLatitude) return

    const intensity = route.totalPackages / maxPackages
    const width = 2 + intensity * 10
    const opacity = 0.4 + intensity * 0.5
    const color = getRouteColor(intensity)

    const fromLatLng = [route.fromLatitude, route.fromLongitude]
    const toLatLng = [route.toLatitude, route.toLongitude]

    latlngs.push(fromLatLng, toLatLng)

    const offset = index * 0.05
    const curvedPath = generateCurvedPath(fromLatLng, toLatLng, offset)

    const polyline = L.polyline(curvedPath, {
      color: color,
      weight: width,
      opacity: opacity
    }).addTo(map)

    polyline.bindTooltip(`
      <div style="min-width: 150px;">
        <strong>${route.fromCity} → ${route.toCity}</strong><br/>
        包裹数: ${route.totalPackages} 件<br/>
        平均距离: ${route.avgDistance || '-'} km<br/>
        平均时效: ${route.avgDurationHours || '-'} 小时
      </div>
    `)

    polyline.on('click', () => {
      showRouteDetails(route)
    })

    const fromCenter = L.circleMarker(fromLatLng, {
      radius: 8 + intensity * 12,
      color: '#409EFF',
      fillColor: '#409EFF',
      fillOpacity: 0.8
    }).addTo(map)
    fromCenter.bindTooltip(`<strong>${route.fromCity}</strong><br/>出发城市`)

    const toCenter = L.circleMarker(toLatLng, {
      radius: 8 + intensity * 12,
      color: '#67C23A',
      fillColor: '#67C23A',
      fillOpacity: 0.8
    }).addTo(map)
    toCenter.bindTooltip(`<strong>${route.toCity}</strong><br/>目的城市`)
  })

  if (latlngs.length > 0) {
    const bounds = L.latLngBounds(latlngs)
    map.fitBounds(bounds, { padding: [60, 60] })
  }
}

const generateCurvedPath = (from, to, offset) => {
  const midLat = (from[0] + to[0]) / 2 + offset
  const midLng = (from[1] + to[1]) / 2 + offset

  const points = []
  for (let i = 0; i <= 20; i++) {
    const t = i / 20
    const lat = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * midLat + t * t * to[0]
    const lng = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * midLng + t * t * to[1]
    points.push([lat, lng])
  }

  return points
}

const getRouteColor = (intensity) => {
  if (intensity < 0.25) return '#909399'
  if (intensity < 0.5) return '#409EFF'
  if (intensity < 0.75) return '#E6A23C'
  return '#F56C6C'
}

const getPackageCountTagType = (count) => {
  if (count < 5) return 'info'
  if (count < 15) return 'primary'
  if (count < 30) return 'warning'
  return 'danger'
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

const showRouteDetails = async (route) => {
  selectedRoute.value = route
  detailDialogVisible.value = true
  samplePackages.value = []

  if (route.samplePackageIds && route.samplePackageIds.length > 0) {
    try {
      samplePackages.value = await batchApi.getBatchTrackSummary(route.samplePackageIds)
    } catch (error) {
      console.error('加载示例包裹失败:', error)
    }
  }

  await nextTick()
  initDetailMap()
}

const initDetailMap = () => {
  if (!detailMapRef.value || !selectedRoute.value) return

  if (detailMap) {
    detailMap.remove()
  }

  const route = selectedRoute.value

  detailMap = L.map(detailMapRef.value).setView([
    (route.fromLatitude + route.toLatitude) / 2,
    (route.fromLongitude + route.toLongitude) / 2
  ], 5)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(detailMap)

  const fromLatLng = [route.fromLatitude, route.fromLongitude]
  const toLatLng = [route.toLatitude, route.toLongitude]

  L.polyline([fromLatLng, toLatLng], {
    color: '#409EFF',
    weight: 4,
    dashArray: '10, 10'
  }).addTo(detailMap)

  L.circleMarker(fromLatLng, {
    radius: 15,
    color: '#409EFF',
    fillColor: '#409EFF',
    fillOpacity: 0.8
  }).addTo(detailMap)
    .bindTooltip(`<strong>${route.fromCity}</strong><br/>出发城市`)

  L.circleMarker(toLatLng, {
    radius: 15,
    color: '#67C23A',
    fillColor: '#67C23A',
    fillOpacity: 0.8
  }).addTo(detailMap)
    .bindTooltip(`<strong>${route.toCity}</strong><br/>目的城市`)

  if (samplePackages.value.length > 0 && samplePackages.value[0].pickup) {
    const representative = samplePackages.value[0]
    if (representative.pickup && representative.latest) {
      L.polyline(
        [[representative.pickup.latitude, representative.pickup.longitude],
         [representative.latest.latitude, representative.latest.longitude]],
        {
          color: '#F56C6C',
          weight: 3
        }
      ).addTo(detailMap)

      L.marker([representative.pickup.latitude, representative.pickup.longitude])
        .addTo(detailMap)
        .bindTooltip(`<strong>代表性包裹</strong><br/>${representative.packageNo}`)
    }
  }
}

const goToTrack = (packageId) => {
  detailDialogVisible.value = false
  router.push(`/packages/${packageId}`)
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (map) map.remove()
  if (detailMap) detailMap.remove()
})
</script>
