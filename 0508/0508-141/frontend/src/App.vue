<template>
  <div id="app">
    <nav>
      <router-link to="/">徽位计算</router-link>
      <router-link to="/tuner">音高检测</router-link>
      <router-link to="/records">音准记录</router-link>
      <router-link to="/compare">琴音对比</router-link>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

nav {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 2rem;
  display: flex;
  gap: 2rem;
}

nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

nav a:hover, nav a.router-link-active {
  background: rgba(255, 255, 255, 0.2);
}

main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
