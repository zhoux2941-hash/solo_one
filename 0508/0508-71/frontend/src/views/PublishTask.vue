<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><Plus /></el-icon> 发布配音任务</span>
        </div>
      </template>
      
      <el-form
        :model="taskForm"
        :rules="rules"
        ref="formRef"
        label-width="100px"
        class="submit-form"
      >
        <el-form-item label="任务标题" prop="title">
          <el-input
            v-model="taskForm.title"
            placeholder="请输入任务标题（最多100字）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="配音内容" prop="content">
          <el-input
            v-model="taskForm.content"
            type="textarea"
            :rows="5"
            placeholder="请输入需要配音的文字内容（最多200字）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="时长要求" prop="duration">
          <el-input
            v-model="taskForm.duration"
            placeholder="例如：30秒内、1-2分钟等"
          />
        </el-form-item>

        <el-form-item label="预算（积分）" prop="budget">
          <el-input-number
            v-model="taskForm.budget"
            :min="1"
            :max="100000"
            :step="10"
            style="width: 200px"
          />
          <span class="tip">当前余额：{{ userStore.userInfo?.balance }} 积分</span>
        </el-form-item>

        <el-form-item label="需要声线">
          <div class="tag-section">
            <p class="tag-tip">选择需要的声线类型（可多选）：</p>
            <el-checkbox-group v-model="taskForm.tagIds">
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
        </el-form-item>

        <el-form-item label="示例音频">
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
                可选上传，只能上传 mp3 文件，且不超过 5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            发布任务
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { publishTask } from '@/api/task'
import { getAllTags } from '@/api/tag'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const uploadRef = ref(null)
const exampleAudio = ref(null)
const submitting = ref(false)
const allTags = ref([])

const taskForm = reactive({
  title: '',
  content: '',
  duration: '',
  budget: 100,
  tagIds: []
})

const rules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { max: 100, message: '标题不能超过100字', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入配音内容', trigger: 'blur' },
    { max: 200, message: '内容不能超过200字', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请输入时长要求', trigger: 'blur' }
  ],
  budget: [
    { required: true, message: '请输入预算', trigger: 'blur' }
  ]
}

async function fetchAllTags() {
  try {
    const res = await getAllTags()
    allTags.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function handleFileChange(file) {
  exampleAudio.value = file.raw
}

function handleExceed() {
  ElMessage.warning('只能上传一个文件')
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    
    if (taskForm.budget > userStore.userInfo?.balance) {
      ElMessage.warning('余额不足，请先充值')
      return
    }

    submitting.value = true
    
    const taskData = { ...taskForm }
    if (taskData.tagIds.length === 0) {
      taskData.tagIds = undefined
    }
    
    const formData = new FormData()
    formData.append('task', new Blob([JSON.stringify(taskData)], {
      type: 'application/json'
    }))
    if (exampleAudio.value) {
      formData.append('exampleAudio', exampleAudio.value)
    }

    const res = await publishTask(formData)
    ElMessage.success('任务发布成功')
    await userStore.refreshUserInfo()
    router.push(`/task/${res.data.id}`)
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  formRef.value?.resetFields()
  uploadRef.value?.clearFiles()
  exampleAudio.value = null
  taskForm.tagIds = []
}

onMounted(() => {
  fetchAllTags()
})
</script>

<style scoped>
.tip {
  margin-left: 20px;
  color: #909399;
  font-size: 14px;
}

.tag-section {
  width: 100%;
}

.tag-tip {
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.tag-item {
  margin: 0;
  padding: 8px 12px;
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
</style>
