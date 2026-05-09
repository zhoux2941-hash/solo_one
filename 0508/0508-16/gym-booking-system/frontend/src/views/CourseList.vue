<template>
  <div class="course-list">
    <el-card class="page-header-card">
      <div class="page-header">
        <h2>课程列表</h2>
        <p>选择您想预约的课程，开课前30分钟可签到</p>
      </div>
    </el-card>
    
    <el-card v-if="recommendations.length > 0" class="recommendation-card">
      <template #header>
        <div class="recommendation-header">
          <div class="header-left">
            <el-icon :size="20" class="heart-icon"><Star /></el-icon>
            <span>猜你喜欢</span>
            <el-tag size="small" type="success">智能推荐</el-tag>
          </div>
          <span class="recommendation-desc">基于您的历史预约偏好，为您精选以下课程</span>
        </div>
      </template>
      
      <el-row :gutter="16">
        <el-col 
          :xs="24" 
          :sm="12" 
          :md="8" 
          :lg="4" 
          v-for="rec in recommendations" 
          :key="rec.courseId"
        >
          <el-card class="rec-course-card" shadow="hover">
            <div class="rec-course-header">
              <div class="rec-course-icon" :class="getCourseIconClass(rec.courseName)">
                <el-icon :size="24">{{ getCourseIcon(rec.courseName) }}</el-icon>
              </div>
              <div class="rec-course-title">
                <h4>{{ rec.courseName }}</h4>
                <p class="coach">{{ rec.coachName }}</p>
              </div>
            </div>
            
            <div class="rec-reason">
              <el-icon><MagicStick /></el-icon>
              <span>{{ rec.reason }}</span>
            </div>
            
            <div class="rec-course-info">
              <span class="info-badge">
                <el-icon><Calendar /></el-icon>
                {{ formatShortDate(rec.startTime) }}
              </span>
              <span class="info-badge">
                <el-icon><Clock /></el-icon>
                {{ formatTime(rec.startTime) }}
              </span>
              <span class="info-badge remaining" :class="{ 'full': rec.remaining === 0 }">
                剩余 {{ rec.remaining }} 个名额
              </span>
            </div>
            
            <div class="rec-course-footer">
              <div class="score-display">
                <el-rate 
                  v-model="rec.scoreDisplay" 
                  disabled 
                  show-score 
                  text-color="#ff9900"
                  :max="5"
                />
                <span class="score-text">匹配度 {{ rec.score * 5 }}/5</span>
              </div>
              <el-button 
                type="primary" 
                size="small"
                @click="bookRecommendation(rec)"
                :disabled="rec.remaining === 0"
              >
                {{ rec.remaining > 0 ? '立即预约' : '已满员' }}
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
    
    <el-divider />
    
    <el-card class="section-header-card">
      <div class="section-header">
        <h3>全部课程</h3>
      </div>
    </el-card>
    
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="course in courses" :key="course.courseId">
        <el-card class="course-card" shadow="hover">
          <div class="course-header">
            <div class="course-icon" :class="getCourseIconClass(course.name)">
              <el-icon :size="32">{{ getCourseIcon(course.name) }}</el-icon>
            </div>
            <div class="course-title">
              <h3>{{ course.name }}</h3>
              <p class="coach">{{ course.coachName }}</p>
            </div>
          </div>
          
          <el-divider />
          
          <div class="course-info">
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDate(course.startTime) }}</span>
            </div>
            <div class="info-item">
              <el-icon><Clock /></el-icon>
              <span>{{ formatTime(course.startTime) }} - {{ formatTime(course.endTime) }}</span>
            </div>
            <div class="info-item">
              <el-icon><User /></el-icon>
              <span>容量: {{ course.capacity }} 人</span>
            </div>
            <div class="info-item capacity">
              <el-icon><Tickets /></el-icon>
              <span :class="{ 'full': course.remaining === 0 }">
                剩余: {{ course.remaining }} 个名额
              </span>
            </div>
          </div>
          
          <el-divider />
          
          <div class="course-desc">
            <p>{{ course.description || '暂无描述' }}</p>
          </div>
          
          <div class="course-actions">
            <el-button 
              v-if="!course.isBooked && course.remaining > 0"
              type="primary" 
              @click="bookCourse(course)"
              :loading="course.bookLoading"
            >
              立即预约
            </el-button>
            <el-button 
              v-else-if="course.isBooked && !course.isCheckedIn"
              type="success" 
              @click="checkIn(course)"
              :loading="course.checkinLoading"
              :disabled="!canCheckIn(course)"
            >
              {{ canCheckIn(course) ? '立即签到' : '签到未开始' }}
            </el-button>
            <el-button 
              v-else-if="course.isBooked && course.isCheckedIn"
              type="success" 
              disabled
            >
              已签到
            </el-button>
            <el-button 
              v-else
              type="info" 
              disabled
            >
              已满员
            </el-button>
            <el-button 
              v-if="course.isBooked && !course.isCheckedIn"
              type="danger" 
              size="small"
              plain
              @click="cancelBooking(course)"
              :loading="course.cancelLoading"
            >
              取消
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-empty v-if="courses.length === 0" description="暂无课程" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Clock, User, Tickets, Timer, VideoCamera, Dumbbell, Sunset, Star, MagicStick } from '@element-plus/icons-vue'
import { courseApi, bookingApi, recommendationApi } from '../utils/api'

const courses = ref([])
const recommendations = ref([])
const currentUser = { id: 1, name: '会员张三' }

const getCourseIcon = (name) => {
  if (name.includes('瑜伽')) return VideoCamera
  if (name.includes('单车')) return Timer
  if (name.includes('普拉提')) return Dumbbell
  if (name.includes('HIIT')) return Sunset
  return Timer
}

