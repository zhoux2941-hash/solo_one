<template>
  <div class="map-page">
    <el-header class="header">
      <div class="logo">🌌 光污染众包地图</div>
      <div class="nav">
        <el-button type="success" size="small" @click="togglePredictionPanel">
          🔭 观星预测
        </el-button>
        <el-button type="primary" size="small" @click="showSubmitDialog = true">
          + 提交观测
        </el-button>
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            {{ user?.nickname || user?.username }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="my">我的观测</el-dropdown-item>
              <el-dropdown-item command="challenge">暗夜挑战</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    
    <div class="map-container">
      <div ref="mapRef" class="map"></div>
      
      <div class="legend">
        <h4>目视极限星等</h4>
        <div class="legend-item" v-for="m in magnitudes" :key="m.value">
          <span class="dot" :style="{ background: m.color }"></span>
          <span>{{ m.value }}等 - {{ m.label }}</span>
        </div>
      </div>
      
      <div class="layer-controls">
        <el-switch v-model="showMarkers" active-text="标记点" inactive-text="标记点" />
        <el-switch v-model="showHeatmap" active-text="热力图" inactive-text="热力图" />
        <el-switch v-model="showContour" active-text="等值线" inactive-text="等值线" />
      </div>
      
      <div class="area-stats" v-if="areaStats">
        <h4>当前区域统计</h4>
        <p>平均极限星等: <strong>{{ areaStats.averageMagnitude || '暂无数据' }}</strong></p>
        <p>位置点数: <strong>{{ areaStats.locationCount || 0 }}</strong></p>
        <p>总观测记录: <strong>{{ areaStats.totalObservations || 0 }}</strong></p>
      </div>
      
      <div class="prediction-panel" v-if="showPrediction">
        <div class="panel-header">
          <h4>🔭 三晚观星预测</h4>
          <el-button type="text" @click="showPrediction = false">✕</el-button>
        </div>
        
        <div class="prediction-location" v-if="predictionLocation">
          <span>📍 {{ predictionLocation.lat.toFixed(4) }}, {{ predictionLocation.lng.toFixed(4) }}</span>
          <el-button link size="small" @click="refreshPrediction">刷新</el-button>
        </div>
        <div class="prediction-location empty" v-else>
          <span class="text-warning">💡 点击地图选择位置进行预测</span>
        </div>
        
        <div class="predictions" v-if="predictions.length > 0">
          <div class="prediction-card" 
               v-for="(p, idx) in predictions" 
               :key="idx"
               :class="{ best: isBestNight(p) }">
            <div class="card-header">
              <span class="date-label">{{ p.dateLabel }}</span>
              <span class="score-badge" :class="getScoreClass(p.overallScore)">
                {{ p.overallScore }}分
              </span>
            </div>
            
            <div class="score-bar">
              <div class="score-fill" 
                   :class="getScoreClass(p.overallScore)"
                   :style="{ width: p.overallScore * 10 + '%' }"></div>
            </div>
            
            <div class="moon-info">
              <span class="moon-icon">{{ getMoonIcon(p.moon.phaseIndex) }}</span>
              <span>{{ p.moon.phase }} {{ Math.round(p.moon.illumination) }}%</span>
            </div>
            
            <div class="time-info">
              <div>🌅 天文昏影: {{ p.times.astronomicalDusk || '--' }}</div>
              <div>🌄 天文晨光: {{ p.times.astronomicalDawn || '--' }}</div>
              <div>⏰ 观测窗口: {{ p.observationHours }}小时</div>
            </div>
            
            <div class="factors">
              <div v-for="(factor, fIdx) in p.factors" :key="fIdx">{{ factor }}</div>
            </div>
            
            <div class="limiting-mag" v-if="p.estimatedLimitingMagnitude">
              预计极限星等: <strong>{{ p.estimatedLimitingMagnitude }}等</strong>
            </div>
          </div>
        </div>
        
        <div class="loading" v-else-if="loadingPrediction">
          <el-icon class="is-loading"><Loading /></el-icon> 计算中...
        </div>
      </div>
    </div>
    
    <el-dialog
      v-model="showSubmitDialog"
      title="提交目视极限星等"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="submitForm" :rules="submitRules" ref="submitFormRef" label-width="120px">
        <el-form-item label="位置">
          <div class="location-info">
            <span v-if="submitForm.latitude">
              纬度: {{ submitForm.latitude.toFixed(6) }}, 
              经度: {{ submitForm.longitude.toFixed(6) }}
            </span>
            <span v-else class="text-warning">点击地图选择位置</span>
          </div>
        </el-form-item>
        <el-form-item label="手动输入" prop="latitude">
          <el-input-number v-model="submitForm.latitude" :min="-90" :max="90" :precision="6" size="small" />
          <el-input-number v-model="submitForm.longitude" :min="-180" :max="180" :precision="6" size="small" style="margin-left: 10px" />
        </el-form-item>
        <el-form-item label="地点名称">
          <el-input v-model="submitForm.locationName" placeholder="例如：奥林匹克森林公园" />
        </el-form-item>
        <el-form-item label="目视星等" prop="magnitude">
          <el-radio-group v-model="submitForm.magnitude">
            <el-radio-button :value="1">1等</el-radio-button>
            <el-radio-button :value="2">2等</el-radio-button>
            <el-radio-button :value="3">3等</el-radio-button>
            <el-radio-button :value="4">4等</el-radio-button>
            <el-radio-button :value="5">5等</el-radio-button>
            <el-radio-button :value="6">6等</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="天气">
          <el-select v-model="submitForm.weather" placeholder="请选择" clearable>
            <el-option label="晴朗" value="晴朗" />
            <el-option label="少云" value="少云" />
            <el-option label="多云" value="多云" />
            <el-option label="阴天" value="阴天" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="submitForm.description" type="textarea" :rows="3" placeholder="可选：描述周围环境、光线情况等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSubmitDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Loading } from '@element-plus/icons-vue'
import L from 'leaflet'
import { observationApi, heatmapApi, astronomyApi } from '@/api'

const router = useRouter()
const mapRef = ref(null)
const submitFormRef = ref()

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

let map = null
let markersLayer = null
let heatmapLayer = null
let contourLayer = null
let clickMarker = null

const showSubmitDialog = ref(false)
const submitting = ref(false)
const showMarkers = ref(true)
const showHeatmap = ref(true)
const showContour = ref(false)
const areaStats = ref(null)

const showPrediction = ref(false)
const predictions = ref([])
const predictionLocation = ref(null)
const loadingPrediction = ref(false)

const magnitudes = [
  { value: 1, color: '#ff0000', label: '光污染严重' },
  { value: 2, color: '#ff4400', label: '光污染较重' },
  { value: 3, color: '#ff8800', label: '光污染中等' },
  { value: 4, color: '#88cc00', label: '光污染较轻' },
  { value: 5, color: '#0088cc', label: '较好暗夜条件' },
  { value: 6, color: '#0000ff', label: '优秀暗夜' }
]

const submitForm = reactive({
  latitude: null,
  longitude: null,
  magnitude: 3,
  locationName: '',
  weather: '',
  description: ''
})

const submitRules = {
  latitude: [{ required: true, message: '请选择位置', trigger: 'change' }],
  magnitude: [{ required: true, message: '请选择目视星等', trigger: 'change' }]
}

const magnitudeColor = (m) => {
  const mag = magnitudes.find(x => x.value === m)
  return mag ? mag.color : '#999999'
}

const getScoreClass = (score) => {
  if (score >= 9) return 'excellent'
  if (score >= 7) return 'good'
  if (score >= 5) return 'fair'
  if (score >= 3) return 'poor'
  return 'very-poor'
}

const getMoonIcon = (phaseIndex) => {
  const icons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']
  return icons[phaseIndex] || '🌑'
}

const isBestNight = (p) => {
  const maxScore = Math.max(...predictions.value.map(x => x.overallScore))
  return p.overallScore === maxScore && p.overallScore >= 6
}

onMounted(() => {
  nextTick(() => initMap())
})

onUnmounted(() => {
  if (map) map.remove()
})

const initMap = () => {
  map = L.map(mapRef.value).setView([39.9042, 116.4074], 11)
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
  
  markersLayer = L.layerGroup().addTo(map)
  
  map.on('click', handleMapClick)
  map.on('moveend', debounce(handleMapMove, 500))
  map.on('zoomend', debounce(handleMapMove, 500))
  
  loadObservations()
  updateAreaStats()
}

const togglePredictionPanel = () => {
  showPrediction.value = !showPrediction.value
  if (showPrediction.value && !predictionLocation.value) {
    ElMessage.info('点击地图任意位置获取观星预测')
  }
}

const handleMapClick = (e) => {
  submitForm.latitude = e.latlng.lat
  submitForm.longitude = e.latlng.lng
  
  if (showPrediction.value) {
    predictionLocation.value = { lat: e.latlng.lat, lng: e.latlng.lng }
    loadPrediction()
  } else {
    showSubmitDialog.value = true
  }
  
  if (clickMarker) {
    map.removeLayer(clickMarker)
  }
  clickMarker = L.marker(e.latlng, { icon: L.divIcon({
    className: 'temp-marker',
    html: '<div style="width:16px;height:16px;background:#409eff;border-radius:50%;border:2px solid white;"></div>',
    iconSize: [16, 16]
  }) }).addTo(map)
}

const loadPrediction = async () => {
  if (!predictionLocation.value) return
  
  loadingPrediction.value = true
  predictions.value = []
  
  try {
    const res = await astronomyApi.getPrediction(
      predictionLocation.value.lat,
      predictionLocation.value.lng
    )
    predictions.value = res.data.data
  } catch (e) {
    console.error('获取预测失败', e)
    ElMessage.error('获取预测失败')
  } finally {
    loadingPrediction.value = false
  }
}

const refreshPrediction = () => {
  loadPrediction()
}

const handleMapMove = async () => {
  loadObservations()
  updateAreaStats()
  if (showHeatmap.value) updateHeatmap()
  if (showContour.value) updateContour()
}

const loadObservations = async () => {
  if (!map) return
  
  const bounds = map.getBounds()
  const bbox = {
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast()
  }
  
  try {
    const res = await observationApi.getByBbox(bbox)
    const locations = res.data.data
    
    markersLayer.clearLayers()
    
    locations.forEach(loc => {
      const trend = loc.magnitudeTrend || 0
      const trendLabel = trend > 0.01 ? '📈 改善中' : 
                         trend < -0.01 ? '📉 恶化中' : '➡️ 稳定'
      const trendColor = trend > 0.01 ? '#67c23a' : 
                         trend < -0.01 ? '#f56c6c' : '#909399'
      
      const radius = 8 + Math.min(loc.observationCount || 0, 6)
      const color = magnitudeColor(loc.magnitude)
      
      const marker = L.circleMarker([loc.latitude, loc.longitude], {
        radius: radius,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.85
      })
      
      const historyHtml = loc.observationCount > 1 
        ? `<br><span style="color: #909399;">历史: ${loc.minMagnitude || '?'}~${loc.maxMagnitude || '?'}等 (平均${loc.averageMagnitude || '?'})</span>`
        : ''
      
      const popupContent = `
        <div style="min-width: 220px">
          <strong style="font-size: 15px;">目视极限星等: ${loc.magnitude}等</strong>
          ${loc.locationName ? '<br><span style="color: #606266;">📍 ' + loc.locationName + '</span>' : ''}
          <br><span style="color: ${trendColor};">趋势: ${trendLabel}</span>
          ${historyHtml}
          <br><span style="color: #909399;">📊 观测次数: ${loc.observationCount || 1}次</span>
          ${loc.latestObservationAt ? '<br><span style="color: #909399;">🕒 最新: ' + new Date(loc.latestObservationAt).toLocaleString() + '</span>' : ''}
        </div>
      `
      
      marker.bindPopup(popupContent)
      markersLayer.addLayer(marker)
    })
  } catch (e) {
    console.error('加载观测点失败', e)
  }
}

const updateAreaStats = async () => {
  if (!map) return
  
  const bounds = map.getBounds()
  const bbox = {
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast()
  }
  
  try {
    const res = await observationApi.getAreaStats(bbox)
    areaStats.value = res.data.data
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

const updateHeatmap = async () => {
  if (!map || !showHeatmap.value) {
    if (heatmapLayer) {
      map.removeLayer(heatmapLayer)
      heatmapLayer = null
    }
    return
  }
  
  const bounds = map.getBounds()
  const bbox = {
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast()
  }
  
  try {
    const res = await heatmapApi.generate(bbox)
    const data = res.data.data
    renderHeatmap(data)
  } catch (e) {
    console.error('生成热力图失败', e)
  }
}

const renderHeatmap = (data) => {
  if (heatmapLayer) map.removeLayer(heatmapLayer)
  
  const gridData = data.gridData
  const size = data.gridSize
  
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  
  const imageData = ctx.createImageData(size, size)
  const pixels = imageData.data
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const value = gridData[i][j] || 3.5
      const rgb = valueToRGB(value)
      const idx = (i * size + j) * 4
      pixels[idx] = rgb[0]
      pixels[idx + 1] = rgb[1]
      pixels[idx + 2] = rgb[2]
      pixels[idx + 3] = 150
    }
  }
  
  ctx.putImageData(imageData, 0, 0)
  
  const dataUrl = canvas.toDataURL()
  heatmapLayer = L.imageOverlay(dataUrl, [
    [data.minLat, data.minLng],
    [data.maxLat, data.maxLng]
  ], { opacity: 0.6 }).addTo(map)
}

const updateContour = async () => {
  if (!map || !showContour.value) {
    if (contourLayer) {
      map.removeLayer(contourLayer)
      contourLayer = null
    }
    return
  }
  
  const bounds = map.getBounds()
  const bbox = {
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast()
  }
  
  try {
    const res = await heatmapApi.contour(bbox)
    const data = res.data.data
    renderContour(data)
  } catch (e) {
    console.error('生成等值线失败', e)
  }
}

const renderContour = (data) => {
  if (contourLayer) map.removeLayer(contourLayer)
  
  const contours = data.contours
  const geojson = {
    type: 'FeatureCollection',
    features: []
  }
  
  Object.keys(contours).forEach(level => {
    contours[level].forEach(line => {
      if (line.length >= 2) {
        geojson.features.push({
          type: 'Feature',
          properties: { level: parseFloat(level) },
          geometry: {
            type: 'LineString',
            coordinates: line.map(p => [p.lng, p.lat])
          }
        })
      }
    })
  })
  
  contourLayer = L.geoJSON(geojson, {
    style: (feature) => {
      const value = feature.properties.level
      const color = magnitudeColor(Math.round(value))
      return {
        color: color,
        weight: 2,
        opacity: 0.8
      }
    }
  }).addTo(map)
}

const valueToRGB = (value) => {
  const v = Math.max(1, Math.min(6, value))
  if (v <= 2) {
    return [255, Math.round((v - 1) * 68), 0]
  } else if (v <= 3) {
    return [255, Math.round(68 + (v - 2) * 68), 0]
  } else if (v <= 4) {
    return [Math.round(255 - (v - 3) * 170), 204, 0]
  } else if (v <= 5) {
    return [0, Math.round(204 - (v - 4) * 116), Math.round((v - 4) * 204)]
  } else {
    return [0, Math.round(88 - (v - 5) * 88), Math.round(204 + (v - 5) * 51)]
  }
}

const handleSubmit = async () => {
  try {
    await submitFormRef.value.validate()
    submitting.value = true
    
    const data = {
      latitude: submitForm.latitude,
      longitude: submitForm.longitude,
      magnitude: submitForm.magnitude,
      locationName: submitForm.locationName || undefined,
      weather: submitForm.weather || undefined,
      description: submitForm.description || undefined
    }
    
    await observationApi.create(data)
    
    ElMessage.success('提交成功！感谢您的贡献')
    showSubmitDialog.value = false
    loadObservations()
    updateAreaStats()
    
    submitForm.locationName = ''
    submitForm.weather = ''
    submitForm.description = ''
    
    if (clickMarker) {
      map.removeLayer(clickMarker)
      clickMarker = null
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const handleCommand = (command) => {
  if (command === 'my') {
    router.push('/my-observations')
  } else if (command === 'challenge') {
    router.push('/challenges')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }).catch(() => {})
  }
}

watch(showMarkers, (val) => {
  if (val) {
    map.addLayer(markersLayer)
  } else {
    map.removeLayer(markersLayer)
  }
})

watch(showHeatmap, () => {
  updateHeatmap()
})

watch(showContour, () => {
  updateContour()
})

const debounce = (fn, delay) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}
</script>

<style scoped>
.map-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
}

