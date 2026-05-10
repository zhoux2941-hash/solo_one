<template>
  <div class="experiments-page">
    <div class="page-header">
      <h2 class="page-title">实验方案管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建实验方案
      </el-button>
    </div>

    <el-card v-loading="loading">
      <el-table :data="experiments" style="width: 100%">
        <el-table-column prop="name" label="方案名称" min-width="200" />
        <el-table-column prop="createdBy" label="创建者" width="120" />
        <el-table-column label="任务数" width="100">
          <template #default="{ row }">
            {{ row.tasks?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="isShared" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isShared" type="success">已分享</el-tag>
            <el-tag v-else type="info">私有</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="shareCode" label="分享码" width="150">
          <template #default="{ row }">
            <span v-if="row.isShared">{{ row.shareCode }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewExperiment(row.id)">
              查看
            </el-button>
            <el-button type="success" link @click="shareExperiment(row)" v-if="!row.isShared">
              分享
            </el-button>
            <el-button type="danger" link @click="deleteExperiment(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && experiments.length === 0" description="暂无实验方案" />
    </el-card>

    <el-dialog v-model="showCreateDialog" title="创建实验方案" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="方案名称">
          <el-input v-model="createForm.name" placeholder="请输入方案名称" />
        </el-form-item>
        <el-form-item label="选择试管架">
          <el-select v-model="createForm.tubeRackId" placeholder="请选择试管架" style="width: 100%">
            <el-option
              v-for="rack in tubeRacks"
              :key="rack.id"
              :label="`${rack.name} (${rack.rows}×${rack.columns})`"
              :value="rack.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建者">
          <el-input v-model="createForm.createdBy" placeholder="请输入您的名字" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入实验描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createExperiment">创建</el-button>
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
const experiments = ref([])
const tubeRacks = ref([])
const showCreateDialog = ref(false)
const createForm = ref({
  name: '',
  tubeRackId: null,
  createdBy: '',
  description: ''
})

onMounted(async () => {
  await loadAll()
})

const loadAll = async () => {
  loading.value = true
  try {
    await Promise.all([loadExperiments(), loadTubeRacks()])
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
}

const loadExperiments = async () => {
  const response = await store.loadExperiments()
  if (response.success) {
    experiments.value = response.data
  }
}

const loadTubeRacks = async () => {
  const response = await store.loadTubeRacks()
  if (response.success) {
    tubeRacks.value = response.data
  }
}

const createExperiment = async () => {
  if (!createForm.value.name || !createForm.value.tubeRackId) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    const response = await store.createExperiment(createForm.value)
    if (response.success) {
      ElMessage.success('创建成功')
      showCreateDialog.value = false
      await loadExperiments()
      createForm.value = { name: '', tubeRackId: null, createdBy: '', description: '' }
    }
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

const viewExperiment = (id) => {
  router.push(`/experiments/${id}`)
}

const shareExperiment = async (row) => {
  try {
    const response = await store.shareExperiment(row.id)
    if (response.success) {
      ElMessage.success(`分享成功，分享码: ${response.data.shareCode}`)
      await loadExperiments()
    }
  } catch (e) {
    ElMessage.error('分享失败')
  }
}

const deleteExperiment = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除此实验方案吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const response = await store.deleteExperiment(id)
    if (response.success) {
      ElMessage.success('删除成功')
      await loadExperiments()
    }
  } catch {
  }
}
</script>

<style scoped lang="scss">
.experiments-page {
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
}
</style>