<template>
  <div class="operation-log">
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>操作日志</span>
          <el-button type="success" icon="Download" @click="handleExport">导出</el-button>
        </div>
      </template>

      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="模块">
            <el-select v-model="searchForm.module" placeholder="操作模块" clearable style="width: 150px">
              <el-option label="装备管理" value="装备管理" />
              <el-option label="审批管理" value="审批管理" />
              <el-option label="系统管理" value="系统管理" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="操作状态" clearable style="width: 150px">
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="fetchList">搜索</el-button>
            <el-button icon="Refresh" @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="日志ID" width="80" />
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="operationModule" label="模块" width="120" />
        <el-table-column prop="operationType" label="类型" width="100" />
        <el-table-column prop="operationDesc" label="描述" width="150" />
        <el-table-column prop="requestMethod" label="请求方式" width="100" />
        <el-table-column prop="requestUrl" label="请求URL" width="200" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP地址" width="130" />
        <el-table-column prop="executeTime" label="耗时(ms)" width="100" />
        <el-table-column prop="operationStatus" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.operationStatus === 1 ? 'success' : 'danger'" size="small">
              {{ row.operationStatus === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="操作时间" width="180" />
      </el-table>

      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getLogList } from '@/api/log'

const loading = ref(false)

const searchForm = ref({
  module: null,
  type: null,
  status: null
})

const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm.value,
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    }
    const res = await getLogList(params)
    tableData.value = res.data.records
    pagination.value.total = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.value = {
    module: null,
    type: null,
    status: null
  }
  fetchList()
}

const handleExport = () => {
  ElMessage.success('导出功能开发中')
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.operation-log {
  padding: 10px 0;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 5px;
}
</style>
