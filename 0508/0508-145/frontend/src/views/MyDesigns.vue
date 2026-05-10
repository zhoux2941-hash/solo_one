<template>
  <div class="my-designs">
    <div class="card" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2 class="section-title">💾 我的设计</h2>
        <p style="color: #666;">管理你创建的脸谱设计作品</p>
      </div>
      <router-link to="/design">
        <button class="btn btn-primary">+ 新建设计</button>
      </router-link>
    </div>

    <div v-if="designs.length === 0" class="card">
      <div class="empty-state">
        <div class="empty-icon">🎨</div>
        <div class="empty-text">还没有设计作品</div>
        <p style="margin-top: 0.5rem;">开始创作你的第一个脸谱设计吧！</p>
        <router-link to="/design" style="margin-top: 1rem;">
          <button class="btn btn-primary">开始创作</button>
        </router-link>
      </div>
    </div>

    <div v-else class="grid grid-3">
      <div
        v-for="design in designs"
        :key="design.id"
        class="card"
        style="padding: 0; overflow: hidden;"
      >
        <div style="height: 250px; display: flex; align-items: center; justify-content: center; background: #fafafa; cursor: pointer;" @click="viewDetail(design.id)">
          <img v-if="design.previewImage" :src="design.previewImage" style="max-height: 100%; max-width: 100%;" />
          <div v-else style="font-size: 4rem;">🎭</div>
        </div>
        <div style="padding: 1rem;">
          <h3 style="font-weight: 600; margin-bottom: 0.5rem;">{{ design.name }}</h3>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">{{ design.description || '暂无描述' }}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: #888; margin-bottom: 1rem;">
            <span>创建时间：{{ formatTime(design.createTime) }}</span>
            <span>{{ design.isPublic === 1 ? '🌐 公开' : '🔒 私有' }}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-outline btn-small" @click="editDesign(design.id)">
              ✏️ 编辑
            </button>
            <button class="btn btn-outline btn-small" @click="viewDetail(design.id)">
              👁️ 查看
            </button>
            <button class="btn btn-outline btn-small" style="border-color: #f44336; color: #f44336;" @click="deleteDesign(design.id)">
              🗑️ 删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { designApi } from '../api'

const router = useRouter()

const designs = ref([])

async function loadDesigns() {
  const userId = localStorage.getItem('userId') || '1'
  try {
    const data = await designApi.getUserDesigns(parseInt(userId))
    if (data && data.length > 0) {
      designs.value = data
    }
  } catch (e) {
    console.error('加载设计失败', e)
  }
}

function formatTime(time) {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN')
}

function editDesign(id) {
  router.push(`/design/${id}`)
}

function viewDetail(id) {
  router.push(`/detail/${id}`)
}

async function deleteDesign(id) {
  if (!confirm('确定要删除这个设计吗？')) return

  const userId = localStorage.getItem('userId') || '1'
  try {
    await designApi.deleteDesign(id, parseInt(userId))
    designs.value = designs.value.filter(d => d.id !== id)
    alert('删除成功')
  } catch (e) {
    alert('删除失败：' + e.message)
  }
}

onMounted(() => {
  loadDesigns()
})
</script>
