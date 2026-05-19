<template>
  <div class="release">
    <el-card>
      <template #header>
        <span>
          <el-icon size="18" color="#E6A23C"><Unlock /></el-icon>
          异常车辆放行
        </span>
      </template>
      
      <el-table :data="releaseList" style="margin-bottom: 20px">
        <el-table-column prop="plateNumber" label="车牌号" width="120">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.plateNumber }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="entryTime" label="入场时间" />
        <el-table-column prop="parkingDuration" label="停车时长" />
        <el-table-column prop="reason" label="异常原因" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleRelease(row)">放行</el-button>
            <el-button type="danger" size="small" link>拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">放行记录</el-divider>
      
      <el-table :data="historyList" size="small">
        <el-table-column prop="plateNumber" label="车牌号" width="120" />
        <el-table-column prop="releaseTime" label="放行时间" />
        <el-table-column prop="operator" label="操作员" />
        <el-table-column prop="reason" label="放行原因" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag type="success" size="small">已放行</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const releaseList = ref([
  {
    id: 1,
    plateNumber: '京A88888',
    entryTime: '2026-05-18 08:00:00',
    parkingDuration: '4小时30分钟',
    reason: '车牌识别错误'
  },
  {
    id: 2,
    plateNumber: '沪B66666',
    entryTime: '2026-05-18 09:15:00',
    parkingDuration: '3小时15分钟',
    reason: '系统故障'
  }
])

const historyList = ref([
  {
    id: 1,
    plateNumber: '粤C11111',
    releaseTime: '2026-05-18 11:30:00',
    operator: '张管理员',
    reason: '军警车辆免费'
  }
])

const handleRelease = (row) => {
  ElMessageBox.prompt('请输入放行原因', '确认放行', {
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    ElMessage.success(`已放行 ${row.plateNumber}`)
    releaseList.value = releaseList.value.filter(item => item.id !== row.id)
  }).catch(() => {})
}
</script>

<style scoped>
.release {
  max-width: 900px;
}

:deep(.el-card) {
  background: #16213e;
  border: 1px solid #0f3460;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #0f3460;
  color: #fff;
}

:deep(.el-table th) {
  background: #0f3460 !important;
  color: #fff;
}

:deep(.el-table td) {
  background: #16213e !important;
  color: #ccc;
}

:deep(.el-divider__text) {
  background: #1a1a2e;
  color: #fff;
}
</style>
