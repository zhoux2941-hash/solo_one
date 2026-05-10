<template>
  <div class="my-bills-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的账单</span>
        </div>
      </template>

      <el-table :data="myBills" v-loading="loading" style="width: 100%">
        <el-table-column prop="billDate" label="账单月份" width="150" />
        <el-table-column prop="electricityAmount" label="电费(元)">
          <template #default="{ row }">
            ¥{{ row.electricityAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="waterAmount" label="水费(元)">
          <template #default="{ row }">
            ¥{{ row.waterAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总金额(元)">
          <template #default="{ row }">
            ¥{{ row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="perPersonAmount" label="应缴金额(元)">
          <template #default="{ row }">
            <span class="amount">¥{{ row.perPersonAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="缴费状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '已缴费' : '未缴费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paidAt" label="缴费时间">
          <template #default="{ row }">
            {{ row.paidAt ? new Date(row.paidAt).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              link
              @click="handlePay(row.billId)"
            >
              我已缴费
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && myBills.length === 0" description="暂无账单记录" />
    </el-card>

    <el-card style="margin-top: 20px" v-if="myBills.length > 0">
      <template #header>
        <div class="card-header">
          <span>缴费统计</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-item">
            <span class="stat-label">账单总数</span>
            <span class="stat-value">{{ myBills.length }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <span class="stat-label">已缴费</span>
            <span class="stat-value success">{{ paidCount }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <span class="stat-label">未缴费</span>
            <span class="stat-value danger">{{ unpaidCount }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyBills, payBill } from '@/api/bill'

const loading = ref(false)
const myBills = ref([])

const paidCount = computed(() => myBills.value.filter(b => b.status === 1).length)
const unpaidCount = computed(() => myBills.value.filter(b => b.status === 0).length)

const loadMyBills = async () => {
  loading.value = true
  try {
    const res = await getMyBills()
    myBills.value = res.data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handlePay = async (billId) => {
  try {
    await ElMessageBox.confirm('确认已缴费？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    await payBill(billId)
    ElMessage.success('缴费成功')
    loadMyBills()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

onMounted(() => {
  loadMyBills()
})
</script>

<style scoped>
.card-header {
  font-weight: bold;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
}

.stat-item {
  text-align: center;
  padding: 20px 0;
}

.stat-label {
  display: block;
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #303133;

  &.success {
    color: #67c23a;
  }

  &.danger {
    color: #f56c6c;
  }
}
</style>
