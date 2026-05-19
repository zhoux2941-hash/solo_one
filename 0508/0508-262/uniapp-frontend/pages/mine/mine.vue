<template>
  <view class="mine-page">
    <view class="header">
      <view class="user-info" v-if="isLoggedIn">
        <image class="avatar" src="https://picsum.photos/100/100?random=10" mode="aspectFill" />
        <view class="info">
          <text class="nickname">{{ userInfo.nickname || '用户' }}</text>
          <text class="phone">{{ userInfo.phone || '' }}</text>
        </view>
      </view>
      <view class="user-info" v-else @click="goLogin">
        <view class="avatar-placeholder">👤</view>
        <view class="info">
          <text class="login-tip">点击登录</text>
        </view>
      </view>
    </view>

    <view class="order-section">
      <view class="section-header">
        <text class="section-title">我的订单</text>
        <text class="more">全部订单 ></text>
      </view>
      <view class="order-tabs">
        <view class="tab-item" @click="goOrder(0)">
          <view class="tab-icon">💳</view>
          <text class="tab-text">待支付</text>
        </view>
        <view class="tab-item" @click="goOrder(1)">
          <view class="tab-icon">📦</view>
          <text class="tab-text">待发货</text>
        </view>
        <view class="tab-item" @click="goOrder(2)">
          <view class="tab-icon">🚚</view>
          <text class="tab-text">配送中</text>
        </view>
        <view class="tab-item" @click="goOrder(3)">
          <view class="tab-icon">✅</view>
          <text class="tab-text">已完成</text>
        </view>
        <view class="tab-item" @click="goRefund()">
          <view class="tab-icon">↩️</view>
          <text class="tab-text">退款</text>
        </view>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item" @click="handleMenu('group')">
        <view class="menu-icon">🎯</view>
        <text class="menu-text">我的拼团</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item" @click="handleMenu('favorite')">
        <view class="menu-icon">❤️</view>
        <text class="menu-text">我的收藏</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item" @click="handleMenu('address')">
        <view class="menu-icon">📍</view>
        <text class="menu-text">收货地址</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item" @click="handleMenu('coupon')">
        <view class="menu-icon">🎫</view>
        <text class="menu-text">优惠券</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item" @click="handleMenu('service')">
        <view class="menu-icon">📞</view>
        <text class="menu-text">联系客服</text>
        <text class="arrow">></text>
      </view>
    </view>

    <view v-if="isLoggedIn" class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isLoggedIn: false,
      userInfo: {}
    }
  },
  onShow() {
    const token = uni.getStorageSync('token')
    this.isLoggedIn = !!token
    if (this.isLoggedIn) {
      this.userInfo = uni.getStorageSync('userInfo') || {}
    }
  },
  methods: {
    goLogin() {
      uni.navigateTo({ url: '/pages/login/login' })
    },
    goOrder(status) {
      if (!this.isLoggedIn) {
        this.goLogin()
        return
      }
      uni.navigateTo({ url: `/pages/order/order?status=${status}` })
    },
    goRefund() {
      uni.showToast({ title: '退款功能开发中', icon: 'none' })
    },
    handleMenu(type) {
      uni.showToast({ title: `${type}功能开发中`, icon: 'none' })
    },
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            this.isLoggedIn = false
            this.userInfo = {}
            uni.showToast({ title: '已退出登录' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  margin-right: 30rpx;
}

.avatar-placeholder {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  margin-right: 30rpx;
}

.info {
  flex: 1;
}

.nickname {
  display: block;
  font-size: 36rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.phone {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.login-tip {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.order-section {
  background: #fff;
  margin: -30rpx 20rpx 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
  position: relative;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.more {
  font-size: 24rpx;
  color: #999;
}

.order-tabs {
  display: flex;
  justify-content: space-around;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tab-icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.tab-text {
  font-size: 24rpx;
  color: #666;
}

.menu-section {
  background: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.arrow {
  font-size: 28rpx;
  color: #ccc;
}

.logout-section {
  padding: 40rpx 20rpx;
}

.logout-btn {
  width: 100%;
  background: #fff;
  color: #f56c6c;
  border: none;
  font-size: 28rpx;
  padding: 24rpx;
}
</style>