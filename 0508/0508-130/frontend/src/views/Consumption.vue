<template>
  <div class="consumption-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="form-card">
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>模拟参数</span>
            </div>
          </template>
          
          <el-form :model="form" label-width="100px">
            <el-form-item label="受灾人口">
              <el-input-number v-model="form.affectedPopulation" :min="100" :max="1000000" :step="1000" style="width: 100%" />
            </el-form-item>
            
            <el-divider>初始库存量</el-divider>
            
            <el-form-item label="帐篷">
              <el-input-number v-model="form.initialStock.tentQuantity" :min="0" :max="100000" style="width: 100%" />
            </el-form-item>
            <el-form-item label="饮用水(升)">
              <el-input-number v-model="form.initialStock.waterQuantity" :min="0" :max="1000000" style="width: 100%" />
            </el-form-item>
            <el-form-item label="食物(份)">
              <el-input-number v-model="form.initialStock.foodQuantity" :min="0" :max="1000000" style="width: 100%" />
            </el-form-item>
            <el-form-item label="医疗包">
              <el-input-number v-model="form.initialStock.medicalKitQuantity" :min="0" :max="50000" style="width: 100%" />
            </el-form-item>
            
            <el-divider>其他参数</el-divider>
            
            <el-form-item label="模拟天数">
              <el-input-number v-model="form.simulationDays" :min="1" :max="90" style="width: 100%" />
            </el-form-item>
            <el-form-item label="消耗倍率">
              <el-slider v-model="form.consumptionRateMultiplier" :min="0.5" :max="2.0" :step="0.1" show-input />
            </el-form-item>
            
            <el-divider>物资补给</el-divider>
            
            <el-form-item label="补给计划">
              <div class="delivery-list">
                <div v-for="(delivery, idx) in form.scheduledDeliveries" :key="idx" class="delivery-item">
                  <div class="delivery-header">
                    <span class="delivery-day">第 {{ delivery.day }} 天</span>
                    <el-button size="small" text type="danger" @click="removeDelivery(idx)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-row :gutter="8">
                    <el-col :span="12">
                      <el-input-number v-model="delivery.supplies.tentQuantity" :min="0" placeholder="帐篷" size="small" style="width: 100%" />
                    </el-col>
                    <el-col :span="12">
                      <el-input-number v-model="delivery.supplies.waterQuantity" :min="0" placeholder="水" size="small" style="width: 100%" />
                    </el-col>
                    <el-col :span="12" style="margin-top: 8px">
                      <el-input-number v-model="delivery.supplies.foodQuantity" :min="0" placeholder="食物" size="small" style="width: 100%" />
                    </el-col>
                    <el-col :span="12" style="margin-top: 8px">
                      <el-input-number v-model="delivery.supplies.medicalKitQuantity" :min="0" placeholder="医疗" size="small" style="width: 100%" />
                    </el-col>
                  </el-row>
                </div>
                <el-button type="primary" plain size="small" @click="addDelivery" style="width: 100%">
                  <el-icon><Plus /></el-icon>
                  <span>添加补给</span>
                </el-button>
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="simulate" :loading="loading" style="width: 100%">
                <el-icon><Timer /></el-icon>
                <span>开始模拟</span>
              </el-button>
            </el-form-item>
            
            <el-form-item>
              <el-button type="success" @click="quickFill" plain style="width: 100%">
                <el-icon><MagicStick /></el-icon>
                <span>快速填充示例数据</span>
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <el-col :span="18">
        <el-tabs v-model="activeTab" class="main-tabs">
          <el-tab-pane label="时间轴动画" name="animation">
            <div v-if="timelineData" class="animation-section">
              <TimelineAnimation 
                :timeline-data="timelineData" 
                @frame-change="handleFrameChange"
                @play-state-change="handlePlayStateChange"
              />
            </div>
            <el-card v-else class="empty-card">
              <el-empty description="点击'开始模拟'生成时间轴数据">
                <el-icon :size="80" color="#909399"><VideoPlay /></el-icon>
              </el-empty>
            </el-card>
          </el-tab-pane>
          
          <el-tab-pane label="数据统计" name="statistics">
            <el-card class="shortage-card" v-if="result && Object.keys(result.shortages || {}).length > 0">
              <template #header>
                <div class="card-header">
                  <el-icon><Warning /></el-icon>
                  <span>物资短缺预警</span>
                  <el-tag type="danger" style="margin-left: auto">{{ Object.keys(result.shortages).length }} 种物资短缺</el-tag>
                </div>
              </template>
              <el-row :gutter="20">
                <el-col :span="6" v-for="shortage in shortageList" :key="shortage.supplyType">
                  <div class="shortage-item" :class="shortage.supplyType">
                    <div class="shortage-icon">
                      <el-icon :size="32"><Bell /></el-icon>
                    </div>
                    <div class="shortage-info">
                      <div class="shortage-name">{{ getSupplyName(shortage.supplyType) }}</div>
                      <div class="shortage-day">第 {{ shortage.shortageDay }} 天开始短缺</div>
                      <div class="shortage-amount">短缺量: {{ shortage.shortageAmount?.toLocaleString() || 0 }}</div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </el-card>
            
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <el-icon><DataLine /></el-icon>
                  <span>物资消耗趋势</span>
                  <div style="margin-left: auto">
                    <el-radio-group v-model="chartType" size="small">
                      <el-radio-button value="remaining">剩余量</el-radio-button>
                      <el-radio-button value="consumed">消耗量</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
              </template>
              <div ref="chartRef" class="chart-container"></div>
            </el-card>
            
            <el-row :gutter="20" style="margin-top: 20px">
              <el-col :span="8">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <el-icon><InfoFilled /></el-icon>
                      <span>每日消耗速率</span>
                    </div>
                  </template>
                  <el-table :data="dailyRateData" style="width: 100%" size="small">
                    <el-table-column prop="name" label="物资类型" />
                    <el-table-column prop="value" label="每日消耗" />
                  </el-table>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <el-icon><PieChart /></el-icon>
                      <span>库存状态</span>
                    </div>
                  </template>
                  <div ref="pieChartRef" class="pie-chart"></div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <el-icon><Calendar /></el-icon>
                      <span>物资可支撑天数</span>
                    </div>
                  </template>
                  <div class="days-list">
                    <div v-for="item in supplyDays" :key="item.key" class="days-item">
                      <div class="days-label">{{ item.label }}</div>
                      <div class="days-bar">
                        <div 
                          class="days-bar-fill" 
                          :style="{ width: item.percent + '%', background: item.color }"
                        ></div>
                      </div>
                      <div class="days-value" :style="{ color: item.color }">{{ item.days }} 天</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            
            <el-card style="margin-top: 20px" v-if="result">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>每日消耗明细</span>
                </div>
              </template>
              <el-table :data="result.dailyConsumptions" style="width: 100%" height="300" size="small">
                <el-table-column prop="day" label="天数" width="80" align="center" />
                <el-table-column label="帐篷" align="center">
                  <template #default="scope">
                    <div>
                      <div>剩余: {{ scope.row.tentRemaining?.toLocaleString() }}</div>
                      <div style="color: #909399; font-size: 12px">消耗: {{ scope.row.tentConsumed?.toLocaleString() }}</div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="饮用水" align="center">
                  <template #default="scope">
                    <div>
                      <div>剩余: {{ scope.row.waterRemaining?.toLocaleString() }}</div>
                      <div style="color: #909399; font-size: 12px">消耗: {{ scope.row.waterConsumed?.toLocaleString() }}</div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="食物" align="center">
                  <template #default="scope">
                    <div>
                      <div>剩余: {{ scope.row.foodRemaining?.toLocaleString() }}</div>
                      <div style="color: #909399; font-size: 12px">消耗: {{ scope.row.foodConsumed?.toLocaleString() }}</div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="医疗包" align="center">
                  <template #default="scope">
                    <div>
                      <div>剩余: {{ scope.row.medicalKitRemaining?.toLocaleString() }}</div>
                      <div style="color: #909399; font-size: 12px">消耗: {{ scope.row.medicalKitConsumed?.toLocaleString() }}</div>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import * as echarts from 'echarts'
