<template>
  <div class="app-container">
    <header class="app-header">
      <h1>🏭 农场谷物筒仓温度监控系统</h1>
      <p class="subtitle">实时温度分层热力图监控 + 高温报警系统</p>
    </header>

    <main class="main-content">
      <div class="content-wrapper">
        <TemperatureHeatmap />
        
        <div class="section-divider">
          <span class="divider-line"></span>
          <span class="divider-text">历史报警记录</span>
          <span class="divider-line"></span>
        </div>
        
        <AlarmHistory />
      </div>
    </main>

    <footer class="app-footer">
      <p>数据每30秒自动更新 | Redis缓存 | MySQL存储报警历史</p>
    </footer>
  </div>
</template>

<script setup>
import TemperatureHeatmap from './components/TemperatureHeatmap.vue'
import AlarmHistory from './components/AlarmHistory.vue'
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  text-align: center;
  padding: 2rem;
  color: white;
}

.app-header h1 {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
}

.content-wrapper {
  width: 100%;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.divider-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
}

.divider-text {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  opacity: 0.9;
}

.app-footer {
  text-align: center;
  padding: 1.5rem;
  color: white;
  opacity: 0.8;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .content-wrapper {
    gap: 1.5rem;
  }
}
</style>
