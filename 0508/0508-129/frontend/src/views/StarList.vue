<template>
  <div class="star-list-page">
    <el-card class="page-header-card">
      <div class="header-content">
        <h2>变星列表</h2>
        <p>选择要观测的变星，查看详细信息和参考星</p>
      </div>
    </el-card>

    <el-row :gutter="20" class="search-row">
      <el-col :span="6">
        <el-select
          v-model="filterType"
          placeholder="按类型筛选"
          clearable
          style="width: 100%"
          @change="handleFilter"
        >
          <el-option
            v-for="type in starTypes"
            :key="type"
            :label="type"
            :value="type"
          />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-select
          v-model="filterConstellation"
          placeholder="按星座筛选"
          clearable
          style="width: 100%"
          @change="handleFilter"
        >
          <el-option
            v-for="const in constellations"
            :key="const"
            :label="const"
            :value="const"
          />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-button type="primary" @click="loadStarList">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="star-list-card">
          <template #header>
            <div class="card-header">
              <span>变星列表</span>
              <el-tag>{{ starList.length }} 颗</el-tag>
            </div>
          </template>
          
          <el-table :data="starList" stripe @row-click="handleStarClick">
            <el-table-column prop="name" label="星名" width="180" />
            <el-table-column prop="constellation" label="星座" width="100" />
            <el-table-column prop="starType" label="类型" width="140">
              <template #default="{ row }">
                <el-tag :type="getStarTypeColor(row.starType)" size="small">
                  {{ row.starType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="periodDays" label="周期(天)" width="100" />
            <el-table-column label="星等范围">
              <template #default="{ row }">
                {{ row.minMagnitude }} ~ {{ row.maxMagnitude }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="star-detail-card" v-if="selectedStar">
          <template #header>
            <div class="card-header">
              <span>{{ selectedStar.name }} - 详细信息</span>
            </div>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="星座">
              {{ selectedStar.constellation }}
            </el-descriptions-item>
            <el-descriptions-item label="类型">
              <el-tag :type="getStarTypeColor(selectedStar.starType)">
                {{ selectedStar.starType }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="赤经(时)">
              {{ selectedStar.raHours }}
            </el-descriptions-item>
            <el-descriptions-item label="赤纬(度)">
              {{ selectedStar.decDegrees }}
            </el-descriptions-item>
            <el-descriptions-item label="周期(天)">
              {{ selectedStar.periodDays }}
            </el-descriptions-item>
            <el-descriptions-item label="历元(JD)">
              {{ selectedStar.epochJd }}
            </el-descriptions-item>
            <el-descriptions-item label="最亮星等">
              {{ selectedStar.maxMagnitude }}
            </el-descriptions-item>
            <el-descriptions-item label="最暗星等">
              {{ selectedStar.minMagnitude }}
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ selectedStar.description }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="reference-stars-card" v-if="selectedStar && referenceStars.length > 0">
          <template #header>
            <div class="card-header">
              <span>参考星 (亮度比较序列)</span>
              <el-tag type="info">{{ referenceStars.length }} 颗</el-tag>
            </div>
          </template>
          
          <el-table :data="referenceStars" stripe>
            <el-table-column prop="sequenceOrder" label="序号" width="80" />
            <el-table-column prop="name" label="星名" width="180" />
            <el-table-column prop="magnitude" label="星等" width="100">
              <template #default="{ row }">
                <span class="mag-value">{{ row.magnitude }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="spectralType" label="光谱型" width="100" />
            <el-table-column label="属性">
              <template #default="{ row }">
                <el-tag v-if="row.isPrimary" type="success" size="small">主参考</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="star-detail-card" v-else-if="!selectedStar">
          <el-empty description="请选择一颗变星查看详情" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getStarList, getStarDetail, getStarTypes, getConstellations } from '@/api/stars'

const starList = ref([])
const starTypes = ref([])
const constellations = ref([])
const filterType = ref('')
const filterConstellation = ref('')
const selectedStar = ref(null)
const referenceStars = ref([])

const getStarTypeColor = (type) => {
  if (type.includes('造父')) return 'warning'
  if (type.includes('天琴座RR')) return 'success'
  return 'info'
}

const loadStarList = async () => {
  try {
    const params = {}
    if (filterType.value) params.type = filterType.value
    if (filterConstellation.value) params.constellation = filterConstellation.value
    
    const data = await getStarList(params)
    starList.value = data
  } catch (e) {
    ElMessage.error('加载变星列表失败')
  }
}

const loadFilters = async () => {
  try {
    starTypes.value = await getStarTypes()
    constellations.value = await getConstellations()
  } catch (e) {
    console.error('加载筛选条件失败')
  }
}

const handleFilter = () => {
  loadStarList()
}

const handleStarClick = async (row) => {
  selectedStar.value = row
  try {
    const detail = await getStarDetail(row.id)
    referenceStars.value = detail.referenceStars
  } catch (e) {
    ElMessage.error('加载变星详情失败')
  }
}

onMounted(() => {
  loadFilters()
  loadStarList()
})
</script>

<style scoped>
.star-list-page {
  padding: 10px;
}

.page-header-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
}

.page-header-card :deep(.el-card__body) {
  padding: 20px;
}

.page-header-card h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.page-header-card p {
  margin: 0;
  opacity: 0.9;
}

.search-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.star-list-card,
.star-detail-card,
.reference-stars-card {
  margin-bottom: 20px;
}

.mag-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #667eea;
}

.el-table tr {
  cursor: pointer;
}
</style>
