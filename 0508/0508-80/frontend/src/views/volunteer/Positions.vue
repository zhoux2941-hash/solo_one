<template>
  <div class="positions-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>可申请岗位</span>
          <el-select v-model="filterType" placeholder="筛选岗位类型" style="width: 150px;" clearable>
            <el-option
              v-for="item in positionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </template>
      
      <el-empty v-if="filteredPositions.length === 0" description="暂无可用岗位" />
      
      <el-row :gutter="20" v-else>
        <el-col :span="8" v-for="position in filteredPositions" :key="position.id">
          <el-card class="position-card" shadow="hover">
            <template #header>
              <div class="position-header">
                <el-tag :type="getPositionTypeTagType(position.type)">{{ getPositionTypeLabel(position.type) }}</el-tag>
                <el-tag :type="PositionStatus[position.status]?.type" size="small">
                  {{ getPositionStatusLabel(position.status) }}
                </el-tag>
              </div>
            </template>
            <h3 class="position-name">{{ position.name }}</h3>
            <p class="position-desc">{{ position.description || '暂无描述' }}</p>
            <div class="position-info">
              <el-icon><Location /></el-icon>
              <span>{{ position.location }}</span>
            </div>
            <div class="position-info">
              <el-icon><User /></el-icon>
              <span>已申请: {{ position.currentCount }} / {{ position.requiredCount }}</span>
            </div>
            <el-progress 
              :percentage="Math.min((position.currentCount / position.requiredCount) * 100, 100)" 
              :stroke-width="8"
              :color="getProgressColor(position)"
            />
            <div class="position-actions">
              <el-button 
                type="primary" 
                :disabled="position.status !== 'ACTIVE'"
                @click="handleApply(position)"
              >
                {{ position.status === 'ACTIVE' ? '立即申请' : position.status === 'FULL' ? '已满员' : '已停止' }}
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog v-model="applyDialogVisible" title="申请岗位" width="500px">
      <el-form ref="applyFormRef" :model="applyForm" label-width="100px">
        <el-form-item label="岗位">
          <el-input :value="currentPosition?.name" disabled />
        </el-form-item>
        <el-form-item label="期望工作时间">
          <el-input 
            v-model="applyForm.preferredTime" 
            type="textarea" 
            :rows="2" 
            placeholder="请填写您期望的工作时间段"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="applyForm.notes" 
            type="textarea" 
            :rows="2" 
            placeholder="其他需要说明的信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="applying" @click="submitApplication">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'
import { 
  positionTypeOptions, 
  getPositionTypeLabel, 
  getPositionStatusLabel,
  PositionStatus 
} from '@/utils/constants'

const positions = ref([])
const filterType = ref('')
const applyDialogVisible = ref(false)
const currentPosition = ref(null)
const applyFormRef = ref(null)
const applying = ref(false)

const applyForm = ref({
  preferredTime: '',
  notes: ''
})

const filteredPositions = computed(() => {
  if (!filterType.value) return positions.value
  return positions.value.filter(p => p.type === filterType.value)
})

function getPositionTypeTagType(type) {
  const types = {
    TICKET_CHECKING: 'primary',
    GUIDE: 'success',
    STAGE_ASSIST: 'warning',
    LOGISTICS: 'info',
    SECURITY: 'danger',
    FIRST_AID: 'success',
    OTHER: 'info'
  }
  return types[type] || 'info'
}

function getProgressColor(position) {
  const ratio = position.currentCount / position.requiredCount
  if (ratio >= 1) return '#f56c6c'
  if (ratio >= 0.8) return '#e6a23c'
  return '#67c23a'
}

function handleApply(position) {
  if (position.status !== 'ACTIVE') {
    ElMessage.warning('该岗位当前不可申请')
    return
  }
  currentPosition.value = position
  applyForm.value = { preferredTime: '', notes: '' }
  applyDialogVisible.value = true
}

async function submitApplication() {
  applying.value = true
  try {
    const response = await api.post('/volunteer/apply', {
      positionId: currentPosition.value.id,
      ...applyForm.value
    })
    if (response.data.success) {
      ElMessage.success('申请提交成功')
      applyDialogVisible.value = false
      fetchPositions()
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (e) {
    console.error(e)
  } finally {
    applying.value = false
  }
}

async function fetchPositions() {
  try {
    const response = await api.get('/positions/list')
    if (response.data.success) {
      positions.value = response.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchPositions()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.position-card {
  margin-bottom: 20px;
}

.position-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.position-name {
  font-size: 18px;
  font-weight: 500;
  margin: 12px 0;
  color: #303133;
}

.position-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.5;
  min-height: 42px;
}

.position-info {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.position-info .el-icon {
  margin-right: 6px;
}

.position-actions {
  margin-top: 16px;
  text-align: right;
}
</style>
