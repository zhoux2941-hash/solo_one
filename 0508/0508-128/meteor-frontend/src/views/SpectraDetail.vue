<template>
  <div class="detail-container" v-loading="loading">
    <el-card v-if="spectraDetail" class="detail-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button @click="goBack" text>
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <h2 class="title">{{ spectraDetail.originalFilename }}</h2>
          </div>
          <el-button type="danger" @click="handleDelete" :loading="deleting">
            删除
          </el-button>
        </div>
      </template>
      
      <div class="detail-content">
        <div class="image-section">
          <el-image 
            :src="spectraDetail.imageUrl" 
            fit="contain"
            class="original-image"
            :preview-src-list="[spectraDetail.imageUrl]"
          />
        </div>
        
        <div class="info-section">
          <el-descriptions :column="2" border class="info-desc">
            <el-descriptions-item label="上传者">
              {{ spectraDetail.uploaderName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="上传时间">
              {{ formatDateTime(spectraDetail.uploadTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="波长范围">
              <span v-if="spectraDetail.minWavelength && spectraDetail.maxWavelength">
                {{ spectraDetail.minWavelength.toFixed(0) }} - {{ spectraDetail.maxWavelength.toFixed(0) }} Å
              </span>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="流星速度">
              <span v-if="spectraDetail.velocity">
                {{ spectraDetail.velocity }} km/s
              </span>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="浏览次数">
              {{ spectraDetail.viewCount || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="轨迹坐标">
              <span v-if="spectraDetail.startPixelX">
                ({{ spectraDetail.startPixelX }}, {{ spectraDetail.startPixelY }}) → ({{ spectraDetail.endPixelX }}, {{ spectraDetail.endPixelY }})
              </span>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>
          
          <el-divider />
          
          <div class="edit-section">
            <h3>编辑信息</h3>
            <el-form :model="editForm" label-width="120px" class="edit-form">
              <el-form-item label="流星速度">
                <el-input-number 
                  v-model="editForm.velocity" 
                  :min="0" 
                  :max="100"
                  :step="0.1"
                  placeholder="km/s"
                  :controls="false"
                />
              </el-form-item>
              <el-form-item label="备注">
                <el-input 
                  v-model="editForm.notes" 
                  type="textarea" 
                  :rows="3"
                  placeholder="添加备注"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveEdits" :loading="saving">
                  保存
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
      
      <el-divider />
      
      <div class="spectrum-section">
        <h3 class="section-title">一维光谱图 (波长 vs 强度)</h3>
        <div class="chart-container" v-if="spectraDetail.spectrumData && spectraDetail.spectrumData.length > 0">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <el-empty v-else description="暂无光谱数据" />
      </div>
      
      <el-divider />
      
      <div class="emission-section">
        <div class="section-header">
          <h3 class="section-title">发射线识别</h3>
          <el-button type="primary" @click="showAddLine = true">
            <el-icon><Plus /></el-icon>
            添加识别结果
          </el-button>
        </div>
        
        <el-table 
          :data="spectraDetail.emissionLines" 
          border 
          class="emission-table"
          v-if="spectraDetail.emissionLines && spectraDetail.emissionLines.length > 0"
        >
          <el-table-column prop="element" label="元素" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isAutoDetected ? 'info' : 'success'" size="small">
                {{ row.element }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="wavelength" label="波长 (Å)" width="150">
            <template #default="{ row }">
              {{ row.wavelength?.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="intensity" label="强度" width="120">
            <template #default="{ row }">
              {{ row.intensity?.toFixed(1) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="来源" width="120">
            <template #default="{ row }">
              <el-tag :type="row.isAutoDetected ? 'warning' : 'primary'" size="small">
                {{ row.isAutoDetected ? '自动识别' : '手动添加' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="notes" label="备注" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button 
                type="danger" 
                size="small" 
                link
                @click="deleteEmissionLine(row.id)"
                v-if="!row.isAutoDetected"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无发射线数据" />
      </div>
    </el-card>
    
    <el-dialog 
      v-model="showAddLine" 
      title="添加发射线识别结果"
      width="500px"
    >
      <el-form :model="newLineForm" label-width="100px">
        <el-form-item label="元素">
          <el-select v-model="newLineForm.element" placeholder="选择元素">
            <el-option label="Na (钠)" value="Na"></el-option>
            <el-option label="Mg (镁)" value="Mg"></el-option>
            <el-option label="Fe (铁)" value="Fe"></el-option>
            <el-option label="Ca (钙)" value="Ca"></el-option>
            <el-option label="H (氢)" value="H"></el-option>
            <el-option label="O (氧)" value="O"></el-option>
            <el-option label="N (氮)" value="N"></el-option>
            <el-option label="Si (硅)" value="Si"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="波长 (Å)">
          <el-input-number 
            v-model="newLineForm.wavelength" 
            :min="1000" 
            :max="10000"
            :step="1"
            :controls="false"
          />
        </el-form-item>
        <el-form-item label="强度">
          <el-input-number 
            v-model="newLineForm.intensity" 
            :min="0" 
            :max="1000"
            :step="1"
            :controls="false"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="newLineForm.notes" 
            type="textarea" 
            :rows="2"
            placeholder="添加备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddLine = false">取消</el-button>
        <el-button type="primary" @click="addEmissionLine" :loading="addingLine">
          添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { spectraApi } from '../api/spectra'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const deleting = ref(false)
const saving = ref(false)
const addingLine = ref(false)
const showAddLine = ref(false)

const spectraDetail = ref(null)
const editForm = ref({
  velocity: null,
  notes: ''
})

const newLineForm = ref({
  element: '',
  wavelength: null,
  intensity: null,
  notes: ''
})

const chartData = computed(() => {
  if (!spectraDetail.value?.spectrumData?.length) {
    return { labels: [], datasets: [] }
  }
  
  const data = spectraDetail.value.spectrumData
  const labels = data.map(p => p.wavelength.toFixed(0))
  const intensities = data.map(p => p.intensity)
  
  const emissionLines = spectraDetail.value.emissionLines || []
  
  const datasets = [
    {
      label: '光谱强度',
      data: intensities,
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      fill: true,
      tension: 0.1,
      pointRadius: 0
    }
  ]
  
  return { labels, datasets }
})

const chartOptions = computed(() => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            if (items.length > 0) {
              return `波长: ${items[0].label} Å`
            }
            return ''
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '波长 (Å)'
        }
      },
      y: {
        title: {
          display: true,
          text: '强度'
        },
        beginAtZero: true
      }
    }
  }
  
  return options
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const response = await spectraApi.getDetail(route.params.id)
    spectraDetail.value = response.data
    
    editForm.value.velocity = response.data.velocity
    editForm.value.notes = response.data.notes || ''
  } catch (error) {
    ElMessage.error('获取光谱详情失败')
  } finally {
    loading.value = false
  }
}

const saveEdits = async () => {
  saving.value = true
  try {
    await spectraApi.update(route.params.id, editForm.value)
    ElMessage.success('保存成功')
    fetchDetail()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const addEmissionLine = async () => {
  if (!newLineForm.value.element || !newLineForm.value.wavelength) {
    ElMessage.warning('请填写元素和波长')
    return
  }
  
  addingLine.value = true
  try {
    await spectraApi.addEmissionLine(route.params.id, {
      ...newLineForm.value,
      isAutoDetected: false
    })
    ElMessage.success('添加成功')
    showAddLine.value = false
    newLineForm.value = {
      element: '',
      wavelength: null,
      intensity: null,
      notes: ''
    }
    fetchDetail()
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    addingLine.value = false
  }
}

const deleteEmissionLine = async (lineId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条发射线吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await spectraApi.deleteEmissionLine(lineId)
    ElMessage.success('删除成功')
    fetchDetail()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这个光谱记录吗？此操作不可恢复。', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    deleting.value = true
    await spectraApi.delete(route.params.id)
    ElMessage.success('删除成功')
    router.push('/')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  } finally {
    deleting.value = false
  }
}

const goBack = () => {
  router.back()
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.detail-container {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.detail-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.image-section {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.original-image {
  max-width: 100%;
  max-height: 500px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-desc {
  margin-bottom: 20px;
}

.edit-section h3 {
  margin-bottom: 16px;
  font-size: 16px;
  color: #303133;
}

.edit-form {
  max-width: 100%;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-container {
  height: 400px;
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.emission-table {
  margin-top: 16px;
}

@media (max-width: 900px) {
  .detail-content {
    grid-template-columns: 1fr;
  }
}
</style>
