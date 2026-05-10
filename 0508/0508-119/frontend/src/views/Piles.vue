<template>
  <div class="page-container">
    <el-card class="chart-container">
      <div class="stats-row">
        <div class="stat-card green">
          <div class="stat-number">{{ stats.available }}</div>
          <div class="stat-label">空闲充电桩</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-number">{{ stats.occupied }}</div>
          <div class="stat-label">使用中</div>
        </div>
        <div class="stat-card red">
          <div class="stat-number">{{ stats.maintenance }}</div>
          <div class="stat-label">维修中</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-number">{{ piles.length }}</div>
          <div class="stat-label">总充电桩数</div>
        </div>
      </div>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>充电桩列表</span>
          <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 120px;" clearable @change="loadPiles">
            <el-option label="空闲" value="AVAILABLE" />
            <el-option label="使用中" value="OCCUPIED" />
            <el-option label="维修中" value="MAINTENANCE" />
          </el-select>
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索桩号或位置" 
            style="width: 200px; margin-left: 10px;"
            prefix-icon="Search"
            clearable
          />
        </div>
      </template>

      <div class="pile-grid" v-loading="loading">
        <div 
          v-for="pile in filteredPiles" 
          :key="pile.id" 
          class="pile-card"
          :class="'status-' + pile.status.toLowerCase()"
          @click="showReservationDialog(pile)"
        >
          <div class="pile-header">
            <el-icon :size="32" class="pile-icon" :class="'icon-' + pile.status.toLowerCase()">
              <component :is="getStatusIcon(pile.status)" />
            </el-icon>
            <div class="pile-info">
              <div class="pile-code">{{ pile.pileCode }}</div>
              <el-tag :type="getStatusTagType(pile.status)" size="small">
                {{ getStatusText(pile.status) }}
              </el-tag>
            </div>
          </div>
          <div class="pile-location">
            <el-icon><Location /></el-icon>
            {{ pile.location }}
          </div>
          <div v-if="pile.description" class="pile-desc">
            {{ pile.description }}
          </div>
        </div>
      </div>

      <el-empty v-if="filteredPiles.length === 0 && !loading" description="暂无充电桩数据" />
    </el-card>

    <el-dialog 
      v-model="reservationDialogVisible" 
      title="预约充电桩" 
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedPile">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="桩号">{{ selectedPile.pileCode }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ selectedPile.location }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(selectedPile.status)">
              {{ getStatusText(selectedPile.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">选择时间段（未来2小时内）</el-divider>
        
        <div class="time-slots" v-loading="slotsLoading">
          <div 
            v-for="slot in availableSlots" 
            :key="slot"
            class="time-slot"
            :class="{ available: true, selected: selectedSlot === slot }"
            @click="selectSlot(slot)"
          >
            {{ formatTimeSlot(slot) }}
          </div>
          <div v-if="availableSlots.length === 0 && !slotsLoading" style="text-align: center; color: #909399; padding: 20px;">
            该充电桩暂无可用时间段
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="reservationDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!selectedSlot || selectedPile?.status !== 'AVAILABLE'"
          :loading="reserving"
          @click="handleReservation"
        >
          确认预约
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getPiles, getAvailableSlots } from '@/api/piles'
import { createReservation } from '@/api/reservations'

const piles = ref([])
const loading = ref(false)
const slotsLoading = ref(false)
const reserving = ref(false)
const filterStatus = ref('')
const searchKeyword = ref('')
const reservationDialogVisible = ref(false)
const selectedPile = ref(null)
const availableSlots = ref([])
const selectedSlot = ref(null)

const stats = computed(() => {
  return {
    available: piles.value.filter(p => p.status === 'AVAILABLE').length,
    occupied: piles.value.filter(p => p.status === 'OCCUPIED').length,
    maintenance: piles.value.filter(p => p.status === 'MAINTENANCE').length
  }
})

const filteredPiles = computed(() => {
  let result = piles.value
  
  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(p => 
      p.pileCode.toLowerCase().includes(keyword) || 
      p.location.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

const loadPiles = async () => {
  loading.value = true
  try {
    const res = await getPiles()
    piles.value = res.data
  } catch (e) {
    console.error('Failed to load piles:', e)
  } finally {
    loading.value = false
  }
}

const getStatusIcon = (status) => {
  const icons = {
    'AVAILABLE': 'CircleCheck',
    'OCCUPIED': 'Loading',
    'MAINTENANCE': 'Warning'
  }
  return icons[status] || 'Circle'
}

const getStatusText = (status) => {
  const texts = {
    'AVAILABLE': '空闲',
    'OCCUPIED': '使用中',
    'MAINTENANCE': '维修中'
  }
  return texts[status] || status
}

const getStatusTagType = (status) => {
  const types = {
    'AVAILABLE': 'success',
    'OCCUPIED': 'warning',
    'MAINTENANCE': 'danger'
  }
  return types[status] || 'info'
}

const showReservationDialog = async (pile) => {
  selectedPile.value = pile
  selectedSlot.value = null
  availableSlots.value = []
  reservationDialogVisible.value = true
  
  if (pile.status === 'AVAILABLE') {
    await loadAvailableSlots(pile.id)
  }
}

const loadAvailableSlots = async (pileId) => {
  slotsLoading.value = true
  try {
    const res = await getAvailableSlots(pileId)
    availableSlots.value = res.data || []
  } catch (e) {
    console.error('Failed to load slots:', e)
  } finally {
    slotsLoading.value = false
  }
}

const selectSlot = (slot) => {
  selectedSlot.value = slot
}

const formatTimeSlot = (slot) => {
  const start = dayjs(slot)
  const end = start.add(30, 'minute')
  return `${start.format('HH:mm')} - ${end.format('HH:mm')}`
}

const handleReservation = async () => {
  if (!selectedPile.value || !selectedSlot.value) return
  
  try {
    await ElMessageBox.confirm(
      `确认预约 ${selectedPile.value.pileCode} 充电桩？\n时间段: ${formatTimeSlot(selectedSlot.value)}\n预约后将为您保留15分钟，请准时使用。`,
      '确认预约',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    reserving.value = true
    await createReservation({
      pileId: selectedPile.value.id,
      startTime: selectedSlot.value
    })
    
    ElMessage.success('预约成功！请在15分钟内使用')
    reservationDialogVisible.value = false
    await loadPiles()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Reservation failed:', e)
    }
  } finally {
    reserving.value = false
  }
}

onMounted(() => {
  loadPiles()
})
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header > div {
  display: flex;
  align-items: center;
}

.pile-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pile-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.pile-icon {
  flex-shrink: 0;
}

.icon-available { color: #67c23a; }
.icon-occupied { color: #e6a23c; }
.icon-maintenance { color: #f56c6c; }

.pile-info {
  flex: 1;
}

.pile-code {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.pile-location {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.pile-desc {
  color: #909399;
  font-size: 12px;
}

.time-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px 0;
}
</style>
