<template>
  <div class="page-container">
    <h2 class="page-title">国际空间站过境预报</h2>
    
    <el-card class="search-card card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Location /></el-icon>
          <span>选择观测位置</span>
        </div>
      </template>
      
      <el-form :model="locationForm" label-width="100px" class="location-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="纬度" required>
              <el-input-number
                v-model="locationForm.latitude"
                :min="-90"
                :max="90"
                :step="0.0001"
                :precision="4"
                placeholder="例如: 39.9042"
                class="full-width"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经度" required>
              <el-input-number
                v-model="locationForm.longitude"
                :min="-180"
                :max="180"
                :step="0.0001"
                :precision="4"
                placeholder="例如: 116.4074"
                class="full-width"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item>
          <el-button type="primary" @click="getLocation" :icon="Position">
            使用当前位置
          </el-button>
          <el-button type="success" @click="searchPasses" :loading="loading" :icon="Search">
            查询过境
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="passEvents.length > 0" class="results-card card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Calendar /></el-icon>
          <span>未来7天过境事件 (共 {{ passEvents.length }} 次)</span>
          <el-tag v-if="visibleCount > 0" type="success" effect="dark" class="visible-tag">
            可见 {{ visibleCount }} 次
          </el-tag>
        </div>
      </template>

      <el-table :data="passEvents" class="pass-table" stripe>
        <el-table-column label="序号" type="index" width="60" align="center" />
        
        <el-table-column label="日期" min-width="120">
          <template #default="{ row }">
            <span class="date-text">{{ formatDate(row.maxElevationTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="升起时间" min-width="140">
          <template #default="{ row }">
            <el-tooltip :content="formatDateTime(row.riseTime)" placement="top">
              <span>{{ formatTime(row.riseTime) }}</span>
              <br />
              <span class="direction-text">{{ row.riseDirection }} ({{ row.riseAzimuth }}°)</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="最高点" min-width="160">
          <template #default="{ row }">
            <div class="elevation-info">
              <span class="elevation-value" :class="{ 'high-elevation': row.maxElevation > 40 }">
                {{ row.maxElevation }}°
              </span>
              <br />
              <span class="direction-text">{{ row.maxDirection }} ({{ row.maxAzimuth }}°)</span>
              <br />
              <span class="time-text">{{ formatTime(row.maxElevationTime) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="降落时间" min-width="140">
          <template #default="{ row }">
            <el-tooltip :content="formatDateTime(row.setTime)" placement="top">
              <span>{{ formatTime(row.setTime) }}</span>
              <br />
              <span class="direction-text">{{ row.setDirection }} ({{ row.setAzimuth }}°)</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="时长" width="100" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.riseTime, row.setTime) }}
          </template>
        </el-table-column>

        <el-table-column label="亮度" width="120" align="center">
          <template #default="{ row }">
            <el-tooltip :content="getBrightnessDescription(row.brightness)" placement="top">
              <el-tag :type="getBrightnessType(row.brightness)" size="small">
                {{ formatBrightness(row.brightness) }} mag
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="可见性" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.visible ? 'success' : 'info'" size="small">
              {{ row.visible ? '可见' : '低仰角' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="观测人数" width="100" align="center">
          <template #default="{ row }">
            <el-badge :value="row.observerCount" :max="99" type="primary" class="observer-badge">
              <el-icon class="eye-icon"><View /></el-icon>
            </el-badge>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="Camera"
              @click="openCheckInDialog(row)"
            >
              我看到了
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-empty v-else-if="!loading && !showEmpty" description="请输入经纬度查询过境事件">
      <el-button type="primary" @click="getLocation">使用当前位置</el-button>
    </el-empty>

    <el-empty v-if="showEmpty" description="该位置未来7天暂无过境事件" />

    <el-dialog
      v-model="checkInDialogVisible"
      title="打卡观测"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="checkInForm" label-width="80px">
        <el-form-item label="位置">
          <el-tag type="info">
            纬度: {{ checkInForm.latitude }} / 经度: {{ checkInForm.longitude }}
          </el-tag>
        </el-form-item>
        
        <el-form-item label="过境时间">
          <span>{{ formatDateTime(currentEvent?.maxElevationTime) }}</span>
        </el-form-item>
        
        <el-form-item label="最大仰角">
          <el-tag type="success">{{ currentEvent?.maxElevation }}°</el-tag>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="checkInForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入简短描述（可选），例如：非常清晰的一次过境，亮度很高..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="checkInDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitCheckIn"
          :loading="submitting"
        >
          确认打卡
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Position, Camera, View } from '@element-plus/icons-vue'
import { predictPasses, recordObservation } from '@/api'
import { formatDateTime, formatDate, formatTime, formatDuration } from '@/utils/format'

const loading = ref(false)
const submitting = ref(false)
const passEvents = ref([])
const checkInDialogVisible = ref(false)
const currentEvent = ref(null)
const showEmpty = ref(false)

const locationForm = reactive({
  latitude: 39.9042,
  longitude: 116.4074
})

const checkInForm = reactive({
  passEventId: '',
  latitude: 0,
  longitude: 0,
  description: ''
})

const visibleCount = computed(() => {
  return passEvents.value.filter(e => e.visible).length
})

const formatBrightness = (brightness) => {
  if (brightness == null) return '-'
  return brightness.toFixed(1)
}

const getBrightnessType = (brightness) => {
  if (brightness == null) return 'info'
  if (brightness <= -2.5) return 'success'
  if (brightness <= -1.5) return 'warning'
  return 'info'
}

const getBrightnessDescription = (brightness) => {
  if (brightness == null) return '亮度未知'
  if (brightness <= -2.5) return '非常明亮，肉眼极易观测'
  if (brightness <= -1.5) return '明亮，肉眼容易观测'
  if (brightness <= -0.5) return '中等亮度，肉眼可见'
  return '较暗，需要良好观测条件'
}

const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        locationForm.latitude = position.coords.latitude
        locationForm.longitude = position.coords.longitude
        ElMessage.success('已获取当前位置')
      },
      (error) => {
        ElMessage.error('无法获取位置，请手动输入经纬度')
        console.error('Geolocation error:', error)
      }
    )
  } else {
    ElMessage.warning('浏览器不支持地理位置服务，请手动输入经纬度')
  }
}

