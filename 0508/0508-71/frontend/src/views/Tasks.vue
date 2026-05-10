<template>
  <div class="page-container">
    <el-row :gutter="20" v-if="hotTasks.length > 0">
      <el-col :span="24">
        <el-card class="hot-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Fire /></el-icon> 热门任务</span>
            </div>
          </template>
          <div class="hot-tasks">
            <div
              v-for="task in hotTasks"
              :key="task.id"
              class="hot-task-item"
              @click="goToDetail(task.id)"
            >
              <el-icon class="fire-icon"><Fire /></el-icon>
              <span class="hot-title">{{ task.title }}</span>
              <el-tag type="warning" size="small">{{ task.auditionCount }}人试音</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><List /></el-icon> 任务大厅</span>
              <div class="search-bar">
                <el-input
                  v-model="keyword"
                  placeholder="搜索任务标题"
                  style="width: 300px"
                  clearable
                  @keyup.enter="searchTasks"
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
                <el-button type="primary" @click="searchTasks">
                  <el-icon><Search /></el-icon> 搜索
                </el-button>
              </div>
            </div>
          </template>

          <div class="filter-section" v-if="allTags.length > 0">
            <div class="filter-label">
              <el-icon><PriceTag /></el-icon>
              声线筛选：
            </div>
            <div class="filter-tags">
              <el-tag
                v-if="selectedTags.length > 0"
                class="clear-tag"
                closable
                @close="clearAllTags"
              >
                清除筛选
              </el-tag>
              <el-tag
                v-for="tag in allTags"
                :key="tag.id"
                :type="selectedTags.includes(tag.id) ? 'primary' : 'info'"
                class="filter-tag"
                effect="plain"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
              </el-tag>
            </div>
          </div>
          
          <el-empty v-if="tasks.length === 0 && !loading" description="暂无任务" />
          
          <el-row :gutter="20" v-else>
            <el-col :span="12" v-for="task in tasks" :key="task.id">
              <el-card class="task-card" @click="goToDetail(task.id)">
                <div class="task-header">
                  <h3 class="task-title">{{ task.title }}</h3>
                  <el-tag :type="task.status === 1 ? 'success' : 'info'" size="small">
                    {{ task.status === 1 ? '招募中' : '已结束' }}
                  </el-tag>
                </div>
                
                <div class="task-tags" v-if="task.tags && task.tags.length > 0">
                  <el-tag
                    v-for="tag in task.tags"
                    :key="tag.id"
                    type="warning"
                    size="small"
                    effect="light"
                  >
                    {{ tag.name }}
                  </el-tag>
                </div>
                
                <p class="task-content">{{ task.content }}</p>
                <div class="task-meta">
                  <span class="meta-item">
                    <el-icon><Clock /></el-icon> {{ task.duration }}
                  </span>
                  <span class="meta-item">
                    <el-icon><User /></el-icon> {{ task.publisherName }}
                  </span>
                  <span class="meta-item">
                    <el-icon><User /></el-icon> {{ task.auditionCount }}人试音
                  </span>
                </div>
                <div class="task-footer">
                  <span class="budget">
                    <el-icon><Coin /></el-icon> {{ task.budget }} 积分
                  </span>
                </div>
              </el-card>
            </el-col>
          </el-row>
          
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
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTaskList, getHotTasks } from '@/api/task'
import { getAllTags } from '@/api/tag'

const router = useRouter()

const tasks = ref([])
const hotTasks = ref([])
const allTags = ref([])
const selectedTags = ref([])
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

async function fetchAllTags() {
  try {
    const res = await getAllTags()
    allTags.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function fetchTasks() {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined
    }
    
    if (selectedTags.value.length > 0) {
      params.tagIds = selectedTags.value
    }
    
    const res = await getTaskList(params)
    tasks.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function fetchHotTasks() {
  try {
    const res = await getHotTasks()
    hotTasks.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function toggleTag(tagId) {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
  pageNum.value = 1
  fetchTasks()
}

function clearAllTags() {
  selectedTags.value = []
  pageNum.value = 1
  fetchTasks()
}

function searchTasks() {
  pageNum.value = 1
  fetchTasks()
}

function goToDetail(taskId) {
  router.push(`/task/${taskId}`)
}

onMounted(() => {
  fetchAllTags()
  fetchTasks()
  fetchHotTasks()
})
</script>

<style scoped>
.hot-card :deep(.el-card__header) {
  background: linear-gradient(90deg, #ff6b6b, #feca57);
  color: white;
}

.hot-tasks {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.hot-task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: #fff5eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.hot-task-item:hover {
  background: #ffe6cc;
  transform: translateY(-2px);
}

.fire-icon {
  color: #ff6b6b;
  font-size: 18px;
}

.hot-title {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-section {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
  font-size: 14px;
  margin-bottom: 10px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.clear-tag {
  background: #f56c6c !important;
  border-color: #f56c6c !important;
  color: white !important;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-title {
  font-size: 18px;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 10px;
}

.task-tags {
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.task-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  gap: 20px;
  margin: 10px 0;
  color: #909399;
  font-size: 13px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-footer {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
  margin-top: 15px;
}

.budget {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
