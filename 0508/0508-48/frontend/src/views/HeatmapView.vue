<template>
  <div class="heatmap-view">
    <button class="refresh-btn" @click="loadData" :disabled="loading">
      🔄 刷新数据
    </button>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else class="heatmap-container">
      <h2 class="heatmap-title">📊 过去7天消毒次数热力图</h2>

      <table class="heatmap-table" v-if="heatmapData.length > 0">
        <thead>
          <tr>
            <th>器材名称</th>
            <th v-for="date in uniqueDates" :key="date">
              {{ formatDate(date) }}
            </th>
            <th>总计</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(equipment, equipmentId) in groupedByEquipment" :key="equipmentId">
            <td>{{ equipment[0]?.equipmentName || '' }}</td>
            <td v-for="date in uniqueDates" :key="date">
              <div
                :class="['heatmap-cell', getLevel(getCountForEquipmentAndDate(equipmentId, date))]"
                :title="`${equipment[0]?.equipmentName} - ${formatDate(date)}: ${getCountForEquipmentAndDate(equipmentId, date)} 次`"
              >
                {{ getCountForEquipmentAndDate(equipmentId, date) }}
              </div>
            </td>
            <td>
              <strong>{{ getTotalForEquipment(equipmentId) }}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="heatmap-legend">
        <div class="legend-item">
          <div class="legend-box level-0"></div>
          <span>0 次</span>
        </div>
        <div class="legend-item">
          <div class="legend-box level-1"></div>
          <span>1 次</span>
        </div>
        <div class="legend-item">
          <div class="legend-box level-2"></div>
          <span>2 次</span>
        </div>
        <div class="legend-item">
          <div class="legend-box level-3"></div>
          <span>3 次</span>
        </div>
        <div class="legend-item">
          <div class="legend-box level-4"></div>
          <span>4 次</span>
        </div>
        <div class="legend-item">
          <div class="legend-box level-5"></div>
          <span>5+ 次</span>
        </div>
      </div>

      <div class="stats-card" style="margin-top: 30px;">
        <div class="stats-grid">
          <div class="stat-item total">
            <div class="stat-number">{{ totalRecords }}</div>
            <div class="stat-label">7天总消毒次数</div>
          </div>
          <div class="stat-item sanitized">
            <div class="stat-number">{{ averagePerDay }}</div>
            <div class="stat-label">日均消毒次数</div>
          </div>
          <div class="stat-item unsanitized">
            <div class="stat-number">{{ mostSanitizedEquipment }}</div>
            <div class="stat-label">消毒最多器材</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { sanitizationApi } from '../api'

const loading = ref(false)
const heatmapData = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const response = await sanitizationApi.getHeatmap()
    if (response.data.success) {
      heatmapData.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to load heatmap data:', error)
    alert('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const uniqueDates = computed(() => {
  const dates = new Set()
  heatmapData.value.forEach(item => dates.add(item.date))
  return Array.from(dates).sort()
})

const groupedByEquipment = computed(() => {
  const groups = {}
  heatmapData.value.forEach(item => {
    if (!groups[item.equipmentId]) {
      groups[item.equipmentId] = []
    }
    groups[item.equipmentId].push(item)
  })
  return groups
})

const getCountForEquipmentAndDate = (equipmentId, date) => {
  const item = heatmapData.value.find(
    d => d.equipmentId === equipmentId && d.date === date
  )
  return item ? item.count : 0
}

const getTotalForEquipment = (equipmentId) => {
  const items = groupedByEquipment.value[equipmentId] || []
  return items.reduce((sum, item) => sum + item.count, 0)
}

const getLevel = (count) => {
  if (count === 0) return 'level-0'
  if (count === 1) return 'level-1'
  if (count === 2) return 'level-2'
  if (count === 3) return 'level-3'
  if (count === 4) return 'level-4'
  return 'level-5'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDay = weekDays[date.getDay()]
  return `${month}/${day} ${weekDay}`
}

const totalRecords = computed(() => {
  return heatmapData.value.reduce((sum, item) => sum + item.count, 0)
})

const averagePerDay = computed(() => {
  if (uniqueDates.value.length === 0) return 0
  return (totalRecords.value / uniqueDates.value.length).toFixed(1)
})

const mostSanitizedEquipment = computed(() => {
  let maxCount = 0
  let maxEquipment = '-'
  
  Object.keys(groupedByEquipment.value).forEach(equipmentId => {
    const total = getTotalForEquipment(equipmentId)
    if (total > maxCount) {
      maxCount = total
      const items = groupedByEquipment.value[equipmentId]
      if (items.length > 0) {
        maxEquipment = items[0].equipmentName
      }
    }
  })
  
  return maxEquipment
})

onMounted(() => {
  loadData()
})
</script>
