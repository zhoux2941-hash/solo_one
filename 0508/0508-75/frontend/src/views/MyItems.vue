<template>
  <div class="page-container">
    <h2 class="page-title">
      <el-icon><Document /></el-icon>
      我的发布
    </h2>

    <el-tabs v-model="activeTab" class="item-tabs">
      <el-tab-pane label="我丢失的物品" name="lost">
        <div v-if="lostLoading" class="loading-container"><el-loading /></div>
        <div v-else-if="myLost.length > 0" class="card-grid">
          <el-card v-for="item in myLost" :key="item.id" class="item-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>
                  <strong>{{ item.itemName }}</strong>
                  <el-tag v-if="item.status === 1" type="success" class="status-tag">已认领</el-tag>
                  <el-tag v-else type="warning" class="status-tag">寻找中</el-tag>
                </span>
              </div>
            </template>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="丢失地点">{{ item.location }}</el-descriptions-item>
              <el-descriptions-item label="丢失时间">{{ formatDateTime(item.lostTime) }}</el-descriptions-item>
              <el-descriptions-item label="描述">{{ item.description || '暂无' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
        <div v-else class="empty-state">
          <el-empty description="暂无丢失物品记录">
            <el-button type="primary" @click="router.push('/publish-lost')">发布丢失物品</el-button>
          </el-empty>
        </div>
      </el-tab-pane>

      <el-tab-pane label="我捡到的物品" name="found">
        <div v-if="foundLoading" class="loading-container"><el-loading /></div>
        <div v-else-if="myFound.length > 0" class="card-grid">
          <el-card v-for="item in myFound" :key="item.id" class="item-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>
                  <strong>{{ item.itemName }}</strong>
                  <el-tag v-if="item.status === 1" type="success" class="status-tag">已认领</el-tag>
                  <el-tag v-else type="primary" class="status-tag">待认领</el-tag>
                </span>
              </div>
            </template>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="捡到地点">{{ item.location }}</el-descriptions-item>
              <el-descriptions-item label="捡到时间">{{ formatDateTime(item.foundTime) }}</el-descriptions-item>
              <el-descriptions-item label="存放地点">{{ item.storageLocation || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="描述">{{ item.description || '暂无' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
        <div v-else class="empty-state">
          <el-empty description="暂无拾物记录">
            <el-button type="primary" @click="router.push('/publish-found')">发布捡到物品</el-button>
          </el-empty>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { lostApi, foundApi } from '@/api'

const router = useRouter()
const activeTab = ref('lost')
const myLost = ref([])
const myFound = ref([])
const lostLoading = ref(false)
const foundLoading = ref(false)

onMounted(() => {
  loadMyLost()
  loadMyFound()
})

async function loadMyLost() {
  lostLoading.value = true
  try {
    const res = await lostApi.my()
    myLost.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    lostLoading.value = false
  }
}

async function loadMyFound() {
  foundLoading.value = true
  try {
    const res = await foundApi.my()
    myFound.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    foundLoading.value = false
  }
}

function formatDateTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.item-tabs {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
}
</style>
