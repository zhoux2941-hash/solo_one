<template>
  <div class="records-page">
    <div class="header">
      <div class="title">兑换记录</div>
    </div>

    <el-card class="selector-card" v-if="!selectedResidentId">
      <div class="selector-title">请先选择居民</div>
      <el-select 
        v-model="selectedResidentId" 
        placeholder="请选择居民" 
        style="width: 100%"
        @change="loadOrders"
      >
        <el-option
          v-for="item in residents"
          :key="item.id"
          :label="`${item.roomNumber} - ${item.name}`"
          :value="item.id"
        />
      </el-select>
    </el-card>

    <div class="order-list" v-if="selectedResidentId">
      <div class="resident-selector">
        <el-select 
          v-model="selectedResidentId" 
          placeholder="请选择居民" 
          style="width: 100%"
          @change="loadOrders"
        >
          <el-option
            v-for="item in residents"
            :key="item.id"
            :label="`${item.roomNumber} - ${item.name}`"
            :value="item.id"
          />
        </el-select>
      </div>

      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span class="order-no">{{ order.orderNo }}</span>
          <el-tag :type="getStatusTag(order.status)">{{ order.status }}</el-tag>
        </div>
        <div class="order-body">
          <div class="product-info">
            <div class="product-icon">
              <el-icon><ShoppingBag /></el-icon>
            </div>
            <div class="product-detail">
              <div class="product-name">{{ order.productName }}</div>
              <div class="product-extra">
                <span>数量: {{ order.quantity }}</span>
              </div>
            </div>
          </div>
          <div class="points-consumed">
            -{{ order.pointsConsumed }}
            <span class="unit">积分</span>
          </div>
        </div>
        <div class="order-footer">
          <span>{{ formatTime(order.createTime) }}</span>
          <span v-if="order.verifyTime" class="verify-time">
            核销时间: {{ formatTime(order.verifyTime) }}
          </span>
        </div>
      </div>

      <el-empty v-if="orders.length === 0" description="暂无兑换记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { residentApi, orderApi } from '@/api'

const residents = ref([])
const selectedResidentId = ref(null)
const orders = ref([])

const getResidents = async () => {
  const res = await residentApi.list()
  residents.value = res.data
}

const loadOrders = async () => {
  if (!selectedResidentId.value) return
  const res = await orderApi.getByResidentId(selectedResidentId.value)
  orders.value = res.data
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const getStatusTag = (status) => {
  const map = {
    '待核销': 'warning',
    '已核销': 'success',
    '已取消': 'info'
  }
  return map[status] || 'info'
}

onMounted(() => {
  getResidents()
})
</script>

<style scoped>
.records-page {
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
}

.selector-card {
  margin: 20px;
}

.selector-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.order-list {
  padding: 15px;
}

.resident-selector {
  margin-bottom: 15px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.order-no {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-icon {
  width: 50px;
  height: 50px;
  background: #f0f9ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409EFF;
  margin-right: 12px;
  font-size: 24px;
}

.product-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.product-extra {
  font-size: 12px;
  color: #999;
}

.points-consumed {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
}

.points-consumed .unit {
  font-size: 14px;
  font-weight: normal;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #999;
}

.verify-time {
  color: #67c23a;
}
</style>
