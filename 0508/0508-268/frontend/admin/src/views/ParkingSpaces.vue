<template>
  <div class="parking-spaces">
    <h2>车位管理 - {{ lotName }}</h2>
    
    <div class="space-grid">
      <div 
        v-for="space in parkingSpaces" 
        :key="space.id" 
        class="space-item"
        :class="getStatusClass(space.status)"
      >
        <div class="space-no">{{ space.spaceNo }}</div>
        <div class="space-area">{{ space.area }}</div>
        <div class="space-plate" v-if="space.plateNumber">{{ space.plateNumber }}</div>
        <div class="space-status">
          <el-tag :type="getStatusTagType(space.status)" size="small">
            {{ getStatusText(space.status) }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '../utils/request'

const route = useRoute()
const lotId = ref(route.query.lotId || 1)
const lotName = ref(route.query.lotName || '车场')
const parkingSpaces = ref([])

const loadParkingSpaces = async () => {
  const res = await request.get(`/parking/spaces/${lotId.value}`)
  if (res.code === 200) {
    parkingSpaces.value = res.data
  }
}

const getStatusClass = (status) => {
  const map = {
    'AVAILABLE': 'available',
    'OCCUPIED': 'occupied',
    'MAINTENANCE': 'maintenance'
  }
  return map[status] || ''
}

const getStatusTagType = (status) => {
  const map = {
    'AVAILABLE': 'success',
    'OCCUPIED': 'danger',
    'MAINTENANCE': 'warning'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'AVAILABLE': '空闲',
    'OCCUPIED': '占用',
    'MAINTENANCE': '维护'
  }
  return map[status] || status
}

onMounted(() => {
  loadParkingSpaces()
  
  window.addEventListener('space-update', () => {
    loadParkingSpaces()
  })
})
</script>

<style scoped>
.parking-spaces {
  padding: 20px;
}

.parking-spaces h2 {
  margin-bottom: 20px;
  color: #333;
}

.space-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.space-item {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s;
}

.space-item.available {
  border-color: #67C23A;
  background: #f0f9eb;
}

.space-item.occupied {
  border-color: #F56C6C;
  background: #fef0f0;
}

.space-item.maintenance {
  border-color: #E6A23C;
  background: #fdf6ec;
}

.space-no {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.space-area {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.space-plate {
  font-size: 14px;
  color: #409EFF;
  font-weight: bold;
  margin-bottom: 8px;
  background: #ecf5ff;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
