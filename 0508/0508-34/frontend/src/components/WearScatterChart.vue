<template>
  <div class="chart-container">
    <div ref="chartRef" class="chart"></div>
    <div class="legend-panel">
      <div class="legend-title">磨损度图例</div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #52c41a;"></span>
        <span>低磨损 (0-30)</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #faad14;"></span>
        <span>中磨损 (31-60)</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #f5222d;"></span>
        <span>高磨损 (61-100)</span>
      </div>
      <div class="legend-divider"></div>
      <div class="legend-item">
        <span class="legend-line" style="background: #1890ff;"></span>
        <span>预测趋势线</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  detectionPoints: {
    type: Array,
    default: () => []
  },
  predictionData: {
    type: Object,
    default: null
  }
})

const chartRef = ref(null)
let chartInstance = null

const getPointColor = (wearDegree) => {
  if (wearDegree <= 30) return '#52c41a'
  if (wearDegree <= 60) return '#faad14'
  return '#f5222d'
}

const getPointSize = (wearDegree) => {
  return 10 + wearDegree * 0.5
}

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance || !props.detectionPoints.length) return

  const scatterData = props.detectionPoints.map(point => ({
    value: [point.distance, point.wearDegree],
    symbolSize: getPointSize(point.wearDegree),
    itemStyle: {
      color: getPointColor(point.wearDegree)
    }
  }))

  const series = [
    {
      name: '磨损度',
      type: 'scatter',
      data: scatterData,
      symbol: 'circle',
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 2,
        borderColor: '#fff'
      },
      emphasis: {
        scale: true,
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(255, 255, 255, 0.5)'
        }
      },
      zlevel: 10
    }
  ]

  if (props.predictionData && props.predictionData.predictions) {
    const predictionLineData = props.predictionData.predictions.map(p => [
      p.distance,
      p.predictedWear
    ])

    series.push({
      name: '预测趋势',
      type: 'line',
      data: predictionLineData,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3,
        type: 'dashed',
        color: '#1890ff',
        opacity: 0.9
      },
      itemStyle: {
        color: '#1890ff',
        borderWidth: 2,
        borderColor: '#fff'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
          { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
        ])
      },
      tooltip: {
        formatter: (params) => {
          const [distance, wear] = params.data.value
          const predPoint = props.predictionData.predictions.find(p => p.distance === distance)
          const dailyPreds = predPoint?.dailyPredictions || []
          const trend = predPoint?.trend || 0
          const trendText = trend > 0 ? '↑ 上升' : trend < 0 ? '↓ 下降' : '→ 平稳'
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px; color: #1890ff;">预测值 #${params.dataIndex + 1}</div>
              <div>距离: ${distance} 米</div>
              <div>预测磨损度: ${wear.toFixed(2)}</div>
              <div>趋势: ${trendText} (${trend.toFixed(3)})</div>
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2);">
                <div style="font-size: 11px; color: #aaa;">未来3天预测:</div>
                ${dailyPreds.map((v, i) => `<div style="font-size: 11px;">第${i + 1}天: ${v.toFixed(2)}</div>`).join('')}
              </div>
            </div>
          `
        }
      },
      zlevel: 5
    })
  }

  const yAxisConfig = {
    type: 'value',
    name: '磨损度',
    nameLocation: 'end',
    nameGap: 10,
    min: 0,
    max: 100,
    axisLabel: {
      color: '#ccc',
      formatter: '{value}'
    },
    axisLine: {
      lineStyle: {
        color: '#555'
      }
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    }
  }

  const option = {
    title: {
      text: '盲道障碍物磨损度空间分布' + (props.predictionData ? ' & 趋势预测' : ''),
      subtext: props.predictionData 
        ? `预测日期: ${props.predictionData.predictionDate} | 模型: ${props.predictionData.modelUsed}`
        : '',
      left: 'center',
      top: 15,
      textStyle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold'
      },
      subtextStyle: {
        color: '#8c8c8c',
        fontSize: 12
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.seriesName === '预测趋势') return undefined
        const [distance, wear] = params.data.value
        let status = '低磨损'
        if (wear > 60) status = '高磨损'
        else if (wear > 30) status = '中磨损'
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">检测点 #${params.dataIndex + 1}</div>
            <div>距离: ${distance} 米</div>
            <div>磨损度: ${wear}</div>
            <div>状态: <span style="color: ${params.color};">${status}</span></div>
          </div>
        `
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '距离起点（米）',
      nameLocation: 'middle',
      nameGap: 30,
      min: -5,
      max: 105,
      axisLabel: {
        color: '#ccc',
        formatter: '{value}m'
      },
      axisLine: {
        lineStyle: {
          color: '#555'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    yAxis: yAxisConfig,
    series: series
  }

  chartInstance.setOption(option, true)
}

const handleResize = () => {
  chartInstance?.resize()
}

watch([() => props.detectionPoints, () => props.predictionData], () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 500px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.chart {
  width: 100%;
  height: 100%;
}

.legend-panel {
  position: absolute;
  right: 20px;
  top: 80px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-title {
  color: #fff;
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 14px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  color: #ccc;
  font-size: 12px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-line {
  width: 24px;
  height: 3px;
  border-radius: 2px;
}

.legend-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 10px 0;
}
</style>
