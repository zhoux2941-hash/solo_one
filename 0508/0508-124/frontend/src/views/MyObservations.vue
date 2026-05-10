<template>
  <div class="my-observations-page">
    <el-header class="header">
      <div class="title">我的观测记录</div>
      <el-button @click="router.back()">返回地图</el-button>
    </el-header>
    
    <div class="content">
      <el-table :data="observations" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="位置" width="260">
          <template #default="{ row }">
            <div>
              <div v-if="row.locationName" style="font-weight: bold">{{ row.locationName }}</div>
              <div style="color: #666; font-size: 12px">
                {{ row.latitude?.toFixed?.(6) || row.latitude }}, 
                {{ row.longitude?.toFixed?.(6) || row.longitude }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="目视极限星等" width="160">
          <template #default="{ row }">
            <el-tag :color="magnitudeColor(row.magnitude)" effect="dark" size="large">
              {{ row.magnitude }}等
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weather" label="天气" width="100" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && observations.length === 0" description="暂无观测记录">
        <el-button type="primary" @click="router.push('/')">去提交第一条记录</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { observationApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const observations = ref([])

const magnitudeColors = {
  1: '#ff0000',
  2: '#ff4400',
  3: '#ff8800',
  4: '#88cc00',
  5: '#0088cc',
  6: '#0000ff'
}

const magnitudeColor = (m) => magnitudeColors[m] || '#999'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString()
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await observationApi.getMy()
    observations.value = res.data.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.my-observations-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.header {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.content {
  flex: 1;
  padding: 24px;
  background: white;
  margin: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: auto;
}
</style>
