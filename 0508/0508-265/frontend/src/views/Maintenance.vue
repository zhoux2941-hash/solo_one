<template>
  <div class="maintenance">
    <el-card>
      <template #header>
        <span>维修记录</span>
      </template>

      <el-table :data="logs" style="width: 100%">
        <el-table-column prop="deviceName" label="设备名称" width="150" />
        <el-table-column prop="maintainerName" label="维修人员" width="120" />
        <el-table-column prop="faultDescription" label="故障描述" show-overflow-tooltip />
        <el-table-column prop="solution" label="解决方案" show-overflow-tooltip />
        <el-table-column prop="replacedParts" label="更换配件" show-overflow-tooltip />
        <el-table-column prop="laborHours" label="耗时(小时)" width="100" />
        <el-table-column label="结果" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.result === 'SUCCESS' ? 'success' : 'danger'">
              {{ scope.row.result === 'SUCCESS' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="维修时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { maintenanceLogApi } from '../api'

const logs = ref([])

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const loadData = async () => {
  logs.value = await maintenanceLogApi.getAll()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
</style>
