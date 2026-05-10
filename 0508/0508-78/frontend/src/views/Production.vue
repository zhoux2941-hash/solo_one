<template>
  <div class="production-container">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button type="text" @click="goBack" style="color: white">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span class="title">场务工作台 - 物资确认</span>
        </div>
        <div class="header-right">
          <span>{{ user?.name }}</span>
          <el-tag type="warning" size="small" style="margin-left: 10px">场务</el-tag>
        </div>
      </el-header>
      <el-main>
        <el-card>
          <template #header>
            <div class="card-title">
              <el-icon><Check /></el-icon>
              当日通告物资确认
              <el-date-picker
                v-model="selectedDate"
                type="date"
                placeholder="选择日期"
                style="margin-left: 20px; width: 200px"
                @change="loadNotices"
              />
              <div class="stats" style="margin-left: auto">
                <el-tag type="info" size="small">
                  总计：{{ notices.length }} 个通告
                </el-tag>
                <el-tag type="success" size="small" style="margin-left: 10px">
                  已确认：{{ confirmedCount }} 个
                </el-tag>
                <el-tag type="warning" size="small" style="margin-left: 10px">
                  待确认：{{ pendingCount }} 个
                </el-tag>
              </div>
            </div>
          </template>
          
          <div v-loading="loading" class="notice-table">
            <el-empty v-if="notices.length === 0" description="该日期暂无通告" />
            <el-table v-else :data="notices" stripe style="width: 100%">
              <el-table-column prop="sceneName" label="场景名称" width="200">
                <template #default="{ row }">
                  <span class="scene-name">{{ row.sceneName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="拍摄时间" width="180">
                <template #default="{ row }">
                  <span>{{ row.startTime }} - {{ row.endTime }}</span>
                </template>
              </el-table-column>
              <el-table-column label="参演演员" width="220">
                <template #default="{ row }">
                  <el-tag v-for="actor in row.actors" :key="actor.id" size="small" style="margin-right: 5px; margin-bottom: 5px">
                    {{ actor.name }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="服装要求" min-width="200">
                <template #default="{ row }">
                  <span v-if="row.costumeRequirement">{{ row.costumeRequirement }}</span>
                  <span v-else class="no-requirement">无特殊要求</span>
                </template>
              </el-table-column>
              <el-table-column label="道具要求" min-width="200">
                <template #default="{ row }">
                  <span v-if="row.propRequirement">{{ row.propRequirement }}</span>
                  <span v-else class="no-requirement">无特殊要求</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.materialsReady ? 'success' : 'warning'" size="small">
                    {{ row.materialsReady ? '已确认' : '待确认' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" align="center">
                <template #default="{ row }">
                  <el-button
                    v-if="!row.materialsReady"
                    type="success"
                    size="small"
                    @click="confirmMaterials(row)"
                    :loading="confirmingId === row.id"
                  >
                    <el-icon><Check /></el-icon>
                    确认物资
                  </el-button>
                  <span v-else class="confirmed-text">
                    <el-icon><CircleCheck /></el-icon>
                    已备齐
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Check, CircleCheck } from '@element-plus/icons-vue'
import { getNoticesByDate, confirmMaterials as apiConfirmMaterials } from '../api/notice'

const router = useRouter()

const user = computed(() => JSON.parse(localStorage.getItem('user') || 'null'))
const loading = ref(false)
const selectedDate = ref(new Date())
const notices = ref([])
const confirmingId = ref(null)

const confirmedCount = computed(() => notices.value.filter(n => n.materialsReady).length)
const pendingCount = computed(() => notices.value.filter(n => !n.materialsReady).length)

const formatDate = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loadNotices = async () => {
  if (!selectedDate.value) return
  
  loading.value = true
  try {
    notices.value = await getNoticesByDate(formatDate(selectedDate.value))
  } catch (error) {
    console.error('加载通告列表失败', error)
  } finally {
    loading.value = false
  }
}

const confirmMaterials = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认场景「${row.sceneName}」的物资已全部备齐？`,
      '物资确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    confirmingId.value = row.id
    await apiConfirmMaterials(row.id)
    ElMessage.success('物资已确认！')
    await loadNotices()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('确认物资失败', error)
    }
  } finally {
    confirmingId.value = null
  }
}

const goBack = () => {
  router.push('/dashboard')
}

onMounted(() => {
  loadNotices()
})
</script>

<style scoped>
.production-container {
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
}

.title {
  margin-left: 20px;
  font-size: 18px;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  font-weight: bold;
  color: #303133;
}

.card-title .el-icon {
  margin-right: 8px;
}

.stats {
  display: flex;
  align-items: center;
}

.scene-name {
  font-weight: 500;
  color: #303133;
}

.no-requirement {
  color: #c0c4cc;
  font-style: italic;
}

.confirmed-text {
  color: #67c23a;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirmed-text .el-icon {
  margin-right: 5px;
}

.notice-table {
  min-height: 400px;
}
</style>