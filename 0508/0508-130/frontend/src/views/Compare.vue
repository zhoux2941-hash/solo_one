<template>
  <div class="compare-page">
    <el-alert type="info" :closable="false" style="margin-bottom: 20px">
      <template #title>使用说明</template>
      <p>在"物资分配"页面计算分配方案后，点击"保存方案用于对比"按钮保存方案。保存后可在此页面进行多方案对比分析。</p>
    </el-alert>
    
    <el-row :gutter="20" v-if="savedPlans.length === 0">
      <el-col :span="24">
        <el-card>
          <el-empty description="暂无保存的方案">
            <el-button type="primary" @click="goToAllocation">前往物资分配页面</el-button>
          </el-empty>
        </el-card>
      </el-col>
    </el-row>
    
    <template v-else>
      <el-card style="margin-bottom: 20px">
        <template #header>
          <div class="card-header">
            <el-icon><FolderOpened /></el-icon>
            <span>已保存的方案 ({{ savedPlans.length }})</span>
            <div style="margin-left: auto">
              <el-button type="primary" size="small" @click="loadDemoPlans" :disabled="savedPlans.length >= 2">
                <el-icon><Plus /></el-icon>
                <span>加载示例方案</span>
              </el-button>
              <el-button type="danger" size="small" @click="clearAll" style="margin-left: 8px">
                <el-icon><Delete /></el-icon>
                <span>清空所有</span>
              </el-button>
            </div>
          </div>
        </template>
        
        <el-checkbox-group v-model="selectedPlanIndices">
          <el-row :gutter="20">
            <el-col :span="12" v-for="(plan, idx) in savedPlans" :key="idx">
              <el-checkbox :label="idx" class="plan-checkbox">
                <div class="plan-card" :class="{ selected: selectedPlanIndices.includes(idx) }">
                  <div class="plan-header">
                    <el-tag :type="plan.algorithm === 'GENETIC' ? 'success' : 'primary'">
                      {{ plan.algorithm === 'GENETIC' ? '遗传算法' : '贪心算法' }}
                    </el-tag>
                    <span class="plan-index">方案 {{ idx + 1 }}</span>
                    <el-button size="small" text type="danger" @click.stop="removePlan(idx)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-row :gutter="10">
                    <el-col :span="12">
                      <div class="metric">
                        <span class="metric-label">总满足率</span>
                        <span class="metric-value" :class="plan.satisfactionRate >= 0.8 ? 'success' : 'warning'">
                          {{ (plan.satisfactionRate * 100).toFixed(1) }}%
                        </span>
                      </div>
                    </el-col>
                    <el-col :span="12">
                      <div class="metric">
                        <span class="metric-label">运输成本</span>
                        <span class="metric-value">{{ plan.totalCost?.toFixed(0) }}</span>
                      </div>
                    </el-col>
                  </el-row>
                </div>
              </el-checkbox>
            </el-col>
          </el-row>
        </el-checkbox-group>
      </el-card>
      
      <el-card v-if="selectedPlanIndices.length >= 2">
        <template #header>
          <div class="card-header">
            <el-icon><Scale /></el-icon>
            <span>方案对比分析</span>
          </div>
        </template>
        
        <el-tabs v-model="activeTab">
          <el-tab-pane label="综合对比" name="summary">
            <el-row :gutter="20" style="margin-bottom: 20px">
              <el-col :span="8">
                <div class="stat-card best">
                  <el-icon size="32"><Trophy /></el-icon>
                  <div class="stat-info">
                    <div class="stat-label">满意度最高</div>
                    <div class="stat-value">{{ getBestPlanBySatisfaction() }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-card economy">
                  <el-icon size="32"><Wallet /></el-icon>
                  <div class="stat-info">
                    <div class="stat-label">成本最低</div>
                    <div class="stat-value">{{ getBestPlanByCost() }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-card balanced">
                  <el-icon size="32"><Medal /></el-icon>
                  <div class="stat-info">
                    <div class="stat-label">综合推荐</div>
                    <div class="stat-value">{{ getRecommendedPlan() }}</div>
                  </div>
                </div>
              </el-col>
            </el-row>
            
            <el-table :data="comparisonTableData" border style="width: 100%">
              <el-table-column label="指标" prop="metric" width="150" />
              <el-table-column 
                v-for="(idx, i) in selectedPlanIndices" 
                :key="idx" 
                :label="`方案 ${idx + 1}`"
                :prop="`plan${idx}`"
              >
                <template #default="scope">
                  <span :class="getHighlightClass(scope.row, i)">
                    {{ scope.row[`plan${idx}`] }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          
          <el-tab-pane label="图表对比" name="chart">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <el-icon><DataLine /></el-icon>
                      <span>满足率对比</span>
                    </div>
                  </template>
                  <div ref="satisfactionChartRef" class="small-chart"></div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <el-icon><TrendCharts /></el-icon>
                      <span>运输成本对比</span>
                    </div>
                  </template>
                  <div ref="costChartRef" class="small-chart"></div>
                </el-card>
              </el-col>
            </el-row>
            
            <el-row :gutter="20" style="margin-top: 20px">
              <el-col :span="24">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <el-icon><PieChart /></el-icon>
                      <span>各方案物资满足情况</span>
                    </div>
                  </template>
                  <div ref="supplyChartRef" class="supply-chart"></div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="详细数据" name="detail">
            <el-row :gutter="20">
              <el-col :span="12" v-for="(idx, i) in selectedPlanIndices" :key="idx">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <el-tag :type="savedPlans[idx].algorithm === 'GENETIC' ? 'success' : 'primary'">
                        {{ savedPlans[idx].algorithm === 'GENETIC' ? '遗传算法' : '贪心算法' }}
                      </el-tag>
                      <span>方案 {{ idx + 1 }} 详情</span>
                    </div>
                  </template>
                  
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="总满足率">
                      <el-progress :percentage="(savedPlans[idx].satisfactionRate * 100).toFixed(1)" :status="savedPlans[idx].satisfactionRate >= 0.8 ? 'success' : 'warning'" />
                    </el-descriptions-item>
                    <el-descriptions-item label="运输成本">
                      {{ savedPlans[idx].totalCost?.toFixed(2) }} 单位
                    </el-descriptions-item>
                    <el-descriptions-item label="救援点数">
                      {{ savedPlans[idx].allocations?.length || 0 }} 个
                    </el-descriptions-item>
                    <el-descriptions-item label="未满足物资">
                      <el-tag type="danger" v-if="hasUnmet(savedPlans[idx])">有</el-tag>
                      <el-tag type="success" v-else>无</el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                  
                  <el-divider>各救援点满足情况</el-divider>
                  
                  <el-table :data="savedPlans[idx].allocations || []" size="small" height="250">
                    <el-table-column prop="pointName" label="救援点" width="120" />
                    <el-table-column label="满足率" width="120">
                      <template #default="scope">
                        <el-progress 
                          :percentage="(scope.row.satisfactionRate * 100).toFixed(0)" 
                          :status="scope.row.satisfactionRate >= 0.8 ? 'success' : 'warning'"
                          :stroke-width="12"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column prop="distance" label="距离(km)">
                      <template #default="scope">{{ scope.row.distance?.toFixed(2) }}</template>
                    </el-table-column>
                    <el-table-column label="帐篷" align="center">
                      <template #default="scope">
                        {{ scope.row.allocated?.tentQuantity || 0 }} / {{ scope.row.requested?.tentQuantity || 0 }}
                      </template>
                    </el-table-column>
                    <el-table-column label="水" align="center">
                      <template #default="scope">
                        {{ scope.row.allocated?.waterQuantity || 0 }} / {{ scope.row.requested?.waterQuantity || 0 }}
                      </template>
                    </el-table-column>
                    <el-table-column label="食物" align="center">
                      <template #default="scope">
                        {{ scope.row.allocated?.foodQuantity || 0 }} / {{ scope.row.requested?.foodQuantity || 0 }}
                      </template>
                    </el-table-column>
                    <el-table-column label="医疗包" align="center">
                      <template #default="scope">
                        {{ scope.row.allocated?.medicalKitQuantity || 0 }} / {{ scope.row.requested?.medicalKitQuantity || 0 }}
                      </template>
                    </el-table-column>
                  </el-table>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const savedPlans = ref([])
const selectedPlanIndices = ref([])
const activeTab = ref('summary')
const satisfactionChartRef = ref(null)
const costChartRef = ref(null)
const supplyChartRef = ref(null)
let satisfactionChart = null
let costChart = null
let supplyChart = null

const loadDemoPlans = () => {
  savedPlans.value = [
    {
      algorithm: 'GREEDY',
      satisfactionRate: 0.78,
      totalCost: 12500,
      allocations: [
        { pointName: '救援点A', satisfactionRate: 0.85, distance: 120, allocated: { tentQuantity: 100, waterQuantity: 3000, foodQuantity: 2000, medicalKitQuantity: 80 }, requested: { tentQuantity: 120, waterQuantity: 3500, foodQuantity: 2400, medicalKitQuantity: 100 } },
        { pointName: '救援点B', satisfactionRate: 0.72, distance: 200, allocated: { tentQuantity: 150, waterQuantity: 4500, foodQuantity: 3000, medicalKitQuantity: 120 }, requested: { tentQuantity: 200, waterQuantity: 6000, foodQuantity: 4200, medicalKitQuantity: 170 } }
      ],
      unmetRequirements: { tentQuantity: 70, waterQuantity: 2000, foodQuantity: 1600, medicalKitQuantity: 70 }
    },
    {
      algorithm: 'GENETIC',
      satisfactionRate: 0.91,
      totalCost: 9800,
      allocations: [
        { pointName: '救援点A', satisfactionRate: 0.95, distance: 110, allocated: { tentQuantity: 114, waterQuantity: 3325, foodQuantity: 2280, medicalKitQuantity: 95 }, requested: { tentQuantity: 120, waterQuantity: 3500, foodQuantity: 2400, medicalKitQuantity: 100 } },
        { pointName: '救援点B', satisfactionRate: 0.88, distance: 180, allocated: { tentQuantity: 176, waterQuantity: 5280, foodQuantity: 3696, medicalKitQuantity: 150 }, requested: { tentQuantity: 200, waterQuantity: 6000, foodQuantity: 4200, medicalKitQuantity: 170 } }
      ],
      unmetRequirements: { tentQuantity: 30, waterQuantity: 895, foodQuantity: 624, medicalKitQuantity: 25 }
    }
  ]
  selectedPlanIndices.value = [0, 1]
  ElMessage.success('已加载2个示例方案')
}

const goToAllocation = () => {
  router.push('/allocation')
}

const removePlan = (idx) => {
  ElMessageBox.confirm('确定要删除该方案吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    savedPlans.value.splice(idx, 1)
    selectedPlanIndices.value = selectedPlanIndices.value.filter(i => i !== idx)
    ElMessage.success('已删除')
  }).catch(() => {})
}

const clearAll = () => {
  ElMessageBox.confirm('确定要清空所有保存的方案吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    savedPlans.value = []
    selectedPlanIndices.value = []
    ElMessage.success('已清空')
  }).catch(() => {})
}

const hasUnmet = (plan) => {
  if (!plan.unmetRequirements) return false
  return plan.unmetRequirements.tentQuantity > 0 || 
         plan.unmetRequirements.waterQuantity > 0 ||
         plan.unmetRequirements.foodQuantity > 0 ||
         plan.unmetRequirements.medicalKitQuantity > 0
}

const getBestPlanBySatisfaction = () => {
  let bestIdx = selectedPlanIndices.value[0]
  let bestRate = savedPlans.value[bestIdx]?.satisfactionRate || 0
  for (const idx of selectedPlanIndices.value) {
    if (savedPlans.value[idx]?.satisfactionRate > bestRate) {
      bestRate = savedPlans.value[idx].satisfactionRate
      bestIdx = idx
    }
  }
  return `方案 ${bestIdx + 1} (${(bestRate * 100).toFixed(1)}%)`
}

const getBestPlanByCost = () => {
  let bestIdx = selectedPlanIndices.value[0]
  let bestCost = savedPlans.value[bestIdx]?.totalCost || Infinity
  for (const idx of selectedPlanIndices.value) {
    if (savedPlans.value[idx]?.totalCost < bestCost) {
      bestCost = savedPlans.value[idx].totalCost
      bestIdx = idx
    }
  }
  return `方案 ${bestIdx + 1} (${bestCost?.toFixed(0)})`
}

const getRecommendedPlan = () => {
  let bestIdx = selectedPlanIndices.value[0]
  let bestScore = -Infinity
  for (const idx of selectedPlanIndices.value) {
    const plan = savedPlans.value[idx]
    const satisfactionScore = plan?.satisfactionRate || 0
    const costScore = 1 - (plan?.totalCost || 0) / 20000
    const score = satisfactionScore * 0.6 + costScore * 0.4
    if (score > bestScore) {
      bestScore = score
      bestIdx = idx
    }
  }
  return `方案 ${bestIdx + 1}`
}

const comparisonTableData = computed(() => {
  const data = [
    { metric: '算法类型', best: 'none' },
    { metric: '总满足率(%)', best: 'max' },
    { metric: '运输成本', best: 'min' },
    { metric: '救援点数量', best: 'none' },
    { metric: '帐篷未满足', best: 'min' },
    { metric: '水未满足', best: 'min' },
    { metric: '食物未满足', best: 'min' },
    { metric: '医疗包未满足', best: 'min' }
  ]
  
  const values = []
  for (const idx of selectedPlanIndices.value) {
    const plan = savedPlans.value[idx]
    values.push([
      plan.algorithm === 'GENETIC' ? '遗传算法' : '贪心算法',
      (plan.satisfactionRate * 100).toFixed(1),
      plan.totalCost?.toFixed(0),
      plan.allocations?.length || 0,
      plan.unmetRequirements?.tentQuantity || 0,
      plan.unmetRequirements?.waterQuantity || 0,
      plan.unmetRequirements?.foodQuantity || 0,
      plan.unmetRequirements?.medicalKitQuantity || 0
    ])
  }
  
  return data.map((row, i) => {
    const obj = { ...row }
    for (let j = 0; j < selectedPlanIndices.value.length; j++) {
      obj[`plan${selectedPlanIndices.value[j]}`] = values[j][i]
    }
    return obj
  })
})

const getHighlightClass = (row, colIdx) => {
  if (row.best === 'none') return ''
  const values = selectedPlanIndices.value.map(idx => parseFloat(row[`plan${idx}`] || 0))
  const currentValue = parseFloat(row[`plan${selectedPlanIndices.value[colIdx]}`] || 0)
  
  if (row.best === 'max') {
    return currentValue === Math.max(...values) ? 'highlight-best' : ''
  }
  if (row.best === 'min') {
    return currentValue === Math.min(...values) ? 'highlight-best' : ''
  }
  return ''
}

const renderCharts = async () => {
  await nextTick()
  
  if (satisfactionChartRef.value) {
    if (satisfactionChart) satisfactionChart.dispose()
    satisfactionChart = echarts.init(satisfactionChartRef.value)
    
    const option = {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: selectedPlanIndices.value.map(idx => `方案 ${idx + 1}`)
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%' }
      },
      series: [{
        type: 'bar',
        data: selectedPlanIndices.value.map(idx => ({
          value: (savedPlans.value[idx].satisfactionRate * 100).toFixed(1),
          itemStyle: { color: idx === 0 ? '#409EFF' : '#67C23A' }
        })),
        label: { show: true, position: 'top', formatter: '{c}%' }
      }]
    }
    satisfactionChart.setOption(option)
  }
  
  if (costChartRef.value) {
    if (costChart) costChart.dispose()
    costChart = echarts.init(costChartRef.value)
    
    const option = {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: selectedPlanIndices.value.map(idx => `方案 ${idx + 1}`)
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: selectedPlanIndices.value.map(idx => ({
          value: savedPlans.value[idx].totalCost?.toFixed(0),
          itemStyle: { color: idx === 0 ? '#E6A23C' : '#F56C6C' }
        })),
        label: { show: true, position: 'top' }
      }]
    }
    costChart.setOption(option)
  }
  
  if (supplyChartRef.value) {
    if (supplyChart) supplyChart.dispose()
    supplyChart = echarts.init(supplyChartRef.value)
    
    const option = {
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['帐篷', '饮用水', '食物', '医疗包']
      },
      xAxis: {
        type: 'category',
        data: selectedPlanIndices.value.map(idx => `方案 ${idx + 1}`)
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '帐篷',
          type: 'bar',
          stack: 'total',
          data: selectedPlanIndices.value.map(idx => {
            const alloc = savedPlans.value[idx].allocations || []
            return alloc.reduce((sum, a) => sum + (a.allocated?.tentQuantity || 0), 0)
          }),
          itemStyle: { color: '#409EFF' }
        },
        {
          name: '饮用水',
          type: 'bar',
          stack: 'total',
          data: selectedPlanIndices.value.map(idx => {
            const alloc = savedPlans.value[idx].allocations || []
            return alloc.reduce((sum, a) => sum + (a.allocated?.waterQuantity || 0), 0)
          }),
          itemStyle: { color: '#67C23A' }
        },
        {
          name: '食物',
          type: 'bar',
          stack: 'total',
          data: selectedPlanIndices.value.map(idx => {
            const alloc = savedPlans.value[idx].allocations || []
            return alloc.reduce((sum, a) => sum + (a.allocated?.foodQuantity || 0), 0)
          }),
          itemStyle: { color: '#E6A23C' }
        },
        {
          name: '医疗包',
          type: 'bar',
          stack: 'total',
          data: selectedPlanIndices.value.map(idx => {
            const alloc = savedPlans.value[idx].allocations || []
            return alloc.reduce((sum, a) => sum + (a.allocated?.medicalKitQuantity || 0), 0)
          }),
          itemStyle: { color: '#F56C6C' }
        }
      ]
    }
    supplyChart.setOption(option)
  }
}

watch([selectedPlanIndices, activeTab], () => {
  if (selectedPlanIndices.value.length >= 2 && activeTab.value === 'chart') {
    renderCharts()
  }
})

onMounted(() => {
  window.addEventListener('resize', () => {
    satisfactionChart?.resize()
    costChart?.resize()
    supplyChart?.resize()
  })
})
</script>

<style scoped>
.compare-page {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.plan-checkbox {
  width: 100%;
}

.plan-card {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.plan-card.selected {
  border-color: #409EFF;
  background: #ecf5ff;
}

.plan-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.plan-index {
  font-weight: 600;
  color: #303133;
}

.metric {
  text-align: center;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
}

.metric-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.metric-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.metric-value.success {
  color: #67C23A;
}

.metric-value.warning {
  color: #E6A23C;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 8px;
  color: #fff;
}

.stat-card.best {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.economy {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.balanced {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
}

.highlight-best {
  color: #67C23A;
  font-weight: 600;
}

.small-chart {
  height: 250px;
  width: 100%;
}

.supply-chart {
  height: 300px;
  width: 100%;
}
</style>
