<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="title">🧋 奶茶店小料搭配评分预测器</h1>
      <p class="subtitle">选择你喜欢的茶底和小料，让 AI 告诉你这杯奶茶的受欢迎程度</p>
      <p class="learning-hint">💡 您的评分反馈将帮助系统不断学习优化</p>
    </header>

    <main class="app-main">
      <div class="selector-section">
        <el-card class="card">
          <template #header>
            <div class="card-header">
              <span>🎨 选择搭配</span>
            </div>
          </template>

          <div class="selector-group">
            <div class="selector-item">
              <label class="label">🍵 选择茶底：</label>
              <el-radio-group v-model="selectedTeaBase" size="large">
                <el-radio-button 
                  v-for="tea in teaBases" 
                  :key="tea.id" 
                  :label="tea.name"
                >
                  {{ tea.name }}
                </el-radio-button>
              </el-radio-group>
              <p class="desc" v-if="selectedTeaBaseDesc">{{ selectedTeaBaseDesc }}</p>
            </div>

            <div class="selector-item">
              <label class="label">🧊 选择小料（可多选，最多 3 种）：</label>
              <el-checkbox-group v-model="selectedToppings" size="large">
                <el-checkbox 
                  v-for="topping in toppings" 
                  :key="topping.id" 
                  :label="topping.name"
                  :disabled="selectedToppings.length >= 3 && !selectedToppings.includes(topping.name)"
                >
                  {{ topping.name }}
                </el-checkbox>
              </el-checkbox-group>
              <p class="hint" v-if="selectedToppings.length >= 3">最多选择 3 种小料</p>
            </div>

            <div class="action-area">
              <el-button 
                type="primary" 
                size="large" 
                :loading="loading"
                @click="handlePredict"
                :disabled="!selectedTeaBase"
              >
                {{ loading ? '预测中...' : '✨ 开始预测评分' }}
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <div class="result-section" v-if="result">
        <el-card class="card result-card">
          <template #header>
            <div class="card-header">
              <span>📊 预测结果</span>
              <el-button 
                type="success" 
                size="small" 
                icon="Edit"
                @click="showFeedbackDialog = true"
              >
                我要评分反馈
              </el-button>
            </div>
          </template>

          <div class="rating-display">
            <div class="rating-score">
              <span class="score">{{ result.predictedRating }}</span>
              <span class="max-score">/ 10</span>
            </div>
            <div class="rating-bar">
              <div class="rating-fill" :style="{ width: (result.predictedRating * 10) + '%' }"></div>
            </div>
            <p class="rating-desc">{{ result.ratingDescription }}</p>
          </div>

          <el-divider />

          <div class="recommendation-section">
            <div class="recommendation-block">
              <h3>🔮 类似搭配推荐</h3>
              <div class="recommendation-list">
                <el-card 
                  v-for="(item, index) in result.similarRecommendations" 
                  :key="index"
                  class="recommendation-card"
                  shadow="hover"
                  @click="selectRecommendation(item)"
                >
                  <div class="rec-header">
                    <span class="rec-tea">{{ item.teaBase }}</span>
                    <span class="rec-rating">{{ item.rating }} 分</span>
                  </div>
                  <div class="rec-toppings">
                    <span v-if="item.toppings.length">{{ item.toppings.join(' + ') }}</span>
                    <span v-else class="no-topping">无小料</span>
                  </div>
                  <p class="rec-desc">{{ item.description }}</p>
                </el-card>
              </div>
            </div>

            <el-divider />

            <div class="recommendation-block">
              <h3>🔥 热门搭配榜单</h3>
              <div class="recommendation-list">
                <el-card 
                  v-for="(item, index) in result.hotCombinations" 
                  :key="index"
                  class="recommendation-card hot"
                  shadow="hover"
                  @click="selectRecommendation(item)"
                >
                  <div class="hot-badge" v-if="index < 3">Top {{ index + 1 }}</div>
                  <div class="rec-header">
                    <span class="rec-tea">{{ item.teaBase }}</span>
                    <span class="rec-rating">{{ item.rating }} 分</span>
                  </div>
                  <div class="rec-toppings">
                    <span v-if="item.toppings.length">{{ item.toppings.join(' + ') }}</span>
                    <span v-else class="no-topping">无小料</span>
                  </div>
                  <p class="rec-desc">{{ item.description }}</p>
                </el-card>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </main>

    <el-dialog 
      v-model="showFeedbackDialog" 
      title="📝 评分反馈 - 帮助系统学习"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="feedback-content">
        <div class="feedback-info">
          <p><strong>您的搭配：</strong></p>
          <p class="feedback-combo">
            🍵 {{ selectedTeaBase }}
            <span v-if="currentToppings.length">
              + {{ currentToppings.join(' + ') }}
            </span>
          </p>
          <p><strong>系统预测：</strong></p>
          <p class="feedback-predicted">
            ⭐ {{ result?.predictedRating }} 分 - {{ result?.ratingDescription }}
          </p>
        </div>
        
        <el-divider />
        
        <div class="feedback-rating">
          <p><strong>您的实际评价（1-10 分）：</strong></p>
          <el-rate 
            v-model="actualRating" 
            :max="10" 
            :allow-half="true"
            show-score
            text-color="#ff6b6b"
            size="large"
          />
          <div class="rating-quick">
            <el-button-group>
              <el-button 
                v-for="score in [3, 5, 7, 8, 9, 10]" 
                :key="score"
                :type="actualRating === score ? 'primary' : 'default'"
                size="small"
                @click="actualRating = score"
              >
                {{ score }}分
              </el-button>
            </el-button-group>
          </div>
        </div>
        
        <div class="feedback-hint" v-if="actualRating">
          <p>{{ getFeedbackHint(actualRating) }}</p>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showFeedbackDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            :loading="submittingFeedback"
            @click="submitFeedback"
            :disabled="!actualRating"
          >
            提交反馈
          </el-button>
        </span>
      </template>
    </el-dialog>

    <footer class="app-footer">
      <p>基于反馈学习的评分预测算法 · 您的反馈让系统更智能</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from './api'

