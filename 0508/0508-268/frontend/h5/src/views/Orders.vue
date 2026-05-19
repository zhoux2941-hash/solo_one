<template>
  <div class="orders">
    <van-nav-bar title="我的订单" left-arrow @click-left="goBack" />
    
    <van-tabs v-model:active="activeTab">
      <van-tab title="全部">
        <order-list :status="null" />
      </van-tab>
      <van-tab title="待支付">
        <order-list status="UNPAID" />
      </van-tab>
      <van-tab title="已完成">
        <order-list status="PAID" />
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref(0)

const goBack = () => {
  router.back()
}
</script>

<script>
import request from '../utils/request'

export default {
  name: 'OrderList',
  props: ['status'],
  setup(props) {
    const orders = ref([
      {
        id: 1,
        orderNo: 'PK1234567890',
        plateNumber: '京A12345',
        entryTime: '2026-05-18 09:30:00',
        exitTime: '2026-05-18 12:30:00',
        totalAmount: 15.00,
        paidAmount: 15.00,
        orderStatus: 'PAID'
      }
    ])

    return { orders }
  },
  template: `
    <van-pull-refresh>
      <van-list>
        <van-cell-group inset>
          <van-cell
            v-for="order in orders"
            :key="order.id"
            :title="order.plateNumber"
            :label="order.entryTime"
            is-link
            center
          >
            <template #value>
              <div class="order-right">
                <span class="order-amount">¥{{ order.totalAmount }}</span>
                <van-tag :type="order.orderStatus === 'PAID' ? 'success' : 'warning'" size="small">
                  {{ order.orderStatus === 'PAID' ? '已支付' : '待支付' }}
                </van-tag>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </van-list>
    </van-pull-refresh>
  `
}
</script>

<style scoped>
.order-right {
  text-align: right;
}

.order-amount {
  display: block;
  color: #F56C6C;
  font-weight: bold;
  margin-bottom: 4px;
}
</style>