const searchPasses = async () => {
  if (locationForm.latitude == null || locationForm.longitude == null) {
    ElMessage.warning('请输入纬度和经度')
    return
  }

  loading.value = true
  showEmpty.value = false
  
  try {
    const response = await predictPasses(locationForm.latitude, locationForm.longitude)
    
    if (response.success) {
      passEvents.value = response.passes || []
      showEmpty.value = passEvents.value.length === 0
      
      if (response.total > 0) {
        ElMessage.success(`找到 ${response.total} 次过境事件`)
      }
    } else {
      ElMessage.error(response.error || '查询失败')
    }
  } catch (error) {
    console.error('Search error:', error)
    ElMessage.error('查询过境事件失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const openCheckInDialog = (event) => {
  currentEvent.value = event
  checkInForm.passEventId = event.eventId
  checkInForm.latitude = locationForm.latitude
  checkInForm.longitude = locationForm.longitude
  checkInForm.description = ''
  checkInDialogVisible.value = true
}

const submitCheckIn = async () => {
  submitting.value = true
  
  try {
    const response = await recordObservation(checkInForm)
    
    if (response.success) {
      ElMessage.success('打卡成功！感谢您的观测记录')
      
      const event = passEvents.value.find(e => e.eventId === checkInForm.passEventId)
      if (event) {
        event.observerCount = response.observerCount
      }
      
      checkInDialogVisible.value = false
    } else {
      ElMessage.error(response.error || '打卡失败')
    }
  } catch (error) {
    console.error('Check-in error:', error)
    ElMessage.error('打卡失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.search-card {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.location-form {
  :deep(.el-form-item__label) {
    color: rgba(255, 255, 255, 0.8);
  }

  :deep(.el-input-number) {
    width: 100%;
  }

  .full-width {
    width: 100%;
  }
}

.results-card {
  :deep(.el-card__header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.visible-tag {
  margin-left: 15px;
}

.pass-table {
  :deep(.el-table) {
    background: transparent;
  }

  :deep(.el-table th.el-table__cell) {
    background: rgba(0, 0, 0, 0.2);
    color: #fff;
  }

  :deep(.el-table td.el-table__cell) {
    background: rgba(255, 255, 255, 0.02);
    color: rgba(255, 255, 255, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  :deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
    background: rgba(0, 0, 0, 0.1);
  }
}

.date-text {
  color: #00d4ff;
  font-weight: 500;
}

.direction-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.elevation-info {
  text-align: center;
}

.elevation-value {
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;

  &.high-elevation {
    color: #f56c6c;
    font-size: 18px;
  }
}

.time-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.observer-badge {
  :deep(.el-icon) {
    font-size: 20px;
    color: #00d4ff;
  }
}

:deep(.el-empty__description) {
  color: rgba(255, 255, 255, 0.6);
}
</style>
