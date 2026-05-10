<template>
  <div class="test-viewer">
    <div class="test-header">
      <div class="header-left">
        <h2>{{ script?.name }}</h2>
        <el-tag type="info">测试模式</el-tag>
      </div>
      <div class="header-right">
        <el-button @click="showReport">
          <el-icon><Document /></el-icon>
          查看分析报告
        </el-button>
        <el-button type="primary" @click="startTest">
          <el-icon><VideoPlay /></el-icon>
          开始模拟
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回编辑
        </el-button>
      </div>
    </div>

    <div class="test-content">
      <div class="test-main">
        <div v-if="!isTesting && !showingReport" class="test-intro">
          <el-card>
            <template #header>
              <div class="card-header">
                <h3>密室剧本测试</h3>
              </div>
            </template>
            <div class="intro-content">
              <el-steps :active="0" finish-status="success" simple>
                <el-step title="选择剧本" />
                <el-step title="模拟玩家" />
                <el-step title="查看报告" />
              </el-steps>
              
              <div class="intro-text">
                <p>点击上方"开始模拟"按钮，以玩家视角体验剧本</p>
                <p>测试完成后，系统将生成详细的分析报告，包括：</p>
                <ul>
                  <li>谜题逻辑闭环检查</li>
                  <li>场景解锁条件验证</li>
                  <li>内容完整性检查</li>
                  <li>优化建议</li>
                </ul>
              </div>

              <div v-if="script" class="script-info">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="难度">{{ script.difficulty }}</el-descriptions-item>
                  <el-descriptions-item label="场景数">{{ script.scenes?.length || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="谜题数" :span="2">
                    {{ getTotalPuzzles() }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-card>
        </div>

        <div v-if="isTesting" class="game-area">
          <div class="game-header">
            <div class="progress-info">
              <el-progress 
                :percentage="getProgressPercent()" 
                :format="() => `场景 ${gameState.currentSceneIndex + 1}/${totalScenes} · 谜题 ${gameState.solvedPuzzles}/${totalPuzzles}`"
              />
            </div>
          </div>

          <div v-if="!gameState.finished" class="game-puzzle">
            <el-card v-if="currentPuzzle">
              <template #header>
                <div class="puzzle-card-header">
                  <el-tag type="primary">场景 {{ gameState.currentSceneIndex + 1 }}: {{ getCurrentSceneName() }}</el-tag>
                  <span class="puzzle-order">谜题 {{ getPuzzleOrder() }}</span>
                </div>
              </template>
              
              <div class="puzzle-content">
                <div class="puzzle-name">
                  <h3>{{ currentPuzzle.name }}</h3>
                </div>
                <div class="puzzle-text">
                  <h4>谜面：</h4>
                  <p>{{ currentPuzzle.puzzleText }}</p>
                </div>
                
                <el-divider />
                
                <div class="answer-area">
                  <h4>你的答案：</h4>
                  <el-input 
                    v-model="playerAnswer"
                    placeholder="请输入答案..."
                    @keyup.enter="submitAnswer"
                    :disabled="showingResult"
                  >
                    <template #append>
                      <el-button 
                        :type="showingResult ? (lastAnswerCorrect ? 'success' : 'warning')" 
                        @click="submitAnswer"
                        :disabled="showingResult"
                      >
                        提交
                      </el-button>
                    </template>
                  </el-input>
                  
                  <div v-if="showingResult" class="result-message" :class="lastAnswerCorrect ? 'success' : 'error'">
                    <el-icon><Check v-if="lastAnswerCorrect" /><Close v-else /></el-icon>
                    <span>{{ lastMessage }}</span>
                  </div>
                </div>

                <div v-if="showingResult && !lastAnswerCorrect" class="hint-area">
                  <el-alert title="提示" type="info" :closable="false">
                    <p>解谜方式：{{ currentPuzzle.solutionMethod }}</p>
                  </el-alert>
                </div>

                <div class="action-buttons">
                  <el-button 
                    type="warning" 
                    @click="skipPuzzle"
                    :disabled="showingResult && !lastAnswerCorrect"
                  >
                    跳过此谜题
                  </el-button>
                  <el-button @click="exitTest">退出测试</el-button>
                </div>
              </div>
            </el-card>

            <el-card v-else class="no-puzzle-card">
              <el-empty description="当前场景没有谜题，自动进入下一场景..." />
            </el-card>
          </div>

          <div v-else class="game-finished">
            <el-result
              icon="success"
              title="恭喜通关！"
              sub-title="您已成功体验完整个剧本"
            >
              <template #extra>
                <el-button type="primary" @click="showReport">
                  查看分析报告
                </el-button>
                <el-button @click="restartTest">
                  重新测试
                </el-button>
                <el-button @click="goBack">
                  返回编辑
                </el-button>
              </template>
            </el-result>
          </div>
        </div>

        <div v-if="showingReport" class="report-area">
          <el-card>
            <template #header>
              <div class="report-header">
                <h3>剧本分析报告</h3>
                <el-tag :type="report?.passed ? 'success' : 'danger'" size="large">
                  {{ report?.passed ? '通过' : '存在问题' }}
                </el-tag>
              </div>
            </template>

            <div v-if="report" class="report-content">
              <div class="report-summary">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-statistic title="场景总数" :value="report.totalScenes" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="通过场景" :value="report.completedScenes" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="谜题总数" :value="report.totalPuzzles" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="通过谜题" :value="report.solvedPuzzles" />
                  </el-col>
                </el-row>
              </div>

              <el-divider />

              <div v-if="report.overallIssues?.length > 0" class="issues-section">
                <h4><el-icon><Warning /></el-icon> 整体问题</h4>
                <el-alert
                  v-for="(issue, index) in report.overallIssues"
                  :key="index"
                  :title="issue"
                  type="error"
                  :closable="false"
                  style="margin-bottom: 10px;"
                />
              </div>

              <div v-if="report.suggestions?.length > 0" class="suggestions-section">
                <h4><el-icon><LightBulb /></el-icon> 优化建议</h4>
                <el-alert
                  v-for="(suggestion, index) in report.suggestions"
                  :key="index"
                  :title="suggestion"
                  type="success"
                  :closable="false"
                  style="margin-bottom: 10px;"
                />
              </div>

              <el-divider />

              <div class="scenes-section">
                <h4><el-icon><Picture /></el-icon> 场景详情</h4>
                <el-collapse accordion>
                  <el-collapse-item 
                    v-for="(sceneResult, index) in report.sceneResults" 
                    :key="sceneResult.sceneId"
                    :name="sceneResult.sceneId"
                  >
                    <template #title>
                      <div class="scene-title">
                        <el-tag :type="sceneResult.passed ? 'success' : 'danger'" size="small">
                          场景 {{ index + 1 }}
                        </el-tag>
                        <span class="scene-name">{{ sceneResult.sceneName }}</span>
                        <el-tag v-if="sceneResult.passed" type="success" effect="plain">通过</el-tag>
                        <el-tag v-else type="danger" effect="plain">问题</el-tag>
                      </div>
                    </template>

                    <div class="scene-detail">
                      <div v-if="sceneResult.issues?.length > 0" class="scene-issues">
                        <h5>问题：</h5>
                        <ul>
                          <li v-for="(issue, i) in sceneResult.issues" :key="i">{{ issue }}</li>
                        </ul>
                      </div>

                      <div v-if="sceneResult.suggestions?.length > 0" class="scene-suggestions">
                        <h5>建议：</h5>
                        <ul>
                          <li v-for="(suggestion, i) in sceneResult.suggestions" :key="i">{{ suggestion }}</li>
                        </ul>
                      </div>

                      <div v-if="sceneResult.puzzleResults?.length > 0" class="puzzles-detail">
                        <el-divider />
                        <h5>谜题详情：</h5>
                        <el-table :data="sceneResult.puzzleResults" size="small" border>
                          <el-table-column prop="orderIndex" label="序号" width="60" />
                          <el-table-column prop="name" label="谜题名称" />
                          <el-table-column label="状态" width="80">
                            <template #default="{ row }">
                              <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
                                {{ row.passed ? '通过' : '问题' }}
                              </el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column prop="answer" label="答案" show-overflow-tooltip />
                          <el-table-column label="问题" min-width="200">
                            <template #default="{ row }">
                              <div v-if="row.issues?.length > 0" class="puzzle-issues">
                                <el-tag 
                                  v-for="(issue, i) in row.issues" 
                                  :key="i" 
                                  type="danger" 
                                  effect="plain"
                                  size="small"
                                  style="margin: 2px;"
                                >
                                  {{ issue }}
                                </el-tag>
                              </div>
                              <span v-else>-</span>
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>

              <div class="report-actions">
                <el-button type="primary" @click="restartTest">
                  开始模拟测试
                </el-button>
                <el-button @click="goBack">
                  返回编辑
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Document, VideoPlay, Check, Close, Warning, LightBulb, Picture } from '@element-plus/icons-vue'
import { scriptApi, testApi } from '../api'

const route = useRoute()
const router = useRouter()

const scriptId = computed(() => parseInt(route.params.id))
const script = ref(null)
const isTesting = ref(false)
const showingReport = ref(false)
const report = ref(null)
const gameState = ref(null)
const currentPuzzle = ref(null)
const playerAnswer = ref('')
const showingResult = ref(false)
const lastAnswerCorrect = ref(false)
const lastMessage = ref('')

const totalScenes = computed(() => script.value?.scenes?.length || 0)
const totalPuzzles = computed(() => getTotalPuzzles())

function getTotalPuzzles() {
  if (!script.value?.scenes) return 0
  return script.value.scenes.reduce((count, scene) => {
    return count + (scene.puzzles?.length || 0)
  }, 0)
}

function getProgressPercent() {
  if (!gameState.value || totalPuzzles.value === 0) return 0
  return Math.round((gameState.value.solvedPuzzles / totalPuzzles.value) * 100)
}

function getCurrentSceneName() {
  if (!script.value?.scenes || !gameState.value) return ''
  return script.value.scenes[gameState.value.currentSceneIndex]?.name || ''
}

function getPuzzleOrder() {
  if (!gameState.value || !currentPuzzle.value) return '?'
  const scene = script.value?.scenes?.[gameState.value.currentSceneIndex]
  if (!scene?.puzzles) return '?'
  
  const index = scene.puzzles.findIndex(p => p.id === currentPuzzle.value.id)
  return `${index + 1}/${scene.puzzles.length}`
}

const loadScript = async () => {
  try {
    const res = await scriptApi.getById(scriptId.value)
    script.value = res.data
  } catch (error) {
    ElMessage.error('加载剧本失败')
  }
}

const startTest = async () => {
  try {
    const res = await testApi.start(scriptId.value)
    gameState.value = res.data.state
    currentPuzzle.value = res.data.currentPuzzle
    isTesting.value = true
    showingReport.value = false
    playerAnswer.value = ''
    showingResult.value = false
  } catch (error) {
    ElMessage.error('开始测试失败')
  }
}

const submitAnswer = async () => {
  if (!playerAnswer.value.trim()) {
    ElMessage.warning('请输入答案')
    return
  }
  
  try {
    const res = await testApi.submitAnswer(scriptId.value, {
      puzzleId: currentPuzzle.value.id,
      answer: playerAnswer.value,
      state: gameState.value
    })
    
    showingResult.value = true
    lastAnswerCorrect.value = res.data.success
    lastMessage.value = res.data.message
    
    if (res.data.success) {
      gameState.value = res.data.state
      
      if (gameState.value.finished) {
        setTimeout(() => {
          isTesting.value = false
        }, 1500)
      } else {
        currentPuzzle.value = res.data.nextPuzzle
        setTimeout(() => {
          playerAnswer.value = ''
          showingResult.value = false
        }, 1000)
      }
    }
  } catch (error) {
    ElMessage.error('提交失败')
  }
}

const skipPuzzle = async () => {
  try {
    const res = await testApi.skipPuzzle(scriptId.value, {
      puzzleId: currentPuzzle.value?.id,
      state: gameState.value
    })
    
    gameState.value = res.data.state
    
    if (gameState.value.finished) {
      isTesting.value = false
      ElMessage.success('测试完成')
    } else {
      currentPuzzle.value = res.data.nextPuzzle
      playerAnswer.value = ''
      showingResult.value = false
      ElMessage.info('已跳过此谜题')
    }
  } catch (error) {
    ElMessage.error('跳过失败')
  }
}

const exitTest = () => {
  isTesting.value = false
}

const restartTest = () => {
  showingReport.value = false
  startTest()
}

const showReport = async () => {
  try {
    const res = await testApi.getReport(scriptId.value)
    report.value = res.data
    showingReport.value = true
    isTesting.value = false
  } catch (error) {
    ElMessage.error('生成报告失败')
  }
}

const goBack = () => {
  router.push(`/scripts/${scriptId.value}`)
}

onMounted(() => {
  loadScript()
})
</script>

<style scoped>
.test-viewer {
  min-height: 100vh;
  background: #f5f7fa;
}

.test-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
}

.header-right {
  display: flex;
  gap: 10px;
}

.test-content {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.intro-content {
  padding: 20px 0;
}

.intro-text {
  margin-top: 30px;
  padding: 20px;
  background: #f0f9ff;
  border-radius: 8px;
}

.intro-text p {
  margin: 10px 0;
}

.intro-text ul {
  margin: 10px 0 0 20px;
}

.intro-text li {
  margin: 5px 0;
  color: #666;
}

.script-info {
  margin-top: 20px;
}

.game-area {
  max-width: 700px;
  margin: 0 auto;
}

.game-header {
  margin-bottom: 20px;
}

.puzzle-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.puzzle-order {
  font-weight: bold;
  color: #409eff;
}

.puzzle-content {
  padding: 10px 0;
}

.puzzle-name h3 {
  margin: 0 0 15px 0;
  color: #303133;
}

.puzzle-text h4 {
  margin: 0 0 10px 0;
  color: #606266;
}

.puzzle-text p {
  margin: 0;
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.answer-area {
  margin-top: 20px;
}

.answer-area h4 {
  margin: 0 0 10px 0;
  color: #606266;
}

.result-message {
  margin-top: 15px;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-message.success {
  background: #f0f9eb;
  color: #67c23a;
}

.result-message.error {
  background: #fef0f0;
  color: #f56c6c;
}

.hint-area {
  margin-top: 15px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.no-puzzle-card {
  text-align: center;
}

.game-finished {
  text-align: center;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-header h3 {
  margin: 0;
}

.report-summary {
  padding: 20px 0;
}

.issues-section h4,
.suggestions-section h4,
.scenes-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 15px 0;
}

.scene-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.scene-name {
  font-weight: 500;
  flex: 1;
}

.scene-detail {
  padding: 10px 0;
}

.scene-issues ul,
.scene-suggestions ul {
  margin: 10px 0 0 20px;
  color: #666;
}

.scene-issues li,
.scene-suggestions li {
  margin: 5px 0;
}

.puzzles-detail {
  margin-top: 15px;
}

.puzzle-issues {
  display: flex;
  flex-wrap: wrap;
}

.report-actions {
  margin-top: 30px;
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>
