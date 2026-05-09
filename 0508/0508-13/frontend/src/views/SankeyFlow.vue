<template>
  <div>
    <h1 class="page-title">包裹路径桑基图</h1>

    <div class="search-bar">
      <el-button type="primary" @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <div v-if="!sankeyData.nodes || sankeyData.nodes.length === 0" class="chart-container">
      <el-empty description="暂无数据" />
    </div>

    <div v-else class="chart-container">
      <div class="chart-title">🌐 包裹流向分析（从发货地到签收地）</div>
      <div ref="sankeyChartRef" style="height: 600px;"></div>
    </div>

    <div v-if="sankeyData.nodes && sankeyData.nodes.length > 0" class="chart-container">
      <div class="chart-title">📊 热门线路统计</div>
      <el-table :data="popularRoutes" border>
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column label="出发城市" width="150">
          <template #default="scope">
            <el-tag type="primary">{{ scope.row.sourceName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="到达城市" width="150">
          <template #default="scope">
            <el-tag type="success">{{ scope.row.targetName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="包裹数量" width="150">
          <template #default="scope">
            <strong>{{ scope.row.value }} 件</strong>
          </template>
        </el-table-column>
        <el-table-column label="占比" width="200">
          <template #default="scope">
            <el-progress
              :percentage="getPercentage(scope.row.value)"
              :status="getProgressStatus(scope.row.value)"
              :stroke-width="16"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { statisticsApi } from '../api'
import { Refresh } from '@element-plus/icons-vue'

const sankeyChartRef = ref(null)
let sankeyChart = null

const sankeyData = ref({
  nodes: [],
  links: []
})

const popularRoutes = computed(() => {
  const routes = [...(sankeyData.value.links || [])]
  return routes
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
})

const totalPackages = computed(() => {
  return popularRoutes.value.reduce((sum, r) => sum + r.value, 0)
})

const loadData = async () => {
  try {
    const data = await statisticsApi.getSankeyData()
    sankeyData.value = data || { nodes: [], links: [] }
    updateSankeyChart()
  } catch (error) {
    console.error('加载桑基图数据失败:', error)
  }
}

const getPercentage = (value) => {
  if (totalPackages.value === 0) return 0
  return Math.round((value / totalPackages.value) * 100)
}

const getProgressStatus = (value) => {
  const percentage = getPercentage(value)
  if (percentage >= 40) return 'exception'
  if (percentage >= 20) return 'warning'
  return 'success'
}

const updateSankeyChart = () => {
  if (!sankeyChartRef.value) return

  if (!sankeyChart) {
    sankeyChart = echarts.init(sankeyChartRef.value)
  }

  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
    '#909399', '#8E44AD', '#3498DB', '#1ABC9C',
    '#E74C3C', '#F39C12'
  ]

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.dataType === 'node') {
          return `<strong>${params.name}</strong><br/>包裹数: ${params.value}`
        } else {
          return `${params.data.sourceName} → ${params.data.targetName}<br/>包裹数: ${params.value}`
        }
      }
    },
    color: colors,
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: {
          focus: 'adjacency'
        },
        data: sankeyData.value.nodes,
        links: sankeyData.value.links,
        lineStyle: {
          color: 'gradient',
          curveness: 0.5
        },
        label: {
          fontSize: 14,
          fontWeight: 'bold'
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: '#aaa'
        },
        lineStyle: {
          opacity: 0.6,
          curveness: 0.5
        }
      }
    ]
  }

  sankeyChart.setOption(option)
}

const handleResize = () => {
  sankeyChart?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  sankeyChart?.dispose()
})
</script>
