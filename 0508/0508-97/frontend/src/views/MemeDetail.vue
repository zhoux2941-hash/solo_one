<template>
  <div v-if="meme" class="detail-container">
    <div class="detail-image">
      <img :src="meme.imageUrl" :alt="meme.title" />
      <div class="detail-info">
        <h2 class="detail-title">{{ meme.title }}</h2>
        <div class="detail-tags" v-if="meme.tags">
          <el-tag 
            v-for="tag in meme.tags.split(',').filter(t => t.trim())" 
            :key="tag"
            style="margin-right: 6px; margin-bottom: 6px;"
          >
            {{ tag.trim() }}
          </el-tag>
        </div>
        <p class="detail-desc" style="margin-top: 10px;">{{ meme.description || '暂无描述' }}</p>
        
        <div class="pk-stats" style="margin: 15px 0; padding: 15px; background: #f5f5f5; border-radius: 4px;">
          <div style="display: flex; gap: 30px;">
            <div>
              <span style="color: #999;">PK战绩</span>
              <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">
                <span style="color: #67c23a;">{{ meme.pkWins || 0 }}</span> 胜 / 
                <span style="color: #f56c6c;">{{ meme.pkLosses || 0 }}</span> 负
              </div>
            </div>
            <div>
              <span style="color: #999;">胜率</span>
              <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">
                <span :style="{ color: pkRate > 50 ? '#67c23a' : pkRate > 0 ? '#e6a23c' : '#909399' }">
                  {{ pkRate.toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="vote-section">
          <span style="font-size: 18px; color: #ff6b6b; font-weight: bold;">
            👍 {{ meme.voteCount }} 票
          </span>
          <el-button 
            type="primary" 
            :disabled="!isLoggedIn || remainingVotes <= 0"
            @click="handleVote"
          >
            {{ remainingVotes <= 0 ? '今日票数已用完' : '投一票' }}
          </el-button>
        </div>
      </div>
    </div>

    <div class="comments-section">
      <h3 class="comments-title">💬 评论区 ({{ comments.length }})</h3>
      
      <div v-if="isLoggedIn" class="comment-input">
        <el-input
          v-model="newComment"
          type="textarea"
          :rows="2"
          placeholder="发表你的看法..."
          maxlength="500"
        ></el-input>
        <div style="text-align: right; margin-top: 10px;">
          <el-button type="primary" @click="submitComment">发表评论</el-button>
        </div>
      </div>
      <div v-else style="text-align: center; padding: 20px; color: #999;">
        登录后可以发表评论 <router-link to="/login">立即登录</router-link>
      </div>

      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-header">
          <span class="comment-user">{{ comment.nickname }}</span>
          <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
        </div>
        <div class="comment-content">{{ comment.content }}</div>
        <div class="comment-actions">
          <el-button 
            type="text" 
            size="mini" 
            @click="replyTo(comment)"
            v-if="isLoggedIn"
          >
            回复
          </el-button>
        </div>
        
        <div v-if="comment.replies && comment.replies.length > 0" class="replies">
          <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
            <div class="comment-header">
              <span class="comment-user">
                {{ reply.nickname }}
                <span v-if="reply.replyToNickname" style="color: #999; font-weight: normal;">
                  回复 {{ reply.replyToNickname }}
                </span>
              </span>
              <span class="comment-time">{{ formatTime(reply.createdAt) }}</span>
            </div>
            <div class="comment-content">{{ reply.content }}</div>
          </div>
        </div>
      </div>

      <div v-if="comments.length === 0" style="text-align: center; padding: 40px; color: #999;">
        暂无评论，快来抢沙发！
      </div>
    </div>

    <el-dialog
      :visible.sync="replyDialogVisible"
      title="回复评论"
      width="500px"
    >
      <el-input
        v-model="replyContent"
        type="textarea"
        :rows="3"
        placeholder="输入回复内容..."
        maxlength="500"
      ></el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">确定</el-button>
      </span>
    </el-dialog>
  </div>
  <div v-else style="text-align: center; padding: 60px;">
    <el-icon-loading style="font-size: 40px; color: #667eea;"></el-icon-loading>
    <p style="margin-top: 20px; color: #666;">加载中...</p>
  </div>
</template>

<script>
import api from '../api'

export default {
  name: 'MemeDetail',
  data() {
    return {
      meme: null,
      comments: [],
      newComment: '',
      replyDialogVisible: false,
      replyContent: '',
      replyingTo: null
    }
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn
    },
    remainingVotes() {
      return this.$store.getters.remainingVotes
    },
    pkRate() {
      if (!this.meme) return 0
      const wins = this.meme.pkWins || 0
      const losses = this.meme.pkLosses || 0
      const total = wins + losses
      if (total === 0) return 0
      return (wins / total) * 100
    }
  },
  created() {
    this.fetchMeme()
    this.fetchComments()
  },
  methods: {
    async fetchMeme() {
      try {
        const response = await api.get(`/memes/${this.$route.params.id}`)
        if (response.data.code === 200) {
          this.meme = response.data.data
          this.fetchVoteCount()
        }
      } catch (e) {
        this.$message.error('表情包不存在')
        this.$router.push('/')
      }
    },
    async fetchVoteCount() {
      try {
        const response = await api.get(`/votes/count/${this.meme.id}`)
        if (response.data.code === 200) {
          this.meme.voteCount = response.data.data
        }
      } catch (e) {
        console.error('获取票数失败:', e)
      }
    },
    async fetchComments() {
      try {
        const response = await api.get(`/comments/meme/${this.$route.params.id}`)
        if (response.data.code === 200) {
          this.comments = response.data.data
        }
      } catch (e) {
        console.error('获取评论失败:', e)
      }
    },
    async handleVote() {
      try {
        await this.$store.dispatch('vote', this.meme.id)
        this.meme.voteCount++
        this.$message.success('投票成功！')
      } catch (e) {
        this.$message.error(e.message)
      }
    },
    async submitComment() {
      if (!this.newComment.trim()) {
        this.$message.warning('请输入评论内容')
        return
      }

      try {
        const response = await api.post('/comments', {
          memeId: this.meme.id,
          content: this.newComment
        })
        if (response.data.code === 200) {
          this.$message.success('评论成功')
          this.newComment = ''
          this.fetchComments()
        } else {
          this.$message.error(response.data.message)
        }
      } catch (e) {
        this.$message.error('评论失败，请重试')
      }
    },
    replyTo(comment) {
      this.replyingTo = comment
      this.replyContent = ''
      this.replyDialogVisible = true
    },
    async submitReply() {
      if (!this.replyContent.trim()) {
        this.$message.warning('请输入回复内容')
        return
      }

      try {
        const response = await api.post('/comments', {
          memeId: this.meme.id,
          parentId: this.replyingTo.id,
          replyToId: this.replyingTo.userId,
          content: this.replyContent
        })
        if (response.data.code === 200) {
          this.$message.success('回复成功')
          this.replyDialogVisible = false
          this.fetchComments()
        } else {
          this.$message.error(response.data.message)
        }
      } catch (e) {
        this.$message.error('回复失败，请重试')
      }
    },
    formatTime(time) {
      if (!time) return ''
      return new Date(time).toLocaleString('zh-CN')
    }
  }
}
</script>
