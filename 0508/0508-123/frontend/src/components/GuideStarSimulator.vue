<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { guideStarApi } from '@/api'
import type { 
  GuideStarCatalog, GuideStarRequest, GuideStarResponse, 
  GuideStarAnalysis, CorrectionSuggestion 
} from '@/types'
import dayjs from 'dayjs'

const props = defineProps<{
  telescopeId: number
  targetRa: number
  targetDec: number
  targetName: string
  observationTime: string
  exposureTime?: number
}>()

const emit = defineEmits<{
  (e: 'guide-star-selected', star: GuideStarCatalog): void
  (e: 'simulation-complete', result: GuideStarResponse): void
}>()

const starCatalog = ref<GuideStarCatalog[]>([])
const recommendedStars = ref<GuideStarCatalog[]>([])
const selectedStar = ref<GuideStarCatalog | null>(null)
const simulationResult = ref<GuideStarResponse | null>(null)
const isLoading = ref(false)
const isSimulating = ref(false)
const error = ref('')
const showCustomStar = ref(false)

const customStar = ref({
  name: '',
  ra: 0,
  dec: 0,
  magnitude: 5.0,
  constellation: '自定义'
})

const loadStarCatalog = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const response = await guideStarApi.getCatalog()
    starCatalog.value = response.data
  } catch (err: any) {
    error.value = '加载导星星表失败: ' + (err.message || '未知错误')
  } finally {
    isLoading.value = false
  }
}

const loadRecommendedStars = async () => {
  if (!props.targetRa || !props.targetDec || !props.observationTime) return
  
  try {
    const response = await guideStarApi.getRecommended(
      props.targetRa, 
      props.targetDec, 
      props.observationTime
    )
    recommendedStars.value = response.data
  } catch (err: any) {
    console.error('加载推荐导星失败:', err)
  }
}

const selectStar = (star: GuideStarCatalog) => {
  selectedStar.value = star
  emit('guide-star-selected', star)
}

const addCustomStar = () => {
  if (!customStar.value.name.trim()) {
    error.value = '请输入参考星名称'
    return
  }
  if (customStar.value.ra < 0 || customStar.value.ra > 24) {
    error.value = '赤经应在 0-24 小时之间'
    return
  }
  if (customStar.value.dec < -90 || customStar.value.dec > 90) {
    error.value = '赤纬应在 -90 到 90 度之间'
    return
  }
  
  const star: GuideStarCatalog = {
    name: customStar.value.name,
    ra: customStar.value.ra,
    dec: customStar.value.dec,
    magnitude: customStar.value.magnitude,
    constellation: customStar.value.constellation
  }
  
  selectedStar.value = star
  emit('guide-star-selected', star)
  showCustomStar.value = false
}

const runSimulation = async () => {
  if (!selectedStar.value) {
    error.value = '请先选择一颗参考星'
    return
  }
  
  isSimulating.value = true
  error.value = ''
  simulationResult.value = null
  
  try {
    const request: GuideStarRequest = {
      telescopeId: props.telescopeId,
      guideStarName: selectedStar.value.name,
      guideStarRa: selectedStar.value.ra,
      guideStarDec: selectedStar.value.dec,
      targetRa: props.targetRa,
      targetDec: props.targetDec,
      observationTime: props.observationTime,
      exposureTime: props.exposureTime || 60
    }
    
    const response = await guideStarApi.simulate(request)
    simulationResult.value = response.data
    emit('simulation-complete', response.data)
  } catch (err: any) {
    error.value = '导星模拟失败: ' + (err.response?.data?.message || err.message || '未知错误')
  } finally {
    isSimulating.value = false
  }
}

const getQualityClass = (quality: string) => {
  const map: Record<string, string> = {
    'EXCELLENT': 'status-completed',
    'GOOD': 'status-confirmed',
    'FAIR': 'status-pending',
    'POOR': 'status-cancelled'
  }
  return map[quality] || 'status-pending'
}

const getQualityText = (quality: string) => {
  const map: Record<string, string> = {
    'EXCELLENT': '优秀',
    'GOOD': '良好',
    'FAIR': '一般',
    'POOR': '较差'
  }
  return map[quality] || quality
}

const getPriorityBadgeClass = (priority: string) => {
  const map: Record<string, string> = {
    'HIGH': 'status-cancelled',
    'MEDIUM': 'status-pending',
    'LOW': 'status-confirmed'
  }
  return map[priority] || 'status-pending'
}

const getSuggestionIcon = (type: string) => {
  const map: Record<string, string> = {
    'POSITIVE': '✓',
    'WARNING': '⚠',
    'CORRECTION': '🛠',
    'INFO': 'ℹ'
  }
  return map[type] || '•'
}

const maxTotalError = computed(() => {
  if (!simulationResult.value) return 0
  return Math.max(...simulationResult.value.errorCurve.map(p => Math.abs(p.totalError)))
})

watch(() => props.targetRa, loadRecommendedStars)
watch(() => props.targetDec, loadRecommendedStars)
watch(() => props.observationTime, loadRecommendedStars)

loadStarCatalog()
loadRecommendedStars()
</script>

