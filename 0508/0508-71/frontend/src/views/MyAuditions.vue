<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><Headset /></el-icon> 我的试音</span>
        </div>
      </template>
      
      <el-empty v-if="auditions.length === 0 && !loading" description="您还没有提交过试音" />
      
      <div v-else>
        <div
          v-for="audition in auditions"
          :key="audition.id"
          class="audition-item"
        >
          <div class="audition-header">
            <div class="audition-task">
              <span class="task-label">任务：</span>
              <span class="task-title" @click="goToTask(audition.taskId)">{{ audition.taskTitle }}</span>
            </div>
            <el-tag
              :type="audition.status === 1 ? 'success' : audition.status === 2 ? 'info' : 'warning'"
              size="large"
            >
              {{ audition.status === 1 ? '已中标' : audition.status === 2 ? '未中标' : '待审核' }}
            </el-tag>
          </div>
          <audio
            controls
            class="audio-player"
            :src="`/api/audio/${audition.audioPath}`"
          ></audio>
          <p v-if="audition.remark" class="audition-remark">
            <el-icon><ChatDotRound /></el-icon> {{ audition.remark }}
          </p>
          <div class="audition-footer">
            <span class="audition-time">提交时间：{{ formatTime(audition.createTime) }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyAuditions } from '@/api/audition'

const router = useRouter()

const auditions = ref([])
const loading = ref(false)

async function fetchAuditions() {
  loading.value = true
  try {
    const res = await getMyAuditions()
    auditions.value = res.data
  } finally {
    loading.value = false
  }
}

function goToTask(taskId) {
  router.push(`/task/${taskId}`)
}

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

onMounted(() => {
  fetchAuditions()
})
</script>

<style scoped>
.audition-item {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 20px;
}

.audition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.audition-task {
  display: flex;
  align-items: center;
}

.task-label {
  color: #909399;
}

.task-title {
  color: #409eff;
  cursor: pointer;
  margin-left: 5px;
  font-weight: 500;
}

.task-title:hover {
  text-decoration: underline;
}

.audition-remark {
  color: #909399;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.audition-footer {
  margin-top: 10px;
}

.audition-time {
  color: #c0c4cc;
  font-size: 13px;
}
</style>
