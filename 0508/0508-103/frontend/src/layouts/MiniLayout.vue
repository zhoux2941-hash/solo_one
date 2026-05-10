<template>
  <div class="mini-container">
    <div class="mini-content">
      <router-view />
    </div>
    <div class="mini-tabbar">
      <router-link to="/mini/home" class="tab-item" active-class="active">
        <el-icon><User /></el-icon>
        <span>我的</span>
      </router-link>
      <router-link to="/mini/exchange" class="tab-item" active-class="active">
        <el-icon><ShoppingBag /></el-icon>
        <span>兑换商品</span>
      </router-link>
      <router-link to="/mini/records" class="tab-item" active-class="active">
        <el-icon><Document /></el-icon>
        <span>兑换记录</span>
      </router-link>
      <router-link to="/mini/ranking" class="tab-item" active-class="active">
        <el-icon><Trophy /></el-icon>
        <span>排行榜</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.mini-container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f5f5f5;
  position: relative;
}

.mini-content {
  padding-bottom: 70px;
  min-height: 100vh;
}

.mini-tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 60px;
  background-color: #fff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #eee;
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #999;
  font-size: 12px;
  flex: 1;
}

.tab-item .el-icon {
  font-size: 22px;
  margin-bottom: 4px;
}

.tab-item.active {
  color: #409EFF;
}
</style>
