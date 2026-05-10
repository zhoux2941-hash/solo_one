<template>
  <div class="challenges-page">
    <el-header class="header">
      <div class="title">🌙 暗夜挑战</div>
      <el-button @click="router.back()">返回</el-button>
    </el-header>
    
    <div class="content">
      <div class="intro-card">
        <h2>什么是暗夜挑战？</h2>
        <p>连续7天在同一位置提交目视极限星等观测，证明您所在位置的暗夜质量！</p>
        <ul>
          <li>每天在同一位置（约1公里内）提交观测</li>
          <li>连续7天不间断打卡</li>
          <li>挑战完成可获得环保社团认证</li>
        </ul>
      </div>
      
      <div class="active-challenge" v-if="activeChallenge">
        <h3>当前挑战</h3>
        <el-card>
          <div class="challenge-info">
            <div class="info-row">
              <span class="label">开始时间:</span>
              <span>{{ activeChallenge.startDate }}</span>
            </div>
            <div class="info-row">
              <span class="label">位置:</span>
              <span>{{ activeChallenge.latitude?.toFixed?.(4) }}, {{ activeChallenge.longitude?.toFixed?.(4) }}</span>
            </div>
            <div class="info-row" v-if="activeChallenge.daysLeft !== undefined">
              <span class="label">剩余天数:</span>
              <span class="days-left">{{ activeChallenge.daysLeft }} 天</span>
            </div>
            
            <div class="progress-bar">
              <div class="progress" :style="{ width: (activeChallenge.streakDays / 7 * 100) + '%' }"></div>
              <span class="progress-text">{{ activeChallenge.streakDays }} / 7 天</span>
            </div>
            
            <div class="action-buttons">
              <el-button type="primary" size="large" @click="handleCheckin">
                📍 今日打卡
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
      
      <div class="start-challenge" v-else>
        <el-card>
          <h3>开始新挑战</h3>
          <p style="color: #666; margin-bottom: 20px">在下方地图上选择您要挑战的位置</p>
          
          <div class="mini-map" ref="mapRef"></div>
          
          <div class="location-info" v-if="selectedLocation">
            已选择位置: {{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lng.toFixed(6) }}
          </div>
          
          <el-button 
            type="primary" 
            size="large" 
            :disabled="!selectedLocation"
            :loading="starting"
            @click="startChallenge"
            style="margin-top: 16px; width: 200px"
          >
            🚀 开始7天挑战
          </el-button>
        </el-card>
      </div>
      
      <div class="history">
        <h3>历史挑战</h3>
        <el-table :data="challenges" stripe v-loading="loading">
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" effect="dark">
                {{ statusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始日期" width="140" />
          <el-table-column prop="endDate" label="结束日期" width="140" />
          <el-table-column label="进度" width="120">
            <template #default="{ row }">
              {{ row.streakDays }} / {{ row.totalDays }}
            </template>
          </el-table-column>
          <el-table-column label="位置">
            <template #default="{ row }">
              {{ row.latitude?.toFixed?.(4) }}, {{ row.longitude?.toFixed?.(4) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <el-dialog v-model="checkinDialog" title="今日打卡 - 提交观测" width="500px">
      <el-form :model="checkinForm" :rules="checkinRules" ref="checkinFormRef" label-width="100px">
        <el-form-item label="位置">
          <div v-if="activeChallenge">
            {{ activeChallenge.latitude?.toFixed?.(6) }}, {{ activeChallenge.longitude?.toFixed?.(6) }}
          </div>
        </el-form-item>
        <el-form-item label="目视星等" prop="magnitude">
          <el-radio-group v-model="checkinForm.magnitude">
            <el-radio-button :value="1">1等</el-radio-button>
            <el-radio-button :value="2">2等</el-radio-button>
            <el-radio-button :value="3">3等</el-radio-button>
            <el-radio-button :value="4">4等</el-radio-button>
            <el-radio-button :value="5">5等</el-radio-button>
            <el-radio-button :value="6">6等</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="天气">
          <el-select v-model="checkinForm.weather" placeholder="请选择" clearable>
            <el-option label="晴朗" value="晴朗" />
            <el-option label="少云" value="少云" />
            <el-option label="多云" value="多云" />
            <el-option label="阴天" value="阴天" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="checkinForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkinDialog = false">取消</el-button>
        <el-button type="primary" :loading="checkingIn" @click="doCheckin">提交打卡</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import L from 'leaflet'
import { challengeApi } from '@/api'

const router = useRouter()
const mapRef = ref(null)
const checkinFormRef = ref()

const loading = ref(false)
const starting = ref(false)
const checkingIn = ref(false)
const checkinDialog = ref(false)

const challenges = ref([])
const activeChallenge = ref(null)
const selectedLocation = ref(null)

let map = null
let startMarker = null

const checkinForm = reactive({
  magnitude: 3,
  weather: '',
  description: ''
})

const checkinRules = {
  magnitude: [{ required: true, message: '请选择目视星等', trigger: 'change' }]
}

const statusType = (status) => {
  if (status === 'COMPLETED') return 'success'
  if (status === 'FAILED') return 'danger'
  return 'warning'
}

const statusText = (status) => {
  if (status === 'COMPLETED') return '已完成'
  if (status === 'FAILED') return '失败'
  if (status === 'ACTIVE') return '进行中'
  return status
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await challengeApi.getUserChallenges()
    challenges.value = res.data.data
    activeChallenge.value = challenges.value.find(c => c.status === 'ACTIVE') || null
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
  
  if (!activeChallenge.value) {
    nextTick(() => initMap())
  }
})

const initMap = () => {
  if (!mapRef.value) return
  
  map = L.map(mapRef.value).setView([39.9042, 116.4074], 11)
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map)
  
  map.on('click', (e) => {
    selectedLocation.value = e.latlng
    
    if (startMarker) {
      map.removeLayer(startMarker)
    }
    
    startMarker = L.marker(e.latlng).addTo(map)
  })
}

const startChallenge = async () => {
  if (!selectedLocation.value) return
  
  starting.value = true
  try {
    await challengeApi.start({
      latitude: selectedLocation.value.lat,
      longitude: selectedLocation.value.lng
    })
    
    ElMessage.success('挑战已开始！')
    const res = await challengeApi.getUserChallenges()
    challenges.value = res.data.data
    activeChallenge.value = challenges.value.find(c => c.status === 'ACTIVE') || null
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '开始挑战失败')
  } finally {
    starting.value = false
  }
}

const handleCheckin = () => {
  checkinForm.magnitude = 3
  checkinForm.weather = ''
  checkinForm.description = ''
  checkinDialog.value = true
}

const doCheckin = async () => {
  try {
    await checkinFormRef.value.validate()
    checkingIn.value = true
    
    const payload = {
      latitude: activeChallenge.value.latitude,
      longitude: activeChallenge.value.longitude,
      magnitude: checkinForm.magnitude,
      weather: checkinForm.weather || undefined,
      description: checkinForm.description || undefined
    }
    
    const res = await challengeApi.checkin(payload)
    const data = res.data.data
    
    ElMessage.success(data.message || '打卡成功')
    checkinDialog.value = false
    
    if (data.completed) {
      ElMessage({
        message: '🎉 恭喜完成暗夜挑战！',
        type: 'success',
        duration: 5000
      })
    }
    
    const userRes = await challengeApi.getUserChallenges()
    challenges.value = userRes.data.data
    activeChallenge.value = challenges.value.find(c => c.status === 'ACTIVE') || null
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '打卡失败')
  } finally {
    checkingIn.value = false
  }
}
</script>

<style scoped>
.challenges-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
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

.title {
  font-size: 18px;
  font-weight: bold;
}

.content {
  flex: 1;
  padding: 24px;
  overflow: auto;
}

.intro-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.intro-card h2 {
  margin-bottom: 12px;
}

.intro-card ul {
  margin-top: 12px;
  padding-left: 24px;
}

.intro-card li {
  margin: 6px 0;
}

.active-challenge, .start-challenge, .history {
  margin-bottom: 24px;
}

.active-challenge h3, .start-challenge h3, .history h3 {
  margin-bottom: 16px;
  color: #333;
}

.challenge-info {
  padding: 8px 0;
}

.info-row {
  margin-bottom: 16px;
}

.info-row .label {
  color: #666;
  margin-right: 8px;
}

.days-left {
  color: #e6a23c;
  font-weight: bold;
}

.progress-bar {
  height: 24px;
  background: #ebeef5;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  margin: 20px 0;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #67c23a, #409eff);
  border-radius: 12px;
  transition: width 0.3s;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 13px;
  font-weight: bold;
  color: #333;
}

.action-buttons {
  text-align: center;
}

.mini-map {
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
}

.location-info {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9eb;
  border-radius: 8px;
  color: #67c23a;
}
</style>
