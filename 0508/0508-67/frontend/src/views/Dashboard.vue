<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>实时监控</h2>
      <el-button type="primary" @click="refreshData" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <div v-for="(machines, floor) in groupedMachines" :key="floor" class="floor-section">
      <h3 class="floor-title">{{ floor }}楼</h3>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="machine in machines" :key="machine.machineId">
          <el-card :class="['machine-card', { 'low-water': machine.isLowWater }]" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="location">{{ machine.location }}</span>
                <el-tag v-if="machine.isLowWater" type="danger" effect="dark">低水位</el-tag>
                <el-tag v-else type="success">正常</el-tag>
              </div>
            </template>
            <div class="machine-info">
              <div class="water-level">
                <div class="progress-label">
                  <span>剩余水量</span>
                  <span class="value">{{ machine.remainingLiters?.toFixed(1) }} / {{ machine.maxCapacity }} L</span>
                </div>
                <el-progress 
                  :percentage="Math.round((machine.remainingLiters / machine.maxCapacity) * 100)"
                  :color="getProgressColor(machine)"
                  :stroke-width="18"
                />
              </div>
              <div class="details">
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="用水速度">
                    {{ machine.consumptionRate?.toFixed(2) }} L/小时
                  </el-descriptions-item>
                  <el-descriptions-item label="预计低水位时间">
                    {{ formatEstimatedTime(machine.estimatedLowWaterTime) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="上次上报">
                    {{ formatTime(machine.lastReportTime) }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
            <div class="card-actions" style="margin-top: 16px;">
              <el-button-group>
                <el-button size="small" @click="simulateReport(machine.machineId)">
                  <el-icon><Refresh /></el-icon>
                  模拟上报
                </el-button>
                <el-button size="small" type="success" @click="refil(machine.machineId)">
                  <el-icon><Plus /></el-icon>
                  手动加水
                </el-button>
              </el-button-group>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-empty v-if="Object.keys(groupedMachines).length === 0" description="暂无饮水机数据" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { getMachinesStatus, simulateMachineReport, refilMachine } from '../api'

const machines = ref([])
const loading = ref(false)
let refreshTimer = null

const groupedMachines = computed(() => {
  const groups = {}
  machines.value.forEach(machine => {
    const floor = machine.floor
    if (!groups[floor]) {
      groups[floor] = []
    }
    groups[floor].push(machine)
  })
  return groups
})

const getProgressColor = (machine) => {
  if (machine.isLowWater) {
    return '#f56c6c'
  }
  const percent = (machine.remainingLiters / machine.maxCapacity) * 100
  if (percent < 30) {
    return '#e6a23c'
  }
  return '#67c23a'
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const formatEstimatedTime = (time) => {
  if (!time) return '未知'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const refreshData = async () => {
  loading.value = true
  try {
    const response = await getMachinesStatus()
    machines.value = response.data
  } catch (error) {
    ElMessage.error('获取数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const simulateReport = async (machineId) => {
  try {
    await simulateMachineReport(machineId)
    ElMessage.success('模拟上报成功')
    await refreshData()
  } catch (error) {
    ElMessage.error('模拟上报失败')
  }
}

const refil = async (machineId) => {
  try {
    await refilMachine(machineId)
    ElMessage.success('加水成功')
    await refreshData()
  } catch (error) {
    ElMessage.error('加水失败')
  }
}

onMounted(() => {
  refreshData()
  refreshTimer = setInterval(refreshData, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.location {
  font-weight: 600;
  font-size: 16px;
}

.water-level {
  margin-bottom: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.value {
  font-weight: 600;
  color: #409eff;
}
</style>
