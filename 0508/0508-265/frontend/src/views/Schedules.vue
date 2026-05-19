<template>
  <div class="schedules">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>运维人员排班</span>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            新增排班
          </el-button>
        </div>
      </template>

      <el-calendar v-model="selectedDate">
        <template #date-cell="cell">
          <div class="calendar-cell">
            <span>{{ cell.day.split('-')[2] }}</span>
            <div v-if="getDaySchedules(cell.date).length > 0" class="schedule-dots">
              <div 
                v-for="(s, i) in getDaySchedules(cell.date).slice(0, 3)" 
                :key="i" 
                class="dot"
                :style="{ backgroundColor: getShiftColor(s.shiftType) }"
              ></div>
            </div>
          </div>
        </template>
      </el-calendar>

      <div style="margin-top: 20px">
        <h4>{{ formatDate(selectedDate) }} 排班详情</h4>
        <el-table :data="getDaySchedules(selectedDate)" style="width: 100%; margin-top: 15px">
          <el-table-column prop="userName" label="人员" width="120" />
          <el-table-column prop="shiftType" label="班次" width="120">
            <template #default="scope">
              <el-tag :type="getShiftType(scope.row.shiftType)">
                {{ getShiftText(scope.row.shiftType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="tasks" label="任务" />
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button size="small" type="danger" @click="deleteSchedule(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-dialog v-model="showAddDialog" title="新增排班" width="500px">
      <el-form :model="scheduleForm" label-width="80px">
        <el-form-item label="排班日期">
          <el-date-picker v-model="scheduleForm.scheduleDate" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="运维人员">
          <el-select v-model="scheduleForm.userId" placeholder="请选择" style="width: 100%">
            <el-option 
              v-for="user in workers" 
              :key="user.id" 
              :label="user.realName" 
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="班次">
          <el-select v-model="scheduleForm.shiftType" placeholder="请选择" style="width: 100%">
            <el-option label="早班" value="MORNING" />
            <el-option label="中班" value="AFTERNOON" />
            <el-option label="晚班" value="NIGHT" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务">
          <el-input v-model="scheduleForm.tasks" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addSchedule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { scheduleApi, userApi } from '../api'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const selectedDate = ref(new Date())
const showAddDialog = ref(false)
const schedules = ref([])
const workers = ref([])

const scheduleForm = reactive({
  scheduleDate: new Date(),
  userId: null,
  shiftType: '',
  tasks: ''
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const getShiftColor = (type) => {
  const map = {
    'MORNING': '#67c23a',
    'AFTERNOON': '#e6a23c',
    'NIGHT': '#409eff'
  }
  return map[type] || '#999'
}

const getShiftType = (type) => {
  const map = {
    'MORNING': 'success',
    'AFTERNOON': 'warning',
    'NIGHT': 'primary'
  }
  return map[type] || 'info'
}

const getShiftText = (type) => {
  const map = {
    'MORNING': '早班',
    'AFTERNOON': '中班',
    'NIGHT': '晚班'
  }
  return map[type] || type
}

const getDaySchedules = (date) => {
  const dateStr = new Date(date).toISOString().split('T')[0]
  return schedules.value.filter(s => {
    const scheduleDate = new Date(s.scheduleDate).toISOString().split('T')[0]
    return scheduleDate === dateStr
  })
}

const addSchedule = async () => {
  try {
    await scheduleApi.create(scheduleForm)
    ElMessage.success('排班添加成功')
    showAddDialog.value = false
    loadSchedules()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const deleteSchedule = async (id) => {
  try {
    await scheduleApi.delete(id)
    ElMessage.success('删除成功')
    loadSchedules()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const loadSchedules = async () => {
  schedules.value = await scheduleApi.getAll()
}

const loadWorkers = async () => {
  const allUsers = await userApi.getAll()
  workers.value = allUsers.filter(u => u.role === 'WORKER')
}

onMounted(() => {
  loadSchedules()
  loadWorkers()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-cell {
  padding: 5px;
  height: 80px;
  display: flex;
  flex-direction: column;
}

.schedule-dots {
  display: flex;
  gap: 3px;
  margin-top: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
