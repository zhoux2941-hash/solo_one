<template>
  <div class="ranking-stats">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>部门消费排行榜</span>
          </template>
          <div ref="deptChartRef" class="chart"></div>
          <el-table :data="deptRanking" style="width: 100%; margin-top: 15px;" max-height="300">
            <el-table-column prop="rank" label="排名" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.rank <= 3" :type="getRankType(row.rank)" effect="dark">
                  {{ row.rank }}
                </el-tag>
                <span v-else>{{ row.rank }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="部门" />
            <el-table-column prop="userCount" label="参与人数" width="100" />
            <el-table-column prop="finalAmount" label="消费金额(元)" width="120">
              <template #default="{ row }">
                <strong>{{ row.finalAmount }}</strong>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>个人消费排行榜</span>
          </template>
          <div ref="userChartRef" class="chart"></div>
          <el-table :data="userRanking" style="width: 100%; margin-top: 15px;" max-height="300">
            <el-table-column prop="rank" label="排名" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.rank <= 3" :type="getRankType(row.rank)" effect="dark">
                  {{ row.rank }}
                </el-tag>
                <span v-else>{{ row.rank }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="userName" label="姓名" width="100" />
            <el-table-column prop="participateCount" label="参与次数" width="100" />
            <el-table-column prop="initiateCount" label="发起次数" width="100" />
            <el-table-column prop="finalAmount" label="消费金额(元)" width="120">
              <template #default="{ row }">
                <strong>{{ row.finalAmount }}</strong>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>整体月度趋势</span>
          </template>
          <div ref="trendChartRef" class="chart-large"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { statsApi } from '../api'

const deptRanking = ref([])
const userRanking = ref([])
const monthlyOrderStats = ref([])

const deptChartRef = ref(null)
const userChartRef = ref(null)
const trendChartRef = ref(null)

let deptChart = null
let userChart = null
let trendChart = null

const getRankType = (rank) => {
  const types = ['danger', 'warning', 'success']
  return types[rank - 1] || 'info'
}

const loadData = async () => {
  try {
    deptRanking.value = await statsApi.getDepartmentRanking(10)
    userRanking.value = await statsApi.getUserRanking(10)
    monthlyOrderStats.value = await statsApi.getMonthlyOrderStats(6)
    
    await nextTick()
    initCharts()
  } catch (e) {
    console.error('加载排行榜数据失败', e)
  }
}

const initCharts = () => {
  if (deptChartRef.value && deptRanking.value.length > 0) {
    deptChart = echarts.init(deptChartRef.value)
    deptChart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        data: deptRanking.value.map(item => ({
          value: parseFloat(item.finalAmount) || 0,
          name: item.department
        }))
      }]
    })
  }

  if (userChartRef.value && userRanking.value.length > 0) {
    userChart = echarts.init(userChartRef.value)
    const top5 = userRanking.value.slice(0, 5)
    userChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01]
      },
      yAxis: {
        type: 'category',
        data: top5.map(item => item.userName).reverse()
      },
      series: [{
        type: 'bar',
        data: top5.map(item => parseFloat(item.finalAmount) || 0).reverse(),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }]
    })
  }

  if (trendChartRef.value && monthlyOrderStats.value.length > 0) {
    trendChart = echarts.init(trendChartRef.value)
    const months = monthlyOrderStats.value.map(item => item.month)
    const orderCounts = monthlyOrderStats.value.map(item => item.orderCount)
    const totalAmounts = monthlyOrderStats.value.map(item => parseFloat(item.totalAmount) || 0)
    const finalAmounts = monthlyOrderStats.value.map(item => parseFloat(item.finalAmount) || 0)

    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['拼单次数', '原价总额', '实付总额'] },
      xAxis: { type: 'category', data: months },
      yAxis: [
        { type: 'value', name: '次数' },
        { type: 'value', name: '金额(元)' }
      ],
      series: [
        {
          name: '拼单次数',
          type: 'bar',
          data: orderCounts,
          itemStyle: { color: '#67c23a' },
          yAxisIndex: 0
        },
        {
          name: '原价总额',
          type: 'line',
          data: totalAmounts,
          smooth: true,
          itemStyle: { color: '#e6a23c' },
          yAxisIndex: 1
        },
        {
          name: '实付总额',
          type: 'line',
          data: finalAmounts,
          smooth: true,
          itemStyle: { color: '#f56c6c' },
          yAxisIndex: 1
        }
      ]
    })
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.chart {
  height: 250px;
}

.chart-large {
  height: 350px;
}
</style>
