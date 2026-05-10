<template>
  <div class="question-management">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>分类管理</span>
              <el-button type="primary" size="small" @click="showAddCategory = true">
                <el-icon><Plus /></el-icon>
                添加
              </el-button>
            </div>
          </template>
          <el-menu
            :default-active="selectedCategoryId?.toString() || ''"
            @select="handleCategorySelect"
          >
            <el-menu-item
              v-for="category in categories"
              :key="category.id"
              :index="category.id.toString()"
            >
              {{ category.name }}
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>题目列表</span>
              <div class="header-actions">
                <el-upload
                  :show-file-list="false"
                  :before-upload="handleImport"
                  accept=".xlsx,.xls"
                >
                  <el-button type="success" size="small">
                    <el-icon><Upload /></el-icon>
                    导入Excel
                  </el-button>
                </el-upload>
                <el-button type="primary" size="small" @click="showAddQuestion = true" :disabled="!selectedCategoryId">
                  <el-icon><Plus /></el-icon>
                  添加题目
                </el-button>
              </div>
            </div>
          </template>
          <el-table :data="questions" v-loading="loading" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="content" label="题目" :show-overflow-tooltip="true" />
            <el-table-column prop="correctAnswer" label="答案" width="80" />
            <el-table-column prop="points" label="分值" width="80" />
            <el-table-column prop="difficulty" label="难度" width="100">
              <template #default="{ row }">
                <el-tag :type="getDifficultyTagType(row.difficulty)">
                  {{ getDifficultyText(row.difficulty) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loading && questions.length === 0 && !selectedCategoryId" description="请先选择一个分类" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAddCategory" title="添加分类" width="400px">
      <el-form :model="newCategory" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="newCategory.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newCategory.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddCategory = false">取消</el-button>
        <el-button type="primary" @click="addCategory" :loading="categorySaving">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddQuestion" title="添加题目" width="700px">
      <el-form :model="newQuestion" label-width="80px">
        <el-form-item label="题目">
          <el-input v-model="newQuestion.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="选项A">
          <el-input v-model="newQuestion.optionA" />
        </el-form-item>
        <el-form-item label="选项B">
          <el-input v-model="newQuestion.optionB" />
        </el-form-item>
        <el-form-item label="选项C">
          <el-input v-model="newQuestion.optionC" />
        </el-form-item>
        <el-form-item label="选项D">
          <el-input v-model="newQuestion.optionD" />
        </el-form-item>
        <el-form-item label="答案">
          <el-select v-model="newQuestion.correctAnswer">
            <el-option label="A" value="A" />
            <el-option label="B" value="B" />
            <el-option label="C" value="C" />
            <el-option label="D" value="D" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="newQuestion.difficulty">
            <el-option label="简单" value="EASY" />
            <el-option label="中等" value="MEDIUM" />
            <el-option label="困难" value="HARD" />
          </el-select>
        </el-form-item>
        <el-form-item label="分值">
          <el-input-number v-model="newQuestion.points" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddQuestion = false">取消</el-button>
        <el-button type="primary" @click="addQuestion" :loading="questionSaving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCategories, createCategory, getQuestionsByCategory, addQuestion, importQuestions } from '../api/questions'
import { ElMessage } from 'element-plus'

const categories = ref([])
const questions = ref([])
const loading = ref(false)
const selectedCategoryId = ref(null)

const showAddCategory = ref(false)
const showAddQuestion = ref(false)
const categorySaving = ref(false)
const questionSaving = ref(false)

const newCategory = ref({
  name: '',
  description: ''
})

const newQuestion = ref({
  content: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  difficulty: 'MEDIUM',
  points: 10
})

function getDifficultyText(difficulty) {
  const map = { 'EASY': '简单', 'MEDIUM': '中等', 'HARD': '困难' }
  return map[difficulty] || difficulty
}

function getDifficultyTagType(difficulty) {
  const map = { 'EASY': 'success', 'MEDIUM': 'warning', 'HARD': 'danger' }
  return map[difficulty] || 'info'
}

async function loadCategories() {
  try {
    const response = await getCategories()
    categories.value = response.data
  } catch (error) {
    ElMessage.error('加载分类失败')
  }
}

async function handleCategorySelect(index) {
  selectedCategoryId.value = parseInt(index)
  await loadQuestions()
}

async function loadQuestions() {
  if (!selectedCategoryId.value) return
  loading.value = true
  try {
    const response = await getQuestionsByCategory(selectedCategoryId.value)
    questions.value = response.data
  } catch (error) {
    ElMessage.error('加载题目失败')
  } finally {
    loading.value = false
  }
}

async function addCategory() {
  if (!newCategory.value.name) {
    ElMessage.warning('请输入分类名称')
    return
  }
  categorySaving.value = true
  try {
    await createCategory(newCategory.value.name, newCategory.value.description)
    ElMessage.success('分类添加成功')
    showAddCategory.value = false
    newCategory.value = { name: '', description: '' }
    loadCategories()
  } catch (error) {
    ElMessage.error('添加分类失败')
  } finally {
    categorySaving.value = false
  }
}

async function addQuestion() {
  if (!newQuestion.value.content || !newQuestion.value.correctAnswer) {
    ElMessage.warning('请填写完整的题目信息')
    return
  }
  questionSaving.value = true
  try {
    const question = { ...newQuestion.value, categoryId: selectedCategoryId.value }
    await addQuestion(question)
    ElMessage.success('题目添加成功')
    showAddQuestion.value = false
    newQuestion.value = {
      content: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      difficulty: 'MEDIUM',
      points: 10
    }
    loadQuestions()
  } catch (error) {
    ElMessage.error('添加题目失败')
  } finally {
    questionSaving.value = false
  }
}

async function handleImport(file) {
  if (!selectedCategoryId.value) {
    ElMessage.warning('请先选择一个分类')
    return false
  }
  loading.value = true
  try {
    const response = await importQuestions(file, selectedCategoryId.value)
    const data = response.data
    ElMessage.success(`导入成功：${data.successCount} 道题目`)
    if (data.failCount > 0) {
      ElMessage.warning(`失败 ${data.failCount} 道：${data.errors.join('; ')}`)
    }
    loadQuestions()
  } catch (error) {
    ElMessage.error('导入失败')
  } finally {
    loading.value = false
  }
  return false
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>
