<template>
  <div class="prediction-container" v-if="predictionData">
    <div class="prediction-header">
      <h3 class="prediction-title">
        <span class="wheelchair-badge">{{ selectedWheelchair }}</span>
        磨损趋势预测（未来7天）
      </h3>
      <div class="prediction-metrics" v-if="predictionData.regressionMetrics">
        <div class="metric-item">
          <span class="metric-label">R² 拟合度</span>
          <span class="metric-value">{{ predictionData.regressionMetrics.r2.toFixed(2) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">日趋势</span>
          <span class="metric-value" :class="getTrendClass(predictionData.regressionMetrics.dailyTrend)">
            {{ predictionData.regressionMetrics.dailyTrend > 0 ? '+' : '' }}{{ predictionData.regressionMetrics.dailyTrend.toFixed(2) }}/天
          </span>
        </div>
      </div>
    </div>
    
    <div ref="predictionChartRef" class="prediction-chart"></div>
    
    <div class="prediction-legend">
      <div class="legend-item">
        <span class="legend-line historical"></span>
        <span>历史数据（30天）</span>
      </div>
      <div class="legend-item">
        <span class="legend-line prediction"></span>
        <span>预测数据（7天）</span>
      </div>
      <div class="legend-item">
        <span class="legend-line confidence"></span>
        <span>95% 置信区间</span>
      </div>
    </div>
  </div>
  
  <div class="prediction-empty" v-else>
    <div class="empty-icon">📊</div>
    <p class="empty-text">点击上方柱状图选择轮椅查看预测趋势</p>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  predictionData: {
    type: Object,
    default: null
  },
  selectedWheelchair: {
    type: String,
    default: ''
  }
})

const predictionChartRef = ref(null)
let predictionChartInstance = null

const getTrendClass = (trend) => {
  if (trend > 1) return 'trend-up'
  if (trend < 0) return 'trend-down'
  return 'trend-stable'
}

const initPredictionChart = () => {
  if (!predictionChartRef.value || !props.predictionData) return
  
  if (predictionChartInstance) {
    predictionChartInstance.dispose()
  }
  
  predictionChartInstance = echarts.init(predictionChartRef.value)
  updatePredictionChart()
}

