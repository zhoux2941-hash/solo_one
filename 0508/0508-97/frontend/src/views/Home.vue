<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
      <h1 class="page-title">🔥 表情包大赛</h1>
      <el-button type="primary" v-if="isLoggedIn" @click="$router.push('/upload')">上传我的作品</el-button>
    </div>
    
    <div class="tag-filter" style="margin-bottom: 20px;">
      <span style="margin-right: 10px;">标签筛选：</span>
      <el-tag 
        v-for="tag in allTags" 
        :key="tag"
        :type="selectedTag === tag ? 'danger' : 'info'"
        :effect="selectedTag === tag ? 'dark' : 'plain'"
        style="margin-right: 8px; margin-bottom: 8px; cursor: pointer;"
        @click="toggleTag(tag)"
      >
        {{ tag }}
      </el-tag>
      <el-tag 
        v-if="selectedTag"
        type="success"
        effect="plain"
        style="margin-left: 8px; cursor: pointer;"
        @click="clearTagFilter"
        closable
      >
        清除筛选
      </el-tag>
    </div>
    
    <div class="card-grid">
      <div 
        v-for="meme in memes" 
        :key="meme.id" 
        class="meme-card"
        @click="goToDetail(meme.id)"
      >
        <img :src="meme.imageUrl" :alt="meme.title" class="meme-image" />
        <div class="meme-info">
          <div class="meme-title">{{ meme.title }}</div>
          <div class="meme-tags" v-if="meme.tags">
            <el-tag 
              v-for="tag in meme.tags.split(',').filter(t => t.trim())" 
              :key="tag"
              size="mini"
              style="margin-right: 4px; margin-bottom: 4px;"
            >
              {{ tag.trim() }}
            </el-tag>
          </div>
          <div class="meme-desc" style="margin-top: 8px;">{{ meme.description || '暂无描述' }}</div>
          <div class="meme-meta">
            <span class="vote-count">
              👍 {{ meme.voteCount }} 票
            </span>
            <el-button 
              type="primary" 
              size="mini" 
              :disabled="!isLoggedIn"
              @click.stop="vote(meme)"
            >
              投票
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="memes.length === 0" style="text-align: center; padding: 60px; color: #999;">
      {{ selectedTag ? '该标签下暂无作品' : '暂无表情包作品，快来上传你的作品吧！' }}
    </div>

    <div v-if="total > 0" style="text-align: center; margin-top: 40px;">
      <el-pagination
        :current-page="page"
        :page-size="size"
        :total="total"
        @current-change="handlePageChange"
        layout="prev, pager, next"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import api from '../api'

export default {
  name: 'Home',
  data() {
    return {
      memes: [],
      allTags: [],
      selectedTag: '',
      page: 1,
      size: 12,
      total: 0
    }
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn
    }
  },
  created() {
    this.fetchAllTags()
    this.fetchMemes()
  },
  methods: {
    async fetchAllTags() {
      try {
        const response = await api.get('/memes/tags')
        if (response.data.code === 200) {
          this.allTags = response.data.data
        }
      } catch (e) {
        console.error('获取标签失败:', e)
      }
    },
    async fetchMemes() {
      try {
        const params = { page: this.page, size: this.size }
        if (this.selectedTag) {
          params.tag = this.selectedTag
        }
        const response = await api.get('/memes/approved', { params })
        if (response.data.code === 200) {
          this.memes = response.data.data.records
          this.total = response.data.data.total
        }
      } catch (e) {
        console.error('获取表情包失败:', e)
      }
    },
    toggleTag(tag) {
      this.selectedTag = this.selectedTag === tag ? '' : tag
      this.page = 1
      this.fetchMemes()
    },
    clearTagFilter() {
      this.selectedTag = ''
      this.page = 1
      this.fetchMemes()
    },
    goToDetail(id) {
      this.$router.push(`/meme/${id}`)
    },
    handlePageChange(page) {
      this.page = page
      this.fetchMemes()
    },
    async vote(meme) {
      if (!this.isLoggedIn) {
        this.$message.warning('请先登录再投票')
        this.$router.push('/login')
        return
      }

      if (this.$store.getters.remainingVotes <= 0) {
        this.$message.warning('今日投票次数已用完')
        return
      }

      try {
        await this.$store.dispatch('vote', meme.id)
        meme.voteCount++
        this.$message.success('投票成功！')
      } catch (e) {
        this.$message.error(e.message)
      }
    }
  }
}
</script>
