<template>
  <view class="order-page">
    <view class="tabs">
      <view
        class="tab-item"
        :class="{ active: currentTab === index }"
        v-for="(tab, index) in tabs"
        :key="index"
        @click="switchTab(index)"
      >
        {{ tab }}
      </view>
    </view>

    <scroll-view class="order-list" scroll-y>
      <view class="order-item" v-for="order in orderList" :key="order.id">
        <view class="order-header">
          <text class="order-no">订单号：{{ order.orderNo }}</text>
          <text class="order-status" :class="'status-' + order.status">{{ order.statusText }}</text>
        </view>
        <view class="order-goods">
          <view class="goods-item" v-for="goods in order.goodsList" :key="goods.id">
            <image :src="goods.image" class="goods-image" mode="aspectFill" />
            <view class="goods-info">
              <text class="goods-name">{{ goods.name }}</text>
              <text class="goods-spec">{{ goods.spec }}</text>
              <view class="goods-bottom">
                <text class="goods-price">¥{{ goods.price }}</text>
                <text class="goods-quantity">x{{ goods.quantity }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="order-footer">
          <text class="total-text">共{{ order.totalQuantity }}件商品，合计：</text>
          <text class="total-price">¥{{ order.totalPrice }}</text>
        </view>
        <view class="order-actions">
          <button class="action-btn secondary" v-if="order.status === 0" @click="handlePay(order)">立即支付</button>
          <button class="action-btn secondary" v-if="order.status === 3" @click="handleConfirm(order)">确认收货</button>
          <button class="action-btn primary" @click="handleDetail(order)">查看详情</button>
        </view>
      </view>

      <view v-if="orderList.length === 0" class="empty">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无订单</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentTab: 0,
      tabs: ['全部', '待支付', '待发货', '配送中', '已完成'],
      orderList: []
    }
  },
  onLoad(options) {
    if (options.status !== undefined) {
      this.currentTab = parseInt(options.status) + 1
    }
    this.loadOrders()
  },
  methods: {
    switchTab(index) {
      this.currentTab = index
      this.loadOrders()
    },
    loadOrders() {
      this.orderList = [
        {
          id: 1,
          orderNo: 'ORD202405180001',
          status: 1,
          statusText: '待发货',
          totalQuantity: 3,
          totalPrice: '35.96',
          goodsList: [
            { id: 1, name: '有机大白菜', spec: '约500g/颗', price: '3.99', quantity: 2, image: 'https://picsum.photos/200/200?random=31' },
            { id: 2, name: '红富士苹果', spec: '约500g/份', price: '8.99', quantity: 1, image: 'https://picsum.photos/200/200?random=32' }
          ]
        },
        {
          id: 2,
          orderNo: 'ORD202405170002',
          status: 3,
          statusText: '配送中',
          totalQuantity: 2,
          totalPrice: '59.80',
          goodsList: [
            { id: 3, name: '新鲜草莓', spec: '约300g/盒', price: '19.99', quantity: 2, image: 'https://picsum.photos/200/200?random=33' }
          ]
        },
        {
          id: 3,
          orderNo: 'ORD202405150003',
          status: 4,
          statusText: '已完成',
          totalQuantity: 10,
          totalPrice: '10.00',
          goodsList: [
            { id: 4, name: '土鸡蛋', spec: '约50g/个', price: '1.00', quantity: 10, image: 'https://picsum.photos/200/200?random=34' }
          ]
        }
      ]
    },
    handlePay(order) {
      uni.showToast({ title: '支付功能开发中', icon: 'none' })
    },
    handleConfirm(order) {
      uni.showModal({
        title: '提示',
        content: '确认收到商品？',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({ title: '已确认收货' })
          }
        }
      })
    },
    handleDetail(order) {
      uni.showToast({ title: '订单详情开发中', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.order-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 26rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #409eff;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background: #409eff;
  border-radius: 2rpx;
}

.order-list {
  flex: 1;
  padding: 20rpx;
}

.order-item {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.order-no {
  font-size: 24rpx;
  color: #999;
}

.order-status {
  font-size: 26rpx;
  font-weight: bold;
}

.status-0 { color: #e6a23c; }
.status-1 { color: #409eff; }
.status-2 { color: #409eff; }
.status-3 { color: #67c23a; }
.status-4 { color: #999; }

.order-goods {
  padding: 20rpx;
}

.goods-item {
  display: flex;
  margin-bottom: 20rpx;
}

.goods-item:last-child {
  margin-bottom: 0;
}

.goods-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.goods-name {
  font-size: 28rpx;
  color: #333;
}

.goods-spec {
  font-size: 22rpx;
  color: #999;
}

.goods-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goods-price {
  font-size: 28rpx;
  color: #ff5722;
  font-weight: bold;
}

.goods-quantity {
  font-size: 24rpx;
  color: #999;
}

.order-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 20rpx;
  border-top: 1rpx solid #f5f5f5;
  gap: 10rpx;
}

.total-text {
  font-size: 24rpx;
  color: #666;
}

.total-price {
  font-size: 32rpx;
  color: #ff5722;
  font-weight: bold;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  padding: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.action-btn {
  font-size: 24rpx;
  padding: 12rpx 30rpx;
  border-radius: 30rpx;
  line-height: 1;
}

.action-btn.primary {
  background: #409eff;
  color: #fff;
  border: none;
}

.action-btn.secondary {
  background: #fff;
  color: #409eff;
  border: 2rpx solid #409eff;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>