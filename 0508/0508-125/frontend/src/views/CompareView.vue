<template>
  <div class="compare-view">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><DataLine /></el-icon> 多日期对比分析</span>
            </div>
          </template>
          
          <el-form :inline="true" class="compare-form">
            <el-form-item label="选择地点">
              <el-select 
                v-model="selectedLocationId" 
                placeholder="请选择地点" 
                style="width: 200px"
                @change="locationChanged"
              >
                <el-option 
                  v-for="loc in locations" 
                  :key="loc.id" 
                  :label="loc.name" 
                  :value="loc.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="选择日期">
              <el-date-picker
                v-model="compareDates"
                type="dates"
                placeholder="选择多个日期"
                style="width: 300px"
                @change="datesChanged"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="loadCompareData" :disabled="!canCompare">
                <el-icon><Search /></el-icon> 开始对比
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card v-if="compareData.length > 0">
          <template #header>
            <div class="card-header">
              <span><el-icon><TrendCharts /></el-icon> 对比图表</span>
              <el-tag type="info">
                共对比 {{ compareData.length }} 天的数据
              </el-tag>
            </div>
          </template>
          
          <div ref="compareChartRef" class="compare-chart"></div>
        </el-card>
        
        <el-card v-else class="empty-card">
          <el-empty description="请选择地点和至少2个日期进行对比" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20" v-if="compareData.length > 0">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><Document /></el-icon> 详细数据分析</span>
            </div>
          </template>
          
          <el-table :data="analysisData" border stripe>
            <el-table-column 
              label="日期" 
              prop="date" 
              width="150"
              fixed
            />
            <el-table-column 
              label="月相" 
              prop="moonPhase"
              width="100"
            />
            <el-table-column 
              label="潮汐强度" 
              prop="tideIntensity"
              width="130"
            >
              <template #default="scope">
                <el-tag :type="getTideIntensityTagType(scope.row)" size="small">
                  <el-icon v-if="scope.row.isAstronomicalSpring"><Warning /></el-icon>
                  <el-icon v-else-if="scope.row.isSpringTide"><InfoFilled /></el-icon>
                  {{ scope.row.tideIntensity }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column 
              label="月地距离" 
              prop="moonDistance"
              width="120"
            >
              <template #default="scope">
                {{ scope.row.moonDistance ? Math.round(scope.row.moonDistance).toLocaleString() : '-' }} km
              </template>
            </el-table-column>
            <el-table-column 
              label="光照率" 
              prop="illumination"
              width="100"
            >
              <template #default="scope">
                <el-progress 
                  :percentage="Math.round(scope.row.illumination)" 
                  :stroke-width="10"
                />
              </template>
            </el-table-column>
            <el-table-column 
              label="平均理论潮位" 
              prop="avgTheoretical"
              width="140"
            >
              <template #default="scope">
                {{ scope.row.avgTheoretical?.toFixed(2) || '-' }} m
              </template>
            </el-table-column>
            <el-table-column 
              label="平均实际潮位" 
              prop="avgActual"
              width="140"
            >
              <template #default="scope">
                {{ scope.row.avgActual?.toFixed(2) || '-' }} m
              </template>
            </el-table-column>
            <el-table-column 
              label="平均偏差" 
              prop="avgDeviation"
              width="140"
            >
              <template #default="scope">
                <el-tag :type="getDeviationType(scope.row.avgDeviation)">
                  {{ scope.row.avgDeviation?.toFixed(2) || '-' }} m
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column 
              label="最大偏差" 
              prop="maxDeviation"
              width="140"
            >
              <template #default="scope">
                <el-tag :type="getDeviationType(scope.row.maxDeviation)">
                  {{ scope.row.maxDeviation?.toFixed(2) || '-' }} m
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column 
              label="实际记录数" 
              prop="recordCount"
              width="100"
            />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20" v-if="analysisData.length > 0">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><Warning /></el-icon> 风场影响分析提示</span>
            </div>
          </template>
          
          <el-alert
            v-for="(analysis, index) in windAnalysis"
            :key="index"
            :title="analysis.title"
            :type="analysis.type"
            :description="analysis.description"
            show-icon
            :closable="false"
            class="analysis-alert"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { locationApi, tideApi } from '@/api/tide'

const locations = ref([])
const selectedLocationId = ref(null)
const compareDates = ref([])
const compareData = ref([])
const compareChartRef = ref(null)
let chart = null

const canCompare = computed(() => {
  return selectedLocationId.value && compareDates.value.length >= 2
})

const analysisData = computed(() => {
  return compareData.value.map(item => {
    const actualRecords = item.records.filter(r => r.actualHeight !== null)
    const avgTheoretical = item.records.length > 0 
      ? item.records.reduce((sum, r) => sum + r.theoreticalHeight, 0) / item.records.length
      : null
    const avgActual = actualRecords.length > 0
      ? actualRecords.reduce((sum, r) => sum + r.actualHeight, 0) / actualRecords.length
      : null
    
    const deviations = actualRecords.map(r => r.actualHeight - r.theoreticalHeight)
    const avgDeviation = deviations.length > 0
      ? deviations.reduce((sum, d) => sum + d, 0) / deviations.length
      : null
    const maxDeviation = deviations.length > 0
      ? Math.max(...deviations.map(Math.abs)) * (deviations.find(d => Math.abs(d) === Math.max(...deviations.map(Math.abs))) >= 0 ? 1 : -1)
      : null

    return {
      date: dayjs(item.date).format('YYYY-MM-DD'),
      moonPhase: item.moonPhase?.phaseName || '-',
      illumination: item.moonPhase?.illumination || 0,
      tideIntensity: item.moonPhase?.tideIntensity || '正常潮汐',
      isAstronomicalSpring: item.moonPhase?.isAstronomicalSpringTide || false,
      isSpringTide: item.moonPhase?.isSpringTide || false,
      moonDistance: item.moonPhase?.moonDistanceKm || null,
      avgTheoretical,
      avgActual,
      avgDeviation,
      maxDeviation,
      recordCount: actualRecords.length
    }
  })
})

const windAnalysis = computed(() => {
  const analyses = []
  
  const astronomicalSpringDays = analysisData.value.filter(item => item.isAstronomicalSpring)
  
  if (astronomicalSpringDays.length > 0) {
    const dates = astronomicalSpringDays.map(d => d.date).join('、')
    analyses.push({
      title: '🌟 天文大潮预警',
      type: 'error',
      description: `对比数据中包含 ${astronomicalSpringDays.length} 个天文大潮日期：${dates}。`
        + ' 天文大潮发生在新月或满月期间，且月球接近近地点（距离 < 370,000公里）。'
        + ' 此时潮汐范围达到最大，是观察潮汐现象的最佳时机。'
        + ' 同时也是分析风场影响的理想时期，因为理论潮汐信号最强。'
    })
  }
  
  const springTideDays = analysisData.value.filter(item => item.isSpringTide && !item.isAstronomicalSpring)
  
  if (springTideDays.length > 0) {
    const dates = springTideDays.map(d => d.date).join('、')
    analyses.push({
      title: '大潮期间观察',
      type: 'warning',
      description: `对比数据中包含 ${springTideDays.length} 个大潮日期：${dates}。`
        + ' 大潮发生在新月或满月期间，太阳、地球、月亮近乎一线。'
        + ' 此时潮汐范围较大，但月地距离较远（> 370,000公里）。'
    })
  }
  
  const significantDeviations = analysisData.value.filter(
    item => Math.abs(item.avgDeviation || 0) > 0.2
  )
  
  if (significantDeviations.length > 0) {
    analyses.push({
      title: '检测到显著偏差',
      type: 'warning',
      description: `检测到 ${significantDeviations.length} 天存在较大偏差（>0.2米）。`
        + ' 这可能是由于风场变化、气压变化或其他气象因素引起的。'
        + ' 建议检查这些日期的天气记录和风向风速数据。'
    })
  }
  
  const neapTideDays = analysisData.value.filter(
    item => !item.isSpringTide && (item.illumination || 0) > 25 && (item.illumination || 0) < 75
  )
  
  if (neapTideDays.length > 0) {
    analyses.push({
      title: '小潮期间观察',
      type: 'info',
      description: '对比数据包含小潮期间（月相为上弦或下弦）。'
        + ' 小潮期间潮汐范围较小，实际潮位与理论值的偏差可能更明显。'
    })
  }
  
  const perigeeDays = analysisData.value.filter(item => item.moonDistance && item.moonDistance < 375000)
  
  if (perigeeDays.length > 0 && astronomicalSpringDays.length === 0) {
    const avgDistance = Math.round(perigeeDays.reduce((sum, d) => sum + d.moonDistance, 0) / perigeeDays.length)
    analyses.push({
      title: '近地点观察',
      type: 'success',
      description: `对比数据中包含 ${perigeeDays.length} 天月球接近近地点。`
        + ` 平均月地距离约 ${avgDistance.toLocaleString()} 公里。`
        + ' 月球引力增强，可能对潮汐产生额外影响。'
    })
  }
  
  return analyses
})

const loadLocations = async () => {
  try {
    const response = await locationApi.getAll()
    locations.value = response.data
  } catch (error) {
    console.error('加载地点失败:', error)
  }
}

const locationChanged = () => {
  compareData.value = []
}

const datesChanged = () => {
  compareData.value = []
}

const loadCompareData = async () => {
  if (!canCompare.value) return
  
  compareData.value = []
  
  try {
    const promises = compareDates.value.map(async (date) => {
      const dateStr = dayjs(date).format('YYYY-MM-DD')
      
      const [tideResponse, moonResponse] = await Promise.all([
        tideApi.getDaily(selectedLocationId.value, dateStr),
        tideApi.getMoonPhase(dateStr)
      ])
      
      return {
        date: dateStr,
        records: tideResponse.data,
        moonPhase: moonResponse.data
      }
    })
    
    compareData.value = await Promise.all(promises)
    updateCompareChart()
  } catch (error) {
    console.error('加载对比数据失败:', error)
  }
}

const initChart = () => {
  if (!compareChartRef.value) return
  
  chart = echarts.init(compareChartRef.value)
  
  window.addEventListener('resize', () => {
    chart?.resize()
  })
}

const updateCompareChart = () => {
  if (!chart || compareData.value.length === 0) return
  
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#00B42A']
  
  const times = compareData.value[0].records.map(r => 
    dayjs(r.recordTime).format('HH:mm')
  )
  
  const series = compareData.value.map((item, index) => ({
    name: dayjs(item.date).format('MM-DD'),
    type: 'line',
    smooth: true,
    data: item.records.map(r => Number(r.theoreticalHeight.toFixed(2))),
    itemStyle: {
      color: colors[index % colors.length]
    },
    symbol: 'none',
    lineStyle: {
      width: 2
    },
    emphasis: {
      focus: 'series'
    }
  }))

  const option = {
    title: {
      text: '多日期潮汐曲线对比',
      left: 'center',
      textStyle: {
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: compareData.value.map(d => dayjs(d.date).format('MM-DD')),
      top: 40
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 100,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLabel: {
        formatter: (value, index) => {
          return index % 4 === 0 ? value : ''
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '潮位 (米)',
      axisLabel: {
        formatter: '{value} m'
      }
    },
    series: series
  }

  chart.setOption(option)
}

const getDeviationType = (deviation) => {
  if (deviation === null || deviation === undefined) return 'info'
  const abs = Math.abs(deviation)
  if (abs > 0.5) return 'danger'
  if (abs > 0.2) return 'warning'
  return 'success'
}

const getTideIntensityTagType = (row) => {
  if (row.isAstronomicalSpring) return 'danger'
  if (row.isSpringTide) return 'warning'
  if (row.tideIntensity?.includes('小潮')) return 'info'
  return 'success'
}

onMounted(() => {
  loadLocations()
  initChart()
})

watch(() => compareData.value, () => {
  updateCompareChart()
}, { deep: true })

onUnmounted(() => {
  chart?.dispose()
})
</script>

<style scoped>
.compare-form {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compare-chart {
  height: 500px;
  width: 100%;
}

.empty-card {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.analysis-alert {
  margin-bottom: 15px;
}

.analysis-alert:last-child {
  margin-bottom: 0;
}
</style>
