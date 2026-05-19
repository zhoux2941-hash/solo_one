<template>
  <div class="app">
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>RSS阅读器</h1>
        <button class="btn btn-primary add-btn" @click="showAddFeed = true">
          + 添加订阅
        </button>
      </div>
      
      <div class="sidebar-nav">
        <div 
          class="nav-item" 
          :class="{ active: currentView === 'all' && !currentCategory }"
          @click="currentView = 'all'; currentCategory = null; currentFeed = null; loadArticles()"
        >
          <span>📋 全部文章</span>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: currentView === 'recommendations' }"
          @click="currentView = 'recommendations'; loadRecommendations()"
        >
          <span>🎯 为你推荐</span>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: currentView === 'unread' }"
          @click="currentView = 'unread'; currentCategory = null; currentFeed = null; loadArticles()"
        >
          <span>📄 未读</span>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: currentView === 'starred' }"
          @click="currentView = 'starred'; currentCategory = null; currentFeed = null; loadArticles()"
        >
          <span>⭐ 收藏</span>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-title">分类</div>
        <div 
          v-for="category in categories" 
          :key="category"
          class="nav-item"
          :class="{ active: currentCategory === category }"
          @click="currentCategory = category; currentView = 'all'; currentFeed = null; loadArticles()"
        >
          <span>{{ category }}</span>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-title">订阅源</div>
        <div 
          v-for="feed in feeds" 
          :key="feed.id"
          class="nav-item feed-item"
          :class="{ active: currentFeed === feed.id }"
          @click="currentFeed = feed.id; currentCategory = null; currentView = 'all'; loadArticles()"
        >
          <span class="feed-title">{{ feed.title }}</span>
          <button class="delete-btn" @click.stop="deleteFeed(feed.id)">×</button>
        </div>
      </div>
    </div>

    <div class="article-list">
      <div class="list-header">
        <div class="header-actions">
          <button class="btn" @click="refreshAll">
            🔄 刷新全部
          </button>
          <button class="btn" @click="trainModel" :disabled="isTraining">
            {{ isTraining ? '训练中...' : '🧠 训练模型' }}
          </button>
        </div>
        <div v-if="currentView === 'recommendations'" class="header-title">
          🎯 为你推荐 - 基于你的阅读习惯
        </div>
      </div>
      <div class="article-items">
        <div 
          v-for="article in displayArticles" 
          :key="article.id"
          class="article-item"
          :class="{ 'is-read': article.is_read, 'is-starred': article.is_starred }"
          @click="selectArticle(article)"
        >
          <div class="article-item-header">
            <span class="article-feed">{{ article.feed_title }}</span>
            <span class="article-star" @click.stop="toggleStar(article)">
              {{ article.is_starred ? '⭐' : '☆' }}
            </span>
          </div>
          <h3 class="article-title">{{ article.title }}</h3>
          <p class="article-summary">{{ article.summary }}</p>
          <div class="article-meta">
            <span>{{ formatDate(article.published_at) }}</span>
            <span v-if="article.score !== undefined" class="article-score">
              匹配度 {{ Math.round(article.score * 100) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="article-content">
      <div v-if="selectedArticle" class="content-wrapper">
        <div class="content-header">
          <h2>{{ selectedArticle.title }}</h2>
          <div class="content-meta">
            <span>{{ selectedArticle.feed_title }}</span>
            <span>{{ formatDate(selectedArticle.published_at) }}</span>
            <button class="btn" @click="toggleStar(selectedArticle)">
              {{ selectedArticle.is_starred ? '⭐ 已收藏' : '☆ 收藏' }}
            </button>
            <button class="btn" @click="extractFullContent">
              📄 提取全文
            </button>
            <button class="btn" @click="generateSummary">
              🤖 生成摘要
            </button>
            <a :href="selectedArticle.link" target="_blank" class="btn">
              🔗 原文链接
            </a>
          </div>
          <div v-if="aiSummary" class="ai-summary">
            <h4>🤖 AI摘要</h4>
            <p>{{ aiSummary }}</p>
          </div>
        </div>
        <div class="content-body" v-html="selectedArticle.content"></div>
        
        <div v-if="similarArticles.length > 0" class="related-articles">
          <h3>📚 相关阅读</h3>
          <div class="related-articles-list">
            <div 
              v-for="article in similarArticles" 
              :key="article.id"
              class="related-article-item"
              @click="selectArticle(article)"
            >
              <div class="related-article-title">{{ article.title }}</div>
              <div class="related-article-meta">
                <span>{{ article.feed_title }}</span>
                <span class="similarity-score">
                  相似度 {{ Math.round((article.similarity_score || 0) * 100) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>选择一篇文章开始阅读</p>
        <p style="font-size: 14px; color: #888; margin-top: 8px;">
          阅读更多文章以获得更精准的推荐
        </p>
      </div>
    </div>

    <div v-if="showAddFeed" class="modal-overlay" @click="showAddFeed = false">
      <div class="modal" @click.stop>
        <h3>添加订阅源</h3>
        <input 
          v-model="newFeedUrl" 
          class="input" 
          placeholder="输入RSS/Atom订阅链接"
        />
        <input 
          v-model="newFeedCategory" 
          class="input" 
          placeholder="分类（可选）"
          style="margin-top: 12px;"
        />
        <div class="modal-actions">
          <button class="btn" @click="showAddFeed = false">取消</button>
          <button class="btn btn-primary" @click="addFeed">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

const feeds = ref([])
const articles = ref([])
const recommendations = ref([])
const similarArticles = ref([])
const categories = ref([])
const selectedArticle = ref(null)
const currentFeed = ref(null)
const currentCategory = ref(null)
const currentView = ref('all')
const showAddFeed = ref(false)
const newFeedUrl = ref('')
const newFeedCategory = ref('')
const aiSummary = ref('')
const isTraining = ref(false)

let readingStartTime = null
let readingTimer = null

const displayArticles = computed(() => {
  if (currentView.value === 'recommendations') {
    return recommendations.value
  }
  return articles.value
})

onMounted(async () => {
  await loadFeeds()
  await loadCategories()
  await loadArticles()
})

onUnmounted(() => {
  if (readingTimer) {
    clearInterval(readingTimer)
  }
  recordCurrentReading()
})

watch(selectedArticle, (newArticle, oldArticle) => {
  recordCurrentReading()
  
  if (newArticle) {
    readingStartTime = Date.now()
    readingTimer = setInterval(() => {
      recordCurrentReading()
    }, 30000)
    
    loadSimilarArticles(newArticle.id)
  } else {
    if (readingTimer) {
      clearInterval(readingTimer)
      readingTimer = null
    }
    similarArticles.value = []
  }
})

function recordCurrentReading() {
  if (selectedArticle.value && readingStartTime) {
    const duration = Math.floor((Date.now() - readingStartTime) / 1000)
    if (duration > 5) {
      window.electronAPI.recordReading(selectedArticle.value.id, duration)
    }
  }
  readingStartTime = Date.now()
}

async function loadFeeds() {
  feeds.value = await window.electronAPI.getFeeds()
}

async function loadCategories() {
  categories.value = await window.electronAPI.getCategories()
}

async function loadArticles() {
  let filter = 'all'
  if (currentView.value === 'unread') filter = 'unread'
  if (currentView.value === 'starred') filter = 'starred'
  
  articles.value = await window.electronAPI.getArticles(
    currentFeed.value,
    filter,
    currentCategory.value
  )
}

async function loadRecommendations() {
  recommendations.value = await window.electronAPI.getRecommendations(50)
}

async function loadSimilarArticles(articleId) {
  similarArticles.value = await window.electronAPI.getSimilarArticles(articleId, 8)
}

async function addFeed() {
  if (!newFeedUrl.value) return
  try {
    await window.electronAPI.addFeed(newFeedUrl.value, newFeedCategory.value)
    await loadFeeds()
    await loadCategories()
    await loadArticles()
    showAddFeed.value = false
    newFeedUrl.value = ''
    newFeedCategory.value = ''
  } catch (error) {
    alert('添加订阅源失败: ' + error.message)
  }
}

async function deleteFeed(id) {
  if (confirm('确定要删除这个订阅源吗？')) {
    await window.electronAPI.deleteFeed(id)
    await loadFeeds()
    await loadCategories()
    await loadArticles()
  }
}

async function selectArticle(article) {
  selectedArticle.value = article
  aiSummary.value = ''
  if (!article.is_read) {
    await window.electronAPI.markRead(article.id, true)
    article.is_read = 1
  }
}

async function toggleStar(article) {
  await window.electronAPI.markStarred(article.id, !article.is_starred)
  article.is_starred = !article.is_starred
  await loadArticles()
}

async function refreshAll() {
  await window.electronAPI.refreshAll()
  await loadArticles()
}

async function trainModel() {
  isTraining.value = true
  try {
    await window.electronAPI.trainRecommendationModel()
    alert('模型训练完成！推荐已更新')
    if (currentView.value === 'recommendations') {
      await loadRecommendations()
    }
  } catch (error) {
    alert('训练失败: ' + error.message)
  } finally {
    isTraining.value = false
  }
}

async function generateSummary() {
  if (!selectedArticle.value) return
  aiSummary.value = '正在生成摘要...'
  try {
    aiSummary.value = await window.electronAPI.generateSummary(selectedArticle.value.content)
  } catch (error) {
    aiSummary.value = '生成失败'
  }
}

async function extractFullContent() {
  if (!selectedArticle.value || !selectedArticle.value.link) return
  
  const originalContent = selectedArticle.value.content
  selectedArticle.value.content = '<p style="color: #666; text-align: center; padding: 40px;">正在提取全文，请稍候...</p>'
  
  try {
    const fullContent = await window.electronAPI.extractFullContent(
      selectedArticle.value.link, 
      selectedArticle.value.id
    )
    if (fullContent && fullContent.length > originalContent.length) {
      selectedArticle.value.content = fullContent
    } else if (fullContent) {
      selectedArticle.value.content = fullContent
    } else {
      selectedArticle.value.content = originalContent
      alert('全文提取失败，请直接访问原文链接查看')
    }
  } catch (error) {
    selectedArticle.value.content = originalContent
    alert('全文提取失败: ' + error.message)
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header h1 {
  font-size: 20px;
  margin-bottom: 16px;
}

.add-btn {
  width: 100%;
}

.sidebar-nav {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-section {
  padding: 12px 0;
}

.section-title {
  padding: 8px 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.nav-item {
  padding: 10px 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.nav-item:hover {
  background: var(--bg-secondary);
}

.nav-item.active {
  background: var(--primary);
  color: white;
}

.feed-item {
  position: relative;
}

.feed-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.feed-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--error);
}

.article-list {
  width: 420px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.header-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.header-title {
  font-size: 14px;
  color: var(--primary);
  font-weight: 500;
}

.article-items {
  flex: 1;
  overflow-y: auto;
}

.article-item {
  padding: 16px;
  border-bottom: 1px solid var(--bg-secondary);
  cursor: pointer;
  transition: background 0.2s;
}

.article-item:hover {
  background: var(--bg-secondary);
}

.article-item.is-read {
  opacity: 0.7;
}

.article-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.article-feed {
  font-size: 12px;
  color: var(--text-secondary);
}

.article-star {
  font-size: 16px;
  cursor: pointer;
}

.article-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  line-height: 1.4;
}

.article-summary {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.article-score {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.article-content {
  flex: 1;
  background: var(--bg-primary);
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  font-size: 16px;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
}

.content-header h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 16px;
}

.content-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
  color: var(--text-secondary);
}

.ai-summary {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.ai-summary h4 {
  color: #389e0d;
  margin-bottom: 8px;
  font-size: 14px;
}

.ai-summary p {
  color: #237804;
  line-height: 1.6;
}

.content-body {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
}

.content-body img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.content-body p {
  margin-bottom: 16px;
}

.content-body h1,
.content-body h2,
.content-body h3 {
  margin: 24px 0 16px;
  font-weight: 600;
}

.related-articles {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--border-color);
}

.related-articles h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.related-articles-list {
  display: grid;
  gap: 12px;
}

.related-article-item {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.related-article-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.related-article-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  line-height: 1.4;
}

.related-article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.similarity-score {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.modal h3 {
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
