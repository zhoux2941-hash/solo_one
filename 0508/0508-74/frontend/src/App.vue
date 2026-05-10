<template>
  <div class="app">
    <header class="header">
      <h1>🌿 办公室绿植浇水提醒系统</h1>
      <nav class="nav">
        <router-link to="/">绿植列表</router-link>
        <router-link to="/overdue">逾期提醒</router-link>
        <router-link to="/ranking">🏆 排行榜</router-link>
      </nav>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app {
  min-height: 100vh;
}

.header {
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  color: #333;
  font-size: 1.5rem;
}

.nav {
  display: flex;
  gap: 1rem;
}

.nav a {
  color: #667eea;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.3s;
}

.nav a:hover {
  background: rgba(102, 126, 234, 0.1);
}

.nav a.router-link-exact-active {
  background: #667eea;
  color: white;
}

.main {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
