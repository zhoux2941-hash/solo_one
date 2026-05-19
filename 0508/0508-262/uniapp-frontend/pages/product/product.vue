<template>
  <view class="product-page">
    <swiper class="banner" :indicator-dots="true">
      <swiper-item v-for="(img, index) in productImages" :key="index">
        <image :src="img" class="banner-image" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <view class="product-info">
      <view class="price-section">
        <text class="current-price">¥{{ product.price }}</text>
        <text class="original-price">¥{{ product.originalPrice }}</text>
        <view class="sales">已售{{ product.sales }}件</view>
      </view>
      <text class="product-name">{{ product.name }}</text>
      <text class="product-desc">{{ product.desc }}</text>
    </view>

    <view class="section">
      <view class="section-title">商品规格</view>
      <view class="spec-list">
        <text class="spec-item">约500g/份</text>
        <text class="spec-item">次日达</text>
        <text class="spec-item">坏单包赔</text>
      </view>
    </view>

    <view class="section">
      <view class="section-title">商品详情</view>
      <view class="detail-content">
        <text class="detail-text">
          本品为新鲜采摘的优质农产品，产地直供，品质保证。
          严格筛选，保证每一份商品都是新鲜优质的。
          配送全程冷链，保证商品新鲜度。
        </text>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="bar-item">
        <text class="bar-icon">🏠</text>
        <text class="bar-text">首页</text>
      </view>
      <view class="bar-item">
        <text class="bar-icon">💬</text>
        <text class="bar-text">客服</text>
      </view>
      <view class="bar-item cart-item">
        <text class="bar-icon">🛒</text>
        <text class="bar-text">购物车</text>
        <view class="cart-badge">2</view>
      </view>
      <button class="add-cart-btn" @click="addToCart">加入购物车</button>
      <button class="buy-now-btn" @click="buyNow">立即购买</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      productId: null,
      product: {
        name: '有机大白菜',
        price: '3.99',
        originalPrice: '5.99',
        sales: 888,
        desc: '新鲜有机种植，口感清甜，营养丰富'
      },
      productImages: [
        'https://picsum.photos/400/400?random=41',
        'https://picsum.photos/400/400?random=42',
        'https://picsum.photos/400/400?random=43'
      ]
    }
  },
  onLoad(options) {
    this.productId = options.id
  },
  methods: {
    addToCart() {
      uni.showToast({ title: '已加入购物车', icon: 'success' })
    },
    buyNow() {
      uni.showToast({ title: '立即购买功能开发中', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.product-page {
  padding-bottom: 120rpx;
}

.banner {
  height: 600rpx;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.product-info {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.current-price {
  font-size: 48rpx;
  color: #ff5722;
  font-weight: bold;
}

.original-price {
  font-size: 26rpx;
  color: #999;
  text-decoration: line-through;
}

.sales {
  font-size: 24rpx;
  color: #999;
  margin-left: auto;
}

.product-name {
  display: block;
  font-size: 36rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 15rpx;
}

.product-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.section {
  background: #fff;
  margin-bottom: 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.spec-item {
  background: #f5f7fa;
  color: #666;
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.detail-content {
  padding: 20rpx 0;
}

.detail-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  display: flex;
  align-items: center;
  border-top: 1rpx solid #eee;
  padding: 0 20rpx;
  box-sizing: border-box;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 30rpx;
  position: relative;
}

.bar-icon {
  font-size: 36rpx;
}

.bar-text {
  font-size: 20rpx;
  color: #666;
  margin-top: 4rpx;
}

.cart-badge {
  position: absolute;
  top: 0;
  right: 15rpx;
  background: #ff5722;
  color: #fff;
  font-size: 20rpx;
  min-width: 30rpx;
  height: 30rpx;
  line-height: 30rpx;
  text-align: center;
  border-radius: 15rpx;
  padding: 0 6rpx;
}

.add-cart-btn {
  flex: 1;
  background: #ff9800;
  color: #fff;
  border: none;
  font-size: 28rpx;
  height: 70rpx;
  line-height: 70rpx;
  margin: 0 10rpx;
  border-radius: 35rpx 0 0 35rpx;
}

.buy-now-btn {
  flex: 1;
  background: #ff5722;
  color: #fff;
  border: none;
  font-size: 28rpx;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 0 35rpx 35rpx 0;
}
</style>