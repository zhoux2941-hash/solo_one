<template>
  <div class="gantt-chart">
    <h3>模拟时间线 (甘特图)</h3>
    <div ref="chartRef" class="chart"></div>
    <div class="legend">
      <div class="legend-item">
        <span class="color-box wait"></span>
        <span>等待中</span>
      </div>
      <div class="legend-item">
        <span class="color-box play"></span>
        <span>游玩中</span>
      </div>
      <div class="legend-item">
        <span class="color-box leave"></span>
        <span>离开</span>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

const PHASE_COLORS = {
  '等待': '#ff9800',
  '游玩': '#4caf50',
  '离开': '#f44336'
}

export default {
  name: 'GanttChart',
  props: {
    timeline: {
      type: Array,
      required: true
    },
    totalTime: {
      type: Number,
      default: 120
    }
  },
  data() {
    return {
      chart: null
    }
  },
  mounted() {
    this.initChart()
  },
  updated() {
    this.updateChart()
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    initChart() {
      if (!this.$refs.chartRef) return
      this.chart = echarts.init(this.$refs.chartRef)
      this.updateChart()
      window.addEventListener('resize', () => {
        this.chart && this.chart.resize()
      })
    },
    updateChart() {
      if (!this.chart) return

      const safeTimeline = (this.timeline || []).filter(e => e && e.childName)
      if (safeTimeline.length === 0) {
        this.chart.clear()
        return
      }

      const children = [...new Set(safeTimeline.map(e => e.childName))]
      
      const seriesData = children.map(child => {
        const childEvents = safeTimeline.filter(e => e.childName === child)
        return childEvents.map(event => ({
          name: event.phase || '未知',
          value: [
            children.indexOf(child),
            Number(event.startTime) || 0,
            Number(event.endTime) || 0,
            (Number(event.endTime) || 0) - (Number(event.startTime) || 0)
          ],
          itemStyle: {
            color: PHASE_COLORS[event.phase] || '#999'
          }
        }))
      }).flat()

      const option = {
        tooltip: {
          formatter: function (params) {
            const data = params.value
            const child = children[data[0]]
            const duration = data[3]
            return `${child} - ${params.name}<br/>
                    开始: ${data[1]}秒<br/>
                    结束: ${data[2]}秒<br/>
                    持续: ${duration}秒`
          }
        },
        grid: {
          left: '15%',
          right: '5%',
          top: '10%',
          bottom: '15%'
        },
        xAxis: {
          type: 'value',
          min: 0,
          max: this.totalTime,
          name: '时间 (秒)',
          nameLocation: 'middle',
          nameGap: 30,
          axisLabel: {
            formatter: '{value}s'
          }
        },
        yAxis: {
          type: 'category',
          data: children,
          name: '孩子',
          nameLocation: 'middle',
          nameGap: 50,
          inverse: true
        },
        series: [{
          type: 'custom',
          renderItem: function (params, api) {
            const categoryIndex = api.value(0)
            const start = api.coord([api.value(1), categoryIndex])
            const end = api.coord([api.value(2), categoryIndex])
            const height = api.size([0, 1])[1] * 0.6
            
            return {
              type: 'rect',
              shape: {
                x: start[0],
                y: start[1] - height / 2,
                width: end[0] - start[0],
                height: height
              },
              style: api.style()
            }
          },
          encode: {
            x: [1, 2],
            y: 0
          },
          data: seriesData
        }]
      }

      this.chart.setOption(option, true)
    }
  }
}
</script>

<style scoped>
.gantt-chart {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.gantt-chart h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.chart {
  width: 100%;
  height: 350px;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #666;
}

.color-box {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.color-box.wait {
  background: #ff9800;
}

.color-box.play {
  background: #4caf50;
}

.color-box.leave {
  background: #f44336;
}
</style>