import { simulateConsumption, generateTimeline } from '@/api'
import { ElMessage } from 'element-plus'
import TimelineAnimation from '@/components/TimelineAnimation.vue'

const activeTab = ref('animation')
const timelineData = ref(null)

const form = reactive({
  affectedPopulation: 50000,
  initialStock: {
    tentQuantity: 5000,
    waterQuantity: 500000,
    foodQuantity: 300000,
    medicalKitQuantity: 3000
  },
  simulationDays: 30,
  consumptionRateMultiplier: 1.0,
  scheduledDeliveries: []
})

const result = ref(null)
const loading = ref(false)
const chartType = ref('remaining')
const chartRef = ref(null)
const pieChartRef = ref(null)
let chartInstance = null
let pieChartInstance = null

const shortageList = computed(() => {
  if (!result.value || !result.value.shortages) return []
  return Object.values(result.value.shortages)
})

const dailyRateData = computed(() => {
  if (!result.value || !result.value.dailyConsumptionRate) return []
  const rate = result.value.dailyConsumptionRate
  return [
    { name: '帐篷', value: rate.tentQuantity?.toLocaleString() + ' 顶/天' },
    { name: '饮用水', value: rate.waterQuantity?.toLocaleString() + ' 升/天' },
    { name: '食物', value: rate.foodQuantity?.toLocaleString() + ' 份/天' },
    { name: '医疗包', value: rate.medicalKitQuantity?.toLocaleString() + ' 个/天' }
  ]
})

