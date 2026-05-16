<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>我的奖金</span>
      </template>
      <el-table :data="bonusList" border>
        <el-table-column prop="quarterYear" label="年份" width="100" />
        <el-table-column prop="quarterNumber" label="季度" width="80">
          <template #default="{ row }">Q{{ row.quarterNumber }}</template>
        </el-table-column>
        <el-table-column prop="percentage" label="分配比例(%)" width="150" />
        <el-table-column prop="amount" label="奖金金额" width="150">
          <template #default="{ row }">
            <strong style="color: #409EFF">¥{{ row.amount?.toLocaleString() || 0 }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isFrozen ? 'warning' : 'success'">
              {{ row.isFrozen ? '已冻结' : statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="danger" link @click="showAppealDialog(row)" :disabled="row.hasAppeal || row.isFrozen">
              发起申诉
            </el-button>
            <el-button type="primary" link @click="showVersions(row)">
              版本记录
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="appealDialogVisible" title="发起申诉" width="500px">
      <el-form :model="appealForm" label-width="100px">
        <el-form-item label="申诉原因">
          <el-input type="textarea" v-model="appealForm.reason" :rows="5" placeholder="请详细说明申诉原因..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appealDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAppeal">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="versionsDialogVisible" title="版本记录" width="700px">
      <el-table :data="currentVersions" border>
        <el-table-column prop="versionNumber" label="版本号" width="100" />
        <el-table-column prop="percentage" label="比例(%)" width="120" />
        <el-table-column prop="amount" label="金额" width="150">
          <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="changeReason" label="变更原因" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import allocationApi from '@/api/allocation'
import appealApi from '@/api/appeal'
import bonusPoolApi from '@/api/bonusPool'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const allocations = ref([])
const pools = ref([])
const appealDialogVisible = ref(false)
const versionsDialogVisible = ref(false)
const currentAllocation = ref(null)
const currentVersions = ref([])
const appealForm = ref({
  reason: ''
})

const bonusList = computed(() => {
  return allocations.value.map(a => {
    const pool = pools.value.find(p => p.id === a.bonusPoolId)
    return {
      ...a,
      quarterYear: pool?.quarterYear,
      quarterNumber: pool?.quarterNumber
    }
  })
})

const statusText = (status) => {
  const texts = { DRAFT: '草稿', CONFIRMED: '已确认', APPEALED: '已申诉', ADJUSTED: '已调整' }
  return texts[status] || status
}

const loadData = async () => {
  try {
    const empId = userStore.currentUser?.id || 3
    const allocResponse = await allocationApi.getByEmployee(empId)
    allocations.value = allocResponse.data

    if (allocations.value.length > 0) {
      const poolIds = [...new Set(allocations.value.map(a => a.bonusPoolId))]
      const poolPromises = poolIds.map(id => bonusPoolApi.getById(id))
      const poolResponses = await Promise.all(poolPromises)
      pools.value = poolResponses.map(r => r.data)
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '加载数据失败'
    ElMessage.error(errorMsg)
  }
}

const showAppealDialog = (allocation) => {
  currentAllocation.value = allocation
  appealForm.value.reason = ''
  appealDialogVisible.value = true
}

const submitAppeal = async () => {
  try {
    if (!appealForm.value.reason?.trim()) {
      ElMessage.error('请填写申诉原因')
      return
    }
    const data = {
      allocationId: currentAllocation.value.id,
      employeeId: userStore.currentUser?.id || 3,
      reason: appealForm.value.reason
    }
    await appealApi.create(data)
    appealDialogVisible.value = false
    ElMessage.success('申诉提交成功')
    loadData()
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '申诉提交失败'
    ElMessage.error(errorMsg)
  }
}

const showVersions = async (row) => {
  currentAllocation.value = row
  if (row.id) {
    const response = await allocationApi.getVersions(row.id)
    currentVersions.value = response.data
  } else {
    currentVersions.value = []
  }
  versionsDialogVisible.value = true
}

onMounted(() => {
  loadData()
})
</script>
