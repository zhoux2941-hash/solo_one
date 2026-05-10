<template>
  <div class="host-panel">
    <el-card v-if="!selectedCompetition">
      <template #header>
        <div class="card-header">
          <span>选择竞赛</span>
        </div>
      </template>
      <el-select
        v-model="selectedCompetitionId"
        placeholder="请选择一个竞赛"
        style="width: 100%; margin-bottom: 20px"
      >
        <el-option
          v-for="comp in competitions"
          :key="comp.id"
          :label="`${comp.name} (${getStatusText(comp.status)})`"
          :value="comp.id"
        />
      </el-select>
      <el-button type="primary" :disabled="!selectedCompetitionId" @click="selectCompetition">
        进入主持面板
      </el-button>
    </el-card>

    <template v-else>
      <el-card>
        <template #header>
          <div class="card-header">
            <span>主持面板 - {{ selectedCompetition.name }}</span>
            <div>
              <span :class="['status-badge', `status-${selectedCompetition.status.toLowerCase()}`]">
                {{ getStatusText(selectedCompetition.status) }}
              </span>
              <el-button type="text" @click="selectedCompetition = null; selectedCompetitionId = null">
                返回
              </el-button>
            </div>
          </div>
        </template>

        <div class="control-buttons" v-if="selectedCompetition.status === 'CREATED'">
          <el-button type="success" size="large" @click="startCompetition" :loading="loading">
            开始竞赛
          </el-button>
        </div>

        <div v-if="selectedCompetition.status === 'IN_PROGRESS'">
          <div class="score-board">
            <div
              v-for="(team, index) in teams"
              :key="team.id"
              class="score-card"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="team-name">{{ team.name }}</div>
              <div class="team-score">{{ team.score }}</div>
              <div class="team-stats">
                <span style="color: #67c23a">对: {{ team.correctCount }}</span>
                <span style="color: #f56c6c">错: {{ team.wrongCount }}</span>
              </div>
            </div>
          </div>

          <div v-if="!currentQuestion" class="start-question-section">
            <el-button type="primary" size="large" @click="nextQuestion" :loading="loading">
              显示第一题
            </el-button>
          </div>

          <div v-else>
            <div class="question-display">
              <div class="question-info">
                第 {{ questionIndex }} / {{ selectedCompetition.questionCount }} 题
              </div>
              <div class="question-content">{{ currentQuestion.content }}</div>
              <div class="option-list">
                <div
                  v-for="(option, key) in questionOptions"
                  :key="key"
                  class="option-item"
                >
                  <span class="option-label">{{ key }}.</span>
                  {{ option }}
                </div>
              </div>
              <div class="correct-answer">
                正确答案: <strong>{{ currentQuestion.correctAnswer }}</strong>
                ({{ currentQuestion.points }} 分)
              </div>
            </div>

            <div v-if="buzzerStatus.winnerTeamId" class="winner-banner">
              🎉 {{ buzzerStatus.winnerTeamName }} 抢答成功！
            </div>

            <div class="timer" v-if="answerTimeLeft > 0">
              答题剩余时间: <span :class="timerClass">{{ answerTimeLeft }}s</span>
            </div>

            <div class="judge-section" v-if="buzzerStatus.winnerTeamId && !hasJudged">
              <h4>判定答题结果</h4>
              <el-button
                type="success"
                size="large"
                @click="judgeAnswer(true)"
                :loading="judging"
              >
                回答正确 (+{{ currentQuestion.points }}分)
              </el-button>
              <el-button
                type="danger"
                size="large"
                @click="judgeAnswer(false)"
                :loading="judging"
              >
                回答错误
              </el-button>
            </div>

            <div class="next-section" v-if="hasJudged">
              <template v-if="lastJudgementWasCorrect">
                <el-button type="primary" size="large" @click="nextQuestion" :loading="loading">
                  下一题
                </el-button>
              </template>
              <template v-else>
                <el-button type="warning" size="large" @click="continueBuzzer" :loading="loading">
                  🔄 继续抢答（其他队伍可回答）
                </el-button>
                <el-button type="primary" size="large" @click="nextQuestion" :loading="loading" style="margin-left: 10px">
                  下一题（跳过此题）
                </el-button>
              </template>
            </div>
          </div>
        </div>

        <div v-if="selectedCompetition.status === 'FINISHED'" class="finished-section">
          <el-alert title="竞赛已结束" type="success" show-icon />
          <el-button type="primary" @click="viewResults">查看成绩</el-button>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getCompetitions,
  getCompetition,
  getTeams,
  getCurrentQuestion,
  startCompetition as apiStartCompetition,
  nextQuestion as apiNextQuestion,
  judgeAnswer as apiJudgeAnswer,
  resetBuzzer as apiResetBuzzer
} from '../api/competitions'
import { useCompetitionStore } from '../stores/competition'
import websocket from '../utils/websocket'
import { ElMessage } from 'element-plus'

