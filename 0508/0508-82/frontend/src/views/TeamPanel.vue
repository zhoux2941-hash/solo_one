<template>
  <div class="team-panel">
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
        filterable
      >
        <el-option
          v-for="comp in availableCompetitions"
          :key="comp.id"
          :label="comp.name"
          :value="comp.id"
        />
      </el-select>
      <el-select
        v-if="selectedCompetitionId"
        v-model="selectedTeamId"
        placeholder="请选择你的队伍"
        style="width: 100%; margin-bottom: 20px"
      >
        <el-option
          v-for="team in teams"
          :key="team.id"
          :label="team.name"
          :value="team.id"
        />
      </el-select>
      <el-button
        type="primary"
        :disabled="!selectedCompetitionId || !selectedTeamId"
        @click="enterCompetition"
      >
        进入竞赛
      </el-button>
    </el-card>

    <template v-else>
      <el-card>
        <template #header>
          <div class="card-header">
            <span>{{ selectedCompetition.name }} - {{ selectedTeam?.name }}</span>
            <el-button type="text" @click="exitCompetition">退出</el-button>
          </div>
        </template>

        <div class="score-board">
          <div
            v-for="(team, index) in teams"
            :key="team.id"
            class="score-card"
            :class="{ 'my-team': team.id === selectedTeamId }"
          >
            <div class="team-name">
              {{ team.name }}
              <span v-if="team.id === selectedTeamId" class="my-badge">我的队伍</span>
            </div>
            <div class="team-score">{{ team.score }}</div>
          </div>
        </div>

        <div v-if="selectedCompetition.status === 'CREATED'" class="waiting-section">
          <el-alert title="等待主持人开始竞赛..." type="info" show-icon />
        </div>

        <div v-else-if="selectedCompetition.status === 'IN_PROGRESS'">
          <div v-if="!currentQuestion" class="waiting-question">
            <el-alert title="等待主持人出题..." type="info" show-icon />
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
                  :class="{ selected: selectedAnswer === key }"
                  @click="selectAnswer(key)"
                >
                  <span class="option-label">{{ key }}.</span>
                  {{ option }}
                </div>
              </div>
            </div>

            <div class="buzzer-section">
              <div v-if="buzzerStatus.available && !hasSubmittedAnswer">
                <el-button
                  class="buzzer-button available"
                  type="danger"
                  size="large"
                  @click="buzz"
                  :loading="buzzing"
                >
                  🚀 抢答
                </el-button>
              </div>
              <div v-else-if="buzzerStatus.winnerTeamId === selectedTeamId && !hasSubmittedAnswer">
                <div class="winner-banner">🎉 你抢到了答题权！请选择答案并提交</div>
                <div class="timer" v-if="answerTimeLeft > 0">
                  剩余时间: <span :class="timerClass">{{ answerTimeLeft }}s</span>
                </div>
                <el-button
                  type="primary"
                  size="large"
                  :disabled="!selectedAnswer"
                  @click="submitAnswer"
                  :loading="submitting"
                  style="margin-top: 20px"
                >
                  提交答案
                </el-button>
              </div>
              <div v-else-if="buzzerStatus.winnerTeamId">
                <div class="other-team-banner">
                  {{ buzzerStatus.winnerTeamName }} 抢到了答题权
                </div>
              </div>
              <div v-else-if="hasSubmittedAnswer">
                <el-alert title="答案已提交，等待主持人判定..." type="info" show-icon />
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="selectedCompetition.status === 'FINISHED'" class="finished-section">
          <el-alert title="竞赛已结束！" type="success" show-icon />
          <el-button type="primary" @click="viewResults">查看成绩</el-button>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getCompetitions,
  getCompetition,
  getTeams,
  getCurrentQuestion,
  buzz as apiBuzz,
  submitAnswer as apiSubmitAnswer
} from '../api/competitions'
import websocket from '../utils/websocket'
import { ElMessage } from 'element-plus'

const router = useRouter()

const competitions = ref([])
const teams = ref([])
const selectedCompetitionId = ref(null)
const selectedTeamId = ref(null)
const selectedCompetition = ref(null)
const currentQuestion = ref(null)
const buzzing = ref(false)
const submitting = ref(false)
const selectedAnswer = ref(null)
const hasSubmittedAnswer = ref(false)
const answerTimeLeft = ref(0)
const buzzerStatus = ref({
  available: true,
  winnerTeamId: null,
  winnerTeamName: null
})
let timerInterval = null

const availableCompetitions = computed(() => {
  return competitions.value.filter(c => c.status !== 'FINISHED')
})

const selectedTeam = computed(() => {
  return teams.value.find(t => t.id === selectedTeamId.value)
})

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

async function loadCompetitions() {
  try {
    const response = await getCompetitions()
    competitions.value = response.data
  } catch (error) {
    ElMessage.error('加载竞赛列表失败')
  }
}

