<template>
  <div class="stats-page">
    <div class="page-header">
      <h2>统计分析</h2>
      <div class="header-actions">
        <el-select 
          v-model="selectedDepartment" 
          placeholder="选择部门" 
          clearable
          style="width: 200px;"
          @change="loadStats"
        >
          <el-option
            v-for="dept in departments"
            :key="dept"
            :label="dept"
            :value="dept"
          />
        </el-select>
      </div>
    </div>
    
    <el-row :gutter="20" v-loading="loading">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span class="card-title">部门预算执行率统计</span>
          </template>
          <el-table :data="stats" border>
            <el-table-column prop="department" label="部门" width="150" />
            <el-table-column label="预算总额" width="150">
              <template #default="scope">
                <strong>¥{{ scope.row.totalBudget }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="决算总额" width="150">
              <template #default="scope">
                <strong :class="{ 'text-danger': parseFloat(scope.row.totalActual) > parseFloat(scope.row.totalBudget) }">
                  ¥{{ scope.row.totalActual }}
                </strong>
              </template>
            </el-table-column>
            <el-table-column label="执行率" min-width="300">
              <template #default="scope">
                <el-progress 
                  :percentage="parseFloat(scope.row.executionRate)" 
                  :color="getProgressColor(scope.row.executionRate)"
                  :format="formatPercentage"
                />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.executionRate)">
                  {{ getStatusText(scope.row.executionRate) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;" v-loading="loading">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="card-title">部门预算 vs 决算对比</span>
          </template>
          <div ref="barChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="card-title">部门预算执行率</span>
          </template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;" v-loading="loading">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span class="card-title">总体统计</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="总活动数" :value="totalActivities" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总预算" :value="totalBudget" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总结算" :value="totalActual" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic 
                title="整体执行率" 
                :value="overallRate" 
                suffix="%" 
                :value-style="{ color: overallRate > 100 ? '#f56c6c' : '#67c23a' }"
              />
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import api from '../api'

export default {
  name: 'Stats',
  data() {
    return {
      loading: true,
      selectedDepartment: null,
      stats: [],
      barChartRef: null,
      pieChartRef: null,
      barChart: null,
      pieChart: null
    }
  },
  computed: {
    departments() {
      return this.$store.state.departments
    },
    totalActivities() {
      return this.$store.state.activities.length
    },
    totalBudget() {
      return this.$store.state.activities
        .reduce((sum, a) => sum + parseFloat(a.budgetTotal || 0), 0)
        .toFixed(2)
    },
    totalActual() {
      return this.$store.state.activities
        .reduce((sum, a) => sum + parseFloat(a.actualTotal || 0), 0)
        .toFixed(2)
    },
    overallRate() {
      const budget = parseFloat(this.totalBudget)
      if (budget === 0) return 0
      const actual = parseFloat(this.totalActual)
      return ((actual / budget) * 100).toFixed(2)
    }
  },
  async mounted() {
    if (this.departments.length === 0) {
      await this.$store.dispatch('fetchDepartments')
    }
    if (this.$store.state.activities.length === 0) {
      await this.$store.dispatch('fetchActivities')
    }
    await this.loadStats()
  },
  beforeUnmount() {
    if (this.barChart) {
      this.barChart.dispose()
    }
    if (this.pieChart) {
      this.pieChart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    async loadStats() {
      this.loading = true
      try {
        const response = await api.getStats(this.selectedDepartment)
        this.stats = response.data
        this.$nextTick(() => {
          this.initBarChart()
          this.initPieChart()
        })
      } catch (error) {
        this.$message.error('加载统计数据失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    
    getProgressColor(rate) {
      const r = parseFloat(rate)
      if (r > 100) return '#f56c6c'
      if (r >= 90) return '#e6a23c'
      return '#67c23a'
    },
    
    formatPercentage(percentage) {
      return `${percentage}%`
    },
    
    getStatusType(rate) {
      const r = parseFloat(rate)
      if (r > 100) return 'danger'
      if (r >= 90) return 'warning'
      return 'success'
    },
    
    getStatusText(rate) {
      const r = parseFloat(rate)
      if (r > 100) return '超预算'
      if (r >= 90) return '接近预算'
      return '正常'
    },
    
    initBarChart() {
      if (!this.barChartRef || this.stats.length === 0) return
      
      if (this.barChart) {
        this.barChart.dispose()
      }
      
      this.barChart = echarts.init(this.barChartRef)
      
      const departments = this.stats.map(s => s.department)
      const budgetData = this.stats.map(s => parseFloat(s.totalBudget))
      const actualData = this.stats.map(s => parseFloat(s.totalActual))
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            let result = `<strong>${params[0].name}</strong><br/>`
            params.forEach(param => {
              result += `${param.marker}${param.seriesName}: ¥${param.value}<br/>`
            })
            return result
          }
        },
        legend: {
          data: ['预算总额', '决算总额'],
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: departments,
          axisLabel: {
            interval: 0,
            rotate: 30
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        series: [
          {
            name: '预算总额',
            type: 'bar',
            data: budgetData,
            itemStyle: {
              color: '#409eff'
            },
            barWidth: '35%'
          },
          {
            name: '决算总额',
            type: 'bar',
            data: actualData,
            barWidth: '35%',
            itemStyle: {
              color: function(params) {
                const index = params.dataIndex
                return actualData[index] > budgetData[index] ? '#f56c6c' : '#67c23a'
              }
            },
            emphasis: {
              itemStyle: {
                color: function(params) {
                  const index = params.dataIndex
                  return actualData[index] > budgetData[index] ? '#f56c6c' : '#67c23a'
                }
              }
            }
          }
        ]
      }
      
      this.barChart.setOption(option)
    },
    
    initPieChart() {
      if (!this.pieChartRef || this.stats.length === 0) return
      
      if (this.pieChart) {
        this.pieChart.dispose()
      }
      
      this.pieChart = echarts.init(this.pieChartRef)
      
      const pieData = this.stats.map(s => ({
        value: parseFloat(s.executionRate),
        name: s.department
      }))
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}%'
        },
        legend: {
          bottom: 0,
          left: 'center'
        },
        series: [
          {
            name: '执行率',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}: {c}%'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: true
            },
            data: pieData
          }
        ]
      }
      
      this.pieChart.setOption(option)
      
      window.addEventListener('resize', this.handleResize)
    },
    
    handleResize() {
      if (this.barChart) {
        this.barChart.resize()
      }
      if (this.pieChart) {
        this.pieChart.resize()
      }
    }
  }
}
</script>

<style scoped>
.stats-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}
</style>
