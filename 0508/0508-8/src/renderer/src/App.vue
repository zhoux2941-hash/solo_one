<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">📁 素材归档</h1>
      </div>
      <nav class="nav-menu">
        <router-link to="/materials" class="nav-item" active-class="active">
          <span class="nav-icon">🗂️</span>
          <span>素材管理</span>
        </router-link>
        <router-link to="/categories" class="nav-item" active-class="active">
          <span class="nav-icon">📁</span>
          <span>分类管理</span>
        </router-link>
        <router-link to="/tags" class="nav-item" active-class="active">
          <span class="nav-icon">🏷️</span>
          <span>标签管理</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <span class="version">v1.0.0</span>
      </div>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-title {
  font-size: 18px;
  font-weight: 600;
}

.nav-menu {
  flex: 1;
  padding: 16px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.active {
  background-color: rgba(59, 130, 246, 0.2);
  color: white;
}

.nav-icon {
  font-size: 18px;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.version {
  font-size: 12px;
  color: #64748b;
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
