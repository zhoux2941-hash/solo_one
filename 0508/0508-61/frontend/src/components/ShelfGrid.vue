<template>
  <div class="card">
    <div class="card-title flex justify-between items-center">
      <span>🗂️ 货架分配状态</span>
      <button 
        class="btn btn-danger text-sm" 
        @click="resetShelf"
        :disabled="resetting"
        type="button"
      >
        {{ resetting ? '重置中...' : '🔄 重置货架' }}
      </button>
    </div>

    <div class="legend flex gap-4 mb-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="legend-box" style="background: #e5e7eb;"></div>
        <span>空 (0%)</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="legend-box" style="background: #86efac;"></div>
        <span>低 (1-33%)</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="legend-box" style="background: #fbbf24;"></div>
        <span>中 (34-66%)</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="legend-box" style="background: #f87171;"></div>
        <span>高 (67-100%)</span>
      </div>
    </div>

    <div v-for="row in 3" :key="row" class="shelf-row">
      <div class="shelf-label">
        第 {{ row }} 排
      </div>
      <div class="cells">
        <div
          v-for="col in 10"
          :key="col"
          class="cell"
          :style="getCellStyle(row, col)"
          @mouseenter="showTooltip($event, row, col)"
          @mouseleave="hideTooltip"
          @mousemove="moveTooltip($event)"
        >
          <div class="cell-number">{{ row }}-{{ col }}</div>
          <div v-if="getCellUsageRate(row, col) > 0" class="cell-usage">
            {{ Math.round(getCellUsageRate(row, col) * 100) }}%
          </div>
          <div v-if="getCellParcels(row, col).length > 0" class="cell-count">
            {{ getCellParcels(row, col).length }} 件
          </div>
        </div>
      </div>
    </div>

    <div v-if="shelfStatus" class="mt-6 stats">
      <div class="stat-item">
        <div class="stat-label">总容量</div>
        <div class="stat-value">{{ shelfStatus.totalCapacityM3.toFixed(2) }} m³</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">已使用</div>
        <div class="stat-value">
          {{ (shelfStatus.totalCapacityM3 * shelfStatus.utilizationRate).toFixed(4) }} m³
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-label">利用率</div>
        <div class="stat-value" :style="{ color: getUtilizationColor() }">
          {{ (shelfStatus.utilizationRate * 100).toFixed(2) }}%
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-label">已分配包裹</div>
        <div class="stat-value">{{ totalParcelsCount }} 件</div>
      </div>
    </div>

    <div 
      v-if="tooltip.visible" 
      class="tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-title">第 {{ tooltip.row }} 排 - 第 {{ tooltip.col }} 格</div>
      <div class="tooltip-content">
        <div>容量: 0.1 m³</div>
        <div>已使用: {{ (tooltip.usage * 100).toFixed(2) }}%</div>
        <div v-if="tooltip.parcels.length > 0" class="mt-2">
          <strong>存放包裹:</strong>
          <div class="parcel-list">
            <span v-for="p in tooltip.parcels" :key="p" class="parcel-tag">
              {{ p }}
            </span>
          </div>
        </div>
        <div v-else class="mt-2" style="color: #9ca3af;">
          空格子
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { parcelAPI } from '../api.js'

const props = defineProps({
  allocationResult: {
    type: Object,
    default: null
  }
})

const shelfStatus = ref(null)
const resetting = ref(false)
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  row: 0,
  col: 0,
  usage: 0,
  parcels: []
})

const totalParcelsCount = computed(() => {
  if (!shelfStatus.value) return 0
  return shelfStatus.value.shelfCells.reduce((sum, cell) => sum + cell.parcelNos.length, 0)
})

function getCellStyle(row, col) {
  const rate = getCellUsageRate(row, col)
  let bgColor = '#e5e7eb'
  
  if (rate > 0 && rate <= 0.33) bgColor = '#86efac'
  else if (rate > 0.33 && rate <= 0.66) bgColor = '#fbbf24'
  else if (rate > 0.66) bgColor = '#f87171'

  return { backgroundColor: bgColor }
}

function getCellUsageRate(row, col) {
  if (!shelfStatus.value) return 0
  const cell = shelfStatus.value.shelfCells.find(c => c.row === row && c.col === col)
  return cell ? cell.usageRate : 0
}

function getCellParcels(row, col) {
  if (!shelfStatus.value) return []
  const cell = shelfStatus.value.shelfCells.find(c => c.row === row && c.col === col)
  return cell ? cell.parcelNos : []
}

function showTooltip(event, row, col) {
  tooltip.value = {
    visible: true,
    x: event.clientX + 15,
    y: event.clientY + 15,
    row,
    col,
    usage: getCellUsageRate(row, col),
    parcels: getCellParcels(row, col)
  }
}

function hideTooltip() {
  tooltip.value.visible = false
}

function moveTooltip(event) {
  if (tooltip.value.visible) {
    tooltip.value.x = event.clientX + 15
    tooltip.value.y = event.clientY + 15
  }
}

function getUtilizationColor() {
  if (!shelfStatus.value) return '#333'
  const rate = shelfStatus.value.utilizationRate
  if (rate < 0.33) return '#10b981'
  if (rate < 0.66) return '#f59e0b'
  return '#ef4444'
}

async function loadShelfStatus() {
  try {
    const res = await parcelAPI.getShelfStatus()
    shelfStatus.value = res.data
  } catch (error) {
    console.error('加载货架状态失败:', error)
  }
}

async function resetShelf() {
  if (!confirm('确定要重置货架吗？这将清空所有分配记录。')) {
    return
  }
  
  resetting.value = true
  try {
    await parcelAPI.resetShelf()
    await loadShelfStatus()
  } catch (error) {
    console.error('重置失败:', error)
    alert('重置失败: ' + error.message)
  } finally {
    resetting.value = false
  }
}

onMounted(() => {
  if (props.allocationResult) {
    shelfStatus.value = props.allocationResult
  } else {
    loadShelfStatus()
  }
})

watch(() => props.allocationResult, (newVal) => {
  if (newVal) {
    shelfStatus.value = newVal
  }
})
</script>

<style scoped>
.legend-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
}

.shelf-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.shelf-label {
  width: 60px;
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
  text-align: right;
  padding-right: 10px;
}

.cells {
  display: flex;
  gap: 6px;
  flex: 1;
}

.cell {
  flex: 1;
  min-width: 0;
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px solid #9ca3af;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.cell:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.cell-number {
  font-size: 11px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.7);
}

.cell-usage {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

.cell-count {
  font-size: 9px;
  color: rgba(0, 0, 0, 0.5);
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
  background: #f1f5f9;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.tooltip {
  position: fixed;
  z-index: 1000;
  background: #1f2937;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  max-width: 250px;
  pointer-events: none;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.tooltip-title {
  font-weight: 700;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #374151;
}

.tooltip-content {
  line-height: 1.8;
}

.parcel-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.parcel-tag {
  background: #3b82f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
</style>
