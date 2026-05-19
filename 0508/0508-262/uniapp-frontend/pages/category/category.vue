<template>
  <view class="category-page">
    <view class="search-bar">
      <input class="search-input" placeholder="搜索商品" />
    </view>
    <view class="content">
      <scroll-view class="sidebar" scroll-y>
        <view
          class="sidebar-item"
          :class="{ active: currentCategory === item.id }"
          v-for="item in categoryList"
          :key="item.id"
          @click="selectCategory(item.id)"
        >
          {{ item.name }}
        </view>
      </scroll-view>
      <scroll-view class="product-area" scroll-y>
        <view class="product-item" v-for="product in productList" :key="product.id">
          <image :src="product.image" class="product-image" mode="aspectFill" />
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-price">¥{{ product.price }}</text>
            <button class="add-btn" size="mini">+ 加购</button>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentCategory: 1,
      categoryList: [
        { id: 1, name: '时令蔬菜' },
        { id: 2, name: '新鲜水果' },
        { id: 3, name: '肉禽蛋类' },
        { id: 4, name: '海鲜水产' },
        { id: 5, name: '粮油调味' },
        { id: 6, name: '乳品饮料' }
      ],
      productList: []
    }
  },
  onLoad() {
    this.loadProducts()
  },
  methods: {
    selectCategory(id) {
      this.currentCategory = id
      this.loadProducts()
    },
    loadProducts() {
      this.productList = [
        { id: 1, name: '有机大白菜', price: '3.99', image: 'https://picsum.photos/200/200?random=11' },
        { id: 2, name: '新鲜西兰花', price: '5.99', image: 'https://picsum.photos/200/200?random=12' },
        { id: 3, name: '西红柿', price: '4.50', image: 'https://picsum.photos/200/200?random=13' },
        { id: 4, name: '黄瓜', price: '3.20', image: 'https://picsum.photos/200/200?random=14' }
      ]
    }
  }
}
</script>

<style scoped>
.category-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
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
  box-sizing: border-box;
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 200rpx;
  background: #f8f8f8;
}

.sidebar-item {
  height: 100rpx;
  line-height: 100rpx;
  text-align: center;
  font-size: 26rpx;
  color: #666;
  border-left: 6rpx solid transparent;
}

.sidebar-item.active {
  background: #fff;
  color: #409eff;
  border-left-color: #409eff;
  font-weight: bold;
}

.product-area {
  flex: 1;
  background: #fff;
  padding: 20rpx;
}

.product-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.product-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 28rpx;
  color: #333;
}

.product-price {
  font-size: 32rpx;
  color: #ff5722;
  font-weight: bold;
}

.add-btn {
  align-self: flex-end;
  background: #409eff;
  color: #fff;
  border: none;
  font-size: 22rpx;
  padding: 8rpx 20rpx;
}
</style>