<template>
  <div class="editor-page">
    <el-container>
      <el-header class="editor-header">
        <div class="header-left">
          <el-button link @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h2 class="script-title">{{ currentScript?.name || '加载中...' }}</h2>
          <el-tag v-if="isConnected" type="success" effect="dark" size="small">
            <el-icon><Connection /></el-icon>
            在线协作
          </el-tag>
          <el-tag v-else type="danger" effect="dark" size="small">
            <el-icon><Warning /></el-icon>
            未连接
          </el-tag>
        </div>
        <div class="header-right">
          <el-tag type="info" size="small">{{ currentUser.userName }}</el-tag>
          <el-button @click="goToTest">
            <el-icon><VideoPlay /></el-icon>
            密室测试
          </el-button>
          <el-button type="success" @click="exportScript">
            <el-icon><Download /></el-icon>
            导出PDF
          </el-button>
        </div>
      </el-header>
      
      <el-container>
        <el-aside width="280px" class="scene-sidebar">
          <div class="sidebar-header">
            <span>场景列表</span>
            <el-button type="primary" size="small" @click="addScene">
              <el-icon><Plus /></el-icon>
              添加场景
            </el-button>
          </div>
          <el-scrollbar>
            <div class="scene-list">
              <div 
                v-for="(scene, index) in scenes" 
                :key="scene.id"
                class="scene-item"
                :class="{ active: currentSceneId === scene.id }"
                @click="selectScene(scene)"
              >
                <div class="scene-info">
                  <span class="scene-index">场景{{ index + 1 }}</span>
                  <span class="scene-name">{{ scene.name }}</span>
                </div>
                <div class="scene-actions">
                  <el-button 
                    type="danger" 
                    size="small" 
                    link 
                    @click.stop="deleteScene(scene)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <el-empty v-if="scenes.length === 0" description="暂无场景" :image-size="80" />
            </div>
          </el-scrollbar>
        </el-aside>
        
        <el-main class="editor-main">
          <template v-if="currentScene">
            <el-card class="scene-card">
              <template #header>
                <div class="card-header">
                  <h3>场景信息</h3>
                </div>
              </template>
              <el-form :model="currentScene" label-width="100px">
                <el-form-item label="场景名称">
                  <el-input 
                    v-model="currentScene.name" 
                    @change="saveScene"
                  />
                </el-form-item>
                <el-form-item label="场景图片">
                  <el-input 
                    v-model="currentScene.imageUrl" 
                    placeholder="请输入图片URL"
                    @change="saveScene"
                  />
                </el-form-item>
                <el-form-item label="场景描述">
                  <el-input 
                    v-model="currentScene.description" 
                    type="textarea" 
                    :rows="4"
                    @change="saveScene"
                  />
                </el-form-item>
              </el-form>
            </el-card>

            <el-card class="puzzle-card">
              <template #header>
                <div class="card-header">
                  <h3>谜题链</h3>
                  <el-button type="primary" size="small" @click="addPuzzle">
                    <el-icon><Plus /></el-icon>
                    添加谜题
                  </el-button>
                </div>
              </template>
              <div class="puzzle-list">
                <div 
                  v-for="(puzzle, index) in currentScenePuzzles" 
                  :key="puzzle.id"
                  class="puzzle-item"
                  :class="{ 
                    'puzzle-editing': editingPuzzleId === puzzle.id,
                    'puzzle-locked': isPuzzleLocked(puzzle.id)
                  }"
                >
                  <div class="puzzle-header">
                    <span class="puzzle-order">谜题{{ index + 1 }}</span>
                    <el-input 
                      v-model="puzzle.name" 
                      size="small" 
                      placeholder="谜题名称"
                      :disabled="isPuzzleLocked(puzzle.id) && !isMyEditingPuzzle(puzzle.id)"
                      @focus="startEditingPuzzle(puzzle)"
                      @blur="stopEditingPuzzle(puzzle)"
                      @change="savePuzzle(puzzle)"
                    />
                    <div v-if="isPuzzleLocked(puzzle.id)" class="puzzle-status">
                      <el-tag :type="isMyEditingPuzzle(puzzle.id) ? 'primary' : 'warning'" size="small">
                        <el-icon v-if="isMyEditingPuzzle(puzzle.id)"><Edit /></el-icon>
                        <el-icon v-else><Lock /></el-icon>
                        {{ getPuzzleEditorName(puzzle.id) }}
                      </el-tag>
                    </div>
                    <el-button 
                      type="danger" 
                      size="small" 
                      link 
                      @click="deletePuzzle(puzzle)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-form :model="puzzle" label-width="80px" class="puzzle-form">
                    <el-form-item label="谜面">
                      <el-input 
                        v-model="puzzle.puzzleText" 
                        type="textarea" 
                        :rows="2"
                        :disabled="isPuzzleLocked(puzzle.id) && !isMyEditingPuzzle(puzzle.id)"
                        @focus="startEditingPuzzle(puzzle)"
                        @blur="stopEditingPuzzle(puzzle)"
                        @change="savePuzzle(puzzle)"
                      />
                    </el-form-item>
                    <el-form-item label="解谜方式">
                      <el-input 
                        v-model="puzzle.solutionMethod" 
                        type="textarea" 
                        :rows="2"
                        :disabled="isPuzzleLocked(puzzle.id) && !isMyEditingPuzzle(puzzle.id)"
                        @focus="startEditingPuzzle(puzzle)"
                        @blur="stopEditingPuzzle(puzzle)"
                        @change="savePuzzle(puzzle)"
                      />
                    </el-form-item>
                    <el-form-item label="答案">
                      <el-input 
                        v-model="puzzle.answer"
                        :disabled="isPuzzleLocked(puzzle.id) && !isMyEditingPuzzle(puzzle.id)"
                        @focus="startEditingPuzzle(puzzle)"
                        @blur="stopEditingPuzzle(puzzle)"
                        @change="savePuzzle(puzzle)"
                      />
                    </el-form-item>
                    <el-form-item label="解锁条件">
                      <el-input 
                        v-model="puzzle.unlockCondition" 
                        type="textarea" 
                        :rows="2"
                        placeholder="解开此谜题后解锁下一个场景的条件"
                        :disabled="isPuzzleLocked(puzzle.id) && !isMyEditingPuzzle(puzzle.id)"
                        @focus="startEditingPuzzle(puzzle)"
                        @blur="stopEditingPuzzle(puzzle)"
                        @change="savePuzzle(puzzle)"
                      />
                    </el-form-item>
                  </el-form>
                </div>
                <el-empty v-if="currentScenePuzzles.length === 0" description="暂无谜题" :image-size="80" />
              </div>
            </el-card>
          </template>
          
          <el-empty v-else description="请选择或添加一个场景" />
        </el-main>
      </el-container>
    </el-container>

    <el-dialog v-model="showSceneDialog" title="添加场景" width="400px">
      <el-form :model="newScene" label-width="80px">
        <el-form-item label="场景名称" required>
          <el-input v-model="newScene.name" placeholder="请输入场景名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newScene.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSceneDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddScene">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="showConflictDialog" 
      title="编辑冲突" 
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-alert 
        :title="conflictMessage" 
        :type="conflictType === 'version_conflict' ? 'error' : 'warning'" 
        show-icon 
        :closable="false"
        style="margin-bottom: 20px;"
      />
      
      <div v-if="conflictType === 'version_conflict' && latestPuzzleData" class="conflict-comparison">
        <p style="margin-bottom: 10px; font-weight: bold;">当前最新数据：</p>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="名称">{{ latestPuzzleData.name }}</el-descriptions-item>
          <el-descriptions-item label="谜面">
            <pre style="white-space: pre-wrap; margin: 0;">{{ latestPuzzleData.puzzleText }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="解谜方式">
            <pre style="white-space: pre-wrap; margin: 0;">{{ latestPuzzleData.solutionMethod }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="答案">{{ latestPuzzleData.answer }}</el-descriptions-item>
          <el-descriptions-item v-if="latestPuzzleData.unlockCondition" label="解锁条件">
            <pre style="white-space: pre-wrap; margin: 0;">{{ latestPuzzleData.unlockCondition }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <el-button v-if="conflictType === 'version_conflict'" @click="refreshPuzzle">
          <el-icon><Refresh /></el-icon>
          刷新获取最新数据
        </el-button>
        <el-button v-if="conflictType === 'version_conflict'" type="warning" @click="forceOverwrite">
          <el-icon><Warning /></el-icon>
          强制覆盖（丢失他人修改）
        </el-button>
        <el-button @click="closeConflictDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, Delete, Download, Connection, Warning, Lock, Edit, Refresh, VideoPlay } from '@element-plus/icons-vue'
import SockJS from 'sockjs-client'
import Stomp from 'stompjs'
import { useScriptStore } from '../stores/script'
import { scriptApi, sceneApi, puzzleApi, getCurrentUser } from '../api'

const route = useRoute()
const router = useRouter()
const scriptStore = useScriptStore()

const scriptId = computed(() => parseInt(route.params.id))
const currentUser = getCurrentUser()

const currentScript = ref(null)
const scenes = ref([])
const currentSceneId = ref(null)
const currentScene = ref(null)
const isConnected = ref(false)
const showSceneDialog = ref(false)
const newScene = ref({ name: '', description: '' })

const editingPuzzleId = ref(null)
const lockedPuzzles = ref({})
const showConflictDialog = ref(false)
const conflictType = ref('')
const conflictMessage = ref('')
const latestPuzzleData = ref(null)
const conflictPuzzleId = ref(null)

let stompClient = null

const currentScenePuzzles = computed(() => {
  if (!currentScene.value || !currentScene.value.puzzles) return []
  return [...currentScene.value.puzzles].sort((a, b) => a.orderIndex - b.orderIndex)
})

const isPuzzleLocked = (puzzleId) => {
  return !!lockedPuzzles.value[puzzleId]
}

const isMyEditingPuzzle = (puzzleId) => {
  const info = lockedPuzzles.value[puzzleId]
  return info && info.userId === currentUser.userId
}

const getPuzzleEditorName = (puzzleId) => {
  const info = lockedPuzzles.value[puzzleId]
  if (!info) return ''
  if (info.userId === currentUser.userId) return '我正在编辑'
  return info.userName + ' 正在编辑'
}

const connectWebSocket = () => {
  const socket = new SockJS('/ws')
  stompClient = Stomp.over(socket)
  stompClient.debug = () => {}
  
  stompClient.connect({}, () => {
    isConnected.value = true
    ElMessage.success('已连接到协作服务器')
    
    stompClient.subscribe(`/topic/script/${scriptId.value}/updated`, (message) => {
      const updatedScript = JSON.parse(message.body)
      if (currentScript.value) {
        currentScript.value.name = updatedScript.name
        currentScript.value.backgroundStory = updatedScript.backgroundStory
        currentScript.value.difficulty = updatedScript.difficulty
      }
    })
    
    stompClient.subscribe(`/topic/script/${scriptId.value}/scene/updated`, (message) => {
      const updatedScene = JSON.parse(message.body)
      const index = scenes.value.findIndex(s => s.id === updatedScene.id)
      if (index !== -1) {
        scenes.value[index] = { ...scenes.value[index], ...updatedScene }
        if (currentSceneId.value === updatedScene.id && currentScene.value) {
          currentScene.value = { ...currentScene.value, ...updatedScene }
        }
      } else {
        scenes.value.push(updatedScene)
      }
    })
    
    stompClient.subscribe(`/topic/script/${scriptId.value}/scene/deleted`, (message) => {
      const deletedSceneId = JSON.parse(message.body)
      scenes.value = scenes.value.filter(s => s.id !== deletedSceneId)
      if (currentSceneId.value === deletedSceneId) {
        currentSceneId.value = null
        currentScene.value = null
      }
    })
    
    stompClient.subscribe('/topic/scene/*/puzzle/updated', (message) => {
      const updatedPuzzle = JSON.parse(message.body)
      const scene = scenes.value.find(s => s.id === updatedPuzzle.sceneId)
      if (scene) {
        if (!scene.puzzles) scene.puzzles = []
        const index = scene.puzzles.findIndex(p => p.id === updatedPuzzle.id)
        if (index !== -1) {
          if (!lockedPuzzles.value[updatedPuzzle.id] || 
              lockedPuzzles.value[updatedPuzzle.id].userId !== currentUser.userId) {
            scene.puzzles[index] = { ...scene.puzzles[index], ...updatedPuzzle }
          }
        } else {
          scene.puzzles.push(updatedPuzzle)
        }
        if (currentScene.value && currentScene.value.id === updatedPuzzle.sceneId) {
          if (!currentScene.value.puzzles) currentScene.value.puzzles = []
          const puzzleIndex = currentScene.value.puzzles.findIndex(p => p.id === updatedPuzzle.id)
          if (puzzleIndex !== -1) {
            if (!lockedPuzzles.value[updatedPuzzle.id] || 
                lockedPuzzles.value[updatedPuzzle.id].userId !== currentUser.userId) {
              currentScene.value.puzzles[puzzleIndex] = { ...currentScene.value.puzzles[puzzleIndex], ...updatedPuzzle }
            }
          } else {
            currentScene.value.puzzles.push(updatedPuzzle)
          }
        }
      }
    })
    
    stompClient.subscribe('/topic/scene/*/puzzle/deleted', (message) => {
      const deletedPuzzleId = JSON.parse(message.body)
      scenes.value.forEach(scene => {
        if (scene.puzzles) {
          scene.puzzles = scene.puzzles.filter(p => p.id !== deletedPuzzleId)
        }
      })
      if (currentScene.value && currentScene.value.puzzles) {
        currentScene.value.puzzles = currentScene.value.puzzles.filter(p => p.id !== deletedPuzzleId)
      }
      delete lockedPuzzles.value[deletedPuzzleId]
    })
    
    stompClient.subscribe('/topic/scene/*/puzzle/editing', (message) => {
      const data = JSON.parse(message.body)
      if (data.isEditing && data.editorInfo) {
        if (data.editorInfo.userId !== currentUser.userId) {
          lockedPuzzles.value[data.puzzleId] = data.editorInfo
        }
      } else {
        delete lockedPuzzles.value[data.puzzleId]
      }
    })
  }, (error) => {
    console.error('WebSocket connection error:', error)
    isConnected.value = false
  })
}

const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.disconnect()
  }
}

const loadScript = async () => {
  const script = await scriptStore.loadScript(scriptId.value)
  if (script) {
    currentScript.value = script
    scenes.value = script.scenes || []
    if (scenes.value.length > 0) {
      selectScene(scenes.value[0])
    }
  }
}

const selectScene = (scene) => {
  if (editingPuzzleId.value) {
    try {
      puzzleApi.stopEditing(editingPuzzleId.value)
    } catch (e) {}
    editingPuzzleId.value = null
  }
  currentSceneId.value = scene.id
  currentScene.value = { ...scene }
}

const addScene = () => {
  showSceneDialog.value = true
  newScene.value = { name: '', description: '' }
}

const confirmAddScene = async () => {
  if (!newScene.value.name) {
    ElMessage.warning('请输入场景名称')
    return
  }
  
  try {
    const res = await sceneApi.add(scriptId.value, newScene.value)
    ElMessage.success('场景添加成功')
    showSceneDialog.value = false
    scenes.value.push(res.data)
    selectScene(res.data)
  } catch (error) {
    ElMessage.error('添加失败: ' + (error.response?.data?.message || error.message))
  }
}

const saveScene = async () => {
  if (!currentScene.value || !currentScene.value.id) return
  
  try {
    await sceneApi.update(currentScene.value.id, {
      name: currentScene.value.name,
      description: currentScene.value.description,
      imageUrl: currentScene.value.imageUrl
    })
  } catch (error) {
    ElMessage.error('保存失败: ' + (error.response?.data?.message || error.message))
  }
}

const deleteScene = async (scene) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除场景"${scene.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await sceneApi.delete(scene.id)
    ElMessage.success('删除成功')
    scenes.value = scenes.value.filter(s => s.id !== scene.id)
    if (currentSceneId.value === scene.id) {
      if (scenes.value.length > 0) {
        selectScene(scenes.value[0])
      } else {
        currentSceneId.value = null
        currentScene.value = null
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const addPuzzle = async () => {
  if (!currentScene.value) return
  
  const newPuzzle = {
    name: '新谜题',
    puzzleText: '请输入谜面...',
    solutionMethod: '请输入解谜方式...',
    answer: '',
    unlockCondition: ''
  }
  
  try {
    const res = await puzzleApi.add(currentScene.value.id, newPuzzle)
    ElMessage.success('谜题添加成功')
    if (!currentScene.value.puzzles) currentScene.value.puzzles = []
    currentScene.value.puzzles.push(res.data)
  } catch (error) {
    ElMessage.error('添加失败: ' + (error.response?.data?.message || error.message))
  }
}

const startEditingPuzzle = async (puzzle) => {
  if (editingPuzzleId.value && editingPuzzleId.value !== puzzle.id) {
    try {
      await puzzleApi.stopEditing(editingPuzzleId.value)
    } catch (e) {}
  }
  
  if (lockedPuzzles.value[puzzle.id] && lockedPuzzles.value[puzzle.id].userId !== currentUser.userId) {
    const editor = lockedPuzzles.value[puzzle.id]
    ElMessage.warning(`谜题正在被 ${editor.userName} 编辑，请等待...`)
    return
  }
  
  try {
    await puzzleApi.startEditing(puzzle.id)
    editingPuzzleId.value = puzzle.id
  } catch (error) {
    ElMessage.warning(error.response?.data?.message || '无法开始编辑此谜题')
  }
}

const stopEditingPuzzle = async (puzzle) => {
  if (editingPuzzleId.value === puzzle.id) {
    try {
      await puzzleApi.stopEditing(puzzle.id)
    } catch (e) {}
    editingPuzzleId.value = null
  }
}

const savePuzzle = async (puzzle) => {
  if (!puzzle.id) return
  
  try {
    const res = await puzzleApi.update(puzzle.id, {
      id: puzzle.id,
      name: puzzle.name,
      puzzleText: puzzle.puzzleText,
      solutionMethod: puzzle.solutionMethod,
      answer: puzzle.answer,
      unlockCondition: puzzle.unlockCondition,
      version: puzzle.version,
      orderIndex: puzzle.orderIndex
    })
    
    if (res.data && res.data.version !== undefined) {
      puzzle.version = res.data.version
    }
    
    ElMessage.success({ message: '已保存', duration: 1000 })
  } catch (error) {
    const status = error.response?.status
    const data = error.response?.data
    
    if (status === 409) {
      conflictType.value = data.conflictType || 'conflict'
      conflictMessage.value = data.message || '发生冲突'
      latestPuzzleData.value = data.currentData || null
      conflictPuzzleId.value = puzzle.id
      
      if (conflictType.value === 'version_conflict' && latestPuzzleData.value) {
        showConflictDialog.value = true
      } else {
        ElMessage.error(conflictMessage.value)
      }
    } else {
      ElMessage.error('保存失败: ' + (data?.message || error.message))
    }
  }
}

const refreshPuzzle = async () => {
  if (!conflictPuzzleId.value || !latestPuzzleData.value) return
  
  if (currentScene.value && currentScene.value.puzzles) {
    const index = currentScene.value.puzzles.findIndex(p => p.id === conflictPuzzleId.value)
    if (index !== -1) {
      currentScene.value.puzzles[index] = { ...currentScene.value.puzzles[index], ...latestPuzzleData.value }
    }
  }
  
  const scene = scenes.value.find(s => s.id === currentScene.value?.id)
  if (scene && scene.puzzles) {
    const index = scene.puzzles.findIndex(p => p.id === conflictPuzzleId.value)
    if (index !== -1) {
      scene.puzzles[index] = { ...scene.puzzles[index], ...latestPuzzleData.value }
    }
  }
  
  closeConflictDialog()
  ElMessage.success('已刷新到最新数据')
}

const forceOverwrite = async () => {
  if (!conflictPuzzleId.value) return
  
  const puzzle = currentScene.value?.puzzles?.find(p => p.id === conflictPuzzleId.value)
  if (!puzzle) {
    closeConflictDialog()
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要强制覆盖吗？这将丢失其他用户的修改！',
      '确认强制覆盖',
      {
        confirmButtonText: '强制覆盖',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await puzzleApi.forceUpdate(puzzle.id, {
      id: puzzle.id,
      name: puzzle.name,
      puzzleText: puzzle.puzzleText,
      solutionMethod: puzzle.solutionMethod,
      answer: puzzle.answer,
      unlockCondition: puzzle.unlockCondition,
      orderIndex: puzzle.orderIndex
    })
    
    if (res.data && res.data.version !== undefined) {
      puzzle.version = res.data.version
    }
    
    closeConflictDialog()
    ElMessage.success('强制覆盖成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败: ' + (error.response?.data?.message || error.message))
    }
  }
}

const closeConflictDialog = () => {
  showConflictDialog.value = false
  conflictType.value = ''
  conflictMessage.value = ''
  latestPuzzleData.value = null
  conflictPuzzleId.value = null
}

const deletePuzzle = async (puzzle) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除谜题"${puzzle.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await puzzleApi.delete(puzzle.id)
    ElMessage.success('删除成功')
    if (currentScene.value && currentScene.value.puzzles) {
      currentScene.value.puzzles = currentScene.value.puzzles.filter(p => p.id !== puzzle.id)
    }
    delete lockedPuzzles.value[puzzle.id]
    if (editingPuzzleId.value === puzzle.id) {
      editingPuzzleId.value = null
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const exportScript = () => {
  scriptApi.export(scriptId.value)
}

const goToTest = () => {
  router.push(`/scripts/${scriptId.value}/test`)
}

const goBack = () => {
  if (editingPuzzleId.value) {
    try {
      puzzleApi.stopEditing(editingPuzzleId.value)
    } catch (e) {}
  }
  router.push('/')
}

onMounted(async () => {
  await loadScript()
  connectWebSocket()
})

onUnmounted(() => {
  if (editingPuzzleId.value) {
    try {
      puzzleApi.stopEditing(editingPuzzleId.value)
    } catch (e) {}
  }
  disconnectWebSocket()
})
</script>

<style scoped>
.editor-page {
  min-height: 100vh;
}

.editor-header {
  background: white;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.script-title {
  margin: 0;
  font-size: 18px;
}

.scene-sidebar {
  background: #f8f9fa;
  border-right: 1px solid #eee;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  font-weight: bold;
}

.scene-list {
  padding: 10px;
}

.scene-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.scene-item:hover {
  border-color: #409eff;
}

.scene-item.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.scene-info {
  flex: 1;
  min-width: 0;
}

.scene-index {
  display: block;
  font-size: 12px;
  color: #999;
}

.scene-name {
  display: block;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-actions {
  margin-left: 10px;
}

.editor-main {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

.scene-card, .puzzle-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
}

.puzzle-list {
  max-height: 600px;
  overflow-y: auto;
}

.puzzle-item {
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  transition: all 0.2s;
}

.puzzle-item.puzzle-locked {
  background: #fff7e6;
  border-color: #e6a23c;
}

.puzzle-item.puzzle-editing {
  background: #ecf5ff;
  border-color: #409eff;
}

.puzzle-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.puzzle-order {
  font-weight: bold;
  color: #409eff;
  min-width: 60px;
}

.puzzle-status {
  display: flex;
  align-items: center;
}

.puzzle-form {
  margin-bottom: 0;
}

.conflict-comparison {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.conflict-comparison pre {
  font-family: inherit;
  font-size: inherit;
}
</style>
