<template>
  <div class="allocation-page">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="map-card">
          <template #header>
            <div class="card-header">
              <el-icon><MapLocation /></el-icon>
              <span>救援点地图</span>
              <el-tag type="info" style="margin-left: auto">点击地图添加救援点</el-tag>
            </div>
          </template>
          <div class="map-container" ref="mapContainer" @click="handleMapClick">
            <svg class="map-svg" viewBox="0 0 800 500">
              <defs>
                <radialGradient id="landGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" style="stop-color:#a8d5a2;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#6b9e66;stop-opacity:1" />
                </radialGradient>
                <radialGradient id="warehouseGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" style="stop-color:#409EFF;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#1E6BB8;stop-opacity:1" />
                </radialGradient>
              </defs>
              
              <rect width="800" height="500" fill="#e8f4f8" rx="8" />
              
              <path d="M50,150 Q200,80 350,120 T700,100 L750,200 Q650,250 500,280 T200,260 L80,220 Z" 
                    fill="url(#landGradient)" stroke="#4a7c45" stroke-width="2" />
              <path d="M100,300 Q250,350 400,320 T700,340 L750,450 Q600,480 400,460 T150,420 L80,380 Z" 
                    fill="url(#landGradient)" stroke="#4a7c45" stroke-width="2" />
              
              <g v-for="(warehouse, idx) in warehouses" :key="warehouse.id">
                <circle 
                  :cx="warehouse.mapX" 
                  :cy="warehouse.mapY" 
                  r="20" 
                  fill="url(#warehouseGradient)" 
                  stroke="#fff" 
                  stroke-width="3"
                  class="warehouse-point"
                />
                <text :x="warehouse.mapX" :y="warehouse.mapY + 5" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">
                  {{ idx + 1 }}
                </text>
                <text :x="warehouse.mapX" :y="warehouse.mapY + 38" text-anchor="middle" fill="#303133" font-size="11">
                  {{ warehouse.name }}
                </text>
              </g>
              
              <g v-for="(point, idx) in reliefPoints" :key="point.id">
                <line 
                  v-if="result && getPointAllocation(point.id)"
                  :x1="getNearestWarehouse(point).mapX" 
                  :y1="getNearestWarehouse(point).mapY"
                  :x2="point.mapX" 
                  :y2="point.mapY"
                  stroke="#E6A23C" 
                  stroke-width="2" 
                  stroke-dasharray="5,5"
                  opacity="0.7"
                />
                <circle 
                  :cx="point.mapX" 
                  :cy="point.mapY" 
                  r="16" 
                  :fill="getPointColor(point)" 
                  stroke="#fff" 
                  stroke-width="2"
                  class="relief-point"
                  @click.stop="editPoint(point)"
                />
                <text :x="point.mapX" :y="point.mapY + 5" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">
                  {{ idx + 1 }}
                </text>
                <text :x="point.mapX" :y="point.mapY + 32" text-anchor="middle" fill="#303133" font-size="10">
                  {{ point.name }}
                </text>
                <text 
                  v-if="getPointAllocation(point.id)" 
                  :x="point.mapX" 
                  :y="point.mapY + 45" 
                  text-anchor="middle" 
                  :fill="getPointAllocation(point.id).satisfactionRate >= 0.8 ? '#67C23A' : '#F56C6C'" 
                  font-size="9"
                  font-weight="bold"
                >
                  {{ (getPointAllocation(point.id).satisfactionRate * 100).toFixed(0) }}%
                </text>
              </g>
              
              <g v-if="!isCalculating && reliefPoints.length === 0">
                <text x="400" y="250" text-anchor="middle" fill="#909399" font-size="16">
                  点击地图任意位置添加救援点
                </text>
              </g>
            </svg>
            
            <div class="map-legend">
              <div class="legend-item">
                <div class="legend-color warehouse"></div>
                <span>物资仓库</span>
              </div>
              <div class="legend-item">
                <div class="legend-color relief"></div>
                <span>救援点</span>
              </div>
              <div class="legend-item">
                <div class="legend-color route"></div>
                <span>配送路线</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="control-card">
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>分配设置</span>
            </div>
          </template>
          
          <el-form label-width="100px">
            <el-form-item label="算法选择">
              <el-radio-group v-model="algorithm">
                <el-radio value="GREEDY">贪心算法</el-radio>
                <el-radio value="GENETIC">遗传算法</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-divider />
            
            <el-form-item label="救援点列表">
              <div class="point-list">
                <div 
                  v-for="(point, idx) in reliefPoints" 
                  :key="point.id" 
                  class="point-item"
                  :class="{ active: editingPoint?.id === point.id }"
                >
                  <div class="point-index">{{ idx + 1 }}</div>
                  <div class="point-info">
                    <div class="point-name">{{ point.name }}</div>
                    <div class="point-detail">人口: {{ point.affectedPopulation?.toLocaleString() }} | 优先级: {{ point.priority }}</div>
                  </div>
                  <div class="point-actions">
                    <el-button size="small" text @click="editPoint(point)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button size="small" text type="danger" @click="removePoint(point)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
                <el-empty v-if="reliefPoints.length === 0" description="暂无救援点" :image-size="60" />
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                @click="calculateAllocation" 
                :loading="isCalculating" 
                :disabled="reliefPoints.length === 0"
                style="width: 100%"
              >
                <el-icon><Cpu /></el-icon>
                <span>计算最优分配</span>
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <el-card class="result-card" v-if="result">
          <template #header>
            <div class="card-header">
              <el-icon><DataAnalysis /></el-icon>
              <span>分配结果</span>
              <el-tag type="success" style="margin-left: auto">{{ result.algorithm === 'GENETIC' ? '遗传算法' : '贪心算法' }}</el-tag>
            </div>
          </template>
          
          <el-descriptions :column="1" border>
            <el-descriptions-item label="总满足率">
              <el-progress 
                :percentage="(result.satisfactionRate * 100).toFixed(1)" 
                :status="result.satisfactionRate >= 0.8 ? 'success' : 'warning'"
              />
            </el-descriptions-item>
            <el-descriptions-item label="总运输成本">
              <span style="font-weight: 600; color: #409EFF">{{ result.totalCost?.toFixed(2) }} 单位</span>
            </el-descriptions-item>
          </el-descriptions>
          
          <el-divider>各救援点详情</el-divider>
          
          <div class="allocation-list">
            <div v-for="allocation in result.allocations" :key="allocation.pointId" class="allocation-item">
              <div class="allocation-header">
                <span class="point-name">{{ allocation.pointName }}</span>
                <el-tag :type="allocation.satisfactionRate >= 0.8 ? 'success' : 'warning'">
                  {{ (allocation.satisfactionRate * 100).toFixed(1) }}%
                </el-tag>
              </div>
              <div class="allocation-detail">
                <span>距离: {{ allocation.distance?.toFixed(2) }} km</span>
              </div>
              <el-row :gutter="10" class="supply-row">
                <el-col :span="6" v-for="item in supplyTypes" :key="item.key">
                  <div class="supply-mini">
                    <span class="label">{{ item.label }}</span>
                    <span class="value">{{ allocation.allocated[item.key]?.toLocaleString() || 0 }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
          
          <el-divider>操作</el-divider>
          <el-button type="success" @click="saveToCompare" style="width: 100%">
            <el-icon><Plus /></el-icon>
            <span>保存方案用于对比</span>
          </el-button>
        </el-card>
      </el-col>
    </el-row>
    
    <el-dialog v-model="pointDialogVisible" title="编辑救援点" width="400px">
      <el-form :model="editingPoint" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="editingPoint.name" placeholder="请输入救援点名称" />
        </el-form-item>
        <el-form-item label="受灾人口">
          <el-input-number v-model="editingPoint.affectedPopulation" :min="100" :max="100000" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-slider v-model="editingPoint.priority" :min="0.5" :max="2.0" :step="0.1" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pointDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePoint">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { calculateAllocation, getWarehouses } from '@/api'
import { ElMessage } from 'element-plus'

const mapContainer = ref(null)
const reliefPoints = ref([])
const warehouses = ref([])
const algorithm = ref('GREEDY')
const result = ref(null)
const isCalculating = ref(false)
const pointDialogVisible = ref(false)
const editingPoint = ref(null)
const savedPlans = ref([])

const supplyTypes = [
  { key: 'tentQuantity', label: '帐篷' },
  { key: 'waterQuantity', label: '水' },
  { key: 'foodQuantity', label: '食物' },
  { key: 'medicalKitQuantity', label: '医疗' }
]

const defaultWarehouses = [
  { id: 1, name: '中央仓库A', mapX: 200, mapY: 180, latitude: 39.9042, longitude: 116.4074 },
  { id: 2, name: '区域仓库B', mapX: 600, mapY: 200, latitude: 31.2304, longitude: 121.4737 },
  { id: 3, name: '区域仓库C', mapX: 400, mapY: 380, latitude: 30.5728, longitude: 104.0668 }
]

onMounted(async () => {
  try {
    const data = await getWarehouses()
    if (data && data.length > 0) {
      warehouses.value = data.map((w, i) => ({
        ...w,
        mapX: defaultWarehouses[i]?.mapX || (100 + i * 250),
        mapY: defaultWarehouses[i]?.mapY || 200
      }))
    } else {
      warehouses.value = defaultWarehouses
    }
  } catch (e) {
    warehouses.value = defaultWarehouses
  }
})

const handleMapClick = (event) => {
  if (isCalculating.value) return
  
  const rect = mapContainer.value.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 800
  const y = ((event.clientY - rect.top) / rect.height) * 500
  
  if (x < 50 || x > 750 || y < 50 || y > 450) return
  
  const lat = 45 - (y / 500) * 40
  const lng = 80 + (x / 800) * 60
  
  const newPoint = {
    id: Date.now(),
    name: `救援点${reliefPoints.value.length + 1}`,
    mapX: x,
    mapY: y,
    latitude: lat,
    longitude: lng,
    affectedPopulation: 5000,
    priority: 1.0
  }
  
  reliefPoints.value.push(newPoint)
  result.value = null
}

const editPoint = (point) => {
  editingPoint.value = reactive({ ...point })
  pointDialogVisible.value = true
}

const savePoint = () => {
  const idx = reliefPoints.value.findIndex(p => p.id === editingPoint.value.id)
  if (idx !== -1) {
    reliefPoints.value[idx] = { ...editingPoint.value }
  }
  pointDialogVisible.value = false
  result.value = null
}

const removePoint = (point) => {
  const idx = reliefPoints.value.findIndex(p => p.id === point.id)
  if (idx !== -1) {
    reliefPoints.value.splice(idx, 1)
    result.value = null
  }
}

const getPointColor = (point) => {
  if (!result.value) return '#F56C6C'
  const alloc = getPointAllocation(point.id)
  if (!alloc) return '#F56C6C'
  if (alloc.satisfactionRate >= 0.8) return '#67C23A'
  if (alloc.satisfactionRate >= 0.5) return '#E6A23C'
  return '#F56C6C'
}

const getPointAllocation = (pointId) => {
  if (!result.value || !result.value.allocations) return null
  return result.value.allocations.find(a => a.pointId == pointId)
}

const getNearestWarehouse = (point) => {
  let nearest = warehouses.value[0]
  let minDist = Infinity
  for (const w of warehouses.value) {
    const dist = Math.sqrt(Math.pow(w.mapX - point.mapX, 2) + Math.pow(w.mapY - point.mapY, 2))
    if (dist < minDist) {
      minDist = dist
      nearest = w
    }
  }
  return nearest
}

const calculateAllocation = async () => {
  if (reliefPoints.value.length === 0) return
  
  isCalculating.value = true
  try {
    const request = {
      algorithm: algorithm.value,
      reliefPoints: reliefPoints.value.map(p => ({
        id: p.id,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        affectedPopulation: p.affectedPopulation,
        priority: p.priority
      }))
    }
    
    const data = await calculateAllocation(request)
    result.value = data
    ElMessage.success('分配计算完成')
  } catch (e) {
    console.error(e)
  } finally {
    isCalculating.value = false
  }
}

const saveToCompare = () => {
  if (!result.value) return
  savedPlans.value.push({ ...result.value })
  ElMessage.success(`已保存第 ${savedPlans.value.length} 个方案`)
}
</script>

<style scoped>
.allocation-page {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.map-card {
  margin-bottom: 20px;
}

.map-container {
  width: 100%;
  height: 500px;
  cursor: crosshair;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.map-svg {
  width: 100%;
  height: 100%;
}

.warehouse-point, .relief-point {
  cursor: pointer;
  transition: transform 0.2s;
}

.warehouse-point:hover, .relief-point:hover {
  transform: scale(1.1);
}

.map-legend {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.legend-color.warehouse {
  background: #409EFF;
}

.legend-color.relief {
  background: #F56C6C;
}

.legend-color.route {
  background: #E6A23C;
  border-radius: 0;
  height: 3px;
}

.control-card, .result-card {
  margin-bottom: 20px;
}

.point-list {
  max-height: 200px;
  overflow-y: auto;
}

.point-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.point-item:hover, .point-item.active {
  background: #ecf5ff;
}

.point-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #409EFF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
}

.point-info {
  flex: 1;
}

.point-name {
  font-weight: 500;
  color: #303133;
}

.point-detail {
  font-size: 12px;
  color: #909399;
}

.point-actions {
  display: flex;
  gap: 4px;
}

.allocation-list {
  max-height: 250px;
  overflow-y: auto;
}

.allocation-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 10px;
}

.allocation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.allocation-detail {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.supply-row {
  margin-top: 8px;
}

.supply-mini {
  text-align: center;
  padding: 6px;
  background: #fff;
  border-radius: 4px;
}

.supply-mini .label {
  display: block;
  font-size: 11px;
  color: #909399;
}

.supply-mini .value {
  display: block;
  font-weight: 600;
  color: #303133;
}
</style>
