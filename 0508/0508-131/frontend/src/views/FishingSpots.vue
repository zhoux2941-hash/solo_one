<template>
  <div class="page-container">
    <div class="card">
      <h3 class="card-title">
        <el-icon><LocationFilled /></el-icon>
        附近钓友推荐钓点
      </h3>
      
      <el-row :gutter="20" class="search-row">
        <el-col :span="6">
          <el-input-number v-model="latitude" :precision="6" label="纬度" style="width: 100%" />
        </el-col>
        <el-col :span="6">
          <el-input-number v-model="longitude" :precision="6" label="经度" style="width: 100%" />
        </el-col>
        <el-col :span="6">
          <el-input-number v-model="radius" :min="1" :max="100" label="搜索半径(km)" style="width: 100%" />
        </el-col>
        <el-col :span="6">
          <el-button type="primary" :loading="loading" @click="searchNearbySpots" style="width: 100%">
            <el-icon><Search /></el-icon>
            搜索附近钓点
          </el-button>
        </el-col>
      </el-row>

      <el-empty v-if="nearbySpots.length === 0 && !loading" description="附近暂无钓友推荐钓点" />
      
      <el-row :gutter="20" v-else>
        <el-col :span="12" v-for="spot in nearbySpots" :key="spot.id">
          <div class="spot-card">
            <div class="spot-header">
              <h4>{{ spot.name }}</h4>
              <el-tag type="success" size="small">
                {{ spot.distance?.toFixed(2) }} km
              </el-tag>
            </div>
            <div class="spot-info">
              <p><span class="label">纬度:</span> {{ spot.latitude }}</p>
              <p><span class="label">经度:</span> {{ spot.longitude }}</p>
              <p><span class="label">水域类型:</span> {{ spot.waterType || '未知' }}</p>
              <p v-if="spot.description"><span class="label">描述:</span> {{ spot.description }}</p>
            </div>
            <div class="spot-actions">
              <el-button size="small" type="primary" @click="copyCoordinates(spot)">
                复制坐标
              </el-button>
              <el-button size="small" @click="openInMap(spot)">
                打开地图
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="card mt-20">
      <h3 class="card-title">
        <el-icon><Plus /></el-icon>
        添加新钓点
      </h3>
      <el-form :model="newSpotForm" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="钓点名称">
              <el-input v-model="newSpotForm.name" placeholder="输入钓点名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="水域类型">
              <el-select v-model="newSpotForm.waterType" placeholder="选择水域类型" style="width: 100%">
                <el-option label="河流" value="河流" />
                <el-option label="湖泊" value="湖泊" />
                <el-option label="水库" value="水库" />
                <el-option label="池塘" value="池塘" />
                <el-option label="海岸" value="海岸" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="纬度">
              <el-input-number v-model="newSpotForm.latitude" :precision="6" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经度">
              <el-input-number v-model="newSpotForm.longitude" :precision="6" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="newSpotForm.description" type="textarea" :rows="2" placeholder="输入钓点描述..." />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="creating" @click="addNewSpot">
            添加钓点
          </el-button>
          <el-button @click="getCurrentLocation">
            <el-icon><Location /></el-icon>
            获取当前位置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card mt-20">
      <h3 class="card-title">我的钓点</h3>
      <el-table :data="mySpots" style="width: 100%">
        <el-table-column prop="name" label="钓点名称" width="180" />
        <el-table-column prop="latitude" label="纬度" width="150" />
        <el-table-column prop="longitude" label="经度" width="150" />
        <el-table-column prop="waterType" label="水域类型" width="100" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="copyCoordinates(scope.row)">复制坐标</el-button>
            <el-button size="small" type="primary" @click="openInMap(scope.row)">打开地图</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="mySpots.length === 0" description="暂无钓点" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { LocationFilled, Search, Plus, Location } from '@element-plus/icons-vue'
import { getNearbySpots, getSpotsByUser, createSpot } from '@/api/fishing'

const latitude = ref(39.9042)
const longitude = ref(116.4074)
const radius = ref(10)
const loading = ref(false)
const creating = ref(false)
const nearbySpots = ref([])
const mySpots = ref([])

const newSpotForm = reactive({
  userId: 1,
  name: '',
  latitude: 0,
  longitude: 0,
  waterType: '',
  description: ''
})

const searchNearbySpots = async () => {
  loading.value = true
  try {
    const res = await getNearbySpots({
      latitude: latitude.value,
      longitude: longitude.value,
      radius: radius.value
    })
    nearbySpots.value = res.data
    if (nearbySpots.value.length === 0) {
      ElMessage.info('附近暂无钓友推荐钓点')
    }
  } catch (error) {
    console.error('搜索钓点失败:', error)
  } finally {
    loading.value = false
  }
}

const loadMySpots = async () => {
  try {
    const res = await getSpotsByUser(1)
    mySpots.value = res.data
  } catch (error) {
    console.error('加载我的钓点失败:', error)
  }
}

const addNewSpot = async () => {
  if (!newSpotForm.name) {
    ElMessage.warning('请输入钓点名称')
    return
  }
  if (!newSpotForm.latitude || !newSpotForm.longitude) {
    ElMessage.warning('请输入经纬度')
    return
  }

  creating.value = true
  try {
    await createSpot(newSpotForm)
    ElMessage.success('钓点添加成功')
    newSpotForm.name = ''
    newSpotForm.latitude = 0
    newSpotForm.longitude = 0
    newSpotForm.waterType = ''
    newSpotForm.description = ''
    loadMySpots()
  } catch (error) {
    console.error('添加钓点失败:', error)
  } finally {
    creating.value = false
  }
}

const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        newSpotForm.latitude = position.coords.latitude
        newSpotForm.longitude = position.coords.longitude
        latitude.value = position.coords.latitude
        longitude.value = position.coords.longitude
        ElMessage.success('已获取当前位置')
      },
      (error) => {
        ElMessage.error('获取位置失败: ' + error.message)
      }
    )
  } else {
    ElMessage.error('浏览器不支持定位')
  }
}

const copyCoordinates = (spot) => {
  const text = `${spot.latitude}, ${spot.longitude}`
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('坐标已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const openInMap = (spot) => {
  const url = `https://www.google.com/maps?q=${spot.latitude},${spot.longitude}`
  window.open(url, '_blank')
}

onMounted(() => {
  loadMySpots()
  searchNearbySpots()
})
</script>

<style scoped>
.search-row {
  margin-bottom: 24px;
}

.spot-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
  transition: box-shadow 0.3s;
}

.spot-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.spot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.spot-header h4 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.spot-info {
  margin-bottom: 16px;
}

.spot-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.spot-info .label {
  color: #909399;
  margin-right: 4px;
}

.spot-actions {
  display: flex;
  gap: 8px;
}
</style>
