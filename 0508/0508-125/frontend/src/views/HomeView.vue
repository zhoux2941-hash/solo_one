<template>
  <div class="home-view">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="location-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Location /></el-icon> 观测地点</span>
            </div>
          </template>
          
          <el-form :model="locationForm" :inline="true" @submit.prevent="addLocation">
            <el-form-item label="名称">
              <el-input v-model="locationForm.name" placeholder="地点名称" />
            </el-form-item>
            <el-form-item label="纬度">
              <el-input-number 
                v-model="locationForm.latitude" 
                :precision="4" 
                :step="0.0001"
                :min="-90" 
                :max="90" 
                placeholder="纬度"
              />
            </el-form-item>
            <el-form-item label="经度">
              <el-input-number 
                v-model="locationForm.longitude" 
                :precision="4" 
                :step="0.0001"
                :min="-180" 
                :max="180" 
                placeholder="经度"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addLocation">
                <el-icon><Plus /></el-icon> 添加地点
              </el-button>
            </el-form-item>
          </el-form>
          
          <div v-if="locations.length > 0" class="locations-list">
            <el-tag 
              v-for="loc in locations" 
              :key="loc.id"
              :type="currentLocation?.id === loc.id ? 'success' : 'info'"
              class="location-tag"
              @click="selectLocation(loc)"
            >
              <el-icon><Location /></el-icon>
              {{ loc.name }}
              <span class="location-coord">({{ loc.latitude }}, {{ loc.longitude }})</span>
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><Monitor /></el-icon> 潮汐曲线</span>
              <div class="header-actions">
                <el-date-picker 
                  v-model="selectedDate" 
                  type="date" 
                  placeholder="选择日期"
                  @change="loadTideData"
                />
              </div>
            </div>
          </template>
          
          <div v-if="currentLocation" class="chart-container">
            <TideChart 
              :records="tideRecords" 
              :moon-phase="moonPhase"
              @record-click="openRecordDialog"
            />
          </div>
          <el-empty v-else description="请先选择或添加观测地点" />
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="moon-phase-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Moon /></el-icon> 月相信息</span>
            </div>
          </template>
          
          <div v-if="moonPhase" class="moon-phase-info">
            <div class="moon-icon">
              <el-icon :size="60" :color="getMoonIconColor()"><Moon /></el-icon>
            </div>
            <div class="phase-name">{{ moonPhase.phaseName }}</div>
            <el-progress 
              :percentage="Math.round(moonPhase.illumination)" 
              :stroke-width="8"
              :color="getProgressColor()"
              :format="(val) => `光照 ${val}%`"
            />
            
            <div v-if="moonPhase.isAstronomicalSpringTide" class="tide-alert danger">
              <el-icon><Warning /></el-icon>
              <span>天文大潮预警</span>
            </div>
            <div v-else-if="moonPhase.isSpringTide" class="tide-alert warning">
              <el-icon><InfoFilled /></el-icon>
              <span>大潮期</span>
            </div>
            
            <div class="phase-details">
              <p><strong>潮汐强度:</strong> 
                <el-tag :type="getTideTagType()" size="small">
                  {{ moonPhase.tideIntensity || '正常潮汐' }}
                </el-tag>
              </p>
              <p><strong>月地距离:</strong> {{ formatDistance(moonPhase.moonDistanceKm) }} 公里</p>
              <p v-if="moonPhase.isPerigee" class="perigee-text">
                <el-icon><Star /></el-icon> 月球接近近地点
              </p>
              <p v-if="moonPhase.isApogee" class="apogee-text">
                <el-icon><Moon /></el-icon> 月球接近远地点
              </p>
              <p><strong>月出:</strong> {{ formatTime(moonPhase.moonriseTime) }}</p>
              <p><strong>月落:</strong> {{ formatTime(moonPhase.moonsetTime) }}</p>
              <p><strong>中天:</strong> {{ formatTime(moonPhase.meridianTime) }}</p>
            </div>
            
            <div v-if="moonPhase.description" class="tide-description">
              <el-alert 
                :type="getAlertType()" 
                :closable="false"
                :show-icon="true"
              >
                {{ moonPhase.description }}
              </el-alert>
            </div>
          </div>
          <el-empty v-else description="请选择日期" />
        </el-card>
        
        <el-card class="mt-20">
          <template #header>
            <div class="card-header">
              <span><el-icon><Edit /></el-icon> 记录实际潮位</span>
            </div>
          </template>
          
          <el-form :model="recordForm" label-position="top">
            <el-form-item label="观测时间">
              <el-date-picker 
                v-model="recordForm.time" 
                type="datetime" 
                placeholder="选择观测时间"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="实际潮位 (米)">
              <el-input-number 
                v-model="recordForm.actualHeight" 
                :precision="2" 
                :step="0.1"
                style="width: 100%"
                placeholder="输入实际测量的潮位高度"
              />
            </el-form-item>
            <el-form-item label="上传照片">
              <el-upload
                v-model:file-list="recordForm.photoList"
                :auto-upload="false"
                :limit="1"
                list-type="picture-card"
                accept="image/*"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="备注">
              <el-input 
                v-model="recordForm.notes" 
                type="textarea" 
                :rows="2" 
                placeholder="记录风场、天气等影响因素"
              />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                @click="submitRecord" 
                :disabled="!currentLocation"
                style="width: 100%"
              >
                <el-icon><Upload /></el-icon> 提交记录
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="recordDialogVisible" title="编辑潮汐记录" width="500px">
      <el-form :model="editRecordForm" label-position="top">
        <el-form-item label="观测时间">
          <el-date-picker 
            v-model="editRecordForm.time" 
            type="datetime" 
            disabled
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="理论潮位 (米)">
          <el-input v-model="editRecordForm.theoreticalHeight" disabled />
        </el-form-item>
        <el-form-item label="实际潮位 (米)">
          <el-input-number 
            v-model="editRecordForm.actualHeight" 
            :precision="2" 
            :step="0.1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="偏差 (米)">
          <el-input v-model="editRecordForm.deviation" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="editRecordForm.notes" 
            type="textarea" 
            :rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { locationApi, tideApi } from '@/api/tide'