const supplyDays = computed(() => {
  if (!result.value || !result.value.dailyConsumptionRate || !form.initialStock) return []
  const rate = result.value.dailyConsumptionRate
  const stock = form.initialStock
  const items = [
    { key: 'tent', label: '帐篷', stock: stock.tentQuantity, rate: rate.tentQuantity, color: '#409EFF' },
    { key: 'water', label: '饮用水', stock: stock.waterQuantity, rate: rate.waterQuantity, color: '#67C23A' },
    { key: 'food', label: '食物', stock: stock.foodQuantity, rate: rate.foodQuantity, color: '#E6A23C' },
    { key: 'medical', label: '医疗包', stock: stock.medicalKitQuantity, rate: rate.medicalKitQuantity, color: '#F56C6C' }
  ]
  const maxDays = Math.max(...items.map(i => i.rate > 0 ? Math.floor(i.stock / i.rate) : form.simulationDays))
  return items.map(i => {
    const days = i.rate > 0 ? Math.floor(i.stock / i.rate) : form.simulationDays
    return {
      ...i,
      days,
      percent: Math.min(100, (days / Math.max(maxDays, 1)) * 100)
    }
  })
})

const getSupplyName = (type) => {
  const map = { tent: '帐篷', water: '饮用水', food: '食物', medical: '医疗包' }
  return map[type] || type
}

const quickFill = () => {
  form.affectedPopulation = 50000
  form.initialStock = {
    tentQuantity: 5000,
    waterQuantity: 500000,
    foodQuantity: 300000,
    medicalKitQuantity: 3000
  }
  form.simulationDays = 30
  form.consumptionRateMultiplier = 1.0
  form.scheduledDeliveries = [
    {
      day: 10,
      supplies: {
        tentQuantity: 2000,
        waterQuantity: 200000,
        foodQuantity: 150000,
        medicalKitQuantity: 1500
      },
      source: '省级应急物资储备中心'
    },
    {
      day: 20,
      supplies: {
        tentQuantity: 1500,
        waterQuantity: 150000,
        foodQuantity: 100000,
        medicalKitQuantity: 1000
      },
      source: '周边地市支援'
    }
  ]
}

const addDelivery = () => {
  const maxDay = form.scheduledDeliveries.length > 0 
    ? Math.max(...form.scheduledDeliveries.map(d => d.day)) 
    : 0
  form.scheduledDeliveries.push({
    day: Math.min(maxDay + 5, form.simulationDays),
    supplies: {
      tentQuantity: 0,
      waterQuantity: 0,
      foodQuantity: 0,
      medicalKitQuantity: 0
    },
    source: '补给'
  })
}

const removeDelivery = (idx) => {
  form.scheduledDeliveries.splice(idx, 1)
}

const handleFrameChange = (frame) => {
}

const handlePlayStateChange = (isPlaying) => {
}

