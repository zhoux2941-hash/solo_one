<template>
  <div class="admin-container">
    <h2 class="page-title">管理后台</h2>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="未签退记录" name="unchecked">
        <el-card>
          <el-alert
            title="以下志愿者签到后未签退，请手动处理或等待系统自动处理（活动结束后/超过24小时）"
            type="warning"
            show-icon
            :closable="false"
            style="margin-bottom: 15px;"
          >
          </el-alert>
          <el-table :data="uncheckedAttendance" border>
            <el-table-column prop="id" label="ID" width="80"></el-table-column>
            <el-table-column label="志愿者" width="120">
              <template #default="scope">
                <el-tag>{{ getUserName(scope.row.userId) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="活动ID" width="100">
              <template #default="scope">{{ scope.row.activityId }}</template>
            </el-table-column>
            <el-table-column label="签到时间" width="180">
              <template #default="scope">{{ formatTime(scope.row.checkInTime) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="scope">
                <el-tag type="warning">未签退</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="已签到时长" width="150">
              <template #default="scope">
                <span style="color: #f56c6c;">{{ getElapsedTime(scope.row.checkInTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button type="primary" size="small" @click="openForceCheckoutDialog(scope.row)">强制签退</el-button>
                <el-button type="danger" size="small" @click="handleRejectUnchecked(scope.row)">取消记录</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="uncheckedAttendance.length === 0" description="暂无未签退记录"></el-empty>
        </el-card>
      </el-tab-pane>
      
      <el-tab-pane label="时数审核" name="attendance">
        <el-card>
          <el-table :data="pendingAttendance" border>
            <el-table-column prop="id" label="ID" width="80"></el-table-column>
            <el-table-column label="志愿者" width="120">
              <template #default="scope">
                <el-tag>{{ getUserName(scope.row.userId) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="活动ID" width="100">
              <template #default="scope">
                {{ scope.row.activityId }}
              </template>
            </el-table-column>
            <el-table-column label="签到时间" width="180">
              <template #default="scope">
                {{ formatTime(scope.row.checkInTime) }}
              </template>
            </el-table-column>
            <el-table-column label="签退时间" width="180">
              <template #default="scope">
                {{ scope.row.checkOutTime ? formatTime(scope.row.checkOutTime) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="服务时长(分钟)" width="130">
              <template #default="scope">
                {{ scope.row.durationMinutes || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="可获时间币" width="120">
              <template #default="scope">
                <el-tag type="success">{{ calculateCoins(scope.row.durationMinutes) }} 币</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button type="success" size="small" @click="handleApprove(scope.row)">审核通过</el-button>
                <el-button type="danger" size="small" @click="handleReject(scope.row)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingAttendance.length === 0" description="暂无待审核记录"></el-empty>
        </el-card>
      </el-tab-pane>
      
      <el-tab-pane label="活动管理" name="activities">
        <el-card>
          <div class="goods-header">
            <el-button type="primary" @click="openActivityDialog()">新增活动</el-button>
          </div>
          <el-table :data="allActivities" border style="margin-top: 20px;">
            <el-table-column prop="id" label="ID" width="80"></el-table-column>
            <el-table-column prop="name" label="活动名称" width="200"></el-table-column>
            <el-table-column prop="location" label="地点" width="150"></el-table-column>
            <el-table-column label="开始时间" width="180">
              <template #default="scope">{{ formatTime(scope.row.startTime) }}</template>
            </el-table-column>
            <el-table-column label="结束时间" width="180">
              <template #default="scope">{{ formatTime(scope.row.endTime) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ scope.row.status === 'ACTIVE' ? '进行中' : '已结束' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="250">
              <template #default="scope">
                <el-button type="primary" size="small" @click="showQRCode(scope.row)">签到二维码</el-button>
                <el-button type="primary" size="small" @click="openActivityDialog(scope.row)" plain>编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="allActivities.length === 0" description="暂无活动"></el-empty>
        </el-card>
      </el-tab-pane>
      
      <el-tab-pane label="物品管理" name="goods">
        <el-card>
          <div class="goods-header">
            <el-button type="primary" @click="openGoodsDialog()">上架物品</el-button>
          </div>
          <el-table :data="allGoods" border style="margin-top: 20px;">
            <el-table-column prop="id" label="ID" width="80"></el-table-column>
            <el-table-column prop="name" label="物品名称" width="150"></el-table-column>
            <el-table-column prop="coinsRequired" label="所需时间币" width="120"></el-table-column>
            <el-table-column prop="stock" label="库存" width="100"></el-table-column>
            <el-table-column label="是否热门" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.isHot ? 'danger' : 'info'">
                  {{ scope.row.isHot ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'ON_SHELF' ? 'success' : 'info'">
                  {{ scope.row.status === 'ON_SHELF' ? '上架中' : '已下架' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button type="primary" size="small" @click="openGoodsDialog(scope.row)">编辑</el-button>
                <el-button type="danger" size="small" @click="handleDeleteGoods(scope.row)">下架</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
      
      <el-tab-pane label="订单管理" name="orders">
        <el-card>
          <el-tabs v-model="orderTab">
            <el-tab-pane label="待发放" name="pending">
              <el-table :data="pendingOrders" border>
                <el-table-column prop="orderNo" label="订单号" width="250"></el-table-column>
                <el-table-column label="志愿者" width="120">
                  <template #default="scope">
                    <el-tag>{{ getUserName(scope.row.userId) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="goodsName" label="物品" width="150"></el-table-column>
                <el-table-column prop="quantity" label="数量" width="80"></el-table-column>
                <el-table-column prop="totalCoins" label="总时间币" width="100"></el-table-column>
                <el-table-column label="下单时间" width="180">
                  <template #default="scope">{{ formatTime(scope.row.createTime) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="scope">
                    <el-button type="success" size="small" @click="handleDeliver(scope.row)">发放</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="pendingOrders.length === 0" description="暂无待发放订单"></el-empty>
            </el-tab-pane>
            
            <el-tab-pane label="待核销" name="delivered">
              <el-table :data="deliveredOrders" border>
                <el-table-column prop="orderNo" label="订单号" width="250"></el-table-column>
                <el-table-column label="志愿者" width="120">
                  <template #default="scope">
                    <el-tag>{{ getUserName(scope.row.userId) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="goodsName" label="物品" width="150"></el-table-column>
                <el-table-column prop="quantity" label="数量" width="80"></el-table-column>
                <el-table-column label="发放时间" width="180">
                  <template #default="scope">{{ formatTime(scope.row.deliveredTime) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="scope">
                    <el-button type="primary" size="small" @click="handleComplete(scope.row)">核销</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="deliveredOrders.length === 0" description="暂无待核销订单"></el-empty>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="goodsDialogVisible" :title="editingGoods ? '编辑物品' : '上架物品'" width="500px">
      <el-form :model="goodsForm" label-width="100px">
        <el-form-item label="物品名称">
          <el-input v-model="goodsForm.name" placeholder="请输入物品名称"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="goodsForm.description" :rows="3" placeholder="请输入物品描述"></el-input>
        </el-form-item>
        <el-form-item label="所需时间币">
          <el-input-number v-model="goodsForm.coinsRequired" :min="1"></el-input-number>
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="goodsForm.stock" :min="0"></el-input-number>
        </el-form-item>
        <el-form-item label="是否热门">
          <el-switch v-model="goodsForm.isHot"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="goodsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveGoods" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="forceCheckoutDialogVisible" title="强制签退" width="450px">
      <div class="checkout-info" v-if="currentUncheckedRecord">
        <el-alert type="info" :closable="false" style="margin-bottom: 15px;">
          志愿者: {{ getUserName(currentUncheckedRecord.userId) }}<br>
          签到时间: {{ formatTime(currentUncheckedRecord.checkInTime) }}<br>
          已签到时长: {{ getElapsedTime(currentUncheckedRecord.checkInTime) }}
        </el-alert>
        <el-form label-width="100px">
          <el-form-item label="服务时长(分钟)">
            <el-input-number v-model="checkoutForm.customMinutes" :min="1" :max="480" style="width: 100%;"></el-input-number>
          </el-form-item>
          <el-form-item>
            <el-text type="info">留空则按实际签到时长计算（从签到到当前时间）</el-text>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="forceCheckoutDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleForceCheckout" :loading="forceCheckoutLoading">确认签退</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="qrCodeDialogVisible" title="活动签到二维码" width="500px">
      <div v-if="qrCodeData" class="qrcode-container">
        <div class="qrcode-image">
          <img :src="qrCodeData.qrCodeBase64" alt="活动签到二维码" />
        </div>
        <div class="qrcode-info">
          <h4>{{ qrCodeData.activityName }}</h4>
          <p>活动ID: {{ qrCodeData.activityId }}</p>
          <el-text type="info" style="font-size: 12px;">
            志愿者扫描此二维码即可自动签到
          </el-text>
        </div>
        <div class="qrcode-actions">
          <el-button type="primary" @click="downloadQRCode">
            <el-icon><Download /></el-icon>
            下载二维码
          </el-button>
        </div>
      </div>
    </el-dialog>
    
    <el-dialog v-model="activityDialogVisible" :title="editingActivity ? '编辑活动' : '新增活动'" width="600px">
      <el-form :model="activityForm" label-width="100px">
        <el-form-item label="活动名称">
          <el-input v-model="activityForm.name" placeholder="请输入活动名称"></el-input>
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input type="textarea" v-model="activityForm.description" :rows="3" placeholder="请输入活动描述"></el-input>
        </el-form-item>
        <el-form-item label="活动地点">
          <el-input v-model="activityForm.location" placeholder="请输入活动地点"></el-input>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="activityForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="activityForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="activityDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveActivity" :loading="activityLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '../store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPendingAttendance, getUncheckedAttendance, forceCheckOut, approveAttendance, rejectAttendance } from '../api/attendance'
import { getAllGoods, createGoods, updateGoods, deleteGoods } from '../api/goods'
import { getPendingOrders, getOrdersByStatus, deliverOrder, completeOrder } from '../api/order'
import { getUserById } from '../api/auth'
import { getAllActivities, createActivity, updateActivity } from '../api/activity'
import { generateActivityQRCode } from '../api/qrcode'
import { Download } from '@element-plus/icons-vue'

const userStore = useUserStore()
const activeTab = ref('unchecked')
const orderTab = ref('pending')
const pendingAttendance = ref([])
const uncheckedAttendance = ref([])
const allGoods = ref([])
const allActivities = ref([])
const pendingOrders = ref([])
const deliveredOrders = ref([])
const userMap = ref({})

const goodsDialogVisible = ref(false)
const editingGoods = ref(null)
const goodsForm = ref({
  name: '',
  description: '',
  coinsRequired: 10,
  stock: 0,
  isHot: false
})
const saving = ref(false)

const forceCheckoutDialogVisible = ref(false)
const currentUncheckedRecord = ref(null)
const checkoutForm = ref({
  customMinutes: null
})
const forceCheckoutLoading = ref(false)

const qrCodeDialogVisible = ref(false)
const qrCodeData = ref(null)

const activityDialogVisible = ref(false)
const editingActivity = ref(null)
const activityForm = ref({
  name: '',
  description: '',
  location: '',
  startTime: '',
  endTime: '',
  status: 'ACTIVE'
})
const activityLoading = ref(false)

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString('zh-CN') : '-'
}

const calculateCoins = (minutes) => {
  if (!minutes) return 0
  return Math.floor(minutes / 60) * 10
}

const getUserName = (userId) => {
  return userMap.value[userId]?.realName || '未知'
}

const getElapsedTime = (checkInTime) => {
  if (!checkInTime) return '-'
  const now = new Date()
  const checkIn = new Date(checkInTime)
  const diff = now - checkIn
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}小时${minutes}分钟`
}

const loadUsers = async (userIds) => {
  const uniqueIds = [...new Set(userIds)]
  for (const id of uniqueIds) {
    if (!userMap.value[id]) {
      try {
        const res = await getUserById(id)
        userMap.value[id] = res.data
      } catch (e) {
        userMap.value[id] = { realName: '未知' }
      }
    }
  }
}

const loadData = async () => {
  const [uncheckedRes, attendanceRes, activitiesRes, goodsRes, pendingOrdersRes, deliveredRes] = await Promise.all([
    getUncheckedAttendance(),
    getPendingAttendance(),
    getAllActivities(),
    getAllGoods(),
    getPendingOrders(),
    getOrdersByStatus('DELIVERED')
  ])
  
  uncheckedAttendance.value = uncheckedRes.data
  pendingAttendance.value = attendanceRes.data
  allActivities.value = activitiesRes.data
  allGoods.value = goodsRes.data
  pendingOrders.value = pendingOrdersRes.data
  deliveredOrders.value = deliveredRes.data
  
  const userIds = [
    ...uncheckedRes.data.map(a => a.userId),
    ...attendanceRes.data.map(a => a.userId),
    ...pendingOrdersRes.data.map(o => o.userId),
    ...deliveredRes.data.map(o => o.userId)
  ]
  await loadUsers(userIds)
}

const handleApprove = async (record) => {
  try {
    await ElMessageBox.confirm(
      `确认通过审核？志愿者将获得 ${calculateCoins(record.durationMinutes)} 时间币`,
      '审核通过',
      { type: 'success' }
    )
    await approveAttendance(record.id, userStore.user.id)
    ElMessage.success('审核通过，时间币已发放')
    await loadData()
    await userStore.refreshUser()
  } catch (error) {
    if (error !== 'cancel') console.error(error)
  }
}

const handleReject = async (record) => {
  try {
    await ElMessageBox.confirm('确认拒绝该签到记录？', '拒绝审核', { type: 'warning' })
    await rejectAttendance(record.id, userStore.user.id)
    ElMessage.success('已拒绝')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') console.error(error)
  }
}

const openForceCheckoutDialog = (record) => {
  currentUncheckedRecord.value = record
  checkoutForm.value = { customMinutes: null }
  forceCheckoutDialogVisible.value = true
}

const handleForceCheckout = async () => {
  forceCheckoutLoading.value = true
  try {
    await forceCheckOut(
      currentUncheckedRecord.value.id,
      userStore.user.id,
      checkoutForm.value.customMinutes
    )
    ElMessage.success('强制签退成功，请等待审核')
    forceCheckoutDialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error(error)
  } finally {
    forceCheckoutLoading.value = false
  }
}

const handleRejectUnchecked = async (record) => {
  try {
    await ElMessageBox.confirm('确认取消该签到记录？志愿者将不会获得任何时数', '取消签到记录', { type: 'warning' })
    await rejectAttendance(record.id, userStore.user.id)
    ElMessage.success('已取消')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') console.error(error)
  }
}

const showQRCode = async (activity) => {
  try {
    const res = await generateActivityQRCode(activity.id)
    qrCodeData.value = res.data
    qrCodeDialogVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const downloadQRCode = () => {
  if (!qrCodeData.value) return
  
  const link = document.createElement('a')
  link.href = qrCodeData.value.qrCodeBase64
  link.download = `活动签到二维码_${qrCodeData.value.activityName}_${qrCodeData.value.activityId}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const openActivityDialog = (activity = null) => {
  editingActivity.value = activity
  if (activity) {
    activityForm.value = {
      name: activity.name,
      description: activity.description || '',
      location: activity.location || '',
      startTime: activity.startTime,
      endTime: activity.endTime,
      status: activity.status
    }
  } else {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    activityForm.value = {
      name: '',
      description: '',
      location: '',
      startTime: now.toISOString().slice(0, 19).replace('T', ' '),
      endTime: tomorrow.toISOString().slice(0, 19).replace('T', ' '),
      status: 'ACTIVE'
    }
  }
  activityDialogVisible.value = true
}

const handleSaveActivity = async () => {
  if (!activityForm.value.name) {
    ElMessage.warning('请输入活动名称')
    return
  }
  if (!activityForm.value.startTime || !activityForm.value.endTime) {
    ElMessage.warning('请选择活动时间')
    return
  }
  
  activityLoading.value = true
  try {
    if (editingActivity.value) {
      await updateActivity(editingActivity.value.id, activityForm.value)
      ElMessage.success('活动更新成功')
    } else {
      await createActivity(activityForm.value)
      ElMessage.success('活动创建成功')
    }
    activityDialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error(error)
  } finally {
    activityLoading.value = false
  }
}

const openGoodsDialog = (goods = null) => {
  editingGoods.value = goods
  if (goods) {
    goodsForm.value = {
      name: goods.name,
      description: goods.description || '',
      coinsRequired: goods.coinsRequired,
      stock: goods.stock,
      isHot: goods.isHot
    }
  } else {
    goodsForm.value = {
      name: '',
      description: '',
      coinsRequired: 10,
      stock: 0,
      isHot: false
    }
  }
  goodsDialogVisible.value = true
}

const handleSaveGoods = async () => {
  if (!goodsForm.value.name) {
    ElMessage.warning('请输入物品名称')
    return
  }
  
  saving.value = true
  try {
    if (editingGoods.value) {
      await updateGoods(editingGoods.value.id, { ...editingGoods.value, ...goodsForm.value })
      ElMessage.success('更新成功')
    } else {
      await createGoods({ ...goodsForm.value, status: 'ON_SHELF' })
      ElMessage.success('上架成功')
    }
    goodsDialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}

const handleDeleteGoods = async (goods) => {
  try {
    await ElMessageBox.confirm('确认下架该物品？', '下架物品', { type: 'warning' })
    await deleteGoods(goods.id)
    ElMessage.success('已下架')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') console.error(error)
  }
}

const handleDeliver = async (order) => {
  try {
    await ElMessageBox.confirm('确认已线下发放物品？', '发放物品', { type: 'success' })
    await deliverOrder(order.id, userStore.user.id)
    ElMessage.success('已发放，等待核销')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') console.error(error)
  }
}

const handleComplete = async (order) => {
  try {
    await ElMessageBox.confirm('确认核销该订单？', '核销订单', { type: 'info' })
    await completeOrder(order.id, userStore.user.id)
    ElMessage.success('已核销')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') console.error(error)
  }
}

onMounted(loadData)

watch(activeTab, (newVal) => {
  if (newVal === 'orders') {
    orderTab.value = 'pending'
  }
  loadData()
})
</script>

<style scoped>
.admin-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 20px;
  color: #333;
}

.goods-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.qrcode-container {
  text-align: center;
  padding: 10px;
}

.qrcode-image {
  margin-bottom: 15px;
}

.qrcode-image img {
  max-width: 300px;
  border: 1px solid #ddd;
  padding: 10px;
  background: white;
}

.qrcode-info h4 {
  margin: 0 0 8px;
  color: #333;
  font-size: 18px;
}

.qrcode-info p {
  margin: 0 0 10px;
  color: #666;
  font-size: 14px;
}

.qrcode-actions {
  margin-top: 15px;
}
</style>
