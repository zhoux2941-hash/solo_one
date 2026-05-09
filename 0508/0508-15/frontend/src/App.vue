<template>
  <div class="app-container">
    <header class="header">
      <h1>🛵 外卖骑手调度看板</h1>
      <nav>
        <router-link to="/" class="nav-link" active-class="active">实时调度</router-link>
        <router-link to="/analytics" class="nav-link" active-class="active">数据分析</router-link>
      </nav>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>
