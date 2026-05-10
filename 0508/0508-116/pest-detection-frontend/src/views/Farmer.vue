<template>
  <div class="farmer-container">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon :size="28" color="#67c23a"><Bug /></el-icon>
          <span class="title">农户工作台</span>
          <el-badge :value="notificationCount" class="notification-badge" v-if="notificationCount > 0">
            <el-button type="info" size="small" circle @click="showNotificationList">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-button v-else type="info" size="small" circle @click="showNotificationList">
            <el-icon><Bell /></el-icon>
          </el-button>
        </div>
        <div class="header-right">
          <span class="user-info">{{ user.name }} ({{ user.phone }})</span>
          <el-button type="primary" size="small" @click="$router.push('/report')">
            <el-icon><Plus /></el-icon> 新建上报
          </el-button>
          <el-button size="small" @click="logout">退出</el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card>
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>我的上报记录</span>
                </div>
              </template>
              <el-table :data="list" v-loading="loading" stripe>
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="cropType" label="作物类型" width="120" />
                <el-table-column prop="description" label="症状描述" show-overflow-tooltip />
                <el-table-column prop="area" label="面积(亩)" width="100" />
                <el-table-column prop="images" label="图片" width="150">
                  <template #default="{ row }">
                    <el-image
                      v-if="row.images && row.images.length > 0"
                      :src="row.images[0]"
                      :preview-src-list="row.images"
                      style="width: 50px; height: 50px"
                      fit="cover"
                    />
                    <span v-else style="color: #909399">无</span>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="reportTime" label="上报时间" width="180">
                  <template #default="{ row }">
                    {{ formatTime(row.reportTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="180">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="viewDetail(row)">
                      详情
                    </el-button>
                    <el-button
                      v-if="row.status === 'DIAGNOSED'"
                      type="success"
                      link
                      size="small"
                      @click="openEvaluate(row)"
                    >
                      评价
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="!loading && list.length === 0" description="暂无上报记录" />
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>

    <el-dialog v-model="detailVisible" title="上报详情" width="600px">
      <div v-if="detail" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="作物类型">{{ detail.cropType }}</el-descriptions-item>
          <el-descriptions-item label="发生面积">{{ detail.area }} 亩</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detail.status)">{{ statusText(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="症状描述" :span="2">{{ detail.description }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px">
          <h4 style="margin-bottom: 10px; color: #606266">上报图片</h4>
          <div class="image-list">
            <el-image
              v-for="(img, idx) in detail.images"
              :key="idx"
              :src="img"
              :preview-src-list="detail.images"
              style="width: 120px; height: 120px; margin-right: 10px; margin-bottom: 10px"
              fit="cover"
            />
            <span v-if="!detail.images || detail.images.length === 0" style="color: #909399">无图片</span>
          </div>
        </div>

        <div v-if="detail.status !== 'PENDING'" style="margin-top: 20px">
          <h4 style="margin-bottom: 10px; color: #409eff">专家诊断</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="专家">{{ detail.expertName || '未知' }}</el-descriptions-item>
            <el-descriptions-item label="病虫害名称">{{ detail.pestName }}</el-descriptions-item>
            <el-descriptions-item label="严重程度">
              <el-tag :type="severityType(detail.severity)">{{ severityText(detail.severity) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="诊断说明">{{ detail.diagnosisText }}</el-descriptions-item>
            <el-descriptions-item label="用药建议">{{ detail.medicineSuggestion }}</el-descriptions-item>
            <el-descriptions-item label="诊断时间">{{ formatTime(detail.diagnosisTime) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="detail.evaluation" style="margin-top: 20px">
          <h4 style="margin-bottom: 10px; color: #67c23a">我的评价</h4>
          <el-tag :type="detail.evaluation === 'SATISFIED' ? 'success' : 'danger'" size="large">
            {{ detail.evaluation === 'SATISFIED' ? '满意' : '不满意' }}
          </el-tag>
          <span style="margin-left: 10px; color: #909399">{{ formatTime(detail.evaluationTime) }}</span>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="evaluateVisible" title="评价诊断结果" width="400px">
      <el-form label-width="80px">
        <el-form-item label="评价">
          <el-radio-group v-model="evaluateForm.evaluation">
            <el-radio value="SATISFIED" label="SATISFIED">
              <el-icon color="#67c23a" :size="20"><Star /></el-icon> 满意
            </el-radio>
            <el-radio value="UNSATISFIED" label="UNSATISFIED">
              <el-icon color="#f56c6c" :size="20"><StarFilled /></el-icon> 不满意
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="evaluateVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEvaluate" :loading="evaluateLoading">
          提交评价
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="notificationDrawerVisible"
      title="通知消息"
      size="360px"
      :with-header="true"
    >
      <el-empty v-if="notifications.length === 0" description="暂无新通知" />
      <el-timeline v-else>
        <el-timeline-item
          v-for="(item, index) in notifications"
          :key="index"
          :timestamp="formatTime(item.createTime)"
          placement="top"
        >
          <el-card :class="['notification-card', { unread: !item.read }]" @click="handleNotificationClick(item)">
            <div class="notification-title">
              <el-icon><Message /></el-icon>
              <span>{{ item.pestName }}</span>
              <el-tag :type="severityTagType(item.severity)" size="small" style="margin-left: auto">
                {{ severityText(item.severity) }}
              </el-tag>
            </div>
            <div class="notification-content">{{ item.message }}</div>
            <el-button type="primary" link size="small" style="padding: 0; margin-top: 8px">
              查看详情
            </el-button>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getReportList, getReportDetail, evaluateReport } from '@/api/report'
import { ElMessage, ElNotification } from 'element-plus'
import ws from '@/utils/websocket'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('user')))
const list = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const detail = ref(null)
const evaluateVisible = ref(false)
const evaluateLoading = ref(false)
const currentReportId = ref(null)
const notificationDrawerVisible = ref(false)
const notifications = ref([])
const notificationCount = ref(0)

const evaluateForm = reactive({
  evaluation: 'SATISFIED'
})

const loadList = async () => {
  loading.value = true
  try {
    const res = await getReportList(user.value.id)
    list.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const statusType = (status) => {
  const map = { PENDING: 'warning', DIAGNOSED: 'primary', EVALUATED: 'success' }
  return map[status] || 'info'
}

const statusText = (status) => {
  const map = { PENDING: '待诊断', DIAGNOSED: '已诊断', EVALUATED: '已评价' }
  return map[status] || status
}

const severityType = (severity) => {
  const map = { LIGHT: 'success', MEDIUM: 'warning', SEVERE: 'danger' }
  return map[severity] || 'info'
}

const severityText = (severity) => {
  const map = { LIGHT: '轻度', MEDIUM: '中度', SEVERE: '重度' }
  return map[severity] || severity
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const viewDetail = async (row) => {
  const res = await getReportDetail(row.id)
  detail.value = res.data
  detailVisible.value = true
}

const openEvaluate = (row) => {
  currentReportId.value = row.id
  evaluateForm.evaluation = 'SATISFIED'
  evaluateVisible.value = true
}

const submitEvaluate = async () => {
  evaluateLoading.value = true
  try {
    await evaluateReport(currentReportId.value, evaluateForm)
    ElMessage.success('评价成功')
    evaluateVisible.value = false
    loadList()
  } catch (e) {
    console.error(e)
  } finally {
    evaluateLoading.value = false
  }
}

const logout = () => {
  ws.disconnect()
  localStorage.removeItem('user')
  router.push('/home')
}

const severityTagType = (severity) => {
  const map = { LIGHT: 'success', MEDIUM: 'warning', SEVERE: 'danger' }
  return map[severity] || 'info'
}

const showNotificationList = () => {
  notificationDrawerVisible.value = true
}

const handleNotificationClick = (item) => {
  item.read = true
  notificationCount.value = notifications.value.filter(n => !n.read).length
  viewDetail({ id: item.reportId })
  notificationDrawerVisible.value = false
}

const handleDiagnosisNotification = (data) => {
  notifications.value.unshift({
    ...data,
    read: false
  })
  notificationCount.value++

  ElNotification({
    title: '诊断完成',
    message: data.message,
    type: data.severity === 'SEVERE' ? 'warning' : 'success',
    duration: 10000,
    onClick: () => {
      handleNotificationClick(data)
    }
  })

  loadList()
}

const initWebSocket = () => {
  if (user.value) {
    ws.connect(user.value.id)
    ws.on('DIAGNOSIS_COMPLETE', handleDiagnosisNotification)
  }
}

onMounted(() => {
  loadList()
  initWebSocket()
})

onUnmounted(() => {
  ws.off('DIAGNOSIS_COMPLETE', handleDiagnosisNotification)
})
</script>

<style scoped>
.farmer-container {
  min-height: 100vh;
}

.notification-badge {
  margin-left: 16px;
}

.notification-card {
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 12px;
}

.notification-card:hover {
  transform: translateX(4px);
}

.notification-card.unread {
  border-left: 3px solid #409eff;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 6px;
}

.notification-content {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

.header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  color: #606266;
  font-size: 14px;
}

.main-content {
  padding: 20px 40px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.detail-content :deep(.el-descriptions__label) {
  background: #f5f7fa;
  width: 120px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
}
</style>