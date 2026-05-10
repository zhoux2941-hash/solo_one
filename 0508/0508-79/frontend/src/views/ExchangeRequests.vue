<template>
  <div class="requests-page">
    <div class="page-header">
      <h2 class="page-title">交换请求</h2>
      <p>查看和管理你的交换请求</p>
    </div>

    <el-tabs v-model="activeTab" class="requests-tabs">
      <el-tab-pane label="全部" name="all">
        <render-requests :requests="requests" />
      </el-tab-pane>
      <el-tab-pane label="待处理" name="pending">
        <render-requests :requests="pendingRequests" />
      </el-tab-pane>
      <el-tab-pane label="我发起的" name="sent">
        <render-requests :requests="sentRequests" />
      </el-tab-pane>
      <el-tab-pane label="我收到的" name="received">
        <render-requests :requests="receivedRequests" />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showAcceptDialog" title="接受交换请求 - 记录成交价" width="550px">
      <div v-if="acceptingRequest" class="accept-form">
        <div class="box-preview">
          <div class="info-card my-box">
            <div class="card-label">我的盲盒</div>
            <div class="box-info">
              <div class="mini-image">
                <img v-if="acceptingRequest.requestBox?.imageUrl" :src="acceptingRequest.requestBox.imageUrl" />
                <span v-else>{{ acceptingRequest.requestBox?.seriesName }}</span>
              </div>
              <div>
                <p class="series">{{ acceptingRequest.requestBox?.seriesName }}</p>
                <p class="style">{{ acceptingRequest.requestBox?.styleName }}</p>
              </div>
            </div>
            <el-form-item class="price-form-item" label="我的估价">
              <el-input-number 
                v-model="priceForm.myBoxPrice" 
                :min="0" 
                :precision="2"
                :step="10"
                placeholder="选填"
                style="width: 140px"
              />
              <span class="unit">元</span>
            </el-form-item>
          </div>
          
          <div class="arrow">→</div>
          
          <div class="info-card other-box">
            <div class="card-label">对方盲盒</div>
            <div class="box-info">
              <div class="mini-image">
                <img v-if="acceptingRequest.offerBox?.imageUrl" :src="acceptingRequest.offerBox.imageUrl" />
                <span v-else>{{ acceptingRequest.offerBox?.seriesName }}</span>
              </div>
              <div>
                <p class="series">{{ acceptingRequest.offerBox?.seriesName }}</p>
                <p class="style">{{ acceptingRequest.offerBox?.styleName }}</p>
              </div>
            </div>
            <el-form-item class="price-form-item" label="对方估价">
              <el-input-number 
                v-model="priceForm.otherBoxPrice" 
                :min="0" 
                :precision="2"
                :step="10"
                placeholder="选填"
                style="width: 140px"
              />
              <span class="unit">元</span>
            </el-form-item>
          </div>
        </div>
        
        <el-alert 
          type="info" 
          :closable="false" 
          show-icon
          title="成交价记录帮助用户判断市场价值"
        >
          填写的价格会作为该款式盲盒的历史成交价，帮助其他用户参考市场价值
        </el-alert>
      </div>
      
      <template #footer>
        <el-button @click="showAcceptDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAccept" :loading="acceptLoading">确认接受并记录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyRequests, rejectRequest, cancelRequest } from '@/api/exchange'
import { acceptRequestWithPrice } from '@/api/price'

const requests = ref([])
const activeTab = ref('all')

const currentUser = computed(() => JSON.parse(localStorage.getItem('user') || '{}'))
const pendingRequests = computed(() => 
  requests.value.filter(r => r.status === 'PENDING' && r.toUser?.id === currentUser.value.userId)
)
const sentRequests = computed(() => 
  requests.value.filter(r => r.fromUser?.id === currentUser.value.userId)
)
const receivedRequests = computed(() => 
  requests.value.filter(r => r.toUser?.id === currentUser.value.userId)
)

const showAcceptDialog = ref(false)
const acceptingRequest = ref(null)
const acceptLoading = ref(false)
const priceForm = reactive({
  myBoxPrice: null,
  otherBoxPrice: null
})

