<template>
  <div class="page-container">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><Document /></el-icon> 任务详情</span>
              <div>
                <el-tag :type="task.status === 1 ? 'success' : 'info'" size="large">
                  {{ task.status === 1 ? '招募中' : '已结束' }}
                </el-tag>
              </div>
            </div>
          </template>
          
          <div v-if="task.id">
            <h2 class="detail-title">{{ task.title }}</h2>
            
            <div class="detail-meta">
              <div class="meta-row">
                <span class="meta-label">发布者：</span>
                <span class="meta-value">{{ task.publisherName }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">时长要求：</span>
                <span class="meta-value">{{ task.duration }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">预算：</span>
                <span class="meta-value budget">{{ task.budget }} 积分</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">试音人数：</span>
                <span class="meta-value">{{ task.auditionCount }} 人</span>
              </div>
              <div class="meta-row" v-if="task.tags && task.tags.length > 0">
                <span class="meta-label">要求声线：</span>
                <span class="meta-value">
                  <el-tag
                    v-for="tag in task.tags"
                    :key="tag.id"
                    type="warning"
                    size="small"
                    style="margin-right: 5px"
                  >
                    {{ tag.name }}
                  </el-tag>
                </span>
              </div>
              <div class="meta-row" v-if="task.winnerName">
                <span class="meta-label">中标者：</span>
                <span class="meta-value winner">{{ task.winnerName }}</span>
              </div>
            </div>

            <el-divider />

            <div class="detail-section">
              <h3><el-icon><Edit /></el-icon> 配音内容</h3>
              <p class="content-text">{{ task.content }}</p>
            </div>

            <div class="detail-section" v-if="task.exampleAudio">
              <h3><el-icon><Headset /></el-icon> 示例音频</h3>
              <audio
                controls
                class="audio-player"
                :src="`/api/audio/${task.exampleAudio}`"
              ></audio>
            </div>
          </div>

          <el-empty v-else description="加载中..." />
        </el-card>

        <el-card v-if="userStore.isVoiceActor && task.status === 1" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span><el-icon><Plus /></el-icon> 提交试音</span>
            </div>
          </template>
          
          <el-form :model="auditionForm" label-width="80px">
            <el-form-item label="附言">
              <el-input
                v-model="auditionForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入附言（可选）"
              />
            </el-form-item>
            <el-form-item label="试音音频">
              <el-upload
                ref="uploadRef"
                drag
                :auto-upload="false"
                :limit="1"
                :on-change="handleFileChange"
                :on-exceed="handleExceed"
                accept=".mp3"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                <template #tip>
                  <div class="el-upload__tip">
                    只能上传 mp3 文件，且不超过 5MB
                  </div>
                </template>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="submitAudition">
                提交试音
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="canViewAuditions && auditions.length > 0" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span><el-icon><List /></el-icon> 试音列表（{{ auditions.length }}条）</span>
            </div>
          </template>
          
          <div
            v-for="audition in auditions"
            :key="audition.id"
            class="audition-item"
          >
            <div class="audition-header">
              <span class="audition-author">
                <el-avatar :size="32" icon="UserFilled" />
                <span>{{ audition.voiceActorName }}</span>
              </span>
              <el-tag
                :type="audition.status === 1 ? 'success' : audition.status === 2 ? 'info' : 'warning'"
                size="small"
              >
                {{ audition.status === 1 ? '已中标' : audition.status === 2 ? '未中标' : '待审核' }}
              </el-tag>
            </div>
            <audio
              controls
              class="audio-player"
              :src="`/api/audio/${audition.audioPath}`"
            ></audio>
            <p v-if="audition.remark" class="audition-remark">
              <el-icon><ChatDotRound /></el-icon> {{ audition.remark }}
            </p>
            <div class="audition-footer">
              <span class="audition-time">{{ formatTime(audition.createTime) }}</span>
              <el-button
                v-if="isPublisher && task.status === 1"
                type="primary"
                size="small"
                @click="selectWinner(audition.id)"
              >
                选择中标
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><Star /></el-icon> 任务状态</span>
            </div>
          </template>
          <el-steps direction="vertical" :active="task.status === 1 ? 0 : 2">
            <el-step title="任务发布" />
            <el-step title="试音中" />
            <el-step title="任务结束" />
          </el-steps>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getTaskDetail, selectWinner as apiSelectWinner } from '@/api/task'
import { getTaskAuditions, submitAudition as apiSubmitAudition } from '@/api/audition'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()

const task = ref({})
const auditions = ref([])
const auditionForm = ref({ remark: '' })
const auditionFile = ref(null)
const uploadRef = ref(null)
const submitting = ref(false)

const isPublisher = computed(() => {
  return userStore.isLoggedIn &&
    userStore.userInfo?.id === task.value.publisherId
})

const canViewAuditions = computed(() => {
  return isPublisher.value || userStore.isVoiceActor
})

async function fetchTaskDetail() {
  const taskId = route.params.id
  const res = await getTaskDetail(taskId)
  task.value = res.data
  
  if (canViewAuditions.value) {
    fetchAuditions()
  }
}

async function fetchAuditions() {
  const taskId = route.params.id
  try {
    const res = await getTaskAuditions(taskId)
    auditions.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function handleFileChange(file) {
  auditionFile.value = file.raw
}

function handleExceed() {
  ElMessage.warning('只能上传一个文件')
}

async function submitAudition() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (!userStore.isVoiceActor) {
    ElMessage.warning('只有配音员可以提交试音')
    return
  }

  if (!auditionFile.value) {
    ElMessage.warning('请上传试音音频')
    return
  }

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('taskId', route.params.id)
    if (auditionForm.value.remark) {
      formData.append('remark', auditionForm.value.remark)
    }
    formData.append('audioFile', auditionFile.value)

    await apiSubmitAudition(formData)
    ElMessage.success('试音提交成功')
    auditionForm.value.remark = ''
    auditionFile.value = null
    uploadRef.value?.clearFiles()
    fetchTaskDetail()
  } finally {
    submitting.value = false
  }
}

async function selectWinner(auditionId) {
  try {
    await ElMessageBox.confirm(
      '确定选择该配音员为中标者吗？此操作不可撤销。',
      '确认中标',
      { type: 'warning' }
    )
    
    await apiSelectWinner(route.params.id, auditionId)
    ElMessage.success('中标选择成功，积分已自动结算')
    fetchTaskDetail()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

onMounted(() => {
  fetchTaskDetail()
})
</script>

<style scoped>
.detail-title {
  font-size: 24px;
  margin: 0 0 20px;
}

.detail-meta {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
}

.meta-row {
  margin-bottom: 10px;
  display: flex;
}

.meta-label {
  color: #909399;
  min-width: 80px;
}

.meta-value {
  color: #303133;
}

.meta-value.budget {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}

.meta-value.winner {
  color: #67c23a;
  font-weight: bold;
}

.detail-section {
  margin-bottom: 25px;
}

.detail-section h3 {
  font-size: 16px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.content-text {
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
}

.audition-item {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 15px;
}

.audition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.audition-author {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.audition-remark {
  color: #909399;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.audition-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.audition-time {
  color: #c0c4cc;
  font-size: 13px;
}
</style>
