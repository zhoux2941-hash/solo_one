<template>
  <div class="page-container">
    <div class="card">
      <div class="flex justify-between items-center mb-24">
        <h2 class="card-title" style="margin: 0;">题目管理</h2>
        <div class="flex gap-12">
          <button class="btn btn-outline" @click="addSampleQuestions">
            添加示例题目
          </button>
          <button class="btn btn-primary" @click="showAddForm = true">
            + 添加题目
          </button>
        </div>
      </div>
      
      <div v-if="questions.length === 0" class="empty-state">
        <div class="empty-icon">❓</div>
        <div class="empty-text">暂无题目，点击上方按钮添加</div>
      </div>
      
      <div v-else>
        <div 
          v-for="(question, index) in questions" 
          :key="question.id" 
          class="question-card"
        >
          <div class="flex justify-between items-center mb-16">
            <div>
              <span class="question-number">第 {{ index + 1 }} 题</span>
              <span class="question-type">{{ question.type === 'SINGLE' ? '单选题' : '多选题' }}</span>
              <span class="status-badge status-draft" style="margin-left: 8px;">{{ question.points }} 分</span>
            </div>
            <button class="btn btn-danger btn-sm" @click="removeQuestion(index)">
              删除
            </button>
          </div>
          <div class="question-text">{{ question.questionText }}</div>
          <div class="option-list" style="margin-top: 12px;">
            <div 
              v-for="(opt, optIdx) in parsedOptions(question.options)" 
              :key="optIdx"
              class="option-item"
              style="cursor: default;"
            >
              <div class="option-radio" style="pointer-events: none;">
                <div 
                  v-if="isCorrect(question, optIdx)" 
                  class="option-radio-inner"
                ></div>
              </div>
              <div class="option-content">{{ opt.label }}. {{ opt.text }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex gap-12 mt-24" style="margin-top: 24px;">
        <button class="btn btn-outline" @click="goBack">
          返回
        </button>
      </div>
    </div>
    
    <div v-if="showAddForm" class="card">
      <h3 class="card-title">添加题目</h3>
      
      <div class="form-group">
        <label class="form-label">题目类型</label>
        <select v-model="newQuestion.type" class="form-input">
          <option value="SINGLE">单选题</option>
          <option value="MULTIPLE">多选题</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">题目内容 *</label>
        <textarea 
          v-model="newQuestion.questionText" 
          class="form-textarea" 
          placeholder="请输入题目内容"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label class="form-label">选项（每行一个，格式：A.选项内容）</label>
        <textarea 
          v-model="optionsText" 
          class="form-textarea" 
          placeholder="A. 选项1&#10;B. 选项2&#10;C. 选项3&#10;D. 选项4"
          style="height: 150px;"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label class="form-label">正确答案（多选题用逗号分隔，如：A,B,C）</label>
        <input 
          type="text" 
          v-model="correctAnswer" 
          class="form-input" 
          placeholder="A 或 A,B,C"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">分值</label>
        <input 
          type="number" 
          v-model.number="newQuestion.points" 
          class="form-input" 
          min="1"
        />
      </div>
      
      <div class="flex gap-12">
        <button class="btn btn-primary" @click="addQuestion">
          添加
        </button>
        <button class="btn btn-outline" @click="showAddForm = false">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/utils/axios'

const route = useRoute()
const router = useRouter()

const examId = route.params.examId
const questions = ref([])
const showAddForm = ref(false)

const optionsText = ref('')
const correctAnswer = ref('')

const newQuestion = ref({
  type: 'SINGLE',
  questionText: '',
  options: '[]',
  correctAnswer: '',
  points: 1
})

function parsedOptions(options) {
  try {
    return JSON.parse(options)
  } catch {
    return []
  }
}

function isCorrect(question, optIdx) {
  const options = parsedOptions(question.options)
  const opt = options[optIdx]
  if (!opt) return false
  
  if (question.type === 'SINGLE') {
    return opt.label === question.correctAnswer
  } else {
    const correctAnswers = question.correctAnswer?.split(',') || []
    return correctAnswers.includes(opt.label)
  }
}

async function loadQuestions() {
  try {
    const response = await axios.get(`/exam/${examId}/questions`)
    if (response.code === 200) {
      questions.value = response.data
    }
  } catch (error) {
    console.error('Failed to load questions:', error)
  }
}

function parseOptionsFromText() {
  const lines = optionsText.value.trim().split('\n').filter(line => line.trim())
  const options = lines.map(line => {
    const match = line.match(/^([A-Z])\.\s*(.+)$/)
    if (match) {
      return { label: match[1], text: match[2] }
    }
    return null
  }).filter(Boolean)
  
  return JSON.stringify(options)
}

async function addQuestion() {
  if (!newQuestion.value.questionText.trim()) {
    alert('请输入题目内容')
    return
  }
  
  newQuestion.value.options = parseOptionsFromText()
  newQuestion.value.correctAnswer = correctAnswer.value.trim().toUpperCase()
  
  try {
    const response = await axios.post(`/exam/${examId}/questions`, newQuestion.value)
    if (response.code === 200) {
      questions.value.push(response.data)
      resetForm()
    }
  } catch (error) {
    console.error('Failed to add question:', error)
  }
}

function resetForm() {
  showAddForm.value = false
  optionsText.value = ''
  correctAnswer.value = ''
  newQuestion.value = {
    type: 'SINGLE',
    questionText: '',
    options: '[]',
    correctAnswer: '',
    points: 1
  }
}

function removeQuestion(index) {
  questions.value.splice(index, 1)
}

async function addSampleQuestions() {
  const sampleQuestions = [
    {
      type: 'SINGLE',
      questionText: 'Vue 3 中，以下哪个是响应式系统的核心 API？',
      options: JSON.stringify([
        { label: 'A', text: 'ref / reactive' },
        { label: 'B', text: 'data / props' },
        { label: 'C', text: 'computed / watch' },
        { label: 'D', text: 'methods / lifecycle' }
      ]),
      correctAnswer: 'A',
      points: 5
    },
    {
      type: 'SINGLE',
      questionText: 'JavaScript 中，以下哪个方法可以用于数组遍历并返回新数组？',
      options: JSON.stringify([
        { label: 'A', text: 'forEach' },
        { label: 'B', text: 'map' },
        { label: 'C', text: 'filter' },
        { label: 'D', text: 'reduce' }
      ]),
      correctAnswer: 'B',
      points: 5
    },
    {
      type: 'MULTIPLE',
      questionText: '以下哪些是 CSS Flexbox 的属性？（多选）',
      options: JSON.stringify([
        { label: 'A', text: 'display: flex' },
        { label: 'B', text: 'justify-content' },
        { label: 'C', text: 'align-items' },
        { label: 'D', text: 'grid-template-columns' }
      ]),
      correctAnswer: 'A,B,C',
      points: 10
    },
    {
      type: 'SINGLE',
      questionText: 'HTTP 状态码 401 表示什么？',
      options: JSON.stringify([
        { label: 'A', text: '请求成功' },
        { label: 'B', text: '未授权' },
        { label: 'C', text: '服务器错误' },
        { label: 'D', text: '资源不存在' }
      ]),
      correctAnswer: 'B',
      points: 5
    },
    {
      type: 'MULTIPLE',
      questionText: '以下哪些是 JavaScript 的基本数据类型？（多选）',
      options: JSON.stringify([
        { label: 'A', text: 'string' },
        { label: 'B', text: 'number' },
        { label: 'C', text: 'array' },
        { label: 'D', text: 'boolean' }
      ]),
      correctAnswer: 'A,B,D',
      points: 10
    }
  ]
  
  try {
    const response = await axios.post(`/exam/${examId}/questions/batch`, sampleQuestions)
    if (response.code === 200) {
      questions.value.push(...response.data)
    }
  } catch (error) {
    console.error('Failed to add sample questions:', error)
  }
}

function goBack() {
  router.push('/teacher/exams')
}

onMounted(() => {
  loadQuestions()
})
</script>
