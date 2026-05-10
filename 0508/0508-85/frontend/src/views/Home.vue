<template>
  <div class="home-page">
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <h1>密室剧本编辑器</h1>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建新剧本
          </el-button>
        </div>
      </el-header>
      
      <el-main>
        <el-empty v-if="scripts.length === 0" description="暂无剧本，点击上方按钮创建">
          <el-button type="primary" @click="showCreateDialog = true">创建剧本</el-button>
        </el-empty>
        
        <el-row :gutter="20" v-else>
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="script in scripts" :key="script.id">
            <el-card class="script-card" shadow="hover" @click="openScript(script.id)">
              <template #header>
                <div class="card-header">
                  <span class="script-name">{{ script.name }}</span>
                  <el-tag :type="getDifficultyType(script.difficulty)" size="small">
                    {{ script.difficulty }}
                  </el-tag>
                </div>
              </template>
              <div class="script-desc">
                <p>{{ script.backgroundStory || '暂无背景故事' }}</p>
              </div>
              <div class="card-footer">
                <span class="scene-count">
                  <el-icon><Picture /></el-icon>
                  {{ script.scenes?.length || 0 }} 个场景
                </span>
                <el-button-group>
                  <el-button type="primary" size="small" link @click.stop="openScript(script.id)">
                    编辑
                  </el-button>
                  <el-button 
                    type="success" 
                    size="small" 
                    link 
                    @click.stop="testScript(script)"
                  >
                    测试
                  </el-button>
                  <el-button 
                    type="warning" 
                    size="small" 
                    link 
                    @click.stop="exportScript(script)"
                  >
                    导出PDF
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    link 
                    @click.stop="confirmDelete(script)"
                  >
                    删除
                  </el-button>
                </el-button-group>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>

    <el-dialog v-model="showCreateDialog" title="创建新剧本" width="500px">
      <el-form :model="newScript" label-width="80px">
        <el-form-item label="剧本名称" required>
          <el-input v-model="newScript.name" placeholder="请输入剧本名称" />
        </el-form-item>
        <el-form-item label="背景故事">
          <el-input 
            v-model="newScript.backgroundStory" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入背景故事" 
          />
        </el-form-item>
        <el-form-item label="难度" required>
          <el-select v-model="newScript.difficulty" placeholder="请选择难度" style="width: 100%;">
            <el-option label="简单" value="简单" />
            <el-option label="中等" value="中等" />
            <el-option label="困难" value="困难" />
            <el-option label="地狱" value="地狱" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createScript">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture } from '@element-plus/icons-vue'
import { useScriptStore } from '../stores/script'
import { scriptApi } from '../api'

const router = useRouter()
const scriptStore = useScriptStore()

const scripts = ref([])
const showCreateDialog = ref(false)
const newScript = ref({
  name: '',
  backgroundStory: '',
  difficulty: '中等'
})

const loadScripts = async () => {
  await scriptStore.loadScripts()
  scripts.value = scriptStore.scripts
}

const getDifficultyType = (difficulty) => {
  const types = {
    '简单': 'success',
    '中等': 'warning',
    '困难': 'danger',
    '地狱': ''
  }
  return types[difficulty] || 'info'
}

const createScript = async () => {
  if (!newScript.value.name || !newScript.value.difficulty) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await scriptApi.create(newScript.value)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    newScript.value = {
      name: '',
      backgroundStory: '',
      difficulty: '中等'
    }
    await loadScripts()
  } catch (error) {
    ElMessage.error('创建失败: ' + (error.response?.data?.message || error.message))
  }
}

const openScript = (id) => {
  router.push(`/scripts/${id}`)
}

const testScript = (script) => {
  router.push(`/scripts/${script.id}/test`)
}

const exportScript = (script) => {
  scriptApi.export(script.id)
}

const confirmDelete = async (script) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除剧本"${script.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await scriptApi.delete(script.id)
    ElMessage.success('删除成功')
    await loadScripts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadScripts()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
}

.script-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.script-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.script-name {
  font-weight: bold;
  font-size: 16px;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.script-desc {
  height: 60px;
  overflow: hidden;
  color: #666;
}

.script-desc p {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.scene-count {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #999;
  font-size: 13px;
}
</style>
