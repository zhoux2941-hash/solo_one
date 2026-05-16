<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>奖金池详情 - {{ pool?.quarterYear }}年Q{{ pool?.quarterNumber }}</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>
      <div style="display: flex; gap: 40px">
        <div>总金额：<strong>¥{{ pool?.totalAmount?.toLocaleString() }}</strong></div>
        <div>已分配比例：<strong :style="{ color: totalPercentage > 100 ? 'red' : 'green' }">{{ totalPercentage.toFixed(2) }}%</strong></div>
      </div>
    </el-card>

    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>奖金分配</span>
          <el-button type="primary" @click="saveAllocations" :disabled="totalPercentage > 100">保存分配</el-button>
        </div>
      </template>
      <el-table :data="allocations" border>
        <el-table-column prop="employeeName" label="员工姓名" width="120" />
        <el-table-column prop="percentage" label="分配比例(%)" width="200">
          <template #default="{ row }">
            <el-input-number
              v-model="row.percentage"
              :min="0"
              :max="100"
              :precision="2"
              :disabled="row.isFrozen"
              style="width: 100%"
              @change="calculateAmount(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="奖金金额" width="150">
          <template #default="{ row }">
            ¥{{ row.amount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isFrozen ? 'warning' : 'success'">
              {{ row.isFrozen ? '已冻结' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hasAppeal" label="申诉" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.hasAppeal" type="danger">有</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button type="primary" link @click="showVersions(row)">版本记录</el-button>
            <el-button type="warning" link @click="showDiff(row)">版本对比</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

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

    <el-dialog v-model="diffDialogVisible" title="版本对比" width="600px">
      <el-form label-width="100px">
        <el-form-item label="比较版本">
          <el-select v-model="diffV1" placeholder="选择版本1" style="width: 150px; margin-right: 20px">
            <el-option v-for="v in currentVersions" :key="v.versionNumber" :label="'V' + v.versionNumber" :value="v.versionNumber" />
          </el-select>
          <span>VS</span>
          <el-select v-model="diffV2" placeholder="选择版本2" style="width: 150px; margin-left: 20px">
            <el-option v-for="v in currentVersions" :key="v.versionNumber" :label="'V' + v.versionNumber" :value="v.versionNumber" />
          </el-select>
          <el-button type="primary" style="margin-left: 20px" @click="doDiff">对比</el-button>
        </el-form-item>
      </el-form>
      <el-descriptions v-if="diffResult.length > 0" border style="margin-top: 20px">
        <el-descriptions-item label="旧比例">{{ diffResult[0].oldPercentage }}%</el-descriptions-item>
        <el-descriptions-item label="新比例">{{ diffResult[0].newPercentage }}%</el-descriptions-item>
        <el-descriptions-item label="旧金额">¥{{ diffResult[0].oldAmount?.toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="新金额">¥{{ diffResult[0].newAmount?.toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="变更原因" :span="2">{{ diffResult[0].changeReason }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import bonusPoolApi from '@/api/bonusPool'
import allocationApi from '@/api/allocation'
import userApi from '@/api/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()
const pool = ref(null)
const allocations = ref([])
const employees = ref([])
const versionsDialogVisible = ref(false)
const diffDialogVisible = ref(false)
const currentVersions = ref([])
const currentAllocation = ref(null)
const diffV1 = ref(null)
const diffV2 = ref(null)
const diffResult = ref([])

const totalPercentage = computed(() => {
  return allocations.value.reduce((sum, a) => sum + (a.percentage || 0), 0)
})

const calculateAmount = (row) => {
  if (pool.value) {
    row.amount = pool.value.totalAmount * row.percentage / 100
  }
}

const loadData = async () => {
  try {
    const poolId = route.params.id
    const poolResponse = await bonusPoolApi.getById(poolId)
    pool.value = poolResponse.data

    const allocResponse = await allocationApi.getByPool(poolId)
    allocations.value = allocResponse.data

    if (!userStore.currentUser?.departmentId) {
      ElMessage.error('当前用户没有分配部门')
      return
    }
    
    const empResponse = await userApi.getEmployeesByDepartment(userStore.currentUser.departmentId)
    employees.value = empResponse.data

    employees.value.forEach(emp => {
      const existing = allocations.value.find(a => a.employeeId === emp.id)
      if (!existing) {
        allocations.value.push({
          employeeId: emp.id,
          employeeName: emp.name,
          percentage: 0,
          amount: 0,
          isFrozen: false,
          hasAppeal: false
        })
      }
    })
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '加载数据失败'
    ElMessage.error(errorMsg)
  }
}

const saveAllocations = async () => {
  try {
    const data = {
      bonusPoolId: route.params.id,
      allocations: allocations.value.map(a => ({
        employeeId: a.employeeId,
        percentage: a.percentage,
        remarks: a.remarks
      })),
      changeReason: '主管分配调整',
      changedBy: userStore.currentUser.id
    }
    await allocationApi.batchAllocate(data)
    ElMessage.success('保存成功')
    loadData()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  }
}

const showVersions = async (row) => {
  try {
    currentAllocation.value = row
    if (row.id) {
      const response = await allocationApi.getVersions(row.id)
      currentVersions.value = response.data
    } else {
      currentVersions.value = []
    }
    versionsDialogVisible.value = true
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '加载版本记录失败'
    ElMessage.error(errorMsg)
  }
}

const showDiff = async (row) => {
  try {
    currentAllocation.value = row
    diffV1.value = null
    diffV2.value = null
    diffResult.value = []
    if (row.id) {
      const response = await allocationApi.getVersions(row.id)
      currentVersions.value = response.data
    } else {
      currentVersions.value = []
    }
    diffDialogVisible.value = true
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '加载版本记录失败'
    ElMessage.error(errorMsg)
  }
}

const doDiff = async () => {
  try {
    if (!currentAllocation.value?.id) {
      ElMessage.error('请先保存分配记录')
      return
    }
    if (!diffV1.value || !diffV2.value) {
      ElMessage.error('请选择两个要对比的版本')
      return
    }
    if (diffV1.value === diffV2.value) {
      ElMessage.error('请选择两个不同的版本')
      return
    }
    const response = await allocationApi.compareVersions(currentAllocation.value.id, diffV1.value, diffV2.value)
    diffResult.value = response.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '版本对比失败'
    ElMessage.error(errorMsg)
  }
}

onMounted(() => {
  loadData()
})
</script>