<template>
  <div class="guide-star-simulator">
    <h3>4. 自动导星模拟 (可选)</h3>
    <p style="color: #b0b0b0; margin-bottom: 16px;">
      选择一颗参考星进行导星模拟，系统将分析导星质量并给出修正建议
    </p>

    <div v-if="error" class="alert alert-error" style="margin-bottom: 16px;">{{ error }}</div>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else>
      <div class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: recommendedStars.length > 0 }"
          @click="showCustomStar = false"
        >
          推荐导星 ({{ recommendedStars.length }})
        </button>
        <button 
          class="tab-btn"
          @click="showCustomStar = false"
        >
          完整星表
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: showCustomStar }"
          @click="showCustomStar = true"
        >
          自定义
        </button>
      </div>

      <div v-if="!showCustomStar" class="star-list">
        <div 
          v-if="recommendedStars.length > 0"
          class="star-section"
        >
          <h4 style="color: #4facfe; margin-bottom: 12px;">🌟 推荐参考星 (基于目标位置和观测时间)</h4>
          <div class="star-grid">
            <div 
              v-for="star in recommendedStars" 
              :key="star.name"
              class="star-card"
              :class="{ selected: selectedStar?.name === star.name }"
              @click="selectStar(star)"
            >
              <div class="star-name">{{ star.name }}</div>
              <div class="star-info">
                <span>RA: {{ star.ra.toFixed(2) }}h</span>
                <span>Dec: {{ star.dec.toFixed(2) }}°</span>
              </div>
              <div class="star-info">
                <span class="magnitude">V: {{ star.magnitude.toFixed(2) }} mag</span>
                <span class="constellation">{{ star.constellation }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="star-section">
          <h4 style="color: #b0b0b0; margin-bottom: 12px;">📋 完整导星星表</h4>
          <div class="star-grid">
            <div 
              v-for="star in starCatalog" 
              :key="star.name"
              class="star-card"
              :class="{ selected: selectedStar?.name === star.name }"
              @click="selectStar(star)"
            >
              <div class="star-name">{{ star.name }}</div>
              <div class="star-info">
                <span>RA: {{ star.ra.toFixed(2) }}h</span>
                <span>Dec: {{ star.dec.toFixed(2) }}°</span>
              </div>
              <div class="star-info">
                <span class="magnitude">V: {{ star.magnitude.toFixed(2) }} mag</span>
                <span class="constellation">{{ star.constellation }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="custom-star-form">
        <h4>✨ 自定义参考星</h4>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">参考星名称</label>
            <input 
              v-model="customStar.name"
              type="text" 
              class="form-input" 
              placeholder="例如: 我的参考星"
            />
          </div>
          <div class="form-group">
            <label class="form-label">所在星座</label>
            <input 
              v-model="customStar.constellation"
              type="text" 
              class="form-input" 
              placeholder="例如: 猎户座"
            />
          </div>
          <div class="form-group">
            <label class="form-label">赤经 (RA, 0-24小时)</label>
            <input 
              v-model.number="customStar.ra"
              type="number" 
              step="0.01"
              min="0" 
              max="24"
              class="form-input" 
              placeholder="例如: 12.5"
            />
          </div>
          <div class="form-group">
            <label class="form-label">赤纬 (Dec, -90 到 90度)</label>
            <input 
              v-model.number="customStar.dec"
              type="number" 
              step="0.01"
              min="-90" 
              max="90"
              class="form-input" 
              placeholder="例如: 30.5"
            />
          </div>
          <div class="form-group">
            <label class="form-label">视星等</label>
            <input 
              v-model.number="customStar.magnitude"
              type="number" 
              step="0.01"
              class="form-input" 
              placeholder="例如: 5.0"
            />
          </div>
        </div>
        <button class="btn btn-primary" @click="addCustomStar">
          添加自定义参考星
        </button>
      </div>

      <div v-if="selectedStar" class="selected-star-info card" style="margin-top: 20px;">
        <h4>✓ 已选择参考星</h4>
        <div class="grid grid-3">
          <div class="spec-item">
            <span class="spec-label">名称</span>
            <span class="spec-value">{{ selectedStar.name }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">赤经/赤纬</span>
            <span class="spec-value">{{ selectedStar.ra.toFixed(2) }}h / {{ selectedStar.dec.toFixed(2) }}°</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">视星等</span>
            <span class="spec-value">{{ selectedStar.magnitude.toFixed(2) }} mag</span>
          </div>
        </div>
        <button 
          class="btn btn-primary" 
          style="width: 100%; margin-top: 16px;"
          :disabled="isSimulating"
          @click="runSimulation"
        >
          <span v-if="isSimulating">⏳ 模拟中...</span>
          <span v-else>🔭 开始导星模拟</span>
        </button>
      </div>

      <div v-if="simulationResult" class="simulation-results" style="margin-top: 20px;">
        <div class="card">
          <h4>📊 导星分析结果</h4>
          <div class="analysis-summary">
            <div class="quality-badge">
              <span class="status-badge" :class="getQualityClass(simulationResult.analysis.quality)">
                {{ getQualityText(simulationResult.analysis.quality) }}
              </span>
              <span class="quality-label">导星质量</span>
            </div>
            <div class="analysis-stats">
              <div class="stat-item">
                <span class="stat-value">{{ simulationResult.analysis.avgRmsError }}</span>
                <span class="stat-label">RMS 误差 (")</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ simulationResult.analysis.maxError }}</span>
                <span class="stat-label">最大误差 (")</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ simulationResult.analysis.separation }}</span>
                <span class="stat-label">角距离 (°)</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ simulationResult.analysis.guideStarElevation }}</span>
                <span class="stat-label">导星仰角 (°)</span>
              </div>
            </div>
          </div>
          
          <div class="analysis-details">
            <div class="spec-item">
              <span class="spec-label">导星模式</span>
              <span class="spec-value">{{ simulationResult.analysis.guidingMode }}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">目标仰角</span>
              <span class="spec-value">{{ simulationResult.analysis.targetElevation }}°</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h4>📈 导星误差曲线 (最后 10 帧)</h4>
          <div class="error-chart">
            <div class="chart-legend">
              <span><span class="legend-dot ra"></span> RA 误差</span>
              <span><span class="legend-dot dec"></span> Dec 误差</span>
              <span><span class="legend-dot total"></span> 总误差</span>
            </div>
            <div class="chart-container">
              <div 
                v-for="point in simulationResult.errorCurve.slice(-10)" 
                :key="point.frame"
                class="chart-bar-group"
              >
                <div class="chart-bars">
                  <div 
                    class="chart-bar ra"
                    :style="{ height: (Math.abs(point.raError) / maxTotalError * 80) + '%' }"
                  ></div>
                  <div 
                    class="chart-bar dec"
                    :style="{ height: (Math.abs(point.decError) / maxTotalError * 80) + '%' }"
                  ></div>
                  <div 
                    class="chart-bar total"
                    :style="{ height: (point.totalError / maxTotalError * 80) + '%' }"
                  ></div>
                </div>
                <div class="chart-label">帧 {{ point.frame }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h4>💡 修正建议</h4>
          <div class="suggestions-list">
            <div 
              v-for="(suggestion, index) in simulationResult.suggestions" 
              :key="index"
              class="suggestion-item"
              :class="suggestion.type.toLowerCase()"
            >
              <div class="suggestion-header">
                <span class="suggestion-icon">{{ getSuggestionIcon(suggestion.type) }}</span>
                <span class="suggestion-title">{{ suggestion.title }}</span>
                <span 
                  class="status-badge" 
                  :class="getPriorityBadgeClass(suggestion.priority)"
                >
                  {{ suggestion.priority === 'HIGH' ? '高' : suggestion.priority === 'MEDIUM' ? '中' : '低' }}
                </span>
              </div>
              <p class="suggestion-desc">{{ suggestion.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #b0b0b0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.star-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.star-card {
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.star-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
}

.star-card.selected {
  background: rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.star-name {
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
  font-size: 14px;
}

.star-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #808080;
  margin-top: 4px;
}

.magnitude {
  color: #4facfe;
}

.constellation {
  color: #f5576c;
}

.custom-star-form {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.custom-star-form h4 {
  margin-bottom: 16px;
}

.selected-star-info {
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.analysis-summary {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 16px;
}

.quality-badge {
  text-align: center;
}

.quality-badge .status-badge {
  font-size: 18px;
  padding: 8px 20px;
  margin-bottom: 8px;
}

.quality-label {
  font-size: 12px;
  color: #808080;
}

.analysis-stats {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #808080;
  margin-top: 4px;
}

.analysis-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.error-chart {
  margin-top: 16px;
}

.chart-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #b0b0b0;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}

.legend-dot.ra { background: #667eea; }
.legend-dot.dec { background: #f5576c; }
.legend-dot.total { background: #4facfe; }

.chart-container {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  height: 150px;
  padding-bottom: 24px;
}

.chart-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-bars {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 2px;
}

.chart-bar {
  width: 6px;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease;
}

.chart-bar.ra { background: #667eea; }
.chart-bar.dec { background: #f5576c; }
.chart-bar.total { background: #4facfe; }

.chart-label {
  font-size: 10px;
  color: #808080;
  margin-top: 4px;
  transform: rotate(-45deg);
  white-space: nowrap;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid;
}

.suggestion-item.positive {
  background: rgba(0, 255, 128, 0.05);
  border-left-color: #00ff80;
}

.suggestion-item.warning {
  background: rgba(255, 215, 0, 0.05);
  border-left-color: #ffd700;
}

.suggestion-item.correction {
  background: rgba(102, 126, 234, 0.05);
  border-left-color: #667eea;
}

.suggestion-item.info {
  background: rgba(79, 172, 254, 0.05);
  border-left-color: #4facfe;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.suggestion-icon {
  font-size: 16px;
}

.suggestion-title {
  flex: 1;
  font-weight: 600;
  color: white;
}

.suggestion-desc {
  margin: 0;
  font-size: 13px;
  color: #b0b0b0;
  margin-left: 28px;
}
</style>
