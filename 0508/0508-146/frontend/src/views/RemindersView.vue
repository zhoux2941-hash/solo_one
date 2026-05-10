<template>
  <div class="reminders-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="card">
          <template #header>
            <div class="card-header">
              <span>📅 今日提醒</span>
              <el-badge :value="todayReminders.length" class="item">
                <el-tag type="danger">待处理</el-tag>
              </el-badge>
            </div>
          </template>
          
          <div v-if="todayReminders.length > 0" class="reminder-list">
            <div
              v-for="reminder in todayReminders"
              :key="reminder.id"
              class="reminder-item"
              :class="getPriorityClass(reminder.careReminder.priority)"
            >
              <div class="reminder-header">
                <el-tag :type="getTypeTagType(reminder.careReminder.type)" size="small">
                  {{ getTypeLabel(reminder.careReminder.type) }}
                </el-tag>
                <el-tag :type="getPriorityTagType(reminder.careReminder.priority)" size="small">
                  {{ getPriorityLabel(reminder.careReminder.priority) }}
                </el-tag>
              </div>
              <h4 class="reminder-title">{{ reminder.careReminder.title }}</h4>
              <p class="reminder-content">{{ reminder.careReminder.content }}</p>
              <div class="reminder-info">
                <span>🌱 {{ reminder.graftingRecord.rootstock.name }} × {{ reminder.graftingRecord.scion.name }}</span>
              </div>
              <div class="reminder-actions">
                <el-button type="success" size="small" @click="completeReminder(reminder)">
                  已完成
                </el-button>
                <el-button type="info" size="small" @click="dismissReminder(reminder)">
                  忽略
                </el-button>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="今日暂无待处理的提醒" />
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card class="card">
          <template #header>
            <div class="card-header">
              <span>📊 物候期与管理计划</span>
              <el-select v-model="selectedRecord" placeholder="选择嫁接记录" style="width: 250px" @change="loadRecordReminders">
                <el-option
                  v-for="record in records"
                  :key="record.id"
                  :label="`${record.rootstock.name} × ${record.scion.name} (${record.graftingDate})`"
                  :value="record"
                />
              </el-select>
            </div>
          </template>
          
          <div v-if="selectedRecord" class="record-detail">
            <div class="current-stage">
              <el-alert
                :title="`当前物候期: ${currentStage}`"
                type="success"
                :closable="false"
                show-icon
              />
            </div>
            
            <el-divider content-position="left">物候期时间表</el-divider>
            
            <el-steps :active="currentStageIndex" direction="vertical" finish-status="success" class="timeline">
              <el-step
                v-for="(stage, index) in stages"
                :key="stage.id"
                :title="stage.name"
                :description="`第${stage.daysAfterGrafting}-${stage.daysAfterGrafting + stage.durationDays - 1}天`"
              >
                <template #icon>
                  <span class="step-icon">{{ index + 1 }}</span>
                </template>
              </el-step>
            </el-steps>
            
            <el-divider content-position="left">管理提醒列表</el-divider>
            
            <el-table :data="recordReminders" stripe style="width: 100%">
              <el-table-column prop="scheduledDate" label="日期" width="110" />
              <el-table-column label="类型" width="80">
                <template #default="{ row }">
                  <el-tag :type="getTypeTagType(row.careReminder.type)" size="small">
                    {{ getTypeLabel(row.careReminder.type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="careReminder.title" label="标题" width="150" />
              <el-table-column prop="careReminder.content" label="内容" show-overflow-tooltip />
              <el-table-column label="优先级" width="80">
                <template #default="{ row }">
                  <el-tag :type="getPriorityTagType(row.careReminder.priority)" size="small">
                    {{ getPriorityLabel(row.careReminder.priority) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="80">
                <template #default="{ row }">
                  <el-tag v-if="row.isCompleted" type="success" size="small">已完成</el-tag>
                  <el-tag v-else-if="row.isDismissed" type="info" size="small">已忽略</el-tag>
                  <el-tag v-else type="warning" size="small">待处理</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" fixed="right">
                <template #default="{ row }">
                  <el-button
                    v-if="!row.isCompleted && !row.isDismissed"
                    type="success"
                    size="small"
                    @click="completeReminder(row)"
                  >
                    完成
                  </el-button>
                  <el-button
                    v-if="!row.isCompleted && !row.isDismissed"
                    type="info"
                    size="small"
                    @click="dismissReminder(row)"
                  >
                    忽略
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <el-empty v-else description="请选择一个嫁接记录查看详细的管理计划" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getTodayReminders,
  getUpcomingReminders,
  getPhenologyStages,
  getRemindersByRecord,
  getAllRecords,
  getCurrentStage,
  completeReminder as completeReminderApi,
  dismissReminder as dismissReminderApi
} from '../api'

const todayReminders = ref([])
const upcomingReminders = ref([])
const stages = ref([])
const records = ref([])
const selectedRecord = ref(null)
const recordReminders = ref([])
const currentStage = ref('')
const currentStageIndex = ref(0)

const typeLabels = {
  WATERING: '浇水',
  UNBANDING: '解绑',
  FERTILIZING: '施肥',
  PRUNING: '修剪',
  PEST_CONTROL: '病虫害',
  OTHER: '其他'
}

const priorityLabels = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急'
}

const getTypeLabel = (type) => typeLabels[type] || type
const getPriorityLabel = (priority) => priorityLabels[priority] || priority

const getTypeTagType = (type) => {
  const types = {
    WATERING: 'primary',
    UNBANDING: 'warning',
    FERTILIZING: 'success',
    PRUNING: 'info',
    PEST_CONTROL: 'danger',
    OTHER: 'info'
  }
  return types[type] || ''
}

const getPriorityTagType = (priority) => {
  const types = {
    LOW: 'info',
    MEDIUM: '',
    HIGH: 'warning',
    URGENT: 'danger'
  }
  return types[priority] || ''
}

const getPriorityClass = (priority) => {
  return `priority-${priority.toLowerCase()}`
}

const loadTodayReminders = async () => {
  try {
    const res = await getTodayReminders()
    todayReminders.value = res.data
  } catch (error) {
    ElMessage.error('加载今日提醒失败')
  }
}

const loadStages = async () => {
  try {
    const res = await getPhenologyStages()
    stages.value = res.data
  } catch (error) {
    ElMessage.error('加载物候期失败')
  }
}

const loadRecords = async () => {
  try {
    const res = await getAllRecords()
    records.value = res.data
  } catch (error) {
    ElMessage.error('加载嫁接记录失败')
  }
}

const loadRecordReminders = async () => {
  if (!selectedRecord.value) return
  
  try {
    const [remindersRes, stageRes] = await Promise.all([
      getRemindersByRecord(selectedRecord.value.id),
      getCurrentStage(selectedRecord.value.graftingDate)
    ])
    
    recordReminders.value = remindersRes.data
    currentStage.value = stageRes.data.currentStage
    
    const daysSinceGrafting = calculateDaysSinceGrafting(selectedRecord.value.graftingDate)
    currentStageIndex.value = calculateStageIndex(daysSinceGrafting)
    
  } catch (error) {
    ElMessage.error('加载记录提醒失败')
  }
}

const calculateDaysSinceGrafting = (graftingDate) => {
  const today = new Date()
  const graftDate = new Date(graftingDate)
  return Math.floor((today - graftDate) / (1000 * 60 * 60 * 24))
}

const calculateStageIndex = (daysSinceGrafting) => {
  for (let i = stages.value.length - 1; i >= 0; i--) {
    if (daysSinceGrafting >= stages.value[i].daysAfterGrafting) {
      return i
    }
  }
  return 0
}

const completeReminder = async (reminder) => {
  try {
    await ElMessageBox.confirm(
      `确定已完成 "${reminder.careReminder.title}" 吗？`,
      '确认完成',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'success' }
    )
    
    await completeReminderApi(reminder.id)
    ElMessage.success('已标记为完成')
    
    await loadTodayReminders()
    if (selectedRecord.value) {
      await loadRecordReminders()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const dismissReminder = async (reminder) => {
  try {
    await ElMessageBox.confirm(
      `确定要忽略 "${reminder.careReminder.title}" 吗？`,
      '确认忽略',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    
    await dismissReminderApi(reminder.id)
    ElMessage.success('已忽略')
    
    await loadTodayReminders()
    if (selectedRecord.value) {
      await loadRecordReminders()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(async () => {
  await Promise.all([
    loadTodayReminders(),
    loadStages(),
    loadRecords()
  ])
})
</script>

<style scoped>
.reminders-container {
  margin-top: 20px;
}

.card {
  height: calc(100vh - 140px);
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.reminder-list {
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

.reminder-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  transition: all 0.3s;
}

.reminder-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.reminder-item.priority-urgent {
  border-left: 4px solid #f56c6c;
}

.reminder-item.priority-high {
  border-left: 4px solid #e6a23c;
}

.reminder-item.priority-medium {
  border-left: 4px solid #409eff;
}

.reminder-item.priority-low {
  border-left: 4px solid #909399;
}

.reminder-header {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.reminder-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.reminder-content {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.reminder-info {
  color: #909399;
  font-size: 12px;
  margin-bottom: 12px;
}

.reminder-actions {
  display: flex;
  gap: 8px;
}

.record-detail {
  margin-top: 20px;
}

.current-stage {
  margin-bottom: 20px;
}

.timeline {
  margin: 20px 0;
}

.step-icon {
  width: 24px;
  height: 24px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
</style>
