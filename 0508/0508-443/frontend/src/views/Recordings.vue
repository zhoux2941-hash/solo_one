<template>
  <div class="recordings-page">
    <div class="action-bar">
      <el-select v-model="filterStreamId" placeholder="按流筛选" clearable style="width: 200px" @change="loadRecordings">
        <el-option v-for="stream in streams" :key="stream.id" :label="stream.name" :value="stream.id" />
      </el-select>
      <el-button @click="loadRecordings">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-table :data="recordings" style="width: 100%">
      <el-table-column prop="streamName" label="流名称" />
      <el-table-column prop="streamAddress" label="流地址" show-overflow-tooltip />
      <el-table-column prop="startTime" label="开始时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.startTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="endTime" label="结束时间" width="180">
        <template #default="{ row }">
          {{ row.endTime ? formatDateTime(row.endTime) : '录制中' }}
        </template>
      </el-table-column>
      <el-table-column prop="totalDuration" label="时长" width="120">
        <template #default="{ row }">
          {{ formatDuration(row.totalDuration) }}
        </template>
      </el-table-column>
      <el-table-column prop="totalSize" label="大小" width="120">
        <template #default="{ row }">
          {{ formatSize(row.totalSize) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
            {{ row.isActive ? '录制中' : '已完成' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="playRecording(row)" :disabled="row.isActive">
            <el-icon><VideoPlay /></el-icon>
            播放
          </el-button>
          <el-button size="small" type="danger" @click="deleteRecording(row.id)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showPlayerDialog" title="播放录制文件" width="900px">
      <div class="player-container">
        <video ref="videoPlayer" class="video-js vjs-default-skin" controls preload="auto" style="width: 100%; height: 500px">
          <source :src="currentVideoUrl" type="video/MP2T" />
        </video>
      </div>
      <div v-if="currentRecording?.files?.length > 1" class="file-list">
        <div class="file-list-title">文件列表：</div>
        <el-radio-group v-model="currentFileIndex">
          <el-radio v-for="(file, index) in currentRecording?.files" :key="index" :label="index">
            {{ getFileName(file) }}
          </el-radio>
        </el-radio-group>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { recordingsApi, streamsApi } from '../api'
import videojs from 'video.js'

const recordings = ref([])
const streams = ref([])
const filterStreamId = ref('')
const showPlayerDialog = ref(false)
const currentRecording = ref(null)
const currentFileIndex = ref(0)
const videoPlayer = ref(null)
let player = null

const loadStreams = async () => {
  try {
    streams.value = await streamsApi.getAll()
  } catch (err) {
    console.error('Load streams error:', err)
  }
}

const loadRecordings = async () => {
  try {
    const filters = filterStreamId.value ? { streamId: filterStreamId.value } : {}
    recordings.value = await recordingsApi.getAll(filters)
  } catch (err) {
    ElMessage.error('加载录制列表失败')
  }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const formatDuration = (ms) => {
  if (!ms) return '-'
  const seconds = Math.floor(ms / 1000)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}时${m}分${s}秒`
}

const formatSize = (bytes) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const getFileName = (filePath) => {
  if (!filePath) return ''
  const parts = filePath.split(/[/\\]/)
  return parts[parts.length - 1]
}

const getFileUrl = (filePath) => {
  if (!filePath) return ''
  const parts = filePath.split(/recordings[/\\]/)
  if (parts.length > 1) {
    return '/recordings/' + parts[1].replace(/\\/g, '/')
  }
  return ''
}

const currentVideoUrl = ref('')

watch(currentFileIndex, () => {
  if (currentRecording.value?.files?.[currentFileIndex.value]) {
    currentVideoUrl.value = getFileUrl(currentRecording.value.files[currentFileIndex.value])
    if (player) {
      player.src({ src: currentVideoUrl.value, type: 'video/MP2T' })
      player.load()
    }
  }
})

const playRecording = async (recording) => {
  currentRecording.value = recording
  currentFileIndex.value = 0
  
  if (recording.files && recording.files.length > 0) {
    currentVideoUrl.value = getFileUrl(recording.files[0])
  }
  
  showPlayerDialog.value = true
  
  await nextTick()
  if (videoPlayer.value) {
    player = videojs(videoPlayer.value, {
      fluid: true,
      playbackRates: [0.5, 1, 1.5, 2]
    })
  }
}

const deleteRecording = async (recordingId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个录制文件吗？', '确认删除', {
      type: 'warning'
    })
    await recordingsApi.delete(recordingId)
    ElMessage.success('删除成功')
    loadRecordings()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadStreams()
  loadRecordings()
})
</script>

<style scoped>
.recordings-page {
  padding: 0;
}

.action-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.player-container {
  background: #000;
  border-radius: 4px;
}

.file-list {
  margin-top: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.file-list-title {
  font-weight: bold;
  margin-bottom: 10px;
}
</style>
