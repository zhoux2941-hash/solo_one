<template>
  <div id="app">
    <header class="header">
      <div class="logo">
        <span class="logo-icon">🎭</span>
        <span class="logo-text">戏曲脸谱设计工具</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-link" exact>首页</router-link>
        <router-link to="/design" class="nav-link">设计器</router-link>
        <router-link to="/gallery" class="nav-link">作品广场</router-link>
        <router-link to="/my-designs" class="nav-link">我的设计</router-link>
      </nav>
    </header>
    <main class="main">
      <router-view />
    </main>
    <footer class="footer">
      <p>戏曲脸谱设计工具 - 传承中华传统文化</p>
    </footer>
  </div>
</template>

<script setup>
</script>
