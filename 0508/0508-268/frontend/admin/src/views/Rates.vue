<template>
  <div class="rates">
    <h2>费率配置</h2>
    
    <el-card>
      <template #header>
        <div class="card-header">
          <span>费率列表</span>
          <el-button type="primary" size="small">新增费率</el-button>
        </div>
      </template>
      <el-table :data="rates" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="rateType" label="费率类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getRateType(row.rateType)">{{ getRateText(row.rateType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="120" />
        <el-table-column prop="endTime" label="结束时间" width="120" />
        <el-table-column prop="pricePerHour" label="每小时单价" width="120">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: bold">¥{{ row.pricePerHour }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="maxDailyFee" label="单日最高" width="120">
          <template #default="{ row }">
            <span style="color: #E6A23C; font-weight: bold">¥{{ row.maxDailyFee }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="freeMinutes" label="免费时长(分钟)" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">
              {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link>编辑</el-button>
            <el-button type="danger" size="small" link>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const rates = ref([
  {
    id: 1,
    rateType: 'DAYTIME',
    startTime: '08:00',
    endTime: '20:00',
    pricePerHour: 5.00,
    maxDailyFee: 50.00,
    freeMinutes: 30,
    status: 'ACTIVE'
  },
  {
    id: 2,
    rateType: 'NIGHTTIME',
    startTime: '20:00',
    endTime: '08:00',
    pricePerHour: 2.00,
    maxDailyFee: 20.00,
    freeMinutes: 30,
    status: 'ACTIVE'
  },
  {
    id: 3,
    rateType: 'HOLIDAY',
    startTime: '00:00',
    endTime: '23:59',
    pricePerHour: 3.00,
    maxDailyFee: 30.00,
    freeMinutes: 30,
    status: 'ACTIVE'
  }
])

const getRateType = (type) => {
  const map = {
    'DAYTIME': 'primary',
    'NIGHTTIME': 'success',
    'HOLIDAY': 'warning'
  }
  return map[type] || 'info'
}

const getRateText = (type) => {
  const map = {
    'DAYTIME': '日间',
    'NIGHTTIME': '夜间',
    'HOLIDAY': '节假日'
  }
  return map[type] || type
}

onMounted(() => {})
</script>

<style scoped>
.rates {
  padding: 20px;
}

.rates h2 {
  margin-bottom: 20px;
  color: #333;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
