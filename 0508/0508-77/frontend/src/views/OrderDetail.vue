<template>
  <div class="order-detail">
    <div class="back-btn">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <el-card v-if="order" class="info-card">
      <template #header>
        <div class="card-header">
          <div class="merchant-info">
            <h2>{{ order.merchant }}</h2>
            <el-tag :type="getStatusType(order.status)" effect="dark">
              {{ getStatusText(order.status) }}
            </el-tag>
          </div>
          <div class="header-actions" v-if="isInitiator && order.status === 'ACTIVE'">
            <el-button type="success" @click="handleEndOrder">结束拼单</el-button>
            <el-button type="danger" @click="handleCancelOrder">取消拼单</el-button>
          </div>
        </div>
      </template>

      <div class="order-info">
        <div class="info-item">
          <span class="label">满减规则:</span>
          <span class="value">满{{ order.minAmount }}元减{{ order.discountAmount }}元</span>
        </div>
        <div class="info-item" v-if="order.targetUrl">
          <span class="label">目标链接:</span>
          <a :href="order.targetUrl" target="_blank" class="value link">{{ order.targetUrl }}</a>
        </div>
        <div class="info-item">
          <span class="label">发起人:</span>
          <span class="value">{{ order.initiatorName }}</span>
        </div>
        <div class="info-item">
          <span class="label">创建时间:</span>
          <span class="value">{{ formatTime(order.createdAt) }}</span>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="items-card">
          <template #header>
            <div class="card-header">
              <span>商品列表</span>
              <el-button 
                v-if="order?.status === 'ACTIVE'"
                type="primary" 
                size="small" 
                @click="showAddDialog = true"
              >
                <el-icon><Plus /></el-icon>
                添加商品
              </el-button>
            </div>
          </template>

          <el-table :data="items" style="width: 100%" v-if="items.length > 0">
            <el-table-column prop="participantName" label="参与人" width="100" />
            <el-table-column prop="itemName" label="商品名称" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="{ row }">
                ¥{{ row.price }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="subtotal" label="小计" width="100">
              <template #default="{ row }">
                <strong>¥{{ row.subtotal }}</strong>
              </template>
            </el-table-column>
            <el-table-column v-if="order?.status === 'ENDED'" prop="finalPrice" label="实付" width="100">
              <template #default="{ row }">
                <strong class="final-price">¥{{ row.finalPrice }}</strong>
              </template>
            </el-table-column>
            <el-table-column v-if="order?.status === 'ACTIVE'" label="操作" width="100">
              <template #default="{ row }">
                <el-button 
                  type="danger" 
                  link 
                  @click="handleRemoveItem(row)"
                  :disabled="row.participantUserId !== currentUser?.userId"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无商品" />
        </el-card>

        <el-card v-if="order?.status === 'ENDED'" class="payment-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>付款明细</span>
              <el-button type="success" size="small" @click="handleExport">
                <el-icon><Download /></el-icon>
                导出Excel
              </el-button>
            </div>
          </template>

          <el-table :data="payments" style="width: 100%" v-if="payments.length > 0">
            <el-table-column prop="userName" label="参与人" width="100" />
            <el-table-column prop="totalAmount" label="原价" width="100">
              <template #default="{ row }">
                ¥{{ row.totalAmount }}
              </template>
            </el-table-column>
            <el-table-column prop="discountAmount" label="优惠" width="100">
              <template #default="{ row }">
                <span class="discount">-¥{{ row.discountAmount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="finalAmount" label="实付" width="120">
              <template #default="{ row }">
                <strong class="final-amount">¥{{ row.finalAmount }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="商品明细">
              <template #default="{ row }">
                <div class="item-detail">
                  <span v-for="item in row.items" :key="item.itemName" class="item-tag">
                    {{ item.itemName }} x{{ item.quantity }}
                  </span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="summary-card">
          <template #header>
            <span>实时统计</span>
          </template>

          <div class="summary-content">
            <div class="summary-item">
              <span class="label">当前总价</span>
              <span class="value total">¥{{ summary?.currentTotal || 0 }}</span>
            </div>
            <div class="summary-item">
              <span class="label">满减门槛</span>
              <span class="value">¥{{ summary?.minAmount || 0 }}</span>
            </div>
            <div class="summary-item" :class="{ 'remaining': !summary?.canApplyDiscount }">
              <span class="label">还差</span>
              <span class="value">¥{{ summary?.remainingAmount || 0 }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item" :class="{ 'success': summary?.canApplyDiscount }">
              <span class="label">{{ summary?.canApplyDiscount ? '已达标' : '未达标' }}</span>
              <span class="value discount">
                {{ summary?.canApplyDiscount ? '-¥' + summary?.discountAmount : '无优惠' }}
              </span>
            </div>
            <div class="summary-item final">
              <span class="label">实付金额</span>
              <span class="value final-amount">¥{{ summary?.finalAmount || 0 }}</span>
            </div>
          </div>
        </el-card>

        <el-card 
          v-if="order?.status === 'ACTIVE' && !summary?.canApplyDiscount" 
          class="recommendation-card"
          style="margin-top: 20px;"
        >
          <template #header>
            <div class="card-header">
              <span>凑单建议</span>
              <el-button 
                type="warning" 
                size="small" 
                @click="loadRecommendations"
              >
                模拟凑单
              </el-button>
            </div>
          </template>

          <div v-if="recommendations.length > 0" class="recommendations">
            <div 
              v-for="(item, index) in recommendations" 
              :key="index"
              class="recommendation-item"
            >
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-price">¥{{ item.price }}</span>
              </div>
              <p class="item-suggestion">{{ item.suggestion }}</p>
            </div>
          </div>
          <el-empty v-else description="点击模拟凑单查看建议" />
        </el-card>

        <el-card class="participants-card" style="margin-top: 20px;">
          <template #header>
            <span>参与人 ({{ participants.length }})</span>
          </template>

          <div v-if="participants.length > 0" class="participants">
            <div v-for="p in participants" :key="p.id" class="participant">
              <el-avatar :size="32">{{ p.userName.charAt(0) }}</el-avatar>
              <span class="name">{{ p.userName }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无参与人" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAddDialog" title="添加商品" width="500px">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="80px">
        <el-form-item label="商品名称" prop="itemName">
          <el-input v-model="addForm.itemName" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number 
            v-model="addForm.price" 
            :min="0.01" 
            :precision="2"
            style="width: 200px"
          />
          <span style="margin-left: 10px">元</span>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number 
            v-model="addForm.quantity" 
            :min="1"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddItem">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, Download } from '@element-plus/icons-vue'
import { orderApi, exportApi } from '../api'

const route = useRoute()
const router = useRouter()
const orderId = route.params.id

const order = ref(null)
const items = ref([])
const participants = ref([])
const summary = ref(null)
const recommendations = ref([])
const payments = ref([])
const currentUser = ref(null)

const showAddDialog = ref(false)
const addFormRef = ref(null)
const addForm = reactive({
  itemName: '',
  price: 0,
  quantity: 1
})

const addRules = {
  itemName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入单价', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

let refreshTimer = null

const isInitiator = computed(() => {
  return currentUser.value && order.value && 
         currentUser.value.userId === order.value.initiatorUserId
})

onMounted(() => {
  const savedUser = localStorage.getItem('group-order-user')
  if (savedUser) {
    currentUser.value = JSON.parse(savedUser)
  }
  loadData()
  
  refreshTimer = setInterval(() => {
    if (order.value?.status === 'ACTIVE') {
      loadSummary()
      loadItems()
    }
  }, 5000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})

const loadData = async () => {
  try {
    order.value = await orderApi.getById(orderId)
    await loadSummary()
    await loadItems()
    await loadParticipants()
    
    if (order.value.status === 'ENDED') {
      await loadPayments()
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载数据失败')
  }
}

const loadSummary = async () => {
  summary.value = await orderApi.getSummary(orderId)
}

const loadItems = async () => {
  items.value = await orderApi.getItems(orderId)
}

const loadParticipants = async () => {
  participants.value = await orderApi.getParticipants(orderId)
}

const loadRecommendations = async () => {
  recommendations.value = await orderApi.getRecommendations(orderId)
}

const loadPayments = async () => {
  payments.value = await orderApi.getPayments(orderId)
}

const handleAddItem = async () => {
  if (!addFormRef.value) return
  
  try {
    await addFormRef.value.validate()
    
    if (!currentUser.value) {
      ElMessage.warning('请先登录')
      return
    }
    
    await orderApi.addItem(orderId, {
      ...addForm,
      participantName: currentUser.value.name,
      participantUserId: currentUser.value.userId
    })
    
    ElMessage.success('添加成功')
    showAddDialog.value = false
    addForm.itemName = ''
    addForm.price = 0
    addForm.quantity = 1
    
    await loadData()
  } catch (e) {
    if (e.response?.data?.message) {
      ElMessage.error(e.response.data.message)
    }
  }
}

const handleRemoveItem = async (item) => {
  try {
    await ElMessageBox.confirm('确定删除该商品？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await orderApi.removeItem(item.id, currentUser.value.userId)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.message || '删除失败')
    }
  }
}

const handleEndOrder = async () => {
  try {
    await ElMessageBox.confirm('确定结束拼单？结束后将计算每个人应付金额。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await orderApi.end(orderId, currentUser.value.userId)
    ElMessage.success('拼单已结束')
    await loadData()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.message || '操作失败')
    }
  }
}

const handleCancelOrder = async () => {
  try {
    await ElMessageBox.confirm('确定取消拼单？取消后无法恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await orderApi.cancel(orderId, currentUser.value.userId)
    ElMessage.success('拼单已取消')
    router.push('/')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.message || '操作失败')
    }
  }
}

const handleExport = async () => {
  try {
    const blob = await exportApi.exportExcel(orderId)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `拼单明细_${orderId}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

const goBack = () => {
  router.push('/')
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const getStatusType = (status) => {
  const map = {
    ACTIVE: 'success',
    ENDED: 'info',
    CANCELLED: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    ACTIVE: '进行中',
    ENDED: '已结束',
    CANCELLED: '已取消'
  }
  return map[status] || status
}
</script>

<style scoped>
.order-detail {
  padding: 20px 0;
}

.back-btn {
  margin-bottom: 20px;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.merchant-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.merchant-info h2 {
  margin: 0;
}

.order-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.info-item {
  display: flex;
  gap: 10px;
}

.info-item .label {
  color: #909399;
  min-width: 80px;
}

.info-item .value {
  color: #303133;
}

.info-item .link {
  color: #409eff;
}

.summary-card {
  position: sticky;
  top: 20px;
}

.summary-content {
  padding: 10px 0;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed #eee;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item .label {
  color: #909399;
}

.summary-item .value {
  font-size: 16px;
}

.summary-item .value.total {
  color: #303133;
  font-weight: bold;
}

.summary-item.remaining .value {
  color: #e6a23c;
  font-weight: bold;
}

.summary-item.success .label {
  color: #67c23a;
}

.summary-item .value.discount {
  color: #67c23a;
  font-weight: bold;
}

.summary-item.final {
  margin-top: 10px;
  padding-top: 15px;
  border-top: 2px solid #eee;
  border-bottom: none;
}

.summary-item.final .label {
  color: #303133;
  font-weight: bold;
}

.summary-item.final .value.final-amount {
  color: #f56c6c;
  font-size: 24px;
  font-weight: bold;
}

.recommendations {
  max-height: 300px;
  overflow-y: auto;
}

.recommendation-item {
  padding: 12px;
  background: #fdf6ec;
  border-radius: 4px;
  margin-bottom: 10px;
}

.recommendation-item:last-child {
  margin-bottom: 0;
}

.item-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.item-name {
  font-weight: bold;
}

.item-price {
  color: #e6a23c;
  font-weight: bold;
}

.item-suggestion {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.participants {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.participant {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background: #f5f7fa;
  border-radius: 20px;
}

.participant .name {
  font-size: 13px;
}

.final-price {
  color: #67c23a;
}

.final-amount {
  color: #f56c6c;
}

.discount {
  color: #67c23a;
}

.item-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.item-tag {
  background: #ecf5ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #409eff;
}
</style>
