<template>
  <el-container>
    <el-header>
      <span>🚚 物流追踪系统</span>
      <el-badge
        v-if="anomalyCount > 0"
        :value="anomalyCount"
        type="danger"
        class="header-badge"
        @click="goToAnomaly"
        style="cursor: pointer;"
      >
        <el-tag type="danger" effect="dark" size="small" style="margin-left: 20px;">
          <el-icon><Warning /></el-icon>
          异常
        </el-tag>
      </el-badge>
    </el-header>
    <el-container>
      <el-aside width="200px">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <el-menu-item index="/packages">
            <el-icon><Document /></el-icon>
            <span>包裹列表</span>
          </el-menu-item>
          <el-menu-item index="/anomaly">
            <el-icon><Warning /></el-icon>
            <span>异常监控</span>
            <el-badge
              v-if="anomalyCount > 0"
              :value="anomalyCount"
              type="danger"
              class="menu-badge"
            />
          </el-menu-item>
          <el-menu-item index="/aggregation">
            <el-icon><Connection /></el-icon>
            <span>聚合地图</span>
          </el-menu-item>
          <el-menu-item index="/batch-tracks">
            <el-icon><Grid /></el-icon>
            <span>批量轨迹</span>
          </el-menu-item>
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>时效看板</span>
          </el-menu-item>
          <el-menu-item index="/heatmap">
            <el-icon><Location /></el-icon>
            <span>滞留热力图</span>
          </el-menu-item>
          <el-menu-item index="/sankey">
            <el-icon><TrendCharts /></el-icon>
            <span>桑基图</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { Document, Warning, Connection, Grid, DataAnalysis, Location, TrendCharts } from '@element-plus/icons-vue'
import { anomalyApi } from './api'

const route = useRoute()
const router = useRouter()
const activeMenu = computed(() => route.path)
const anomalyCount = ref(0)
let checkInterval = null

const checkAnomalies = async () => {
  try {
    const oldCount = anomalyCount.value
    const count = await anomalyApi.getAnomalyCount()
    anomalyCount.value = count
    
    if (count > oldCount && oldCount > 0) {
      ElNotification({
        title: '⚠️ 新异常检测',
        message: `检测到新增异常包裹，当前共 ${count} 个`,
        type: 'warning',
        duration: 5000
      })
    }
  } catch (e) {
    console.error('检查异常数量失败:', e)
  }
}

const goToAnomaly = () => {
  router.push('/anomaly')
}

onMounted(() => {
  checkAnomalies()
  checkInterval = setInterval(checkAnomalies, 60000)
})

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
})
</script>

<style scoped>
.el-header {
  display: flex;
  align-items: center;
  position: relative;
}

.header-badge {
  margin-left: auto;
}

.menu-badge {
  margin-left: 10px;
}

:deep(.el-badge__content.is-fixed) {
  top: 8px;
  right: 8px;
}
</style>
