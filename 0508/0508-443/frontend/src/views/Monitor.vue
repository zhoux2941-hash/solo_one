<template>
  <div class="monitor-page">
    <div class="action-bar">
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加组播流
      </el-button>
      <el-button @click="loadStreams">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="stream in streams" :key="stream.id">
        <el-card class="stream-card" :class="{ 'is-offline': !getMetrics(stream.id)?.isReceiving }">
          <template #header>
            <div class="card-header">
              <span class="stream-name">{{ stream.name }}</span>
              <el-tag :type="getMetrics(stream.id)?.isReceiving ? 'success' : 'danger'" size="small">
                {{ getMetrics(stream.id)?.isReceiving ? '正常' : '离线' }}
              </el-tag>
            </div>
          </template>
          
          <div class="stream-address">{{ stream.address }}</div>
          
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-label">码率</div>
              <div class="metric-value">{{ formatBitrate(getMetrics(stream.id)?.bitrate) }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">丢包率</div>
              <div class="metric-value" :class="{ 'text-danger': (getMetrics(stream.id)?.packetLossRate || 0) > 0.05 }">
                {{ formatPercent(getMetrics(stream.id)?.packetLossRate) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">运行时长</div>
              <div class="metric-value">{{ formatDuration(getMetrics(stream.id)?.uptime) }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">PTS抖动</div>
              <div class="metric-value">{{ getMetrics(stream.id)?.ptsJitter?.toFixed(2) || 0 }}</div>
            </div>
          </div>

          <div class="card-actions">
            <el-button size="small" @click="toggleRecording(stream)">
              <el-icon><VideoCamera /></el-icon>
              {{ isRecording(stream.id) ? '停止录制' : '开始录制' }}
            </el-button>
            <el-button size="small" @click="editStream(stream)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="deleteStream(stream.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAddDialog" :title="editingStream ? '编辑流' : '添加组播流'" width="500px">
      <el-form :model="streamForm" label-width="100px">
        <el-form-item label="流名称">
          <el-input v-model="streamForm.name" placeholder="例如：CCTV-1" />
        </el-form-item>
        <el-form-item label="组播地址">
          <el-input v-model="streamForm.address" placeholder="例如：udp://239.1.1.1:1234" />
        </el-form-item>
        <el-form-item label="期望码率(Mbps)">
          <el-input-number v-model="streamForm.expectedBitrate" :min="1" :max="100" :step="0.5" />
        </el-form-item>
        <el-form-item label="启用监控">
          <el-switch v-model="streamForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveStream">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRecordingDialog" title="录制设置" width="400px">
      <el-form label-width="120px">
        <el-form-item label="切割时长(分钟)">
          <el-input-number v-model="segmentDuration" :min="1" :max="1440" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecordingDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmStartRecording">开始录制</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { streamsApi, recordingsApi } from '../api'
import { useSocketStore } from '../stores/socket'

const socketStore = useSocketStore()

const streams = ref([])
const showAddDialog = ref(false)
const showRecordingDialog = ref(false)
const editingStream = ref(null)
const recordingStream = ref(null)
const segmentDuration = ref(15)
const recordingStatuses = ref(new Map())

const streamForm = ref({
  name: '',
  address: '',
  expectedBitrate: 5,
  enabled: true
})

let refreshInterval = null

const loadStreams = async () => {
  try {
    streams.value = await streamsApi.getAll()
  } catch (err) {
    ElMessage.error('加载流列表失败')
  }
}

const loadRecordingStatuses = async () => {
  try {
    const statuses = await recordingsApi.getStatus()
    const map = new Map()
    statuses.forEach(s => map.set(s.streamId, s))
    recordingStatuses.value = map
  } catch (err) {
    console.error('Load recording statuses error:', err)
  }
}

const getMetrics = (streamId) => {
  return socketStore.getStreamMetrics(streamId)
}

const formatBitrate = (bitrate) => {
  if (!bitrate) return '0 Mbps'
  return (bitrate / 1000000).toFixed(2) + ' Mbps'
}

const formatPercent = (value) => {
  if (value === undefined || value === null) return '0%'
  return (value * 100).toFixed(2) + '%'
}

const formatDuration = (ms) => {
  if (!ms) return '00:00:00'
  const seconds = Math.floor(ms / 1000)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const isRecording = (streamId) => {
  return recordingStatuses.value.has(streamId)
}

const editStream = (stream) => {
  editingStream.value = stream
  streamForm.value = {
    name: stream.name,
    address: stream.address,
    expectedBitrate: stream.expectedBitrate / 1000000,
    enabled: stream.enabled
  }
  showAddDialog.value = true
}

const saveStream = async () => {
  try {
    const data = {
      ...streamForm.value,
      expectedBitrate: streamForm.value.expectedBitrate * 1000000
    }

    if (editingStream.value) {
      await streamsApi.update(editingStream.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await streamsApi.create(data)
      ElMessage.success('添加成功')
    }

    showAddDialog.value = false
    editingStream.value = null
    loadStreams()
  } catch (err) {
    ElMessage.error(editingStream.value ? '更新失败' : '添加失败')
  }
}

const deleteStream = async (streamId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个流吗？', '确认删除', {
      type: 'warning'
    })
    await streamsApi.delete(streamId)
    ElMessage.success('删除成功')
    loadStreams()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const toggleRecording = (stream) => {
  if (isRecording(stream.id)) {
    stopRecording(stream.id)
  } else {
    recordingStream.value = stream
    showRecordingDialog.value = true
  }
}

const confirmStartRecording = async () => {
  if (!recordingStream.value) return
  
  try {
    await recordingsApi.start(recordingStream.value.id, segmentDuration.value)
    ElMessage.success('开始录制')
    showRecordingDialog.value = false
    loadRecordingStatuses()
  } catch (err) {
    ElMessage.error('开始录制失败')
  }
}

const stopRecording = async (streamId) => {
  try {
    await recordingsApi.stop(streamId)
    ElMessage.success('停止录制')
    loadRecordingStatuses()
  } catch (err) {
    ElMessage.error('停止录制失败')
  }
}

onMounted(() => {
  loadStreams()
  loadRecordingStatuses()
  refreshInterval = setInterval(() => {
    loadRecordingStatuses()
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.monitor-page {
  padding: 0;
}

.action-bar {
  margin-bottom: 20px;
}

.stream-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.stream-card.is-offline {
  opacity: 0.7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stream-name {
  font-weight: bold;
  font-size: 16px;
}

.stream-address {
  color: #666;
  font-size: 12px;
  margin-bottom: 15px;
  word-break: break-all;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 15px;
}

.metric-item {
  text-align: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.metric-value.text-danger {
  color: #f56c6c;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