const updatePredictionChart = () => {
  if (!predictionChartInstance || !props.predictionData) return

  const historical = props.predictionData.historicalData || []
  const predictions = props.predictionData.predictionData || []
  
  if (historical.length === 0 && predictions.length === 0) return

  const historicalDates = historical.map(d => d.date)
  const historicalValues = historical.map(d => d.wearValue)
  
  const predictionDates = predictions.map(d => d.date)
  const predictionValues = predictions.map(d => d.predictedWear)
  const lowerBounds = predictions.map(d => d.lowerBound)
  const upperBounds = predictions.map(d => d.upperBound)

  const allDates = [...historicalDates, ...predictionDates]
  
  const historicalSeriesData = historicalValues.map((val, idx) => [historicalDates[idx], val])
  const predictionSeriesData = predictionValues.map((val, idx) => [predictionDates[idx], val])
  
  const lastHistoricalValue = historicalValues.length > 0 ? historicalValues[historicalValues.length - 1] : null
  const firstPredictionValue = predictionValues.length > 0 ? predictionValues[0] : null
  
  if (lastHistoricalValue !== null && firstPredictionValue !== null) {
    predictionSeriesData.unshift([historicalDates[historicalDates.length - 1], lastHistoricalValue])
  }

  const lowerBoundData = lowerBounds.map((val, idx) => [predictionDates[idx], val])
  const upperBoundData = upperBounds.map((val, idx) => [predictionDates[idx], val])
  
  if (lastHistoricalValue !== null) {
    lowerBoundData.unshift([historicalDates[historicalDates.length - 1], lastHistoricalValue])
    upperBoundData.unshift([historicalDates[historicalDates.length - 1], lastHistoricalValue])
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      formatter: function(params) {
        let result = `<strong>${params[0].axisValue}</strong><br/>`
        params.forEach(param => {
          if (param.seriesName === '历史数据' || param.seriesName === '预测数据') {
            result += `${param.seriesName}: <strong>${param.value[1]}</strong><br/>`
          }
        })
        const predParams = params.find(p => p.seriesName === '预测数据')
        if (predParams && predParams.dataIndex > 0) {
          const idx = predParams.dataIndex - 1
          if (lowerBounds[idx] !== undefined) {
            result += `<span style="color:#999;font-size:12px">置信区间: ${lowerBounds[idx].toFixed(1)} ~ ${upperBounds[idx].toFixed(1)}</span>`
          }
        }
        return result
      }
    },
    legend: {
      data: ['历史数据', '预测数据'],
      top: 10,
      textStyle: {
        color: '#333',
        fontSize: 13
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: allDates,
      boundaryGap: false,
      axisLabel: {
        fontSize: 11,
        color: '#666',
        rotate: 45,
        interval: Math.floor(allDates.length / 10)
      },
      axisLine: {
        lineStyle: {
          color: '#ccc'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '磨损值 (0-100)',
      nameTextStyle: {
        fontSize: 13,
        color: '#333'
      },
      min: 0,
      max: 100,
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#e0e0e0'
        }
      }
    },
    series: [
      {
        name: '历史数据',
        type: 'line',
        data: historicalSeriesData,
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#667eea'
        },
        itemStyle: {
          color: '#667eea',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        }
      },
      {
        name: '预测数据',
        type: 'line',
        data: predictionSeriesData,
        smooth: false,
        symbol: 'diamond',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          type: 'dashed',
          color: '#f5576c'
        },
        itemStyle: {
          color: '#f5576c',
          borderWidth: 2,
          borderColor: '#fff'
        }
      },
      {
        name: '置信区间上限',
        type: 'line',
        data: upperBoundData,
        showSymbol: false,
        lineStyle: {
          width: 0
        },
        stack: 'confidence',
        areaStyle: {
          color: 'rgba(245, 87, 108, 0.1)'
        },
        tooltip: {
          show: false
        }
      },
      {
        name: '置信区间下限',
        type: 'line',
        data: lowerBoundData,
        showSymbol: false,
        lineStyle: {
          width: 0
        },
        stack: 'confidence',
        areaStyle: {
          color: 'rgba(245, 87, 108, 0.05)'
        },
        tooltip: {
          show: false
        }
      }
    ]
  }

  predictionChartInstance.setOption(option)
}

const handleResize = () => {
  if (predictionChartInstance) {
    predictionChartInstance.resize()
  }
}

watch(() => props.predictionData, () => {
  nextTick(() => {
    if (props.predictionData) {
      initPredictionChart()
    }
  })
}, { deep: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (props.predictionData) {
    nextTick(() => initPredictionChart())
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (predictionChartInstance) {
    predictionChartInstance.dispose()
  }
})
</script>

<style scoped>
.prediction-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.prediction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.prediction-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.wheelchair-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  margin-right: 10px;
}

.prediction-metrics {
  display: flex;
  gap: 20px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 10px;
}

.metric-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.metric-value.trend-up {
  color: #e53935;
}

.metric-value.trend-down {
  color: #43a047;
}

.metric-value.trend-stable {
  color: #757575;
}

.prediction-chart {
  height: 400px;
  width: 100%;
}

.prediction-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.legend-line {
  width: 30px;
  height: 4px;
  border-radius: 2px;
}

.legend-line.historical {
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.legend-line.prediction {
  background: repeating-linear-gradient(
    90deg,
    #f5576c,
    #f5576c 4px,
    transparent 4px,
    transparent 8px
  );
}

.legend-line.confidence {
  background: rgba(245, 87, 108, 0.15);
}

.prediction-empty {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 60px 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px dashed #e0e0e0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.empty-text {
  font-size: 16px;
  color: #999;
  margin: 0;
}
</style>
