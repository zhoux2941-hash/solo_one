<template>
  <div class="intents-page">
    <div class="flex space-between items-center mb-20">
      <h2 class="page-title">我的交换意向</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        发布交换意向
      </el-button>
    </div>

    <el-empty v-if="!intents.length" description="你还没有发布交换意向" />
    <div v-else class="intent-list">
      <el-card v-for="intent in intents" :key="intent.id" shadow="hover" class="intent-card">
        <div class="intent-header">
          <el-tag :type="getStatusType(intent.status)" effect="dark">{{ getStatusText(intent.status) }}</el-tag>
          <span class="time">{{ formatTime(intent.createdAt) }}</span>
        </div>
        <div class="intent-content">
          <div class="intent-block">
            <span class="label">我提供：</span>
            <div class="box-preview">
              <div class="mini-image">
                <img v-if="intent.offerBox?.imageUrl" :src="intent.offerBox.imageUrl" />
                <span v-else>{{ intent.offerBox?.seriesName }}</span>
              </div>
              <div class="info">
                <p class="series">{{ intent.offerBox?.seriesName }}</p>
                <p class="style">{{ intent.offerBox?.styleName }}</p>
              </div>
            </div>
          </div>
          <div class="arrow">
            <el-icon><Right /></el-icon>
          </div>
          <div class="intent-block">
            <span class="label">我期望：</span>
            <div class="desired-box">
              <el-tag type="warning">{{ intent.desiredSeries }}</el-tag>
              <el-tag v-if="intent.desiredStyle" type="info">{{ intent.desiredStyle }}</el-tag>
            </div>
          </div>
        </div>
        <div v-if="intent.note" class="note">
          <el-icon><Document /></el-icon>
          <span>备注：{{ intent.note }}</span>
        </div>
        <div class="intent-actions" v-if="intent.status === 'ACTIVE'">
          <el-button type="danger" size="small" @click="cancelIntent(intent)">取消</el-button>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="showAddDialog" title="发布交换意向" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="选择盲盒" prop="offerBoxId">
          <el-select v-model="form.offerBoxId" placeholder="选择你要交换的盲盒" style="width: 100%" filterable>
            <el-option 
              v-for="box in availableBoxes" 
              :key="box.id" 
              :label="`${box.seriesName} - ${box.styleName}`"
              :value="box.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="期望系列" prop="desiredSeries">
          <el-input v-model="form.desiredSeries" placeholder="输入你想要的系列名称（支持模糊匹配）" />
        </el-form-item>
        <el-form-item label="期望款式">
          <el-input v-model="form.desiredStyle" placeholder="指定款式（可选，支持模糊匹配）" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="其他说明（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Right, Document } from '@element-plus/icons-vue'
import { getMyIntents, createIntent, cancelIntent as cancelIntentApi } from '@/api/intent'
import { getMyAvailableBoxes } from '@/api/box'

const intents = ref([])
const availableBoxes = ref([])
const showAddDialog = ref(false)
const formRef = ref()
const loading = ref(false)

const form = reactive({
  offerBoxId: null,
  desiredSeries: '',
  desiredStyle: '',
  note: ''
})

const rules = {
  offerBoxId: [{ required: true, message: '请选择要交换的盲盒', trigger: 'change' }],
  desiredSeries: [{ required: true, message: '请输入期望的系列', trigger: 'blur' }]
}

const getStatusType = (status) => {
  const map = { ACTIVE: 'success', CANCELLED: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { ACTIVE: '进行中', CANCELLED: '已取消' }
  return map[status] || status
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const fetchIntents = async () => {
  try {
    const res = await getMyIntents()
    intents.value = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch (e) {
  }
}

const fetchAvailableBoxes = async () => {
  try {
    const res = await getMyAvailableBoxes()
    availableBoxes.value = res.data
  } catch (e) {
  }
}

const resetForm = () => {
  form.offerBoxId = null
  form.desiredSeries = ''
  form.desiredStyle = ''
  form.note = ''
}

const cancelIntent = async (intent) => {
  ElMessageBox.confirm('确定要取消这个交换意向吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await cancelIntentApi(intent.id)
    ElMessage.success('已取消')
    fetchIntents()
  }).catch(() => {})
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    await createIntent(form)
    ElMessage.success('发布成功，系统将自动为你匹配')
    showAddDialog.value = false
    resetForm()
    fetchIntents()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchIntents()
  fetchAvailableBoxes()
})
</script>

<style scoped>
.intents-page {
  max-width: 1000px;
  margin: 0 auto;
}

.intent-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intent-card :deep(.el-card__body) {
  padding: 20px;
}

.intent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.intent-header .time {
  font-size: 12px;
  color: #999;
}

.intent-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.intent-block {
  flex: 1;
}

.intent-block .label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.box-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.mini-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  overflow: hidden;
}

.mini-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.box-preview .info .series {
  font-size: 14px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.box-preview .info .style {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.arrow {
  color: #667eea;
  font-size: 24px;
}

.desired-box {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.note {
  margin-top: 12px;
  padding: 8px;
  background: #fffbe6;
  border-radius: 4px;
  font-size: 12px;
  color: #e6a23c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.intent-actions {
  margin-top: 12px;
  text-align: right;
}
</style>
