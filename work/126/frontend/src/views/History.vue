<template>
  <div class="history-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="点云文件" name="pointcloud">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>已上传的点云文件</span>
              <el-button type="primary" @click="goToUpload" :icon="Plus">
                上传新文件
              </el-button>
            </div>
          </template>

          <el-table 
            :data="pointCloudList" 
            style="width: 100%" 
            v-loading="loadingPointClouds"
            @row-click="onPointCloudClick"
            highlight-current-row
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="file_name" label="文件名" min-width="200">
              <template #default="scope">
                <div class="file-name-cell">
                  <el-icon :size="18"><Folder /></el-icon>
                  <span>{{ scope.row.file_name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="point_count" label="点数" width="120">
              <template #default="scope">
                {{ formatNumber(scope.row.point_count) }}
              </template>
            </el-table-column>
            <el-table-column prop="file_type" label="格式" width="100">
              <template #default="scope">
                <el-tag size="small" :type="getFileTypeTag(scope.row.file_type)">
                  {{ scope.row.file_type.toUpperCase() }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="upload_time" label="上传时间" width="180">
              <template #default="scope">
                {{ formatDateTime(scope.row.upload_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="primary" link @click.stop="goToAnalysis(scope.row)">
                  开始分析
                </el-button>
                <el-button type="primary" link @click.stop="downloadPointCloud(scope.row)">
                  下载
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty description="暂无点云数据" v-if="!loadingPointClouds && pointCloudList.length === 0" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="分析记录" name="analysis">
        <el-card shadow="never">
          <template #header>
            <span>弹道分析记录</span>
          </template>

          <el-table 
            :data="analysisList" 
            style="width: 100%" 
            v-loading="loadingAnalyses"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="case_number" label="案件编号" width="150">
              <template #default="scope">
                {{ scope.row.case_number || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="weapon_type" label="枪支类型" width="120">
              <template #default="scope">
                <el-tag size="small">{{ getWeaponTypeName(scope.row.weapon_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="弹孔数" width="100">
              <template #default="scope">
                {{ scope.row.bullet_holes?.length || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="analysis_status" label="状态" width="100">
              <template #default="scope">
                <el-tag 
                  size="small" 
                  :type="getStatusType(scope.row.analysis_status)"
                >
                  {{ getStatusText(scope.row.analysis_status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="scope">
                {{ formatDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="primary" link @click="viewAnalysis(scope.row)">
                  查看
                </el-button>
                <el-button 
                  type="success" 
                  link 
                  :disabled="scope.row.analysis_status !== 'completed'"
                  @click="generateReport(scope.row)"
                >
                  报告
                </el-button>
                <el-button 
                  type="danger" 
                  link 
                  @click="deleteAnalysis(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty description="暂无分析记录" v-if="!loadingAnalyses && analysisList.length === 0" />
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Folder } from '@element-plus/icons-vue'
import { pointCloudApi, ballisticApi, reportApi } from '@/api'

const router = useRouter()

const activeTab = ref('pointcloud')
const pointCloudList = ref([])
const analysisList = ref([])
const loadingPointClouds = ref(false)
const loadingAnalyses = ref(false)

const loadPointClouds = async () => {
  loadingPointClouds.value = true
  try {
    const response = await pointCloudApi.list(0, 100)
    pointCloudList.value = response.data
  } catch (error) {
    console.error('Load error:', error)
    ElMessage.error('加载点云列表失败')
  } finally {
    loadingPointClouds.value = false
  }
}

const loadAnalyses = async () => {
  loadingAnalyses.value = true
  try {
    const response = await ballisticApi.list(0, 100)
    analysisList.value = response.data.analyses || []
  } catch (error) {
    console.error('Load error:', error)
    ElMessage.error('加载分析列表失败')
  } finally {
    loadingAnalyses.value = false
  }
}

const goToUpload = () => {
  router.push('/')
}

const goToAnalysis = (row) => {
  router.push(`/analysis/${row.id}`)
}

const onPointCloudClick = (row) => {
}

const downloadPointCloud = async (row) => {
  try {
    const response = await pointCloudApi.download(row.id)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', row.file_name)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('下载开始')
  } catch (error) {
    console.error('Download error:', error)
    ElMessage.error('下载失败')
  }
}

const viewAnalysis = (row) => {
  router.push(`/analysis/${row.point_cloud_id}`)
}

const generateReport = async (row) => {
  try {
    const response = await reportApi.generate({
      analysis_id: row.id,
      include_point_cloud_info: true,
      include_trajectory: true,
      include_probability_cone: true
    })
    
    ElMessage.success('报告生成成功')
    
    const downloadResponse = await reportApi.download(response.data.id)
    const url = window.URL.createObjectURL(new Blob([downloadResponse.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ballistic_report_${row.id}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
  } catch (error) {
    console.error('Report error:', error)
    ElMessage.error(error.response?.data?.detail || '报告生成失败')
  }
}

const deleteAnalysis = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条分析记录吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await ballisticApi.delete(row.id)
    ElMessage.success('删除成功')
    loadAnalyses()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
      ElMessage.error('删除失败')
    }
  }
}

const formatNumber = (num) => {
  if (!num) return '-'
  return num.toLocaleString()
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const getFileTypeTag = (type) => {
  const tags = {
    'las': 'primary',
    'ply': 'success'
  }
  return tags[type] || 'info'
}

const getWeaponTypeName = (type) => {
  const names = {
    'pistol': '手枪',
    'rifle': '步枪',
    'shotgun': '霰弹枪',
    'smg': '冲锋枪'
  }
  return names[type] || type || '未知'
}

const getStatusType = (status) => {
  const types = {
    'pending': 'info',
    'processing': 'warning',
    'completed': 'success',
    'failed': 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    'pending': '待分析',
    'processing': '处理中',
    'completed': '已完成',
    'failed': '失败'
  }
  return texts[status] || status
}

onMounted(() => {
  loadPointClouds()
  loadAnalyses()
})
</script>

<style scoped>
.history-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow-y: auto;
}

:deep(.el-card) {
  height: 100%;
}
</style>
