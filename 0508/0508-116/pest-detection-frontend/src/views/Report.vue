<template>
  <div class="report-container">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button @click="$router.push('/farmer')">
            <el-icon><ArrowLeft /></el-icon> 返回
          </el-button>
          <span class="title" style="margin-left: 10px">上报病虫害</span>
        </div>
      </el-header>

      <el-main class="main-content">
        <el-row :gutter="20">
          <el-col :span="14" :offset="1">
            <el-card>
              <template #header>
                <div class="card-header">
                  <el-icon><Edit /></el-icon>
                  <span>上报病虫害</span>
                </div>
              </template>
              <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="作物类型" prop="cropType">
                  <el-select v-model="form.cropType" placeholder="请选择作物类型" style="width: 100%" @change="searchKnowledge">
                    <el-option label="水稻" value="水稻" />
                    <el-option label="玉米" value="玉米" />
                    <el-option label="小麦" value="小麦" />
                    <el-option label="棉花" value="棉花" />
                    <el-option label="大豆" value="大豆" />
                    <el-option label="其他" value="其他" />
                  </el-select>
                </el-form-item>

                <el-form-item label="症状描述" prop="description">
                  <el-input
                    v-model="form.description"
                    type="textarea"
                    :rows="4"
                    placeholder="请详细描述病虫害症状"
                    @input="searchKnowledge"
                  />
                </el-form-item>

                <el-form-item label="发生面积" prop="area">
                  <el-input-number
                    v-model="form.area"
                    :min="0.01"
                    :precision="2"
                    :step="0.1"
                    style="width: 100%"
                  />
                  <span style="margin-left: 10px; color: #909399">亩</span>
                </el-form-item>

                <el-form-item label="上传图片">
                  <el-upload
                    v-model:file-list="fileList"
                    :auto-upload="false"
                    :limit="3"
                    :on-exceed="handleExceed"
                    list-type="picture-card"
                    accept="image/*"
                  >
                    <el-icon><Plus /></el-icon>
                    <template #tip>
                      <div class="el-upload__tip">最多上传3张图片</div>
                    </template>
                  </el-upload>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" style="width: 100%" @click="submit" :loading="loading">
                    提交上报
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="knowledge-panel">
              <template #header>
                <div class="card-header">
                  <el-icon><Search /></el-icon>
                  <span>知识库搜索</span>
                  <el-tag type="info" size="small" v-if="form.cropType">
                    {{ form.cropType }}
                  </el-tag>
                </div>
              </template>

              <div class="search-box">
                <el-input
                  v-model="searchKeyword"
                  placeholder="输入症状关键词搜索"
                  clearable
                  @input="searchKnowledge"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>

              <el-empty
                v-if="!knowledgeLoading && knowledgeList.length === 0"
                description="选择作物或输入关键词搜索防治手册"
              />

              <div v-else class="knowledge-list">
                <el-card
                  v-for="item in knowledgeList"
                  :key="item.id"
                  class="knowledge-item"
                  @click="viewKnowledge(item)"
                  shadow="hover"
                >
                  <div class="item-header">
                    <span class="item-title">{{ item.title }}</span>
                    <el-tag size="small" type="success">
                      {{ item.pestName || '通用' }}
                    </el-tag>
                  </div>
                  <div class="item-content">
                    {{ item.content.substring(0, 80) }}{{ item.content.length > 80 ? '...' : '' }}
                  </div>
                  <div class="item-footer">
                    <el-icon><User /></el-icon>
                    <span>{{ item.expertName }}</span>
                    <el-icon style="margin-left: 12px"><View /></el-icon>
                    <span>{{ item.viewCount }}</span>
                  </div>
                </el-card>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>

    <el-dialog v-model="knowledgeDetailVisible" title="知识库详情" width="600px">
      <div v-if="currentKnowledge" class="knowledge-detail">
        <div class="detail-header">
          <h3>{{ currentKnowledge.title }}</h3>
          <div class="detail-meta">
            <el-tag size="small">{{ currentKnowledge.cropType }}</el-tag>
            <el-tag v-if="currentKnowledge.pestName" type="warning" size="small">
              {{ currentKnowledge.pestName }}
            </el-tag>
            <span style="color: #909399; font-size: 12px; margin-left: 8px">
              专家：{{ currentKnowledge.expertName }}
            </span>
          </div>
        </div>
        <el-divider />
        <div class="detail-content">{{ currentKnowledge.content }}</div>
        <div class="detail-footer">
          <span style="color: #909399; font-size: 12px">
            浏览量：{{ currentKnowledge.viewCount }} | 更新时间：{{ formatTime(currentKnowledge.updateTime) }}
          </span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createReport } from '@/api/report'
import { searchKnowledge as apiSearchKnowledge, getKnowledgeById } from '@/api/knowledge'
import { ElMessage } from 'element-plus'

let searchTimer = null

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const fileList = ref([])
const user = JSON.parse(localStorage.getItem('user'))

const form = reactive({
  farmerId: user?.id,
  cropType: '',
  description: '',
  area: 1
})

const searchKeyword = ref('')
const knowledgeList = ref([])
const knowledgeLoading = ref(false)
const knowledgeDetailVisible = ref(false)
const currentKnowledge = ref(null)

const rules = {
  cropType: [{ required: true, message: '请选择作物类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入症状描述', trigger: 'blur' }],
  area: [{ required: true, message: '请输入发生面积', trigger: 'blur' }]
}

const handleExceed = (files, fileLists) => {
  ElMessage.warning('最多上传3张图片')
}

const searchKnowledge = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(async () => {
    if (!form.cropType && !searchKeyword.value && !form.description) {
      knowledgeList.value = []
      return
    }
    knowledgeLoading.value = true
    try {
      const keyword = searchKeyword.value || form.description || ''
      const res = await apiSearchKnowledge(keyword, form.cropType)
      knowledgeList.value = res.data
    } catch (e) {
      console.error(e)
    } finally {
      knowledgeLoading.value = false
    }
  }, 300)
}

const viewKnowledge = async (item) => {
  const res = await getKnowledgeById(item.id)
  currentKnowledge.value = res.data
  knowledgeDetailVisible.value = true
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const submit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('data', new Blob([JSON.stringify(form)], { type: 'application/json' }))
    fileList.value.forEach((file) => {
      if (file.raw) {
        formData.append('images', file.raw)
      }
    })

    await createReport(formData)
    ElMessage.success('上报成功')
    router.push('/farmer')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.report-container {
  min-height: 100vh;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.main-content {
  padding: 20px 40px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.card-header .el-tag {
  margin-left: auto;
}

.knowledge-panel {
  height: calc(100vh - 120px);
  overflow-y: auto;
}

.search-box {
  margin-bottom: 16px;
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-item {
  cursor: pointer;
  transition: all 0.3s;
}

.knowledge-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-title {
  font-weight: bold;
  color: #303133;
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-content {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.item-footer {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 12px;
}

.knowledge-detail .detail-header h3 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 20px;
}

.knowledge-detail .detail-meta {
  display: flex;
  align-items: center;
}

.knowledge-detail .detail-content {
  color: #606266;
  line-height: 1.8;
  font-size: 14px;
  white-space: pre-wrap;
}

.knowledge-detail .detail-footer {
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}
</style>