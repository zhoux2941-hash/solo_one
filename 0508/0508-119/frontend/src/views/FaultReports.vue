<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>故障上报</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            上报故障
          </el-button>
        </div>
      </template>

      <el-table :data="reports" v-loading="loading" style="width: 100%;">
        <el-table-column prop="pile.pileCode" label="桩号" width="100">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.pile?.pileCode }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="pile.location" label="位置" min-width="150">
          <template #default="{ row }">
            <el-icon style="margin-right: 5px;"><Location /></el-icon>
            {{ row.pile?.location }}
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="故障描述" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="reportedAt" label="上报时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.reportedAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="处理备注" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.handleNote || '-' }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="reports.length === 0 && !loading" description="暂无故障上报记录" />
    </el-card>

    <el-dialog v-model="showCreateDialog" title="上报故障" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="桩号" prop="pileCode">
          <el-input v-model="form.pileCode" placeholder="请输入充电桩编号或扫描二维码" />
          <div style="margin-top: 10px; color: #909399; font-size: 12px;">
            提示：您可以输入充电桩编号（如 CP001）
          </div>
        </el-form-item>
        
        <el-form-item label="故障描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请详细描述故障情况"
          />
        </el-form-item>
        
        <el-form-item label="照片">
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="3"
            list-type="picture-card"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">
                支持jpg/png格式，最多上传3张
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReport">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getMyReports, createReport } from '@/api/faultReports'

const reports = ref([])
const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const formRef = ref(null)
const uploadedFiles = ref([])

const form = reactive({
  pileCode: '',
  description: '',
  photoUrl: ''
})

const rules = {
  pileCode: [
    { required: true, message: '请输入充电桩编号', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请描述故障情况', trigger: 'blur' }
  ]
}

const loadReports = async () => {
  loading.value = true
  try {
    const res = await getMyReports()
    reports.value = (res.data || []).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  } catch (e) {
    console.error('Failed to load reports:', e)
  } finally {
    loading.value = false
  }
}

const formatDateTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getStatusText = (status) => {
  const texts = {
    'PENDING': '待处理',
    'PROCESSING': '处理中',
    'RESOLVED': '已解决',
    'REJECTED': '已驳回'
  }
  return texts[status] || status
}

const getStatusTagType = (status) => {
  const types = {
    'PENDING': 'warning',
    'PROCESSING': 'primary',
    'RESOLVED': 'success',
    'REJECTED': 'danger'
  }
  return types[status] || 'info'
}

const handleFileChange = (file) => {
  uploadedFiles.value.push(file)
}

const handleFileRemove = (file) => {
  const index = uploadedFiles.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    uploadedFiles.value.splice(index, 1)
  }
}

const resetForm = () => {
  form.pileCode = ''
  form.description = ''
  form.photoUrl = ''
  uploadedFiles.value = []
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const submitReport = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      await createReport({
        pileCode: form.pileCode,
        description: form.description,
        photoUrl: uploadedFiles.value.length > 0 ? 'uploaded' : null
      })
      
      ElMessage.success('故障上报成功')
      showCreateDialog.value = false
      resetForm()
      await loadReports()
    } catch (e) {
      console.error('Failed to submit report:', e)
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
