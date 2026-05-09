<template>
  <div ref="chartRef" style="width: 100%; height: 500px;"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  graphData: {
    type: Object,
    default: () => ({
      nodes: [],
      links: [],
      categories: []
    })
  }
})

const chartRef = ref(null)
let chartInstance = null

function initChart() {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
  
  window.addEventListener('resize', handleResize)
}

function handleResize() {
  chartInstance?.resize()
}

function updateChart() {
  if (!chartInstance) return
  
  const { nodes = [], links = [], categories = [] } = props.graphData
  
  if (nodes.length === 0) {
    chartInstance.setOption({
      title: {
        text: '暂无作弊模式数据',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#999',
          fontSize: 16
        }
      },
      series: []
    })
    return
  }
  
  const option = {
    title: {
      text: '作弊行为关联图',
      subtext: '节点大小表示发生频率，连线粗细表示关联强度',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        color: '#333'
      },
      subtextStyle: {
        fontSize: 12,
        color: '#999'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        if (params.dataType === 'edge') {
          const confidence = (params.data.value * 100).toFixed(1)
          const strength = params.data.strength?.toFixed(1) || '-'
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${params.data.sourceLabel || params.data.source} → ${params.data.targetLabel || params.data.target}
            </div>
            <div>置信度: ${confidence}%</div>
            <div>关联强度: ${strength}</div>
          `
        }
        return `
          <div style="font-weight: bold; margin-bottom: 4px;">
            ${params.data.name}
          </div>
          <div>发生次数: ${params.data.count || 0}</div>
        `
      }
    },
    legend: {
      show: true,
      data: categories.map(c => c.name),
      bottom: 10,
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        animation: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          fontSize: 12,
          color: '#333'
        },
        draggable: true,
        data: nodes,
        categories: categories,
        force: {
          repulsion: 300,
          gravity: 0.1,
          edgeLength: [80, 200],
          layoutAnimation: true
        },
        edges: links.map(link => ({
          ...link,
          sourceLabel: getNodeName(link.source, nodes),
          targetLabel: getNodeName(link.target, nodes)
        })),
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 10],
        edgeLabel: {
          show: true,
          formatter: function(params) {
            return (params.data.value * 100).toFixed(0) + '%'
          },
          fontSize: 11,
          color: '#666'
        },
        lineStyle: {
          opacity: 0.9,
          curveness: 0.2,
          color: 'source'
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 8
          }
        },
        roam: true,
        zoom: 1,
        roam: true
      }
    ],
    grid: {
      top: 80,
      bottom: 80,
      left: 50,
      right: 50
    }
  }
  
  chartInstance.setOption(option)
}

function getNodeName(nodeId, nodes) {
  const node = nodes.find(n => n.id === nodeId)
  return node ? node.name : nodeId
}

watch(() => props.graphData, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>
