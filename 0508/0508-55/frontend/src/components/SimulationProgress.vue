<template>
  <div class="simulation-progress">
    <div v-for="result in results" :key="result.formulaCode" class="progress-item">
      <div class="progress-header">
        <span class="formula-name">
          <el-tag :type="getTagType(result.formulaCode)" size="large">
            配方{{ result.formulaCode }} - {{ result.formulaName }}
          </el-tag>
        </span>
        <span class="percentage">{{ result.witheringPercentage.toFixed(1) }}%</span>
      </div>
      <el-progress
        :percentage="result.witheringPercentage"
        :color="getProgressColor(result.witheringPercentage)"
        :stroke-width="18"
        :text-inside="false"
        :status="getStatus(result.witheringPercentage)"
      />
      <div class="progress-footer">
        <el-tag :type="getStatusType(result.status)" effect="light" size="small">
          {{ result.status }}
        </el-tag>
        <span class="days-info">实验 {{ result.experimentDays }} 天</span>
      </div>
    </div>
    
    <div v-if="!results || results.length === 0" class="empty-result">
      <el-empty description="请选择鲜花类型并开始模拟实验" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  results: {
    type: Array,
    default: () => []
  }
})

const getTagType = (code) => {
  const types = {
    A: 'danger',
    B: 'primary',
    C: 'success',
    D: 'warning'
  }
  return types[code] || 'info'
}

const getProgressColor = (percentage) => {
  if (percentage < 20) return '#67c23a'
  if (percentage < 50) return '#e6a23c'
  if (percentage < 80) return '#f56c6c'
  return '#909399'
}

const getStatus = (percentage) => {
  if (percentage < 50) return null
  if (percentage < 80) return 'exception'
  return null
}

const getStatusType = (status) => {
  const types = {
    '新鲜': 'success',
    '良好': 'warning',
    '逐渐枯萎': 'danger',
    '枯萎严重': 'info'
  }
  return types[status] || 'info'
}
</script>

<style scoped>
.simulation-progress {
  width: 100%;
}

.progress-item {
  margin-bottom: 30px;
  padding: 20px;
  background: #fafafa;
  border-radius: 12px;
}

.progress-item:last-child {
  margin-bottom: 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.formula-name {
  font-size: 16px;
  font-weight: 600;
}

.percentage {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.progress-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.days-info {
  font-size: 13px;
  color: #909399;
}

.empty-result {
  padding: 40px 0;
}
</style>
