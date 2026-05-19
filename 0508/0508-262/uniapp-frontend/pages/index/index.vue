<template>
  <view class="index-page">
    <view class="search-bar">
      <input class="search-input" placeholder="搜索商品" />
    </view>

    <view class="banner">
      <swiper :indicator-dots="true" :autoplay="true" :interval="3000" :duration="1000">
        <swiper-item>
          <view class="banner-item banner-1">新鲜蔬果 限时特惠</view>
        </swiper-item>
        <swiper-item>
          <view class="banner-item banner-2">新品上架 第二件半价</view>
        </swiper-item>
      </swiper>
    </view>

    <view class="nav-section">
      <view class="nav-item" v-for="item in navList" :key="item.id">
        <view class="nav-icon" :style="{ background: item.color }">
          <text>{{ item.icon }}</text>
        </view>
        <text class="nav-text">{{ item.name }}</text>
      </view>
    </view>

    <view class="section-title">
      <text class="title">热门推荐</text>
      <text class="more">查看更多</text>
    </view>

    <view class="product-list">
      <view class="product-item" v-for="product in productList" :key="product.id">
        <view class="product-image">
          <image mode="aspectFill" :src="product.image" class="img" />
          <view v-if="product.tag" class="product-tag">{{ product.tag }}</view>
        </view>
        <view class="product-info">
          <text class="product-name">{{ product.name }}</text>
          <text class="product-desc">{{ product.desc }}</text>
          <view class="product-price">
            <text class="price">¥{{ product.price }}</text>
            <text class="original-price">¥{{ product.originalPrice }}</text>
          </view>
          <view class="product-bottom">
            <text class="sales">已售{{ product.sales }}件</text>
            <button class="add-cart-btn" size="mini">+ 加入购物车</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      navList: [
        { id: 1, name: '时令蔬菜', icon: '🥬', color: '#4caf50' },
        { id: 2, name: '新鲜水果', icon: '🍎', color: '#ff5722' },
        { id: 3, name: '肉禽蛋类', icon: '🥚', color: '#ff9800' },
        { id: 4, name: '海鲜水产', icon: '🦐', color: '#2196f3' },
        { id: 5, name: '粮油调味', icon: '🍚', color: '#795548' },
        { id: 6, name: '乳品饮料', icon: '🥛', color: '#00bcd4' },
        { id: 7, name: '休闲零食', icon: '🍪', color: '#e91e63' },
        { id: 8, name: '更多分类', icon: '📦', color: '#607d8b' }
      ],
      productList: [
        {
          id: 1,
          name: '有机大白菜',
          desc: '新鲜有机种植，口感清甜',
          price: '3.99',
          originalPrice: '5.99',
          image: 'https://picsum.photos/200/200?random=1',
          sales: 888,
          tag: '爆款'
        },
        {
          id: 2,
          name: '红富士苹果',
          desc: '山东烟台红富士，脆甜多汁',
          price: '8.99',
          originalPrice: '12.99',
          image: 'https://picsum.photos/200/200?random=2',
          sales: 666,
          tag: '新品'
        },
        {
          id: 3,
          name: '农家土鸡蛋',
          desc: '散养土鸡蛋，营养丰富',
          price: '1.00',
          originalPrice: '1.50',
          image: 'https://picsum.photos/200/200?random=3',
          sales: 999,
          tag: '热卖'
        },
        {
          id: 4,
          name: '新鲜草莓',
          desc: '双流冬草莓，香甜可口',
          price: '19.99',
          originalPrice: '29.99',
          image: 'https://picsum.photos/200/200?random=4',
          sales: 555,
          tag: ''
        }
      ]
    }
  },
  methods: {
    goToProduct(id) {
      uni.navigateTo({
        url: `/pages/product/product?id=${id}`
      })
    }
  }
}
</script>

<style scoped>
.index-page {
  padding-bottom: 40rpx;
}

.search-bar {
  padding: 20rpx;
  background: #fff;
}

.search-input {
  width: 100%;
  height: 70rpx;
  background: #f5f5f5;
  border-radius: 35rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}

.banner {
  margin: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.banner-item {
  height: 280rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 36rpx;
  font-weight: bold;
}

.banner-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.banner-2 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.nav-section {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx;
  background: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
}

.nav-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
}

.nav-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin-bottom: 10rpx;
}

.nav-text {
  font-size: 24rpx;
  color: #666;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20rpx 20rpx;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.more {
  font-size: 24rpx;
  color: #999;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  padding: 0 10rpx;
}

.product-item {
  width: 50%;
  padding: 0 10rpx 20rpx;
  box-sizing: border-box;
}

.product-image {
  position: relative;
  border-radius: 16rpx 16rpx 0 0;
  overflow: hidden;
}

.img {
  width: 100%;
  height: 300rpx;
}

.product-tag {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  background: #ff5722;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.product-info {
  background: #fff;
  padding: 20rpx;
  border-radius: 0 0 16rpx 16rpx;
}

.product-name {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.price {
  font-size: 32rpx;
  color: #ff5722;
  font-weight: bold;
}

.original-price {
  font-size: 22rpx;
  color: #999;
  text-decoration: line-through;
}

.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sales {
  font-size: 22rpx;
  color: #999;
}

.add-cart-btn {
  background: #409eff;
  color: #fff;
  border: none;
  font-size: 22rpx;
  padding: 8rpx 20rpx;
  line-height: 1;
}
</style>