<template>
  <div class="page-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><User /></el-icon> 个人中心</span>
            </div>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户名">
              {{ userStore.userInfo?.username }}
            </el-descriptions-item>
            <el-descriptions-item label="昵称">
              {{ userStore.userInfo?.nickname }}
            </el-descriptions-item>
            <el-descriptions-item label="身份">
              <el-tag type="success">配音员</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="积分">
              <span class="budget">{{ userStore.userInfo?.balance }} 积分</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><PriceTag /></el-icon> 我的声线标签</span>
              <el-button type="primary" size="small" :disabled="!tagsChanged" @click="saveTags">
                保存修改
              </el-button>
            </div>
          </template>
          
          <div class="tag-section">
            <p class="tag-tip">选择您擅长的声线类型（可多选）：</p>
            <el-checkbox-group v-model="selectedTagIds" @change="onTagsChange">
              <div class="tag-grid">
                <el-checkbox
                  v-for="tag in allTags"
                  :key="tag.id"
                  :label="tag.id"
                  class="tag-item"
                >
                  <span class="tag-name">{{ tag.name }}</span>
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><Headset /></el-icon> 我的作品集（{{ portfolios.length }}/5）</span>
              <el-button
                type="primary"
                size="small"
                :disabled="portfolios.length >= 5"
                @click="showAddDialog = true"
              >
                <el-icon><Plus /></el-icon> 添加作品
              </el-button>
            </div>
          </template>
          
          <el-empty v-if="portfolios.length === 0 && !loading" description="暂无作品集，上传您的代表作来展示实力吧！" />
          
          <div v-else>
            <div
              v-for="item in portfolios"
              :key="item.id"
              class="portfolio-item"
            >
              <div class="portfolio-header">
                <h4 class="portfolio-title">{{ item.title }}</h4>
                <div class="portfolio-actions">
                  <el-button type="primary" link size="small" @click="openEditDialog(item)">
                    编辑
                  </el-button>
                  <el-button type="danger" link size="small" @click="deletePortfolio(item)">
                    删除
                  </el-button>
                </div>
              </div>
              <audio
                controls
                class="audio-player"
                :src="`/api/audio/${item.audioPath}`"
              ></audio>
              <p v-if="item.description" class="portfolio-desc">
                {{ item.description }}
              </p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="showAddDialog"
      title="添加作品集"
      width="500px"
    >
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="作品标题" prop="title">
          <el-input v-model="addForm.title" placeholder="请输入作品标题" maxlength="100" />
        </el-form-item>
        <el-form-item label="作品描述" prop="description">
          <el-input
            v-model="addForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入作品描述（可选）"
            maxlength="500"
          />
        </el-form-item>
        <el-form-item label="音频文件" prop="audioFile">
          <el-upload
            ref="uploadRef"
            drag
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
            accept=".mp3"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 mp3 文件，且不超过 5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="addPortfolio">上传</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showEditDialog"
      title="编辑作品集"
      width="500px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="作品标题" prop="title">
          <el-input v-model="editForm.title" placeholder="请输入作品标题" maxlength="100" />
        </el-form-item>
        <el-form-item label="作品描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入作品描述（可选）"
            maxlength="500"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="editing" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getAllTags, getMyTags, updateMyTags } from '@/api/tag'
import { getMyPortfolio, addPortfolio as apiAddPortfolio, updatePortfolio as apiUpdatePortfolio, deletePortfolio as apiDeletePortfolio } from '@/api/portfolio'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()

const allTags = ref([])
const portfolios = ref([])
const loading = ref(false)
const selectedTagIds = ref([])
const originalTagIds = ref([])

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const uploadRef = ref(null)
const audioFile = ref(null)
const submitting = ref(false)
const editing = ref(false)

const addForm = reactive({
  title: '',
  description: ''
})

const editForm = reactive({
  id: null,
  title: '',
  description: ''
})

const tagsChanged = computed(() => {
  if (originalTagIds.value.length !== selectedTagIds.value.length) return true
  const sorted1 = [...originalTagIds.value].sort()
  const sorted2 = [...selectedTagIds.value].sort()
  return JSON.stringify(sorted1) !== JSON.stringify(sorted2)
})

async function fetchAllTags() {
  try {
    const res = await getAllTags()
    allTags.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function fetchMyTags() {
  try {
    const res = await getMyTags()
    selectedTagIds.value = res.data.map(tag => tag.id)
    originalTagIds.value = [...selectedTagIds.value]
  } catch (e) {
    console.error(e)
  }
}

async function fetchPortfolios() {
  loading.value = true
  try {
    const res = await getMyPortfolio()
    portfolios.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function onTagsChange() {
}

async function saveTags() {
  try {
    await updateMyTags(selectedTagIds.value.length > 0 ? selectedTagIds.value : [])
    originalTagIds.value = [...selectedTagIds.value]
    ElMessage.success('标签保存成功')
  } catch (e) {
    console.error(e)
  }
}

function handleFileChange(file) {
  audioFile.value = file.raw
}

function handleExceed() {
  ElMessage.warning('只能上传一个文件')
}

async function addPortfolio() {
  if (!addForm.title.trim()) {
    ElMessage.warning('请输入作品标题')
    return
  }
  if (!audioFile.value) {
    ElMessage.warning('请上传音频文件')
    return
  }

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('title', addForm.title)
    if (addForm.description) {
      formData.append('description', addForm.description)
    }
    formData.append('audioFile', audioFile.value)

    await apiAddPortfolio(formData)
    ElMessage.success('作品上传成功')
    showAddDialog.value = false
    resetAddForm()
    fetchPortfolios()
  } finally {
    submitting.value = false
  }
}

function resetAddForm() {
  addForm.title = ''
  addForm.description = ''
  audioFile.value = null
  uploadRef.value?.clearFiles()
}

function openEditDialog(item) {
  editForm.id = item.id
  editForm.title = item.title
  editForm.description = item.description || ''
  showEditDialog.value = true
}

async function saveEdit() {
  if (!editForm.title.trim()) {
    ElMessage.warning('请输入作品标题')
    return
  }

  editing.value = true
  try {
    await apiUpdatePortfolio(editForm.id, editForm.title, editForm.description)
    ElMessage.success('作品更新成功')
    showEditDialog.value = false
    fetchPortfolios()
  } finally {
    editing.value = false
  }
}

async function deletePortfolio(item) {
  try {
    await ElMessageBox.confirm(
      `确定要删除作品【${item.title}】吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    await apiDeletePortfolio(item.id)
    ElMessage.success('作品删除成功')
    fetchPortfolios()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

onMounted(() => {
  fetchAllTags()
  fetchMyTags()
  fetchPortfolios()
})
</script>

<style scoped>
.tag-section {
  padding: 10px 0;
}

.tag-tip {
  color: #909399;
  font-size: 14px;
  margin-bottom: 15px;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.tag-item {
  margin: 0;
  padding: 10px 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  transition: all 0.3s;
}

.tag-item:hover {
  border-color: #409eff;
}

.tag-name {
  font-size: 14px;
}

.budget {
  color: #f56c6c;
  font-weight: bold;
}

.portfolio-item {
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 15px;
}

.portfolio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.portfolio-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.portfolio-actions {
  display: flex;
  gap: 10px;
}

.portfolio-desc {
  color: #909399;
  font-size: 14px;
  margin: 10px 0 0;
  line-height: 1.6;
}
</style>
