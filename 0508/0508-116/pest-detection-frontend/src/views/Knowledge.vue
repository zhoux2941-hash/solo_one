<template>
  <div class="knowledge-container">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button @click="$router.push('/home')">
            <el-icon><ArrowLeft /></el-icon> 返回首页
          </el-button>
          <span class="title" style="margin-left: 10px">病虫害知识库</span>
        </div>
      </el-header>

      <el-main class="main-content">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card>
              <template #header>
                <div class="card-header">
                  <el-icon><Filter /></el-icon>
                  <span>筛选</span>
                </div>
              </template>
              <div class="filter-section">
                <h4>作物类型</h4>
                <el-radio-group v-model="filterCropType" @change="loadKnowledge">
                  <el-radio value="">全部</el-radio>
                  <el-radio value="水稻">水稻</el-radio>
                  <el-radio value="玉米">玉米</el-radio>
                  <el-radio value="小麦">小麦</el-radio>
                  <el-radio value="棉花">棉花</el-radio>
                  <el-radio value="大豆">大豆</el-radio>
                  <el-radio value="其他">其他</el-radio>
                </el-radio-group>
              </div>
              <el-divider />
              <div class="filter-section">
                <h4>搜索</h4>
                <el-input
                  v-model="searchKeyword"
                  placeholder="输入关键词搜索"
                  clearable
                  @input="handleSearch"
                >
                  <template #suffix>
                    <el-icon class="el-input__icon" @click="loadKnowledge"><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </el-card>
          </el-col>

          <el-col :span="18">
            <el-card>
              <template #header>
                <div class="card-header">
                  <el-icon><Reading /></el-icon>
                  <span>知识库列表</span>
                  <el-tag type="info" size="small">{{ knowledgeList.length }} 条</el-tag>
                </div>
              </template>

              <el-empty v-if="!loading && knowledgeList.length === 0" description="暂无知识库" />

              <el-row :gutter="20" v-else>
                <el-col :span="12" v-for="item in knowledgeList" :key="item.id" style="margin-bottom: 20px">
                  <el-card class="knowledge-card" shadow="hover" @click="viewKnowledge(item)">
                    <div class="card-top">
                      <el-tag size="small">{{ item.cropType }}</el-tag>
                      <el-tag v-if="item.pestName" type="warning" size="small">
                        {{ item.pestName }}
                      </el-tag>
                    </div>
                    <h3 class="card-title">{{ item.title }}</h3>
                    <p class="card-desc">
                      {{ item.content.substring(0, 120) }}{{ item.content.length > 120 ? '...' : '' }}
                    </p>
                    <div class="card-footer">
                      <span><el-icon><User /></el-icon> {{ item.expertName }}</span>
                      <span><el-icon><View /></el-icon> {{ item.viewCount }}</span>
                      <span style="color: #909399; font-size: 12px">
                        {{ formatTime(item.updateTime) }}
                      </span>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>

    <el-dialog v-model="detailVisible" title="知识库详情" width="700px">
      <div v-if="currentKnowledge" class="knowledge-detail">
        <div class="detail-header">
          <h2>{{ currentKnowledge.title }}</h2>
          <div class="detail-meta">
            <el-tag size="small">{{ currentKnowledge.cropType }}</el-tag>
            <el-tag v-if="currentKnowledge.pestName" type="warning" size="small">
              {{ currentKnowledge.pestName }}
            </el-tag>
            <span style="color: #909399; font-size: 12px; margin-left: 8px">
              专家：{{ currentKnowledge.expertName }}
            </span>
          </div>
        </div>
        <el-divider />
        <div class="detail-content">{{ currentKnowledge.content }}</div>
        <div class="detail-footer">
          <span style="color: #909399; font-size: 12px">
            浏览量：{{ currentKnowledge.viewCount }} | 创建时间：{{ formatTime(currentKnowledge.createTime) }}
            | 更新时间：{{ formatTime(currentKnowledge.updateTime) }}
          </span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { searchKnowledge, getKnowledgeById } from '@/api/knowledge'

let searchTimer = null

const filterCropType = ref('')
const searchKeyword = ref('')
const knowledgeList = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const currentKnowledge = ref(null)

const loadKnowledge = async () => {
  loading.value = true
  try {
    const res = await searchKnowledge(searchKeyword.value, filterCropType.value)
    knowledgeList.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(loadKnowledge, 300)
}

const viewKnowledge = async (item) => {
  const res = await getKnowledgeById(item.id)
  currentKnowledge.value = res.data
  detailVisible.value = true
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadKnowledge()
})
</script>

<style scoped>
.knowledge-container {
  min-height: 100vh;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.main-content {
  padding: 20px 40px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.card-header .el-tag {
  margin-left: auto;
}

.filter-section h4 {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
}

.filter-section :deep(.el-radio) {
  display: block;
  margin-bottom: 8px;
  line-height: 2;
}

.knowledge-card {
  height: 200px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.knowledge-card:hover {
  transform: translateY(-4px);
}

.card-top {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.card-title {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  flex: 1;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #909399;
  font-size: 12px;
}

.card-footer :deep(.el-icon) {
  margin-right: 4px;
}

.knowledge-detail .detail-header h2 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 22px;
}

.knowledge-detail .detail-meta {
  display: flex;
  align-items: center;
}

.knowledge-detail .detail-content {
  color: #606266;
  line-height: 2;
  font-size: 14px;
  white-space: pre-wrap;
}

.knowledge-detail .detail-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>