const router = useRouter()
const competitionStore = useCompetitionStore()

const competitions = ref([])
const selectedCompetitionId = ref(null)
const selectedCompetition = ref(null)
const teams = ref([])
const currentQuestion = ref(null)
const loading = ref(false)
const judging = ref(false)
const hasJudged = ref(false)
const lastJudgementWasCorrect = ref(true)
const answerTimeLeft = ref(0)
const buzzerStatus = ref({
  available: true,
  winnerTeamId: null,
  winnerTeamName: null
})
let timerInterval = null

const questionIndex = computed(() => {
  if (!selectedCompetition.value) return 0
  return selectedCompetition.value.currentQuestionIndex + 1
})

const questionOptions = computed(() => {
  if (!currentQuestion.value) return {}
  return {
    'A': currentQuestion.value.optionA,
    'B': currentQuestion.value.optionB,
    'C': currentQuestion.value.optionC,
    'D': currentQuestion.value.optionD
  }
})

const timerClass = computed(() => {
  if (answerTimeLeft.value <= 3) return 'danger'
  if (answerTimeLeft.value <= 5) return 'warning'
  return ''
})

function getStatusText(status) {
  const statusMap = {
    'CREATED': '已创建',
    'IN_PROGRESS': '进行中',
    'FINISHED': '已结束'
  }
  return statusMap[status] || status
}

async function loadCompetitions() {
  try {
    const response = await getCompetitions()
    competitions.value = response.data
  } catch (error) {
    ElMessage.error('加载竞赛列表失败')
  }
}

async function selectCompetition() {
  loading.value = true
  try {
    const [compRes, teamsRes] = await Promise.all([
      getCompetition(selectedCompetitionId.value),
      getTeams(selectedCompetitionId.value)
    ])
    selectedCompetition.value = compRes.data
    teams.value = teamsRes.data

    if (compRes.data.status === 'IN_PROGRESS') {
      try {
        const questionRes = await getCurrentQuestion(selectedCompetitionId.value)
        currentQuestion.value = questionRes.data
      } catch (e) {}
    }

    connectWebSocket()
  } catch (error) {
    ElMessage.error('加载竞赛信息失败')
  } finally {
    loading.value = false
  }
}

function connectWebSocket() {
  websocket.connect(() => {
    websocket.subscribe(`/topic/competition/${selectedCompetitionId.value}`, handleWebSocketMessage)
  })
}

function handleWebSocketMessage(message) {
  console.log('Received message:', message)

  switch (message.type) {
    case 'COMPETITION_STARTED':
      refreshCompetition()
      ElMessage.success('竞赛已开始')
      break
    case 'QUESTION_DISPLAYED':
      currentQuestion.value = message.data.question
      buzzerStatus.value = {
        available: true,
        winnerTeamId: null,
        winnerTeamName: null
      }
      hasJudged.value = false
      answerTimeLeft.value = 0
      if (selectedCompetition.value) {
        selectedCompetition.value.currentQuestionIndex = message.data.index - 1
      }
      break
    case 'BUZZER_WON':
      buzzerStatus.value = {
        available: false,
        winnerTeamId: message.data.teamId,
        winnerTeamName: message.data.teamName
      }
      ElMessage.info(`${message.data.teamName} 抢答成功！`)
      break
    case 'ANSWER_TIMER_STARTED':
      startAnswerTimer(message.data)
      break
    case 'ANSWER_JUDGED':
      teams.value = message.data.teams
      lastJudgementWasCorrect.value = message.data.isCorrect
      hasJudged.value = true
      stopAnswerTimer()
      ElMessage.success(message.data.isCorrect ? '答题正确！' : '答题错误')
      break
    case 'BUZZER_RESET':
      buzzerStatus.value = {
        available: true,
        winnerTeamId: null,
        winnerTeamName: null
      }
      hasJudged.value = false
      answerTimeLeft.value = 0
      ElMessage.info('抢答已重置，可以继续抢答')
      break
    case 'COMPETITION_FINISHED':
      selectedCompetition.value.status = 'FINISHED'
      teams.value = message.data.teams
      ElMessage.success('竞赛已结束！')
      router.push(`/results/${selectedCompetitionId.value}`)
      break
  }
}

