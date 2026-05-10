<template>
  <div class="tube-racks-page">
    <div class="page-header">
      <h2 class="page-title">试管架管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建试管架
      </el-button>
    </div>

    <el-card v-loading="loading">
      <el-row :gutter="20">
        <el-col :span="6" v-for="rack in tubeRacks" :key="rack.id">
          <el-card class="rack-card" shadow="hover" @click="goToDetail(rack.id)">
            <div class="rack-preview">
              <div 
                class="preview-grid"
                :style="{ 
                  gridTemplateColumns: `repeat(${Math.min(rack.columns, 8)}, 1fr)`,
                  gridTemplateRows: `repeat(${Math.min(rack.rows, 6)}, 1fr)`
                }"
              >
                <div
                  v-for="i in Math.min(rack.rows * rack.columns, 48)"
                  :key="i"
                  class="preview-well"
                ></div>
              </div>
            </div>
            <div class="rack-info">
              <h4>{{ rack.name }}</h4>
              <p>{{ rack.rows }} × {{ rack.columns }} 孔</p>
              <p class="update-time">{{ formatTime(rack.updatedAt) }}</p>
            </div>
            <div class="rack-actions" @click.stop>
              <el-button type="danger" link size="small" @click="deleteRack(rack.id)">
                删除
              </el-button>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6" v-if="tubeRacks.length === 0">
          <el-empty description="暂无试管架" />
        </el-col>
      </el-row>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="创建新试管架" width="400px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="createForm.name" placeholder="请输入试管架名称" />
        </el-form-item>
        <el-form-item label="行数">
          <el-input-number v-model="createForm.rows" :min="1" :max="12" />
        </el-form-item>
        <el-form-item label="列数">
          <el-input-number v-model="createForm.columns" :min="1" :max="12" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createTubeRack">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const store = useAppStore()

const loading = ref(false)
const tubeRacks = ref([])
const showCreateDialog = ref(false)
const createForm = ref({
  name: '新试管架',
  rows: 6,
  columns: 8
})

onMounted(async () => {
  await loadTubeRacks()
})

const loadTubeRacks = async () => {
  loading.value = true
  try {
    const response = await store.loadTubeRacks()
    if (response.success) {
      tubeRacks.value = response.data
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
}

const createTubeRack = async () => {
  try {
    const response = await store.createTubeRack(createForm.value)
    if (response.success) {
      ElMessage.success('创建成功')
      showCreateDialog.value = false
      await loadTubeRacks()
      createForm.value = { name: '新试管架', rows: 6, columns: 8 }
    }
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

const goToDetail = (id) => {
  router.push(`/tube-racks/${id}`)
}

const deleteRack = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除此试管架吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const response = await store.deleteTubeRack(id)
    if (response.success) {
      ElMessage.success('删除成功')
      await loadTubeRacks()
    }
  } catch {
  }
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}
</script>

<style scoped lang="scss">
.tube-racks-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .page-title {
      margin: 0;
      font-size: 22px;
      color: #303133;
    }
  }
  
  .rack-card {
    margin-bottom: 20px;
    cursor: pointer;
    position: relative;
    
    .rack-preview {
      background: #f5f7fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      
      .preview-grid {
        display: grid;
        gap: 3px;
        
        .preview-well {
          width: 100%;
          aspect-ratio: 1;
          background: #e4e7ed;
          border-radius: 50%;
        }
      }
    }
    
    .rack-info {
      h4 {
        margin: 0 0 5px 0;
        font-size: 16px;
        color: #303133;
      }
      
      p {
        margin: 0;
        font-size: 13px;
        color: #606266;
      }
      
      .update-time {
        margin-top: 8px;
        font-size: 12px;
        color: #909399;
      }
    }
    
    .rack-actions {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }
}
</style>