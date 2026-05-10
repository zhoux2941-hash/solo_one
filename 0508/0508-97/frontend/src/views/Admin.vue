<template>
  <div>
    <h1 class="page-title">🔧 管理后台 - 待审核作品</h1>
    
    <div v-if="pendingMemes.length > 0" class="card-grid">
      <div 
        v-for="meme in pendingMemes" 
        :key="meme.id" 
        class="meme-card"
        style="cursor: default;"
      >
        <img :src="meme.imageUrl" :alt="meme.title" class="meme-image" />
        <div class="meme-info">
          <div class="meme-title">{{ meme.title }}</div>
          <div class="meme-desc">{{ meme.description || '暂无描述' }}</div>
          <div style="font-size: 13px; color: #999; margin-bottom: 10px;">
            上传时间: {{ formatTime(meme.createdAt) }}
          </div>
          <div class="meme-meta" style="gap: 10px;">
            <el-button 
              type="success" 
              size="mini" 
              @click="review(meme, 'APPROVED')"
            >
              通过
            </el-button>
            <el-button 
              type="danger" 
              size="mini" 
              @click="showRejectDialog(meme)"
            >
              拒绝
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div v-else style="text-align: center; padding: 60px; color: #999;">
      🎉 没有待审核的作品
    </div>

    <el-dialog
      :visible.sync="rejectDialogVisible"
      title="拒绝作品"
      width="500px"
    >
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        placeholder="请输入拒绝原因（可选）"
        maxlength="500"
      ></el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '../api'

export default {
  name: 'Admin',
  data() {
    return {
      pendingMemes: [],
      rejectDialogVisible: false,
      rejectReason: '',
      currentMeme: null
    }
  },
  created() {
    this.fetchPendingMemes()
  },
  methods: {
    async fetchPendingMemes() {
      try {
        const response = await api.get('/admin/memes/pending', {
          params: { page: 1, size: 100 }
        })
        if (response.data.code === 200) {
          this.pendingMemes = response.data.data.records
        }
      } catch (e) {
        console.error('获取待审核作品失败:', e)
      }
    },
    async review(meme, status) {
      try {
        const response = await api.post(`/admin/memes/${meme.id}/review`, {
          status,
          reviewComment: status === 'APPROVED' ? '审核通过' : ''
        })
        if (response.data.code === 200) {
          this.$message.success(status === 'APPROVED' ? '审核通过' : '已拒绝')
          this.pendingMemes = this.pendingMemes.filter(m => m.id !== meme.id)
        } else {
          this.$message.error(response.data.message)
        }
      } catch (e) {
        this.$message.error('操作失败，请重试')
      }
    },
    showRejectDialog(meme) {
      this.currentMeme = meme
      this.rejectReason = ''
      this.rejectDialogVisible = true
    },
    confirmReject() {
      this.review(this.currentMeme, 'REJECTED')
      this.rejectDialogVisible = false
    },
    formatTime(time) {
      if (!time) return ''
      return new Date(time).toLocaleString('zh-CN')
    }
  }
}
</script>
