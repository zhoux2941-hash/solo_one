<template>
  <div class="exchange-page">
    <div class="header">
      <div class="title">积分兑换</div>
      <div class="points">我的积分: <span>{{ points }}</span></div>
    </div>

    <div class="selector" v-if="!selectedResidentId">
      <el-card>
        <div class="selector-title">请先选择居民</div>
        <el-select 
          v-model="selectedResidentId" 
          placeholder="请选择居民" 
          style="width: 100%"
          @change="loadPoints"
        >
          <el-option
            v-for="item in residents"
            :key="item.id"
            :label="`${item.roomNumber} - ${item.name}`"
            :value="item.id"
          />
        </el-select>
      </el-card>
    </div>

    <div class="product-list" v-if="selectedResidentId">
      <div v-for="product in products" :key="product.id" class="product-card">
        <div class="product-icon">
          <el-icon :size="40"><Gift /></el-icon>
        </div>
        <div class="product-info">
          <div class="product-name">{{ product.name }}</div>
          <div class="product-points">
            <el-tag type="warning" size="small">{{ product.pointsRequired }} 积分</el-tag>
          </div>
          <div class="product-stock">库存: {{ product.stock }}</div>
        </div>
        <div class="product-action">
          <el-button 
            type="primary" 
            :disabled="product.stock <= 0 || points < product.pointsRequired"
            @click="showExchangeDialog(product)"
          >
            兑换
          </el-button>
        </div>
      </div>

      <el-empty v-if="products.length === 0" description="暂无商品" />
    </div>

    <el-dialog v-model="showDialog" title="确认兑换" width="320px">
      <div class="confirm-info" v-if="currentProduct">
        <div class="confirm-item">
          <span class="label">商品:</span>
          <span>{{ currentProduct.name }}</span>
        </div>
        <div class="confirm-item">
          <span class="label">单价:</span>
          <span>{{ currentProduct.pointsRequired }} 积分</span>
        </div>
        <div class="confirm-item">
          <span class="label">数量:</span>
          <el-input-number 
            v-model="quantity" 
            :min="1" 
            :max="currentProduct.stock"
            :disabled="true"
          />
        </div>
        <div class="confirm-item total">
          <span class="label">共需:</span>
          <span class="total-points">{{ totalPoints }} 积分</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleExchange" :loading="loading">确认兑换</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { residentApi, productApi, orderApi } from '@/api'

const generateRequestId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const residents = ref([])
const products = ref([])
const selectedResidentId = ref(null)
const points = ref(0)
const showDialog = ref(false)
const currentProduct = ref(null)
const quantity = ref(1)
const loading = ref(false)
const lastRequestTime = ref(0)
const requestCooldown = 1500

const totalPoints = computed(() => {
  return (currentProduct.value?.pointsRequired || 0) * quantity.value
})

const getResidents = async () => {
  const res = await residentApi.list()
  residents.value = res.data
}

const getProducts = async () => {
  const res = await productApi.list()
  products.value = res.data
}

const loadPoints = async () => {
  if (!selectedResidentId.value) return
  const res = await residentApi.getPoints(selectedResidentId.value)
  points.value = res.data
}

const showExchangeDialog = (product) => {
  currentProduct.value = product
  quantity.value = 1
  showDialog.value = true
}

const handleExchange = async () => {
  const now = Date.now()
  
  if (loading.value) return
  if (now - lastRequestTime.value < requestCooldown) {
    ElMessage.warning('操作过于频繁，请稍后再试')
    return
  }
  
  if (points.value < totalPoints.value) {
    ElMessage.error('积分不足')
    return
  }

  loading.value = true
  lastRequestTime.value = now
  
  try {
    await orderApi.create({
      residentId: selectedResidentId.value,
      productId: currentProduct.value.id,
      quantity: quantity.value,
      requestId: generateRequestId()
    })
    ElMessage.success('兑换成功，请等待管理员核销')
    showDialog.value = false
    await getProducts()
    await loadPoints()
  } finally {
    loading.value = false
  }
}

watch(selectedResidentId, () => {
  loadPoints()
})

onMounted(async () => {
  await getResidents()
  await getProducts()
})
</script>

<style scoped>
.exchange-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  color: #fff;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.points {
  font-size: 14px;
  opacity: 0.9;
}

.points span {
  font-weight: bold;
  font-size: 18px;
}

.selector {
  padding: 20px;
}

.selector-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.product-list {
  padding: 15px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.product-icon {
  width: 70px;
  height: 70px;
  background: #f0f9ff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409EFF;
  margin-right: 15px;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.product-points {
  margin-bottom: 5px;
}

.product-stock {
  font-size: 12px;
  color: #999;
}

.product-action {
  flex-shrink: 0;
}

.confirm-info {
  padding: 10px 0;
}

.confirm-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.confirm-item:last-child {
  border-bottom: none;
}

.confirm-item .label {
  color: #666;
}

.confirm-item.total {
  padding-top: 15px;
}

.total-points {
  color: #ff6b6b;
  font-size: 18px;
  font-weight: bold;
}
</style>
