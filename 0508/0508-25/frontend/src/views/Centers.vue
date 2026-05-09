<template>
  <div class="page-container">
    <div class="page-title">🏠 寄养中心管理</div>

    <el-row :gutter="20">
      <el-col :span="24" v-for="item in centersWithRooms" :key="item.center.centerId" class="mb-20">
        <el-card class="card-shadow">
          <div slot="header" class="center-header">
            <div>
              <h3 class="center-name">
                <el-icon><OfficeBuilding /></el-icon>
                {{ item.center.name }}
              </h3>
              <p class="center-address">
                <el-icon><Location /></el-icon>
                {{ item.center.address }}
              </p>
            </div>
            <div>
              <el-tag type="primary" effect="plain">{{ item.rooms.length }} 个房型</el-tag>
            </div>
          </div>

          <div v-if="item.center.description" class="center-desc mb-20">
            {{ item.center.description }}
          </div>

          <div v-if="item.center.facilities" class="center-facilities mb-20">
            <span class="facility-label">设施：</span>
            <el-tag
              v-for="(facility, index) in item.center.facilities.split('、')"
              :key="index"
              type="info"
              effect="light"
              class="mr-10"
            >
              {{ facility }}
            </el-tag>
          </div>

          <el-divider />

          <h4 class="section-title">房型列表</h4>
          <el-row :gutter="20">
            <el-col :span="8" v-for="room in item.rooms" :key="room.roomId">
              <el-card class="room-card" shadow="hover">
                <div class="room-header">
                  <span class="room-name">{{ room.name }}</span>
                  <span class="room-type">{{ roomTypeMap[room.roomType] || room.roomType }}</span>
                </div>
                <div class="room-price">
                  <span class="price">¥{{ room.pricePerDay }}</span>
                  <span class="unit">/天</span>
                </div>
                <div class="room-meta">
                  <div class="meta-item">
                    <el-icon><User /></el-icon>
                    <span>{{ room.capacity }}只</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><Warning /></el-icon>
                    <span>{{ room.suitableForPetType || '不限' }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><ScaleToOriginal /></el-icon>
                    <span>{{ sizeMap[room.maxSize] || '不限' }}</span>
                  </div>
                </div>
                <div v-if="room.description" class="room-desc">
                  {{ room.description }}
                </div>
                <div v-if="room.specialFeatures" class="room-features">
                  <el-tag
                    v-for="(feature, index) in room.specialFeatures.split('、')"
                    :key="index"
                    type="success"
                    effect="light"
                    size="small"
                    class="mr-5"
                  >
                    {{ feature }}
                  </el-tag>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { centerApi } from '@/api'

const centersWithRooms = ref([])

const roomTypeMap = {
  SMALL_DOG_ROOM: '小型犬房',
  MEDIUM_DOG_ROOM: '中型犬房',
  LARGE_DOG_ROOM: '大型犬房',
  CAT_CAVE: '猫咪城堡',
  CAT_LOFT: '猫咪阁楼',
  DELUXE_CAT_ROOM: '豪华猫房',
  SMALL_PET_SUITE: '小型宠物套房'
}

const sizeMap = {
  SMALL: '小型',
  MEDIUM: '中型',
  LARGE: '大型'
}

const loadCenters = async () => {
  try {
    centersWithRooms.value = await centerApi.getAllWithRooms()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadCenters()
})
</script>

<style scoped>
.center-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.center-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 5px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.center-address {
  margin: 0;
  color: #909399;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.center-desc {
  color: #606266;
  line-height: 1.6;
}

.facility-label {
  color: #909399;
  margin-right: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
}

.room-card {
  height: 100%;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.room-name {
  font-weight: 600;
  font-size: 16px;
}

.room-type {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.room-price {
  margin-bottom: 15px;
}

.price {
  font-size: 24px;
  font-weight: 600;
  color: #f56c6c;
}

.unit {
  font-size: 14px;
  color: #909399;
}

.room-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #606266;
}

.room-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 10px;
}

.room-features {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.mr-10 {
  margin-right: 10px;
}

.mr-5 {
  margin-right: 5px;
}
</style>