.header .nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.user-info {
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.map-container {
  flex: 1;
  position: relative;
}

.map {
  height: 100%;
}

.legend {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.legend h4 {
  margin-bottom: 12px;
  color: #333;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  font-size: 13px;
}

.legend .dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid white;
}

.layer-controls {
  position: absolute;
  top: 20px;
  right: 280px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.area-stats {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.area-stats h4 {
  margin-bottom: 12px;
  color: #333;
}

.area-stats p {
  margin: 6px 0;
  color: #666;
}

.prediction-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 260px;
  max-height: calc(100vh - 100px);
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.prediction-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: white;
}

.prediction-panel .panel-header h4 {
  margin: 0;
  font-size: 15px;
}

.prediction-location {
  padding: 10px 16px;
  font-size: 13px;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prediction-location.empty {
  color: #e6a23c;
}

.predictions {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.prediction-card {
  background: #f9fafc;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.prediction-card.best {
  border-color: #67c23a;
  background: linear-gradient(to right, #f0f9eb, #ffffff);
}

.prediction-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.prediction-card .date-label {
  font-weight: bold;
  color: #303133;
}

.score-badge {
  font-size: 18px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 4px;
}

.score-badge.excellent { background: #67c23a; color: white; }
.score-badge.good { background: #409eff; color: white; }
.score-badge.fair { background: #e6a23c; color: white; }
.score-badge.poor { background: #f56c6c; color: white; }
.score-badge.very-poor { background: #909399; color: white; }

.score-bar {
  height: 6px;
  background: #ebeef5;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
}

.score-fill {
  height: 100%;
  transition: width 0.3s;
}

.score-fill.excellent { background: linear-gradient(90deg, #67c23a, #409eff); }
.score-fill.good { background: linear-gradient(90deg, #409eff, #67c23a); }
.score-fill.fair { background: linear-gradient(90deg, #e6a23c, #f56c6c); }
.score-fill.poor { background: linear-gradient(90deg, #f56c6c, #909399); }
.score-fill.very-poor { background: #909399; }

.moon-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-bottom: 8px;
  padding: 6px;
  background: white;
  border-radius: 4px;
}

.moon-icon {
  font-size: 18px;
}

.time-info {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.6;
}

.factors {
  font-size: 11px;
  color: #909399;
  line-height: 1.5;
  margin-bottom: 8px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.limiting-mag {
  text-align: center;
  padding-top: 8px;
  border-top: 1px dashed #dcdfe6;
  font-size: 13px;
  color: #303133;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.location-info {
  color: #666;
  font-size: 13px;
}

.text-warning {
  color: #e6a23c;
}
</style>
