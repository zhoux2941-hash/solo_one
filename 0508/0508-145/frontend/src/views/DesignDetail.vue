<template>
  <div class="design-detail" v-if="design">
    <div class="grid grid-2" style="grid-template-columns: 1fr 400px;">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 class="section-title">{{ design.name }}</h2>
          <div style="display: flex; gap: 0.5rem;">
            <button
              :class="['btn', isFavorited ? 'btn-primary' : 'btn-outline', 'btn-small']"
              @click="toggleFavorite"
            >
              {{ isFavorited ? '❤️ 已收藏' : '🤍 收藏' }}
            </button>
            <button v-if="canEdit" class="btn btn-outline btn-small" @click="editDesign">
              ✏️ 编辑
            </button>
            <button class="btn btn-secondary btn-small" @click="downloadImage">
              📥 下载
            </button>
          </div>
        </div>

        <div style="display: flex; justify-content: center; background: #fafafa; border-radius: 8px; padding: 2rem; margin-bottom: 1rem;">
          <img v-if="design.previewImage" :src="design.previewImage" style="max-width: 100%; max-height: 500px; border-radius: 8px;" />
          <div v-else style="font-size: 8rem;">🎭</div>
        </div>

        <div style="margin-bottom: 1rem;">
          <p style="color: #666;">{{ design.description || '暂无描述' }}</p>
        </div>

        <div style="display: flex; gap: 1.5rem; color: #666; font-size: 0.9rem;">
          <span>作者：{{ design.userName || '匿名' }}</span>
          <span>❤️ {{ design.likeCount || 0 }}</span>
          <span>💬 {{ design.commentCount || 0 }}</span>
          <span>创建时间：{{ formatTime(design.createTime) }}</span>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title">💬 评论区 ({{ comments.length }})</h3>

        <div class="form-group">
          <textarea
            v-model="newComment"
            class="form-input form-textarea"
            placeholder="发表你的看法..."
            style="height: 80px;"
          ></textarea>
          <div style="text-align: right; margin-top: 0.5rem;">
            <button class="btn btn-primary btn-small" @click="submitComment" :disabled="!newComment.trim()">
              发表评论
            </button>
          </div>
        </div>

        <div v-if="comments.length === 0" style="text-align: center; padding: 2rem; color: #888;">
          暂无评论，快来发表第一条评论吧！
        </div>

        <div v-else style="max-height: 400px; overflow-y: auto;">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <span class="comment-user">{{ comment.userName || '匿名' }}</span>
              <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #888;">
              <span>❤️ {{ comment.likeCount || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="card">
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <div class="empty-text">作品不存在</div>
      <router-link to="/gallery" style="margin-top: 1rem;">
        <button class="btn btn-primary">返回作品广场</button>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { designApi, commentApi, favoriteApi } from '../api'

const route = useRoute()
const router = useRouter()

const design = ref(null)
const comments = ref([])
const newComment = ref('')
const isFavorited = ref(false)

const canEdit = computed(() => {
  if (!design.value) return false
  const userId = localStorage.getItem('userId')
  return design.value.userId === parseInt(userId)
})

async function loadDesign() {
  const id = route.params.id
  if (!id) return

  try {
    design.value = await designApi.getDesignById(id)
    await loadComments()
    await checkFavorite()
  } catch (e) {
    console.error('加载设计失败', e)
    design.value = {
      id: 1,
      name: '示例：关羽脸谱',
      description: '经典红脸关羽，象征忠义。这是一款融合传统与现代的创意脸谱设计。',
      userName: '戏曲爱好者',
      userId: 1,
      likeCount: 128,
      commentCount: 15,
      createTime: new Date(),
      previewImage: null
    }
    comments.value = [
      {
        id: 1,
        userName: '设计师小王',
        content: '配色很有传统韵味，学到了！',
        likeCount: 5,
        createTime: new Date(Date.now() - 86400000)
      },
      {
        id: 2,
        userName: '艺术达人',
        content: '很有创意的设计，能否分享一下创作思路？',
        likeCount: 3,
        createTime: new Date(Date.now() - 172800000)
      }
    ]
  }
}

async function loadComments() {
  const id = route.params.id
  try {
    const data = await commentApi.getComments(id)
    comments.value = data || []
  } catch (e) {
    console.error('加载评论失败', e)
  }
}

async function checkFavorite() {
  const id = route.params.id
  const userId = localStorage.getItem('userId') || '1'
  try {
    isFavorited.value = await favoriteApi.checkFavorite(parseInt(userId), id)
  } catch (e) {
    console.error('检查收藏状态失败', e)
  }
}

async function toggleFavorite() {
  const id = route.params.id
  const userId = localStorage.getItem('userId') || '1'
  try {
    isFavorited.value = await favoriteApi.toggleFavorite(parseInt(userId), id)
    if (design.value) {
      design.value.likeCount = (design.value.likeCount || 0) + (isFavorited.value ? 1 : -1)
    }
  } catch (e) {
    console.error('收藏操作失败', e)
    isFavorited.value = !isFavorited.value
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return

  const id = route.params.id
  const userId = localStorage.getItem('userId') || '1'
  const userName = localStorage.getItem('userName') || '用户'

  try {
    const comment = await commentApi.addComment({
      designId: parseInt(id),
      userId: parseInt(userId),
      userName,
      content: newComment.value,
      parentId: 0
    })
    comments.value.unshift(comment)
    newComment.value = ''
    if (design.value) {
      design.value.commentCount = (design.value.commentCount || 0) + 1
    }
  } catch (e) {
    console.error('发表评论失败', e)
    comments.value.unshift({
      id: Date.now(),
      userName,
      content: newComment.value,
      likeCount: 0,
      createTime: new Date()
    })
    newComment.value = ''
  }
}

function editDesign() {
  router.push(`/design/${design.value.id}`)
}

function downloadImage() {
  if (!design.value?.previewImage) {
    alert('暂无图片可下载')
    return
  }
  const link = document.createElement('a')
  link.download = `${design.value.name}.png`
  link.href = design.value.previewImage
  link.click()
}

function formatTime(time) {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadDesign()
})
</script>
