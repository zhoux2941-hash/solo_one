<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Found /></el-icon>
        拾物招领
      </h2>
      <el-button type="success" @click="router.push('/map')">
        <el-icon><MapLocation /></el-icon>
        查看地图
      </el-button>
    </div>

    <div class="search-box">
      <el-input
        v-model="keyword"
        placeholder="搜索物品名称、地点、描述..."
        clearable
        style="width: 400px"
        @keyup.enter="loadData"
        @clear="loadData"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="loadData" style="margin-left: 12px">
        搜索
      </el-button>
      <el-select v-model="statusFilter" style="margin-left: 12px" @change="loadData" clearable placeholder="状态">
        <el-option :value="0" label="待认领" />
        <el-option :value="1" label="已认领" />
      </el-select>
    </div>

    <div v-if="loading" class="loading-container">
      <el-loading />
    </div>

    <div v-else-if="items.length > 0" class="card-grid">
      <el-card v-for="item in items" :key="item.id" class="item-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">
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
      <el-empty description="暂无拾物记录" />
    </div>

    <el-pagination
      v-if="total > 0"
      style="margin-top: 24px; text-align: center"
      background
      :current-page="page"
      :page-size="size"
      :total="total"
      layout="prev, pager, next"
      @current-change="onPageChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { foundApi } from '@/api'

const router = useRouter()

const keyword = ref('')
const statusFilter = ref('')
const items = ref([])
const loading = ref(false)
const page = ref(1)
const size = ref(9)
const total = ref(0)

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: size.value
    }
    if (keyword.value) params.keyword = keyword.value
    if (statusFilter.value !== '' && statusFilter.value !== null) params.status = statusFilter.value
    const res = await foundApi.page(params)
    items.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function onPageChange(p) {
  page.value = p
  loadData()
}

function formatDateTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-header .page-title {
  margin-bottom: 0;
}
</style>
