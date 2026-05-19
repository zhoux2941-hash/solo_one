<template>
  <div class="visitor">
    <!-- 统计卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="8">
        <el-card>
          <div class="stat-item">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon size="30" color="#fff"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalVisitors || 0 }}</div>
              <div class="stat-label">总访客数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div class="stat-item">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon size="30" color="#fff"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.todayVisitors || 0 }}</div>
              <div class="stat-label">今日访客</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div class="stat-item">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon size="30" color="#fff"><Connection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.activeVisitors || 0 }}</div>
              <div class="stat-label">在场访客</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <el-card style="margin-bottom: 20px">
      <div class="action-bar">
        <el-form :inline="true" :model="searchForm" size="small">
          <el-form-item label="姓名">
            <el-input v-model="searchForm.name" placeholder="访客姓名" clearable style="width: 120px" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="searchForm.phone" placeholder="手机号" clearable style="width: 120px" />
          </el-form-item>
          <el-form-item label="车牌号">
            <el-input v-model="searchForm.plateNumber" placeholder="车牌号" clearable style="width: 120px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 100px">
              <el-option label="有效" value="ACTIVE" />
              <el-option label="已离场" value="EXPIRED" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" size="small" @click="searchVisitors">搜索</el-button>
            <el-button icon="Refresh" size="small" @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="action-buttons">
          <el-button type="primary" icon="Plus" size="small" @click="showAddDialog = true">
            新增访客
          </el-button>
          <el-upload
            class="upload-demo"
            action="/api/visitor/import"
            :headers="uploadHeaders"
            :show-file-list="false"
            accept=".csv,.txt"
            :before-upload="beforeUpload"
            :on-success="onUploadSuccess"
            :on-error="onUploadError"
          >
            <el-button type="success" icon="Upload" size="small">批量导入</el-button>
          </el-upload>
          <el-button type="warning" icon="Download" size="small" @click="downloadTemplate">下载模板</el-button>
          <el-button type="info" icon="Document" size="small" @click="exportData">导出数据</el-button>
        </div>
      </div>
    </el-card>

    <!-- 访客列表 -->
    <el-card>
      <template #header>
        <span>
          <el-icon size="18" color="#409EFF"><User /></el-icon>
          访客列表
        </span>
      </template>

      <el-table :data="visitorList" v-loading="loading" size="small">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="访客姓名" width="100" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="plateNumber" label="车牌号" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.plateNumber" type="info" size="small">{{ row.plateNumber }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="durationHours" label="访问时长" width="100">
          <template #default="{ row }">{{ row.durationHours || 2 }}小时</template>
        </el-table-column>
        <el-table-column prop="reason" label="访问事由" show-overflow-tooltip />
        <el-table-column prop="host" label="被访人" width="100" />
        <el-table-column prop="entryTime" label="入场时间" width="160" />
        <el-table-column prop="expireTime" label="过期时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'ACTIVE'"
              type="primary"
              size="small"
              link
              @click="checkOut(row)"
            >离场</el-button>
            <el-button type="danger" size="small" link @click="deleteVisitor(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增访客弹窗 -->
    <el-dialog v-model="showAddDialog" title="新增访客登记" width="600px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="访客姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号">
              <el-input v-model="form.plateNumber" placeholder="请输入车牌号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="访问时长" prop="durationHours">
              <el-select v-model="form.durationHours" placeholder="请选择时长" style="width: 100%">
                <el-option label="1小时" :value="1" />
                <el-option label="2小时" :value="2" />
                <el-option label="4小时" :value="4" />
                <el-option label="8小时" :value="8" />
                <el-option label="1天" :value="24" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="访问事由">
          <el-input v-model="form.reason" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="被访人">
          <el-input v-model="form.host" placeholder="请输入被访人姓名/房号" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="createVisitor">确认登记</el-button>
      </template>
    </el-dialog>

    <!-- 导入结果弹窗 -->
    <el-dialog v-model="showImportResult" title="导入结果" width="600px">
      <el-alert
        :title="`导入完成：总计${importResult.totalCount}条，成功${importResult.successCount}条，失败${importResult.errorCount}条`"
        :type="importResult.errorCount > 0 ? 'warning' : 'success'"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <div v-if="importResult.errorList && importResult.errorList.length > 0">
        <h4 style="margin-bottom: 10px">失败详情：</h4>
        <el-table :data="importResult.errorList" size="small" border style="max-height: 300px; overflow: auto">
          <el-table-column prop="rowNum" label="行号" width="80" />
          <el-table-column prop="message" label="失败原因" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const loading = ref(false)