import TideChart from '@/components/TideChart.vue'

const locations = ref([])
const currentLocation = ref(null)
const selectedDate = ref(new Date())
const tideRecords = ref([])
const moonPhase = ref(null)
const recordDialogVisible = ref(false)

const locationForm = reactive({
  name: '',
  latitude: 31.2304,
  longitude: 121.4737
})

const recordForm = reactive({
  time: new Date(),
  actualHeight: null,
  photoList: [],
  notes: ''
})

const editRecordForm = reactive({
  id: null,
  time: null,
  theoreticalHeight: null,
  actualHeight: null,
  deviation: null,
  notes: ''
})

const loadLocations = async () => {
  try {
    const response = await locationApi.getAll()
    locations.value = response.data
    if (locations.value.length > 0 && !currentLocation.value) {
      selectLocation(locations.value[0])
    }
  } catch (error) {
    console.error('加载地点失败:', error)
  }
}

const addLocation = async () => {
  if (!locationForm.latitude || !locationForm.longitude) {
    ElMessage.warning('请输入经纬度')
    return
  }
  
  try {
    const response = await locationApi.create({
      name: locationForm.name || `观测点 ${locationForm.latitude}, ${locationForm.longitude}`,
      latitude: locationForm.latitude,
      longitude: locationForm.longitude
    })
    
    ElMessage.success('地点添加成功')
    loadLocations()
    selectLocation(response.data)
  } catch (error) {
    ElMessage.error('添加地点失败')
    console.error(error)
  }
}

const selectLocation = (location) => {
  currentLocation.value = location
  loadTideData()
}

const loadTideData = async () => {
  if (!currentLocation.value) return
  
  try {
    const dateStr = dayjs(selectedDate.value).format('YYYY-MM-DD')
    
    const [tideResponse, moonResponse] = await Promise.all([
      tideApi.getDaily(currentLocation.value.id, dateStr),
      tideApi.getMoonPhase(dateStr)
    ])
    
    tideRecords.value = tideResponse.data
    moonPhase.value = moonResponse.data
  } catch (error) {
    ElMessage.error('加载潮汐数据失败')
    console.error(error)
  }
}

const submitRecord = async () => {
  if (!currentLocation.value) {
    ElMessage.warning('请先选择地点')
    return
  }
  
  if (!recordForm.actualHeight && recordForm.actualHeight !== 0) {
    ElMessage.warning('请输入实际潮位')
    return
  }
  
  try {
    const formData = new FormData()
    const isoTimeWithTimezone = formatDateTimeWithTimezone(recordForm.time)
    formData.append('time', isoTimeWithTimezone)
    formData.append('actualHeight', recordForm.actualHeight)
    if (recordForm.notes) formData.append('notes', recordForm.notes)
    if (recordForm.photoList.length > 0) {
      formData.append('photo', recordForm.photoList[0].raw)
    }
    
    await tideApi.recordActual(currentLocation.value.id, formData)
    ElMessage.success('记录提交成功')
    
    recordForm.actualHeight = null
    recordForm.photoList = []
    recordForm.notes = ''
    
    loadTideData()
  } catch (error) {
    ElMessage.error('提交记录失败')
    console.error(error)
  }
}

