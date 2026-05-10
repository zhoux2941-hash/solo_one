<template>
  <div>
    <div class="pk-header" style="text-align: center; margin-bottom: 40px;">
      <h1 class="page-title" style="margin-bottom: 10px;">⚔️ 随机 PK 对战</h1>
      <p style="color: #666;">选择你更喜欢的表情包，帮助它登上胜率榜！</p>
    </div>

    <div class="tag-filter" style="text-align: center; margin-bottom: 30px;">
      <span style="margin-right: 10px;">按标签PK：</span>
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
        @click="selectedTag = ''; fetchRandomPair()"
        closable
      >
        全部
      </el-tag>
    </div>

    <div v-if="loading" style="text-align: center; padding: 80px;">
      <el-icon-loading style="font-size: 40px; color: #667eea;"></el-icon-loading>
      <p style="margin-top: 20px; color: #666;">正在抽取表情包...</p>
    </div>

    <div v-else-if="error" style="text-align: center; padding: 80px;">
      <div style="font-size: 60px; margin-bottom: 20px;">😅</div>
      <p style="color: #666; font-size: 16px;">{{ error }}</p>
      <el-button type="primary" @click="fetchRandomPair" style="margin-top: 20px;">
        再试一次
      </el-button>
    </div>

    <div v-else class="pk-arena" style="display: flex; justify-content: center; align-items: center; gap: 60px;">
      <div 
        class="pk-meme-card"
        :class="{ 'pk-selected': selectedMemeId === pkPair.meme1.id }"
        @click="selectMeme(pkPair.meme1)"
        style="text-align: center; cursor: pointer;"
      >
        <div class="pk-vs-badge pk-left" style="font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 15px;">
          1号选手
        </div>
        <div class="pk-image-container" style="position: relative;">
          <img 
            :src="pkPair.meme1.imageUrl" 
            :alt="pkPair.meme1.title"
            style="width: 300px; height: 300px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
          />
          <div 
            v-if="selectedMemeId === pkPair.meme1.id" 
            style="position: absolute; top: 10px; right: 10px; background: #67c23a; color: #fff; padding: 5px 12px; border-radius: 20px; font-size: 14px;"
          >
            ✓ 已选择
          </div>
        </div>
        <h3 style="margin-top: 15px; font-size: 18px;">{{ pkPair.meme1.title }}</h3>
        <div v-if="pkPair.meme1.tags" style="margin-top: 10px;">
          <el-tag 
            v-for="tag in pkPair.meme1.tags.split(',').filter(t => t.trim())" 
            :key="tag"
            size="mini"
            style="margin-right: 4px;"
          >
            {{ tag.trim() }}
          </el-tag>
        </div>
      </div>

      <div class="pk-vs" style="font-size: 48px; font-weight: bold; color: #ff6b6b;">
        VS
      </div>

      <div 
        class="pk-meme-card"
        :class="{ 'pk-selected': selectedMemeId === pkPair.meme2.id }"
        @click="selectMeme(pkPair.meme2)"
        style="text-align: center; cursor: pointer;"
      >
        <div class="pk-vs-badge pk-right" style="font-size: 24px; font-weight: bold; color: #764ba2; margin-bottom: 15px;">
          2号选手
        </div>
        <div class="pk-image-container" style="position: relative;">
          <img 
            :src="pkPair.meme2.imageUrl" 
            :alt="pkPair.meme2.title"
            style="width: 300px; height: 300px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
          />
          <div 
            v-if="selectedMemeId === pkPair.meme2.id" 
            style="position: absolute; top: 10px; right: 10px; background: #67c23a; color: #fff; padding: 5px 12px; border-radius: 20px; font-size: 14px;"
          >
            ✓ 已选择
          </div>
        </div>
        <h3 style="margin-top: 15px; font-size: 18px;">{{ pkPair.meme2.title }}</h3>
        <div v-if="pkPair.meme2.tags" style="margin-top: 10px;">
          <el-tag 
            v-for="tag in pkPair.meme2.tags.split(',').filter(t => t.trim())" 
            :key="tag"
            size="mini"
            style="margin-right: 4px;"
          >
            {{ tag.trim() }}
          </el-tag>
        </div>
      </div>
    </div>

    <div v-if="pkPair && !loading && !error" style="text-align: center; margin-top: 40px;">
      <el-button 
        type="primary" 
        size="large"
        :disabled="!selectedMemeId"
        :loading="submitting"
        @click="submitVote"
      >
        {{ selectedMemeId ? '确认投票' : '请先选择一个表情包' }}
      </el-button>
      <el-button 
        type="text" 
        size="large"
        style="margin-left: 20px;"
        @click="fetchRandomPair"
        :disabled="submitting"
      >
        换一组
      </el-button>
    </div>

    <div v-if="pkStats.total > 0" class="pk-stats" style="text-align: center; margin-top: 50px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
      <span style="color: #666;">今日战绩：</span>
      <span style="margin-left: 10px; font-size: 18px; font-weight: bold;">
        已参与 <span style="color: #667eea;">{{ pkStats.total }}</span> 场 PK
      </span>
    </div>

    <el-dialog
      :visible.sync="resultDialogVisible"
      title="🎉 PK 结果"
      width="500px"
      :close-on-click-modal="false"
    >
      <div style="text-align: center;">
        <div style="font-size: 60px; margin-bottom: 20px;">🏆</div>
        <h3 style="margin-bottom: 15px;">{{ pkResult.winner.title }} 获胜！</h3>
        <img 
          :src="pkResult.winner.imageUrl" 
          style="width: 200px; height: 200px; object-fit: cover; border-radius: 8px;"
        />
        <div style="margin-top: 20px; color: #666;">
          新胜率：<span style="font-size: 18px; font-weight: bold; color: #67c23a;">
            {{ pkResult.newWinnerRate ? pkResult.newWinnerRate.toFixed(1) : 0 }}%
          </span>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="nextRound">
          下一组 →
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '../api'

