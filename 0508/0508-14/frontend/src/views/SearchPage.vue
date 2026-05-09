<template>
  <div class="main-container">
    <div class="card">
      <div class="card-title">文档搜索</div>
      <div class="search-section">
        <el-select
          v-model="selectedSuggestion"
          filterable
          remote
          reserve-keyword
          placeholder="请输入搜索关键词，支持分词和模糊匹配"
          :remote-method="remoteSearch"
          :loading="loadingSuggestions"
          :options="suggestionOptions"
          filter-placeholder="输入关键词..."
          size="large"
          style="flex: 1"
          @keyup.enter="handleSearch"
          @change="handleSuggestionSelect"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #default>
            <el-option
              v-for="item in suggestionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
              <div class="suggestion-item">
                <span>{{ item.label }}</span>
                <span v-if="item.type === 'related'" class="tag tag-related">相关</span>
                <span v-if="item.type === 'prefix'" class="tag tag-prefix">匹配</span>
                <span v-if="item.type === 'hot'" class="tag tag-hot">热门</span>
              </div>
            </el-option>
          </template>
        </el-select>
        <el-button type="primary" size="large" @click="handleSearch" :loading="searching">
          搜索
        </el-button>
      </div>

      <div v-if="hotSearches.length > 0" class="hot-searches">
        <span class="hot-label">热门搜索：</span>
        <div class="hot-search-list">
          <span
            v-for="item in hotSearches"
            :key="item.keyword"
            class="hot-tag"
            @click="searchHotKeyword(item.keyword)"
          >
            {{ item.keyword }}
            <span class="count">{{ item.count }}</span>
          </span>
        </div>
      </div>
    </div>

    <div v-if="currentSearch" class="card">
      <div class="card-title">
        搜索结果
        <span class="result-count">
          共找到 {{ currentSearch.resultCount }} 条文档
          <span v-if="currentSearch.matchedKeywords.length > 0">
            (分词: {{ currentSearch.matchedKeywords.join(', ') }})
          </span>
        </span>
      </div>
      <ul v-if="currentSearch.documents.length > 0" class="doc-list">
        <li
          v-for="doc in currentSearch.documents"
          :key="doc.docId"
          class="doc-item"
          @click="handleClickDoc(doc)"
        >
          <div class="doc-title">{{ doc.title }}</div>
          <div class="doc-meta">
            <span class="doc-category">{{ doc.category || '未分类' }}</span>
            <span>点击次数: {{ doc.clickCount }}</span>
          </div>
        </li>
      </ul>
      <div v-else class="empty-state">
        <el-icon><Document /></el-icon>
        <p>未找到匹配的文档</p>
      </div>
    </div>

    <div v-else class="card">
      <div class="card-title">热门文档排行</div>
      <ul v-if="topDocs.length > 0" class="doc-list">
        <li
          v-for="(doc, index) in topDocs"
          :key="doc.docId"
          class="doc-item"
        >
          <div class="doc-title">
            <span class="rank-badge" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
            {{ doc.title }}
          </div>
          <div class="doc-meta">
            <span>点击次数: {{ doc.clickCount }}</span>
          </div>
        </li>
      </ul>
      <div v-else class="empty-state">
        <el-icon><DataLine /></el-icon>
        <p>暂无搜索数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Document, DataLine } from '@element-plus/icons-vue'
import { searchApi, analyticsApi } from '../utils/api'

const keyword = ref('')
const selectedSuggestion = ref('')
const searching = ref(false)
const loadingSuggestions = ref(false)
const currentSearch = ref(null)
const hotSearches = ref([])
const topDocs = ref([])
const suggestionOptions = ref([])

let debounceTimer = null

const loadHotSearches = async () => {
  try {
    const response = await searchApi.getHotSearches(10)
    hotSearches.value = response.data
  } catch (error) {
    console.error('获取热门搜索失败', error)
  }
}

const loadTopDocs = async () => {
  try {
    const response = await analyticsApi.getDocRanking(10)
    topDocs.value = response.data.ranking || []
  } catch (error) {
    console.error('获取热门文档失败', error)
  }
}

const remoteSearch = (query) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  if (!query || query.trim() === '') {
    suggestionOptions.value = []
    return
  }

  debounceTimer = setTimeout(async () => {
    loadingSuggestions.value = true
    try {
      const response = await searchApi.getSuggestions(query.trim(), 8)
      const suggestions = response.data.suggestions || []
      
      suggestionOptions.value = suggestions.map(item => ({
        value: item.keyword,
        label: item.keyword,
        type: item.type,
        score: item.score,
        hot: item.hot
      }))
    } catch (error) {
      console.error('获取搜索建议失败', error)
      suggestionOptions.value = []
    } finally {
      loadingSuggestions.value = false
    }
  }, 300)
}

const handleSuggestionSelect = (value) => {
  if (value) {
    keyword.value = value
    handleSearch()
  }
}

const handleSearch = async () => {
  const searchKeyword = keyword.value.trim() || selectedSuggestion.value
  if (!searchKeyword) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  keyword.value = searchKeyword
  selectedSuggestion.value = searchKeyword
  searching.value = true
  suggestionOptions.value = []

  try {
    const response = await searchApi.search(searchKeyword, 'user-001')
    currentSearch.value = response.data
    ElMessage.success(`搜索完成，找到 ${response.data.resultCount} 条结果`)
    loadHotSearches()
  } catch (error) {
    console.error('搜索失败', error)
    ElMessage.error('搜索失败，请稍后重试')
  } finally {
    searching.value = false
  }
}

const searchHotKeyword = (kw) => {
  keyword.value = kw
  selectedSuggestion.value = kw
  handleSearch()
}

const handleClickDoc = async (doc) => {
  if (currentSearch.value && currentSearch.value.searchId) {
    try {
      await searchApi.recordClick(currentSearch.value.searchId, doc.docId, currentSearch.value.keyword)
      ElMessage.success('已记录点击')
      loadTopDocs()
    } catch (error) {
      console.error('记录点击失败', error)
    }
  }
}

onMounted(() => {
  loadHotSearches()
  loadTopDocs()
})
</script>

<style scoped>
.result-count {
  font-size: 13px;
  color: #909399;
  font-weight: normal;
  margin-left: 12px;
}

.hot-searches {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.hot-label {
  font-size: 14px;
  color: #909399;
  flex-shrink: 0;
  margin-top: 6px;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  margin-right: 12px;
  color: white;
}

.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
}

.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
}

.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
}

.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #909399;
}

.search-section :deep(.el-select) {
  display: flex;
  flex: 1;
}

.search-section :deep(.el-input__wrapper) {
  padding-left: 15px;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.suggestion-item .tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.tag-related {
  background: #f0f9ff;
  color: #0369a1;
}

.tag-prefix {
  background: #ecfdf5;
  color: #059669;
}

.tag-hot {
  background: #fef2f2;
  color: #dc2626;
}

.search-section :deep(.el-select-dropdown__item) {
  height: auto;
  padding: 10px 15px;
}

.search-section :deep(.el-select-dropdown__item:hover) {
  background-color: #f5f7fa;
}
</style>
