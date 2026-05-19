<template>
  <div class="parking">
    <van-nav-bar title="附近车位" left-arrow @click-left="goBack" />
    
    <div class="map-container">
      <div class="map-placeholder">
        <van-icon name="location-o" size="50" color="#409EFF" />
        <p>地图加载中...</p>
      </div>
    </div>

    <div class="parking-list">
      <van-cell-group inset>
        <div v-for="lot in parkingLots" :key="lot.id" class="parking-item">
          <van-cell
            :title="lot.name"
            :label="lot.address"
            is-link
            @click="selectLot(lot)"
          >
            <template #value>
              <div class="lot-stats">
                <span class="available">{{ lot.availableSpaces || 0 }}</span>
                <span class="total">/{{ lot.totalSpaces || 0 }}</span>
              </div>
            </template>
          </van-cell>
          <van-cell class="lot-info">
            <template #title>
              <van-tag type="success">{{ lot.type === 'INDOOR' ? '室内' : '路侧' }}</van-tag>
              <van-tag type="warning" style="margin-left: 8px">¥5/小时</van-tag>
            </template>
          </van-cell>
        </div>
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'

const router = useRouter()
const parkingLots = ref([])

const goBack = () => {
  router.back()
}

const loadParkingLots = async () => {
  const res = await request.get('/parking/lots')
  if (res.code === 200) {
    parkingLots.value = res.data
  }
}

const selectLot = (lot) => {
  console.log('选择车场:', lot)
}

onMounted(() => {
  loadParkingLots()
})
</script>

<style scoped>
.map-container {
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-placeholder {
  text-align: center;
  color: #fff;
}

.map-placeholder p {
  margin-top: 10px;
}

.parking-list {
  padding: 10px 0;
}

.parking-item {
  margin-bottom: 10px;
}

.lot-stats {
  font-size: 16px;
}

.lot-stats .available {
  color: #67C23A;
  font-weight: bold;
}

.lot-stats .total {
  color: #999;
}

.lot-info {
  padding-top: 0 !important;
}
</style>