const getCourseIconClass = (name) => {
  if (name.includes('瑜伽')) return 'yoga'
  if (name.includes('单车')) return 'cycling'
  if (name.includes('普拉提')) return 'pilates'
  if (name.includes('HIIT')) return 'hiit'
  return 'default'
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const options = { month: 'long', day: 'numeric', weekday: 'long' }
  return date.toLocaleDateString('zh-CN', options)
}

const formatShortDate = (dateStr) => {
  const date = new Date(dateStr)
  const options = { month: 'short', day: 'numeric', weekday: 'short' }
  return date.toLocaleDateString('zh-CN', options)
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const canCheckIn = (course) => {
  const now = new Date()
  const courseStart = new Date(course.startTime)
  const checkInStart = new Date(courseStart.getTime() - 30 * 60 * 1000)
  return now >= checkInStart && now <= courseStart
}

const loadRecommendations = async () => {
  try {
    const data = await recommendationApi.getForUser(currentUser.id, 6)
    recommendations.value = data.map(rec => ({
      ...rec,
      scoreDisplay: Math.round(rec.score * 5)
    }))
    console.log('推荐数据:', recommendations.value)
  } catch (error) {
    console.warn('加载推荐失败:', error)
    recommendations.value = []
  }
}

const loadCourses = async () => {
  try {
    const data = await courseApi.getAll()
    courses.value = data
    
    for (const course of courses.value) {
      course.bookLoading = false
      course.checkinLoading = false
      course.cancelLoading = false
      
      try {
        const remaining = await courseApi.getRemaining(course.courseId)
        course.remaining = remaining.remaining
      } catch {
        course.remaining = course.capacity
      }
      
      try {
        const booking = await bookingApi.getByUserAndCourse(currentUser.id, course.courseId)
        course.isBooked = true
        course.bookingId = booking.bookingId
        course.isCheckedIn = booking.status === 'CHECKED_IN'
      } catch {
        course.isBooked = false
        course.isCheckedIn = false
      }
    }
  } catch (error) {
    ElMessage.error('加载课程失败')
    console.error(error)
  }
}

const bookCourse = async (course) => {
  course.bookLoading = true
  try {
    const result = await bookingApi.book({
      userId: currentUser.id,
      userName: currentUser.name,
      courseId: course.courseId
    })
    
    if (result.success) {
      ElMessage.success('预约请求已提交，正在处理中...')
      course.isBooked = true
      course.remaining--
      course.pendingBooking = true
      course.messageId = result.messageId
      
      setTimeout(async () => {
        await loadCourses()
        await loadRecommendations()
      }, 2000)
    } else {
      ElMessage.error('预约失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '预约失败')
  } finally {
    course.bookLoading = false
  }
}

const bookRecommendation = async (rec) => {
  try {
    const result = await bookingApi.book({
      userId: currentUser.id,
      userName: currentUser.name,
      courseId: rec.courseId
    })
    
    if (result.success) {
      ElMessage.success('预约成功！')
      rec.remaining--
      await loadCourses()
      await loadRecommendations()
    } else {
      ElMessage.error('预约失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '预约失败')
  }
}

const checkIn = async (course) => {
  course.checkinLoading = true
  try {
    await bookingApi.checkin(course.bookingId)
    ElMessage.success('签到成功！')
    course.isCheckedIn = true
    await loadCourses()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '签到失败')
  } finally {
    course.checkinLoading = false
  }
}

const cancelBooking = async (course) => {
  try {
    await ElMessageBox.confirm('确定要取消这个预约吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    course.cancelLoading = true
    await bookingApi.cancel(course.bookingId)
    ElMessage.success('取消预约成功')
    course.isBooked = false
    course.remaining++
    await loadCourses()
    await loadRecommendations()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '取消失败')
    }
  } finally {
    course.cancelLoading = false
  }
}

onMounted(() => {
  loadRecommendations()
  loadCourses()
})
</script>

<style scoped>
.course-list {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 12px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.recommendation-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.recommendation-card :deep(.el-card__header) {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.recommendation-card :deep(.el-card__body) {
  background: transparent;
}

.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.heart-icon {
  color: #ff6b9d;
}

.recommendation-desc {
  font-size: 13px;
  opacity: 0.9;
}

.rec-course-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
}

.rec-course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.rec-course-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rec-course-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.rec-course-icon.yoga {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.rec-course-icon.cycling {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.rec-course-icon.pilates {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.rec-course-icon.hiit {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.rec-course-title h4 {
  margin: 0 0 2px 0;
  color: #303133;
  font-size: 15px;
}

.rec-course-title .coach {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.rec-reason {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #c2410c;
}

.rec-reason .el-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.rec-course-info {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: #f0f2f5;
  border-radius: 12px;
  font-size: 11px;
  color: #606266;
}

.info-badge.remaining {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #059669;
  font-weight: 500;
}

.info-badge.remaining.full {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
}

.rec-course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.score-text {
  font-size: 11px;
  color: #ff9900;
  margin-top: 2px;
}

.section-header-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 12px;
}

.section-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.course-card {
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.course-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.course-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.course-icon.yoga {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.course-icon.cycling {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.course-icon.pilates {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.course-icon.hiit {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.course-title h3 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 18px;
}

.course-title .coach {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.course-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 13px;
}

.info-item .el-icon {
  color: #409eff;
}

.info-item.capacity span {
  font-weight: 500;
}

.info-item.capacity span.full {
  color: #f56c6c;
}

.course-desc {
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}

.course-desc p {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.course-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.course-actions .el-button {
  flex: 1;
}
</style>
