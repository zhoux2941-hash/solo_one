<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>奖金池管理</span>
          <el-button type="primary" @click="showCreateDialog">新建奖金池</el-button>
        </div>
      </template>
      <el-table :data="bonusPools" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="totalAmount" label="总金额" width="150">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="quarterYear" label="年份" width="100" />
        <el-table-column prop="quarterNumber" label="季度" width="80">
          <template #default="{ row }">Q{{ row.quarterNumber }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isArchived" label="已归档" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isArchived ? 'success' : 'info'">
              {{ row.isArchived ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToDetail(row.id)">分配奖金</el-button>
            <el-button v-if="!row.isArchived" type="warning" link @click="publishPool(row.id)">发布</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="新建奖金池" width="500px">
      <el-form :model="newPool" label-width="100px">
        <el-form-item label="总金额">
          <el-input-number 
            v-model="newPool.totalAmount" 
            :min="0.01" 
            :max="999999999.99" 
            :precision="2" 
            style="width: 100%" 
          />
        </el-form-item>
        <el-form-item label="年份">
          <el-input-number v-model="newPool.quarterYear" :min="2020" :max="2099" style="width: 100%" />
        </el-form-item>
        <el-form-item label="季度">
          <el-select v-model="newPool.quarterNumber" style="width: 100%">
            <el-option label="Q1" :value="1" />
            <el-option label="Q2" :value="2" />
            <el-option label="Q3" :value="3" />
            <el-option label="Q4" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createPool">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import bonusPoolApi from '@/api/bonusPool'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const bonusPools = ref([])
const createDialogVisible = ref(false)
const newPool = ref({
  totalAmount: 10000,
  quarterYear: new Date().getFullYear(),
  quarterNumber: 1
})

const statusType = (status) => {
  const types = { DRAFT: 'info', PUBLISHED: 'warning', ARCHIVED: 'success' }
  return types[status] || 'info'
}

const statusText = (status) => {
  const texts = { DRAFT: '草稿', PUBLISHED: '已发布', ARCHIVED: '已归档' }
  return texts[status] || status
}

const loadPools = async () => {
  try {
    if (!userStore.currentUser?.departmentId) {
      ElMessage.error('当前用户没有分配部门')
      return
    }
    const response = await bonusPoolApi.getByDepartment(userStore.currentUser.departmentId)
    bonusPools.value = response.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '加载奖金池失败'
    ElMessage.error(errorMsg)
  }
}

const showCreateDialog = () => {
  newPool.value = {
    totalAmount: 10000,
    quarterYear: new Date().getFullYear(),
    quarterNumber: 1
  }
  createDialogVisible.value = true
}

const createPool = async () => {
  try {
    if (!userStore.currentUser?.departmentId) {
      ElMessage.error('当前用户没有分配部门，无法创建奖金池')
      return
    }
    if (!newPool.value.totalAmount || newPool.value.totalAmount <= 0) {
      ElMessage.error('奖金金额必须大于0')
      return
    }
    if (newPool.value.totalAmount > 999999999.99) {
      ElMessage.error('奖金金额不能超过999,999,999.99')
      return
    }
    if (!newPool.value.quarterYear || newPool.value.quarterYear < 2020 || newPool.value.quarterYear > 2099) {
      ElMessage.error('请输入有效的年份（2020-2099）')
      return
    }
    if (!newPool.value.quarterNumber || newPool.value.quarterNumber < 1 || newPool.value.quarterNumber > 4) {
      ElMessage.error('季度必须在1-4之间')
      return
    }
    const pool = { 
      ...newPool.value, 
      departmentId: userStore.currentUser.departmentId, 
      createdBy: userStore.currentUser.id 
    }
    await bonusPoolApi.create(pool)
    createDialogVisible.value = false
    ElMessage.success('创建成功')
    loadPools()
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '创建失败'
    ElMessage.error(errorMsg)
  }
}

const goToDetail = (id) => {
  router.push(`/manager/pool/${id}`)
}

const publishPool = async (id) => {
  try {
    await bonusPoolApi.updateStatus(id, 'PUBLISHED')
    ElMessage.success('发布成功')
    loadPools()
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

onMounted(() => {
  loadPools()
})
</script>
