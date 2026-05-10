<template>
  <div class="map-page">
    <el-row :gutter="20">
      <el-col :span="18">
        <div class="card-container">
          <h2 class="page-title">
            <el-icon><MapLocation /></el-icon>
            小区地图
            <span class="tip">点击地图选择位置，标记为"已清理"</span>
          </h2>
          <div id="map" class="map-container"></div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card-container">
          <h2 class="section-title">
            <el-icon><Warning /></el-icon>
            待清理位置
          </h2>
          <div class="pending-list">
            <el-empty v-if="pendingPoints.length === 0" description="暂无待清理位置" />
            <div
              v-for="point in pendingPoints"
              :key="point.id"
              class="pending-item"
            >
              <div class="point-info">
                <div class="point-title">清理点 #{{ point.id }}</div>
                <div class="point-desc">{{ point.description || '暂无描述' }}</div>
                <div class="point-time">{{ formatTime(point.lastCleanTime) }}</div>
              </div>
              <el-button
                type="primary"
                size="small"
                @click="navigateToPoint(point)"
              >
                前往清理
              </el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog
      v-model="cleanDialogVisible"
      title="标记为已清理"
      width="500px"
    >
      <el-form :model="cleanForm" label-width="100px">
        <el-form-item label="位置">
          <div>纬度: {{ cleanForm.latitude }}</div>
          <div>经度: {{ cleanForm.longitude }}</div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="cleanForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入位置描述（可选）"
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
            <div v-if="cleanForm.photoUrl" class="photo-preview">
              <img :src="cleanForm.photoUrl" class="preview-image" />
            </div>
            <el-icon v-else class="upload-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cleanDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCleaning" :loading="submitting">
          提交（+10积分）
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import { ElMessage } from 'element-plus'
import api from '@/api'

let map = null
const cleanDialogVisible = ref(false)
const submitting = ref(false)
const pendingPoints = ref([])
const allPoints = ref([])
const markers = []

const currentUser = ref(null)
const cleanForm = ref({
  latitude: null,
  longitude: null,
  description: '',
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
  await loadAllPoints()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

const initMap = () => {
  map = L.map('map').setView([39.9042, 116.4074], 16)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  map.on('click', (e) => {
    cleanForm.value.latitude = e.latlng.lat
    cleanForm.value.longitude = e.latlng.lng
    cleanForm.value.description = ''
    cleanForm.value.photoUrl = ''
    cleanDialogVisible.value = true
  })
}

const loadAllPoints = async () => {
  try {
    const [allRes, pendingRes] = await Promise.all([
      api.getCleaningPoints(),
      api.getCleaningPointsByStatus('pending')
    ])
    allPoints.value = allRes.data
    pendingPoints.value = pendingRes.data
    renderMarkers()
  } catch (e) {
    console.error('加载清理点失败', e)
  }
}

const renderMarkers = () => {
  markers.forEach(m => map.removeLayer(m))
  markers.length = 0

  const cleanIcon = L.divIcon({
    className: 'custom-marker clean',
    html: '<div class="marker-icon clean-icon"></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })

  const pendingIcon = L.divIcon({
    className: 'custom-marker pending',
    html: '<div class="marker-icon pending-icon"></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })

  allPoints.value.forEach(point => {
    const icon = point.status === 'pending' ? pendingIcon : cleanIcon
    const marker = L.marker([point.latitude, point.longitude], { icon }).addTo(map)
    marker.bindPopup(`
      <div class="popup-content">
        <h4>清理点 #${point.id}</h4>
        <p>状态: ${point.status === 'clean' ? '已清理' : '待清理'}</p>
        <p>上次清理: ${formatTime(point.lastCleanTime)}</p>
      </div>
    `)
    markers.push(marker)
  })
}

const navigateToPoint = (point) => {
  map.setView([point.latitude, point.longitude], 18)
  cleanForm.value.latitude = point.latitude
  cleanForm.value.longitude = point.longitude
  cleanForm.value.description = point.description || ''
  cleanForm.value.photoUrl = ''
  cleanDialogVisible.value = true
}

const handlePhotoChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    cleanForm.value.photoUrl = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

const submitCleaning = async () => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }

  submitting.value = true
  try {
    const res = await api.createCleaningRecord({
      userId: currentUser.value.id,
      latitude: cleanForm.value.latitude,
      longitude: cleanForm.value.longitude,
      description: cleanForm.value.description,
      photoUrl: cleanForm.value.photoUrl
    })

    const response = res.data
    if (response.pointsAwarded) {
      currentUser.value.totalPoints += response.pointsEarned
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
      ElMessage.success(response.message || `打卡成功！获得${response.pointsEarned}积分`)
    } else {
      ElMessage.warning(response.message || '该位置已清理过，暂时无法获得积分')
    }

    cleanDialogVisible.value = false
    await loadAllPoints()
  } catch (e) {
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.map-page {
  .tip {
    font-size: 14px;
    font-weight: normal;
    color: #909399;
    margin-left: 12px;
  }

  .map-container {
    height: 500px;
    border-radius: 8px;
    overflow: hidden;
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

  .pending-list {
    max-height: 450px;
    overflow-y: auto;

    .pending-item {
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .point-info {
        margin-bottom: 12px;

        .point-title {
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }

        .point-desc {
          font-size: 14px;
          color: #606266;
          margin-bottom: 4px;
        }

        .point-time {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .photo-uploader {
    :deep(.el-upload) {
      border: 2px dashed #d9d9d9;
      border-radius: 8px;
      cursor: pointer;
      width: 200px;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.3s;

      &:hover {
        border-color: #409eff;
      }
    }

    .upload-icon {
      font-size: 48px;
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
.custom-marker {
  .marker-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  &.clean .clean-icon {
    background-color: #67c23a;
  }

  &.pending .pending-icon {
    background-color: #f56c6c;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0);
  }
}

.popup-content {
  h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #303133;
  }

  p {
    margin: 4px 0;
    font-size: 12px;
    color: #606266;
  }
}
</style>
