<template>
  <div class="container">
    <header class="header">
      <h1>🔮 凌星参数预测</h1>
      <p class="subtitle">基于恒星质量和行星距离的凌星事件预测</p>
      <div class="nav-links">
        <router-link to="/" class="nav-link">
          <span>← 返回模拟器</span>
        </router-link>
      </div>
    </header>

    <div class="main-content">
      <div class="left-panel">
        <el-card class="panel-card">
          <template #header>
            <div class="card-header">
              <span>⚙️ 系统参数输入</span>
            </div>
          </template>

          <el-form label-position="top">
            <h3 class="section-title">🌟 恒星参数</h3>
            <el-form-item label="恒星质量 (太阳质量)">
              <el-slider
                v-model="predictionParams.starMass"
                :min="0.1"
                :max="10"
                :step="0.1"
                :format-tooltip="val => val + ' M☉'"
              />
              <div class="slider-value">{{ predictionParams.starMass }} M☉</div>
            </el-form-item>

            <el-form-item label="恒星半径 (太阳半径)">
              <el-slider
                v-model="predictionParams.starRadius"
                :min="0.1"
                :max="50"
                :step="0.1"
                :format-tooltip="val => val + ' R☉'"
              />
              <div class="slider-value">{{ predictionParams.starRadius }} R☉</div>
            </el-form-item>

            <h3 class="section-title">🪐 行星参数</h3>
            <el-form-item label="行星半径 (地球半径)">
              <el-slider
                v-model="predictionParams.planetRadius"
                :min="0.1"
                :max="20"
                :step="0.1"
                :format-tooltip="val => val + ' R⊕'"
              />
              <div class="slider-value">{{ predictionParams.planetRadius }} R⊕</div>
            </el-form-item>

            <el-form-item label="行星距离 (天文单位 AU)">
              <el-slider
                v-model="predictionParams.planetDistance"
                :min="0.01"
                :max="10"
                :step="0.01"
                :format-tooltip="val => val + ' AU'"
              />
              <div class="slider-value">{{ predictionParams.planetDistance }} AU</div>
            </el-form-item>

            <el-form-item label="轨道倾角 (度)">
              <el-slider
                v-model="predictionParams.inclination"
                :min="80"
                :max="90"
                :step="0.1"
                :format-tooltip="val => val + '°'"
              />
              <div class="slider-value">{{ predictionParams.inclination }}°</div>
            </el-form-item>

            <el-divider>快速预设</el-divider>

            <div class="preset-buttons">
              <el-button type="primary" @click="applyPreset('earth-like')" size="small">
                🌍 类地球
              </el-button>
              <el-button type="success" @click="applyPreset('hot-jupiter')" size="small">
                🔥 热木星
              </el-button>
              <el-button type="warning" @click="applyPreset('super-earth')" size="small">
                🌎 超级地球
              </el-button>
            </div>
          </el-form>

          <el-button type="primary" @click="calculatePrediction" :loading="loading" style="width: 100%; margin-top: 20px">
            🔮 预测凌星
          </el-button>
        </el-card>
      </div>

      <div class="right-panel">
        <div v-if="!predictionResult" class="empty-state">
          <div class="empty-icon">🌌</div>
          <h3>等待参数输入</h3>
          <p>调整左侧参数，点击"预测凌星"查看结果</p>
        </div>

        <div v-else>
          <el-card class="result-card">
            <template #header>
              <div class="card-header">
                <span>📊 预测结果</span>
              </div>
            </template>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="result-item highlight">
                  <div class="result-icon">⏱️</div>
                  <div class="result-info">
                    <div class="result-label">轨道周期</div>
                    <div class="result-value">{{ predictionResult.orbitalPeriodDescription }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="result-item highlight">
                  <div class="result-icon">✨</div>
                  <div class="result-info">
                    <div class="result-label">凌星时长</div>
                    <div class="result-value">{{ predictionResult.transitDurationDescription }}</div>
                  </div>
                </div>
              </el-col>
            </el-row>

            <el-divider />

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="result-item">
                  <div class="result-info">
                    <div class="result-label">下次凌星时间</div>
                    <div class="result-value next-transit" :class="getUrgencyClass(predictionResult.nextTransitTime)">
                      {{ predictionResult.nextTransitTimeDescription }}
                    </div>
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="result-item">
                  <div class="result-info">
                    <div class="result-label">宜居带评估</div>
                    <div class="result-value habitability">
                      {{ predictionResult.habitabilityZone }}
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </el-card>

          <el-card class="details-card">
            <template #header>
              <div class="card-header">
                <span>🔬 详细参数</span>
              </div>
            </template>

            <el-row :gutter="20">
              <el-col :span="8">
                <div class="detail-item">
                  <span class="detail-label">半长轴</span>
                  <span class="detail-value">{{ predictionResult.semiMajorAxis.toFixed(4) }} AU</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <span class="detail-label">冲击参数</span>
                  <span class="detail-value" :class="getImpactClass(predictionResult.impactParameter)">
                    {{ predictionResult.impactParameter.toFixed(3) }}
                  </span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <span class="detail-label">凌星可见性</span>
                  <span class="detail-value" :class="getVisibilityClass(predictionResult.impactParameter)">
                    {{ getVisibilityText(predictionResult.impactParameter) }}
                  </span>
                </div>
              </el-col>
            </el-row>

            <el-divider />

            <div class="summary">
              <h4>📝 预测摘要</h4>
              <p>{{ predictionResult.predictionSummary }}</p>
            </div>
          </el-card>

          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>💡 科学说明</span>
              </div>
            </template>

            <div class="science-info">
              <div class="info-section">
                <h4>开普勒第三定律</h4>
                <p class="formula">P² = (4π² / GM) × a³</p>
                <p>轨道周期的平方与半长轴的立方成正比。使用恒星质量和行星距离，可以精确计算出轨道周期。</p>
              </div>

              <div class="info-section">
                <h4>凌星时长计算</h4>
                <p>凌星时长取决于：恒星半径、行星半径、轨道半径、轨道倾角。</p>
                <ul>
                  <li>入凌时间（ingress）：行星开始遮挡恒星</li>
                  <li>全凌时间（total transit）：行星完全遮挡恒星</li>
                  <li>出凌时间（egress）：行星离开恒星盘面</li>
                </ul>
              </div>

              <div class="info-section">
                <h4>冲击参数 (Impact Parameter)</h4>
                <p class="formula">b = (a cos i) / R*</p>
                <p>衡量凌星在恒星盘面上的位置：</p>
                <ul>
                  <li>b < 0.3：中央凌星，深度最大</li>
                  <li>0.3 < b < 0.7：边缘凌星</li>
                  <li>b > 0.95：可能观测不到凌星</li>
                </ul>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { predictionApi } from '../api'
import { ElMessage } from 'element-plus'

export default {
  name: 'PredictionPage',
  setup() {
    const loading = ref(false)
    const predictionResult = ref(null)

    const predictionParams = ref({
      starMass: 1.0,
      starRadius: 1.0,
      planetRadius: 1.0,
      planetDistance: 1.0,
      inclination: 89.5,
      lastTransitTime: 0
    })

    const presets = {
      'earth-like': {
        starMass: 1.0,
        starRadius: 1.0,
        planetRadius: 1.0,
        planetDistance: 1.0,
        inclination: 89.0
      },
      'hot-jupiter': {
        starMass: 1.0,
        starRadius: 1.0,
        planetRadius: 11.0,
        planetDistance: 0.05,
        inclination: 89.5
      },
      'super-earth': {
        starMass: 0.5,
        starRadius: 0.5,
        planetRadius: 2.5,
        planetDistance: 0.3,
        inclination: 89.8
      }
    }

    const applyPreset = (presetName) => {
      const preset = presets[presetName]
      if (preset) {
        Object.keys(preset).forEach(key => {
          predictionParams.value[key] = preset[key]
        })
        ElMessage.success(`已应用 "${getPresetName(presetName)}" 预设`)
      }
    }

    const getPresetName = (name) => {
      const names = {
        'earth-like': '类地球',
        'hot-jupiter': '热木星',
        'super-earth': '超级地球'
      }
      return names[name] || name
    }

    const calculatePrediction = async () => {
      loading.value = true
      try {
        const response = await predictionApi.predictTransit({
          starMass: predictionParams.value.starMass,
          starRadius: predictionParams.value.starRadius,
          planetRadius: predictionParams.value.planetRadius,
          planetDistance: predictionParams.value.planetDistance,
          inclination: predictionParams.value.inclination,
          lastTransitTime: predictionParams.value.lastTransitTime
        })

        predictionResult.value = response.data
        ElMessage.success('预测计算完成！')
      } catch (error) {
        console.error('Error calculating prediction:', error)
        ElMessage.error('预测计算失败，请检查参数')
      } finally {
        loading.value = false
      }
    }

    const getUrgencyClass = (days) => {
      if (days < 1) return 'urgent'
      if (days < 7) return 'soon'
      if (days < 30) return 'moderate'
      return 'later'
    }

    const getImpactClass = (b) => {
      if (b < 0.3) return 'excellent'
      if (b < 0.7) return 'good'
      if (b < 0.95) return 'fair'
      return 'poor'
    }

    const getVisibilityText = (b) => {
      if (b < 0.3) return '极佳 🌟'
      if (b < 0.7) return '良好 ✅'
      if (b < 0.95) return '一般 ⚠️'
      return '较差 ❌'
    }

    const getVisibilityClass = (b) => {
      if (b < 0.3) return 'excellent'
      if (b < 0.7) return 'good'
      if (b < 0.95) return 'fair'
      return 'poor'
    }

    return {
      loading,
      predictionResult,
      predictionParams,
      applyPreset,
      calculatePrediction,
      getUrgencyClass,
      getImpactClass,
      getVisibilityText,
      getVisibilityClass
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #aaa;
  font-size: 1.1em;
  margin-bottom: 15px;
}

.nav-links {
  margin-top: 15px;
}

.nav-link {
  display: inline-block;
  color: #667eea;
  text-decoration: none;
  padding: 8px 20px;
  border-radius: 20px;
  background: rgba(102, 126, 234, 0.1);
  transition: all 0.3s;
}

.nav-link:hover {
  background: rgba(102, 126, 234, 0.2);
}

.main-content {
  display: flex;
  gap: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.left-panel {
  width: 400px;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.panel-card,
.result-card,
.details-card,
.info-card {
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
}

.card-header {
  font-weight: bold;
  color: #fff;
}

.section-title {
  color: #667eea;
  margin: 15px 0 10px;
  font-size: 1em;
}

.slider-value {
  text-align: center;
  color: #aaa;
  font-size: 13px;
  margin-top: 5px;
}

.preset-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #fff;
  margin-bottom: 10px;
}

.empty-state p {
  color: #666;
}

.result-item {
  padding: 15px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin-bottom: 10px;
}

.result-item.highlight {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  display: flex;
  align-items: center;
  gap: 15px;
}

.result-icon {
  font-size: 2em;
}

.result-label {
  color: #aaa;
  font-size: 13px;
  margin-bottom: 5px;
}

.result-value {
  color: #fff;
  font-size: 1.3em;
  font-weight: bold;
}

.result-value.next-transit {
  font-size: 1.5em;
}

.result-value.next-transit.urgent {
  color: #e74c3c;
}

.result-value.next-transit.soon {
  color: #f39c12;
}

.result-value.next-transit.moderate {
  color: #3498db;
}

.result-value.next-transit.later {
  color: #9b59b6;
}

.result-value.habitability {
  font-size: 1.1em;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-label {
  color: #aaa;
}

.detail-value {
  color: #fff;
  font-weight: 500;
}

.detail-value.excellent {
  color: #2ecc71;
}

.detail-value.good {
  color: #3498db;
}

.detail-value.fair {
  color: #f39c12;
}

.detail-value.poor {
  color: #e74c3c;
}

.summary {
  padding: 15px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.summary h4 {
  color: #667eea;
  margin-bottom: 10px;
}

.summary p {
  color: #ccc;
  line-height: 1.6;
}

.science-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.info-section {
  flex: 1;
  min-width: 250px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.info-section h4 {
  color: #667eea;
  margin-bottom: 10px;
}

.info-section p {
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 10px;
}

.info-section ul {
  padding-left: 20px;
  color: #aaa;
}

.info-section li {
  margin-bottom: 5px;
}

.formula {
  font-family: 'Monaco', 'Menlo', monospace;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 4px;
  color: #e8e8e8;
  display: inline-block;
  margin: 10px 0;
}

:deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-slider__runway) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.el-slider__bar) {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

:deep(.el-slider__button) {
  border-color: #667eea;
}

:deep(.el-form-item__label) {
  color: #aaa !important;
}

:deep(.el-divider__text) {
  background: transparent !important;
  color: #666 !important;
}
</style>