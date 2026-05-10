<template>
  <div class="rescue-page">
    <el-row :gutter="20">
      <el-col :span="18">
        <div class="card-container">
          <div class="map-header">
            <h2 class="page-title">
              <el-icon><HelpFilled /></el-icon>
              流浪动物救助地图
            </h2>
            <div class="view-toggle">
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button label="map">普通地图</el-radio-button>
                <el-radio-button label="heatmap">热力图</el-radio-button>
              </el-radio-group>
            </div>
            <div class="legend">
              <span class="legend-item"><span class="dot need-rescue"></span>需救助</span>
              <span class="legend-item"><span class="dot rescued"></span>已救助</span>
            </div>
          </div>
          <div id="rescue-map" class="map-container"></div>
          <div class="map-tip">
            <el-icon><InfoFilled /></el-icon>
            点击地图任意位置可以标记"发现流浪动物"
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card-container">
          <h2 class="section-title">
            <el-icon><DataAnalysis /></el-icon>
            救助统计
          </h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value" style="color: #e6a23c">{{ rescueStats.totalReported || 0 }}</div>
              <div class="stat-label">总报告数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color: #f56c6c">{{ rescueStats.needRescue || 0 }}</div>
              <div class="stat-label">需救助</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color: #67c23a">{{ rescueStats.totalRescued || 0 }}</div>
              <div class="stat-label">已救助</div>
            </div>
          </div>
        </div>

        <div class="card-container need-rescue-section">
          <h2 class="section-title">
            <el-icon><Warning /></el-icon>
            待救助动物
          </h2>
          <div class="rescue-list">
            <el-empty v-if="needRescuePoints.length === 0" description="暂无待救助动物" />
            <div
              v-for="point in needRescuePoints"
              :key="point.id"
              class="rescue-item"
            >
              <div class="rescue-header">
                <el-tag :type="getAnimalTagType(point.animalType)" size="small">
                  {{ getAnimalTypeName(point.animalType) }}
                </el-tag>
                <span class="rescue-time">{{ formatTime(point.createdAt) }}</span>
              </div>
              <div class="rescue-desc">{{ point.description || '暂无描述' }}</div>
              <div class="rescue-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="navigateToRescue(point)"
                >
                  查看位置
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="openRescueDialog(point)"
                >
                  标记救助
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog
      v-model="reportDialogVisible"
      title="报告发现流浪动物"
      width="500px"
    >
      <el-form :model="reportForm" label-width="100px">
        <el-form-item label="位置">
          <div>纬度: {{ reportForm.latitude }}</div>
          <div>经度: {{ reportForm.longitude }}</div>
        </el-form-item>
        <el-form-item label="动物类型">
          <el-select v-model="reportForm.animalType" placeholder="请选择">
            <el-option label="流浪狗" value="dog" />
            <el-option label="流浪猫" value="cat" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="reportForm.description"
            type="textarea"
            :rows="3"
            placeholder="请描述动物状态（可选）"
          />
        </el-form-item>
        <el-form-item label="照片">
          <el-upload
            class="photo-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handlePhotoChange"
            accept="image/*"
          >
            <div v-if="reportForm.photoUrl" class="photo-preview">
              <img :src="reportForm.photoUrl" class="preview-image" />
            </div>
            <el-icon v-else class="upload-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReport" :loading="submitting">
          提交报告
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="rescueDialogVisible"
      title="救助动物"
      width="500px"
    >
      <el-form :model="rescueForm" label-width="100px">
        <el-form-item label="操作类型">
          <el-radio-group v-model="rescueForm.actionType">
            <el-radio label="supply">送食物/水</el-radio>
            <el-radio label="rescue">标记已救助</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="rescueForm.note"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
        <el-form-item label="照片">
          <el-upload
            class="photo-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleRescuePhotoChange"
            accept="image/*"
          >
            <div v-if="rescueForm.photoUrl" class="photo-preview">
              <img :src="rescueForm.photoUrl" class="preview-image" />
            </div>
            <el-icon v-else class="upload-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rescueDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRescue" :loading="submittingRescue">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet.heat'
import { ElMessage } from 'element-plus'
import api from '@/api'

let map = null
let heatLayer = null
const markers = []

const viewMode = ref('map')
const rescueStats = ref({})
const allRescuePoints = ref([])
const needRescuePoints = ref([])
const currentUser = ref(null)

