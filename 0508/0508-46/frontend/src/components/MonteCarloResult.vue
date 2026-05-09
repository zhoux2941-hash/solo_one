<template>
  <div class="montecarlo-result">
    <div class="summary">
      <h3>蒙特卡洛模拟结果</h3>
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">模拟次数</span>
          <span class="stat-value">{{ result?.simulationCount || 0 }}次</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均离开率</span>
          <span 
            class="stat-value"
            :class="{ 'bad': (result?.averageLeaveRate || 0) > 10 }"
          >
            {{ result?.averageLeaveRate || 0 }}%
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均等待时间</span>
          <span class="stat-value">{{ result?.averageWaitTime || 0 }}秒</span>
        </div>
      </div>
    </div>

    <div class="target-indicator" v-if="result">
      <div class="target-bar">
        <div 
          class="target-fill"
          :class="{ 'good': (result?.averageLeaveRate || 0) <= 10 }"
          :style="{ width: Math.min((result?.averageLeaveRate || 0) * 5, 100) + '%' }"
        ></div>
      </div>
      <div class="target-labels">
        <span>0%</span>
        <span class="target">10% (目标)</span>
        <span>20%</span>
      </div>
    </div>

    <BoxPlotChart 
      v-if="result && result.childWaitTimes" 
      :waitTimeData="result.childWaitTimes" 
    />

    <div class="optimization-section" v-if="optimizationResult">
      <h3>参数优化建议</h3>
      <div class="optimization-content">
        <div class="current-vs-recommended">
          <div class="box">
            <div class="box-title">当前设置</div>
            <div class="box-value">{{ optimizationResult.currentSlideTime }}秒</div>
          </div>
          <div class="arrow">→</div>
          <div 
            class="box recommended"
            :class="{ 'good': optimizationResult.foundOptimal }"
          >
            <div class="box-title">推荐设置</div>
            <div class="box-value">{{ optimizationResult.recommendedSlideTime }}秒</div>
          </div>
        </div>
        <div class="recommendation-text">
          <p>{{ optimizationResult.recommendation }}</p>
          <div class="expected-stats">
            <span>预计离开率: <strong>{{ optimizationResult.expectedLeaveRate }}%</strong></span>
            <span>预计等待时间: <strong>{{ optimizationResult.expectedAverageWaitTime }}秒</strong></span>
          </div>
        </div>
        <button 
          v-if="optimizationResult.foundOptimal !== null"
          class="apply-btn"
          @click="applyRecommendation"
        >
          应用推荐设置
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import BoxPlotChart from './BoxPlotChart.vue'

export default {
  name: 'MonteCarloResult',
  components: {
    BoxPlotChart
  },
  props: {
    result: {
      type: Object,
      default: null
    },
    optimizationResult: {
      type: Object,
      default: null
    }
  },
  methods: {
    applyRecommendation() {
      if (this.optimizationResult && this.optimizationResult.foundOptimal) {
        this.$emit('apply', this.optimizationResult.recommendedSlideTime)
      }
    }
  }
}
</script>

<style scoped>
.montecarlo-result {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary {
  margin-bottom: 20px;
}

.summary h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.stats-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  flex: 1;
  min-width: 150px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-value.bad {
  color: #f44336;
}

.target-indicator {
  margin-bottom: 20px;
}

.target-bar {
  height: 24px;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.target-fill {
  height: 100%;
  background: #f44336;
  transition: width 0.3s ease;
}

.target-fill.good {
  background: #4caf50;
}

.target-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #666;
  margin-top: 5px;
}

.target-labels .target {
  color: #4caf50;
  font-weight: bold;
}

.optimization-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.optimization-section h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.current-vs-recommended {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 15px;
}

.box {
  background: #e3f2fd;
  border-radius: 8px;
  padding: 15px 30px;
  text-align: center;
  min-width: 120px;
}

.box.recommended {
  background: #e8f5e9;
}

.box.recommended.good {
  background: #4caf50;
  color: white;
}

.box.recommended.good .box-value {
  color: white;
}

.box-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.box-value {
  font-size: 24px;
  font-weight: bold;
  color: #1565c0;
}

.arrow {
  font-size: 24px;
  color: #666;
}

.recommendation-text {
  background: #fff3e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.recommendation-text p {
  margin: 0 0 10px 0;
  color: #e65100;
  line-height: 1.6;
}

.expected-stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #666;
}

.expected-stats strong {
  color: #e65100;
}

.apply-btn {
  display: block;
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.apply-btn:hover {
  opacity: 0.9;
}
</style>
