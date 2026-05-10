<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">Iridium闪光预报</h2>
      <el-tag type="warning" effect="dark" size="small">
        注：Iridium卫星已退役，数据为模拟演示
      </el-tag>
    </div>
    
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
          <el-button type="success" @click="searchFlares" :loading="loading" :icon="Search">
            查询闪光
          </el-button>
          <el-button @click="openNotificationDialog" :icon="Bell">
            设置通知
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="flareEvents.length > 0" class="results-card card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Sunny /></el-icon>
          <span>未来7天Iridium闪光事件 (共 {{ flareEvents.length }} 次)</span>
          <el-tag v-if="visibleCount > 0" type="success" effect="dark" class="visible-tag">
            可见 {{ visibleCount }} 次
          </el-tag>
        </div>
      </template>

      <el-table :data="flareEvents" class="flare-table" stripe>
        <el-table-column label="序号" type="index" width="60" align="center" />
        
        <el-table-column label="日期" min-width="120">
          <template #default="{ row }">
            <span class="date-text">{{ formatDate(row.flareTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="闪光时间" min-width="140">
          <template #default="{ row }">
            <el-tooltip :content="formatDateTime(row.flareTime)" placement="top">
              <span>{{ formatTime(row.flareTime) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="卫星" min-width="120">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.satelliteName }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="位置" min-width="140">
          <template #default="{ row }">
            <div class="position-info">
              <span class="elevation-value" :class="{ 'high-elevation': row.elevation > 40 }">
                {{ row.elevation }}°
              </span>
              <br />
              <span class="direction-text">{{ row.direction }} ({{ row.azimuth }}°)</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="亮度" width="130" align="center">
          <template #default="{ row }">
            <el-tooltip :content="getIridiumBrightnessDescription(row.brightness)" placement="top">
              <el-tag :type="getIridiumBrightnessType(row.brightness)" size="small">
                {{ formatIridiumBrightness(row.brightness) }} mag
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="持续时间" width="100" align="center">
          <template #default="{ row }">
            {{ formatDurationSeconds(row.durationSeconds) }}
          </template>
        </el-table-column>

        <el-table-column label="闪光类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.flareType }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="可见性" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.visible ? 'success' : 'info'" size="small">
              {{ row.visible ? '可见' : '较暗' }}
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

    <el-empty v-else-if="!loading && !showEmpty" description="请输入经纬度查询Iridium闪光事件">
      <el-button type="primary" @click="getLocation">使用当前位置</el-button>
    </el-empty>

    <el-empty v-if="showEmpty" description="该位置未来7天暂无Iridium闪光事件" />

    <el-dialog
      v-model="checkInDialogVisible"
      title="打卡观测 - Iridium闪光"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="checkInForm" label-width="80px">
        <el-form-item label="位置">
          <el-tag type="info">
            纬度: {{ checkInForm.latitude }} / 经度: {{ checkInForm.longitude }}
          </el-tag>
        </el-form-item>
        
        <el-form-item label="闪光时间">
          <span>{{ formatDateTime(currentEvent?.flareTime) }}</span>
        </el-form-item>
        
        <el-form-item label="卫星">
          <el-tag type="info">{{ currentEvent?.satelliteName }}</el-tag>
        </el-form-item>
        
        <el-form-item label="最大仰角">
          <el-tag type="success">{{ currentEvent?.elevation }}°</el-tag>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="checkInForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入简短描述（可选）..."
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

    <el-dialog
      v-model="notificationDialogVisible"
      title="通知设置"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="创建订阅" name="create">
          <el-form :model="notificationForm" label-width="120px">
            <el-form-item label="位置名称">
              <el-input
                v-model="notificationForm.locationName"
                placeholder="例如：我家、办公室"
                maxlength="50"
              />
            </el-form-item>
            
            <el-form-item label="纬度">
              <el-input-number
                v-model="notificationForm.latitude"
                :min="-90"
                :max="90"
                :step="0.0001"
                :precision="4"
                class="full-width"
              />
            </el-form-item>
            
            <el-form-item label="经度">
              <el-input-number
                v-model="notificationForm.longitude"
                :min="-180"
                :max="180"
                :step="0.0001"
                :precision="4"
                class="full-width"
              />
            </el-form-item>
            
            <el-form-item label="通知类型">
              <el-checkbox-group v-model="notificationTypes">
                <el-checkbox label="ISS_PASS">ISS过境</el-checkbox>
                <el-checkbox label="IRIDIUM_FLARE">Iridium闪光</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="最小亮度 (mag)">
              <el-slider
                v-model="notificationForm.minBrightness"
                :min="-8"
                :max="0"
                :step="0.5"
                :marks="sliderMarks"
                show-tooltip
              />
              <div class="slider-desc">
                <span>更亮 (-8.0)</span>
                <span style="float: right;">较暗 (0.0)</span>
              </div>
            </el-form-item>
            
            <el-form-item label="最小仰角">
              <el-slider
                v-model="notificationForm.minElevation"
                :min="5"
                :max="90"
                :step="5"
                show-stops
              />
            </el-form-item>
            
            <el-form-item label="提前通知">
              <el-select v-model="notificationForm.advanceNoticeMinutes" style="width: 100%;">
                <el-option :label="5 + ' 分钟前'" :value="5" />
                <el-option :label="10 + ' 分钟前'" :value="10" />
                <el-option :label="15 + ' 分钟前'" :value="15" />
                <el-option :label="30 + ' 分钟前'" :value="30" />
                <el-option :label="60 + ' 分钟前'" :value="60" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="通知方式">
              <el-radio-group v-model="notificationForm.notificationMethod">
                <el-radio label="BROWSER">浏览器通知</el-radio>
                <el-radio label="EMAIL">邮件</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item v-if="notificationForm.notificationMethod === 'EMAIL'" label="邮箱">
              <el-input
                v-model="notificationForm.notificationTarget"
                placeholder="请输入邮箱地址"
              />
            </el-form-item>
          </el-form>
          
          <div class="dialog-footer">
            <el-button @click="notificationDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="createSubscription" :loading="creating">
              创建订阅
            </el-button>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="我的订阅" name="list">
          <div v-if="subscriptions.length > 0" class="subscription-list">
            <el-card
              v-for="sub in subscriptions"
              :key="sub.id"
              class="subscription-card"
              shadow="hover"
            >
              <div class="subscription-header">
                <span class="subscription-location">
                  <el-icon><Location /></el-icon>
                  {{ sub.locationName || '未命名位置' }}
                </span>
                <el-switch
                  v-model="sub.isActive"
                  @change="toggleSubscription(sub)"
                />
              </div>
              
              <div class="subscription-details">
                <div class="detail-item">
                  <span class="label">位置：</span>
                  <span>{{ sub.latitude.toFixed(4) }}°, {{ sub.longitude.toFixed(4) }}°</span>
                </div>
                <div class="detail-item">
                  <span class="label">通知：</span>
                  <el-tag v-if="sub.notifyIssPass" type="primary" size="small" style="margin-right: 5px;">
                    ISS过境
                  </el-tag>
                  <el-tag v-if="sub.notifyIridiumFlare" type="warning" size="small">
                    Iridium闪光
                  </el-tag>
                </div>
                <div class="detail-item">
                  <span class="label">条件：</span>
                  <span>亮度 ≤ {{ sub.minBrightness }} mag, 仰角 ≥ {{ sub.minElevation }}°</span>
                </div>
                <div class="detail-item">
                  <span class="label">提前：</span>
                  <span>{{ sub.advanceNoticeMinutes }} 分钟</span>
                </div>
              </div>
              
              <div class="subscription-actions">
                <el-button type="danger" size="small" @click="deleteSubscription(sub.id)">
                  删除
                </el-button>
              </div>
            </el-card>
          </div>
          <el-empty v-else description="暂无订阅" />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Position, Bell, Camera, View, Sunny } from '@element-plus/icons-vue'
import { 
  predictIridiumFlares, 
  recordObservation,
  createNotificationSubscription,
  getUserSubscriptions,
  deleteSubscription as apiDeleteSubscription,
  toggleSubscription as apiToggleSubscription
} from '@/api'
import { formatDateTime, formatDate, formatTime } from '@/utils/format'

const loading = ref(false)
const submitting = ref(false)
const creating = ref(false)
const flareEvents = ref([])
const checkInDialogVisible = ref(false)
const notificationDialogVisible = ref(false)
const currentEvent = ref(null)
const showEmpty = ref(false)
const activeTab = ref('create')
const subscriptions = ref([])

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

const notificationForm = reactive({
  latitude: 39.9042,
  longitude: 116.4074,
  locationName: '',
  minBrightness: -3.0,
  minElevation: 10,
  advanceNoticeMinutes: 15,
  notificationMethod: 'BROWSER',
  notificationTarget: ''
})

const notificationTypes = ref(['IRIDIUM_FLARE'])

const sliderMarks = {
  '-8': '-8',
  '-6': '-6',
  '-4': '-4',
  '-2': '-2',
  '0': '0'
}

const visibleCount = computed(() => {
  return flareEvents.value.filter(e => e.visible).length
})

const USER_ID_KEY = 'iss_tracker_user_id'

const getUserId = () => {
  let userId = localStorage.getItem(USER_ID_KEY)
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 14)
    localStorage.setItem(USER_ID_KEY, userId)
  }
  return userId
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

const searchFlares = async () => {
  if (locationForm.latitude == null || locationForm.longitude == null) {
    ElMessage.warning('请输入纬度和经度')
    return
  }

  loading.value = true
  showEmpty.value = false
  
  try {
    const response = await predictIridiumFlares(locationForm.latitude, locationForm.longitude)
    
    if (response.success) {
      flareEvents.value = response.flares || []
      showEmpty.value = flareEvents.value.length === 0
      
      if (response.total > 0) {
        ElMessage.success(`找到 ${response.total} 次Iridium闪光事件`)
      }
    } else {
      ElMessage.error(response.error || '查询失败')
    }
  } catch (error) {
    console.error('Search error:', error)
    ElMessage.error('查询Iridium闪光事件失败，请稍后重试')
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
      
      const event = flareEvents.value.find(e => e.eventId === checkInForm.passEventId)
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

const openNotificationDialog = async () => {
  notificationForm.latitude = locationForm.latitude
  notificationForm.longitude = locationForm.longitude
  notificationDialogVisible.value = true
  await loadSubscriptions()
}

const loadSubscriptions = async () => {
  try {
    const userId = getUserId()
    const response = await getUserSubscriptions(userId)
    if (response.success) {
      subscriptions.value = response.subscriptions || []
    }
  } catch (error) {
    console.error('Load subscriptions error:', error)
  }
}

const createSubscription = async () => {
  if (notificationTypes.value.length === 0) {
    ElMessage.warning('请至少选择一种通知类型')
    return
  }

  creating.value = true
  
  try {
    const userId = getUserId()
    const data = {
      userIdentifier: userId,
      latitude: notificationForm.latitude,
      longitude: notificationForm.longitude,
      locationName: notificationForm.locationName,
      notifyIssPass: notificationTypes.value.includes('ISS_PASS'),
      notifyIridiumFlare: notificationTypes.value.includes('IRIDIUM_FLARE'),
      minBrightness: notificationForm.minBrightness,
      minElevation: notificationForm.minElevation,
      advanceNoticeMinutes: notificationForm.advanceNoticeMinutes,
      notificationMethod: notificationForm.notificationMethod,
      notificationTarget: notificationForm.notificationTarget,
      isActive: true
    }
    
    const response = await createNotificationSubscription(data)
    
    if (response.success) {
      ElMessage.success('订阅创建成功！')
      await loadSubscriptions()
      activeTab.value = 'list'
    } else {
      ElMessage.error(response.error || '创建订阅失败')
    }
  } catch (error) {
    console.error('Create subscription error:', error)
    ElMessage.error('创建订阅失败，请稍后重试')
  } finally {
    creating.value = false
  }
}

const toggleSubscription = async (sub) => {
  try {
    await apiToggleSubscription(sub.id, sub.isActive)
    ElMessage.success(sub.isActive ? '订阅已激活' : '订阅已停用')
  } catch (error) {
    console.error('Toggle subscription error:', error)
    sub.isActive = !sub.isActive
    ElMessage.error('操作失败')
  }
}

const deleteSubscription = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除此订阅吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await apiDeleteSubscription(id)
    ElMessage.success('订阅已删除')
    await loadSubscriptions()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete subscription error:', error)
      ElMessage.error('删除失败')
    }
  }
}

const formatIridiumBrightness = (brightness) => {
  if (brightness == null) return '-'
  return brightness.toFixed(1)
}

const getIridiumBrightnessType = (brightness) => {
  if (brightness == null) return 'info'
  if (brightness <= -6.0) return 'danger'
  if (brightness <= -4.0) return 'success'
  if (brightness <= -2.0) return 'warning'
  return 'info'
}

const getIridiumBrightnessDescription = (brightness) => {
  if (brightness == null) return '亮度未知'
  if (brightness <= -6.0) return '极亮，堪比月亮，非常壮观！'
  if (brightness <= -4.0) return '非常明亮，极易观测'
  if (brightness <= -2.0) return '明亮，肉眼容易观测'
  return '较暗，需要良好观测条件'
}

const formatDurationSeconds = (seconds) => {
  if (seconds == null) return '-'
  if (seconds < 60) {
    return `${seconds}秒`
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

onMounted(() => {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
}

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

.flare-table {
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

.position-info {
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

.direction-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
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

.subscription-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.subscription-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 15px;
}

.subscription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.subscription-location {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #00d4ff;
}

.subscription-details {
  :deep(.detail-item) {
    margin-bottom: 8px;
    font-size: 14px;
    
    .label {
      color: rgba(255, 255, 255, 0.6);
    }
    
    span:not(.label) {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

.subscription-actions {
  margin-top: 10px;
  text-align: right;
}

.slider-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 5px;
}

.dialog-footer {
  margin-top: 20px;
  text-align: right;
}

:deep(.el-tabs__item) {
  color: rgba(255, 255, 255, 0.7);
  
  &.is-active {
    color: #00d4ff;
  }
}

:deep(.el-tabs__active-bar) {
  background-color: #00d4ff;
}
</style>
