<template>
  <div class="page-container">
    <div class="card">
      <h2 class="card-title">我的考试</h2>
      
      <div v-if="exams.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-text">暂无考试</div>
      </div>
      
      <table v-else class="table">
        <thead>
          <tr>
            <th>考试名称</th>
            <th>描述</th>
            <th>时长</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exam in exams" :key="exam.id">
            <td>{{ exam.title }}</td>
            <td>{{ exam.description || '-' }}</td>
            <td>{{ exam.duration }} 分钟</td>
            <td>
              <span :class="['status-badge', `status-${exam.status.toLowerCase()}`]">
                {{ getStatusText(exam.status) }}
              </span>
            </td>
            <td>
              <button 
                v-if="exam.status === 'ACTIVE'"
                class="btn btn-primary btn-sm" 
                @click="startExam(exam)"
              >
                开始考试
              </button>
              <button 
                v-else-if="exam.status === 'COMPLETED'"
                class="btn btn-outline btn-sm"
                disabled
              >
                已完成
              </button>
              <span v-else class="status-badge status-draft">未开始</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/utils/axios'
import { useRouter } from 'vue-router'

const exams = ref([])
const router = useRouter()

function getStatusText(status) {
  const statusMap = {
    'DRAFT': '草稿',
    'ACTIVE': '进行中',
    'COMPLETED': '已完成'
  }
  return statusMap[status] || status
}

async function loadExams() {
  try {
    const response = await axios.get('/exam/list')
    if (response.code === 200) {
      exams.value = response.data
    }
  } catch (error) {
    console.error('Failed to load exams:', error)
  }
}

function startExam(exam) {
  router.push(`/student/exam/${exam.id}`)
}

onMounted(() => {
  loadExams()
})
</script>
