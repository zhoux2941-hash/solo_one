<template>
  <div class="page-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="balance-card">
          <div class="balance-info">
            <div class="balance-label">账户余额</div>
            <div class="balance-value">{{ userStore.userInfo?.balance || 0 }}</div>
            <div class="balance-unit">积分</div>
          </div>
          <el-button
            v-if="userStore.isVoiceActor"
            type="primary"
            size="large"
            @click="showWithdrawDialog = true"
            style="margin-top: 20px; width: 100%"
          >
            申请提现
          </el-button>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><List /></el-icon> 积分变动记录</span>
            </div>
          </template>
          
          <el-empty v-if="transactions.length === 0 && !loading" description="暂无积分变动记录" />
          
          <el-table
            v-else
            :data="transactions"
            style="width: 100%"
            :loading="loading"
          >
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getTypeTagType(row.type)" size="small">
                  {{ getTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="{ row }">
                <span :class="row.type === 1 ? 'income' : 'expense'">
                  {{ row.type === 1 ? '+' : '-' }}{{ row.amount }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column prop="balance" label="余额" width="120" />
            <el-table-column prop="createTime" label="时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="showWithdrawDialog"
      title="申请提现"
      width="400px"
    >
      <el-form :model="withdrawForm" label-width="80px">
        <el-form-item label="提现金额">
          <el-input-number
            v-model="withdrawForm.amount"
            :min="1"
            :max="userStore.userInfo?.balance || 0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="可提现">
          <span>{{ userStore.userInfo?.balance || 0 }} 积分</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWithdrawDialog = false">取消</el-button>
        <el-button type="primary" :loading="withdrawing" @click="handleWithdraw">
          确认提现
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getMyTransactions, withdraw } from '@/api/transaction'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const transactions = ref([])
const loading = ref(false)
const showWithdrawDialog = ref(false)
const withdrawing = ref(false)

const withdrawForm = reactive({
  amount: 100
})

async function fetchTransactions() {
  loading.value = true
  try {
    const res = await getMyTransactions()
    transactions.value = res.data
  } finally {
    loading.value = false
  }
}

function getTypeText(type) {
  const typeMap = {
    1: '收入',
    2: '支出',
    3: '提现'
  }
  return typeMap[type] || '未知'
}

function getTypeTagType(type) {
  const tagMap = {
    1: 'success',
    2: 'danger',
    3: 'warning'
  }
  return tagMap[type] || 'info'
}

async function handleWithdraw() {
  if (withdrawForm.amount > userStore.userInfo?.balance) {
    ElMessage.warning('余额不足')
    return
  }

  withdrawing.value = true
  try {
    await withdraw(withdrawForm.amount)
    ElMessage.success('提现申请已提交')
    showWithdrawDialog.value = false
    await userStore.refreshUserInfo()
    fetchTransactions()
  } finally {
    withdrawing.value = false
  }
}

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

onMounted(() => {
  fetchTransactions()
})
</script>

<style scoped>
.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  text-align: center;
}

.balance-card :deep(.el-card__body) {
  padding: 40px 20px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.9;
}

.balance-value {
  font-size: 48px;
  font-weight: bold;
  margin: 10px 0;
}

.balance-unit {
  font-size: 16px;
  opacity: 0.9;
}

.income {
  color: #67c23a;
  font-weight: bold;
}

.expense {
  color: #f56c6c;
  font-weight: bold;
}
</style>
