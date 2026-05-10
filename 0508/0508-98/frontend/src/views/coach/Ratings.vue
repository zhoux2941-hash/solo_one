<template>
  <div class="coach-ratings">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>评分记录</span>
        </div>
      </template>
      <el-timeline v-if="ratings.length">
        <el-timeline-item
          v-for="rating in ratings"
          :key="rating.id"
          :timestamp="formatTime(rating.create_time)"
          placement="top"
        >
          <el-card class="rating-card">
            <div class="rating-header">
              <span class="student-name">{{ rating.student_name }}</span>
              <el-rate :model-value="rating.score" disabled />
            </div>
            <div class="rating-info">
              <el-tag size="small">课程时间：{{ rating.booking_date }} {{ rating.start_hour }}:00</el-tag>
            </div>
            <div class="rating-content" v-if="rating.comment">
              {{ rating.comment }}
            </div>
            <div class="rating-content no-comment" v-else>
              该学员未留下评语
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="!loading && !ratings.length" description="暂无评分记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const ratings = ref([])
const loading = ref(false)

const loadRatings = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/coach/manage/ratings',
      method: 'get'
    })
    ratings.value = res.data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  loadRatings()
})
</script>

<style scoped>
.coach-ratings {
  padding: 20px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.rating-card {
  margin-bottom: 10px;
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.student-name {
  font-weight: bold;
  color: #303133;
}

.rating-info {
  margin-bottom: 10px;
}

.rating-content {
  color: #606266;
  line-height: 1.6;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.rating-content.no-comment {
  color: #c0c4cc;
  font-style: italic;
}
</style>