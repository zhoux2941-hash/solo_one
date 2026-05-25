<template>
  <div class="daily-settlement">
    <div class="page-header">
      <h2>日结清单</h2>
      <p class="subtitle">每日加冰结算汇总与明细</p>
    </div>

    <div class="filter-bar">
      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :disabled-date="disabledDate"
        @change="loadData"
      />
      <el-button type="primary" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出清单
      </el-button>
    </div>

    <div v-loading="loading" class="content-area">
      <el-row :gutter="20" class="stats-cards">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon blue">
              <el-icon :size="28"><Ship /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">渔船数量</div>
              <div class="stat-value">{{ dailySettlement?.totalShips || 0 }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon green">
              <el-icon :size="28"><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">申请单数</div>
              <div class="stat-value">{{ dailySettlement?.totalApplications || 0 }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon orange">
              <el-icon :size="28"><Box /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">总加冰量</div>
              <div class="stat-value">{{ (dailySettlement?.totalIceAmount || 0).toFixed(2) }} 吨</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon red">
              <el-icon :size="28"><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">结算金额</div>
              <div class="stat-value">¥ {{ (dailySettlement?.totalAmount || 0).toFixed(2) }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="section">
        <h3>按渔船汇总</h3>
        <el-table :data="summary.byShip" border stripe>
          <el-table-column prop="shipName" label="渔船名称" width="150" />
          <el-table-column prop="applicationCount" label="申请单数" width="100" align="center" />
          <el-table-column prop="totalIceAmount" label="加冰量(吨)" width="120" align="right">
            <template #default="{ row }">
              {{ row.totalIceAmount.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="结算金额(元)" align="right">
            <template #default="{ row }">
              <span class="amount">¥ {{ row.totalAmount.toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="section">
        <h3>结算明细</h3>
        <el-table :data="dailySettlement?.settlements || []" border stripe>
          <el-table-column prop="shipName" label="渔船名称" width="150" />
          <el-table-column prop="applicationId" label="申请单号" width="200" />
          <el-table-column prop="receiptId" label="回单编号" width="200" />
          <el-table-column prop="totalIceAmount" label="加冰量(吨)" width="120" align="right">
            <template #default="{ row }">
              {{ row.totalIceAmount.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="单价(元/吨)" width="120" align="right">
            <template #default="{ row }">
              {{ row.unitPrice.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="结算金额(元)" align="right">
            <template #default="{ row }">
              <span class="amount">¥ {{ row.totalAmount.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button type="primary" link @click="showDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="detailDialogVisible"
      title="结算明细"
      width="600px"
    >
      <div v-if="currentSettlement" class="settlement-detail">
        <div class="detail-header">
          <div class="detail-row">
            <span class="label">渔船名称：</span>
            <span class="value">{{ currentSettlement.shipName }}</span>
          </div>
          <div class="detail-row">
            <span class="label">申请单号：</span>
            <span class="value">{{ currentSettlement.applicationId }}</span>
          </div>
          <div class="detail-row">
            <span class="label">回单编号：</span>
            <span class="value">{{ currentSettlement.receiptId }}</span>
          </div>
          <div class="detail-row">
            <span class="label">结算日期：</span>
            <span class="value">{{ currentSettlement.settlementDate }}</span>
          </div>
        </div>
        
        <el-table :data="currentSettlement.cabins" border size="small">
          <el-table-column prop="cabinName" label="舱位名称" />
          <el-table-column prop="loadedAmount" label="加冰量(吨)" align="right">
            <template #default="{ row }">
              {{ row.loadedAmount.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="单价(元/吨)" align="right">
            <template #default="{ row }">
              {{ row.unitPrice.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额(元)" align="right">
            <template #default="{ row }">
              <span class="amount">¥ {{ row.amount.toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="detail-total">
          <span>合计：</span>
          <span class="total-amount">¥ {{ currentSettlement.totalAmount.toFixed(2) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Ship, Document, Box, Money, Download } from '@element-plus/icons-vue'
import { dailySettlementApi } from '../api'
import type { DailySettlement, SettlementPreview } from '../types'

const loading = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const dailySettlement = ref<DailySettlement | null>(null)
const summary = reactive({
  byShip: [] as Array<{
    shipId: string
    shipName: string
    totalIceAmount: number
    totalAmount: number
    applicationCount: number
  }>,
  totalIceAmount: 0,
  totalAmount: 0
})
const detailDialogVisible = ref(false)
const currentSettlement = ref<SettlementPreview | null>(null)

const disabledDate = (time: Date) => {
  return time.getTime() > Date.now()
}

const loadData = async () => {
  loading.value = true
  try {
    const [settlementRes, summaryRes] = await Promise.all([
      dailySettlementApi.getDaily(selectedDate.value),
      dailySettlementApi.getSummary(selectedDate.value)
    ])

    if (settlementRes.data.success) {
      dailySettlement.value = settlementRes.data.data
    }
    if (summaryRes.data.success) {
      Object.assign(summary, summaryRes.data.data)
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleExport = async () => {
  try {
    const response = await dailySettlementApi.export(selectedDate.value)
    if (response.data.success) {
      const { headers, rows } = response.data.data
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `日结清单_${selectedDate.value}.csv`
      link.click()
      ElMessage.success('导出成功')
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const showDetail = (settlement: SettlementPreview) => {
  currentSettlement.value = settlement
  detailDialogVisible.value = true
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.daily-settlement {
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  color: #606266;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

.content-area {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.stats-cards {
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.stat-icon.red {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.section {
  margin-bottom: 32px;
}

.section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}

.settlement-detail {
  padding: 8px 0;
}

.detail-header {
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  margin-bottom: 8px;
}

.detail-row .label {
  color: #909399;
  width: 80px;
}

.detail-row .value {
  color: #303133;
  font-weight: 500;
}

.detail-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  font-size: 16px;
  font-weight: 600;
}

.total-amount {
  color: #f56c6c;
  font-size: 20px;
  margin-left: 8px;
}
</style>
