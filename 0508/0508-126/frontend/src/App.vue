<template>
  <div class="app-container">
    <header class="header">
      <h1>🌟 恒星光谱分类教学工具</h1>
      <p class="subtitle">通过拖动滑块匹配光谱线，学习恒星的光谱类型（O, B, A, F, G, K, M）</p>
    </header>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">总尝试次数</span>
        <span class="stat-value">{{ stats.totalAttempts }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">正确次数</span>
        <span class="stat-value">{{ stats.correctAttempts }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">正确率</span>
        <span class="stat-value">{{ stats.accuracy.toFixed(1) }}%</span>
      </div>
    </div>

    <div class="main-content">
      <div class="spectrum-section">
        <div class="redshift-control">
          <h3>🌌 红移模拟 (Redshift)</h3>
          <div class="redshift-slider-container">
            <div class="redshift-info">
              <div class="redshift-main">
                <span class="z-label">z =</span>
                <span class="z-value" :class="{ redshift: redshift > 0, blueshift: redshift < 0 }">
                  {{ redshift.toFixed(3) }}
                </span>
              </div>
              <div class="redshift-status">
                <span v-if="redshift > 0" class="redshift-badge">🔴 红移 - 天体远离我们</span>
                <span v-else-if="redshift < 0" class="blueshift-badge">🔵 蓝移 - 天体靠近我们</span>
                <span v-else class="no-shift-badge">⚪ 静止参考系</span>
              </div>
            </div>
            <div class="redshift-slider-wrapper">
              <input 
                type="range" 
                min="-0.1"
                max="0.2"
                step="0.001"
                v-model="redshift"
                class="redshift-slider"
              />
              <div class="redshift-ticks">
                <span>-0.1</span>
                <span>-0.05</span>
                <span>0</span>
                <span>0.05</span>
                <span>0.1</span>
                <span>0.15</span>
                <span>0.2</span>
              </div>
            </div>
            <div class="redshift-actions">
              <button class="btn-small" @click="resetRedshift">重置 z=0</button>
              <button class="btn-small" @click="setPreset('local')">本地星系 z=0.001</button>
              <button class="btn-small" @click="setPreset('nearby')">近邻星系 z=0.01</button>
              <button class="btn-small" @click="setPreset('medium')">中等距离 z=0.05</button>
              <button class="btn-small" @click="setPreset('distant')">遥远星系 z=0.1</button>
            </div>
          </div>
          <div class="redshift-formula">
            <p><strong>公式:</strong> λ<sub>观测</sub> = λ<sub>静止</sub> × (1 + z)</p>
            <p class="formula-hint">
              拖动滑块观察所有谱线如何整体向<em>长波（红）</em>或<em>短波（蓝）</em>方向移动
            </p>
          </div>
        </div>

        <div class="spectrum-card">
          <h2>🎯 目标光谱（待分类）</h2>
          <div class="chart-container">
            <SpectrumChart 
              :wavelengths="targetSpectrum?.wavelengths" 
              :intensities="targetSpectrum?.intensities"
              color="#ff6b6b"
              :showLegend="false"
              :redshift="redshift"
            />
          </div>
          <div v-if="showResult" class="target-reveal">
            <p>正确类型: <span :style="{color: result.color}">{{ result.correctType }}</span></p>
            <p>温度: {{ result.correctTemperature.toFixed(0) }} K</p>
          </div>
        </div>

        <div class="spectrum-card">
          <h2>🔧 你的光谱模型</h2>
          <div class="chart-container">
            <SpectrumChart 
              :wavelengths="userSpectrum?.wavelengths" 
              :intensities="userSpectrum?.intensities"
              :lines="userSpectrum?.lines"
              color="#4ecdc4"
              :showLegend="false"
              :redshift="redshift"
            />
          </div>
          <div class="match-info">
            <div class="match-score" v-if="showResult">
              <span class="score-label">匹配度</span>
              <span class="score-value" :class="{ good: result.matchScore >= 70, bad: result.matchScore < 50 }">
                {{ result.matchScore.toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="controls-section">
        <div class="control-card">
          <h3>选择恒星类型</h3>
          <div class="type-selector">
            <button 
              v-for="type in starTypes" 
              :key="type"
              :class="['type-btn', { active: selectedType === type }]"
              :style="{ borderColor: getTypeColor(type) }"
              @click="selectType(type)"
              :disabled="showResult"
            >
              {{ type }}
            </button>
          </div>
          <div class="type-info" v-if="typeInfo">
            <p><strong>温度范围:</strong> {{ typeInfo.minTemp }} - {{ typeInfo.maxTemp }} K</p>
            <p><strong>颜色:</strong> <span :style="{color: typeInfo.color}">{{ typeInfo.colorName }}</span></p>
            <p class="desc">{{ typeInfo.description }}</p>
          </div>
        </div>

        <div class="control-card">
          <h3>调整有效温度</h3>
          <div class="slider-container">
            <input 
              type="range" 
              :min="typeInfo?.minTemp || 2400"
              :max="typeInfo?.maxTemp || 60000"
              step="100"
              v-model="temperature"
              class="temperature-slider"
              :disabled="showResult"
            />
            <div class="slider-values">
              <span>{{ temperature.toFixed(0) }} K</span>
              <span class="temp-color" :style="{color: getTypeColor(selectedType)}">
                {{ typeInfo?.colorName }}
              </span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button 
            v-if="!showResult"
            class="btn btn-primary"
            @click="submitClassification"
          >
            ✅ 提交分类结果
          </button>
          <button 
            v-if="showResult"
            class="btn btn-success"
            @click="nextTarget"
          >
            ➡️ 下一个目标
          </button>
          <button 
            class="btn btn-secondary"
            @click="generateNewTarget"
          >
            🔄 重新生成目标
          </button>
        </div>

        <div v-if="showResult" class="result-card" :class="{ correct: result.isCorrect, incorrect: !result.isCorrect }">
          <h3>{{ result.isCorrect ? '🎉 分类正确！' : '❌ 分类有误' }}</h3>
          <p class="explanation">{{ result.explanation }}</p>
        </div>
      </div>
    </div>

    <div class="learning-section">
      <h2>📖 MK光谱分类学习指南</h2>
      <div class="type-comparison">
        <div class="comparison-row">
          <div class="comparison-label">
            <strong>氢巴耳末线强度趋势:</strong>
          </div>
          <div class="hydrogen-trend">
            <span class="weak">O</span>
            <span class="moderate">B</span>
            <span class="strongest">A ⭐最强</span>
            <span class="moderate">F</span>
            <span class="weak">G</span>
            <span class="very-weak">K</span>
            <span class="none">M</span>
          </div>
        </div>
        <p class="hint">💡 <strong>关键提示：</strong>A型星的氢巴耳末线(Hα, Hβ, Hγ, Hδ)是所有类型中最深最强的！这是区分A型与B型星的关键特征。</p>
      </div>
      
      <div class="key-features">
        <div class="feature-card">
          <h4>🔵 O型星 (30000-60000K)</h4>
          <p>He II电离氦线强，氢线弱，巴耳末跳变几乎不可见</p>
        </div>
        <div class="feature-card">
          <h4>🔵 B型星 (10000-30000K)</h4>
          <p>中性He I线强，氢线增强但<strong>未达A型星强度</strong></p>
        </div>
        <div class="feature-card highlight">
          <h4>⚪ A型星 (7500-10000K)</h4>
          <p><strong>氢巴耳末线最强！</strong>He I线消失，Ca II线开始出现，巴耳末跳变显著</p>
        </div>
        <div class="feature-card">
          <h4>🟡 F型星 (6000-7500K)</h4>
          <p>氢线减弱，Ca II线明显增强，G带(CH)出现</p>
        </div>
        <div class="feature-card">
          <h4>🟠 G型星 (5000-6000K)</h4>
          <p>氢线较弱，Ca II线强，G带显著（太阳型）</p>
        </div>
        <div class="feature-card">
          <h4>🟠 K型星 (3500-5000K)</h4>
          <p>氢线极弱，TiO分子带开始出现，金属线非常强</p>
        </div>
        <div class="feature-card">
          <h4>🔴 M型星 (2400-3500K)</h4>
          <p>分子带(TiO、VO)主导光谱，氢线几乎不可见</p>
        </div>
      </div>
    </div>

    <div class="sdss-section">
      <h2>📚 SDSS真实光谱示例 - 切换对比各类型特征</h2>
      <div class="sdss-tabs">
        <button 
          v-for="type in starTypes" 
          :key="type"
          :class="['sdss-tab', { active: selectedSdssType === type }]"
          @click="loadSdssSample(type)"
        >
          {{ type }}型
        </button>
      </div>
      <div class="sdss-chart">
        <SpectrumChart 
          :wavelengths="sdssSpectrum?.wavelengths" 
          :intensities="sdssSpectrum?.intensities"
          color="#ffd93d"
          title="SDSS " + selectedSdssType + " 型星光谱"
        />
      </div>
      <p class="sdss-hint">
        💡 建议依次点击 <strong>B</strong> → <strong>A</strong> → <strong>F</strong> 观察氢线强度变化！
        注意A型星的Hβ(486nm)和Hγ(434nm)吸收线明显更深。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import SpectrumChart from './components/SpectrumChart.vue'

const starTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M']
const typeColors = {
  'O': '#0066FF',
  'B': '#87CEFA',
  'A': '#FFFFFF',
  'F': '#FFFFE0',
  'G': '#FFD700',
  'K': '#FFA500',
  'M': '#FF4500'
}

const targetSpectrum = ref(null)
const userSpectrum = ref(null)
const selectedType = ref('G')
const temperature = ref(5500)
const redshift = ref(0)
const typeInfo = ref(null)
const showResult = ref(false)
const result = ref(null)
const selectedSdssType = ref('G')
const sdssSpectrum = ref(null)
const stats = ref({
  totalAttempts: 0,
  correctAttempts: 0,
  accuracy: 0
})

const redshiftPresets = {
  local: 0.001,
  nearby: 0.01,
  medium: 0.05,
  distant: 0.1
}

const getTypeColor = (type) => typeColors[type] || '#ffffff'

const loadTargetSpectrum = async () => {
  try {
    const response = await axios.get('/api/spectrum/target')
    targetSpectrum.value = response.data
  } catch (error) {
    console.error('加载目标光谱失败:', error)
  }
}

const loadUserSpectrum = async () => {
  if (!selectedType.value) return
  try {
    const response = await axios.get('/api/spectrum/generate', {
      params: {
        type: selectedType.value,
        temperature: temperature.value
      }
    })
    userSpectrum.value = response.data
  } catch (error) {
    console.error('生成用户光谱失败:', error)
  }
}

const loadTypeInfo = async () => {
  try {
    const response = await axios.get(`/api/spectrum/types/${selectedType.value}`)
    typeInfo.value = response.data
  } catch (error) {
    console.error('加载类型信息失败:', error)
  }
}

const loadStats = async () => {
  try {
    const response = await axios.get('/api/spectrum/stats')
    stats.value = response.data
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const selectType = (type) => {
  selectedType.value = type
  const info = typeInfo.value
  if (info) {
    temperature.value = (info.minTemp + info.maxTemp) / 2
  }
}

const loadSdssSample = async (type) => {
  selectedSdssType.value = type
  try {
    const response = await axios.get(`/api/spectrum/sdss/${type}`)
    sdssSpectrum.value = response.data
  } catch (error) {
    console.error('加载SDSS样本失败:', error)
  }
}

const submitClassification = async () => {
  try {
    const response = await axios.post('/api/spectrum/classify', {
      selectedType: selectedType.value,
      selectedTemperature: temperature.value,
      targetType: targetSpectrum.value.type,
      targetTemperature: targetSpectrum.value.temperature,
      targetIntensities: targetSpectrum.value.intensities
    })
    result.value = response.data.result
    stats.value = {
      totalAttempts: response.data.totalAttempts,
      correctAttempts: response.data.correctAttempts,
      accuracy: response.data.accuracy
    }
    showResult.value = true
  } catch (error) {
    console.error('提交分类失败:', error)
  }
}

const generateNewTarget = async () => {
  await loadTargetSpectrum()
  showResult.value = false
  result.value = null
}

const nextTarget = async () => {
  await loadTargetSpectrum()
  showResult.value = false
  result.value = null
}

const resetRedshift = () => {
  redshift.value = 0
}

const setPreset = (preset) => {
  if (redshiftPresets[preset] !== undefined) {
    redshift.value = redshiftPresets[preset]
  }
}

watch([selectedType, temperature], () => {
  loadUserSpectrum()
})

watch(selectedType, () => {
  loadTypeInfo()
})

onMounted(async () => {
  await loadTargetSpectrum()
  await loadTypeInfo()
  await loadUserSpectrum()
  await loadStats()
  await loadSdssSample('G')
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #a0a0a0;
  font-size: 1.1rem;
}

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  color: #888;
  font-size: 0.9rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #4ecdc4;
}

.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.spectrum-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.spectrum-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.spectrum-card h2 {
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.chart-container {
  height: 300px;
}

.target-reveal {
  display: flex;
  gap: 30px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.target-reveal p {
  font-size: 0.95rem;
}

.match-info {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.match-score {
  display: flex;
  align-items: center;
  gap: 15px;
}

.score-label {
  color: #888;
}

.score-value {
  font-size: 2rem;
  font-weight: bold;
  color: #ffd93d;
}

.score-value.good {
  color: #4ecdc4;
}

.score-value.bad {
  color: #ff6b6b;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.control-card h3 {
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.type-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.type-btn {
  padding: 12px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.type-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.type-btn.active {
  background: rgba(255, 255, 255, 0.15);
}

.type-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.type-info {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.type-info p {
  margin: 5px 0;
  font-size: 0.9rem;
  color: #a0a0a0;
}

.type-info .desc {
  color: #888;
  font-style: italic;
  margin-top: 10px;
}

.slider-container {
  padding: 10px 0;
}

.temperature-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  -webkit-appearance: none;
}

.temperature-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4ecdc4, #45b7d1);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(78, 205, 196, 0.5);
}

.temperature-slider:disabled {
  opacity: 0.5;
}

.slider-values {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.temp-color {
  font-weight: bold;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #4ecdc4, #45b7d1);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(78, 205, 196, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: white;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(108, 92, 231, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.result-card {
  padding: 20px;
  border-radius: 15px;
  text-align: center;
}

.result-card.correct {
  background: rgba(78, 205, 196, 0.15);
  border: 1px solid #4ecdc4;
}

.result-card.incorrect {
  background: rgba(255, 107, 107, 0.15);
  border: 1px solid #ff6b6b;
}

.result-card h3 {
  margin-bottom: 10px;
}

.explanation {
  color: #a0a0a0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.sdss-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sdss-section h2 {
  margin-bottom: 20px;
  font-size: 1.3rem;
}

.sdss-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.sdss-tab {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 8px;
  color: #a0a0a0;
  cursor: pointer;
  transition: all 0.3s;
}

.sdss-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.sdss-tab.active {
  background: rgba(255, 217, 61, 0.2);
  color: #ffd93d;
  font-weight: bold;
}

.sdss-chart {
  height: 350px;
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

.learning-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.learning-section h2 {
  margin-bottom: 20px;
  font-size: 1.3rem;
}

.type-comparison {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.comparison-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.comparison-label {
  color: #a0a0a0;
  font-size: 0.95rem;
}

.hydrogen-trend {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.hydrogen-trend span {
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.9rem;
}

.hydrogen-trend .weak {
  background: rgba(100, 100, 100, 0.3);
  color: #888;
}

.hydrogen-trend .moderate {
  background: rgba(78, 205, 196, 0.2);
  color: #4ecdc4;
}

.hydrogen-trend .strongest {
  background: rgba(255, 217, 61, 0.3);
  color: #ffd93d;
  border: 2px solid #ffd93d;
}

.hydrogen-trend .very-weak {
  background: rgba(100, 100, 100, 0.2);
  color: #666;
}

.hydrogen-trend .none {
  background: rgba(100, 100, 100, 0.15);
  color: #555;
}

.hint {
  margin-top: 15px;
  padding: 12px;
  background: rgba(255, 217, 61, 0.1);
  border-left: 3px solid #ffd93d;
  border-radius: 0 8px 8px 0;
  color: #ffd93d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.key-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.feature-card.highlight {
  background: rgba(255, 217, 61, 0.1);
  border-color: rgba(255, 217, 61, 0.4);
}

.feature-card h4 {
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.feature-card p {
  color: #a0a0a0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.sdss-hint {
  margin-top: 15px;
  padding: 12px;
  background: rgba(78, 205, 196, 0.1);
  border-left: 3px solid #4ecdc4;
  border-radius: 0 8px 8px 0;
  color: #4ecdc4;
  font-size: 0.9rem;
  line-height: 1.5;
}

.redshift-control {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 5px;
}

.redshift-control h3 {
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.redshift-slider-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.redshift-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.redshift-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.z-label {
  font-size: 1rem;
  color: #a0a0a0;
}

.z-value {
  font-size: 1.5rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.z-value.redshift {
  color: #ff6b6b;
}

.z-value.blueshift {
  color: #4ecdc4;
}

.redshift-status {
  display: flex;
  gap: 8px;
}

.redshift-badge,
.blueshift-badge,
.no-shift-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.redshift-badge {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.4);
}

.blueshift-badge {
  background: rgba(78, 205, 196, 0.2);
  color: #4ecdc4;
  border: 1px solid rgba(78, 205, 196, 0.4);
}

.no-shift-badge {
  background: rgba(255, 255, 255, 0.1);
  color: #a0a0a0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.redshift-slider-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.redshift-slider {
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(90deg, #4ecdc4 0%, #555 33.33%, #555 66.67%, #ff6b6b 100%);
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.redshift-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(108, 92, 231, 0.5);
  border: 3px solid white;
  transition: transform 0.2s;
}

.redshift-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.redshift-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #666;
  font-family: 'Courier New', monospace;
}

.redshift-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-small {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #a0a0a0;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-small:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #e0e0e0;
}

.redshift-formula {
  margin-top: 12px;
  padding: 12px;
  background: rgba(108, 92, 231, 0.1);
  border-radius: 8px;
  border-left: 3px solid #6c5ce7;
}

.redshift-formula p {
  margin: 0;
  font-size: 0.9rem;
  color: #a0a0a0;
}

.redshift-formula .formula-hint {
  margin-top: 6px;
  font-size: 0.85rem;
  color: #888;
}

.redshift-formula .formula-hint em {
  color: #6c5ce7;
  font-style: normal;
  font-weight: 500;
}

@media (max-width: 768px) {
  .stats-bar {
    flex-direction: column;
    gap: 15px;
  }
  
  .type-selector {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .comparison-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .hydrogen-trend {
    justify-content: center;
  }
}
</style>
