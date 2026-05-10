<template>
  <div class="container">
    <div class="header">
      <h1>🍿 电影院爆米花机预热排班优化器</h1>
      <p>基于排队论模型的智能排班系统 · 避免高峰期排队等待</p>
    </div>

    <div class="content">
      <div class="sidebar">
        <div class="card">
          <h2>⚙️ 参数设置</h2>
          
          <div class="form-group">
            <label>预期总客流量（人/天）</label>
            <input
              v-model.number="formData.expectedPassengers"
              type="number"
              min="1"
              max="5000"
              placeholder="请输入预期客流量"
            />
          </div>

          <div class="form-group">
            <label>日期</label>
            <input
              v-model="formData.date"
              type="date"
            />
          </div>

          <div class="checkbox-group">
            <input v-model="formData.isHoliday" type="checkbox" id="holiday" />
            <label for="holiday">是否为节假日</label>
          </div>

          <button
            class="btn"
            @click="calculateOptimization"
            :disabled="loading || !formData.expectedPassengers"
          >
            {{ loading ? '计算中...' : '开始优化计算' }}
          </button>

          <div v-if="errorMessage" class="error-message">
            ⚠️ {{ errorMessage }}
          </div>
        </div>

        <div class="info-card">
          <h3>📋 系统参数</h3>
          <ul>
            <li>3台爆米花机</li>
            <li>每台预热时间: 15分钟</li>
            <li>高峰期: 19:00-21:00</li>
            <li>每台服务效率: 30人/小时</li>
            <li>最大允许排队长度: 10人</li>
          </ul>
        </div>
      </div>

      <div class="main-content">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>正在使用排队论模型计算最优方案...</p>
        </div>

        <template v-else-if="result">
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">{{ result.totalMachinesUsed }}</div>
              <div class="stat-label">使用机器数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ result.avgWaitingTime }}</div>
              <div class="stat-label">平均等待时间(分钟)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ result.schedules.length }}</div>
              <div class="stat-label">排班建议数</div>
            </div>
          </div>

          <div class="chart-section">
            <h2>📊 预期排队长度曲线</h2>
            <div class="chart-container">
              <QueueChart :data="result.queueCurve" />
            </div>
          </div>

          <div class="chart-section">
            <h2>📅 机器预热甘特图</h2>
            <div class="chart-container">
              <GanttChart :schedules="result.schedules" />
            </div>
          </div>

          <div v-if="result.costComparison" class="chart-section">
            <h2>⚡ 耗电成本对比</h2>
            
            <div class="cost-stats">
              <div class="cost-stat-card">
                <div class="cost-stat-label">智能排班成本</div>
                <div class="cost-stat-value">¥ {{ result.costComparison.advancedWarmup.totalCost.toFixed(2) }}</div>
                <div class="cost-stat-detail">{{ result.costComparison.advancedWarmup.totalEnergyKwh.toFixed(2) }} kWh</div>
              </div>
              
              <div class="cost-stat-card">
                <div class="cost-stat-label">临时开启成本</div>
                <div class="cost-stat-value">¥ {{ result.costComparison.instantOn.totalCost.toFixed(2) }}</div>
                <div class="cost-stat-detail">{{ result.costComparison.instantOn.totalEnergyKwh.toFixed(2) }} kWh</div>
              </div>
              
              <div class="cost-stat-card highlight" v-if="result.costComparison.savingsAmount > 0">
                <div class="cost-stat-label">节省金额</div>
                <div class="cost-stat-value">¥ {{ result.costComparison.savingsAmount.toFixed(2) }}</div>
                <div class="cost-stat-detail">{{ result.costComparison.savingsPercentage }}%</div>
              </div>
            </div>
            
            <div class="chart-container">
              <CostComparisonChart :data="result.costComparison" />
            </div>
          </div>

          <div class="recommendation">
            <h2>💡 优化建议</h2>
            <div class="recommendation-content">{{ result.recommendation }}</div>
          </div>
          
          <div v-if="result.costComparison" class="recommendation cost-recommendation">
            <h2>💰 成本分析</h2>
            <div class="recommendation-content">{{ result.costComparison.recommendation }}</div>
          </div>
        </template>

        <div v-else class="loading">
          <p>👆 请在左侧输入预期客流量并点击「开始优化计算」</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'
import QueueChart from './components/QueueChart.vue'
import GanttChart from './components/GanttChart.vue'
import CostComparisonChart from './components/CostComparisonChart.vue'

const loading = ref(false)
const result = ref(null)
const errorMessage = ref('')

const formData = reactive({
  expectedPassengers: null,
  date: new Date().toISOString().split('T')[0],
  isHoliday: false,
  hourlyDistribution: null
})

const calculateOptimization = async () => {
  errorMessage.value = ''
  
  if (!formData.expectedPassengers || formData.expectedPassengers <= 0) {
    errorMessage.value = '请输入有效的预期客流量（1-5000人）'
    return
  }
  
  if (formData.expectedPassengers > 5000) {
    errorMessage.value = '预期客流量不能超过5000人'
    return
  }

  loading.value = true
  result.value = null

  try {
    console.log('发送请求:', {
      expectedPassengers: formData.expectedPassengers,
      date: formData.date,
      isHoliday: formData.isHoliday,
      hourlyDistribution: formData.hourlyDistribution
    })
    
    const response = await axios.post('/api/optimize', {
      expectedPassengers: formData.expectedPassengers,
      date: formData.date,
      isHoliday: formData.isHoliday,
      hourlyDistribution: formData.hourlyDistribution
    })
    
    console.log('收到响应:', response.data)
    
    if (response.data && response.data.schedules) {
      response.data.schedules.forEach((schedule, index) => {
        console.log(`排班 ${index + 1}: machineId=${schedule.machineId}, startTime=${schedule.startTime}, endTime=${schedule.endTime}`)
      })
    }
    
    result.value = response.data
  } catch (error) {
    console.error('优化计算失败:', error)
    
    if (error.response) {
      if (error.response.data && error.response.data.fieldErrors) {
        const fieldErrors = error.response.data.fieldErrors
        errorMessage.value = Object.values(fieldErrors).join('; ')
      } else if (error.response.data && error.response.data.message) {
        errorMessage.value = error.response.data.message
      } else {
        errorMessage.value = `请求失败: ${error.response.status}`
      }
    } else if (error.request) {
      errorMessage.value = '无法连接到服务器，请检查后端服务是否启动'
    } else {
      errorMessage.value = '计算失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>