const teaBases = ref([])
const toppings = ref([])
const selectedTeaBase = ref('')
const selectedToppings = ref([])
const loading = ref(false)
const result = ref(null)
const showFeedbackDialog = ref(false)
const actualRating = ref(null)
const submittingFeedback = ref(false)

const selectedTeaBaseDesc = computed(() => {
  const tea = teaBases.value.find(t => t.name === selectedTeaBase.value)
  return tea ? tea.description : ''
})

const currentToppings = computed(() => {
  return result.value ? result.value.toppings : selectedToppings.value
})

onMounted(() => {
  loadOptions()
})

function getFeedbackHint(score) {
  if (score >= 9) return '🔥 这是神级搭配！系统会记住这个高分组合'
  if (score >= 7) return '👍 不错的搭配，感谢您的反馈'
  if (score >= 5) return '😐 一般般，系统会学习这个偏好'
  return '😕 不太受欢迎，系统会调整推荐策略'
}

async function loadOptions() {
  try {
    const [teaData, toppingData] = await Promise.all([
      api.getTeaBases(),
      api.getToppings()
    ])
    teaBases.value = teaData
    toppings.value = toppingData
    if (teaData.length > 0) {
      selectedTeaBase.value = teaData[0].name
    }
  } catch (error) {
    console.error('加载选项失败:', error)
    ElMessage.error('加载选项失败，请检查后端服务是否启动')
  }
}

