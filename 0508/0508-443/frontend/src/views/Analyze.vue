<template>
  <div class="analyze-page">
    <el-card>
      <template #header>
        <span>上传TS文件进行分析</span>
      </template>
      
      <el-upload
        class="upload-area"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".ts,.mts,.m2ts"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将TS文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .ts, .mts, .m2ts 格式的文件，将解析SDT/PAT/PMT表获取完整节目与PID信息
          </div>
        </template>
      </el-upload>

      <div v-if="selectedFile" class="file-info">
        <el-alert
          :title="`已选择文件: ${selectedFile.name} (${formatSize(selectedFile.size)})`"
          type="info"
          show-icon
          :closable="false"
        />
        <el-button 
          type="primary" 
          style="margin-top: 15px"
          :loading="analyzing"
          @click="startAnalyze"
        >
          开始分析
        </el-button>
      </div>

      <el-progress 
        v-if="analyzing" 
        :percentage="progress" 
        style="margin-top: 20px"
      />
    </el-card>

    <el-card v-if="analysisResult" style="margin-top: 20px">
      <template #header>
        <span>分析结果</span>
      </template>

      <div v-if="analysisResult.format" class="section">
        <h3>文件信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="格式名称">{{ analysisResult.format.name }}</el-descriptions-item>
          <el-descriptions-item label="时长">{{ formatDuration(analysisResult.format.duration) }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatSize(analysisResult.format.size) }}</el-descriptions-item>
          <el-descriptions-item label="总码率">{{ formatBitrate(analysisResult.format.bitrate) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="analysisResult.sdtInfo && analysisResult.sdtInfo.length > 0" class="section">
        <h3>SDT 服务信息 <el-tag type="info" size="small">从SDT表解析</el-tag></h3>
        <el-table :data="analysisResult.sdtInfo" style="width: 100%" border>
          <el-table-column prop="serviceId" label="服务ID" width="100">
            <template #default="{ row }">
              {{ row.serviceId }}
            </template>
          </el-table-column>
          <el-table-column prop="serviceName" label="节目名称" min-width="150">
            <template #default="{ row }">
              <span style="font-weight: bold; color: #303133">{{ row.serviceName || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="serviceProviderName" label="服务提供商" min-width="130">
            <template #default="{ row }">
              {{ row.serviceProviderName || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="服务类型" min-width="150">
            <template #default="{ row }">
              <el-tag v-if="row.serviceTypeDesc" size="small" :type="getServiceTypeTag(row.serviceType)">
                {{ row.serviceTypeDesc }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="运行状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getRunningStatusTag(row.runningStatus)" size="small">
                {{ row.runningStatusDesc || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="加密" width="70">
            <template #default="{ row }">
              <el-tag :type="row.freeCaMode ? 'danger' : 'success'" size="small">
                {{ row.freeCaMode ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="PMT PID" width="100">
            <template #default="{ row }">
              <code v-if="row.pmtPidHex">{{ row.pmtPidHex }}</code>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="包含流" min-width="200">
            <template #default="{ row }">
              <div v-if="row.streams && row.streams.length > 0" class="stream-tags">
                <el-tag 
                  v-for="s in row.streams" 
                  :key="s.pid" 
                  size="small"
                  :type="isVideoStream(s.streamType) ? 'primary' : isAudioStream(s.streamType) ? 'success' : 'info'"
                  style="margin: 2px"
                >
                  {{ s.pidHex }} {{ s.streamTypeDesc }}
                </el-tag>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="analysisResult.pidTable && analysisResult.pidTable.length > 0" class="section">
        <h3>PID 总表 <el-tag type="info" size="small">SDT + PAT + PMT 合并</el-tag></h3>
        <el-table :data="analysisResult.pidTable" style="width: 100%" border>
          <el-table-column prop="pidHex" label="PID" width="100">
            <template #default="{ row }">
              <code style="font-weight: bold; color: #303133">{{ row.pidHex }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="pid" label="PID (十进制)" width="120" />
          <el-table-column prop="type" label="类型" width="130">
            <template #default="{ row }">
              <el-tag 
                :type="getPidTypeTag(row.type)" 
                size="small"
              >
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
          <el-table-column prop="serviceName" label="所属节目" min-width="130" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.serviceName" style="color: #409EFF; font-weight: 500">{{ row.serviceName }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="serviceProviderName" label="服务提供商" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.serviceProviderName || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="codecInfo" label="编码详情" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <code v-if="row.codecInfo">{{ row.codecInfo }}</code>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="analysisResult.streams && analysisResult.streams.length > 0" class="section">
        <h3>流详细信息</h3>
        <el-table :data="analysisResult.streams" style="width: 100%">
          <el-table-column prop="index" label="索引" width="80" />
          <el-table-column prop="codecType" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.codecType === 'video' ? 'primary' : 'success'" size="small">
                {{ row.codecType === 'video' ? '视频' : row.codecType === 'audio' ? '音频' : row.codecType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="codecName" label="编码格式" width="120" />
          <el-table-column prop="codecLongName" label="编码名称" show-overflow-tooltip />
          <el-table-column label="分辨率" width="120">
            <template #default="{ row }">
              {{ row.resolution || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="帧率" width="100">
            <template #default="{ row }">
              {{ row.frameRate ? row.frameRate.toFixed(2) + ' fps' : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="码率" width="120">
            <template #default="{ row }">
              {{ formatBitrate(row.bitrate) }}
            </template>
          </el-table-column>
          <el-table-column label="采样率" width="120">
            <template #default="{ row }">
              {{ row.sampleRate ? row.sampleRate + ' Hz' : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="声道" width="80">
            <template #default="{ row }">
              {{ row.channels || '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="analysisResult.errors && analysisResult.errors.length > 0" class="section">
        <h3>错误信息</h3>
        <el-table :data="analysisResult.errors" style="width: 100%">
          <el-table-column prop="type" label="错误类型" width="150" />
          <el-table-column prop="message" label="错误信息" show-overflow-tooltip />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { analyzeApi } from '../api'

const selectedFile = ref(null)
const analyzing = ref(false)
const progress = ref(0)
const analysisResult = ref(null)

const handleFileChange = (file) => {
  selectedFile.value = file.raw
  analysisResult.value = null
}

const startAnalyze = async () => {
  if (!selectedFile.value) return
  
  analyzing.value = true
  progress.value = 0
  
  try {
    const result = await analyzeApi.uploadTsFile(selectedFile.value, (progressEvent) => {
      progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    })
    
    analysisResult.value = result.analysis
    ElMessage.success('分析完成')
  } catch (err) {
    ElMessage.error('分析失败: ' + (err.response?.data?.error || err.message))
  } finally {
    analyzing.value = false
    progress.value = 100
  }
}

const isVideoStream = (streamType) => {
  return [0x01, 0x02, 0x1B, 0x20, 0x24].includes(streamType)
}

const isAudioStream = (streamType) => {
  return [0x03, 0x04, 0x11, 0x81, 0x87].includes(streamType)
}

const getServiceTypeTag = (serviceType) => {
  if (!serviceType) return 'info'
  if ([0x01, 0x16, 0x19, 0x1A, 0x1B].includes(serviceType)) return 'primary'
  if ([0x02, 0x07, 0x17, 0x1C].includes(serviceType)) return 'success'
  return 'info'
}

const getRunningStatusTag = (status) => {
  if (status === 4) return 'success'
  if (status === 1 || status === 6) return 'danger'
  if (status === 2 || status === 3) return 'warning'
  return 'info'
}

const getPidTypeTag = (type) => {
  if (!type) return 'info'
  if (type === 'PAT' || type === 'PMT' || type === 'SDT' || type === 'NIT' || type === 'EIT' || type === 'TDT') return ''
  if (type === '视频') return 'primary'
  if (type === '音频') return 'success'
  if (type === 'PCR') return 'warning'
  return 'info'
}

const formatSize = (bytes) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const formatBitrate = (bitrate) => {
  if (!bitrate) return '-'
  if (bitrate < 1000) return bitrate + ' bps'
  if (bitrate < 1000000) return (bitrate / 1000).toFixed(2) + ' Kbps'
  return (bitrate / 1000000).toFixed(2) + ' Mbps'
}

const formatDuration = (seconds) => {
  if (!seconds) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}时${m}分${s}秒`
}
</script>

<style scoped>
.analyze-page {
  padding: 0;
}

.upload-area {
  margin-bottom: 20px;
}

.file-info {
  margin-top: 20px;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stream-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}
</style>
