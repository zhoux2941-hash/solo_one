<template>
  <div class="director-container">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button type="text" @click="goBack" style="color: white">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span class="title">导演工作台 - 发布通告</span>
        </div>
        <div class="header-right">
          <span>{{ user?.name }}</span>
          <el-tag type="danger" size="small" style="margin-left: 10px">导演</el-tag>
        </div>
      </el-header>
      <el-main>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-title">
                  <el-icon><Edit /></el-icon>
                  创建新通告
                </div>
              </template>
              <el-form :model="noticeForm" :rules="rules" ref="noticeFormRef" label-width="120px">
                <el-form-item label="拍摄日期" prop="noticeDate">
                  <el-date-picker
                    v-model="noticeForm.noticeDate"
                    type="date"
                    placeholder="选择拍摄日期"
                    style="width: 100%"
                    :disabled-date="disabledDate"
                  />
                </el-form-item>
                <el-form-item label="拍摄地点">
                  <el-input v-model="location" placeholder="例如：Beijing、Shanghai">
                    <template #prefix>
                      <el-icon><Location /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="场景名称" prop="sceneName">
                  <el-input v-model="noticeForm.sceneName" placeholder="例如：咖啡厅内景" />
                </el-form-item>
                <el-form-item label="拍摄时间" prop="timeRange">
                  <el-time-picker
                    v-model="noticeForm.timeRange"
                    is-range
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    style="width: 100%"
                    format="HH:mm"
                    value-format="HH:mm"
                  />
                </el-form-item>
                <el-form-item label="参演演员" prop="actorIds">
                  <el-select
                    v-model="noticeForm.actorIds"
                    multiple
                    filterable
                    placeholder="请选择演员（可多选）"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="actor in actors"
                      :key="actor.id"
                      :label="actor.name"
                      :value="actor.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="服装要求">
                  <el-input
                    v-model="noticeForm.costumeRequirement"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入服装要求（可选）"
                  />
                </el-form-item>
                <el-form-item label="道具要求">
                  <el-input
                    v-model="noticeForm.propRequirement"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入道具要求（可选）"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="submitNotice" :loading="submitting" style="width: 100%">
                    提交通告
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card v-if="weather" class="weather-card">
              <template #header>
                <div class="card-title">
                  <el-icon><Sunny /></el-icon>
                  天气预报（{{ weather.location }}）
                  <el-button type="primary" link size="small" style="margin-left: auto" @click="loadWeather">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
              </template>
              <div class="weather-content">
                <div class="weather-main">
                  <span class="weather-temp">{{ weather.temperature }}</span>
                  <span class="weather-desc">{{ weather.weatherDesc }}</span>
                </div>
                <div class="weather-details">
                  <div class="weather-item">
                    <el-icon><Thermometer /></el-icon>
                    <span>体感：{{ weather.feelsLike }}</span>
                  </div>
                  <div class="weather-item">
                    <el-icon><Drop /></el-icon>
                    <span>湿度：{{ weather.humidity }}</span>
                  </div>
                  <div class="weather-item">
                    <el-icon><Wind /></el-icon>
                    <span>风速：{{ weather.windSpeed }}</span>
                  </div>
                </div>
              </div>
            </el-card>
            
            <el-card style="margin-top: 20px">
              <template #header>
                <div class="card-title">
                  <el-icon><Calendar /></el-icon>
                  已发布通告
                  <el-date-picker
                    v-model="selectedDate"
                    type="date"
                    placeholder="选择日期查看"
                    style="margin-left: 20px; width: 180px"
                    size="small"
                    @change="onDateChange"
                  />
                  <el-input
                    v-model="location"
                    placeholder="地点"
                    style="margin-left: 10px; width: 120px"
                    size="small"
                  />
                  <el-button
                    type="success"
                    size="small"
                    style="margin-left: 10px"
                    :loading="exporting"
                    @click="handleExportPdf"
                  >
                    <el-icon><Download /></el-icon>
                    导出PDF
                  </el-button>
                </div>
              </template>
              <div v-loading="loadingNotices" class="notice-list">
                <el-empty v-if="notices.length === 0" description="该日期暂无通告" />
                <el-timeline v-else>
                  <el-timeline-item
                    v-for="notice in notices"
                    :key="notice.id"
                    :timestamp="`${notice.startTime} - ${notice.endTime}`"
                    placement="top"
                  >
                    <el-card :class="{ 'materials-ready': notice.materialsReady }">
                      <h4>{{ notice.sceneName }}</h4>
                      <p style="color: #909399; margin: 5px 0">
                        演员：{{ notice.actors?.map(a => a.name).join('、') }}
                      </p>
                      <div v-if="notice.costumeRequirement" style="margin: 5px 0">
                        <el-tag size="small">服装</el-tag>
                        <span style="margin-left: 5px">{{ notice.costumeRequirement }}</span>
                      </div>
                      <div v-if="notice.propRequirement" style="margin: 5px 0">
                        <el-tag size="small" type="warning">道具</el-tag>
                        <span style="margin-left: 5px">{{ notice.propRequirement }}</span>
                      </div>
                      <div style="margin-top: 10px">
                        <el-tag :type="notice.materialsReady ? 'success' : 'info'" size="small">
                          {{ notice.materialsReady ? '✓ 物资已备齐' : '⏳ 物资待确认' }}
                        </el-tag>
                      </div>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, Edit, Calendar, Location, Sunny, Refresh, 
  Thermometer, Drop, Wind, Download 
} from '@element-plus/icons-vue'
import { getAllActors } from '../api/user'
import { createNotice, getNoticesByDate, getWeather, exportPdf } from '../api/notice'

