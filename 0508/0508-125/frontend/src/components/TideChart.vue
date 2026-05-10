<template>
  <div ref="chartRef" class="tide-chart"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  moonPhase: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['record-click'])

const chartRef = ref(null)
let chart = null

const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  
  chart.on('click', (params) => {
    if (params.seriesType === 'line' && props.records[params.dataIndex]) {
      emit('record-click', props.records[params.dataIndex])
    }
  })
  
  window.addEventListener('resize', () => {
    chart?.resize()
  })
}

const updateChart = () => {
  if (!chart || !props.records.length) return
  
  const times = props.records.map(r => 
    dayjs(r.recordTime).format('HH:mm')
  )
  
  const theoretical = props.records.map(r => 
    Number(r.theoreticalHeight.toFixed(2))
  )
  
  const actual = props.records.map(r => 
    r.actualHeight !== null ? Number(r.actualHeight.toFixed(2)) : null
  )
  
  const deviations = props.records.map(r => 
    r.actualHeight !== null 
      ? Number((r.actualHeight - r.theoreticalHeight).toFixed(2))
      : null
  )

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: (params) => {
        let result = `<div style="font-weight: bold; margin-bottom: 8px;">${params[0].axisValue}</div>`
        
        params.forEach(p => {
          if (p.value !== null && p.value !== undefined) {
            let color = p.color
            let label = p.seriesName
            let value = p.value
            
            if (label === '实际潮位' && props.records[p.dataIndex]?.actualHeight !== null) {
              const deviation = deviations[p.dataIndex]
              const deviationStr = deviation >= 0 ? `+${deviation}` : deviation
              result += `<div style="display: flex; align-items: center; margin: 4px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>
                ${label}: ${value} m (偏差: ${deviationStr} m)
              </div>`
            } else if (label === '理论潮位') {
              result += `<div style="display: flex; align-items: center; margin: 4px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>
                ${label}: ${value} m
              </div>`
            }
          }
        })
        
        return result
      }
    },
    legend: {
      data: ['理论潮位', '实际潮位', '偏差'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
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
    yAxis: [
      {
        type: 'value',
        name: '潮位 (米)',
        position: 'left',
        axisLabel: {
          formatter: '{value} m'
        }
      },
      {
        type: 'value',
        name: '偏差 (米)',
        position: 'right',
        axisLabel: {
          formatter: '{value} m'
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '理论潮位',
        type: 'line',
        smooth: true,
        data: theoretical,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '实际潮位',
        type: 'line',
        smooth: true,
        data: actual,
        itemStyle: {
          color: '#67C23A'
        },
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(103, 194, 58, 0.5)'
          }
        }
      },
      {
        name: '偏差',
        type: 'bar',
        yAxisIndex: 1,
        data: deviations,
        itemStyle: {
          color: (params) => {
            if (params.value === null) return 'transparent'
            return params.value >= 0 ? '#E6A23C' : '#F56C6C'
          }
        },
        barWidth: 2
      }
    ],
    graphic: props.moonPhase ? [
      {
        type: 'group',
        right: 100,
        top: 10,
        children: [
          {
            type: 'text',
            style: {
              text: `月相: ${props.moonPhase.phaseName}`,
              fontSize: 14,
              fill: '#606266',
              fontWeight: 'bold'
            }
          },
          {
            type: 'text',
            style: {
              text: `光照: ${Math.round(props.moonPhase.illumination)}%`,
              fontSize: 12,
              fill: '#909399'
            },
            top: 20
          }
        ]
      }
    ] : []
  }

  chart.setOption(option)
}

onMounted(() => {
  initChart()
  updateChart()
})

watch(() => props.records, () => {
  updateChart()
}, { deep: true })

watch(() => props.moonPhase, () => {
  updateChart()
})

onUnmounted(() => {
  chart?.dispose()
})
</script>

<style scoped>
.tide-chart {
  width: 100%;
  height: 100%;
}
</style>
