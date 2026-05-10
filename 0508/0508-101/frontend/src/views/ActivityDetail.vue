<template>
  <div class="activity-detail-page">
    <div class="page-header">
      <el-button @click="goBack" :icon="ArrowLeft">
        返回列表
      </el-button>
      <h2>活动详情</h2>
    </div>
    
    <el-row :gutter="20" v-loading="loading">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="card-title">基本信息</span>
          </template>
          
          <el-descriptions :column="1" border>
            <el-descriptions-item label="活动名称">
              {{ activity?.name }}
            </el-descriptions-item>
            <el-descriptions-item label="申请部门">
              {{ activity?.department }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(activity?.status)">
                {{ getStatusText(activity?.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="预算总额">
              <strong>¥{{ activity?.budgetTotal }}</strong>
            </el-descriptions-item>
            <el-descriptions-item label="决算总额">
              <strong :class="{ 'text-danger': isExceeded }">
                ¥{{ activity?.actualTotal || 0 }}
              </strong>
            </el-descriptions-item>
            <el-descriptions-item label="执行率">
              <el-progress 
                :percentage="executionRate" 
                :color="executionRate > 100 ? '#f56c6c' : '#67c23a'"
              />
            </el-descriptions-item>
          </el-descriptions>
          
          <div class="action-buttons" v-if="!activity?.actualItems?.length || canSubmitActual">
            <el-divider />
            <el-button 
              v-if="canSubmitActual"
              type="success" 
              @click="submitActual"
            >
              提交决算
            </el-button>
            <el-button 
              v-if="canApprove"
              type="warning" 
              @click="approveActivity"
            >
              审批通过
            </el-button>
            <el-button 
              v-if="canApprove"
              type="danger" 
              @click="rejectActivity"
            >
              拒绝审批
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="card-title">预算 vs 决算对比图</span>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;" v-if="activity">
      <el-col :span="12" v-if="activity.budgetItems?.length">
        <el-card>
          <template #header>
            <span class="card-title">预算细项</span>
          </template>
          <el-table :data="activity.budgetItems" border>
            <el-table-column prop="itemName" label="项目名称" />
            <el-table-column label="金额">
              <template #default="scope">
                ¥{{ scope.row.amount }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12" v-if="activity.actualItems?.length">
        <el-card>
          <template #header>
            <span class="card-title">决算细项</span>
          </template>
          <el-table :data="activity.actualItems" border>
            <el-table-column prop="itemName" label="项目名称" />
            <el-table-column label="金额">
              <template #default="scope">
                <span :class="{ 'text-danger': isItemExceeded(scope.row) }">
                  ¥{{ scope.row.amount }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;" v-if="budgetChanges.length > 0">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header-with-actions">
              <span class="card-title">预算变更日志</span>
              <el-button 
                v-if="pendingChange"
                size="small" 
                type="warning"
                @click="openReviewDialog"
              >
                审批待处理的变更申请
              </el-button>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(change, index) in budgetChanges"
              :key="change.id"
              :timestamp="formatDate(change.createdAt)"
              placement="top"
              :type="getTimelineType(change.status)"
              :color="getTimelineColor(change.status)"
            >
              <el-card :shadow="hover">
                <h4 style="margin: 0 0 10px 0;">
                  <el-tag :type="getChangeTagType(change.status)" size="small">
                    {{ getChangeStatusText(change.status) }}
                  </el-tag>
                  <span style="margin-left: 10px;">预算变更申请</span>
                </h4>
                <div class="timeline-content">
                  <p><strong>原预算：</strong>¥{{ change.originalBudget }}</p>
                  <p><strong>新预算：</strong>¥{{ change.newBudget }}</p>
                  <p>
                    <strong>变更金额：</strong>
                    <span :class="{ 
                      'text-success': parseFloat(change.changeAmount) > 0,
                      'text-danger': parseFloat(change.changeAmount) < 0
                    }">
                      {{ parseFloat(change.changeAmount) >= 0 ? '+' : '' }}{{ change.changeAmount }}
                    </span>
                  </p>
                  <p><strong>变更理由：</strong>{{ change.reason }}</p>
                  <p v-if="change.reviewedAt">
                    <strong>审批时间：</strong>{{ formatDate(change.reviewedAt) }}
                  </p>
                  <p v-if="change.reviewReason">
                    <strong>审批意见：</strong>{{ change.reviewReason }}
                  </p>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
    
    <el-dialog
      v-model="actualDialogVisible"
      title="提交决算"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="actualForm" label-width="120px">
        <el-form-item label="活动名称">
          {{ activity?.name }}
        </el-form-item>
        <el-form-item label="预算总额">
          ¥{{ activity?.budgetTotal }}
        </el-form-item>
        
        <el-divider content-position="left">决算细项</el-divider>
        
        <div v-for="(item, index) in actualForm.actualItems" :key="index" class="actual-item">
          <el-input 
            v-model="item.itemName" 
            placeholder="项目名称" 
            style="width: 200px; margin-right: 10px;"
          />
          <el-input-number
            v-model="item.amount"
            :min="0"
            :precision="2"
            placeholder="金额"
            style="width: 150px;"
          />
          <el-button 
            type="danger" 
            size="small" 
            @click="removeActualItem(index)"
            style="margin-left: 10px;"
          >
            删除
          </el-button>
        </div>
        
        <el-button type="primary" size="small" @click="addActualItem">
          添加细项
        </el-button>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="actualDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitActualForm" :loading="submitting">
            提交
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <el-dialog
      v-model="reviewDialogVisible"
      title="审批预算变更申请"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="pendingChange">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="活动名称">
            {{ activity?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="原预算">
            ¥{{ pendingChange.originalBudget }}
          </el-descriptions-item>
          <el-descriptions-item label="新预算">
            ¥{{ pendingChange.newBudget }}
          </el-descriptions-item>
          <el-descriptions-item label="变更金额">
            <span :class="{ 
              'text-success': parseFloat(pendingChange.changeAmount) > 0,
              'text-danger': parseFloat(pendingChange.changeAmount) < 0
            }">
              {{ parseFloat(pendingChange.changeAmount) >= 0 ? '+' : '' }}{{ pendingChange.changeAmount }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="变更理由">
            {{ pendingChange.reason }}
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">
            {{ formatDate(pendingChange.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <el-form style="margin-top: 20px;" label-width="100px">
          <el-form-item label="审批意见">
            <el-input
              v-model="reviewForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入审批意见（拒绝时必填）"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="rejectChange" :loading="reviewing">
            拒绝
          </el-button>
          <el-button type="primary" @click="approveChange" :loading="reviewing">
            通过
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ArrowLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import api from '../api'

export default {
  name: 'ActivityDetail',
  components: { ArrowLeft },
  data() {
    return {
      loading: true,
      activity: null,
      chartRef: null,
      chart: null,
      actualDialogVisible: false,
      submitting: false,
      actualForm: {
        actualItems: [{ itemName: '', amount: 0 }]
      },
      budgetChanges: [],
      reviewDialogVisible: false,
      reviewing: false,
      reviewForm: {
        reason: ''
      }
    }
  },
  computed: {
    isExceeded() {
      if (!this.activity) return false
      const actual = parseFloat(this.activity.actualTotal || 0)
      const budget = parseFloat(this.activity.budgetTotal || 0)
      return actual > budget
    },
    executionRate() {
      if (!this.activity || parseFloat(this.activity.budgetTotal) === 0) return 0
      const actual = parseFloat(this.activity.actualTotal || 0)
      const budget = parseFloat(this.activity.budgetTotal)
      return Math.round((actual / budget) * 100)
    },
    canSubmitActual() {
      return this.activity?.status === 'CREATED' || this.activity?.status === 'REJECTED'
    },
    canApprove() {
      return this.activity?.status === 'SUBMITTED'
    },
    pendingChange() {
      return this.budgetChanges.find(c => c.status === 'PENDING')
    }
  },
  async mounted() {
    await this.loadActivity()
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    async loadActivity() {
      this.loading = true
      try {
        const response = await api.getActivityById(this.$route.params.id)
        this.activity = response.data
        
        await this.loadBudgetChanges()
        
        this.$nextTick(() => {
          this.initChart()
        })
      } catch (error) {
        this.$message.error('加载活动详情失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    
    async loadBudgetChanges() {
      try {
        const response = await api.getBudgetChangesByActivity(this.$route.params.id)
        this.budgetChanges = response.data
      } catch (error) {
        console.error('加载预算变更记录失败:', error)
      }
    },
    
    goBack() {
      this.$router.back()
    },
    
    getStatusType(status) {
      const map = {
        'CREATED': 'info',
        'SUBMITTED': 'warning',
        'APPROVED': 'success',
        'REJECTED': 'danger',
        'CLOSED': 'success'
      }
      return map[status] || 'info'
    },
    
    getStatusText(status) {
      const map = {
        'CREATED': '已创建',
        'SUBMITTED': '待审批',
        'APPROVED': '已批准',
        'REJECTED': '已拒绝',
        'CLOSED': '已关闭'
      }
      return map[status] || status
    },
    
    isItemExceeded(item) {
      if (!this.activity?.budgetItems) return false
      const budgetItem = this.activity.budgetItems.find(
        b => b.itemName === item.itemName
      )
      if (budgetItem) {
        return parseFloat(item.amount) > parseFloat(budgetItem.amount)
      }
      return false
    },
    
    initChart() {
      if (!this.chartRef || !this.activity) return
      
      if (this.chart) {
        this.chart.dispose()
      }
      
      this.chart = echarts.init(this.chartRef)
      
      const budgetItems = this.activity.budgetItems || []
      const actualItems = this.activity.actualItems || []
      
      const allItemNames = new Set()
      budgetItems.forEach(item => allItemNames.add(item.itemName))
      actualItems.forEach(item => allItemNames.add(item.itemName))
      
      const itemNames = Array.from(allItemNames)
      
      const budgetData = itemNames.map(name => {
        const item = budgetItems.find(b => b.itemName === name)
        return item ? parseFloat(item.amount) : 0
      })
      
      const actualData = itemNames.map(name => {
        const item = actualItems.find(a => a.itemName === name)
        return item ? parseFloat(item.amount) : 0
      })
      
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
          data: ['预算', '决算'],
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
          data: itemNames,
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
            name: '预算',
            type: 'bar',
            data: budgetData,
            itemStyle: {
              color: '#409eff'
            },
            barWidth: '30%'
          },
          {
            name: '决算',
            type: 'bar',
            data: actualData,
            barWidth: '30%',
            itemStyle: {
              color: function(params) {
                const index = params.dataIndex
                const actual = actualData[index]
                const budget = budgetData[index]
                if (actual > budget) {
                  return '#f56c6c'
                }
                return '#67c23a'
              }
            },
            emphasis: {
              itemStyle: {
                color: function(params) {
                  const index = params.dataIndex
                  const actual = actualData[index]
                  const budget = budgetData[index]
                  if (actual > budget) {
                    return '#f56c6c'
                  }
                  return '#67c23a'
                }
              }
            }
          }
        ]
      }
      
      this.chart.setOption(option)
      
      window.addEventListener('resize', this.handleResize)
    },
    
    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    getTimelineType(status) {
      const map = {
        'PENDING': 'warning',
        'APPROVED': 'success',
        'REJECTED': 'danger'
      }
      return map[status] || 'info'
    },
    
    getTimelineColor(status) {
      const map = {
        'PENDING': '#e6a23c',
        'APPROVED': '#67c23a',
        'REJECTED': '#f56c6c'
      }
      return map[status] || '#909399'
    },
    
    getChangeTagType(status) {
      const map = {
        'PENDING': 'warning',
        'APPROVED': 'success',
        'REJECTED': 'danger'
      }
      return map[status] || 'info'
    },
    
    getChangeStatusText(status) {
      const map = {
        'PENDING': '待审批',
        'APPROVED': '已通过',
        'REJECTED': '已拒绝'
      }
      return map[status] || status
    },
    
    openReviewDialog() {
      this.reviewForm.reason = ''
      this.reviewDialogVisible = true
    },
    
    async approveChange() {
      if (!this.pendingChange) return
      
      this.reviewing = true
      try {
        await this.$store.dispatch('approveBudgetChange', {
          id: this.pendingChange.id,
          reviewReason: this.reviewForm.reason
        })
        
        this.$message.success('预算变更已审批通过')
        this.reviewDialogVisible = false
        await this.loadActivity()
      } catch (error) {
        this.$message.error('审批失败：' + (error.response?.data?.message || error.message))
      } finally {
        this.reviewing = false
      }
    },
    
    async rejectChange() {
      if (!this.pendingChange) return
      
      if (!this.reviewForm.reason || this.reviewForm.reason.trim().length < 5) {
        this.$message.warning('请输入拒绝理由（至少5个字符）')
        return
      }
      
      this.reviewing = true
      try {
        await this.$store.dispatch('rejectBudgetChange', {
          id: this.pendingChange.id,
          reviewReason: this.reviewForm.reason
        })
        
        this.$message.success('已拒绝预算变更申请')
        this.reviewDialogVisible = false
        await this.loadActivity()
      } catch (error) {
        this.$message.error('操作失败：' + (error.response?.data?.message || error.message))
      } finally {
        this.reviewing = false
      }
    },
    
    submitActual() {
      this.actualForm.actualItems = [{ itemName: '', amount: 0 }]
      this.actualDialogVisible = true
    },
    
    addActualItem() {
      this.actualForm.actualItems.push({ itemName: '', amount: 0 })
    },
    
    removeActualItem(index) {
      if (this.actualForm.actualItems.length > 1) {
        this.actualForm.actualItems.splice(index, 1)
      }
    },
    
    async submitActualForm() {
      const validItems = this.actualForm.actualItems.filter(
        item => item.itemName && item.amount > 0
      )
      
      if (validItems.length === 0) {
        this.$message.warning('请至少添加一个有效的决算细项')
        return
      }
      
      this.submitting = true
      try {
        await this.$store.dispatch('submitActual', {
          id: this.activity.id,
          data: { actualItems: validItems }
        })
        this.$message.success('决算提交成功')
        this.actualDialogVisible = false
        await this.loadActivity()
      } catch (error) {
        this.$message.error('提交失败：' + (error.response?.data?.message || error.message))
      } finally {
        this.submitting = false
      }
    },
    
    async approveActivity() {
      try {
        await this.$confirm('确定要审批通过该活动的决算吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await this.$store.dispatch('approveActivity', this.activity.id)
        this.$message.success('审批通过，活动已关闭')
        await this.loadActivity()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('审批失败：' + (error.response?.data?.message || error.message))
        }
      }
    },
    
    async rejectActivity() {
      try {
        await this.$confirm('确定要拒绝该活动的决算吗？负责人需要重新提交。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await this.$store.dispatch('rejectActivity', this.activity.id)
        this.$message.success('已拒绝，负责人可重新提交决算')
        await this.loadActivity()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('操作失败：' + (error.response?.data?.message || error.message))
        }
      }
    }
  }
}
</script>

<style scoped>
.activity-detail-page {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 0 20px;
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

.action-buttons {
  display: flex;
  gap: 10px;
}

.actual-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