const reportDialogVisible = ref(false)
const rescueDialogVisible = ref(false)
const submitting = ref(false)
const submittingRescue = ref(false)
const selectedRescuePoint = ref(null)

const reportForm = ref({
  latitude: null,
  longitude: null,
  animalType: '',
  description: '',
  photoUrl: ''
})

const rescueForm = ref({
  actionType: 'supply',
  note: '',
  photoUrl: ''
})

onMounted(async () => {
  const user = localStorage.getItem('currentUser')
  if (!user) {
    ElMessage.warning('请先登录')
    return
  }
  currentUser.value = JSON.parse(user)

  initMap()
  await loadData()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

watch(viewMode, (newMode) => {
  if (newMode === 'heatmap') {
    showHeatMap()
  } else {
    hideHeatMap()
  }
})

const initMap = () => {
  map = L.map('rescue-map').setView([39.9042, 116.4074], 16)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  map.on('click', (e) => {
    reportForm.value.latitude = e.latlng.lat
    reportForm.value.longitude = e.latlng.lng
    reportForm.value.animalType = ''
    reportForm.value.description = ''
    reportForm.value.photoUrl = ''
    reportDialogVisible.value = true
  })
}

const loadData = async () => {
  try {
    const [statsRes, pointsRes, needRescueRes] = await Promise.all([
      api.getRescueStats(),
      api.getRescuePoints(),
      api.getRescuePointsByStatus('need_rescue')
    ])
    rescueStats.value = statsRes.data
    allRescuePoints.value = pointsRes.data
    needRescuePoints.value = needRescueRes.data
    renderMarkers()
  } catch (e) {
    console.error('加载救助数据失败', e)
  }
}

const renderMarkers = () => {
  markers.forEach(m => map.removeLayer(m))
  markers.length = 0

  const needRescueIcon = L.divIcon({
    className: 'custom-rescue-marker need-rescue',
    html: '<div class="rescue-marker-icon need-rescue-icon">🐾</div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  })

  const rescuedIcon = L.divIcon({
    className: 'custom-rescue-marker rescued',
    html: '<div class="rescue-marker-icon rescued-icon">✓</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })

  allRescuePoints.value.forEach(point => {
    const icon = point.status === 'need_rescue' ? needRescueIcon : rescuedIcon
    const marker = L.marker([point.latitude, point.longitude], { icon }).addTo(map)
    
    marker.bindPopup(`
      <div class="rescue-popup">
        <h4>${getAnimalTypeName(point.animalType)}</h4>
        <p class="status ${point.status}">
          ${point.status === 'need_rescue' ? '🔴 需要救助' : '✅ 已救助'}
        </p>
        <p>${point.description || '暂无描述'}</p>
        <p class="time">报告时间: ${formatTime(point.createdAt)}</p>
        ${point.status === 'need_rescue' ? `
          <div class="popup-actions">
            <button class="btn-rescue" onclick="window.selectRescuePoint(${point.id})">
              标记救助
            </button>
          </div>
        ` : ''}
      </div>
    `)
    markers.push(marker)
  })
}

const showHeatMap = () => {
  if (heatLayer) {
    heatLayer.addTo(map)
    return
  }

  const heatData = allRescuePoints.value.map(p => [
    p.latitude,
    p.longitude,
    p.status === 'need_rescue' ? 0.8 : 0.3
  ])

  if (heatData.length > 0) {
    heatLayer = L.heatLayer(heatData, {
      radius: 40,
      blur: 25,
      maxZoom: 17,
      gradient: {
        0.4: '#ffb347',
        0.6: '#ff6b6b',
        0.8: '#ee5a24',
        1.0: '#c0392b'
      }
    }).addTo(map)
  }
}

const hideHeatMap = () => {
  if (heatLayer) {
    map.removeLayer(heatLayer)
  }
}

const navigateToRescue = (point) => {
  map.setView([point.latitude, point.longitude], 18)
}

const openRescueDialog = (point) => {
  selectedRescuePoint.value = point
  rescueForm.value.actionType = 'supply'
  rescueForm.value.note = ''
  rescueForm.value.photoUrl = ''
  rescueDialogVisible.value = true
}

window.selectRescuePoint = (pointId) => {
  const point = allRescuePoints.value.find(p => p.id === pointId)
  if (point) {
    openRescueDialog(point)
  }
}

const handlePhotoChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    reportForm.value.photoUrl = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

const handleRescuePhotoChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    rescueForm.value.photoUrl = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

const submitReport = async () => {
  if (!reportForm.value.animalType) {
    ElMessage.warning('请选择动物类型')
    return
  }

  submitting.value = true
  try {
    await api.reportStrayAnimal({
      userId: currentUser.value.id,
      latitude: reportForm.value.latitude,
      longitude: reportForm.value.longitude,
      animalType: reportForm.value.animalType,
      description: reportForm.value.description,
      photoUrl: reportForm.value.photoUrl
    })

    ElMessage.success('报告提交成功！')
    reportDialogVisible.value = false
    await loadData()
  } catch (e) {
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

const submitRescue = async () => {
  if (!selectedRescuePoint.value) return

  submittingRescue.value = true
  try {
    if (rescueForm.value.actionType === 'rescue') {
      await api.markAsRescued(selectedRescuePoint.value.id, {
        userId: currentUser.value.id,
        rescueNote: rescueForm.value.note,
        photoUrl: rescueForm.value.photoUrl
      })
      ElMessage.success('已标记为已救助！')
    } else {
      await api.provideSupplies(selectedRescuePoint.value.id, {
        userId: currentUser.value.id,
        note: rescueForm.value.note,
        photoUrl: rescueForm.value.photoUrl
      })
      ElMessage.success('已记录送物资！')
    }

    rescueDialogVisible.value = false
    await loadData()
  } catch (e) {
    ElMessage.error('操作失败，请重试')
  } finally {
    submittingRescue.value = false
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const getAnimalTypeName = (type) => {
  const types = {
    'dog': '流浪狗',
    'cat': '流浪猫',
    'other': '其他动物'
  }
  return types[type] || '未知'
}

const getAnimalTagType = (type) => {
  const types = {
    'dog': 'warning',
    'cat': 'primary',
    'other': 'info'
  }
  return types[type] || 'info'
}
</script>

<style lang="scss" scoped>
.rescue-page {
  .map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .page-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }

    .legend {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #606266;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;

        &.need-rescue {
          background-color: #f56c6c;
        }

        &.rescued {
          background-color: #67c23a;
        }
      }
    }
  }

  .map-container {
    height: 500px;
    border-radius: 8px;
    overflow: hidden;
  }

  .map-tip {
    margin-top: 12px;
    padding: 10px 16px;
    background: #f4f4f5;
    border-radius: 6px;
    font-size: 13px;
    color: #909399;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #303133;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;

    .stat-item {
      text-align: center;
      padding: 12px 8px;
      background: #f5f7fa;
      border-radius: 8px;

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .need-rescue-section {
    margin-top: 20px;
  }

  .rescue-list {
    max-height: 350px;
    overflow-y: auto;

    .rescue-item {
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      margin-bottom: 12px;

      .rescue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .rescue-time {
          font-size: 12px;
          color: #909399;
        }
      }

      .rescue-desc {
        font-size: 13px;
        color: #606266;
        margin-bottom: 12px;
        line-height: 1.5;
      }

      .rescue-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .photo-uploader {
    :deep(.el-upload) {
      border: 2px dashed #d9d9d9;
      border-radius: 8px;
      cursor: pointer;
      width: 150px;
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.3s;

      &:hover {
        border-color: #409eff;
      }
    }

    .upload-icon {
      font-size: 36px;
      color: #8c939d;
    }

    .photo-preview {
      .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
      }
    }
  }
}
</style>

<style>
.custom-rescue-marker {
  .rescue-marker-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    font-weight: bold;
  }

  &.need-rescue .need-rescue-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    font-size: 18px;
    animation: rescue-pulse 2s infinite;
  }

  &.rescued .rescued-icon {
    width: 30px;
    height: 30px;
    background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
    font-size: 14px;
    color: white;
  }
}

@keyframes rescue-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(238, 90, 36, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(238, 90, 36, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(238, 90, 36, 0);
  }
}

.rescue-popup {
  h4 {
    margin: 0 0 8px 0;
    font-size: 15px;
    color: #303133;
  }

  .status {
    font-weight: 600;
    margin-bottom: 6px;

    &.need_rescue {
      color: #f56c6c;
    }

    &.rescued {
      color: #67c23a;
    }
  }

  p {
    margin: 4px 0;
    font-size: 12px;
    color: #606266;
  }

  .time {
    color: #909399;
    font-size: 11px;
  }

  .popup-actions {
    margin-top: 10px;

    .btn-rescue {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}
</style>
