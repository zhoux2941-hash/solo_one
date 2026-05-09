<template>
  <div class="bench-list">
    <div v-for="bench in benches" :key="bench.benchId" class="bench-card">
      <div class="bench-header">
        <span class="bench-name">{{ bench.benchName }}</span>
        <span class="bench-orientation">{{ bench.orientation }}</span>
      </div>
      <div class="bench-stats">
        <div class="stat-item sun">
          <span class="stat-icon">☀️</span>
          <div>
            <div class="stat-value">{{ bench.sunDurationMinutes }}</div>
            <div class="stat-label">阳光时长(分钟)</div>
          </div>
        </div>
        <div class="stat-item shadow">
          <span class="stat-icon">🌑</span>
          <div>
            <div class="stat-value">{{ bench.shadowPercentage }}%</div>
            <div class="stat-label">阴影占比</div>
          </div>
        </div>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: (100 - bench.shadowPercentage) + '%' }"
        ></div>
      </div>
      <div class="progress-labels">
        <span>阳光 {{ (100 - bench.shadowPercentage).toFixed(1) }}%</span>
        <span>阴影 {{ bench.shadowPercentage }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  benches: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.bench-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bench-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  border-radius: 12px;
  padding: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.bench-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.bench-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.bench-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.bench-orientation {
  font-size: 12px;
  color: #666;
  background: #e0e0e0;
  padding: 4px 12px;
  border-radius: 12px;
}

.bench-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 28px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-item.sun .stat-value {
  color: #FF6B6B;
}

.stat-item.shadow .stat-value {
  color: #4ECDC4;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B6B 0%, #FFB347 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}
</style>
