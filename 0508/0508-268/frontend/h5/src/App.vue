<template>
  <div class="app">
    <router-view />
    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item name="home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item name="parking" icon="location-o">附近车位</van-tabbar-item>
      <van-tabbar-item name="my" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('home')
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

.app {
  min-height: 100vh;
  padding-bottom: 50px;
}
</style>
