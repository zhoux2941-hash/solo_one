<template>
  <div class="home-page">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card shadow="never" class="upload-card">
          <template #header>
            <div class="card-header">
              <span>点云文件上传</span>
              <el-tag type="info">支持 .las / .ply 格式</el-tag>
            </div>
          </template>

          <el-upload
            class="upload-dragger"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".las,.ply"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持激光扫描点云数据文件 (.las, .ply)
              </div>
              <div class="el-upload__tip" style="color: #409eff; margin-top: 8px;">
                <el-icon><InfoFilled /></el-icon>
                大文件 (>500MB) 将自动使用分片上传，支持断点续传
              </div>
            </template>
          </el-upload>

          <div class="file-info" v-if="selectedFile">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="文件名">{{ selectedFile.name }}</el-descriptions-item>
              <el-descriptions-item label="文件大小">
                {{ formatFileSize(selectedFile.size) }}
                <el-tag 
                  v-if="selectedFile.size > 500 * 1024 * 1024"
                  type="warning"
                  size="small"
                  style="margin-left: 8px;"
                >
                  大文件 - 分片上传
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
            
            <div class="upload-progress" v-if="uploading">
              <div class="progress-header">
                <span>上传进度</span>
                <span>{{ uploadedChunks }} / {{ totalChunks }} 分片 ({{ (progress * 100).toFixed(1) }}%)</span>
              </div>
              <el-progress 
                :percentage="progress * 100" 
                :status="uploadStatus"
                :stroke-width="20"
              />
              <div class="progress-info" v-if="currentChunkSpeed">
                <span>当前速度: {{ formatFileSize(currentChunkSpeed) }}/s</span>
                <span>预计剩余: {{ formatETA(remainingTime) }}</span>
              </div>
            </div>
            
            <div class="upload-actions">
              <el-button 
                type="primary" 
                :loading="uploading"
                @click="startUpload"
                :icon="Upload"
                :disabled="uploading"
              >
                {{ selectedFile.size > 500 * 1024 * 1024 ? '分片上传并分析' : '上传并分析' }}
              </el-button>
              <el-button 
                @click="cancelUpload"
                v-if="uploading"
                type="danger"
                :icon="Close"
              >
                取消上传
              </el-button>
              <el-button @click="clearFile" v-else>
                取消
              </el-button>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="history-card" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>最近上传的点云</span>
              <el-button type="primary" link @click="goToHistory">查看全部</el-button>
            </div>
          </template>

          <el-table :data="recentPointClouds" style="width: 100%" v-loading="loading">
            <el-table-column prop="file_name" label="文件名" />
            <el-table-column prop="point_count" label="点数">
              <template #default="scope">
                {{ formatNumber(scope.row.point_count) }}
              </template>
            </el-table-column>
            <el-table-column prop="file_type" label="格式" width="80">
              <template #default="scope">
                <el-tag size="small">{{ scope.row.file_type.toUpperCase() }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="upload_time" label="上传时间" width="180">
              <template #default="scope">
                {{ formatDateTime(scope.row.upload_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" link @click="goToAnalysis(scope.row)">
                  开始分析
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty description="暂无点云数据" v-if="!loading && recentPointClouds.length === 0" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never" class="guide-card">
          <template #header>
            <span>使用指南</span>
          </template>

          <el-timeline>
            <el-timeline-item title="上传点云数据">
              <p>上传犯罪现场的激光扫描点云文件</p>
              <el-tag type="info" size="small">支持 .las / .ply</el-tag>
            </el-timeline-item>
            
            <el-timeline-item title="标记弹孔位置">
              <p>在3D视图中交互式选取弹孔点</p>
              <el-tag type="warning" size="small">至少需要2个标记</el-tag>
            </el-timeline-item>
            
            <el-timeline-item title="配置武器和环境参数">
              <p>输入枪支类型和环境参数（温度、海拔、湿度）</p>
              <el-tag type="success" size="small">影响空气密度计算</el-tag>
            </el-timeline-item>
            
            <el-timeline-item title="执行弹道分析">
              <p>系统计算弹道轨迹并反向溯源</p>
              <el-tag type="primary" size="small">考虑重力和动态空气阻力</el-tag>
            </el-timeline-item>
            
            <el-timeline-item title="生成分析报告">
              <p>导出包含分析结果的案件报告</p>
              <el-tag type="danger" size="small">PDF格式</el-tag>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Upload, InfoFilled, Close } from '@element-plus/icons-vue'
import { pointCloudApi, fileUtils } from '@/api'

const router = useRouter()

const CHUNK_SIZE = 50 * 1024 * 1024
const LARGE_FILE_THRESHOLD = 500 * 1024 * 1024

const selectedFile = ref(null)
const uploading = ref(false)
const uploadStatus = ref(null)
const loading = ref(false)
const recentPointClouds = ref([])

const uploadId = ref(null)
const totalChunks = ref(0)
const uploadedChunks = ref(0)
const progress = ref(0)
const currentChunkSpeed = ref(0)
const remainingTime = ref(0)

const isLargeFile = computed(() => {
  return selectedFile.value && selectedFile.value.size > LARGE_FILE_THRESHOLD
})

const handleFileChange = (file) => {
  const extension = file.name.split('.').pop().toLowerCase()
  if (!['las', 'ply'].includes(extension)) {
    ElMessage.error('不支持的文件格式，请上传 .las 或 .ply 文件')
    return
  }
  selectedFile.value = file.raw
  resetUploadState()
}

const resetUploadState = () => {
  uploading.value = false
  uploadStatus.value = null
  uploadId.value = null
  totalChunks.value = 0
  uploadedChunks.value = 0
  progress.value = 0
  currentChunkSpeed.value = 0
  remainingTime.value = 0
}

const startUpload = async () => {
  if (!selectedFile.value) return
  
  if (isLargeFile.value) {
    await startChunkedUpload()
  } else {
    await uploadFile()
  }
}

const uploadFile = async () => {
  uploading.value = true
  uploadStatus.value = null
  try {
    const response = await pointCloudApi.upload(selectedFile.value)
    ElMessage.success('文件上传成功')
    router.push(`/analysis/${response.data.id}`)
  } catch (error) {
    console.error('Upload error:', error)
    ElMessage.error(error.response?.data?.detail || '上传失败')
    uploadStatus.value = 'exception'
  } finally {
    uploading.value = false
  }
}

const startChunkedUpload = async () => {
  uploading.value = true
  uploadStatus.value = null
  
  try {
    const initResponse = await pointCloudApi.initChunkedUpload(
      selectedFile.value.name,
      selectedFile.value.size,
      CHUNK_SIZE
    )
    
    uploadId.value = initResponse.data.upload_id
    totalChunks.value = initResponse.data.total_chunks
    uploadedChunks.value = 0
    progress.value = 0
    
    const file = selectedFile.value
    const uploadStart = Date.now()
    
    for (let i = 0; i < totalChunks.value; i++) {
      if (!uploading.value) break
      
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunkBlob = file.slice(start, end)
      
      const chunkStartTime = Date.now()
      
      const base64Data = await fileUtils.readFileAsBase64(chunkBlob)
      
      await pointCloudApi.uploadChunk(
        uploadId.value,
        i,
        base64Data
      )
      
      const chunkTime = Date.now() - chunkStartTime
      if (chunkTime > 0) {
        currentChunkSpeed.value = chunkBlob.size / (chunkTime / 1000)
      }
      
      uploadedChunks.value = i + 1
      progress.value = uploadedChunks.value / totalChunks.value
      
      const elapsedTime = (Date.now() - uploadStart) / 1000
      const averageSpeed = (i + 1) * CHUNK_SIZE / elapsedTime
      const remainingBytes = file.size - (i + 1) * CHUNK_SIZE
      remainingTime.value = remainingBytes / averageSpeed
    }
    
    if (uploading.value && uploadedChunks.value === totalChunks.value) {
      uploadStatus.value = 'success'
      ElMessage.success('所有分片上传完成，正在处理...')
      
      const completeResponse = await pointCloudApi.completeChunkedUpload(uploadId.value)
      ElMessage.success('点云处理完成')
      router.push(`/analysis/${completeResponse.data.pointcloud_id}`)
    }
    
  } catch (error) {
    console.error('Chunked upload error:', error)
    ElMessage.error(error.response?.data?.detail || '分片上传失败')
    uploadStatus.value = 'exception'
  } finally {
    uploading.value = false
  }
}

const cancelUpload = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消上传吗？已上传的分片将被删除。',
      '确认取消',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续上传',
        type: 'warning'
      }
    )
    
    uploading.value = false
    
    if (uploadId.value) {
      await pointCloudApi.cancelChunkedUpload(uploadId.value)
    }
    
    resetUploadState()
    ElMessage.info('上传已取消')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Cancel error:', error)
    }
  }
}

const clearFile = () => {
  selectedFile.value = null
  resetUploadState()
}

const goToAnalysis = (pointCloud) => {
  router.push(`/analysis/${pointCloud.id}`)
}

const goToHistory = () => {
  router.push('/history')
}

const loadRecentPointClouds = async () => {
  loading.value = true
  try {
    const response = await pointCloudApi.list(0, 5)
    recentPointClouds.value = response.data
  } catch (error) {
    console.error('Load error:', error)
  } finally {
    loading.value = false
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatNumber = (num) => {
  if (!num) return '-'
  return num.toLocaleString()
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const formatETA = (seconds) => {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '计算中...'
  if (seconds < 60) return `${Math.ceil(seconds)} 秒`
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} 分钟`
  return `${(seconds / 3600).toFixed(1)} 小时`
}

onMounted(() => {
  loadRecentPointClouds()
})
</script>

<style scoped>
.home-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-card {
  height: auto;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  padding: 40px;
}

.file-info {
  margin-top: 20px;
}

.upload-progress {
  margin-top: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.upload-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.history-card {
  min-height: 200px;
}

.guide-card {
  height: 100%;
}

.guide-card :deep(.el-timeline-item__tail) {
  border-left-style: dashed;
}
</style>
