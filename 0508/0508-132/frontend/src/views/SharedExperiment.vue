<template>
  <div class="shared-experiment-page">
    <el-row :justify="center">
      <el-col :span="16">
        <el-card v-loading="loading">
          <template v-if="experiment">
            <template #header>
              <div class="card-header">
                <h2>{{ experiment.name }}</h2>
                <el-tag type="success">分享的实验方案</el-tag>
              </div>
            </template>
            
            <el-descriptions :column="2" border>
              <el-descriptions-item label="创建者">
                {{ experiment.createdBy || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="分享码">
                <el-tag>{{ shareCode }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="试管架">
                {{ experiment.tubeRack?.name || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="任务数">
                {{ experiment.tasks?.length || 0 }} 个
              </el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">
                {{ experiment.description || '-' }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="tasks-section" v-if="experiment.tasks?.length > 0">
              <h3>移液任务列表</h3>
              <el-table :data="experiment.tasks" style="width: 100%">
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column label="源孔位" min-width="150">
                  <template #default="{ row }">
                    <el-tag>{{ row.sourceWellLabel || `[${row.sourceRow},${row.sourceCol}]` }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="目标孔位" min-width="150">
                  <template #default="{ row }">
                    <el-tag type="success">{{ row.targetWellLabel || `[${row.targetRow},${row.targetCol}]` }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="volumeUl" label="体积(μl)" width="120">
                  <template #default="{ row }">
                    {{ row.volumeUl || '-' }}
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="actions">
              <el-button type="primary" @click="importExperiment">
                <el-icon><Download /></el-icon>
                导入为我的方案
              </el-button>
              <el-button @click="goHome">
                <el-icon><House /></el-icon>
                返回首页
              </el-button>
            </div>
          </template>

          <template v-else-if="!loading">
            <el-empty description="分享码无效或已过期">
              <el-button type="primary" @click="goHome">返回首页</el-button>
            </el-empty>
          </template>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { experimentApi } from '@/services/api'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const shareCode = ref('')
const loading = ref(false)
const experiment = ref(null)

onMounted(async () => {
  shareCode.value = route.params.code?.toUpperCase() || ''
  if (shareCode.value) {
    await loadSharedExperiment()
  }
})

const loadSharedExperiment = async () => {
  loading.value = true
  try {
    const response = await experimentApi.getByShareCode(shareCode.value)
    if (response.success) {
      experiment.value = response.data
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
}

const importExperiment = async () => {
  if (!experiment.value) return
  try {
    const response = await store.createExperiment({
      name: experiment.value.name + ' (副本)',
      tubeRackId: experiment.value.tubeRackId,
      description: `从分享码 ${shareCode.value} 导入\n${experiment.value.description || ''}`,
      tasks: experiment.value.tasks
    })
    if (response.success) {
      ElMessage.success('导入成功！')
      router.push(`/experiments/${response.data.id}`)
    }
  } catch (e) {
    ElMessage.error('导入失败')
  }
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.shared-experiment-page {
  padding-top: 40px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h2 {
      margin: 0;
      font-size: 20px;
    }
  }
  
  .tasks-section {
    margin-top: 20px;
    
    h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #303133;
    }
  }
  
  .actions {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: center;
  }
}
</style>