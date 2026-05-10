<template>
  <div class="page-container">
    <header class="header">
      <div class="title">
        <el-icon size="26"><Cpu /></el-icon>
        <span>榫卯结构参数化工具</span>
      </div>
      <nav class="nav">
        <div 
          class="nav-item" 
          :class="{ active: currentRoute === '/' }"
          @click="$router.push('/')"
        >
          榫卯设计
        </div>
        <div 
          class="nav-item" 
          :class="{ active: currentRoute === '/favorites' }"
          @click="$router.push('/favorites')"
        >
          我的收藏
        </div>
      </nav>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentRoute = computed(() => route.path)
</script>