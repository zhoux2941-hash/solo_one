<template>
  <div class="competition-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>竞赛列表</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建竞赛
          </el-button>
        </div>
      </template>
      <el-table :data="competitions" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="description" label="描述" :show-overflow-tooltip="true" />
        <el-table-column label="队伍" width="100">
          <template #default="{ row }">{{ row.teamCount }} 支</template>
        </el-table-column>
        <el-table-column label="题目" width="100">
          <template #default="{ row }">{{ row.questionCount }} 道</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <span :class="['status-badge', `status-${row.status.toLowerCase()}`]">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewCompetition(row)">
              查看
            </el-button>
            <el-button
              v-if="row.status === 'FINISHED'"
              size="small"
              type="success"
              @click="viewResults(row)"
            >
              成绩
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="创建竞赛" width="600px">
      <el-form :model="newCompetition" label-width="100px">
        <el-form-item label="竞赛名称">
          <el-input v-model="newCompetition.name" placeholder="请输入竞赛名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newCompetition.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="题目分类">
          <el-select
            v-model="newCompetition.categoryIds"
            multiple
            placeholder="请选择题库分类"
            style="width: 100%"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="题目数量">
          <el-input-number v-model="newCompetition.questionCount" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="队伍数量">
          <el-input-number v-model="newCompetition.teamCount" :min="2" :max="4" />
        </el-form-item>
        <el-form-item label="队伍名称">
          <div v-for="(_, index) in newCompetition.teamCount" :key="index" style="margin-bottom: 10px">
            <el-input
              v-model="newCompetition.teamNames[index]"
              :placeholder="`队伍 ${index + 1} 名称`"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createCompetition" :loading="saving">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCompetitions, createCompetition as apiCreateCompetition } from '../api/competitions'
import { getCategories } from '../api/questions'
import { ElMessage } from 'element-plus'

const router = useRouter()

const competitions = ref([])
const categories = ref([])
const loading = ref(false)
const saving = ref(false)
const showCreateDialog = ref(false)

const newCompetition = ref({
  name: '',
  description: '',
  categoryIds: [],
  questionCount: 10,
  teamCount: 2,
  teamNames: ['红队', '蓝队']
})

function getStatusText(status) {
  const statusMap = {
    'CREATED': '已创建',
    'IN_PROGRESS': '进行中',
    'FINISHED': '已结束'
  }
  return statusMap[status] || status
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

watch(() => newCompetition.value.teamCount, (newVal) => {
  while (newCompetition.value.teamNames.length < newVal) {
    const teamNames = ['红队', '蓝队', '绿队', '黄队']
    newCompetition.value.teamNames.push(teamNames[newCompetition.value.teamNames.length] || `队伍${newCompetition.value.teamNames.length + 1}`)
  }
  while (newCompetition.value.teamNames.length > newVal) {
    newCompetition.value.teamNames.pop()
  }
})

async function loadCompetitions() {
  loading.value = true
  try {
    const response = await getCompetitions()
    competitions.value = response.data
  } catch (error) {
    ElMessage.error('加载竞赛列表失败')
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const response = await getCategories()
    categories.value = response.data
  } catch (error) {
    ElMessage.error('加载分类失败')
  }
}

async function createCompetition() {
  if (!newCompetition.value.name) {
    ElMessage.warning('请输入竞赛名称')
    return
  }
  if (newCompetition.value.categoryIds.length === 0) {
    ElMessage.warning('请至少选择一个题库分类')
    return
  }
  if (newCompetition.value.teamNames.some(name => !name)) {
    ElMessage.warning('请填写所有队伍名称')
    return
  }

  saving.value = true
  try {
    await apiCreateCompetition(newCompetition.value)
    ElMessage.success('竞赛创建成功')
    showCreateDialog.value = false
    newCompetition.value = {
      name: '',
      description: '',
      categoryIds: [],
      questionCount: 10,
      teamCount: 2,
      teamNames: ['红队', '蓝队']
    }
    loadCompetitions()
  } catch (error) {
    ElMessage.error('创建竞赛失败')
  } finally {
    saving.value = false
  }
}

function viewCompetition(competition) {
  router.push(`/competition/${competition.id}`)
}

function viewResults(competition) {
  router.push(`/results/${competition.id}`)
}

onMounted(() => {
  loadCompetitions()
  loadCategories()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
