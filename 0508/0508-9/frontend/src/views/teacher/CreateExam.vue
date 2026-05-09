<template>
  <div class="page-container">
    <div class="card">
      <h2 class="card-title">{{ examId === '0' ? '创建新考试' : '编辑考试' }}</h2>
      
      <form @submit.prevent="saveExam">
        <div class="form-group">
          <label class="form-label">考试名称 *</label>
          <input 
            type="text" 
            v-model="examForm.title" 
            class="form-input" 
            placeholder="请输入考试名称"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">考试描述</label>
          <textarea 
            v-model="examForm.description" 
            class="form-textarea" 
            placeholder="请输入考试描述"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">考试时长（分钟）*</label>
          <input 
            type="number" 
            v-model.number="examForm.duration" 
            class="form-input" 
            placeholder="请输入考试时长"
            min="1"
            required
          />
        </div>
        
        <div class="flex gap-12">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
          <button type="button" class="btn btn-outline" @click="goBack">
            返回
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/utils/axios'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const examId = route.params.examId
const saving = ref(false)

const examForm = ref({
  title: '',
  description: '',
  duration: 60,
  createdBy: userStore.currentUser?.id,
  status: 'DRAFT'
})

async function loadExam() {
  if (examId === '0') return
  
  try {
    const response = await axios.get(`/exam/${examId}`)
    if (response.code === 200) {
      examForm.value = {
        ...response.data,
        createdBy: response.data.createdBy || userStore.currentUser?.id
      }
    }
  } catch (error) {
    console.error('Failed to load exam:', error)
  }
}

async function saveExam() {
  saving.value = true
  
  try {
    let response
    if (examId === '0') {
      response = await axios.post('/exam/create', examForm.value)
    } else {
      response = await axios.put(`/exam/${examId}`, examForm.value)
    }
    
    if (response.code === 200) {
      const savedExamId = response.data.id
      router.push(`/teacher/exam/${savedExamId}/questions`)
    }
  } catch (error) {
    console.error('Failed to save exam:', error)
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push('/teacher/exams')
}

onMounted(() => {
  loadExam()
})
</script>
