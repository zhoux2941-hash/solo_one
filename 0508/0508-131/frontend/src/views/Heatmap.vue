<template>
  <div class="page-container">
    <div class="card">
      <h3 class="card-title">季节性鱼种出现热力图</h3>
      <div ref="chartRef" style="width: 100%; height: 500px;"></div>
    </div>

    <div class="card mt-20">
      <h3 class="card-title">数据说明</h3>
      <el-row :gutter="20">
        <el-col :span="8" v-for="species in speciesList" :key="species.id">
          <div class="species-info">
            <h4>{{ species.name }}</h4>
            <p v-if="species.description">{{ species.description }}</p>
            <p class="temp-range">
              适宜水温: {{ species.minTemp }}°C - {{ species.maxTemp }}°C
            </p>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="card mt-20">
      <h3 class="card-title">热力图数据表</h3>
      <el-table :data="tableData" style="width: 100%" border>
        <el-table-column prop="speciesName" label="鱼种" width="100" fixed />
        <el-table-column v-for="month in months" :key="month" :prop="`month_${month}`" :label="month" width="80" align="center">
          <template #default="scope">
            <span
              :style="{
                background: getColor(scope.row[`month_${month}`]),
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                color: scope.row[`month_${month}`] > 5 ? '#fff' : '#333'
              }"
            >
              {{ scope.row[`month_${month}`] || 0 }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getHeatmap, getAllSpecies } from '@/api/fishing'

const chartRef = ref(null)
const speciesList = ref([])
const heatmapData = ref([])
const tableData = ref([])
const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

let chart = null

const loadData = async () => {
  try {
    const [speciesRes, heatmapRes] = await Promise.all([
      getAllSpecies(),
      getHeatmap()
    ])
    speciesList.value = speciesRes.data
    heatmapData.value = heatmapRes.data
    buildTableData()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const buildTableData = () => {
  const speciesMap = new Map()
  speciesList.value.forEach(species => {
    speciesMap.set(species.id, {
      speciesName: species.name
    })
    for (let i = 1; i <= 12; i++) {
      speciesMap.get(species.id)[`month_${months[i - 1]}`] = 0
    }
  })

  heatmapData.value.forEach(item => {
    const species = speciesMap.get(item.speciesId)
    if (species) {
      species[`month_${item.monthName}`] = item.count
    }
  })

  tableData.value = Array.from(speciesMap.values())
}

const getColor = (value) => {
  if (!value || value === 0) return '#f5f5f5'
  if (value <= 2) return '#e0f2f1'
  if (value <= 5) return '#80cbc4'
  if (value <= 10) return '#26a69a'
  return '#00796b'
}

const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  
  const speciesNames = speciesList.value.map(s => s.name)
  const chartData = []
  let maxValue = 0

  heatmapData.value.forEach(item => {
    const speciesIndex = speciesList.value.findIndex(s => s.id === item.speciesId)
    if (speciesIndex !== -1) {
      chartData.push([item.month - 1, speciesIndex, item.count])
      maxValue = Math.max(maxValue, item.count)
    }
  })

  const option = {
    tooltip: {
      position: 'top',
      formatter: function(params) {
        return `${speciesNames[params.data[1]]}<br/>${months[params.data[0]]}<br/>钓获次数: ${params.data[2]}`
      }
    },
    grid: {
      top: '10%',
      left: '15%',
      right: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: months,
      splitArea: {
        show: true
      }
    },
    yAxis: {
      type: 'category',
      data: speciesNames,
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: maxValue || 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#e0f2f1', '#b2dfdb', '#80cbc4', '#4db6ac', '#26a69a', '#00796b']
      }
    },
    series: [{
      name: '钓获次数',
      type: 'heatmap',
      data: chartData,
      label: {
        show: true,
        color: '#333'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  chart.setOption(option)
}

onMounted(async () => {
  await loadData()
  await nextTick()
  initChart()

  window.addEventListener('resize', () => {
    chart?.resize()
  })
})
</script>

<style scoped>
.species-info {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.species-info h4 {
  margin: 0 0 8px;
  color: #303133;
}

.species-info p {
  margin: 0 0 4px;
  font-size: 14px;
  color: #606266;
}

.species-info .temp-range {
  color: #409eff;
  font-weight: 500;
}
</style>
