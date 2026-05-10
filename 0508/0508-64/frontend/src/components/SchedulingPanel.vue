<template>
  <el-card class="scheduling-panel">
    <template #header>
      <div class="card-header">
        <span>📋 排班设置</span>
        <div>
          <el-button type="primary" @click="generateSchedule" :loading="loading">
            生成排班
          </el-button>
          <el-button @click="resetAll" style="margin-left: 8px;">
            重置
          </el-button>
        </div>
      </div>
    </template>
    
    <el-descriptions :column="2" border class="info-desc">
      <el-descriptions-item label="司机数量">8 名</el-descriptions-item>
      <el-descriptions-item label="疲劳阈值">低于 30 不安排</el-descriptions-item>
      <el-descriptions-item label="开车消耗">每小时 -10</el-descriptions-item>
      <el-descriptions-item label="休息恢复">每半小时 +5</el-descriptions-item>
    </el-descriptions>
    
    <el-divider content-position="left">时段需求配置</el-divider>
    
    <div class="time-slots">
      <div v-for="(slot, index) in timeSlots" :key="index" class="slot-row">
        <el-select v-model="slot.startHour" placeholder="开始" style="width: 120px;">
          <el-option v-for="h in 24" :key="h" :label="`${h-1}:00`" :value="h-1" />
        </el-select>
        <span class="to">至</span>
        <el-select v-model="slot.endHour" placeholder="结束" style="width: 120px;">
          <el-option v-for="h in 24" :key="h" :label="`${h}:00`" :value="h" />
        </el-select>
        <span class="need">需要</span>
        <el-input-number v-model="slot.driverCount" :min="1" :max="8" style="width: 100px;" />
        <span class="unit">人</span>
        <el-button 
          v-if="timeSlots.length > 1" 
          type="danger" 
          text 
          @click="removeSlot(index)"
          style="margin-left: 16px;"
        >
          删除
        </el-button>
      </div>
      
      <el-button type="primary" text @click="addSlot" style="margin-top: 12px;">
        + 添加时段
      </el-button>
    </div>
    
    <el-divider content-position="left">快捷示例</el-divider>
    <el-button-group>
      <el-button size="small" @click="loadExample1">早高峰示例</el-button>
      <el-button size="small" @click="loadExample2">晚高峰示例</el-button>
      <el-button size="small" @click="loadExample3">全日示例</el-button>
    </el-button-group>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { schedulingApi } from '../utils/api'

const emit = defineEmits(['scheduled', 'reset'])

const loading = ref(false)

const timeSlots = ref([
  { startHour: 7, endHour: 9, driverCount: 5 },
  { startHour: 17, endHour: 19, driverCount: 6 }
])

const addSlot = () => {
  timeSlots.value.push({ startHour: 9, endHour: 11, driverCount: 3 })
}

const removeSlot = (index) => {
  timeSlots.value.splice(index, 1)
}

const validateSlots = () => {
  for (const slot of timeSlots.value) {
    if (slot.startHour === undefined || slot.startHour === null) {
      ElMessage.error('请设置所有时段的开始时间')
      return false
    }
    if (slot.endHour === undefined || slot.endHour === null) {
      ElMessage.error('请设置所有时段的结束时间')
      return false
    }
    if (slot.startHour >= slot.endHour) {
      ElMessage.error('结束时间必须大于开始时间')
      return false
    }
    if (!slot.driverCount || slot.driverCount < 1) {
      ElMessage.error('司机数量至少为1')
      return false
    }
  }
  return true
}

const generateSchedule = async () => {
  if (!validateSlots()) return
  
  loading.value = true
  try {
    const data = {
      requirements: timeSlots.value.map(s => ({
        startHour: s.startHour,
        endHour: s.endHour,
        driverCount: s.driverCount
      }))
    }
    
    const res = await schedulingApi.generate(data)
    emit('scheduled', res.data)
    ElMessage.success(res.data.message || '排班成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('排班失败：' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

const resetAll = () => {
  emit('reset')
  ElMessage.success('已重置今日排班和精力值')
}

const loadExample1 = () => {
  timeSlots.value = [
    { startHour: 7, endHour: 9, driverCount: 5 },
    { startHour: 9, endHour: 11, driverCount: 3 }
  ]
}

const loadExample2 = () => {
  timeSlots.value = [
    { startHour: 17, endHour: 19, driverCount: 6 },
    { startHour: 19, endHour: 21, driverCount: 4 }
  ]
}

const loadExample3 = () => {
  timeSlots.value = [
    { startHour: 6, endHour: 8, driverCount: 4 },
    { startHour: 8, endHour: 10, driverCount: 5 },
    { startHour: 10, endHour: 12, driverCount: 3 },
    { startHour: 14, endHour: 16, driverCount: 4 },
    { startHour: 16, endHour: 18, driverCount: 6 },
    { startHour: 18, endHour: 20, driverCount: 5 }
  ]
}
</script>

<style scoped>
.scheduling-panel {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.info-desc {
  margin-bottom: 16px;
}

.slot-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.slot-row .to,
.slot-row .need,
.slot-row .unit {
  margin: 0 8px;
  color: #606266;
}
</style>
