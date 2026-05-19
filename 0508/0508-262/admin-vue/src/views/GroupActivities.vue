<template>
  <div class="group-activities">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>团购活动列表</span>
          <el-button type="primary" @click="handleAdd">新增活动</el-button>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="activityName" label="活动名称" />
        <el-table-column prop="product.productName" label="关联商品" width="150" />
        <el-table-column prop="activityPrice" label="活动价格" width="120">
          <template #default="{ row }">¥{{ row.activityPrice }}</template>
        </el-table-column>
        <el-table-column prop="minGroupSize" label="最小成团" width="100" />
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 0 ? 'warning' : 'danger'">
              {{ row.status === 1 ? '进行中' : row.status === 0 ? '未开始' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/group-activities')
    tableData.value = res.data
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  ElMessage.info('新增功能开发中')
}

const handleEdit = (row) => {
  ElMessage.info('编辑功能开发中')
}

const handleDelete = (row) => {
  ElMessage.info('删除功能开发中')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>