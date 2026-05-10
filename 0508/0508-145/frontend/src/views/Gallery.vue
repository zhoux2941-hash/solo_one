<template>
  <div class="gallery">
    <div class="card" style="margin-bottom: 1.5rem;">
      <h2 class="section-title">🏛️ 作品广场</h2>
      <p style="color: #666;">浏览和欣赏其他用户创作的脸谱设计作品</p>
    </div>

    <div v-if="designs.length === 0" class="card">
      <div class="empty-state">
        <div class="empty-icon">🎭</div>
        <div class="empty-text">暂无公开作品</div>
        <p style="margin-top: 0.5rem;">成为第一个分享脸谱设计的人吧！</p>
        <router-link to="/design" style="margin-top: 1rem;">
          <button class="btn btn-primary">去创作</button>
        </router-link>
      </div>
    </div>

    <div v-else class="grid grid-4">
      <div
        v-for="design in designs"
        :key="design.id"
        class="card"
        style="cursor: pointer; padding: 0; overflow: hidden;"
        @click="viewDetail(design.id)"
      >
        <div style="height: 250px; display: flex; align-items: center; justify-content: center; background: #fafafa;">
          <img v-if="design.previewImage" :src="design.previewImage" style="max-height: 100%; max-width: 100%;" />
          <div v-else style="font-size: 4rem;">🎭</div>
        </div>
        <div style="padding: 1rem;">
          <h3 style="font-weight: 600; margin-bottom: 0.5rem;">{{ design.name }}</h3>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">{{ design.description || '暂无描述' }}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: #888;">
            <span>作者：{{ design.userName || '匿名' }}</span>
            <div style="display: flex; gap: 1rem;">
              <span>❤️ {{ design.likeCount || 0 }}</span>
              <span>💬 {{ design.commentCount || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="designs.length > 0" style="text-align: center; margin-top: 2rem;">
      <button class="btn btn-outline" @click="loadMore" v-if="!hasMore">加载更多</button>
      <span v-else style="color: #888;">— 已加载全部 —</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { designApi } from '../api'

const router = useRouter()

const designs = ref([])
const page = ref(1)
const pageSize = 12
const hasMore = ref(true)

async function loadDesigns() {
  try {
    const data = await designApi.getPublicDesigns(page.value, pageSize)
    if (data && data.length > 0) {
      if (page.value === 1) {
        designs.value = data
      } else {
        designs.value = [...designs.value, ...data]
      }
      if (data.length < pageSize) {
        hasMore.value = false
      }
    } else {
      hasMore.value = false
    }
  } catch (e) {
    console.error('加载作品失败', e)
    designs.value = [
      {
        id: 1,
        name: '示例：关羽脸谱',
        description: '经典红脸关羽，象征忠义',
        userName: '戏曲爱好者',
        likeCount: 128,
        commentCount: 15,
        previewImage: null
      },
      {
        id: 2,
        name: '示例：包公脸谱',
        description: '黑脸包公，铁面无私',
        userName: '设计师小王',
        likeCount: 89,
        commentCount: 8,
        previewImage: null
      },
      {
        id: 3,
        name: '示例：创意脸谱',
        description: '融合现代元素的创新设计',
        userName: '艺术达人',
        likeCount: 256,
        commentCount: 32,
        previewImage: null
      }
    ]
  }
}

function loadMore() {
  page.value++
  loadDesigns()
}

function viewDetail(id) {
  router.push(`/detail/${id}`)
}

onMounted(() => {
  loadDesigns()
})
</script>
