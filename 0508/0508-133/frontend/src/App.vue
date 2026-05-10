<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <el-icon class="logo-icon"><Satellite /></el-icon>
        <h1>ISS Tracker</h1>
      </div>
      <nav class="nav-menu">
        <router-link to="/" active-class="active">ISS过境</router-link>
        <router-link to="/iridium" active-class="active">Iridium闪光</router-link>
        <router-link to="/heatmap" active-class="active">观测热力图</router-link>
      </nav>
    </header>
    <main class="app-main">
      <router-view />
    </main>
    <footer class="app-footer">
      <p>国际空间站过境预报系统 © 2024</p>
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import L from 'leaflet'

onMounted(() => {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
  })
})
</script>

<style lang="scss">
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