const openRecordDialog = (record) => {
  editRecordForm.id = record.id
  editRecordForm.time = record.recordTime
  editRecordForm.theoreticalHeight = record.theoreticalHeight
  editRecordForm.actualHeight = record.actualHeight
  editRecordForm.notes = record.notes || ''
  editRecordForm.deviation = record.actualHeight !== null 
    ? (record.actualHeight - record.theoreticalHeight).toFixed(2)
    : '-'
  
  recordDialogVisible.value = true
}

const saveRecord = async () => {
  if (!editRecordForm.actualHeight && editRecordForm.actualHeight !== 0) {
    ElMessage.warning('请输入实际潮位')
    return
  }
  
  try {
    const formData = new FormData()
    formData.append('actualHeight', editRecordForm.actualHeight)
    if (editRecordForm.notes) formData.append('notes', editRecordForm.notes)
    
    await tideApi.updateRecord(editRecordForm.id, formData)
    ElMessage.success('保存成功')
    recordDialogVisible.value = false
    loadTideData()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return time
}

const formatDateTimeWithTimezone = (date) => {
  if (!date) return null
  
  const d = new Date(date)
  const timezoneOffset = -d.getTimezoneOffset()
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60)
  const offsetMinutes = Math.abs(timezoneOffset) % 60
  const offsetSign = timezoneOffset >= 0 ? '+' : '-'
  
  const pad = (num) => String(num).padStart(2, '0')
  
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  const seconds = pad(d.getSeconds())
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${pad(offsetHours)}:${pad(offsetMinutes)}`
}

const formatDistance = (distance) => {
  if (!distance) return '-'
  return Math.round(distance).toLocaleString()
}

const getMoonIconColor = () => {
  if (!moonPhase.value) return '#f0c040'
  
  if (moonPhase.value.isAstronomicalSpringTide) {
    return '#f56c6c'
  } else if (moonPhase.value.isSpringTide) {
    return '#e6a23c'
  } else if (moonPhase.value.isPerigee) {
    return '#67c23a'
  }
  return '#f0c040'
}

const getProgressColor = () => {
  if (!moonPhase.value) return '#409eff'
  
  if (moonPhase.value.isAstronomicalSpringTide) {
    return '#f56c6c'
  } else if (moonPhase.value.isSpringTide) {
    return '#e6a23c'
  }
  return '#67c23a'
}

const getTideTagType = () => {
  if (!moonPhase.value) return 'info'
  
  if (moonPhase.value.isAstronomicalSpringTide) {
    return 'danger'
  } else if (moonPhase.value.isSpringTide) {
    return 'warning'
  } else if (moonPhase.value.tideIntensity?.includes('小潮')) {
    return 'info'
  }
  return 'success'
}

const getAlertType = () => {
  if (!moonPhase.value) return 'info'
  
  if (moonPhase.value.isAstronomicalSpringTide) {
    return 'error'
  } else if (moonPhase.value.isSpringTide) {
    return 'warning'
  } else if (moonPhase.value.isPerigee) {
    return 'success'
  }
  return 'info'
}

onMounted(() => {
  loadLocations()
})

watch(selectedDate, () => {
  loadTideData()
})
</script>

<style scoped>
.location-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.locations-list {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.location-tag {
  cursor: pointer;
  padding: 8px 12px;
  font-size: 14px;
  transition: all 0.3s;
}

.location-tag:hover {
  transform: scale(1.05);
}

.location-coord {
  font-size: 12px;
  opacity: 0.8;
  margin-left: 5px;
}

.chart-container {
  height: 500px;
  width: 100%;
}

.moon-phase-card {
  text-align: center;
}

.moon-phase-info {
  padding: 20px 0;
}

.moon-icon {
  margin-bottom: 15px;
}

.phase-name {
  font-size: 1.5rem;
  font-weight: bold;
  color: #606266;
  margin-bottom: 15px;
}

.phase-details {
  margin-top: 20px;
  text-align: left;
  padding: 0 20px;
}

.phase-details p {
  margin: 8px 0;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 5px;
}

.tide-alert {
  margin: 15px 20px;
  padding: 10px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: bold;
  animation: pulse 2s infinite;
}

.tide-alert.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  color: white;
}

.tide-alert.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
  color: white;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.tide-description {
  margin: 15px 10px 0 10px;
}

.perigee-text {
  color: #67c23a !important;
  font-weight: bold;
}

.apogee-text {
  color: #909399 !important;
  font-style: italic;
}
</style>