async function enterCompetition() {
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
    ElMessage.error('进入竞赛失败')
  }
}

function exitCompetition() {
  selectedCompetition.value = null
  selectedCompetitionId.value = null
  selectedTeamId.value = null
  currentQuestion.value = null
  websocket.disconnect()
}

function connectWebSocket() {
  websocket.connect(() => {
    websocket.subscribe(`/topic/competition/${selectedCompetitionId.value}`, handleWebSocketMessage)
  })
}

function handleWebSocketMessage(message) {
  console.log('Team received message:', message)

  switch (message.type) {
    case 'COMPETITION_STARTED':
      refreshCompetition()
      ElMessage.success('竞赛已开始！')
      break
    case 'QUESTION_DISPLAYED':
      currentQuestion.value = message.data.question
      selectedAnswer.value = null
      hasSubmittedAnswer.value = false
      buzzerStatus.value = {
        available: true,
        winnerTeamId: null,
        winnerTeamName: null
      }
      answerTimeLeft.value = 0
      stopAnswerTimer()
      if (selectedCompetition.value) {
        selectedCompetition.value.currentQuestionIndex = message.data.index - 1
      }
      ElMessage.info('新题目来了！')
      break
    case 'BUZZER_WON':
      buzzerStatus.value = {
        available: false,
        winnerTeamId: message.data.teamId,
        winnerTeamName: message.data.teamName
      }
      if (message.data.teamId === selectedTeamId.value) {
        ElMessage.success('你抢到了！')
      } else {
        ElMessage.info(`${message.data.teamName} 抢到了`)
      }
      break
    case 'ANSWER_TIMER_STARTED':
      if (buzzerStatus.value.winnerTeamId === selectedTeamId.value) {
        startAnswerTimer(message.data)
      }
      break
    case 'ANSWER_JUDGED':
      teams.value = message.data.teams
      ElMessage(message.data.isCorrect ? '回答正确！' : '回答错误', {
        type: message.data.isCorrect ? 'success' : 'error'
      })
      break
    case 'BUZZER_RESET':
      buzzerStatus.value = {
        available: true,
        winnerTeamId: null,
        winnerTeamName: null
      }
      selectedAnswer.value = null
      hasSubmittedAnswer.value = false
      answerTimeLeft.value = 0
      stopAnswerTimer()
      ElMessage.info('抢答已重置，可以继续抢答！')
      break
    case 'COMPETITION_FINISHED':
      selectedCompetition.value.status = 'FINISHED'
      teams.value = message.data.teams
      ElMessage.success('竞赛结束！')
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
      if (buzzerStatus.value.winnerTeamId === selectedTeamId.value && !hasSubmittedAnswer.value) {
        ElMessage.warning('答题时间已到！')
      }
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
    console.error('Refresh failed', error)
  }
}

function selectAnswer(option) {
  if (buzzerStatus.value.winnerTeamId === selectedTeamId.value) {
    selectedAnswer.value = option
  }
}

async function buzz() {
  buzzing.value = true
  try {
    const response = await apiBuzz(selectedCompetitionId.value, selectedTeamId.value)
    if (response.data.success) {
      buzzerStatus.value = {
        available: false,
        winnerTeamId: response.data.teamId,
        winnerTeamName: response.data.teamName
      }
    } else {
      ElMessage.info(response.data.message || '抢答失败')
    }
  } catch (error) {
    ElMessage.error('抢答失败')
  } finally {
    buzzing.value = false
  }
}

async function submitAnswer() {
  if (!selectedAnswer.value) {
    ElMessage.warning('请先选择答案')
    return
  }
  submitting.value = true
  try {
    const response = await apiSubmitAnswer({
      competitionId: selectedCompetitionId.value,
      teamId: selectedTeamId.value,
      answer: selectedAnswer.value
    })
    if (response.data.success) {
      hasSubmittedAnswer.value = true
      ElMessage.success('答案已提交')
    } else {
      ElMessage.error(response.data.message || '提交失败')
    }
  } catch (error) {
    ElMessage.error('提交答案失败')
  } finally {
    submitting.value = false
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

.waiting-section,
.waiting-question {
  text-align: center;
  padding: 40px;
}

.buzzer-section {
  text-align: center;
  margin: 30px 0;
}

.buzzer-button {
  width: 150px !important;
  height: 150px !important;
  border-radius: 50% !important;
  font-size: 20px !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.other-team-banner {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  font-size: 18px;
  color: #909399;
}

.my-team {
  border: 3px solid #409eff;
}

.my-badge {
  background: #409eff;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 5px;
}

.finished-section {
  text-align: center;
  padding: 40px;
}

.finished-section .el-alert {
  margin-bottom: 20px;
}
</style>