function startAnswerTimer(seconds) {
  answerTimeLeft.value = seconds
  stopAnswerTimer()
  timerInterval = setInterval(() => {
    answerTimeLeft.value--
    if (answerTimeLeft.value <= 0) {
      stopAnswerTimer()
    }
  }, 1000)
}

function stopAnswerTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

async function refreshCompetition() {
  try {
    const response = await getCompetition(selectedCompetitionId.value)
    selectedCompetition.value = response.data
    const teamsRes = await getTeams(selectedCompetitionId.value)
    teams.value = teamsRes.data
  } catch (error) {
    console.error('Refresh competition failed', error)
  }
}

async function startCompetition() {
  loading.value = true
  try {
    await apiStartCompetition(selectedCompetitionId.value)
    await refreshCompetition()
    ElMessage.success('竞赛已开始')
  } catch (error) {
    ElMessage.error('开始竞赛失败')
  } finally {
    loading.value = false
  }
}

async function nextQuestion() {
  loading.value = true
  try {
    const response = await apiNextQuestion(selectedCompetitionId.value)
    if (response.data.finished) {
      ElMessage.success('竞赛已结束！')
      selectedCompetition.value.status = 'FINISHED'
    } else {
      currentQuestion.value = response.data.question
      await refreshCompetition()
      hasJudged.value = false
      buzzerStatus.value = {
        available: true,
        winnerTeamId: null,
        winnerTeamName: null
      }
      answerTimeLeft.value = 0
    }
  } catch (error) {
    ElMessage.error('获取下一题失败')
  } finally {
    loading.value = false
  }
}

async function judgeAnswer(isCorrect) {
  judging.value = true
  try {
    const response = await apiJudgeAnswer({
      competitionId: selectedCompetitionId.value,
      teamId: buzzerStatus.value.winnerTeamId,
      isCorrect: isCorrect,
      points: isCorrect ? currentQuestion.value.points : 0
    })
    lastJudgementWasCorrect.value = isCorrect
    hasJudged.value = true
    stopAnswerTimer()
    await refreshCompetition()
  } catch (error) {
    ElMessage.error('判分失败')
  } finally {
    judging.value = false
  }
}

async function continueBuzzer() {
  loading.value = true
  try {
    await apiResetBuzzer(selectedCompetitionId.value)
    hasJudged.value = false
    buzzerStatus.value = {
      available: true,
      winnerTeamId: null,
      winnerTeamName: null
    }
    answerTimeLeft.value = 0
    ElMessage.success('抢答已重置，其他队伍可以继续抢答')
  } catch (error) {
    ElMessage.error('重置抢答失败')
  } finally {
    loading.value = false
  }
}

function viewResults() {
  router.push(`/results/${selectedCompetitionId.value}`)
}

onMounted(() => {
  loadCompetitions()
})

onUnmounted(() => {
  stopAnswerTimer()
  websocket.disconnect()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-buttons {
  text-align: center;
  padding: 40px;
}

.start-question-section {
  text-align: center;
  padding: 40px;
}

.judge-section {
  text-align: center;
  margin: 30px 0;
}

.judge-section h4 {
  margin-bottom: 20px;
}

.judge-section .el-button {
  margin: 0 10px;
}

.next-section {
  text-align: center;
  margin: 30px 0;
}

.finished-section {
  text-align: center;
  padding: 40px;
}

.finished-section .el-alert {
  margin-bottom: 20px;
}

.question-info {
  text-align: center;
  color: #909399;
  margin-bottom: 10px;
}

.correct-answer {
  margin-top: 20px;
  font-size: 18px;
  color: #67c23a;
  text-align: center;
}
</style>