export default {
  name: 'PkBattle',
  data() {
    return {
      pkPair: null,
      selectedMemeId: null,
      allTags: [],
      selectedTag: '',
      loading: false,
      error: '',
      submitting: false,
      resultDialogVisible: false,
      pkResult: {
        winner: {},
        newWinnerRate: 0
      },
      pkStats: {
        total: 0
      }
    }
  },
  created() {
    this.fetchAllTags()
    this.fetchRandomPair()
    this.fetchHistory()
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
    toggleTag(tag) {
      this.selectedTag = this.selectedTag === tag ? '' : tag
      this.fetchRandomPair()
    },
    async fetchRandomPair() {
      this.loading = true
      this.error = ''
      this.selectedMemeId = null
      
      try {
        const params = {}
        if (this.selectedTag) {
          params.tag = this.selectedTag
        }
        const response = await api.get('/pk/pair', { params })
        if (response.data.code === 200) {
          this.pkPair = response.data.data
        } else {
          this.error = response.data.message || '获取PK对战失败'
        }
      } catch (e) {
        if (e.response && e.response.data) {
          this.error = e.response.data.message || '获取PK对战失败'
        } else {
          this.error = '网络错误，请稍后重试'
        }
      } finally {
        this.loading = false
      }
    },
    selectMeme(meme) {
      this.selectedMemeId = meme.id
    },
    async submitVote() {
      if (!this.selectedMemeId) return
      
      this.submitting = true
      try {
        const response = await api.post('/pk/submit', {
          meme1Id: this.pkPair.meme1.id,
          meme2Id: this.pkPair.meme2.id,
          winnerId: this.selectedMemeId
        })
        
        if (response.data.code === 200) {
          this.pkResult = response.data.data
          this.pkStats.total++
          this.resultDialogVisible = true
        } else {
          this.$message.error(response.data.message)
        }
      } catch (e) {
        if (e.response && e.response.data) {
          this.$message.error(e.response.data.message)
        } else {
          this.$message.error('网络错误')
        }
      } finally {
        this.submitting = false
      }
    },
    nextRound() {
      this.resultDialogVisible = false
      this.fetchRandomPair()
    },
    async fetchHistory() {
      try {
        const response = await api.get('/pk/history')
        if (response.data.code === 200) {
          this.pkStats.total = response.data.data.length
        }
      } catch (e) {
        console.error('获取历史记录失败:', e)
      }
    }
  }
}
</script>

<style scoped>
.pk-meme-card {
  transition: all 0.3s ease;
}

.pk-meme-card:hover {
  transform: scale(1.02);
}

.pk-meme-card.pk-selected {
  transform: scale(1.05);
}

.pk-meme-card.pk-selected img {
  border: 3px solid #67c23a;
  box-shadow: 0 6px 20px rgba(103, 194, 58, 0.4) !important;
}
</style>
