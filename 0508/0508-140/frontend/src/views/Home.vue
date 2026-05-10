<template>
  <div class="home-container">
    <header class="app-header">
      <h1>🏺 陶瓷拉坯模拟器</h1>
      <p class="subtitle">绘制轮廓，生成 3D 器型</p>
    </header>
    
    <main class="main-content">
      <div class="left-panel">
        <ProfileCanvas />
      </div>
      
      <div class="center-panel">
        <ThreeModelViewer />
      </div>
      
      <div class="right-panel">
        <ControlPanel />
      </div>
    </main>
    
    <footer class="app-footer">
      <p>使用鼠标在左侧画布绘制轮廓 | 右侧参数调整模型 | 中间 3D 预览实时更新</p>
    </footer>
  </div>
</template>

<script setup>
import ProfileCanvas from '@/components/ProfileCanvas.vue'
import ThreeModelViewer from '@/components/ThreeModelViewer.vue'
import ControlPanel from '@/components/ControlPanel.vue'
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.app-header {
  padding: 20px 30px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #eee;
  text-align: center;
}

.app-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
  font-weight: bold;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: 0;
}

.left-panel {
  width: 420px;
  flex-shrink: 0;
  min-height: 0;
}

.center-panel {
  flex: 1;
  min-width: 500px;
  min-height: 0;
}

.right-panel {
  width: 320px;
  flex-shrink: 0;
  min-height: 0;
}

.app-footer {
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid #eee;
  text-align: center;
}

.app-footer p {
  margin: 0;
  font-size: 13px;
  color: #999;
}
</style>
