<template>
  <div class="tank-card" :class="{ 'has-warning': tankData.abnormalCount > 0 }">
    <div class="card-header">
      <h3 class="tank-name">{{ tankData.tankName }}</h3>
      <div class="status-badge" :class="getStatusClass()">
        {{ getStatusText() }}
      </div>
    </div>
    
    <div class="card-body">
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">当前pH</span>
          <span class="stat-value" :class="getCurrentPhClass()">
            {{ currentPh }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">异常时长占比</span>
          <span class="stat-value abnormal-rate" :class="getAbnormalRateClass()">
            {{ tankData.abnormalRate.toFixed(1) }}%
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">异常次数</span>
          <span class="stat-value">{{ tankData.abnormalCount }}/{{ tankData.totalCount }}</span>
        </div>
      </div>
      
      <div class="chart-container">
        <div :id="'chart-' + chartId" class="chart"></div>
      </div>
      
      <div class="ph-records">
        <div class="records-header">
          <span>过去24小时pH值记录</span>
          <span class="normal-range">正常范围: 7.8 ~ 8.4</span>
        </div>
        <div class="records-grid">
          <div
            v-for="(record, index) in tankData.records"
            :key="index"
            class="record-item"
            :class="{ abnormal: record.isAbnormal }"
            :title="formatTime(record.recordTime) + ' pH: ' + record.phValue"
          >
            <div class="record-ph" :class="getPhValueClass(record.phValue)">
              {{ record.phValue }}
            </div>
            <div class="record-time">{{ formatHour(record.recordTime) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { ref, onMounted, watch, nextTick } from 'vue'

export default {
  name: 'TankCard',
  props: {
    tankData: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const chartId = ref(props.index)
    let chartInstance = null

    const PH_MIN = 7.8
    const PH_MAX = 8.4

    const currentPh = ref('')

    const getCurrentPh = () => {
      if (props.tankData.records && props.tankData.records.length > 0) {
        return props.tankData.records[props.tankData.records.length - 1].phValue.toFixed(2)
      }
      return '--'
    }

    const getStatusText = () => {
      if (props.tankData.abnormalCount === 0) return '正常'
      if (props.tankData.abnormalRate > 20) return '严重异常'
      return '轻微异常'
    }

    const getStatusClass = () => {
      if (props.tankData.abnormalCount === 0) return 'status-normal'
      if (props.tankData.abnormalRate > 20) return 'status-danger'
      return 'status-warning'
    }

    const getCurrentPhClass = () => {
      const ph = parseFloat(getCurrentPh())
      if (ph < PH_MIN || ph > PH_MAX) return 'ph-abnormal'
      return 'ph-normal'
    }

    const getPhValueClass = (ph) => {
      if (ph < PH_MIN || ph > PH_MAX) return 'ph-abnormal'
      return 'ph-normal'
    }

    const getAbnormalRateClass = () => {
      if (props.tankData.abnormalRate === 0) return ''
      if (props.tankData.abnormalRate > 20) return 'rate-danger'
      return 'rate-warning'
    }

    const formatHour = (time) => {
      if (!time) return ''
      const date = new Date(time)
      return date.getHours().toString().padStart(2, '0') + ':00'
    }

    const formatTime = (time) => {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`
    }

    const initChart = () => {
      const chartDom = document.getElementById('chart-' + chartId.value)
      if (!chartDom) return

      if (chartInstance) {
        chartInstance.dispose()
      }

      chartInstance = echarts.init(chartDom)

      const times = props.tankData.records.map(r => formatHour(r.recordTime))
      const values = props.tankData.records.map(r => r.phValue)

      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const data = params[0]
            const isAbnormal = data.value < PH_MIN || data.value > PH_MAX
            return `${data.axisValue}<br/>pH: ${data.value}<br/>状态: ${isAbnormal ? '<span style="color:#ef4444">异常</span>' : '<span style="color:#22c55e">正常</span>'}`
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
          boundaryGap: false,
          data: times,
          axisLine: { lineStyle: { color: '#4a5568' } },
          axisLabel: { color: '#a0aec0', fontSize: 10 }
        },
        yAxis: {
          type: 'value',
          min: 7.0,
          max: 9.2,
          axisLine: { lineStyle: { color: '#4a5568' } },
          axisLabel: { color: '#a0aec0' },
          splitLine: { lineStyle: { color: '#2d3748' } }
        },
        series: [
          {
            name: 'pH值',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            data: values,
            lineStyle: {
              color: '#38bdf8',
              width: 2
            },
            itemStyle: {
              color: (params) => {
                return params.value < PH_MIN || params.value > PH_MAX ? '#ef4444' : '#38bdf8'
              }
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(56, 189, 248, 0.3)' },
                { offset: 1, color: 'rgba(56, 189, 248, 0.05)' }
              ])
            },
            markLine: {
              silent: true,
              symbol: 'none',
              data: [
                {
                  yAxis: PH_MIN,
                  lineStyle: { color: '#f59e0b', type: 'dashed', width: 1 },
                  label: { formatter: '下限 7.8', color: '#f59e0b', fontSize: 10 }
                },
                {
                  yAxis: PH_MAX,
                  lineStyle: { color: '#f59e0b', type: 'dashed', width: 1 },
                  label: { formatter: '上限 8.4', color: '#f59e0b', fontSize: 10 }
                }
              ]
            }
          }
        ]
      }

      chartInstance.setOption(option)
    }

    onMounted(() => {
      currentPh.value = getCurrentPh()
      nextTick(() => {
        initChart()
      })
    })

    watch(() => props.tankData, () => {
      currentPh.value = getCurrentPh()
      nextTick(() => {
        initChart()
      })
    }, { deep: true })

    return {
      chartId,
      currentPh,
      getStatusText,
      getStatusClass,
      getCurrentPhClass,
      getPhValueClass,
      getAbnormalRateClass,
      formatHour,
      formatTime
    }
  }
}
</script>

<style scoped>
.tank-card {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  border: 1px solid #334155;
  padding: 20px;
  transition: all 0.3s ease;
}

.tank-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  border-color: #475569;
}

.tank-card.has-warning {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(44, 35, 45, 0.8);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tank-name {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-normal {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px 8px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.ph-normal {
  color: #22c55e;
}

.ph-abnormal {
  color: #ef4444;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.abnormal-rate {
  font-size: 18px;
}

.rate-warning {
  color: #f59e0b;
}

.rate-danger {
  color: #ef4444;
}

.chart-container {
  height: 180px;
  margin-bottom: 16px;
}

.chart {
  width: 100%;
  height: 100%;
}

.ph-records {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
  padding: 12px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
  color: #94a3b8;
}

.normal-range {
  color: #f59e0b;
  font-size: 11px;
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.record-item {
  text-align: center;
  padding: 6px 4px;
  border-radius: 4px;
  background: rgba(30, 41, 59, 0.6);
  transition: all 0.2s ease;
}

.record-item:hover {
  background: rgba(51, 65, 85, 0.8);
  transform: scale(1.05);
}

.record-item.abnormal {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.record-ph {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.record-time {
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}
</style>