const router = useRouter()

const user = computed(() => JSON.parse(localStorage.getItem('user') || 'null'))
const noticeFormRef = ref(null)
const submitting = ref(false)
const exporting = ref(false)
const loadingNotices = ref(false)
const actors = ref([])
const notices = ref([])
const selectedDate = ref(new Date())
const location = ref('Beijing')
const weather = ref(null)

const noticeForm = reactive({
  noticeDate: new Date(),
  sceneName: '',
  timeRange: [],
  actorIds: [],
  costumeRequirement: '',
  propRequirement: ''
})

const rules = {
  noticeDate: [{ required: true, message: '请选择拍摄日期', trigger: 'change' }],
  sceneName: [{ required: true, message: '请输入场景名称', trigger: 'blur' }],
  timeRange: [{ required: true, message: '请选择拍摄时间', trigger: 'change' }],
  actorIds: [{ required: true, type: 'array', message: '请至少选择一位演员', trigger: 'change' }]
}

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 86400000
}

const formatDate = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loadActors = async () => {
  try {
    actors.value = await getAllActors()
  } catch (error) {
    console.error('加载演员列表失败', error)
  }
}

const loadNotices = async () => {
  if (!selectedDate.value) return
  loadingNotices.value = true
  try {
    notices.value = await getNoticesByDate(formatDate(selectedDate.value))
  } catch (error) {
    console.error('加载通告列表失败', error)
  } finally {
    loadingNotices.value = false
  }
}

const loadWeather = async () => {
  try {
    weather.value = await getWeather(location.value, formatDate(selectedDate.value))
  } catch (error) {
    console.error('加载天气失败', error)
    weather.value = {
      location: location.value,
      temperature: '--',
      weatherDesc: '获取失败',
      feelsLike: '--',
      humidity: '--',
      windSpeed: '--',
      success: false
    }
  }
}

const onDateChange = () => {
  loadNotices()
  loadWeather()
}

const handleExportPdf = async () => {
  exporting.value = true
  try {
    const response = await exportPdf(formatDate(selectedDate.value), location.value)
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `通告单_${formatDate(selectedDate.value)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('PDF导出成功！')
  } catch (error) {
    console.error('导出PDF失败', error)
    ElMessage.error('导出PDF失败')
  } finally {
    exporting.value = false
  }
}

const submitNotice = async () => {
  const valid = await noticeFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const data = {
      noticeDate: formatDate(noticeForm.noticeDate),
      sceneName: noticeForm.sceneName,
      startTime: noticeForm.timeRange[0],
      endTime: noticeForm.timeRange[1],
      actorIds: noticeForm.actorIds,
      costumeRequirement: noticeForm.costumeRequirement || null,
      propRequirement: noticeForm.propRequirement || null
    }

    await createNotice(data)
    ElMessage.success('通告发布成功！')
    
    noticeForm.sceneName = ''
    noticeForm.timeRange = []
    noticeForm.actorIds = []
    noticeForm.costumeRequirement = ''
    noticeForm.propRequirement = ''
    
    selectedDate.value = noticeForm.noticeDate
    await loadNotices()
  } catch (error) {
    console.error('发布通告失败', error)
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.push('/dashboard')
}

onMounted(() => {
  loadActors()
  loadNotices()
  loadWeather()
})
</script>

<style scoped>
.director-container {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  margin-left: 20px;
  font-size: 18px;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  font-weight: bold;
  color: #303133;
}

.card-title .el-icon {
  margin-right: 8px;
}

.weather-card {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
}

.weather-content {
  padding: 10px 0;
}

.weather-main {
  display: flex;
  align-items: baseline;
  margin-bottom: 15px;
}

.weather-temp {
  font-size: 36px;
  font-weight: bold;
  color: #0284c7;
}

.weather-desc {
  font-size: 18px;
  color: #0369a1;
  margin-left: 15px;
}

.weather-details {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.weather-item {
  display: flex;
  align-items: center;
  color: #075985;
  font-size: 14px;
}

.weather-item .el-icon {
  margin-right: 5px;
}

.notice-list {
  max-height: 400px;
  overflow-y: auto;
}

.notice-list h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.materials-ready {
  border-left: 4px solid #67c23a;
}
</style>