const simulate = async () => {
  loading.value = true
  try {
    const timelineRequest = {
      affectedPopulation: form.affectedPopulation,
      initialStock: form.initialStock,
      simulationDays: form.simulationDays,
      consumptionRateMultiplier: form.consumptionRateMultiplier,
      scheduledDeliveries: form.scheduledDeliveries
    }
    const timelineResult = await generateTimeline(timelineRequest)
    timelineData.value = timelineResult

    const consumptionRequest = {
      affectedPopulation: form.affectedPopulation,
      initialStock: form.initialStock,
      simulationDays: form.simulationDays,
      consumptionRateMultiplier: form.consumptionRateMultiplier
    }
    const consumptionResult = await simulateConsumption(consumptionRequest)
    result.value = consumptionResult

    await nextTick()
    renderChart()
    renderPieChart()
    activeTab.value = 'animation'
    ElMessage.success('模拟完成')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const renderChart = () => {
  if (!chartRef.value || !result.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  
  const days = result.value.dailyConsumptions.map(d => `第${d.day}天`)
  const isRemaining = chartType.value === 'remaining'
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['帐篷', '饮用水', '食物', '医疗包'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: days
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value) => {
          if (value >= 10000) return (value / 10000).toFixed(1) + '万'
          return value
        }
      }
    },
    series: [
      {
        name: '帐篷',
        type: 'line',
        smooth: true,
        data: result.value.dailyConsumptions.map(d => isRemaining ? d.tentRemaining : d.tentConsumed),
        itemStyle: { color: '#409EFF' },
        areaStyle: { opacity: 0.1 }
      },
      {
        name: '饮用水',
        type: 'line',
        smooth: true,
        data: result.value.dailyConsumptions.map(d => isRemaining ? d.waterRemaining : d.waterConsumed),
        itemStyle: { color: '#67C23A' },
        areaStyle: { opacity: 0.1 }
      },
      {
        name: '食物',
        type: 'line',
        smooth: true,
        data: result.value.dailyConsumptions.map(d => isRemaining ? d.foodRemaining : d.foodConsumed),
        itemStyle: { color: '#E6A23C' },
        areaStyle: { opacity: 0.1 }
      },
      {
        name: '医疗包',
        type: 'line',
        smooth: true,
        data: result.value.dailyConsumptions.map(d => isRemaining ? d.medicalKitRemaining : d.medicalKitConsumed),
        itemStyle: { color: '#F56C6C' },
        areaStyle: { opacity: 0.1 }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

const renderPieChart = () => {
  if (!pieChartRef.value) return
  
  if (pieChartInstance) {
    pieChartInstance.dispose()
  }
  
  pieChartInstance = echarts.init(pieChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: form.initialStock.tentQuantity, name: '帐篷', itemStyle: { color: '#409EFF' } },
          { value: form.initialStock.waterQuantity, name: '饮用水', itemStyle: { color: '#67C23A' } },
          { value: form.initialStock.foodQuantity, name: '食物', itemStyle: { color: '#E6A23C' } },
          { value: form.initialStock.medicalKitQuantity, name: '医疗包', itemStyle: { color: '#F56C6C' } }
        ]
      }
    ]
  }
  
  pieChartInstance.setOption(option)
}

watch(chartType, () => {
  if (result.value) {
    renderChart()
  }
})

onMounted(() => {
  window.addEventListener('resize', () => {
    chartInstance?.resize()
    pieChartInstance?.resize()
  })
  nextTick(() => {
    simulate()
  })
})
</script>

<style scoped>
.consumption-page {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.form-card {
  margin-bottom: 20px;
}

.shortage-card, .chart-card {
  margin-bottom: 20px;
}

.shortage-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #F56C6C;
}

.shortage-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fef0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F56C6C;
}

.shortage-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.shortage-day {
  font-size: 13px;
  color: #F56C6C;
  font-weight: 500;
}

.shortage-amount {
  font-size: 12px;
  color: #909399;
}

.chart-container {
  height: 350px;
  width: 100%;
}

.pie-chart {
  height: 220px;
  width: 100%;
}

.days-list {
  padding: 8px 0;
}

.days-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.days-item:last-child {
  margin-bottom: 0;
}

.days-label {
  width: 60px;
  font-size: 13px;
  color: #606266;
}

.days-bar {
  flex: 1;
  height: 12px;
  background: #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}

.days-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s;
}

.days-value {
  width: 60px;
  text-align: right;
  font-weight: 600;
  font-size: 14px;
}

.main-tabs {
  margin-bottom: 0;
}

.main-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.main-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 2px;
}

.delivery-list {
  max-height: 280px;
  overflow-y: auto;
}

.delivery-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 10px;
}

.delivery-item:last-child {
  margin-bottom: 0;
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.delivery-day {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.animation-section {
  background: #fff;
  border-radius: 8px;
  padding: 0;
}

.empty-card {
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
