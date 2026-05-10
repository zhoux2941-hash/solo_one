<template>
  <div class="expert-container">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon :size="28" color="#67c23a"><Bug /></el-icon>
          <span class="title">专家工作台</span>
        </div>
        <div class="header-right">
          <span class="user-info">{{ user.name }} ({{ user.phone }})</span>
          <el-button size="small" @click="logout">退出</el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="待诊断列表" name="diagnosis">
            <el-card>
              <template #header>
                <div class="card-header">
                  <el-icon><Clock /></el-icon>
                  <span>待诊断列表</span>
                  <el-tag type="warning" v-if="list.length > 0">{{ list.length }} 条待诊断</el-tag>
                </div>
              </template>
              <el-table :data="list" v-loading="loading" stripe>
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="farmerName" label="农户" width="120" />
                <el-table-column prop="farmerPhone" label="联系电话" width="140" />
                <el-table-column prop="cropType" label="作物类型" width="120" />
                <el-table-column prop="description" label="症状描述" show-overflow-tooltip />
                <el-table-column prop="area" label="面积(亩)" width="100" />
                <el-table-column prop="images" label="图片" width="150">
                  <template #default="{ row }">
                    <el-image
                      v-if="row.images && row.images.length > 0"
                      :src="row.images[0]"
                      :preview-src-list="row.images"
                      style="width: 50px; height: 50px"
                      fit="cover"
                    />
                    <span v-else style="color: #909399">无</span>
                  </template>
                </el-table-column>
                <el-table-column prop="reportTime" label="上报时间" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.reportTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="openDiagnose(row)">
                      诊断
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="!loading && list.length === 0" description="暂无待诊断记录" />
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="知识库管理" name="knowledge">
            <el-card>
              <template #header>
                <div class="card-header">
                  <el-icon><Reading /></el-icon>
                  <span>我的知识库</span>
                  <el-button type="primary" size="small" @click="openKnowledgeForm(null)">
                    <el-icon><Plus /></el-icon> 新建手册
                  </el-button>
                </div>
              </template>
              <el-table :data="knowledgeList" v-loading="knowledgeLoading" stripe>
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
                <el-table-column prop="cropType" label="适用作物" width="120">
                  <template #default="{ row }">
                    <el-tag size="small">{{ row.cropType }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="pestName" label="病虫害" width="150" show-overflow-tooltip />
                <el-table-column prop="viewCount" label="浏览量" width="100">
                  <template #default="{ row }">
                    <el-tag type="info" size="small">{{ row.viewCount }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="updateTime" label="更新时间" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.updateTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="180">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="viewKnowledge(row)">
                      查看
                    </el-button>
                    <el-button type="primary" link size="small" @click="openKnowledgeForm(row)">
                      编辑
                    </el-button>
                    <el-button type="danger" link size="small" @click="handleDeleteKnowledge(row)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="!knowledgeLoading && knowledgeList.length === 0" description="暂无知识库，点击上方按钮创建" />
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>

    <el-dialog v-model="diagnoseVisible" title="诊断" width="700px">
      <div v-if="currentReport" class="diagnose-content">
        <el-alert type="info" show-icon style="margin-bottom: 20px">
          <template #title>上报信息</template>
          <div>农户：{{ currentReport.farmerName }} | 作物：{{ currentReport.cropType }} | 面积：{{ currentReport.area }}亩</div>
          <div style="margin-top: 5px">症状：{{ currentReport.description }}</div>
          <div style="margin-top: 10px" v-if="currentReport.images && currentReport.images.length > 0">
            <el-image
              v-for="(img, idx) in currentReport.images"
              :key="idx"
              :src="img"
              :preview-src-list="currentReport.images"
              style="width: 80px; height: 80px; margin-right: 10px"
              fit="cover"
            />
          </div>
        </el-alert>

        <el-form ref="formRef" :model="diagnoseForm" :rules="rules" label-width="100px">
          <el-form-item label="病虫害名称" prop="pestName">
            <el-input v-model="diagnoseForm.pestName" placeholder="例如：稻飞虱、纹枯病" />
          </el-form-item>
          <el-form-item label="严重程度" prop="severity">
            <el-radio-group v-model="diagnoseForm.severity">
              <el-radio value="LIGHT"><el-tag type="success">轻度</el-tag></el-radio>
              <el-radio value="MEDIUM"><el-tag type="warning">中度</el-tag></el-radio>
              <el-radio value="SEVERE"><el-tag type="danger">重度</el-tag></el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="诊断说明" prop="diagnosisText">
            <el-input
              v-model="diagnoseForm.diagnosisText"
              type="textarea"
              :rows="3"
              placeholder="请详细描述诊断结果"
            />
          </el-form-item>
          <el-form-item label="用药建议" prop="medicineSuggestion">
            <el-input
              v-model="diagnoseForm.medicineSuggestion"
              type="textarea"
              :rows="3"
              placeholder="请给出用药建议"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="diagnoseVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDiagnose" :loading="diagnoseLoading">
          提交诊断
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="knowledgeFormVisible"
      :title="editingKnowledge ? '编辑知识库' : '新建知识库'"
      width="650px"
    >
      <el-form ref="knowledgeFormRef" :model="knowledgeForm" :rules="knowledgeRules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="knowledgeForm.title" placeholder="例如：水稻稻飞虱防治手册" />
        </el-form-item>
        <el-form-item label="适用作物" prop="cropType">
          <el-select v-model="knowledgeForm.cropType" placeholder="请选择" style="width: 100%">
            <el-option label="水稻" value="水稻" />
            <el-option label="玉米" value="玉米" />
            <el-option label="小麦" value="小麦" />
            <el-option label="棉花" value="棉花" />
            <el-option label="大豆" value="大豆" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="病虫害名称" prop="pestName">
          <el-input v-model="knowledgeForm.pestName" placeholder="例如：稻飞虱、纹枯病" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="knowledgeForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入详细的防治内容，包括症状、防治方法、用药建议等"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="knowledgeFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitKnowledge" :loading="knowledgeLoading">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="knowledgeDetailVisible" title="知识库详情" width="650px">
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
        <div class="detail-content" v-html="formatContent(currentKnowledge.content)"></div>
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
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getPendingList, diagnoseReport } from '@/api/report'
import {
  createKnowledge,
  updateKnowledge,
  deleteKnowledge as apiDeleteKnowledge,
  getKnowledgeByExpert,
  getKnowledgeById
} from '@/api/knowledge'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('user')))
const activeTab = ref('diagnosis')
const list = ref([])
const loading = ref(false)
const diagnoseVisible = ref(false)
const diagnoseLoading = ref(false)
const formRef = ref()
const currentReport = ref(null)

