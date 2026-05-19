<template>
  <div class="payment">
    <van-nav-bar title="停车缴费" left-arrow @click-left="goBack" />
    
    <div class="input-section">
      <van-field
        v-model="plateNumber"
        label="车牌号"
        placeholder="请输入车牌号"
        :border="false"
      />
      <van-button type="primary" block @click="queryFee">查询费用</van-button>
    </div>

    <div class="fee-section" v-if="feeInfo">
      <van-cell-group inset>
        <van-cell title="车牌号" :value="feeInfo.plateNumber" />
        <van-cell title="入场时间" :value="feeInfo.entryTime" />
        <van-cell title="离场时间" :value="feeInfo.exitTime" />
        <van-cell title="停车时长" :value="feeInfo.duration" />
        <van-cell title="应缴金额">
          <template #value>
            <span class="fee-amount">¥{{ feeInfo.amount }}</span>
          </template>
        </van-cell>
      </van-cell-group>

      <div class="payment-methods">
        <van-cell-group inset title="支付方式">
          <van-cell title="微信支付" is-link>
            <template #icon>
              <van-icon name="wechat" color="#07C160" size="24" />
            </template>
          </van-cell>
          <van-cell title="支付宝" is-link>
            <template #icon>
              <van-icon name="alipay" color="#1677FF" size="24" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <div class="pay-btn">
        <van-button type="danger" block size="large" @click="pay">
          确认支付 ¥{{ feeInfo.amount }}
        </van-button>
      </div>
    </div>

    <div class="unpaid-section" v-if="unpaidOrders.length > 0">
      <van-cell-group inset title="待缴订单">
        <van-cell
          v-for="order in unpaidOrders"
          :key="order.id"
          :title="order.plateNumber"
          :label="order.entryTime"
          is-link
        >
          <template #value>
            <span style="color: #F56C6C; font-weight: bold">¥{{ order.totalAmount }}</span>
          </template>
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import request from '../utils/request'

const router = useRouter()
const route = useRoute()
const plateNumber = ref('')
const feeInfo = ref(null)
const unpaidOrders = ref([])

const goBack = () => {
  router.back()
}

const queryFee = async () => {
  if (!plateNumber.value) {
    showToast('请输入车牌号')
    return
  }
  
  feeInfo.value = {
    plateNumber: plateNumber.value,
    entryTime: '2026-05-18 09:30:00',
    exitTime: '2026-05-18 12:30:00',
    duration: '3小时0分钟',
    amount: '15.00'
  }
  
  showToast('查询成功')
}

const loadUnpaidOrders = async () => {
  if (!plateNumber.value) return
  
  const res = await request.get(`/parking/order/unpaid/${plateNumber.value}`)
  if (res.code === 200) {
    unpaidOrders.value = res.data
  }
}

const pay = () => {
  showToast('支付成功')
  setTimeout(() => {
    router.push('/orders')
  }, 1000)
}

onMounted(() => {
  if (route.query.plate) {
    plateNumber.value = route.query.plate
    queryFee()
  }
})
</script>

<style scoped>
.input-section {
  padding: 16px;
  background: #fff;
}

.fee-section {
  padding: 16px 0;
}

.fee-amount {
  color: #F56C6C;
  font-weight: bold;
  font-size: 20px;
}

.payment-methods {
  margin: 16px 0;
}

.pay-btn {
  padding: 16px;
}

.unpaid-section {
  padding: 16px 0;
}
</style>
