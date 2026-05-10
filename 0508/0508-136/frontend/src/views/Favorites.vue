<template>
  <div class="favorites-page" style="flex: 1; padding: 20px; overflow-y: auto;">
    <div style="max-width: 1200px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 20px; color: #303133; margin: 0;">
          <el-icon style="margin-right: 8px; color: #667eea;"><Star /></el-icon>
          我的收藏
        </h2>
        <el-button type="primary" @click="$router.push('/')">
          <el-icon><Edit /></el-icon>
          新建设计
        </el-button>
      </div>
      
      <el-empty v-if="loading === false && favorites.length === 0" description="暂无收藏记录">
        <el-button type="primary" @click="$router.push('/')">去设计</el-button>
      </el-empty>
      
      <div v-else class="favorites-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        <el-card 
          v-for="item in favorites" 
          :key="item.id"
          shadow="hover"
          style="border-radius: 8px;"
        >
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: #303133;">{{ item.name }}</span>
              <el-tag size="small" type="primary">{{ getJoinTypeName(item.joinType) }}</el-tag>
            </div>
          </template>
          
          <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #909399; margin-bottom: 8px;">木料尺寸</div>
            <div style="font-size: 14px; color: #303133;">
              {{ item.woodLength }} × {{ item.woodWidth }} × {{ item.woodHeight }} mm
            </div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #909399; margin-bottom: 8px;">榫头尺寸</div>
            <div style="font-size: 14px; color: #303133;">
              {{ item.tenonLength }} × {{ item.tenonWidth }} × {{ item.tenonHeight }} mm
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; color: #909399; margin-bottom: 8px;">加工余量</div>
            <div style="font-size: 14px; color: #303133;">{{ item.margin }} mm</div>
          </div>
          
          <div v-if="item.description" style="margin-bottom: 16px; padding: 8px; background: #f5f7fa; border-radius: 4px;">
            <div style="font-size: 12px; color: #909399; margin-bottom: 4px;">备注</div>
            <div style="font-size: 12px; color: #606266;">{{ item.description }}</div>
          </div>
          
          <div style="display: flex; gap: 8px;">
            <el-button type="primary" size="small" style="flex: 1;" @click="applyAndGo(item)">
              <el-icon><Pointer /></el-icon>
              使用此参数
            </el-button>
            <el-popconfirm
              title="确定要删除这个收藏吗？"
              @confirm="deleteItem(item.id)"
            >
              <template #reference>
                <el-button size="small" type="danger" text>
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useJoinStore } from '@/stores/join'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { getJoinTypes } from '@/api/join'

const router = useRouter()
const store = useJoinStore()
const { favorites } = storeToRefs(store)

const joinTypes = ref([])
const loading = ref(true)

const getJoinTypeName = (code) => {
  const type = joinTypes.value.find(t => t.code === code)
  return type?.name || code
}

const applyAndGo = (item) => {
  store.applyFavorite(item)
  router.push('/')
}

const deleteItem = async (id) => {
  await store.removeFavorite(id)
}

onMounted(async () => {
  try {
    joinTypes.value = await getJoinTypes()
    await store.loadFavorites()
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})
</script>