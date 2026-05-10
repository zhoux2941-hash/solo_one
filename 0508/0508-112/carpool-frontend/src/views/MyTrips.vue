<template>
  <div class="my-trips-container">
    <h2>
      <el-icon><Tickets /></el-icon>
      我发布的行程
    </h2>

    <el-empty v-if="trips.length === 0" description="暂无行程，去发布一个吧">
      <el-button type="primary" @click="goPublish">发布行程</el-button>
    </el-empty>

    <el-row :gutter="20" v-else>
      <el-col :span="12" v-for="trip in trips" :key="trip.id">
        <el-card class="trip-card" shadow="hover">
          <div class="trip-header">
            <div class="route">
              <span class="city departure">{{ trip.departureCity }}</span>
              <el-icon class="arrow"><Right /></el-icon>
              <span class="city destination">{{ trip.destinationCity }}</span>
            </div>
            <el-tag :type="statusType(trip.status)" size="small">
              {{ statusText(trip.status) }}
            </el-tag>
          </div>

          <div class="trip-info">
            <div class="info-row">
              <span class="label">出发时间：</span>
              <span class="value">{{ formatTime(trip.departureTime) }}</span>
            </div>
            <div class="info-row">
              <span class="label">座位：</span>
              <span class="value">{{ trip.availableSeats }}/{{ trip.totalSeats }}</span>
            </div>
            <div class="info-row">
              <span class="label">人均费用：</span>
              <span class="price">¥{{ trip.costPerPerson }}</span>
            </div>
          </div>

          <div v-if="trip.description" class="trip-desc">
            {{ trip.description }}
          </div>

          <div class="trip-footer">
            <el-button size="small" @click="viewRequests(trip.id)">
              <el-icon><Bell /></el-icon>
              查看申请
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useTripApi } from '@/api/trip'

const router = useRouter()
const tripApi = useTripApi()

const trips = ref([])

onMounted(() => {
  loadTrips()
})

const loadTrips = async () => {
  try {
    const res = await tripApi.getMyTrips()
    if (res.success) {
      trips.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const statusType = (status) => {
  if (status === 'OPEN') return 'success'
  if (status === 'FULL') return 'warning'
  return 'info'
}

const statusText = (status) => {
  if (status === 'OPEN') return '招募中'
  if (status === 'FULL') return '已满员'
  if (status === 'COMPLETED') return '已完成'
  return '已取消'
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const goPublish = () => {
  router.push('/publish')
}

const viewRequests = (tripId) => {
  router.push('/requests')
}
</script>

<style scoped>
.my-trips-container h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.trip-card {
  border-radius: 12px;
  margin-bottom: 16px;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.route {
  display: flex;
  align-items: center;
  gap: 12px;
}

.city {
  font-size: 18px;
  font-weight: bold;
}

.departure {
  color: #67c23a;
}

.destination {
  color: #409eff;
}

.arrow {
  color: #909399;
}

.trip-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
}

.label {
  color: #909399;
  width: 80px;
}

.value {
  color: #303133;
}

.price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}

.trip-desc {
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
  color: #606266;
  font-size: 13px;
  margin-bottom: 12px;
}

.trip-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
