<template>
  <div class="app-container">
    <header class="dashboard-header">
      <h1>快递柜格口疲劳度分布看板</h1>
      <p class="subtitle">实时监控格口磨损状态</p>
    </header>
    
    <CabinetGrid />
    
    <footer class="dashboard-footer">
      <div class="legend">
        <h3>疲劳度说明</h3>
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-color" style="background: #4CAF50;"></span>
            <span>低 (0-30)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background: #FF9800;"></span>
            <span>中 (31-70)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background: #f44336;"></span>
            <span>高 (71-100)</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import CabinetGrid from './components/CabinetGrid.vue'
</script>

<style scoped>
.app-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dashboard-header {
  text-align: center;
  margin-bottom: 40px;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
}

.dashboard-footer {
  margin-top: 40px;
}

.legend {
  text-align: center;
}

.legend h3 {
  color: #333;
  margin-bottom: 15px;
}

.legend-items {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-color {
  width: 25px;
  height: 25px;
  border-radius: 4px;
  display: inline-block;
}
</style>
