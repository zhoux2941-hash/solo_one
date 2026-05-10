<template>
  <div class="audience-view">
    <div v-if="!selectedCompetitionId" class="select-competition">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>🎫 选择要观看的竞赛</span>
          </div>
        </template>
        <el-empty v-if="competitions.length === 0" description="暂无进行中的竞赛"></el-empty>
        <el-list v-else>
          <el-list-item
            v-for="comp in competitions"
            :key="comp.id"
            @click="selectCompetition(comp.id)"
            class="competition-item"
          >
            <div class="comp-info">
              <div class="comp-name">{{ comp.name }}</div>
              <div class="comp-meta">
                <el-tag :type="getStatusTagType(comp.status)" size="small">
                  {{ getStatusText(comp.status) }}
                </el-tag>
                <span class="comp-teams">{{ comp.teamCount }} 支队伍</span>
              </div>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </el-list-item>
        </el-list>
      </el-card>
    </div>

    <div v-else class="watch-area">
      <div class="top-bar">
        <el-button text @click="exitCompetition">
          <el-icon><Back /></el-icon>
          返回
        </el-button>
        <h2 class="comp-title">{{ competitionInfo?.name }}</h2>
        <el-tag :type="getStatusTagType(competitionInfo?.status)" size="large">
          {{ getStatusText(competitionInfo?.status) }}
        </el-tag>
      </div>

      <div class="main-content">
        <div class="left-section">
          <div class="question-panel" v-if="currentQuestion">
            <div class="question-header">
              <span class="question-number">
                第 {{ competitionInfo?.currentQuestionIndex + 1 || 1 }} 题
              </span>
            </div>
            <div class="question-content">
              <h3>{{ currentQuestion.content }}</h3>
            </div>
            <div class="options-grid">
              <div
                v-for="(option, key) in questionOptions"
                :key="key"
                class="option-card"
                :class="{ correct: correctAnswerVisible && key === currentQuestion.correctAnswer }"
              >
                <span class="option-letter">{{ key }}</span>
                <span class="option-text">{{ option }}</span>
              </div>
            </div>
            <div class="buzzer-status" v-if="buzzerStatus.winnerTeamName">
              <el-tag type="success" size="large">
                🎉 {{ buzzerStatus.winnerTeamName }} 抢到答题权
              </el-tag>
            </div>
          </div>

          <div class="waiting-panel" v-else>
            <el-empty description="等待主持人开始...">
              <template #image>
                <div class="waiting-emoji">⏳</div>
              </template>
            </el-empty>
          </div>

          <div class="vote-actions">
            <div class="vote-header">
              <h3>🎯 为你支持的队伍打Call</h3>
              <div class="heat-stats">
                <el-statistic title="总热度" :value="heatData?.totalHeat || 0">
                  <template #suffix>🔥</template>
                </el-statistic>
                <el-statistic title="总投票" :value="heatData?.totalVotes || 0">
                  <template #suffix>票</template>
                </el-statistic>
              </div>
            </div>

            <div class="team-vote-list">
              <div
                v-for="(team, index) in heatData?.teams"
                :key="team.teamId"
                class="team-vote-card"
                :class="{ leader: team.isLeader }"
              >
                <div class="team-rank" v-if="team.isLeader">👑</div>
                <div class="team-header">
                  <span class="team-name">{{ team.teamName }}</span>
                  <span class="heat-value">🔥 {{ formatNumber(team.heatScore) }}</span>
                </div>
                <div class="heat-bar-container">
                  <div
                    class="heat-bar"
                    :style="{ width: getHeatBarWidth(team.heatScore) }"
                  ></div>
                </div>
                <div class="vote-buttons">
                  <el-button
                    type="primary"
                    size="small"
                    @click="doVote(team.teamId, 'LIKE')"
                    :disabled="voting"
                  >
                    👍 点赞 (+1)
                  </el-button>
                  <el-button
                    type="success"
                    size="small"
                    @click="doVote(team.teamId, 'CHEER')"
                    :disabled="voting"
                  >
                    🎉 打call (+5)
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    @click="doVote(team.teamId, 'FIRE')"
                    :disabled="voting"
                  >
                    🚀 火箭 (+10)
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="right-section">
          <div class="score-panel">
            <h3>📊 实时排名</h3>
            <div class="score-list">
              <div
                v-for="(team, index) in teamScores"
                :key="team.id"
                class="score-item"
              >
                <div class="rank-badge" :class="getRankClass(index)">
                  {{ getRankIcon(index) }}
                </div>
                <div class="team-info">
                  <span class="team-name">{{ team.name }}</span>
                  <span class="team-stats">
                    对: {{ team.correctCount }} | 错: {{ team.wrongCount }}
                  </span>
                </div>
                <div class="team-score">{{ team.score }}</div>
              </div>
            </div>
          </div>

          <div class="activity-panel">
            <h3>📢 实时互动</h3>
            <div class="activity-list" ref="activityListRef">
              <div
                v-for="(activity, index) in recentActivities"
                :key="index"
                class="activity-item"
                :style="{ animationDelay: `${index * 0.05}s` }"
              >
                <span class="activity-icon">{{ getActivityIcon(activity.voteType) }}</span>
                <span class="activity-text">
                  有人为 <strong>{{ activity.teamName }}</strong> {{ getActivityText(activity.voteType) }}
                </span>
                <span class="activity-points">+{{ activity.points }}</span>
              </div>
              <el-empty v-if="recentActivities.length === 0" description="暂无互动" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Back } from '@element-plus/icons-vue'
