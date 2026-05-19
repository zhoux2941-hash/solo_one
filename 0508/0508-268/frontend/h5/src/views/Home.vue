<template>
  <div class="home">
    <van-nav-bar title="智慧停车" />
    
    <div class="search-box">
      <van-search
        v-model="plateNumber"
        placeholder="输入车牌号查询"
        show-action
        @search="searchParking"
      >
        <template #action>
          <div @click="searchParking">查询</div>
        </template>
      </van-search>
    </div>

    <van-grid :column-num="4" class="quick-menu">
      <van-grid-item icon="clock-o" text="停车缴费" @click="goPayment" />
      <van-grid-item icon="orders-o" text="我的订单" @click="goOrders" />
      <van-grid-item icon="invoice" text="电子发票" />
      <van-grid-item icon="service-o" text="客服中心" />
    </van-grid>

    <div class="current-parking" v-if="currentParking">
      <van-card
        tag="停车中"
        :title="currentParking.plateNumber"
        :desc="`入场时间: ${currentParking.entryTime}`"
        thumb="https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg"
      >
        <template #tags>
          <van-tag plain type="primary" size="small">车场ID: {{ currentParking.parkingLotId }}</van-tag>
        </template>
        <template #footer>
          <van-button size="small" type="danger" @click="payNow">立即缴费</van-button>
        </template>
      </van-card>
    </div>

    <div class="stats-card">
      <van-cell-group inset>
        <van-cell title="今日营收" is-link>
          <template #value>
            <span class="amount">¥{{ todayRevenue }}</span>
          </template>
        </van-cell>
        <van-cell title="可用车位" is-link>
          <template #value>
            <span class="available">{{ availableSpaces }}</span>
          </template>
        </van-cell>
        <van-cell title="在场车辆" is-link>
          <template #value>
            <span class="parking">{{ parkingVehicles }}</span>
          </template>
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import request from '../utils/request'

const router = useRouter()
const plateNumber = ref('')
const currentParking = ref(null)
const todayRevenue = ref('0.00')
const availableSpaces = ref(0)
const parkingVehicles = ref(0)

const searchParking = async () => {
  if (!plateNumber.value) {
    showToast('请输入车牌号')
    return
  }
  
  const res = await request.get(`/parking/current/${plateNumber.value}`)
  if (res.code === 200 && res.data) {
    currentParking.value = res.data
    showToast('查询成功')
  } else {
    currentParking.value = null
    showToast('未查询到停车记录')
  }
}

const loadStatistics = async () => {
  const res = await request.get('/parking/statistics/dashboard')
  if (res.code === 200) {
    todayRevenue.value = res.data.todayRevenue || '0.00'
    parkingVehicles.value = res.data.currentParkingVehicles || 0
    availableSpaces.value = res.data.parkingLotStats?.[0]?.availableSpaces || 0
  }
}

const goPayment = () => {
  router.push('/payment')
}

const goOrders = () => {
  router.push('/orders')
}

const payNow = () => {
  if (plateNumber.value) {
    router.push(`/payment?plate=${plateNumber.value}`)
  } else {
    showToast('请先输入车牌号')
  }
}

onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.search-box {
  padding: 10px;
  background: #fff;
}

.quick-menu {
  background: #fff;
  margin: 10px 0;
}

.current-parking {
  padding: 10px;
}

.stats-card {
  padding: 10px;
}

.amount {
  color: #F56C6C;
  font-weight: bold;
  font-size: 16px;
}

.available {
  color: #67C23A;
  font-weight: bold;
  font-size: 16px;
}

.parking {
  color: #E6A23C;
  font-weight: bold;
  font-size: 16px;
}
</style>
