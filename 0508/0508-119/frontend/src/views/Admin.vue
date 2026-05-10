<template>
  <div class="page-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="故障管理" name="faults">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>故障上报列表</span>
              <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 120px;" clearable @change="loadFaultReports">
                <el-option label="待处理" value="PENDING" />
                <el-option label="处理中" value="PROCESSING" />
                <el-option label="已解决" value="RESOLVED" />
                <el-option label="已驳回" value="REJECTED" />
              </el-select>
            </div>
          </template>

          <el-table :data="faultReports" v-loading="loadingFaults" style="width: 100%;">
            <el-table-column prop="pile.pileCode" label="桩号" width="100">
              <template #default="{ row }">
                <el-tag type="primary">{{ row.pile?.pileCode }}</el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="reporter.realName" label="上报人" width="100">
              <template #default="{ row }">
                {{ row.reporter?.realName || '-' }}
              </template>
            </el-table-column>
            
            <el-table-column prop="description" label="故障描述" min-width="200" show-overflow-tooltip />
            
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getFaultStatusTagType(row.status)">
                  {{ getFaultStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="reportedAt" label="上报时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.reportedAt) }}
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <template v-if="row.status === 'PENDING'">
                  <el-button type="primary" size="small" @click="handleProcess(row.id)" :loading="actionLoading[row.id]">
                    处理
                  </el-button>
                  <el-button type="success" size="small" @click="handleResolve(row)" :loading="actionLoading[row.id]">
                    解决
                  </el-button>
                  <el-button type="danger" size="small" @click="handleReject(row)" :loading="actionLoading[row.id]">
                    驳回
                  </el-button>
                </template>
                
                <template v-else-if="row.status === 'PROCESSING'">
                  <el-button type="success" size="small" @click="handleResolve(row)" :loading="actionLoading[row.id]">
                    解决
                  </el-button>
                  <el-button type="danger" size="small" @click="handleReject(row)" :loading="actionLoading[row.id]">
                    驳回
                  </el-button>
                </template>
                
                <template v-else>
                  <span style="color: #909399;">-</span>
                </template>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="faultReports.length === 0 && !loadingFaults" description="暂无故障上报" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="充电桩管理" name="piles">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>充电桩列表</span>
              <el-button type="primary" @click="showPileDialog = true">
                <el-icon><Plus /></el-icon>
                添加充电桩
              </el-button>
            </div>
          </template>

          <el-table :data="piles" v-loading="loadingPiles" style="width: 100%;">
            <el-table-column prop="pileCode" label="桩号" width="120">
              <template #default="{ row }">
                <el-tag type="primary">{{ row.pileCode }}</el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="location" label="位置" min-width="200" />
            <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
            
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getPileStatusTagType(row.status)">
                  {{ getPileStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="editPile(row)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="deletePile(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="数据统计" name="statistics">
        <div class="statistics-container">
          <el-card class="chart-container">
            <template #header>
              <div class="card-header">
                <span>统计概览</span>
                <el-select v-model="statsDays" placeholder="统计天数" style="width: 120px;" @change="loadStatistics">
                  <el-option label="最近7天" :value="7" />
                  <el-option label="最近14天" :value="14" />
                  <el-option label="最近30天" :value="30" />
                </el-select>
                <el-button type="primary" size="small" @click="loadStatistics" style="margin-left: 10px;">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </template>

            <div class="stats-cards">
              <div class="stat-card green">
                <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
                <div class="stat-content">
                  <div class="stat-number">{{ overview?.availablePiles || 0 }}</div>
                  <div class="stat-label">空闲充电桩</div>
                </div>
              </div>
              <div class="stat-card orange">
                <div class="stat-icon"><el-icon><Loading /></el-icon></div>
                <div class="stat-content">
                  <div class="stat-number">{{ overview?.occupiedPiles || 0 }}</div>
                  <div class="stat-label">使用中</div>
                </div>
              </div>
              <div class="stat-card red">
                <div class="stat-icon"><el-icon><Warning /></el-icon></div>
                <div class="stat-content">
                  <div class="stat-number">{{ overview?.maintenancePiles || 0 }}</div>
                  <div class="stat-label">维修中</div>
                </div>
              </div>
              <div class="stat-card blue">
                <div class="stat-icon"><el-icon><TrendCharts /></el-icon></div>
                <div class="stat-content">
                  <div class="stat-number">{{ overview?.todayUsageRate || 0 }}%</div>
                  <div class="stat-label">今日使用率</div>
                </div>
              </div>
            </div>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="12">
                <el-card shadow="never">
                  <template #header>
                    <span>今日数据</span>
                  </template>
                  <div class="detail-stats">
                    <div class="detail-item">
                      <span class="label">今日预约数</span>
                      <span class="value">{{ overview?.todayReservations || 0 }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">完成充电</span>
                      <span class="value">{{ overview?.todayCompletedReservations || 0 }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">最繁忙时段</span>
                      <span class="value">{{ formatTime(overview?.busiestHour) }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">最空闲时段</span>
                      <span class="value">{{ formatTime(overview?.quietestHour) }}</span>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="never">
                  <template #header>
                    <span>整体趋势</span>
                  </template>
                  <div class="detail-stats">
                    <div class="detail-item">
                      <span class="label">平均使用率</span>
                      <span class="value">{{ overview?.averageUsageRate || 0 }}%</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">总充电桩数</span>
                      <span class="value">{{ overview?.totalPiles || 0 }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">统计周期</span>
                      <span class="value">最近 {{ statsDays }} 天</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">数据更新</span>
                      <span class="value">{{ formatNow() }}</span>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-card>

          <el-card class="chart-container" style="margin-top: 20px;">
            <template #header>
              <span>每日使用率趋势（最近 {{ statsDays }} 天）</span>
            </template>
            <div class="usage-chart">
              <div class="chart-bars" v-loading="loadingStats">
                <div 
                  v-for="(usage, index) in dailyUsage" 
                  :key="index" 
                  class="chart-bar-item"
                >
                  <div class="bar-wrapper">
                    <div 
                      class="bar" 
                      :style="{ height: getBarHeight(usage.usageRate) + '%', background: getBarColor(usage.usageRate) }"
                    >
                      <span class="bar-value">{{ usage.usageRate }}%</span>
                    </div>
                  </div>
                  <div class="bar-label">{{ formatDate(usage.date) }}</div>
                  <div class="bar-detail">
                    <el-tooltip :content="`预约: ${usage.totalReservations} | 完成: ${usage.completedReservations} | 过期: ${usage.expiredReservations}`">
                      <el-icon><InfoFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="chart-container" style="margin-top: 20px;">
            <template #header>
              <span>24小时使用率热力图</span>
            </template>
            <div class="heatmap-container" v-loading="loadingStats">
              <div class="heatmap-header">
                <div class="heatmap-corner"></div>
                <div v-for="hour in 24" :key="hour" class="heatmap-hour">
                  {{ String(hour - 1).padStart(2, '0') }}
                </div>
              </div>
              <div 
                v-for="item in heatmapData" 
                :key="item.pileCode" 
                class="heatmap-row"
              >
                <div class="heatmap-pile">{{ item.pileCode }}</div>
                <div 
                  v-for="(value, key) in item.hourlyUsage" 
                  :key="key" 
                  class="heatmap-cell"
                  :style="{ background: getHeatmapColor(value) }"
                  :title="`${item.pileCode} ${key}: ${value}%`"
                >
                  <span v-if="value > 50" class="cell-value">{{ value }}%</span>
                </div>
              </div>
            </div>
            <div class="heatmap-legend">
              <span>低</span>
              <div class="legend-colors">
                <div v-for="i in 6" :key="i" :style="{ background: getHeatmapColor((i - 1) * 20) }"></div>
              </div>
              <span>高</span>
            </div>
          </el-card>

          <el-card class="chart-container" style="margin-top: 20px;">
            <template #header>
              <div class="card-header">
                <span>各桩繁忙时段分析</span>
              </div>
            </template>
            <el-table :data="pileStatistics" v-loading="loadingStats" style="width: 100%;">
              <el-table-column prop="pileCode" label="桩号" width="100">
                <template #default="{ row }">
                  <el-tag type="primary">{{ row.pileCode }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="location" label="位置" min-width="180" />
              <el-table-column label="总使用率" width="120">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="row.totalUsageRate" 
                    :color="getProgressColor(row.totalUsageRate)"
                    :stroke-width="16"
                  />
                </template>
              </el-table-column>
              <el-table-column label="预约次数" width="100">
                <template #default="{ row }">
                  {{ row.totalReservations }}
                </template>
              </el-table-column>
              <el-table-column label="繁忙时段" min-width="200">
                <template #default="{ row }">
                  <el-tag 
                    v-for="(time, idx) in row.peakHours" 
                    :key="idx" 
                    type="danger" 
                    size="small"
                    style="margin-right: 5px; margin-bottom: 3px;"
                  >
                    {{ formatTime(time) }}
                  </el-tag>
                  <span v-if="row.peakHours?.length === 0" style="color: #909399;">暂无数据</span>
                </template>
              </el-table-column>
              <el-table-column label="空闲时段" min-width="200">
                <template #default="{ row }">
                  <el-tag 
                    v-for="(time, idx) in row.offPeakHours" 
                    :key="idx" 
                    type="success" 
                    size="small"
                    style="margin-right: 5px; margin-bottom: 3px;"
                  >
                    {{ formatTime(time) }}
                  </el-tag>
                  <span v-if="row.offPeakHours?.length === 0" style="color: #909399;">暂无数据</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showPileDialog" :title="editingPile ? '编辑充电桩' : '添加充电桩'" width="500px">
      <el-form :model="pileForm" :rules="pileRules" ref="pileFormRef" label-width="80px">
        <el-form-item label="桩号" prop="pileCode">
          <el-input v-model="pileForm.pileCode" placeholder="如 CP001" :disabled="!!editingPile" />
        </el-form-item>
        
        <el-form-item label="位置" prop="location">
          <el-input v-model="pileForm.location" placeholder="如 一号宿舍楼楼下" />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input v-model="pileForm.description" placeholder="如 快充充电桩" />
        </el-form-item>
        
        <el-form-item label="状态" v-if="editingPile">
          <el-select v-model="pileForm.status" style="width: 100%;">
            <el-option label="空闲" value="AVAILABLE" />
            <el-option label="使用中" value="OCCUPIED" />
            <el-option label="维修中" value="MAINTENANCE" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="resetPileForm">取消</el-button>
        <el-button type="primary" :loading="submittingPile" @click="submitPile">
          {{ editingPile ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showHandleDialog" title="处理故障" width="500px">
      <el-form :model="handleForm" label-width="80px">
        <el-form-item label="处理备注">
          <el-input 
            v-model="handleForm.note" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入处理备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showHandleDialog = false">取消</el-button>
        <el-button type="primary" :loading="submittingHandle" @click="submitHandle">
          确认{{ handleAction }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getAllReports, processReport, resolveReport, rejectReport } from '@/api/faultReports'
import { getPiles, createPile, updatePile, deletePile as apiDeletePile } from '@/api/piles'
import { getOverview, getDailyUsage, getAllPileStatistics, getHeatmapData } from '@/api/statistics'

const activeTab = ref('faults')
const filterStatus = ref('')
const loadingFaults = ref(false)
const loadingPiles = ref(false)
const actionLoading = ref({})
const faultReports = ref([])
const piles = ref([])

const showPileDialog = ref(false)
const editingPile = ref(null)
const pileFormRef = ref(null)
const submittingPile = ref(false)
const pileForm = reactive({
  pileCode: '',
  location: '',
  description: '',
  status: 'AVAILABLE'
})

const pileRules = {
  pileCode: [{ required: true, message: '请输入桩号', trigger: 'blur' }],
  location: [{ required: true, message: '请输入位置', trigger: 'blur' }]
}

const showHandleDialog = ref(false)
const handleAction = ref('')
const currentReportId = ref(null)
const submittingHandle = ref(false)
const handleForm = reactive({ note: '' })

const loadingStats = ref(false)
const statsDays = ref(7)
const overview = ref(null)
const dailyUsage = ref([])
const pileStatistics = ref([])
const heatmapData = ref([])

const formatDateTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getFaultStatusText = (status) => {
  const texts = { 'PENDING': '待处理', 'PROCESSING': '处理中', 'RESOLVED': '已解决', 'REJECTED': '已驳回' }
  return texts[status] || status
}

const getFaultStatusTagType = (status) => {
  const types = { 'PENDING': 'warning', 'PROCESSING': 'primary', 'RESOLVED': 'success', 'REJECTED': 'danger' }
  return types[status] || 'info'
}

const getPileStatusText = (status) => {
  const texts = { 'AVAILABLE': '空闲', 'OCCUPIED': '使用中', 'MAINTENANCE': '维修中' }
  return texts[status] || status
}

const getPileStatusTagType = (status) => {
  const types = { 'AVAILABLE': 'success', 'OCCUPIED': 'warning', 'MAINTENANCE': 'danger' }
  return types[status] || 'info'
}

const loadFaultReports = async () => {
  loadingFaults.value = true
  try {
    const res = await getAllReports(filterStatus.value || undefined)
    faultReports.value = (res.data || []).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  } catch (e) {
    console.error('Failed to load reports:', e)
  } finally {
    loadingFaults.value = false
  }
}

const loadPiles = async () => {
  loadingPiles.value = true
  try {
    const res = await getPiles()
    piles.value = res.data || []
  } catch (e) {
    console.error('Failed to load piles:', e)
  } finally {
    loadingPiles.value = false
  }
}

const handleProcess = async (id) => {
  actionLoading.value[id] = true
  try {
    await processReport(id)
    ElMessage.success('已标记为处理中')
    await loadFaultReports()
  } catch (e) {
    console.error('Failed to process:', e)
  } finally {
    actionLoading.value[id] = false
  }
}

const handleResolve = (row) => {
  currentReportId.value = row.id
  handleAction.value = '解决'
  handleForm.note = ''
  showHandleDialog.value = true
}

const handleReject = (row) => {
  currentReportId.value = row.id
  handleAction.value = '驳回'
  handleForm.note = ''
  showHandleDialog.value = true
}

const submitHandle = async () => {
  submittingHandle.value = true
  try {
    if (handleAction.value === '解决') {
      await resolveReport(currentReportId.value, handleForm.note)
    } else {
      await rejectReport(currentReportId.value, handleForm.note)
    }
    
    ElMessage.success(`已${handleAction.value}`)
    showHandleDialog.value = false
    await loadFaultReports()
  } catch (e) {
    console.error('Failed to handle:', e)
  } finally {
    submittingHandle.value = false
  }
}

const editPile = (pile) => {
  editingPile.value = pile
  pileForm.pileCode = pile.pileCode
  pileForm.location = pile.location
  pileForm.description = pile.description || ''
  pileForm.status = pile.status
  showPileDialog.value = true
}

const resetPileForm = () => {
  editingPile.value = null
  pileForm.pileCode = ''
  pileForm.location = ''
  pileForm.description = ''
  pileForm.status = 'AVAILABLE'
  if (pileFormRef.value) {
    pileFormRef.value.resetFields()
  }
  showPileDialog.value = false
}

const submitPile = async () => {
  if (!pileFormRef.value) return
  
  await pileFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submittingPile.value = true
    try {
      if (editingPile.value) {
        await updatePile(editingPile.value.id, pileForm)
        ElMessage.success('更新成功')
      } else {
        await createPile(pileForm)
        ElMessage.success('添加成功')
      }
      
      resetPileForm()
      await loadPiles()
    } catch (e) {
      console.error('Failed to save pile:', e)
    } finally {
      submittingPile.value = false
    }
  })
}

const deletePile = async (pile) => {
  try {
    await ElMessageBox.confirm(`确认删除充电桩 ${pile.pileCode}？`, '确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await apiDeletePile(pile.id)
    ElMessage.success('删除成功')
    await loadPiles()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('Failed to delete:', e)
    }
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  if (typeof time === 'object' && time.hour !== undefined) {
    return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
  }
  return dayjs(time).format('HH:mm')
}

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('MM-DD')
}

const formatNow = () => {
  return dayjs().format('HH:mm:ss')
}

const getBarHeight = (rate) => {
  return Math.max(rate, 5)
}

const getBarColor = (rate) => {
  if (rate >= 70) return '#f56c6c'
  if (rate >= 40) return '#e6a23c'
  if (rate >= 20) return '#409eff'
  return '#67c23a'
}

const getHeatmapColor = (value) => {
  if (value >= 80) return '#f5222d'
  if (value >= 60) return '#fa8c16'
  if (value >= 40) return '#faad14'
  if (value >= 20) return '#52c41a'
  if (value >= 10) return '#95de64'
  return '#d9f7be'
}

const getProgressColor = (percentage) => {
  if (percentage >= 70) return '#f56c6c'
  if (percentage >= 40) return '#e6a23c'
  return '#67c23a'
}

const loadStatistics = async () => {
  loadingStats.value = true
  try {
    const [overviewRes, dailyRes, pileRes, heatmapRes] = await Promise.all([
      getOverview(),
      getDailyUsage(statsDays.value),
      getAllPileStatistics(statsDays.value),
      getHeatmapData(statsDays.value)
    ])
    
    overview.value = overviewRes.data
    dailyUsage.value = dailyRes.data || []
    pileStatistics.value = pileRes.data || []
    heatmapData.value = heatmapRes.data || []
  } catch (e) {
    console.error('Failed to load statistics:', e)
  } finally {
    loadingStats.value = false
  }
}

onMounted(() => {
  loadFaultReports()
  loadPiles()
  loadStatistics()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statistics-container {
  padding: 0;
}

.chart-container {
  margin-bottom: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stats-cards .stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  color: white;
}

.stats-cards .stat-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stats-cards .stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stats-cards .stat-card.red { background: linear-gradient(135deg, #f56c6c, #f78989); }
.stats-cards .stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }

.stats-cards .stat-icon {
  font-size: 40px;
  margin-right: 15px;
  opacity: 0.8;
}

.stats-cards .stat-content {
  flex: 1;
}

.stats-cards .stat-number {
  font-size: 28px;
  font-weight: bold;
}

.stats-cards .stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 5px;
}

.detail-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  color: #909399;
  font-size: 14px;
}

.detail-item .value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.usage-chart {
  padding: 20px 0;
  min-height: 300px;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 250px;
  padding: 0 20px;
}

.chart-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 60px;
}

.bar-wrapper {
  width: 40px;
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
}

.bar {
  width: 30px;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 5px;
  transition: height 0.5s ease;
  min-height: 5px;
}

.bar-value {
  color: white;
  font-size: 10px;
  font-weight: bold;
}

.bar-label {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.bar-detail {
  margin-top: 5px;
  cursor: pointer;
  color: #409eff;
}

.heatmap-container {
  overflow-x: auto;
  padding: 10px 0;
}

.heatmap-header {
  display: flex;
  margin-bottom: 5px;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.heatmap-corner {
  width: 80px;
  min-width: 80px;
  text-align: center;
  font-weight: bold;
  padding: 5px;
  background: #f5f7fa;
}

.heatmap-hour {
  width: 30px;
  min-width: 30px;
  text-align: center;
  font-size: 10px;
  color: #909399;
  padding: 5px 0;
}

.heatmap-row {
  display: flex;
  margin-bottom: 2px;
}

.heatmap-pile {
  width: 80px;
  min-width: 80px;
  text-align: center;
  padding: 10px 5px;
  font-size: 12px;
  font-weight: bold;
  color: #303133;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heatmap-cell {
  width: 30px;
  min-width: 30px;
  height: 35px;
  margin: 0 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.heatmap-cell:hover {
  transform: scale(1.2);
  z-index: 10;
  position: relative;
}

.cell-value {
  color: white;
  font-size: 9px;
  font-weight: bold;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  gap: 15px;
}

.heatmap-legend span {
  font-size: 12px;
  color: #909399;
}

.legend-colors {
  display: flex;
}

.legend-colors div {
  width: 40px;
  height: 15px;
}
</style>
