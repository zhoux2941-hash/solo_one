<template>
  <div class="recommendation-card">
    <el-card v-for="rec in recommendations" :key="rec.formulaCode" 
      :class="{ 'recommended': rec.isRecommended }"
      shadow="hover"
    >
      <template #header>
        <div class="card-header">
          <div class="title-section">
            <el-tag :type="getTagType(rec.formulaCode)" size="large">
              配方{{ rec.formulaCode }}
            </el-tag>
            <span class="formula-title">{{ rec.formulaName }}</span>
          </div>
          <el-tag v-if="rec.isRecommended" type="success" effect="dark" class="recommend-tag">
            推荐
          </el-tag>
        </div>
      </template>
      
      <div class="card-content">
        <div class="info-row">
          <span class="label">寿命延长</span>
          <span class="value highlight">+{{ rec.lifespanExtensionDays }} 天</span>
        </div>
        
        <el-divider />
        
        <div class="metrics-section">
          <div class="metric">
            <el-icon class="metric-icon"><Calendar /></el-icon>
            <div class="metric-info">
              <span class="metric-label">保鲜效果</span>
              <div class="stars">
                <el-rate v-model="rec.freshDays" disabled max="5" />
              </div>
            </div>
          </div>
          
          <div class="metric">
            <el-icon class="metric-icon"><Money /></el-icon>
            <div class="metric-info">
              <span class="metric-label">成本</span>
              <div class="stars">
                <el-rate v-model="getReverseScore(rec.cost)" disabled max="5" show-text :texts="['高', '较高', '中', '较低', '低']" />
              </div>
            </div>
          </div>
          
          <div class="metric">
            <el-icon class="metric-icon"><Tools /></el-icon>
            <div class="metric-info">
              <span class="metric-label">易用性</span>
              <div class="stars">
                <el-rate v-model="rec.easeOfUse" disabled max="5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <div v-if="!recommendations || recommendations.length === 0" class="empty-rec">
      <el-empty description="请选择鲜花类型查看推荐配方" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  recommendations: {
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

const getReverseScore = (score) => {
  return 6 - score
}
</script>

<style scoped>
.recommendation-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.formula-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.recommend-tag {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.recommended {
  border: 2px solid #67c23a !important;
}

.card-content {
  padding: 10px 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row .label {
  font-size: 14px;
  color: #606266;
}

.info-row .value {
  font-size: 20px;
  font-weight: bold;
}

.highlight {
  color: #67c23a;
}

.metrics-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.metric {
  display: flex;
  align-items: center;
  gap: 15px;
}

.metric-icon {
  font-size: 24px;
  color: #909399;
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.metric-label {
  font-size: 13px;
  color: #606266;
}

.empty-rec {
  width: 100%;
  padding: 40px 0;
}
</style>
