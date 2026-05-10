<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><Document /></el-icon> 我发布的任务</span>
        </div>
      </template>
      
      <el-empty v-if="tasks.length === 0 && !loading" description="您还没有发布任何任务" />
      
      <el-table
        v-else
        :data="tasks"
        style="width: 100%"
        :loading="loading"
      >
        <el-table-column prop="id" label="任务ID" width="80" />
        <el-table-column prop="title" label="任务标题" min-width="200">
          <template #default="{ row }">
            <span class="task-title" @click="goToDetail(row.id)">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="budget" label="预算" width="120">
          <template #default="{ row }">
            <span class="budget">{{ row.budget }} 积分</span>
          </template>
        </el-table-column>
        <el-table-column prop="auditionCount" label="试音人数" width="100" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '招募中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToDetail(row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchTasks"
          @current-change="fetchTasks"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyPublishedTasks } from '@/api/task'

const router = useRouter()

const tasks = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

async function fetchTasks() {
  loading.value = true
  try {
    const res = await getMyPublishedTasks({
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    tasks.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function goToDetail(taskId) {
  router.push(`/task/${taskId}`)
}

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.task-title {
  color: #409eff;
  cursor: pointer;
}

.task-title:hover {
  text-decoration: underline;
}

.budget {
  color: #f56c6c;
  font-weight: bold;
}
</style>
