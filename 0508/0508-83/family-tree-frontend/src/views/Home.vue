<template>
  <div class="home-container">
    <div class="home-header">
      <h1>家谱树编辑与展示系统</h1>
      <div style="display: flex; align-items: center; gap: 15px;">
        <span>{{ authStore.user?.username }}</span>
        <el-button type="text" @click="handleLogout" style="color: white;">退出登录</el-button>
      </div>
    </div>
    <div class="home-content">
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>家族空间</h3>
          <el-button type="primary" size="small" @click="showCreateDialog = true" style="width: 100%;">
            创建新空间
          </el-button>
        </div>
        <div class="sidebar-content">
          <div
            v-for="space in familySpaces"
            :key="space.id"
            class="space-item"
            :class="{ active: selectedSpaceId === space.id }"
            @click="selectSpace(space.id)"
          >
            <div style="font-weight: 500;">{{ space.name }}</div>
            <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">{{ space.description || '暂无描述' }}</div>
          </div>
          <div v-if="familySpaces.length === 0" style="text-align: center; padding: 30px; color: #999;">
            暂无家族空间
          </div>
        </div>
      </div>
      <div class="main-content">
        <router-view />
        <div v-if="!selectedSpaceId" class="empty-state">
          <el-icon><User /></el-icon>
          <p style="font-size: 16px;">请选择或创建一个家族空间</p>
        </div>
      </div>
    </div>

    <el-dialog v-model="showCreateDialog" title="创建家族空间" width="400px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="createForm.name" placeholder="请输入家族空间名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" placeholder="请输入描述（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createFamilySpace">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { familySpaceApi } from '../api'
import { ElMessage } from 'element-plus'
import { User } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const familySpaces = ref([])
const selectedSpaceId = ref(null)
const showCreateDialog = ref(false)
const createForm = ref({ name: '', description: '' })

provide('familySpaceId', selectedSpaceId)

const loadFamilySpaces = async () => {
  try {
    const res = await familySpaceApi.getAll()
    familySpaces.value = res.data
  } catch (e) {
    console.error('加载家族空间失败', e)
  }
}

const selectSpace = (id) => {
  selectedSpaceId.value = id
  router.push(`/space/${id}`)
}

const createFamilySpace = async () => {
  if (!createForm.value.name) {
    ElMessage.warning('请输入家族空间名称')
    return
  }
  try {
    const res = await familySpaceApi.create(createForm.value)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    createForm.value = { name: '', description: '' }
    await loadFamilySpaces()
    selectSpace(res.data.id)
  } catch (e) {
    console.error('创建失败', e)
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadFamilySpaces()
})
</script>
