<template>
  <div class="stats-page">
    <el-tabs v-model="activeTab" class="main-tabs">
      <el-tab-pane label="个人统计" name="personal">
        <PersonalStats :user="currentUser" />
      </el-tab-pane>
      <el-tab-pane label="排行榜" name="ranking">
        <RankingStats />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PersonalStats from '../components/PersonalStats.vue'
import RankingStats from '../components/RankingStats.vue'

const activeTab = ref('personal')
const currentUser = ref(null)

onMounted(() => {
  const savedUser = localStorage.getItem('group-order-user')
  if (savedUser) {
    currentUser.value = JSON.parse(savedUser)
  }
})
</script>

<style scoped>
.stats-page {
  padding: 20px 0;
}

.main-tabs {
  background: white;
  padding: 20px;
  border-radius: 8px;
}
</style>
