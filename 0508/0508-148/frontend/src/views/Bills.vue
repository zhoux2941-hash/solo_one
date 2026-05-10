<template>
  <div class="bills-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>寝室账单列表</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            录入账单
          </el-button>
        </div>
      </template>

      <el-table :data="bills" v-loading="loading" style="width: 100%">
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
        <el-table-column prop="totalAmount" label="总计(元)">
          <template #default="{ row }">
            ¥{{ row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="perPersonAmount" label="人均(元)">
          <template #default="{ row }">
            ¥{{ row.perPersonAmount }}
          </template>
        </el-table-column>
        <el-table-column prop="headCount" label="分摊人数" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row.id)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && bills.length === 0" description="暂无账单记录" />
    </el-card>

    <el-dialog v-model="showCreateDialog" title="录入账单" width="500px" :close-on-click-modal="!creating" @close="resetCreateForm">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px" @submit.prevent>
        <el-form-item label="账单月份" prop="billDate">
          <el-date-picker
            v-model="createForm.billDate"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            style="width: 100%"
            :disabled="creating"
          />
        </el-form-item>
        <el-form-item label="总电费(元)" prop="electricityAmount">
          <el-input-number
            v-model="createForm.electricityAmount"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 100%"
            :disabled="creating"
          />
        </el-form-item>
        <el-form-item label="总水费(元)" prop="waterAmount">
          <el-input-number
            v-model="createForm.waterAmount"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 100%"
            :disabled="creating"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false" :disabled="creating">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate" :disabled="creating">
          确认录入
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="账单详情" width="700px">
      <div v-if="billDetail" class="bill-detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">账单月份：</span>
              <span class="value">{{ billDetail.billDate }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <span class="label">分摊人数：</span>
              <span class="value">{{ billDetail.headCount }}人</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">电费：</span>
              <span class="value">¥{{ billDetail.electricityAmount }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">水费：</span>
              <span class="value">¥{{ billDetail.waterAmount }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="label">人均：</span>
              <span class="value highlight">¥{{ billDetail.perPersonAmount }}</span>
            </div>
          </el-col>
        </el-row>

        <div class="payment-stats">
          <el-tag type="success">{{ billDetail.paidCount }}人已缴费</el-tag>
          <el-tag type="danger">{{ billDetail.unpaidCount }}人未缴费</el-tag>
        </div>

        <el-table :data="billDetail.payments" style="margin-top: 20px">
          <el-table-column prop="nickname" label="姓名" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="amount" label="应缴金额(元)">
            <template #default="{ row }">
              ¥{{ row.amount }}
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
          <el-table-column label="操作" width="120" v-if="!isMyPaid">
            <template #default="{ row }">
              <el-button
                v-if="row.userId === currentUserId && row.status === 0"
                type="primary"
                link
                @click="handlePay(billDetail.id)"
              >
                我已缴费
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { Plus } from '@element-plus/icons-vue'
import { createBill, getDormBills, getBillDetail, payBill } from '@/api/bill'

const userStore = useUserStore()
const currentUserId = computed(() => userStore.user?.id)

const loading = ref(false)
const creating = ref(false)
const bills = ref([])
const billDetail = ref(null)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const createFormRef = ref(null)

const createForm = reactive({
  billDate: '',
  electricityAmount: 0,
  waterAmount: 0
})

const createRules = {
  billDate: [{ required: true, message: '请选择账单月份', trigger: 'change' }],
  electricityAmount: [{ required: true, message: '请输入电费', trigger: 'blur' }],
  waterAmount: [{ required: true, message: '请输入水费', trigger: 'blur' }]
}

const isMyPaid = computed(() => {
  if (!billDetail.value) return false
  const myPayment = billDetail.value.payments.find(p => p.userId === currentUserId.value)
  return myPayment ? myPayment.status === 1 : false
})

const loadBills = async () => {
  loading.value = true
  try {
    const res = await getDormBills()
    bills.value = res.data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const resetCreateForm = () => {
  createForm.billDate = ''
  createForm.electricityAmount = 0
  createForm.waterAmount = 0
  if (createFormRef.value) {
    createFormRef.value.resetFields()
  }
}

const handleCreate = async () => {
  if (creating.value) return
  await createFormRef.value.validate()
  creating.value = true
  try {
    await createBill(createForm)
    ElMessage.success('账单录入成功')
    showCreateDialog.value = false
    loadBills()
  } catch (error) {
    console.error(error)
  } finally {
    creating.value = false
  }
}

const viewDetail = async (billId) => {
  try {
    const res = await getBillDetail(billId)
    billDetail.value = res.data
    showDetailDialog.value = true
  } catch (error) {
    console.error(error)
  }
}

const handlePay = async (billId) => {
  try {
    await payBill(billId)
    ElMessage.success('缴费成功')
    viewDetail(billId)
    loadBills()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadBills()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.bill-detail {
  .detail-item {
    margin-bottom: 12px;

    .label {
      color: #909399;
    }

    .value {
      color: #303133;
      font-weight: 500;
    }

    .highlight {
      color: #f56c6c;
      font-size: 18px;
      font-weight: bold;
    }
  }

  .payment-stats {
    margin-top: 20px;
    display: flex;
    gap: 10px;
  }
}
</style>
