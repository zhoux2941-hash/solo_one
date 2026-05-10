<template>
  <div class="shift-swap-page">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="我的换班申请" name="sent">
        <el-card style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>我发起的换班申请</span>
              <el-button type="primary" @click="showCreateDialog = true">
                <el-icon><Plus /></el-icon>
                发起换班申请
              </el-button>
            </div>
          </template>

          <el-table :data="sentRequests" stripe v-loading="loading">
            <el-table-column label="班次信息" min-width="200">
              <template #default="{ row }">
                <div class="schedule-info">
                  <div class="schedule-position">
                    <el-tag type="primary">{{ row.schedule.position.name }}</el-tag>
                  </div>
                  <div class="schedule-detail">
                    <span>{{ row.schedule.scheduleDate }}</span>
                    <span>{{ row.schedule.startTime }} - {{ row.schedule.endTime }}</span>
                    <span>@ {{ row.schedule.location }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="换班对象" width="150">
              <template #default="{ row }">
                {{ row.toVolunteer.name }}
              </template>
            </el-table-column>
            <el-table-column label="申请原因" min-width="150">
              <template #default="{ row }">
                {{ row.reason || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="回复" min-width="120">
              <template #default="{ row }">
                {{ row.replyNote || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'PENDING'" 
                  type="danger" 
                  size="small"
                  @click="cancelSwap(row)"
                >
                  取消
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!loading && sentRequests.length === 0" description="暂无换班申请" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="待处理换班" name="received">
        <el-card>
          <template #header>
            <span>我收到的换班申请</span>
          </template>

          <el-table :data="receivedRequests" stripe v-loading="loading">
            <el-table-column label="申请人" width="120">
              <template #default="{ row }">
                {{ row.fromVolunteer.name }}
              </template>
            </el-table-column>
            <el-table-column label="班次信息" min-width="200">
              <template #default="{ row }">
                <div class="schedule-info">
                  <div class="schedule-position">
                    <el-tag type="primary">{{ row.schedule.position.name }}</el-tag>
                  </div>
                  <div class="schedule-detail">
                    <span>{{ row.schedule.scheduleDate }}</span>
                    <span>{{ row.schedule.startTime }} - {{ row.schedule.endTime }}</span>
                    <span>@ {{ row.schedule.location }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="申请原因" min-width="150">
              <template #default="{ row }">
                {{ row.reason || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'PENDING'" 
                  type="success" 
                  size="small"
                  @click="showReplyDialog(row, 'accept')"
                >
                  接受
                </el-button>
                <el-button 
                  v-if="row.status === 'PENDING'" 
                  type="danger" 
                  size="small"
                  @click="showReplyDialog(row, 'reject')"
                >
                  拒绝
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!loading && receivedRequests.length === 0" description="暂无收到的换班申请" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog 
      v-model="showCreateDialog" 
      title="发起换班申请" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="选择班次" prop="scheduleId">
          <el-select 
            v-model="createForm.scheduleId" 
            placeholder="请选择要换班的班次" 
            style="width: 100%;"
            @change="onScheduleChange"
          >
            <el-option 
              v-for="s in availableSchedules" 
              :key="s.id" 
              :label="`${s.position.name} | ${s.scheduleDate} ${s.startTime}-${s.endTime} @ ${s.location}`" 
              :value="s.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="换班对象" prop="toVolunteerId">
          <el-select 
            v-model="createForm.toVolunteerId" 
            placeholder="请选择要换班的志愿者" 
            style="width: 100%;"
            filterable
          >
            <el-option 
              v-for="v in volunteers" 
              :key="v.id" 
              :label="`${v.name} (${v.phone || v.username})`" 
              :value="v.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="换班原因">
          <el-input 
            v-model="createForm.reason" 
            type="textarea" 
            :rows="3"
            placeholder="请说明换班原因（选填）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="submitting">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="showReplyDialogVisible" 
      :title="replyAction === 'accept' ? '接受换班申请' : '拒绝换班申请'" 
      width="500px"
    >
      <el-form :model="replyForm" ref="replyFormRef" label-width="80px">
        <el-form-item label="申请人">
          <span>{{ currentReplyRequest?.fromVolunteer?.name }}</span>
        </el-form-item>
        <el-form-item label="班次">
          <span>{{ currentReplyRequest?.schedule?.position?.name }} | {{ currentReplyRequest?.schedule?.scheduleDate }}</span>
        </el-form-item>
        <el-form-item label="原因">
          <span>{{ currentReplyRequest?.reason || '无' }}</span>
        </el-form-item>
        <el-form-item v-if="replyAction === 'reject'" label="拒绝理由">
          <el-input 
            v-model="replyForm.replyNote" 
            type="textarea" 
            :rows="3"
            placeholder="请说明拒绝理由（选填）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showReplyDialogVisible = false">取消</el-button>
        <el-button 
          :type="replyAction === 'accept' ? 'success' : 'danger'" 
          @click="submitReply"
          :loading="submitting"
        >
          {{ replyAction === 'accept' ? '确认接受' : '确认拒绝' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const activeTab = ref('sent')
const loading = ref(false)
const submitting = ref(false)

const sentRequests = ref([])
const receivedRequests = ref([])
const availableSchedules = ref([])
const volunteers = ref([])

const showCreateDialog = ref(false)
const showReplyDialogVisible = ref(false)
const replyAction = ref('')
const currentReplyRequest = ref(null)

const createFormRef = ref(null)
const replyFormRef = ref(null)

const createForm = reactive({
  scheduleId: '',
  toVolunteerId: '',
  reason: ''
})

const replyForm = reactive({
  replyNote: ''
})

const createRules = {
  scheduleId: [{ required: true, message: '请选择班次', trigger: 'change' }],
  toVolunteerId: [{ required: true, message: '请选择换班对象', trigger: 'change' }]
}

function getStatusType(status) {
  const types = {
    PENDING: 'warning',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'info'
  }
  return types[status] || 'info'
}

function getStatusLabel(status) {
  const labels = {
    PENDING: '待审批',
    ACCEPTED: '已接受',
    REJECTED: '已拒绝',
    CANCELLED: '已取消'
  }
  return labels[status] || status
}

async function fetchSentRequests() {
  try {
    const response = await api.get('/volunteer/shift-swap/sent')
    if (response.data.success) {
      sentRequests.value = response.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

async function fetchReceivedRequests() {
  try {
    const response = await api.get('/volunteer/shift-swap/received')
    if (response.data.success) {
      receivedRequests.value = response.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

async function fetchAvailableSchedules() {
  try {
    const response = await api.get('/volunteer/schedules')
    if (response.data.success) {
      availableSchedules.value = response.data.data.filter(
        s => s.status === 'PENDING'
      )
    }
  } catch (e) {
    console.error(e)
  }
}

async function fetchVolunteers() {
  try {
    const response = await api.get('/volunteer/volunteers')
    if (response.data.success) {
      volunteers.value = response.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

function handleTabChange(tab) {
  if (tab === 'sent') {
    fetchSentRequests()
  } else {
    fetchReceivedRequests()
  }
}

function onScheduleChange() {
  createForm.toVolunteerId = ''
}

function resetCreateForm() {
  createForm.scheduleId = ''
  createForm.toVolunteerId = ''
  createForm.reason = ''
}

async function submitCreate() {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    submitting.value = true
    
    const response = await api.post('/volunteer/shift-swap', {
      scheduleId: createForm.scheduleId,
      toVolunteerId: createForm.toVolunteerId,
      reason: createForm.reason
    })
    
    if (response.data.success) {
      ElMessage.success(response.data.message)
      showCreateDialog.value = false
      resetCreateForm()
      fetchSentRequests()
    } else {
      ElMessage.error(response.data.message || '提交失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

async function cancelSwap(request) {
  try {
    await ElMessageBox.confirm('确定要取消这个换班申请吗？', '确认取消', {
      type: 'warning'
    })

    const response = await api.post(`/volunteer/shift-swap/${request.id}/cancel`)
    
    if (response.data.success) {
      ElMessage.success(response.data.message)
      fetchSentRequests()
    } else {
      ElMessage.error(response.data.message || '取消失败')
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.message || '取消失败')
    }
  }
}

function showReplyDialog(request, action) {
  currentReplyRequest.value = request
  replyAction.value = action
  replyForm.replyNote = ''
  showReplyDialogVisible.value = true
}

async function submitReply() {
  try {
    submitting.value = true
    const url = replyAction.value === 'accept' 
      ? `/volunteer/shift-swap/${currentReplyRequest.value.id}/accept`
      : `/volunteer/shift-swap/${currentReplyRequest.value.id}/reject`
    
    const response = await api.post(url, {
      replyNote: replyForm.replyNote
    })
    
    if (response.data.success) {
      ElMessage.success(response.data.message)
      showReplyDialogVisible.value = false
      fetchReceivedRequests()
    } else {
      ElMessage.error(response.data.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchSentRequests(),
      fetchReceivedRequests(),
      fetchAvailableSchedules(),
      fetchVolunteers()
    ])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.shift-swap-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.schedule-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}
</style>
