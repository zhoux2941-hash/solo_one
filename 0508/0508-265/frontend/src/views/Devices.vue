<template>
  <div class="devices">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>设备台账</span>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="设备状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable @change="loadData">
            <el-option label="全部" value="" />
            <el-option label="正常" value="NORMAL" />
            <el-option label="故障" value="FAULT" />
          </el-select>
        </el-form-item>
        <el-form-item label="生产线">
          <el-select v-model="searchForm.productionLine" placeholder="全部" clearable @change="loadData">
            <el-option label="A线" value="A线" />
            <el-option label="B线" value="B线" />
            <el-option label="C线" value="C线" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="filteredDevices" style="width: 100%">
        <el-table-column prop="deviceCode" label="设备编号" width="120" />
        <el-table-column prop="deviceName" label="设备名称" width="150" />
        <el-table-column prop="deviceType" label="设备类型" width="120" />
        <el-table-column prop="productionLine" label="生产线" width="100" />
        <el-table-column prop="location" label="位置" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'FAULT' ? 'danger' : 'success'">
              {{ scope.row.status === 'FAULT' ? '故障' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="备注" />
        <el-table-column prop="installDate" label="安装日期" width="160">
          <template #default="scope">
            {{ formatDate(scope.row.installDate) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { deviceApi } from '../api'

const devices = ref([])
const searchForm = reactive({
  status: '',
  productionLine: ''
})

const filteredDevices = computed(() => {
  let result = devices.value
  if (searchForm.status) {
    result = result.filter(d => d.status === searchForm.status)
  }
  if (searchForm.productionLine) {
    result = result.filter(d => d.productionLine === searchForm.productionLine)
  }
  return result
})

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const loadData = async () => {
  devices.value = await deviceApi.getAll()
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

.search-form {
  margin-bottom: 20px;
}
</style>
