<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <h1>🏋️ 健身房器材消毒记录系统</h1>
        <nav class="nav">
          <router-link to="/" class="nav-link" active-class="active">今日巡检</router-link>
          <router-link to="/heatmap" class="nav-link" active-class="active">热力图</router-link>
        </nav>
      </div>
    </header>
    <main class="main">
      <div class="container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
</script>
