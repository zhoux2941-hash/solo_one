<template>
  <el-card class="energy-panel">
    <template #header>
      <span>⚡ 司机精力值状态</span>
    </template>
    
    <div class="energy-list">
      <div v-for="driver in drivers" :key="driver.driverId" class="energy-item">
        <div class="driver-info">
          <span class="driver-name">{{ driver.driverName }}</span>
          <span class="driver-number">{{ driver.driverNumber }}</span>
          <el-tag 
            v-if="driver.isFatigued" 
            type="danger" 
            size="small"
            style="margin-left: 8px;"
          >
            疲劳
          </el-tag>
        </div>
        <div class="progress-wrapper">
          <el-progress 
            :percentage="driver.currentEnergy" 
            :color="getProgressColor(driver)"
            :stroke-width="18"
            :format="formatProgress"
          />
        </div>
      </div>
      
      <el-empty v-if="!drivers || drivers.length === 0" description="暂无数据" />
    </div>
    
    <el-divider />
    
    <div class="legend">
      <div class="legend-item">
        <span class="dot green"></span>
        <span>精力充足 (≥70)</span>
      </div>
      <div class="legend-item">
        <span class="dot warning"></span>
        <span>精力一般 (30-69)</span>
      </div>
      <div class="legend-item">
        <span class="dot danger"></span>
        <span>疲劳状态 (<30)</span>
      </div>
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  drivers: {
    type: Array,
    default: () => []
  }
})

const getProgressColor = (driver) => {
  if (driver.currentEnergy >= 70) return '#67c23a'
  if (driver.currentEnergy >= 30) return '#e6a23c'
  return '#f56c6c'
}

const formatProgress = (percentage) => {
  return `${percentage}/100`
}
</script>

<style scoped>
.energy-panel {
  margin-bottom: 24px;
}

.energy-list {
  max-height: 500px;
  overflow-y: auto;
}

.energy-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.driver-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.driver-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.driver-number {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.progress-wrapper {
  padding: 0 4px;
}

.legend {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #606266;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}

.dot.green {
  background: #67c23a;
}

.dot.warning {
  background: #e6a23c;
}

.dot.danger {
  background: #f56c6c;
}
</style>
