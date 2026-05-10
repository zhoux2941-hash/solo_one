<template>
  <div class="home-page">
    <div class="header">
      <div class="user-info" v-if="currentResident">
        <div class="avatar">
          <el-icon><User /></el-icon>
        </div>
        <div class="info">
          <div class="name">{{ currentResident.name }}</div>
          <div class="room">{{ currentResident.roomNumber }}</div>
        </div>
      </div>
    </div>

    <div class="points-card">
      <div class="points-label">我的积分</div>
      <div class="points-value">{{ points }}</div>
    </div>

    <el-card class="section">
      <template #header>
        <div class="section-header">
          <span>选择居民</span>
          <el-button type="primary" size="small" @click="loadPoints">
            <el-icon><Refresh /></el-icon>
            刷新积分
          </el-button>
        </div>
      </template>
      <el-select 
        v-model="selectedResidentId" 
        placeholder="请选择居民" 
        style="width: 100%"
        @change="onResidentChange"
      >
        <el-option
          v-for="item in residents"
          :key="item.id"
          :label="`${item.roomNumber} - ${item.name}`"
          :value="item.id"
        />
      </el-select>
    </el-card>

    <el-card class="section">
      <template #header>
        <span>积分规则</span>
      </template>
      <div class="rules">
        <div class="rule-item">
          <el-tag type="success" effect="dark">可回收</el-tag>
          <span>1kg = 2积分</span>
        </div>
        <div class="rule-item">
          <el-tag type="warning" effect="dark">厨余</el-tag>
          <span>1kg = 1积分</span>
        </div>
        <div class="rule-item">
          <el-tag type="danger" effect="dark">有害</el-tag>
          <span>不加分</span>
        </div>
        <div class="rule-item">
          <el-tag type="info" effect="dark">其他</el-tag>
          <span>不加分</span>
        </div>
      </div>
    </el-card>

    <el-card class="section">
      <template #header>
        <span>最近投递</span>
      </template>
      <div v-if="records.length > 0">
        <div v-for="item in records.slice(0, 5)" :key="item.id" class="record-item">
          <div class="record-left">
            <el-tag :type="getTypeTag(item.garbageType)" size="small">
              {{ getTypeName(item.garbageType) }}
            </el-tag>
            <span class="weight">{{ item.weight }}kg</span>
          </div>
          <div class="record-right">
            <span class="points" v-if="item.pointsEarned > 0">+{{ item.pointsEarned }}分</span>
            <span class="points-zero" v-else>不加分</span>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无投递记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { residentApi, garbageApi } from '@/api'

const residents = ref([])
const selectedResidentId = ref(null)
const points = ref(0)
const records = ref([])

const currentResident = computed(() => {
  return residents.value.find(r => r.id === selectedResidentId.value)
})

const getResidents = async () => {
  const res = await residentApi.list()
  residents.value = res.data
  if (res.data.length > 0 && !selectedResidentId.value) {
    selectedResidentId.value = res.data[0].id
    await loadPoints()
    await loadRecords()
  }
}

const loadPoints = async () => {
  if (!selectedResidentId.value) return
  const res = await residentApi.getPoints(selectedResidentId.value)
  points.value = res.data
}

const loadRecords = async () => {
  if (!selectedResidentId.value) return
  const res = await garbageApi.getRecords(selectedResidentId.value)
  records.value = res.data
}

const onResidentChange = async () => {
  await loadPoints()
  await loadRecords()
}

const getTypeName = (type) => {
  const map = {
    RECYCLABLE: '可回收',
    KITCHEN: '厨余',
    HARMFUL: '有害',
    OTHER: '其他'
  }
  return map[type] || type
}

const getTypeTag = (type) => {
  const map = {
    RECYCLABLE: 'success',
    KITCHEN: 'warning',
    HARMFUL: 'danger',
    OTHER: 'info'
  }
  return map[type] || 'info'
}

onMounted(() => {
  getResidents()
})
</script>

<style scoped>
.home-page {
  padding-bottom: 20px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px 80px;
  color: #fff;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 30px;
}

.info .name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
}

.info .room {
  font-size: 14px;
  opacity: 0.8;
}

.points-card {
  background: #fff;
  margin: -50px 20px 20px;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.points-label {
  font-size: 14px;
  color: #999;
  margin-bottom: 10px;
}

.points-value {
  font-size: 48px;
  font-weight: bold;
  color: #ff6b6b;
}

.section {
  margin: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rules {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.rule-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.rule-item span {
  font-size: 14px;
  color: #666;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weight {
  font-size: 14px;
  color: #666;
}

.points {
  color: #67c23a;
  font-weight: bold;
}

.points-zero {
  color: #999;
  font-size: 14px;
}
</style>
