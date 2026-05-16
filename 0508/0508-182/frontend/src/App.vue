<template>
  <div id="app">
    <nav class="navbar">
      <div class="container">
        <h1 class="logo">🏥 医院管理系统</h1>
        <ul class="nav-links">
          <li><router-link to="/">首页</router-link></li>
          <li><router-link to="/beds">床位管理</router-link></li>
          <li><router-link to="/schedules">护士排班</router-link></li>
        </ul>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style>
.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  display: inline-block;
}

.nav-links {
  display: inline-flex;
  list-style: none;
  margin-left: 2rem;
  gap: 2rem;
}

.nav-links a {
  color: white;
  text-decoration: none;
  font-size: 1rem;
  opacity: 0.9;
  transition: opacity 0.3s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  opacity: 1;
  font-weight: bold;
}

.main-content {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
