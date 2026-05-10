<template>
  <div class="export-page">
    <el-card class="page-header-card">
      <div class="header-content">
        <h2>数据导出</h2>
        <p>导出观测数据为CSV格式，用于后续分析</p>
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="export-card">
          <template #header>
            <div class="card-header">
              <span>导出设置</span>
            </div>
          </template>

          <el-form label-width="120px">
            <el-form-item label="选择变星">
              <el-select
                v-model="selectedStarId"
                placeholder="请选择要导出的变星"
                style="width: 100%"
                @change="handleStarChange"
              >
                <el-option
                  v-for="star in starList"
                  :key="star.id"
                  :label="`${star.name} (${star.constellation})`"
                  :value="star.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item v-if="selectedStarInfo">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="星名">
                  {{ selectedStarInfo.name }}
                </el-descriptions-item>
                <el-descriptions-item label="星座">
                  {{ selectedStarInfo.constellation }}
                </el-descriptions-item>
                <el-descriptions-item label="类型">
                  <el-tag :type="getStarTypeColor(selectedStarInfo.starType)">
                    {{ selectedStarInfo.starType }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="周期">
                  {{ selectedStarInfo.periodDays }} 天
                </el-descriptions-item>
                <el-descriptions-item label="观测记录数">
                  <el-badge :value="observationCount" class="item" :max="9999">
                    <span style="color: #667eea; font-weight: bold;">条</span>
                  </el-badge>
                </el-descriptions-item>
              </el-descriptions>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                @click="handleExport"
                :loading="exporting"
                :disabled="!selectedStarId || observationCount === 0"
                size="large"
              >
                <el-icon><Download /></el-icon>
                导出为CSV文件
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="format-card">
          <template #header>
            <div class="card-header">
              <span>CSV格式说明</span>
            </div>
          </template>

          <el-table :data="formatColumns" stripe size="small">
            <el-table-column prop="column" label="列名" width="120" />
            <el-table-column prop="description" label="说明" />
            <el-table-column prop="example" label="示例" width="180" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="preview-card">
          <template #header>
            <div class="card-header">
              <span>数据预览</span>
              <el-tag type="info" v-if="selectedStarId">
                显示最近 {{ Math.min(observationCount, 10) }} 条
              </el-tag>
            </div>
          </template>

          <el-table
            v-if="previewData.length > 0"
            :data="previewData"
            stripe
            size="small"
            style="max-height: 500px; overflow-y: auto;"
          >
            <el-table-column label="序号" type="index" width="50" />
            <el-table-column label="观测时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.observationTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="phase" label="相位" width="80">
              <template #default="{ row }">
                {{ row.phase?.toFixed(3) }}
              </template>
            </el-table-column>
            <el-table-column prop="estimatedMagnitude" label="星等" width="100">
              <template #default="{ row }">
                <span class="mag-value">{{ row.estimatedMagnitude }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="magnitudeError" label="误差" width="80">
              <template #default="{ row }">
                ±{{ row.magnitudeError }}
              </template>
            </el-table-column>
            <el-table-column prop="observerName" label="观测者" width="100" />
          </el-table>

          <el-empty v-else-if="!selectedStarId" description="请选择变星以预览数据" />
          <el-empty v-else description="该变星暂无观测记录" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getStarList } from '@/api/stars'
import { getObservationsByStar, exportObservations } from '@/api/observations'

const starList = ref([])
const selectedStarId = ref(null)
const selectedStarInfo = ref(null)
const observations = ref([])
const exporting = ref(false)

const observationCount = computed(() => observations.value.length)

const previewData = computed(() => {
  return [...observations.value]
    .sort((a, b) => new Date(b.observationTime) - new Date(a.observationTime))
    .slice(0, 10)
})

const formatColumns = [
  { column: '观测时间', description: '观测的日期和时间', example: '2024-01-15 20:30:00' },
  { column: '儒略日(JD)', description: '对应的儒略日', example: '2460325.354' },
  { column: '相位', description: '基于周期计算的相位', example: '0.4523' },
  { column: '估算星等', description: '插值法估算的星等', example: '7.35' },
  { column: '星等误差', description: '估算的误差范围', example: '0.18' },
  { column: '参考星A', description: '用于比较的参考星A', example: 'Reference A1' },
  { column: '参考星A星等', description: '参考星A的已知星等', example: '7.20' },
  { column: '与A比较', description: '与参考星A的亮度比较', example: '0.15' },
  { column: '参考星B', description: '用于比较的参考星B', example: 'Reference A2' },
  { column: '参考星B星等', description: '参考星B的已知星等', example: '7.50' },
  { column: '与B比较', description: '与参考星B的亮度比较', example: '-0.05' },
  { column: '观测者', description: '观测者名称', example: '张三' },
  { column: '观测方法', description: '观测方法（目视/单反/CCD）', example: '目视' },
  { column: '仪器', description: '使用的仪器', example: '8寸望远镜' },
  { column: '天空条件', description: '观测时的天气条件', example: '良好' },
  { column: '备注', description: '其他观测备注', example: '视宁度一般' }
]

const getStarTypeColor = (type) => {
  if (!type) return 'info'
  if (type.includes('造父')) return 'warning'
  if (type.includes('天琴座RR')) return 'success'
  return 'info'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadStars = async () => {
  try {
    starList.value = await getStarList({})
  } catch (e) {
    console.error('加载变星列表失败')
  }
}

const handleStarChange = async (starId) => {
  if (starId) {
    selectedStarInfo.value = starList.value.find(s => s.id === starId)
    try {
      observations.value = await getObservationsByStar(starId)
    } catch (e) {
      ElMessage.error('加载观测数据失败')
    }
  } else {
    selectedStarInfo.value = null
    observations.value = []
  }
}

const handleExport = async () => {
  if (!selectedStarId.value) {
    ElMessage.warning('请先选择变星')
    return
  }

  exporting.value = true
  try {
    const blob = await exportObservations(selectedStarId.value)
    
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    const starName = selectedStarInfo.value?.name?.replace(/\s/g, '_') || 'star'
    link.download = `observations_${starName}_${timestamp}.csv`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success({
      message: `已导出 ${observationCount.value} 条观测记录`,
      duration: 3000
    })
  } catch (e) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  loadStars()
})
</script>

<style scoped>
.export-page {
  padding: 10px;
}

.page-header-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.export-card,
.format-card,
.preview-card {
  margin-bottom: 20px;
}

.mag-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #667eea;
}
</style>
