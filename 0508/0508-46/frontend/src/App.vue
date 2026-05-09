<template>
  <div class="app">
    <header>
      <h1>🎢 儿童游乐场滑梯排队公平性模拟器</h1>
      <p class="subtitle">模拟滑梯排队系统，分析等待公平性</p>
    </header>

    <main>
      <div class="content-wrapper">
        <aside class="sidebar">
          <ParamsConfig
            :params="params"
            @save="saveParams"
            @run="runSimulation"
            @montecarlo="runMonteCarlo"
            @optimize="runOptimization"
          />
        </aside>

        <section class="main-content">
          <div v-if="loading" class="loading-message">
            <div class="spinner"></div>
            <p>{{ loadingMessage }}</p>
          </div>

          <div v-else-if="monteCarloResult" class="results">
            <MonteCarloResult
              :result="monteCarloResult"
              :optimizationResult="optimizationResult"
              @apply="applyRecommendedSlideTime"
            />
          </div>

          <div v-else-if="result" class="results">
            <ResultsTable
              :simulationId="result.simulationId"
              :results="result.childResults"
            />
            <GanttChart
              :timeline="result.timeline"
              :totalTime="result.totalTime"
            />
          </div>

          <div v-else class="welcome">
            <div class="welcome-icon">🎡</div>
            <h2>欢迎使用滑梯排队模拟器</h2>
            <p>请在左侧配置参数后选择模拟类型</p>
            <div class="tips">
              <h3>使用提示：</h3>
              <ul>
                <li><strong>单次模拟：</strong>运行一次确定性模拟</li>
                <li><strong>蒙特卡洛模拟：</strong>运行10次随机模拟，统计平均离开率和等待时间分布</li>
                <li><strong>参数优化：</strong>自动推荐最佳滑梯使用时间，使离开率低于10%</li>
                <li>年龄越大，等待耐心越强（3-5岁低，6-10岁中，11+岁高）</li>
              </ul>
            </div>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </section>
      </div>

      <section class="history-section">
        <HistoryList ref="historyRef" />
      </section>
    </main>

    <footer>
      <p>滑梯排队公平性模拟器 - Vue 3 + Java Spring Boot</p>
    </footer>
  </div>
</template>

<script>
import ParamsConfig from './components/ParamsConfig.vue'
import ResultsTable from './components/ResultsTable.vue'
import GanttChart from './components/GanttChart.vue'
import HistoryList from './components/HistoryList.vue'
import MonteCarloResult from './components/MonteCarloResult.vue'
import { simulationService } from './api/simulationService'

export default {
  name: 'App',
  components: {
    ParamsConfig,
    ResultsTable,
    GanttChart,
    HistoryList,
    MonteCarloResult
  },
  data() {
    return {
      params: {
        children: [],
        patienceCoefficient: 30,
        slideUsageTime: 10,
        totalSimulationTime: 120
      },
      result: null,
      monteCarloResult: null,
      optimizationResult: null,
      loading: false,
      loadingMessage: '正在运行模拟...',
      error: ''
    }
  },
  async mounted() {
    await this.loadParams()
  },
  methods: {
    async loadParams() {
      try {
        const response = await simulationService.getParams()
        if (response.success) {
          this.params = response.data
        }
      } catch (error) {
        console.error('加载参数失败:', error)
      }
    },
    async saveParams() {
      try {
        this.error = ''
        const response = await simulationService.saveParams(this.params)
        if (response.success) {
          alert('参数保存成功！')
        } else {
          this.error = response.message
        }
      } catch (error) {
        this.error = '保存参数失败: ' + (error.message || error)
      }
    },
    async runSimulation() {
      this.loading = true
      this.loadingMessage = '正在运行模拟...'
      this.error = ''
      this.result = null
      this.monteCarloResult = null
      this.optimizationResult = null
      
      try {
        const response = await simulationService.runSimulation()
        if (response.success) {
          this.result = response.data
          this.$nextTick(() => {
            if (this.$refs.historyRef) {
              this.$refs.historyRef.refresh()
            }
          })
        } else {
          this.error = response.message
        }
      } catch (error) {
        this.error = '模拟失败: ' + (error.message || error)
      } finally {
        this.loading = false
      }
    },
    async runMonteCarlo() {
      this.loading = true
      this.loadingMessage = '正在运行蒙特卡洛模拟 (10次)...'
      this.error = ''
      this.result = null
      this.monteCarloResult = null
      this.optimizationResult = null
      
      try {
        const response = await simulationService.runMonteCarlo()
        if (response.success) {
          this.monteCarloResult = response.data
        } else {
          this.error = response.message
        }
      } catch (error) {
        this.error = '蒙特卡洛模拟失败: ' + (error.message || error)
      } finally {
        this.loading = false
      }
    },
    async runOptimization() {
      this.loading = true
      this.loadingMessage = '正在进行参数优化分析...'
      this.error = ''
      this.result = null
      this.monteCarloResult = null
      this.optimizationResult = null
      
      try {
        const response = await simulationService.optimizeSlideTime()
        if (response.success) {
          this.optimizationResult = response.data
        } else {
          this.error = response.message
        }
      } catch (error) {
        this.error = '参数优化失败: ' + (error.message || error)
      } finally {
        this.loading = false
      }
    },
    async applyRecommendedSlideTime(recommendedTime) {
      this.params.slideUsageTime = recommendedTime
      try {
        const response = await simulationService.saveParams(this.params)
        if (response.success) {
          alert(`已应用推荐设置：滑梯使用时间 ${recommendedTime} 秒`)
        }
      } catch (error) {
        this.error = '应用设置失败: ' + (error.message || error)
      }
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f7fa;
  color: #333;
  line-height: 1.6;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
  text-align: center;
}

header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  opacity: 0.9;
  font-size: 14px;
}

main {
  flex: 1;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.sidebar {
  position: sticky;
  top: 20px;
  height: fit-content;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.loading-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.welcome {
  background: white;
  border-radius: 8px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.welcome-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.welcome h2 {
  color: #333;
  margin-bottom: 10px;
}

.welcome p {
  color: #666;
  margin-bottom: 30px;
}

.tips {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}

.tips h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 16px;
}

.tips ul {
  list-style: none;
}

.tips li {
  padding: 6px 0;
  padding-left: 20px;
  position: relative;
  color: #666;
  font-size: 13px;
}

.tips li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #4caf50;
  font-weight: bold;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.history-section {
  margin-top: 20px;
}

footer {
  background: #333;
  color: #999;
  text-align: center;
  padding: 20px;
  font-size: 13px;
}

@media (max-width: 900px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  header h1 {
    font-size: 22px;
  }
}
</style>
