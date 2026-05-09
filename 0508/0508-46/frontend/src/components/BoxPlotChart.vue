<template>
  <div class="boxplot-chart">
    <h3>等待时间分布 (箱线图)</h3>
    <div ref="chartRef" class="chart"></div>
    <div class="explanation">
      <p><strong>箱线图说明：</strong></p>
      <ul>
        <li><span class="box-color"></span> 箱体：25%-75% 四分位距</li>
        <li>中间线：中位数</li>
        <li>须线：1.5倍四分位距</li>
      </ul>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'BoxPlotChart',
  props: {
    waitTimeData: {
      type: Object,
      default: () => ({})
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

      const children = Object.keys(this.waitTimeData || {})
      if (children.length === 0) {
        this.chart.clear()
        return
      }

      const boxData = children.map(childName => {
        const times = (this.waitTimeData[childName] || []).map(Number)
        return this.calculateBoxPlotData(times)
      })

      const option = {
        tooltip: {
          trigger: 'item',
          formatter: function (params) {
            const data = params.value
            return `${params.name}<br/>
                    最小值: ${data[0]}s<br/>
                    Q1: ${data[1]}s<br/>
                    中位数: ${data[2]}s<br/>
                    Q3: ${data[3]}s<br/>
                    最大值: ${data[4]}s`
          }
        },
        grid: {
          left: '15%',
          right: '10%',
          top: '10%',
          bottom: '20%'
        },
        xAxis: {
          type: 'category',
          data: children,
          name: '孩子',
          nameLocation: 'middle',
          nameGap: 30,
          axisLabel: {
            rotate: 0
          }
        },
        yAxis: {
          type: 'value',
          name: '等待时间 (秒)',
          nameLocation: 'middle',
          nameGap: 50
        },
        series: [{
          type: 'boxplot',
          data: boxData,
          itemStyle: {
            color: '#2196f3',
            borderColor: '#1565c0'
          },
          boxWidth: [40, 80]
        }]
      }

      this.chart.setOption(option, true)
    },
    calculateBoxPlotData(data) {
      if (!data || data.length === 0) {
        return [0, 0, 0, 0, 0]
      }

      const sorted = [...data].sort((a, b) => a - b)
      const n = sorted.length

      const min = sorted[0]
      const max = sorted[n - 1]
      const median = this.percentile(sorted, 0.5)
      const q1 = this.percentile(sorted, 0.25)
      const q3 = this.percentile(sorted, 0.75)

      const iqr = q3 - q1
      const lowerBound = Math.max(min, q1 - 1.5 * iqr)
      const upperBound = Math.min(max, q3 + 1.5 * iqr)

      return [lowerBound, q1, median, q3, upperBound]
    },
    percentile(sorted, p) {
      const n = sorted.length
      const index = (n - 1) * p
      const floorIndex = Math.floor(index)
      const ceilIndex = Math.ceil(index)

      if (floorIndex === ceilIndex) {
        return sorted[floorIndex]
      }

      const weight = index - floorIndex
      return sorted[floorIndex] * (1 - weight) + sorted[ceilIndex] * weight
    }
  }
}
</script>

<style scoped>
.boxplot-chart {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.boxplot-chart h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.chart {
  width: 100%;
  height: 300px;
}

.explanation {
  margin-top: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.explanation p {
  margin: 0 0 5px 0;
}

.explanation ul {
  margin: 0;
  padding-left: 20px;
}

.explanation li {
  margin: 3px 0;
}

.box-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  background: #2196f3;
  margin-right: 5px;
  vertical-align: middle;
}
</style>
