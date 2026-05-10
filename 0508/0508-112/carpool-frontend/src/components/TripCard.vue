<template>
  <el-card class="trip-card" shadow="hover">
    <div class="trip-header">
      <div class="route-with-tags">
        <div class="route">
          <span class="city departure">{{ trip.departureCity }}</span>
          <template v-if="trip.waypointList && trip.waypointList.length > 0">
            <el-icon class="arrow"><Right /></el-icon>
            <span class="waypoint-dots" v-if="trip.waypointList.length > 2">...</span>
            <template v-else>
              <span v-for="wp in trip.waypointList" :key="wp" class="city waypoint">
                {{ wp }}
              </span>
            </template>
          </template>
          <el-icon class="arrow"><Right /></el-icon>
          <span class="city destination">{{ trip.destinationCity }}</span>
        </div>
        <div class="waypoint-tags" v-if="trip.waypointList && trip.waypointList.length > 0">
          <el-tag 
            v-for="wp in trip.waypointList" 
            :key="wp" 
            type="info" 
            size="small"
            class="waypoint-tag"
          >
            <el-icon><Location /></el-icon>
            途经{{ wp }}
          </el-tag>
        </div>
      </div>
      <div class="header-right">
        <el-tag v-if="trip.matchType === 'WAYPOINT'" type="warning" size="small" class="match-tag">
          <el-icon><Connection /></el-icon>
          途经点匹配
        </el-tag>
        <el-tag v-else-if="trip.matchType === 'EXACT'" type="success" size="small" class="match-tag">
          <el-icon><Position /></el-icon>
          终点匹配
        </el-tag>
        <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
      </div>
    </div>

    <div class="trip-info">
      <div class="info-item">
        <el-icon><Clock /></el-icon>
        <span>{{ formatTime(trip.departureTime) }}</span>
      </div>
      <div class="info-item">
        <el-icon><User /></el-icon>
        <span>{{ trip.publisherName }}</span>
        <el-tag :type="creditTagType" size="small" class="credit-tag">
          守信{{ trip.publisherCreditScore }}
        </el-tag>
      </div>
    </div>

    <div class="trip-seats">
      <div class="seat-info">
        <span class="label">座位</span>
        <span class="value">{{ trip.availableSeats }}/{{ trip.totalSeats }}</span>
      </div>
      <div class="price-info">
        <span class="label">人均</span>
        <span class="price">¥{{ trip.costPerPerson }}</span>
      </div>
    </div>

    <div v-if="trip.description" class="trip-desc">
      <el-icon><Document /></el-icon>
      <span>{{ trip.description }}</span>
    </div>

    <div class="trip-footer">
      <el-button 
        :type="hasApplied ? 'info' : 'primary'" 
        :disabled="!canApply"
        :loading="applying"
        @click="handleApply"
      >
        <el-icon v-if="!applying && !hasApplied"><Plus /></el-icon>
        <el-icon v-else-if="hasApplied"><Check /></el-icon>
        {{ buttonText }}
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { useRequestApi } from '@/api/request'

const props = defineProps({
  trip: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['applied'])

const userStore = useUserStore()
const requestApi = useRequestApi()

const applying = ref(false)
const hasApplied = ref(false)

const statusType = computed(() => {
  if (props.trip.status === 'OPEN') return 'success'
  if (props.trip.status === 'FULL') return 'warning'
  return 'info'
})

const statusText = computed(() => {
  if (props.trip.status === 'OPEN') return '可报名'
  if (props.trip.status === 'FULL') return '已满员'
  return '已关闭'
})

const creditTagType = computed(() => {
  const score = props.trip.publisherCreditScore
  if (score >= 120) return 'success'
  if (score >= 100) return 'primary'
  if (score >= 80) return 'warning'
  return 'danger'
})

const canApply = computed(() => {
  return props.trip.status === 'OPEN' && 
         props.trip.availableSeats > 0 &&
         props.trip.publisherId !== userStore.userId &&
         !hasApplied.value
})

const buttonText = computed(() => {
  if (hasApplied.value) return '已申请'
  if (applying.value) return '申请中...'
  return '申请拼车'
})

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const checkIfApplied = async () => {
  try {
    const res = await requestApi.getMyRequests()
    if (res.success) {
      hasApplied.value = res.data.some(
        r => r.tripId === props.trip.id && 
             ['PENDING', 'ACCEPTED'].includes(r.status)
      )
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  checkIfApplied()
})

const handleApply = async () => {
  if (applying.value) return

  if (!canApply.value || hasApplied.value) {
    if (hasApplied.value) {
      ElMessage.warning('您已申请过该行程')
    }
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认申请从${props.trip.departureCity}到${props.trip.destinationCity}的行程？\n出发时间：${formatTime(props.trip.departureTime)}`,
      '确认申请',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info',
        showClose: false,
        closeOnClickModal: false,
        closeOnPressEscape: false
      }
    )

    applying.value = true
    const res = await requestApi.createRequest(props.trip.id, { seatsRequested: 1 })
    if (res.success) {
      hasApplied.value = true
      ElMessage.success('申请已发送，等待车主同意')
      emit('applied', props.trip.id)
    }
  } catch (e) {
    if (e !== 'cancel') {
      const errorMsg = e?.response?.data?.message || e?.message
      if (errorMsg && errorMsg.includes('已申请')) {
        hasApplied.value = true
        ElMessage.warning(errorMsg)
      }
    }
  } finally {
    applying.value = false
  }
}
</script>

<style scoped>
.trip-card {
  border-radius: 12px;
  margin-bottom: 16px;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.route-with-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.match-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.route {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.city {
  font-size: 16px;
  font-weight: bold;
}

.departure {
  color: #67c23a;
}

.destination {
  color: #409eff;
}

.waypoint {
  color: #e6a23c;
  font-size: 14px;
}

.waypoint-dots {
  color: #909399;
  font-weight: bold;
}

.arrow {
  color: #909399;
  font-size: 14px;
}

.waypoint-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.waypoint-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.trip-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.credit-tag {
  margin-left: 8px;
}

.trip-seats {
  display: flex;
  gap: 40px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.seat-info,
.price-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.label {
  color: #909399;
  font-size: 12px;
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.price {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
}

.trip-desc {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #909399;
  font-size: 13px;
  margin-bottom: 16px;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
}

.trip-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