const showAddDialog = ref(false)
const showImportResult = ref(false)
const visitorList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const statistics = ref({
  totalVisitors: 0,
  todayVisitors: 0,
  activeVisitors: 0
})

const importResult = ref({
  totalCount: 0,
  successCount: 0,
  errorCount: 0,
  errorList: []
})

const searchForm = reactive({
  name: '',
  phone: '',
  plateNumber: '',
  status: ''
})

const form = reactive({
  name: '',
  phone: '',
  plateNumber: '',
  durationHours: 2,
  reason: '',
  host: ''
})

const uploadHeaders = {
  Authorization: 'Bearer token'
}

const loadStatistics = async () => {
  try {
    const res = await request.get('/visitor/statistics')
    if (res.code === 200) {
      statistics.value = res.data
    }
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

const loadVisitors = async () => {
  loading.value = true
  try {
    const res = await request.get('/visitor/list', {
      params: {
        ...searchForm,
        page: currentPage.value - 1,
        size: pageSize.value
      }
    })
    if (res.code === 200) {
      visitorList.value = res.data.content
      total.value = res.data.totalElements
    }
  } catch (e) {
    console.error('加载访客列表失败', e)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const searchVisitors = () => {
  currentPage.value = 1
  loadVisitors()
}

const resetSearch = () => {
  searchForm.name = ''
  searchForm.phone = ''
  searchForm.plateNumber = ''
  searchForm.status = ''
  currentPage.value = 1
  loadVisitors()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  loadVisitors()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadVisitors()
}

const createVisitor = async () => {
  if (!form.name || !form.phone) {
    ElMessage.warning('请填写姓名和手机号')
    return
  }

  try {
    const res = await request.post('/visitor/create', form)
    if (res.code === 200) {
      ElMessage.success('登记成功')
      showAddDialog.value = false
      resetForm()
      loadVisitors()
      loadStatistics()
    }
  } catch (e) {
    ElMessage.error('登记失败：' + e.message)
  }
}

const resetForm = () => {
  form.name = ''
  form.phone = ''
  form.plateNumber = ''
  form.durationHours = 2
  form.reason = ''
  form.host = ''
}

const checkOut = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认访客【${row.name}】已离场？`,
      '提示',
      {
        confirmButtonText: '确认离场',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await request.post(`/visitor/${row.id}/checkout`)
    if (res.code === 200) {
      ElMessage.success('访客已离场')
      loadVisitors()
      loadStatistics()
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const deleteVisitor = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认删除访客【${row.name}】的记录？`,
      '提示',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await request.delete(`/visitor/${row.id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadVisitors()
      loadStatistics()
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const beforeUpload = (file) => {
  const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.txt')
  if (!isCsv) {
    ElMessage.error('请上传CSV或TXT文件！')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
    return false
  }
  return true
}

const onUploadSuccess = (response) => {
  if (response.code === 200) {
    importResult.value = response.data
    showImportResult.value = true
    loadVisitors()
    loadStatistics()
  } else {
    ElMessage.error(response.message || '导入失败')
  }
}

const onUploadError = () => {
  ElMessage.error('上传失败，请检查网络连接')
}

const downloadTemplate = () => {
  window.open('/api/visitor/template', '_blank')
}

const exportData = async () => {
  const params = new URLSearchParams()
  if (searchForm.name) params.append('name', searchForm.name)
  if (searchForm.phone) params.append('phone', searchForm.phone)
  if (searchForm.plateNumber) params.append('plateNumber', searchForm.plateNumber)
  if (searchForm.status) params.append('status', searchForm.status)

  window.open(`/api/visitor/export?${params.toString()}`, '_blank')
}

const getStatusType = (status) => {
  const map = {
    'ACTIVE': 'success',
    'EXPIRED': 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'ACTIVE': '有效',
    'EXPIRED': '已离场'
  }
  return map[status] || status
}

onMounted(() => {
  loadStatistics()
  loadVisitors()
})
</script>

<style scoped>
.visitor {
  max-width: 1200px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

:deep(.el-card) {
  background: #16213e;
  border: 1px solid #0f3460;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #0f3460;
  color: #fff;
}

:deep(.el-form-item__label) {
  color: #ccc;
}

:deep(.el-table th) {
  background: #0f3460 !important;
  color: #fff;
}

:deep(.el-table td) {
  background: #16213e !important;
  color: #ccc;
}

:deep(.el-dialog) {
  background: #16213e;
}

:deep(.el-dialog__title) {
  color: #fff;
}
</style>
