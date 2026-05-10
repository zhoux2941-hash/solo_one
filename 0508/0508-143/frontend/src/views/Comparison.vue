<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>蜂箱对比分析</span>
        </div>
      </template>

      <el-form :inline="true" style="margin-bottom: 20px">
        <el-form-item label="选择蜂箱">
          <el-select
            v-model="selectedBeehives"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择要对比的蜂箱"
            style="width: 400px"
            @change="loadComparisonData"
          >
            <el-option
              v-for="beehive in beehives"
              :key="beehive.id"
              :label="beehive.hiveNumber"
              :value="beehive.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="loadComparisonData"
          />
        </el-form-item>
      </el-form>

      <el-row :gutter="20" v-if="comparisonData">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>早晨温度对比</span>
            </template>
            <div ref="morningTempRef" style="width: 100%; height: 350px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px" v-if="comparisonData">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>晚间温度对比</span>
            </template>
            <div ref="eveningTempRef" style="width: 100%; height: 350px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px" v-if="comparisonData">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>活动强度对比</span>
            </template>
            <div ref="activityRef" style="width: 100%; height: 350px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row style="margin-top: 20px" v-if="comparisonData">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>数据明细</span>
            </template>
            <el-table :data="tableData" stripe border>
              <el-table-column prop="date" label="日期" width="120" fixed="left" />
              <template v-for="hiveId in selectedBeehives" :key="hiveId">
                <el-table-column :label="getHiveNumber(hiveId)" align="center">
                  <el-table-column label="早温(°C)" prop="morningTemperatures">
                    <template #default="{ row }">
                      {{ row.morningTemperatures[hiveId] ?? '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="晚温(°C)" prop="eveningTemperatures">
                    <template #default="{ row }">
                      {{ row.eveningTemperatures[hiveId] ?? '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="活动" prop="activityLevels">
                    <template #default="{ row }">
                      {{ row.activityLevels[hiveId] ?? '-' }}
                    </template>
                  </el-table-column>
                </el-table-column>
              </template>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="!comparisonData" description="请选择蜂箱进行对比" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { getBeehives } from '@/api/beehive'
import { getComparisonData } from '@/api/comparison'

const beehives = ref([])
const selectedBeehives = ref([])
const dateRange = ref([])
const comparisonData = ref(null)

const morningTempRef = ref(null)
const eveningTempRef = ref(null)
const activityRef = ref(null)

let morningChart = null
let eveningChart = null
let activityChart = null

const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#9b59b6', '#1abc9c', '#e91e63']

const tableData = computed(() => {
  if (!comparisonData.value) return []
  
  return comparisonData.value.dates.map((date, index) => {
    const row = { date }
    
    row.morningTemperatures = {}
    row.eveningTemperatures = {}
    row.activityLevels = {}
    
    for (const hiveId of selectedBeehives.value) {
      const hiveIdStr = String(hiveId)
      row.morningTemperatures[hiveId] = comparisonData.value.morningTemperatures[hiveId]?.[index]
      row.eveningTemperatures[hiveId] = comparisonData.value.eveningTemperatures[hiveId]?.[index]
      row.activityLevels[hiveId] = comparisonData.value.activityLevels[hiveId]?.[index]
    }
    
    return row
  })
})

function getHiveNumber(id) {
  const beehive = beehives.value.find(b => b.id === id)
  return beehive?.hiveNumber || id
}

async function loadBeehives() {
  try {
    beehives.value = await getBeehives()
    if (beehives.value.length >= 2) {
      selectedBeehives.value = beehives.value.slice(0, 2).map(b => b.id)
      
      const today = new Date()
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
      dateRange.value = [
        twoWeeksAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      ]
      
      loadComparisonData()
    }
  } catch (error) {
    console.error('加载蜂箱列表失败', error)
  }
}

async function loadComparisonData() {
  if (selectedBeehives.value.length < 2) {
    comparisonData.value = null
    return
  }
  
  try {
    const params = { beehiveIds: selectedBeehives.value }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    comparisonData.value = await getComparisonData(
      selectedBeehives.value,
      dateRange.value?.[0],
      dateRange.value?.[1]
    )
    
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('加载对比数据失败', error)
  }
}

function renderCharts() {
  if (!comparisonData.value) return
  
  renderMorningTempChart()
  renderEveningTempChart()
  renderActivityChart()
}

function createSeries(dataMap, yAxisName) {
  return selectedBeehives.value.map((hiveId, index) => {
    const hiveKey = String(hiveId)
    return {
      name: getHiveNumber(hiveId),
      type: 'line',
      data: dataMap[hiveId] || [],
      smooth: true,
      lineStyle: { color: colors[index % colors.length], width: 2 },
      itemStyle: { color: colors[index % colors.length] }
    }
  })
}

function renderMorningTempChart() {
  if (!morningTempRef.value) return
  
  morningChart = echarts.init(morningTempRef.value)
  morningChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: selectedBeehives.value.map(id => getHiveNumber(id)) },
    xAxis: {
      type: 'category',
      data: comparisonData.value.dates,
      axisLabel: { rotate: 45 }
    },
    yAxis: {
      type: 'value',
      name: '温度(°C)'
    },
    series: createSeries(comparisonData.value.morningTemperatures)
  })
}

function renderEveningTempChart() {
  if (!eveningTempRef.value) return
  
  eveningChart = echarts.init(eveningTempRef.value)
  eveningChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: selectedBeehives.value.map(id => getHiveNumber(id)) },
    xAxis: {
      type: 'category',
      data: comparisonData.value.dates,
      axisLabel: { rotate: 45 }
    },
    yAxis: {
      type: 'value',
      name: '温度(°C)'
    },
    series: createSeries(comparisonData.value.eveningTemperatures)
  })
}

function renderActivityChart() {
  if (!activityRef.value) return
  
  activityChart = echarts.init(activityRef.value)
  activityChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: selectedBeehives.value.map(id => getHiveNumber(id)) },
    xAxis: {
      type: 'category',
      data: comparisonData.value.dates,
      axisLabel: { rotate: 45 }
    },
    yAxis: {
      type: 'value',
      name: '活动强度',
      min: 0,
      max: 10
    },
    series: createSeries(comparisonData.value.activityLevels)
  })
}

function handleResize() {
  morningChart?.resize()
  eveningChart?.resize()
  activityChart?.resize()
}

onMounted(() => {
  loadBeehives()
  window.addEventListener('resize', handleResize)
})
</script>