const knowledgeList = ref([])
const knowledgeLoading = ref(false)
const knowledgeFormVisible = ref(false)
const knowledgeFormRef = ref()
const knowledgeDetailVisible = ref(false)
const editingKnowledge = ref(null)
const currentKnowledge = ref(null)

const diagnoseForm = reactive({
  expertId: user.value?.id,
  diagnosisText: '',
  pestName: '',
  medicineSuggestion: '',
  severity: 'MEDIUM'
})

const knowledgeForm = reactive({
  expertId: user.value?.id,
  title: '',
  cropType: '',
  pestName: '',
  content: ''
})

const rules = {
  pestName: [{ required: true, message: '请输入病虫害名称', trigger: 'blur' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  diagnosisText: [{ required: true, message: '请输入诊断说明', trigger: 'blur' }],
  medicineSuggestion: [{ required: true, message: '请输入用药建议', trigger: 'blur' }]
}

const knowledgeRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  cropType: [{ required: true, message: '请选择适用作物', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await getPendingList()
    list.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadKnowledgeList = async () => {
  knowledgeLoading.value = true
  try {
    const res = await getKnowledgeByExpert(user.value.id)
    knowledgeList.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    knowledgeLoading.value = false
  }
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const formatContent = (content) => {
  if (!content) return ''
  return content.replace(/\n/g, '<br/>')
}

const openDiagnose = (row) => {
  currentReport.value = row
  diagnoseForm.expertId = user.value.id
  diagnoseForm.diagnosisText = ''
  diagnoseForm.pestName = ''
  diagnoseForm.medicineSuggestion = ''
  diagnoseForm.severity = 'MEDIUM'
  diagnoseVisible.value = true
}

const submitDiagnose = async () => {
  await formRef.value.validate()
  diagnoseLoading.value = true
  try {
    await diagnoseReport(currentReport.value.id, diagnoseForm)
    ElMessage.success('诊断提交成功')
    diagnoseVisible.value = false
    loadList()
  } catch (e) {
    console.error(e)
  } finally {
    diagnoseLoading.value = false
  }
}

const openKnowledgeForm = (item) => {
  editingKnowledge.value = item
  if (item) {
    knowledgeForm.expertId = user.value.id
    knowledgeForm.title = item.title
    knowledgeForm.cropType = item.cropType
    knowledgeForm.pestName = item.pestName || ''
    knowledgeForm.content = item.content
  } else {
    knowledgeForm.expertId = user.value.id
    knowledgeForm.title = ''
    knowledgeForm.cropType = ''
    knowledgeForm.pestName = ''
    knowledgeForm.content = ''
  }
  knowledgeFormVisible.value = true
}

const submitKnowledge = async () => {
  await knowledgeFormRef.value.validate()
  knowledgeLoading.value = true
  try {
    if (editingKnowledge.value) {
      await updateKnowledge(editingKnowledge.value.id, knowledgeForm)
      ElMessage.success('更新成功')
    } else {
      await createKnowledge(knowledgeForm)
      ElMessage.success('创建成功')
    }
    knowledgeFormVisible.value = false
    loadKnowledgeList()
  } catch (e) {
    console.error(e)
  } finally {
    knowledgeLoading.value = false
  }
}

const handleDeleteKnowledge = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定删除知识库"${item.title}"吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await apiDeleteKnowledge(item.id)
    ElMessage.success('删除成功')
    loadKnowledgeList()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

const viewKnowledge = async (item) => {
  const res = await getKnowledgeById(item.id)
  currentKnowledge.value = res.data
  knowledgeDetailVisible.value = true
}

const logout = () => {
  localStorage.removeItem('user')
  router.push('/home')
}

watch(activeTab, (newVal) => {
  if (newVal === 'knowledge') {
    loadKnowledgeList()
  }
})

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.expert-container {
  min-height: 100vh;
}

.header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  color: #606266;
  font-size: 14px;
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

.diagnose-content :deep(.el-radio) {
  margin-right: 20px;
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