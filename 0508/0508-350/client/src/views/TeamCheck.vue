<template>
  <div class="team-check">
    <div class="page-header">
      <h2>班组核对</h2>
      <p class="subtitle">按渔船或作业班组查看舱位修正记录</p>
    </div>

    <div class="filter-bar">
      <el-radio-group v-model="viewMode" @change="handleViewModeChange">
        <el-radio-button value="ship">
          <el-icon><Ship /></el-icon>
          按船查看
        </el-radio-button>
        <el-radio-button value="workGroup">
          <el-icon><User /></el-icon>
          按班组查看
        </el-radio-button>
      </el-radio-group>

      <el-select
        v-if="viewMode === 'ship'"
        v-model="selectedShipId"
        placeholder="选择渔船"
        clearable
        style="width: 200px"
        @change="loadRecords"
      >
        <el-option
          v-for="ship in shipList"
          :key="ship.shipId"
          :label="ship.shipName"
          :value="ship.shipId"
        />
      </el-select>

      <el-select
        v-if="viewMode === 'workGroup'"
        v-model="selectedWorkGroup"
        placeholder="选择班组"
        clearable
        style="width: 150px"
        @change="loadRecords"
      >
        <el-option label="甲班" value="甲班" />
        <el-option label="乙班" value="乙班" />
        <el-option label="丙班" value="丙班" />
      </el-select>

      <el-button type="primary" @click="showTimeline = !showTimeline">
        <el-icon><Clock /></el-icon>
        {{ showTimeline ? '隐藏时间线' : '显示时间线' }}
      </el-button>
    </div>

    <div v-if="showTimeline" class="timeline-section">
      <h3>近两天错舱修正时间线</h3>
      <CorrectionTimeline :days="2" />
    </div>

    <div v-loading="loading" class="content-area">
      <div v-if="viewMode === 'ship'" class="ship-view">
        <div v-if="selectedShipId" class="ship-detail">
          <div class="ship-header">
            <el-icon :size="40" color="#409eff"><Ship /></el-icon>
            <div>
              <h3>{{ currentShipName }}</h3>
              <p>修正记录共 {{ correctionRecords.length }} 条</p>
            </div>
          </div>
          <CorrectionRecordList :records="correctionRecords" />
        </div>
        <el-empty v-else description="请选择渔船查看修正记录" />
      </div>

      <div v-else class="workgroup-view">
        <el-row :gutter="20">
          <el-col :span="8" v-for="group in workGroups" :key="group.name">
            <div
              class="group-card"
              :class="{ active: selectedWorkGroup === group.name }"
              @click="selectWorkGroup(group.name)"
            >
              <div class="group-header">
                <el-icon :size="32" :color="group.color"><User /></el-icon>
                <span class="group-name">{{ group.name }}</span>
              </div>
              <div class="group-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ groupStats[group.name]?.corrections || 0 }}</span>
                  <span class="stat-label">修正次数</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ groupStats[group.name]?.affectedReceipts || 0 }}</span>
                  <span class="stat-label">影响回单</span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>

        <div v-if="selectedWorkGroup" class="group-records">
          <h4>{{ selectedWorkGroup }} 修正记录</h4>
          <CorrectionRecordList :records="correctionRecords" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Ship, User, Clock } from '@element-plus/icons-vue'
import { correctionApi, mergedDataApi } from '../api'
import type { CabinCorrectionRecord } from '../types'
import CorrectionRecordList from '../components/CorrectionRecordList.vue'
import CorrectionTimeline from '../components/CorrectionTimeline.vue'

const viewMode = ref<'ship' | 'workGroup'>('ship')
const selectedShipId = ref('')
const selectedWorkGroup = ref('')
const showTimeline = ref(false)
const loading = ref(false)
const correctionRecords = ref<CabinCorrectionRecord[]>([])
const shipList = ref<Array<{ shipId: string; shipName: string }>>([])

const workGroups = [
  { name: '甲班', color: '#409eff' },
  { name: '乙班', color: '#67c23a' },
  { name: '丙班', color: '#e6a23c' }
]

const groupStats = reactive<Record<string, { corrections: number; affectedReceipts: number }>>({
  '甲班': { corrections: 0, affectedReceipts: 0 },
  '乙班': { corrections: 0, affectedReceipts: 0 },
  '丙班': { corrections: 0, affectedReceipts: 0 }
})

const currentShipName = computed(() => {
  return shipList.value.find(s => s.shipId === selectedShipId.value)?.shipName || ''
})

const loadShipList = async () => {
  try {
    const response = await mergedDataApi.getAll()
    if (response.data.success) {
      const ships = new Map<string, string>()
      response.data.data.forEach(item => {
        ships.set(item.application.shipId, item.application.shipName)
      })
      shipList.value = Array.from(ships.entries()).map(([shipId, shipName]) => ({ shipId, shipName }))
    }
  } catch (error) {
    console.error('加载渔船列表失败', error)
  }
}

const loadRecords = async () => {
  loading.value = true
  try {
    const params: { shipId?: string; workGroup?: string } = {}
    if (viewMode.value === 'ship' && selectedShipId.value) {
      params.shipId = selectedShipId.value
    } else if (viewMode.value === 'workGroup' && selectedWorkGroup.value) {
      params.workGroup = selectedWorkGroup.value
    }

    const response = await correctionApi.getRecords(params)
    if (response.data.success) {
      correctionRecords.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('加载修正记录失败')
  } finally {
    loading.value = false
  }
}

const loadGroupStats = async () => {
  try {
    const response = await correctionApi.getRecords({ days: 7 })
    if (response.data.success) {
      const records = response.data.data
      workGroups.forEach(group => {
        const groupRecords = records.filter(r => r.workGroup === group.name)
        groupStats[group.name] = {
          corrections: groupRecords.length,
          affectedReceipts: new Set(groupRecords.flatMap(r => r.affectedReceipts)).size
        }
      })
    }
  } catch (error) {
    console.error('加载班组统计失败', error)
  }
}

const handleViewModeChange = () => {
  selectedShipId.value = ''
  selectedWorkGroup.value = ''
  correctionRecords.value = []
}

const selectWorkGroup = (groupName: string) => {
  selectedWorkGroup.value = selectedWorkGroup.value === groupName ? '' : groupName
  loadRecords()
}

onMounted(() => {
  loadShipList()
  loadGroupStats()
})
</script>

<style scoped>
.team-check {
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  color: #606266;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
}

.timeline-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.timeline-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.content-area {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.ship-detail {
  padding: 16px 0;
}

.ship-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.ship-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.ship-header p {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.group-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
}

.group-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.group-card.active {
  border-color: #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.group-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.group-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.group-records {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.group-records h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}
</style>
