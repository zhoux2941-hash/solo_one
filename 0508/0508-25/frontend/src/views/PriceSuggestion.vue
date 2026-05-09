<template>
  <div class="page-container">
    <div class="page-title">
      <span>💰 价格动态调整建议</span>
      <el-button type="primary" @click="loadSuggestions" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新建议
      </el-button>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-icon" style="background: #67c23a;">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.suggestedCount }}</div>
            <div class="stat-label">待处理建议</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-icon" style="background: #f56c6c;">
            <el-icon><ArrowDown /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.decreaseCount }}</div>
            <div class="stat-label">建议降价</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-icon" style="background: #e6a23c;">
            <el-icon><ArrowUp /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.increaseCount }}</div>
            <div class="stat-label">建议涨价</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-icon" style="background: #409EFF;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.appliedCount }}</div>
            <div class="stat-label">已应用调整</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="price-tabs">
      <el-tab-pane label="📋 调价建议" name="suggestions">
        <el-card class="card-shadow">
          <div slot="header" class="card-header">
            <span>基于未来7天入住率预测的价格建议</span>
            <div>
              <el-button 
                type="success" 
                @click="applySelectedSuggestions" 
                :disabled="selectedSuggestions.length === 0"
                :loading="applying"
              >
                <el-icon><CircleCheck /></el-icon>
                一键应用选中 ({{ selectedSuggestions.length }})
              </el-button>
            </div>
          </div>

          <el-table 
            :data="suggestions" 
            v-loading="loading" 
            stripe 
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="roomTypeName" label="房型" width="120" />
            <el-table-column prop="roomName" label="房间名称" width="150" />
            <el-table-column label="调整类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.adjustmentType === 'DECREASE' ? 'danger' : 'warning'">
                  <el-icon>
                    <ArrowDown v-if="row.adjustmentType === 'DECREASE'" />
                    <ArrowUp v-else />
                  </el-icon>
                  {{ row.adjustmentType === 'DECREASE' ? '降价' : '涨价' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="原价" width="100">
              <template #default="{ row }">
                <span class="original-price">¥{{ row.originalPrice }}</span>
              </template>
            </el-table-column>
            <el-table-column label="建议价" width="100">
              <template #default="{ row }">
                <span :class="row.adjustmentType === 'DECREASE' ? 'decrease-price' : 'increase-price'">
                  ¥{{ row.adjustedPrice }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="调整幅度" width="100">
              <template #default="{ row }">
                <span :class="row.adjustmentType === 'DECREASE' ? 'decrease-text' : 'increase-text'">
                  {{ row.adjustmentPercentage }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="预测入住率" width="120">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.occupancyRate" 
                  :color="getOccupancyColor(row.occupancyRate)"
                  :stroke-width="12"
                />
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="建议理由" min-width="250" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button 
                  size="small" 
                  type="success" 
                  link 
                  @click="applySingleSuggestion(row)"
                >
                  应用
                </el-button>
                <el-button 
                  size="small" 
                  type="primary" 
                  link 
                  @click="viewTrend(row)"
                >
                  查看趋势
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="suggestions.length === 0 && !loading" description="暂无价格调整建议">
            <el-button type="primary" @click="loadSuggestions">刷新</el-button>
          </el-empty>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="📈 价格趋势" name="trend">
        <el-card class="card-shadow">
          <div slot="header" class="card-header">
            <span>入住率趋势与价格建议</span>
            <div>
              <el-select v-model="selectedRoomType" placeholder="选择房型" style="width: 180px" @change="loadTrendData">
                <el-option 
                  v-for="type in roomTypes" 
                  :key="type.code" 
                  :label="type.name" 
                  :value="type.code" 
                />
              </el-select>
            </div>
          </div>

          <div ref="trendChartRef" class="chart-container"></div>

          <div class="trend-summary mt-20">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card class="trend-card">
                  <div class="trend-label">平均预测入住率</div>
                  <div class="trend-value" :class="getRateClass(trendData?.averagePredictedRate)">
                    {{ trendData?.averagePredictedRate || 0 }}%
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="trend-card">
                  <div class="trend-label">趋势方向</div>
                  <div class="trend-value">
                    <el-icon><TrendCharts v-if="trendData?.trend === 'rising'" /></el-icon>
                    <el-icon><Minus v-else-if="trendData?.trend === 'stable'" /></el-icon>
                    <el-icon><TrendCharts v-else style="transform: rotate(180deg);" /></el-icon>
                    <span class="ml-10">{{ getTrendText(trendData?.trend) }}</span>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="trend-card">
                  <div class="trend-label">价格建议</div>
                  <div class="trend-value">
                    <el-tag :type="getPriceSuggestionType(trendData?.averagePredictedRate)" effect="light">
                      {{ getPriceSuggestionText(trendData?.averagePredictedRate) }}
                    </el-tag>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="📜 调整历史" name="history">
        <el-card class="card-shadow">
          <div slot="header" class="card-header">
            <span>价格调整历史记录</span>
            <div>
              <el-select v-model="historyFilter" placeholder="筛选状态" clearable style="width: 150px" @change="loadHistory">
                <el-option label="待处理" value="SUGGESTED" />
                <el-option label="已应用" value="APPLIED" />
                <el-option label="已取消" value="CANCELLED" />
              </el-select>
            </div>
          </div>

          <el-table :data="history" v-loading="loadingHistory" stripe>
            <el-table-column prop="adjustmentId" label="ID" width="80" />
            <el-table-column prop="roomTypeName" label="房型" width="120">
              <template #default="{ row }">
                {{ getRoomTypeName(row.roomType) }}
              </template>
            </el-table-column>
            <el-table-column label="价格调整" width="180">
              <template #default="{ row }">
                <span class="original-price">¥{{ row.originalPrice }}</span>
                <el-icon class="mx-10"><ArrowRight /></el-icon>
                <span :class="row.adjustmentType === 'DECREASE' ? 'decrease-price' : 'increase-price'">
                  ¥{{ row.adjustedPrice }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" effect="light">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="occupancyRate" label="入住率" width="100">
              <template #default="{ row }">
                {{ row.occupancyRate }}%
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'SUGGESTED'"
                  size="small" 
                  type="success" 
                  link 
                  @click="applyHistoryItem(row)"
                >
                  应用
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="trendDialogVisible" title="入住率趋势详情" width="800px">
      <div ref="detailTrendChartRef" class="chart-container" style="height: 350px;"></div>
      <div class="detail-info mt-20">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="房型">
            {{ selectedTrendRoom?.roomTypeName }}
          </el-descriptions-item>
          <el-descriptions-item label="房间">
            {{ selectedTrendRoom?.roomName }}
          </el-descriptions-item>
          <el-descriptions-item label="原价">
            ¥{{ selectedTrendRoom?.originalPrice }}
          </el-descriptions-item>
          <el-descriptions-item label="建议价">
            <span :class="selectedTrendRoom?.adjustmentType === 'DECREASE' ? 'decrease-price' : 'increase-price'">
              ¥{{ selectedTrendRoom?.adjustedPrice }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="预测入住率" :span="2">
            <el-progress 
              :percentage="selectedTrendRoom?.occupancyRate" 
              :color="getOccupancyColor(selectedTrendRoom?.occupancyRate)"
            />
          </el-descriptions-item>
          <el-descriptions-item label="建议理由" :span="2">
            {{ selectedTrendRoom?.reason }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="trendDialogVisible = false">关闭</el-button>
        <el-button type="success" @click="applyTrendSuggestion" :loading="applying">
          应用此调价
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { priceApi } from '@/api'

const activeTab = ref('suggestions')
const loading = ref(false)
const applying = ref(false)
const loadingHistory = ref(false)

const suggestions = ref([])
const selectedSuggestions = ref([])
const history = ref([])
const historyFilter = ref('')
const selectedRoomType = ref('SMALL_DOG_ROOM')
const trendData = ref(null)
const trendDialogVisible = ref(false)
const selectedTrendRoom = ref(null)

const trendChartRef = ref(null)
const detailTrendChartRef = ref(null)
let trendChart = null
let detailTrendChart = null

const roomTypes = [
  { code: 'SMALL_DOG_ROOM', name: '小型犬房' },
  { code: 'MEDIUM_DOG_ROOM', name: '中型犬房' },
  { code: 'LARGE_DOG_ROOM', name: '大型犬房' },
  { code: 'CAT_CAVE', name: '猫咪城堡' },
  { code: 'CAT_LOFT', name: '猫咪阁楼' },
  { code: 'DELUXE_CAT_ROOM', name: '豪华猫房' },
  { code: 'SMALL_PET_SUITE', name: '小型宠物套房' }
]

const stats = computed(() => {
  const suggested = suggestions.value.filter(s => true)
  const decrease = suggestions.value.filter(s => s.adjustmentType === 'DECREASE')
  const increase = suggestions.value.filter(s => s.adjustmentType === 'INCREASE')
  const applied = history.value.filter(h => h.status === 'APPLIED')
  
  return {
    suggestedCount: suggested.length,
    decreaseCount: decrease.length,
    increaseCount: increase.length,
    appliedCount: applied.length
  }
})

const getOccupancyColor = (rate) => {
  if (rate < 30) return '#f56c6c'
  if (rate > 90) return '#67c23a'
  return '#409EFF'
}

const getRateClass = (rate) => {
  if (rate < 30) return 'rate-low'
  if (rate > 90) return 'rate-high'
  return 'rate-normal'
}

const getTrendText = (trend) => {
  switch (trend) {
    case 'rising': return '上升'
    case 'falling': return '下降'
    default: return '平稳'
  }
}

const getPriceSuggestionType = (rate) => {
  if (!rate) return 'info'
  if (rate < 30) return 'danger'
  if (rate > 90) return 'warning'
  return 'info'
}

const getPriceSuggestionText = (rate) => {
  if (!rate) return '保持原价'
  if (rate < 30) return '建议降价10%'
  if (rate > 90) return '建议涨价5%'
  return '保持原价'
}

const getStatusType = (status) => {
  switch (status) {
    case 'SUGGESTED': return 'warning'
    case 'APPLIED': return 'success'
    case 'CANCELLED': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'SUGGESTED': return '待处理'
    case 'APPLIED': return '已应用'
    case 'CANCELLED': return '已取消'
    default: return status
  }
}

const getRoomTypeName = (type) => {
  const found = roomTypes.find(t => t.code === type)
  return found ? found.name : type
}

const handleSelectionChange = (selection) => {
  selectedSuggestions.value = selection
}

const loadSuggestions = async () => {
  loading.value = true
  try {
    suggestions.value = await priceApi.getSuggestions()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadHistory = async () => {
  loadingHistory.value = true
  try {
    history.value = await priceApi.getSuggestionHistory(historyFilter.value)
  } catch (e) {
    console.error(e)
  } finally {
    loadingHistory.value = false
  }
}

const loadTrendData = async () => {
  if (!selectedRoomType.value) return
  
  try {
    trendData.value = await priceApi.getPriceTrend(selectedRoomType.value)
    await nextTick()
    renderTrendChart()
  } catch (e) {
    console.error(e)
  }
}

const renderTrendChart = () => {
  if (!trendChartRef.value || !trendData.value) return
  
  if (trendChart) {
    trendChart.dispose()
  }
  
  trendChart = echarts.init(trendChartRef.value)
  
  const trendDataList = trendData.value.trendData || []
  const dates = trendDataList.map(d => dayjs(d.date).format('MM-DD'))
  const rates = trendDataList.map(d => d.occupancyRate)
  
  const markAreas = []
  const markPoints = []
  
  trendDataList.forEach((d, index) => {
    if (d.suggestion === 'DECREASE') {
      markPoints.push({
        name: '建议降价',
        xAxis: index,
        yAxis: d.occupancyRate,
        value: d.occupancyRate + '%',
        itemStyle: { color: '#f56c6c' }
      })
    } else if (d.suggestion === 'INCREASE') {
      markPoints.push({
        name: '建议涨价',
        xAxis: index,
        yAxis: d.occupancyRate,
        value: d.occupancyRate + '%',
        itemStyle: { color: '#e6a23c' }
      })
    }
  })
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = trendDataList[params[0].dataIndex]
        return `
          <div style="font-weight: bold;">${params[0].axisValue}</div>
          <div>入住率: ${params[0].value}%</div>
          <div>建议: ${data.suggestionText}</div>
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      max: 100,
      min: 0,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      name: '入住率',
      type: 'line',
      smooth: true,
      data: rates,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      },
      markLine: {
        silent: true,
        lineStyle: {
          type: 'dashed'
        },
        data: [
          { yAxis: 30, label: { formatter: '降价阈值 30%', position: 'end' }, lineStyle: { color: '#f56c6c' } },
          { yAxis: 90, label: { formatter: '涨价阈值 90%', position: 'end' }, lineStyle: { color: '#e6a23c' } }
        ]
      }
    }]
  }
  
  trendChart.setOption(option)
}

const renderDetailTrendChart = async (roomType) => {
  if (!detailTrendChartRef.value) return
  
  await nextTick()
  
  if (detailTrendChart) {
    detailTrendChart.dispose()
  }
  
  detailTrendChart = echarts.init(detailTrendChartRef.value)
  
  try {
    const data = await priceApi.getPriceTrend(roomType)
    const trendDataList = data.trendData || []
    const dates = trendDataList.map(d => dayjs(d.date).format('MM-DD'))
    const rates = trendDataList.map(d => d.occupancyRate)
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        max: 100,
        min: 0,
        axisLabel: { formatter: '{value}%' }
      },
      series: [{
        name: '入住率',
        type: 'line',
        smooth: true,
        data: rates,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        markLine: {
          silent: true,
          lineStyle: { type: 'dashed' },
          data: [
            { yAxis: 30, label: { formatter: '30%' }, lineStyle: { color: '#f56c6c' } },
            { yAxis: 90, label: { formatter: '90%' }, lineStyle: { color: '#e6a23c' } }
          ]
        }
      }]
    }
    
    detailTrendChart.setOption(option)
  } catch (e) {
    console.error(e)
  }
}

const viewTrend = async (room) => {
  selectedTrendRoom.value = room
  trendDialogVisible.value = true
  await renderDetailTrendChart(room.roomType)
}

const applySingleSuggestion = async (suggestion) => {
  try {
    await ElMessageBox.confirm(
      `确定要将房间"${suggestion.roomName}"的价格从 ¥${suggestion.originalPrice} 调整为 ¥${suggestion.adjustedPrice} 吗？`,
      '确认应用调价',
      { confirmButtonText: '应用', cancelButtonText: '取消', type: 'warning' }
    )
    
    applying.value = true
    
    const saved = await priceApi.saveSuggestion(suggestion)
    await priceApi.applyAdjustment(saved.adjustmentId || 1)
    
    ElMessage.success('调价已应用')
    loadSuggestions()
    loadHistory()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('应用失败')
    }
  } finally {
    applying.value = false
  }
}

const applySelectedSuggestions = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要应用选中的 ${selectedSuggestions.value.length} 条调价建议吗？`,
      '批量应用调价',
      { confirmButtonText: '应用', cancelButtonText: '取消', type: 'warning' }
    )
    
    applying.value = true
    
    let successCount = 0
    for (const suggestion of selectedSuggestions.value) {
      try {
        const saved = await priceApi.saveSuggestion(suggestion)
        await priceApi.applyAdjustment(saved.adjustmentId || 1)
        successCount++
      } catch (e) {
        console.error('Apply failed:', e)
      }
    }
    
    ElMessage.success(`成功应用 ${successCount} 条调价`)
    selectedSuggestions.value = []
    loadSuggestions()
    loadHistory()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('应用失败')
    }
  } finally {
    applying.value = false
  }
}

const applyTrendSuggestion = async () => {
  if (selectedTrendRoom.value) {
    await applySingleSuggestion(selectedTrendRoom.value)
    trendDialogVisible.value = false
  }
}

const applyHistoryItem = async (item) => {
  try {
    await ElMessageBox.confirm(
      '确定要应用此历史调价建议吗？',
      '确认应用',
      { confirmButtonText: '应用', cancelButtonText: '取消', type: 'warning' }
    )
    
    await priceApi.applyAdjustment(item.adjustmentId)
    ElMessage.success('调价已应用')
    loadHistory()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('应用失败')
    }
  }
}

watch(activeTab, (newVal) => {
  if (newVal === 'history') {
    loadHistory()
  }
})

onMounted(() => {
  loadSuggestions()
  loadHistory()
  loadTrendData()
})
</script>

<style scoped>
.price-tabs {
  .el-tabs__header {
    margin-bottom: 20px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card {
  border: none;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.original-price {
  color: #909399;
  text-decoration: line-through;
}

.decrease-price {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}

.increase-price {
  color: #e6a23c;
  font-weight: 600;
  font-size: 16px;
}

.decrease-text {
  color: #f56c6c;
  font-weight: 600;
}

.increase-text {
  color: #e6a23c;
  font-weight: 600;
}

.trend-card {
  text-align: center;
}

.trend-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.trend-value {
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rate-low {
  color: #f56c6c;
}

.rate-high {
  color: #e6a23c;
}

.rate-normal {
  color: #409EFF;
}

.ml-10 {
  margin-left: 10px;
}

.mx-10 {
  margin-left: 10px;
  margin-right: 10px;
}

.mt-20 {
  margin-top: 20px;
}
</style>
