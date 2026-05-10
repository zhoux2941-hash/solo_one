<template>
  <div class="actor-container">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button type="text" @click="goBack" style="color: white">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span class="title">演员日程表</span>
        </div>
        <div class="header-right">
          <span>{{ user?.name }}</span>
          <el-tag type="success" size="small" style="margin-left: 10px">演员</el-tag>
        </div>
      </el-header>
      <el-main>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card>
              <template #header>
                <div class="card-title">
                  <el-icon><Calendar /></el-icon>
                  我的日程
                  <el-date-picker
                    v-model="selectedDate"
                    type="date"
                    placeholder="选择日期"
                    style="margin-left: 20px; width: 200px"
                    @change="loadMyNotices"
                  />
                  <el-button type="primary" @click="loadMyNotices" style="margin-left: 10px">
                    查看
                  </el-button>
                  <el-button @click="loadAllNotices" style="margin-left: 10px">
                    查看全部日程
                  </el-button>
                </div>
              </template>
              
              <div v-if="viewMode === 'single'">
                <div v-loading="loading" class="day-notices">
                  <el-empty v-if="dayNotices.length === 0" description="该日期暂无拍摄安排" />
                  <el-timeline v-else>
                    <el-timeline-item
                      v-for="notice in dayNotices"
                      :key="notice.id"
                      :timestamp="`${notice.startTime} - ${notice.endTime}`"
                      placement="top"
                      :type="notice.materialsReady ? 'success' : 'primary'"
                    >
                      <el-card :class="{ 'materials-ready': notice.materialsReady }">
                        <h4>{{ notice.sceneName }}</h4>
                        <div style="margin: 10px 0">
                          <el-tag :type="notice.materialsReady ? 'success' : 'info'" size="small">
                            {{ notice.materialsReady ? '✓ 物资已备齐' : '⏳ 物资待确认' }}
                          </el-tag>
                        </div>
                        <div v-if="notice.costumeRequirement" class="requirement-item">
                          <el-tag size="small">服装要求</el-tag>
                          <span class="requirement-text">{{ notice.costumeRequirement }}</span>
                        </div>
                        <div v-if="notice.propRequirement" class="requirement-item">
                          <el-tag size="small" type="warning">道具要求</el-tag>
                          <span class="requirement-text">{{ notice.propRequirement }}</span>
                        </div>
                        <div class="director-info" v-if="notice.director">
                          <el-icon><User /></el-icon>
                          <span>导演：{{ notice.director.name }}</span>
                        </div>
                      </el-card>
                    </el-timeline-item>
                  </el-timeline>
                </div>
              </div>
              
              <div v-else>
                <div v-loading="loading" class="all-notices">
                  <el-empty v-if="Object.keys(allNotices).length === 0" description="暂无拍摄安排" />
                  <div v-else>
                    <div v-for="(notices, date) in sortedAllNotices" :key="date" class="date-group">
                      <h3 class="date-header">
                        <el-icon><DatePicker /></el-icon>
                        {{ formatDisplayDate(date) }}
                        <el-tag v-if="hasConflict(notices)" type="danger" size="small" style="margin-left: 10px">
                          ⚠️ 时间冲突
                        </el-tag>
                      </h3>
                      <el-timeline>
                        <el-timeline-item
                          v-for="notice in notices"
                          :key="notice.id"
                          :timestamp="`${notice.startTime} - ${notice.endTime}`"
                          placement="top"
                          :type="notice.materialsReady ? 'success' : 'primary'"
                        >
                          <el-card :class="{ 'materials-ready': notice.materialsReady }">
                            <h5>{{ notice.sceneName }}</h5>
                            <div style="margin: 8px 0">
                              <el-tag :type="notice.materialsReady ? 'success' : 'info'" size="small">
                                {{ notice.materialsReady ? '✓ 物资已备齐' : '⏳ 物资待确认' }}
                              </el-tag>
                            </div>
                            <div v-if="notice.costumeRequirement" class="requirement-item">
                              <el-tag size="small">服装</el-tag>
                              <span class="requirement-text">{{ notice.costumeRequirement }}</span>
                            </div>
                            <div v-if="notice.propRequirement" class="requirement-item">
                              <el-tag size="small" type="warning">道具</el-tag>
                              <span class="requirement-text">{{ notice.propRequirement }}</span>
                            </div>
                          </el-card>
                        </el-timeline-item>
                      </el-timeline>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Calendar, User, DatePicker } from '@element-plus/icons-vue'
import { getMyNotices } from '../api/notice'

const router = useRouter()

const user = computed(() => JSON.parse(localStorage.getItem('user') || 'null'))
const loading = ref(false)
const selectedDate = ref(new Date())
const viewMode = ref('single')
const dayNotices = ref([])
const allNotices = ref({})

const formatDate = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDisplayDate = (dateStr) => {
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日 ${weekday}`
}

const sortedAllNotices = computed(() => {
  const sorted = {}
  const dates = Object.keys(allNotices.value).sort()
  dates.forEach(date => {
    sorted[date] = allNotices.value[date]
  })
  return sorted
})

const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

const hasConflict = (notices) => {
  if (!notices || notices.length < 2) return false
  const sorted = [...notices].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
  for (let i = 1; i < sorted.length; i++) {
    if (parseTime(sorted[i].startTime) < parseTime(sorted[i-1].endTime)) {
      return true
    }
  }
  return false
}

const loadMyNotices = async () => {
  viewMode.value = 'single'
  if (!selectedDate.value) return
  
  loading.value = true
  try {
    dayNotices.value = await getMyNotices(formatDate(selectedDate.value))
  } catch (error) {
    console.error('加载日程失败', error)
  } finally {
    loading.value = false
  }
}

const loadAllNotices = async () => {
  viewMode.value = 'all'
  loading.value = true
  try {
    allNotices.value = await getMyNotices()
  } catch (error) {
    console.error('加载全部日程失败', error)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/dashboard')
}

onMounted(() => {
  loadMyNotices()
})
</script>

<style scoped>
.actor-container {
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

.day-notices, .all-notices {
  min-height: 400px;
}

.date-group {
  margin-bottom: 30px;
}

.date-header {
  display: flex;
  align-items: center;
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.date-header .el-icon {
  margin-right: 8px;
}

.requirement-item {
  display: flex;
  align-items: flex-start;
  margin: 8px 0;
}

.requirement-text {
  margin-left: 10px;
  color: #606266;
  flex: 1;
}

.director-info {
  display: flex;
  align-items: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
  color: #909399;
  font-size: 13px;
}

.director-info .el-icon {
  margin-right: 5px;
}

.materials-ready {
  border-left: 4px solid #67c23a;
}

h4, h5 {
  margin: 0 0 10px 0;
  color: #303133;
}
</style>