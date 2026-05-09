<template>
  <div class="page-container">
    <div class="card">
      <div class="flex justify-between items-center mb-24">
        <h2 class="card-title" style="margin: 0;">考试管理</h2>
        <button class="btn btn-primary" @click="createNewExam">
          + 创建考试
        </button>
      </div>
      
      <div v-if="exams.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <div class="empty-text">暂无考试，点击上方按钮创建</div>
      </div>
      
      <table v-else class="table">
        <thead>
          <tr>
            <th>考试名称</th>
            <th>描述</th>
            <th>时长</th>
            <th>状态</th>
            <th>创建时间</th>
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
            <td>{{ formatDate(exam.createdAt) }}</td>
            <td>
              <div class="flex gap-12">
                <button 
                  class="btn btn-outline btn-sm" 
                  @click="manageQuestions(exam)"
                >
                  题目管理
                </button>
                <button 
                  v-if="exam.status === 'DRAFT'"
                  class="btn btn-success btn-sm" 
                  @click="startExam(exam)"
                >
                  开始考试
                </button>
                <button 
                  v-if="exam.status === 'ACTIVE'"
                  class="btn btn-warning btn-sm" 
                  @click="endExam(exam)"
                >
                  结束考试
                </button>
                <button 
                  class="btn btn-primary btn-sm" 
                  @click="viewReport(exam)"
                >
                  查看报告
                </button>
              </div>
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
import { useUserStore } from '@/stores/user'

const exams = ref([])
const router = useRouter()
const userStore = useUserStore()

function getStatusText(status) {
  const statusMap = {
    'DRAFT': '草稿',
    'ACTIVE': '进行中',
    'COMPLETED': '已完成'
  }
  return statusMap[status] || status
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

async function loadExams() {
  try {
    const response = await axios.get('/exam/list', {
      params: { createdBy: userStore.currentUser?.id }
    })
    if (response.code === 200) {
      exams.value = response.data
    }
  } catch (error) {
    console.error('Failed to load exams:', error)
  }
}

function createNewExam() {
  router.push('/teacher/exam/0/create')
}

function manageQuestions(exam) {
  router.push(`/teacher/exam/${exam.id}/questions`)
}

async function startExam(exam) {
  try {
    const response = await axios.put(`/exam/${exam.id}/status`, { status: 'ACTIVE' })
    if (response.code === 200) {
      loadExams()
    }
  } catch (error) {
    console.error('Failed to start exam:', error)
  }
}

async function endExam(exam) {
  try {
    const response = await axios.put(`/exam/${exam.id}/status`, { status: 'COMPLETED' })
    if (response.code === 200) {
      loadExams()
    }
  } catch (error) {
    console.error('Failed to end exam:', error)
  }
}

function viewReport(exam) {
  router.push(`/teacher/report/${exam.id}`)
}

onMounted(() => {
  loadExams()
})
</script>
