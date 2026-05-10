<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1 class="logo" @click="$router.push('/')">✨ 流星雨观测记录</h1>
        <nav class="nav">
          <router-link to="/" class="nav-link" exact-active-class="active">首页</router-link>
          <router-link to="/observation" class="nav-link" active-class="active">开始观测</router-link>
          <router-link to="/consensus" class="nav-link" active-class="active">辐射点统计</router-link>
        </nav>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style>
.header {
  background: linear-gradient(135deg, #1a1a3e 0%, #0d0d24 100%);
  padding: 1rem 2rem;
  border-bottom: 1px solid #2a2a5a;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(90deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: pointer;
  margin: 0;
}

.nav {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: #a0aec0;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #a78bfa;
}

.nav-link.active {
  color: #a78bfa;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  background: rgba(30, 30, 60, 0.8);
  border: 1px solid #3a3a6a;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #2d3748;
  color: white;
}

.btn-secondary:hover {
  background: #4a5568;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #ef4444;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #e2e8f0;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #1a1a2e;
  border: 1px solid #3a3a6a;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
}

.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-success {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.badge-warning {
  background: rgba(234, 179, 8, 0.2);
  color: #facc15;
}

.badge-info {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.badge-danger {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}
</style>
