<template>
  <div class="home-container">
    <el-card class="search-card">
      <h3 class="search-title">
        <el-icon><Search /></el-icon>
        搜索匹配行程
      </h3>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="目的地城市">
          <el-input v-model="searchForm.destinationCity" placeholder="输入目的城市" style="width: 200px" />
        </el-form-item>
        <el-form-item label="出发时间">
          <el-date-picker
            v-model="searchForm.departureTime"
            type="datetime"
            placeholder="选择出发时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="searching" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="searchResults.length > 0" class="search-results">
      <h3>
        <el-icon><Pointer /></el-icon>
        匹配的行程（出发时间±1小时）
      </h3>
      <el-alert
        v-if="hasWaypointMatch"
        title="提示：包含途经点匹配的行程（可拼一段路程）"
        type="warning"
        :closable="false"
        show-icon
        class="match-tip"
      />
      <el-row :gutter="20">
        <el-col :span="12" v-for="trip in searchResults" :key="trip.id">
          <TripCard :trip="trip" @applied="onApplied" />
        </el-col>
      </el-row>
    </div>

    <div class="hot-section">
      <h3>
        <el-icon><TrendCharts /></el-icon>
        热门城市行程（Redis缓存）
      </h3>
      <el-row :gutter="20">
        <el-col :span="6" v-for="hot in hotCities" :key="hot.city">
          <el-card class="hot-card" shadow="hover">
            <template #header>
              <div class="hot-header">
                <span class="city-name">{{ hot.city }}</span>
                <el-tag type="danger" size="small">{{ hot.tripCount }} 个行程</el-tag>
              </div>
            </template>
            <div v-if="hot.trips && hot.trips.length > 0" class="hot-trips">
              <div v-for="t in hot.trips.slice(0, 3)" :key="t.id" class="hot-trip-item">
                <div class="trip-info">
                  <span class="time">{{ formatTime(t.departureTime) }}</span>
                  <span class="price">¥{{ t.costPerPerson }}/人</span>
                </div>
                <div class="trip-seats">余{{ t.availableSeats }}座</div>
              </div>
            </div>
            <div v-else class="no-trip">暂无行程</div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="recent-section">
      <h3>
        <el-icon><Timer /></el-icon>
        最新发布行程
      </h3>
      <el-row :gutter="20">
        <el-col :span="12" v-for="trip in recentTrips" :key="trip.id">
          <TripCard :trip="trip" @applied="onApplied" />
        </el-col>
      </el-row>
      <el-empty v-if="recentTrips.length === 0" description="暂无行程" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useTripApi } from '@/api/trip'
import { useRequestApi } from '@/api/request'
import TripCard from '@/components/TripCard.vue'

const tripApi = useTripApi()
const requestApi = useRequestApi()

const searching = ref(false)
const searchResults = ref([])
const hotCities = ref([])
const recentTrips = ref([])

const hasWaypointMatch = computed(() => {
  return searchResults.value.some(trip => trip.matchType === 'WAYPOINT')
})

const searchForm = reactive({
  destinationCity: '',
  departureTime: ''
})

onMounted(() => {
  loadHotCities()
  loadRecentTrips()
})

const loadHotCities = async () => {
  try {
    const res = await tripApi.getHotTrips()
    if (res.success) {
      hotCities.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadRecentTrips = async () => {
  try {
    const res = await tripApi.getRecentTrips()
    if (res.success) {
      recentTrips.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const handleSearch = async () => {
  if (!searchForm.destinationCity) {
    ElMessage.warning('请输入目的地城市')
    return
  }
  if (!searchForm.departureTime) {
    ElMessage.warning('请选择出发时间')
    return
  }

  searching.value = true
  try {
    const res = await tripApi.searchTrips(searchForm)
    if (res.success) {
      searchResults.value = res.data
      if (res.data.length === 0) {
        ElMessage.info('没有找到匹配的行程')
      }
    }
  } catch (e) {
  } finally {
    searching.value = false
  }
}

const onApplied = (tripId) => {
  ElMessage.success('申请已发送，等待车主同意')
  searchResults.value = searchResults.value.filter(t => t.id !== tripId)
}

const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.search-card {
  border-radius: 12px;
}

.search-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  color: #303133;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.search-results h3,
.hot-section h3,
.recent-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  color: #303133;
}

.hot-card {
  border-radius: 12px;
  margin-bottom: 16px;
}

.hot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.city-name {
  font-weight: bold;
  font-size: 16px;
}

.hot-trips {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-trip-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.hot-trip-item:last-child {
  border-bottom: none;
}

.trip-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.time {
  color: #409eff;
  font-weight: 500;
}

.price {
  color: #f56c6c;
  font-weight: bold;
}

.trip-seats {
  color: #909399;
  font-size: 12px;
}

.no-trip {
  color: #909399;
  text-align: center;
  padding: 20px;
}

.match-tip {
  margin-bottom: 16px;
}
</style>
