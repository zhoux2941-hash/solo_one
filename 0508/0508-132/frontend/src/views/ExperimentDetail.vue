<template>
  <div class="experiment-detail-page">
    <div class="page-header">
      <div>
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">{{ experiment?.name || '实验方案详情' }}</h2>
        <p v-if="experiment" class="experiment-meta">
          创建者: {{ experiment.createdBy || '-' }} | 
          更新时间: {{ formatTime(experiment.updatedAt) }}
          <el-tag v-if="experiment.isShared" type="success" style="margin-left: 10px">
            分享码: {{ experiment.shareCode }}
          </el-tag>
        </p>
      </div>
      <div>
        <el-button type="warning" @click="goOptimize" :disabled="!hasTasks">
          <el-icon><MagicStick /></el-icon>
          路径优化
        </el-button>
        <el-button type="success" @click="shareExperiment" v-if="!experiment?.isShared">
          <el-icon><Share /></el-icon>
          分享
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>移液任务列表</span>
              <el-button type="primary" size="small" @click="showAddTaskDialog = true">
                <el-icon><Plus /></el-icon>
                添加任务
              </el-button>
            </div>
          </template>
          
          <el-table :data="tasks" style="width: 100%" v-if="hasTasks">
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
            <el-table-column label="操作" width="120">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeTask($index)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无移液任务，请先添加任务" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>实验信息</span>
          </template>
          <el-descriptions :column="1" border v-if="experiment">
            <el-descriptions-item label="试管架">
              {{ experiment.tubeRack?.name || '-' }} ({{ experiment.tubeRack?.rows }}×{{ experiment.tubeRack?.columns }})
            </el-descriptions-item>
            <el-descriptions-item label="任务总数">
              {{ tasks.length }} 个
            </el-descriptions-item>
            <el-descriptions-item label="描述">
              {{ experiment.description || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <span>操作说明</span>
          </template>
          <div class="tips">
            <ul>
              <li>点击"添加任务"添加移液步骤</li>
              <li>选择源孔位和目标孔位</li>
              <li>点击"路径优化"计算最短路径</li>
              <li>可手动调整任务顺序</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAddTaskDialog" title="添加移液任务" width="500px">
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="源孔位">
          <el-select v-model="taskForm.sourceWellId" placeholder="请选择源孔位" style="width: 100%">
            <el-option
              v-for="well in availableWells"
              :key="well.id"
              :label="`${well.label} - ${well.reagentTypeName}`"
              :value="well.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标孔位">
          <el-select v-model="taskForm.targetWellId" placeholder="请选择目标孔位" style="width: 100%">
            <el-option
              v-for="well in availableWells"
              :key="well.id"
              :label="`${well.label} - ${well.reagentTypeName}`"
              :value="well.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="移液体积">
          <el-input-number v-model="taskForm.volumeUl" :min="0" :step="0.1" />
          <span style="margin-left: 10px">μl</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="taskForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTaskDialog = false">取消</el-button>
        <el-button type="primary" @click="addTask">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const experimentId = computed(() => Number(route.params.id))
const experiment = ref(null)
const tasks = ref([])
const showAddTaskDialog = ref(false)
const taskForm = ref({
  sourceWellId: null,
  targetWellId: null,
  volumeUl: 100,
  notes: ''
})

const hasTasks = computed(() => tasks.value.length > 0)
const availableWells = computed(() => experiment.value?.tubeRack?.wells || [])

onMounted(async () => {
  await loadExperiment()
})

const loadExperiment = async () => {
  try {
    const response = await store.loadExperimentById(experimentId.value)
    if (response.success) {
      experiment.value = response.data
      tasks.value = response.data.tasks || []
    }
  } catch (e) {
    console.error('加载失败:', e)
    ElMessage.error('加载失败')
  }
}

const addTask = async () => {
  if (!taskForm.value.sourceWellId || !taskForm.value.targetWellId) {
    ElMessage.warning('请选择源孔位和目标孔位')
    return
  }
  if (taskForm.value.sourceWellId === taskForm.value.targetWellId) {
    ElMessage.warning('源孔位和目标孔位不能相同')
    return
  }
  
  const newTask = { ...taskForm.value }
  const updatedTasks = [...tasks.value, newTask]
  
  try {
    const response = await store.updateExperiment(experimentId.value, {
      tasks: updatedTasks
    })
    if (response.success) {
      ElMessage.success('添加成功')
      showAddTaskDialog.value = false
      tasks.value = response.data.tasks || []
      taskForm.value = { sourceWellId: null, targetWellId: null, volumeUl: 100, notes: '' }
    }
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

const removeTask = async (index) => {
  const updatedTasks = tasks.value.filter((_, i) => i !== index)
  try {
    const response = await store.updateExperiment(experimentId.value, {
      tasks: updatedTasks
    })
    if (response.success) {
      ElMessage.success('删除成功')
      tasks.value = response.data.tasks || []
    }
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const shareExperiment = async () => {
  try {
    const response = await store.shareExperiment(experimentId.value)
    if (response.success) {
      ElMessage.success(`分享成功，分享码: ${response.data.shareCode}`)
      await loadExperiment()
    }
  } catch (e) {
    ElMessage.error('分享失败')
  }
}

const goOptimize = () => {
  router.push({
    path: '/optimize',
    query: { experimentId: experimentId.value }
  })
}

const goBack = () => {
  router.push('/experiments')
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}
</script>

<style scoped lang="scss">
.experiment-detail-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    
    .page-title {
      margin: 0 0 5px 0;
      font-size: 22px;
      color: #303133;
    }
    
    .experiment-meta {
      margin: 0;
      color: #909399;
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .tips {
    font-size: 13px;
    color: #606266;
    
    ul {
      padding-left: 20px;
      margin: 0;
      
      li {
        margin-bottom: 8px;
      }
    }
  }
}
</style>