const fetchRequests = async () => {
  try {
    const res = await getMyRequests()
    requests.value = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch (e) {
  }
}

const getStatusType = (status) => {
  const map = { PENDING: 'warning', COMPLETED: 'success', REJECTED: 'danger', CANCELLED: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { PENDING: '待处理', COMPLETED: '已完成', REJECTED: '已拒绝', CANCELLED: '已取消' }
  return map[status] || status
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const handleAccept = (request) => {
  acceptingRequest.value = request
  priceForm.myBoxPrice = null
  priceForm.otherBoxPrice = null
  showAcceptDialog.value = true
}

const confirmAccept = async () => {
  acceptLoading.value = true
  try {
    await acceptRequestWithPrice(acceptingRequest.value.id, {
      myBoxPrice: priceForm.myBoxPrice,
      otherBoxPrice: priceForm.otherBoxPrice
    })
    ElMessage.success('交换成功！成交价已记录')
    showAcceptDialog.value = false
    fetchRequests()
  } catch (e) {
  } finally {
    acceptLoading.value = false
  }
}

const handleReject = async (request) => {
  ElMessageBox.confirm('确定拒绝这个交换请求吗？', '提示', {
    confirmButtonText: '确定拒绝',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await rejectRequest(request.id)
    ElMessage.success('已拒绝')
    fetchRequests()
  }).catch(() => {})
}

const handleCancel = async (request) => {
  ElMessageBox.confirm('确定取消这个交换请求吗？', '提示', {
    confirmButtonText: '确定取消',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await cancelRequest(request.id)
    ElMessage.success('已取消')
    fetchRequests()
  }).catch(() => {})
}

const RenderRequests = defineComponent({
  props: ['requests'],
  setup(props) {
    const isCurrentUserReceiver = (r) => r.toUser?.id === currentUser.value.userId
    const isCurrentUserSender = (r) => r.fromUser?.id === currentUser.value.userId
    const renderBox = (box) => {
      if (!box) return h('span', '未知')
      return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        h('div', { style: 'width: 40px; height: 40px; border-radius: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; overflow: hidden;' }, [
          box.imageUrl ? h('img', { src: box.imageUrl, style: 'width: 100%; height: 100%; object-fit: cover;' }) : box.seriesName
        ]),
        h('div', [
          h('p', { style: 'margin: 0; font-weight: bold; font-size: 13px;' }, box.seriesName),
          h('p', { style: 'margin: 0; color: #666; font-size: 12px;' }, box.styleName)
        ])
      ])
    }
    
    return () => {
      if (!props.requests || props.requests.length === 0) {
        return h('el-empty', { description: '暂无交换请求' })
      }
      
      return h('div', { class: 'request-list', style: 'display: flex; flex-direction: column; gap: 16px;' }, 
        props.requests.map(r => {
          const isPending = r.status === 'PENDING'
          const canAccept = isPending && isCurrentUserReceiver(r)
          const canCancel = isPending && isCurrentUserSender(r)
          
          return h('el-card', { shadow: 'hover' }, {
            default: () => h('div', { style: 'display: flex; flex-direction: column; gap: 12px;' }, [
              h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' }, [
                h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
                  isCurrentUserReceiver(r) ? 
                    h('el-tag', { type: 'info' }, '收到的请求') : 
                    h('el-tag', { type: 'warning' }, '发起的请求'),
                  h('el-tag', { type: getStatusType(r.status) }, getStatusText(r.status))
                ]),
                h('span', { style: 'color: #999; font-size: 12px;' }, formatTime(r.createdAt))
              ]),
              h('div', { style: 'display: flex; align-items: center; gap: 16px; padding: 16px; background: #f5f7fa; border-radius: 8px;' }, [
                renderBox(r.offerBox),
                h('el-icon', { style: 'color: #667eea; font-size: 24px;' }, 'Right'),
                renderBox(r.requestBox)
              ]),
              r.message ? h('div', { style: 'padding: 8px; background: #fffbe6; border-radius: 4px; font-size: 13px; color: #e6a23c;' }, 
                `留言：${r.message}`) : null,
              (canAccept || canCancel) ? h('div', { style: 'display: flex; justify-content: flex-end; gap: 8px;' }, [
                canAccept ? h('el-button', { type: 'success', size: 'small', onClick: () => handleAccept(r) }, '接受') : null,
                canAccept ? h('el-button', { type: 'danger', size: 'small', onClick: () => handleReject(r) }, '拒绝') : null,
                canCancel ? h('el-button', { type: 'danger', size: 'small', onClick: () => handleCancel(r) }, '取消请求') : null
              ]) : null
            ])
          })
        })
      )
    }
  }
})

onMounted(() => {
  fetchRequests()
})
</script>

<style scoped>
.requests-page {
  max-width: 1000px;
  margin: 0 auto;
}

.requests-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.accept-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.box-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 0;
}

.info-card {
  flex: 1;
  padding: 16px;
  border-radius: 8px;
  background: #f5f7fa;
}

.info-card.my-box {
  border-left: 3px solid #67C23A;
}

.info-card.other-box {
  border-left: 3px solid #F56C6C;
}

.card-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.box-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.mini-image {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  overflow: hidden;
}

.mini-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.box-info .series {
  margin: 0;
  font-weight: bold;
  font-size: 13px;
}

.box-info .style {
  margin: 2px 0 0 0;
  color: #666;
  font-size: 12px;
}

.arrow {
  font-size: 24px;
  color: #667eea;
  font-weight: bold;
}

.price-form-item {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-form-item :deep(.el-form-item__label) {
  width: 60px !important;
  font-size: 13px;
  color: #606266;
}

.price-form-item :deep(.el-form-item__content) {
  flex: none;
}

.unit {
  color: #606266;
  font-size: 13px;
}
</style>