import { getCompetitions, getCompetition, getTeams, getCurrentQuestion } from '../api/competitions'
import { getCompetitionHeat, vote } from '../api/audience'
import websocket from '../utils/websocket'

const router = useRouter()
const route = useRoute()
const activityListRef = ref(null)

const competitions = ref([])
const selectedCompetitionId = ref(null)
const competitionInfo = ref(null)
const teamScores = ref([])
const currentQuestion = ref(null)
const buzzerStatus = ref({ winnerTeamName: null })
const heatData = ref(null)
const voting = ref(false)
const correctAnswerVisible = ref(false)
const recentActivities = ref([])

const questionOptions = computed(() => {
  if (!currentQuestion.value) return {}
  return {
    'A': currentQuestion.value.optionA,
    'B': currentQuestion.value.optionB,
    'C': currentQuestion.value.optionC,
    'D': currentQuestion.value.optionD
  }
})

function getStatusText(status) {
  const map = {
    'CREATED': '待开始',
    'IN_PROGRESS': '进行中',
    'FINISHED': '已结束'
  }
  return map[status] || status
}

function getStatusTagType(status) {
  const map = {
    'CREATED': 'info',
    'IN_PROGRESS': 'success',
    'FINISHED': 'warning'
  }
  return map[status] || 'info'
}

function getRankClass(index) {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return ''
}

function getRankIcon(index) {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return index + 1
}

function getHeatBarWidth(score) {
  if (!heatData.value || !heatData.value.totalHeat) return '0%'
  const maxHeat = Math.max(...heatData.value.teams.map(t => t.heatScore), 1)
  return Math.min((score / maxHeat) * 100, 100) + '%'
}

function formatNumber(num) {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num
}

function getActivityIcon(type) {
  const icons = {
    'LIKE': '👍',
    'CHEER': '🎉',
    'FIRE': '🚀'
  }
  return icons[type] || '❤️'
}

function getActivityText(type) {
  const texts = {
    'LIKE': '点赞',
    'CHEER': '打call',
    'FIRE': '送了火箭'
  }
  return texts[type] || '投票'
}

async function loadCompetitions() {
  try {
    const response = await getCompetitions()
    competitions.value = response.data.filter(c => c.status !== 'FINISHED')
  } catch (error) {
    ElMessage.error('加载竞赛列表失败')
  }
}

async function selectCompetition(compId) {
  selectedCompetitionId.value = compId
  await loadCompetitionData()
  connectWebSocket()
}

function exitCompetition() {
  selectedCompetitionId.value = null
  competitionInfo.value = null
  currentQuestion.value = null
  websocket.disconnect()
}

async function loadCompetitionData() {
  try {
    const [compRes, teamsRes, heatRes] = await Promise.all([
      getCompetition(selectedCompetitionId.value),
      getTeams(selectedCompetitionId.value),
      getCompetitionHeat(selectedCompetitionId.value)
    ])
    competitionInfo.value = compRes.data
    teamScores.value = teamsRes.data.sort((a, b) => b.score - a.score)
    heatData.value = heatRes.data

    if (compRes.data.status === 'IN_PROGRESS') {
      try {
        const questionRes = await getCurrentQuestion(selectedCompetitionId.value)
        currentQuestion.value = questionRes.data
      } catch (e) {}
    }
  } catch (error) {
    ElMessage.error('加载竞赛信息失败')
  }
}

function connectWebSocket() {
  websocket.connect(() => {
    websocket.subscribe(`/topic/competition/${selectedCompetitionId.value}`, handleWebSocketMessage)
  }, true)
}

function handleWebSocketMessage(message) {
  console.log('Audience received:', message)

  switch (message.type) {
    case 'COMPETITION_STARTED':
      ElMessage.success('竞赛开始！')
      loadCompetitionData()
      break
    case 'QUESTION_DISPLAYED':
      currentQuestion.value = message.data.question
      correctAnswerVisible.value = false
      buzzerStatus.value = { winnerTeamName: null }
      if (competitionInfo.value) {
        competitionInfo.value.currentQuestionIndex = message.data.index - 1
      }
      break
    case 'BUZZER_WON':
      buzzerStatus.value = { winnerTeamName: message.data.teamName }
      break
    case 'BUZZER_RESET':
      buzzerStatus.value = { winnerTeamName: null }
      break
    case 'ANSWER_JUDGED':
      correctAnswerVisible.value = true
      teamScores.value = message.data.teams
      loadHeatData()
      break
    case 'AUDIENCE_VOTE':
      addActivity(message.data)
      updateHeatData(message.data)
      break
    case 'COMPETITION_FINISHED':
      ElMessage.success('竞赛结束！')
      competitionInfo.value.status = 'FINISHED'
      loadHeatData()
      break
  }
}

