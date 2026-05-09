<template>
  <div class="page-container exam-container">
    <transition name="fade">
      <div v-if="showWarning" class="monitor-alert">
        <div class="monitor-alert-title">⚠️ 异常行为检测</div>
        <div class="monitor-alert-content">{{ lastWarning }}</div>
        <div class="monitor-alert-count">警告次数: {{ warningCount }}</div>
      </div>
    </transition>

    <div v-if="exam" class="card">
      <div class="exam-header">
        <h1 class="exam-title">{{ exam.title }}</h1>
        <div class="exam-timer">⏱️ {{ formatTime(remainingTime) }}</div>
      </div>
      
      <div class="exam-warning">
        <strong>⚠️ 重要提示：</strong> 考试过程中请勿切出窗口、复制粘贴、右键点击或使用快捷键，
        这些行为将被系统监控并记录。警告次数过多可能导致成绩无效。
      </div>

      <div class="question-card" v-for="(question, index) in questions" :key="question.id">
        <span class="question-number">第 {{ index + 1 }} 题</span>
        <span class="question-type">{{ question.type === 'SINGLE' ? '单选题' : '多选题' }}</span>
        <div class="question-text">{{ question.questionText }}</div>
        
        <div class="option-list">
          <div 
            v-for="(option, optIndex) in parsedOptions(question.options)" 
            :key="optIndex"
            :class="['option-item', { selected: isSelected(question.id, optIndex) }]"
            @click="selectOption(question, optIndex)"
          >
            <div class="option-radio" v-if="question.type === 'SINGLE'">
              <div v-if="isSelected(question.id, optIndex)" class="option-radio-inner"></div>
            </div>
            <div class="option-checkbox" v-else>
              <span v-if="isSelected(question.id, optIndex)">✓</span>
            </div>
            <div class="option-content">{{ option.label }}. {{ option.text }}</div>
          </div>
        </div>
      </div>

      <div class="text-center" style="margin-top: 32px;">
        <button class="btn btn-primary" @click="submitExam" :disabled="submitting">
          {{ submitting ? '提交中...' : '提交试卷' }}
        </button>
      </div>
    </div>

    <div v-else class="card">
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">加载考试中...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/utils/axios'
import { useUserStore } from '@/stores/user'
import { useCheatMonitor } from '@/composables/useCheatMonitor'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const examId = route.params.examId
const exam = ref(null)
const questions = ref([])
const answers = ref({})
const remainingTime = ref(0)
const submitting = ref(false)
const timer = ref(null)

const userStoreData = useUserStore()

const {
  warningCount,
  showWarning,
  lastWarning,
  reportCheat,
  stopMonitoring
} = useCheatMonitor({
  examId: Number(examId),
  userId: userStoreData.currentUser?.id,
  onCheatDetected: (log) => {
    const currentQuestion = getCurrentQuestionId()
    if (currentQuestion && !log.questionId) {
      log.questionId = currentQuestion
    }
  }
})

function getCurrentQuestionId() {
  if (questions.value.length > 0) {
    return questions.value[0]?.id
  }
  return null
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function parsedOptions(options) {
  try {
    return JSON.parse(options)
  } catch {
    return []
  }
}

function isSelected(questionId, optionIndex) {
  const selected = answers.value[questionId]
  if (Array.isArray(selected)) {
    return selected.includes(optionIndex)
  }
  return selected === optionIndex
}

function selectOption(question, optionIndex) {
  if (question.type === 'SINGLE') {
    answers.value[question.id] = optionIndex
  } else {
    if (!answers.value[question.id]) {
      answers.value[question.id] = []
    }
    const idx = answers.value[question.id].indexOf(optionIndex)
    if (idx > -1) {
      answers.value[question.id].splice(idx, 1)
    } else {
      answers.value[question.id].push(optionIndex)
    }
  }
}

async function loadExam() {
  try {
    const examRes = await axios.get(`/exam/${examId}`)
    if (examRes.code === 200) {
      exam.value = examRes.data
      remainingTime.value = examRes.data.duration * 60
    }
    
    const questionsRes = await axios.get(`/exam/${examId}/questions`)
    if (questionsRes.code === 200) {
      questions.value = questionsRes.data
    }
    
    startTimer()
  } catch (error) {
    console.error('Failed to load exam:', error)
  }
}

function startTimer() {
  timer.value = setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      clearInterval(timer.value)
      submitExam()
    }
  }, 1000)
}

async function submitExam() {
  if (submitting.value) return
  
  submitting.value = true
  clearInterval(timer.value)
  stopMonitoring()
  
  alert('考试已提交！')
  router.push('/student/exams')
}

onMounted(() => {
  loadExam()
})

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.monitor-alert-count {
  font-size: 12px;
  color: #a8071a;
  margin-top: 4px;
}
</style>