async function handlePredict() {
  if (!selectedTeaBase.value) {
    ElMessage.warning('请先选择茶底')
    return
  }

  loading.value = true
  try {
    const response = await api.predict({
      teaBase: selectedTeaBase.value,
      toppings: selectedToppings.value
    })
    result.value = response
    ElMessage.success('预测完成！您可以点击右上角按钮提交实际评价')
  } catch (error) {
    console.error('预测失败:', error)
    ElMessage.error('预测失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function selectRecommendation(item) {
  selectedTeaBase.value = item.teaBase
  selectedToppings.value = [...item.toppings]
  handlePredict()
}

async function submitFeedback() {
  if (!actualRating.value) {
    ElMessage.warning('请先选择实际评分')
    return
  }
  
  if (!result.value) {
    ElMessage.warning('没有可反馈的预测结果')
    return
  }

  submittingFeedback.value = true
  try {
    await api.submitFeedback({
      teaBase: result.value.teaBase,
      toppings: result.value.toppings,
      predictedRating: result.value.predictedRating,
      actualRating: Math.round(actualRating.value)
    })
    
    showFeedbackDialog.value = false
    actualRating.value = null
    ElMessage.success('🎉 感谢您的反馈！系统已学习，下次预测会更准确')
    
    setTimeout(() => {
      handlePredict()
    }, 500)
  } catch (error) {
    console.error('提交反馈失败:', error)
    ElMessage.error('提交反馈失败，请稍后重试')
  } finally {
    submittingFeedback.value = false
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  padding: 20px;
}

.app-header {
  text-align: center;
  padding: 20px 0;
}

.title {
  font-size: 2.5rem;
  color: #8b4513;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
}

.subtitle {
  font-size: 1.1rem;
  color: #a0522d;
  margin: 0 0 8px 0;
}

.learning-hint {
  font-size: 0.95rem;
  color: #e65100;
  margin: 0;
  font-style: italic;
  background: rgba(255, 255, 255, 0.5);
  display: inline-block;
  padding: 5px 15px;
  border-radius: 20px;
}

.app-main {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 1024px) {
  .app-main {
    grid-template-columns: 400px 1fr;
    align-items: start;
  }
}

.card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 8px 32px rgba(139, 69, 19, 0.15);
}

.card-header {
  font-size: 1.2rem;
  font-weight: 600;
  color: #8b4513;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selector-group {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.selector-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.label {
  font-weight: 600;
  color: #5d4037;
  font-size: 1rem;
}

.desc {
  font-size: 0.85rem;
  color: #8d6e63;
  margin: 0;
  font-style: italic;
}

.hint {
  font-size: 0.85rem;
  color: #e65100;
  margin: 0;
}

.action-area {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.action-area .el-button {
  width: 100%;
  padding: 20px;
  font-size: 1.1rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  border: none;
}

.action-area .el-button:hover {
  background: linear-gradient(135deg, #feb47b, #ff7e5f);
}

.result-card {
  min-height: 400px;
}

.rating-display {
  text-align: center;
  padding: 20px 0;
}

.rating-score {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 5px;
}

.score {
  font-size: 4rem;
  font-weight: 700;
  color: #e65100;
  text-shadow: 2px 2px 8px rgba(230, 81, 0, 0.2);
}

.max-score {
  font-size: 1.5rem;
  color: #8d6e63;
}

.rating-bar {
  width: 80%;
  height: 12px;
  background: #ffe0b2;
  border-radius: 6px;
  margin: 20px auto;
  overflow: hidden;
}

.rating-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff7e5f, #feb47b);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.rating-desc {
  font-size: 1.3rem;
  font-weight: 600;
  color: #d84315;
  margin: 10px 0 0 0;
}

.recommendation-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recommendation-block h3 {
  color: #5d4037;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
}

.recommendation-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.recommendation-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 12px;
  position: relative;
  overflow: visible;
}

.recommendation-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(139, 69, 19, 0.2);
}

.recommendation-card.hot {
  border: 1px solid #ffe0b2;
  background: #fffaf0;
}

.hot-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  color: white;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 1;
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rec-tea {
  font-weight: 600;
  color: #5d4037;
}

.rec-rating {
  color: #e65100;
  font-weight: 600;
}

.rec-toppings {
  font-size: 0.85rem;
  color: #8d6e63;
  margin-bottom: 6px;
}

.no-topping {
  color: #bdbdbd;
  font-style: italic;
}

.rec-desc {
  font-size: 0.8rem;
  color: #a1887f;
  margin: 0;
}

.feedback-content {
  padding: 10px 0;
}

.feedback-info {
  background: #fff8e1;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.feedback-info p {
  margin: 8px 0;
  color: #5d4037;
}

.feedback-combo {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e65100;
  margin: 5px 0 15px 0;
}

.feedback-predicted {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ff7e5f;
  margin: 5px 0;
}

.feedback-rating {
  text-align: center;
  padding: 15px 0;
}

.feedback-rating p {
  color: #5d4037;
  margin: 0 0 15px 0;
}

.rating-quick {
  margin-top: 20px;
}

.feedback-hint {
  margin-top: 20px;
  padding: 10px;
  background: #f1f8e9;
  border-radius: 8px;
  text-align: center;
}

.feedback-hint p {
  margin: 0;
  color: #558b2f;
  font-weight: 500;
}

.app-footer {
  text-align: center;
  padding: 20px 0 10px;
  color: #8d6e63;
  font-size: 0.9rem;
}
</style>