function addActivity(data) {
  const activity = {
    teamName: data.teamName,
    voteType: data.voteType,
    points: data.points
  }
  recentActivities.value.unshift(activity)
  if (recentActivities.value.length > 50) {
    recentActivities.value.pop()
  }
  nextTick(() => {
    if (activityListRef.value) {
      activityListRef.value.scrollTop = 0
    }
  })
}

function updateHeatData(data) {
  if (!heatData.value) return

  const team = heatData.value.teams.find(t => t.teamId === data.teamId)
  if (team) {
    team.heatScore += data.points
    team.voteCount++
    heatData.value.totalHeat += data.points
    heatData.value.totalVotes++

    heatData.value.teams.sort((a, b) => b.heatScore - a.heatScore)
    heatData.value.teams.forEach((t, i) => {
      t.isLeader = i === 0 && heatData.value.teams[0].heatScore > 0
    })
  }
}

async function loadHeatData() {
  try {
    const response = await getCompetitionHeat(selectedCompetitionId.value)
    heatData.value = response.data
  } catch (error) {
    console.error('Load heat failed', error)
  }
}

async function doVote(teamId, voteType) {
  if (voting.value) return
  voting.value = true

  try {
    const response = await vote(selectedCompetitionId.value, teamId, voteType)
    if (response.data.success) {
      ElMessage.success(`${response.data.message}`)
    } else {
      ElMessage.warning(response.data.message)
    }
  } catch (error) {
    if (error.response?.data?.message) {
      ElMessage.warning(error.response.data.message)
    } else {
      ElMessage.error('投票失败')
    }
  } finally {
    voting.value = false
  }
}

onMounted(() => {
  loadCompetitions()

  if (route.params.competitionId) {
    selectCompetition(Number(route.params.competitionId))
  }
})

onUnmounted(() => {
  websocket.disconnect()
})
</script>

<style scoped>
.audience-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.select-competition {
  max-width: 500px;
  margin: 50px auto;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.competition-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.competition-item:hover {
  background: #f5f7fa;
}

.comp-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.comp-meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.comp-teams {
  font-size: 13px;
  color: #909399;
}

.watch-area {
  max-width: 1400px;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.comp-title {
  flex: 1;
  margin: 0;
  font-size: 20px;
}

.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.question-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.question-header {
  text-align: center;
  margin-bottom: 20px;
}

.question-number {
  font-size: 14px;
  color: #909399;
  background: #f0f2f5;
  padding: 6px 16px;
  border-radius: 20px;
}

.question-content h3 {
  font-size: 22px;
  text-align: center;
  margin-bottom: 30px;
  line-height: 1.6;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.option-card {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s;
}

.option-card.correct {
  background: #f0f9eb;
  border: 2px solid #67c23a;
}

.option-letter {
  width: 36px;
  height: 36px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
}

.buzzer-status {
  text-align: center;
  margin-top: 20px;
}

.waiting-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 60px;
  margin-bottom: 20px;
  text-align: center;
}

.waiting-emoji {
  font-size: 60px;
  margin-bottom: 20px;
}

.vote-actions {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.vote-header {
  margin-bottom: 20px;
}

.vote-header h3 {
  margin-bottom: 15px;
}

.heat-stats {
  display: flex;
  gap: 30px;
}

.team-vote-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.team-vote-card {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 12px;
  position: relative;
  transition: all 0.3s;
}

.team-vote-card.leader {
  background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
  border: 2px solid #e6a23c;
}

.team-rank {
  position: absolute;
  top: -10px;
  right: 20px;
  font-size: 24px;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.team-header .team-name {
  font-size: 16px;
  font-weight: 600;
}

.heat-value {
  font-size: 18px;
  font-weight: 600;
  color: #e6a23c;
}

.heat-bar-container {
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  margin-bottom: 15px;
  overflow: hidden;
}

.heat-bar {
  height: 100%;
  background: linear-gradient(90deg, #f56c6c, #e6a23c);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.vote-buttons {
  display: flex;
  gap: 10px;
}

.right-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.score-panel,
.activity-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.score-panel h3,
.activity-panel h3 {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f2f5;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 10px;
}

.rank-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.rank-gold {
  background: linear-gradient(135deg, #ffd700, #ffb800);
  color: #8b4513;
}

.rank-silver {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
  color: white;
}

.rank-bronze {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: white;
}

.team-info {
  flex: 1;
}

.team-info .team-name {
  font-weight: 600;
  display: block;
}

.team-info .team-stats {
  font-size: 12px;
  color: #909399;
}

.team-score {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 8px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.activity-icon {
  font-size: 18px;
}

.activity-text {
  flex: 1;
  font-size: 14px;
}

.activity-text strong {
  color: #409eff;
}

.activity-points {
  color: #67c23a;
  font-weight: 600;
}
</style>
