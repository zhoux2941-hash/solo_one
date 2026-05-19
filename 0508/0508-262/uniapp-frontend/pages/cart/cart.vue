<template>
  <view class="cart-page">
    <view v-if="cartList.length > 0" class="cart-content">
      <view class="cart-list">
        <view class="cart-item" v-for="item in cartList" :key="item.id">
          <checkbox :checked="item.checked" class="checkbox" />
          <image :src="item.image" class="item-image" mode="aspectFill" />
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <text class="item-price">¥{{ item.price }}</text>
            <view class="item-actions">
              <button class="quantity-btn" size="mini" @click="decreaseQuantity(item)">-</button>
              <text class="quantity">{{ item.quantity }}</text>
              <button class="quantity-btn" size="mini" @click="increaseQuantity(item)">+</button>
            </view>
          </view>
          <text class="delete-btn" @click="deleteItem(item)">×</text>
        </view>
      </view>

      <view class="cart-bottom">
        <view class="select-all">
          <checkbox :checked="isAllSelected" @click="toggleSelectAll" />
          <text>全选</text>
        </view>
        <view class="total-info">
          <text class="total-label">合计：</text>
          <text class="total-price">¥{{ totalPrice }}</text>
        </view>
        <button class="checkout-btn" @click="handleCheckout">结算({{ selectedCount }})</button>
      </view>
    </view>

    <view v-else class="empty-cart">
      <view class="empty-icon">🛒</view>
      <text class="empty-text">购物车是空的</text>
      <button class="go-shopping-btn" @click="goShopping">去逛逛</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      cartList: [
        {
          id: 1,
          name: '有机大白菜',
          price: '3.99',
          quantity: 2,
          image: 'https://picsum.photos/200/200?random=1',
          checked: true
        },
        {
          id: 2,
          name: '红富士苹果',
          price: '8.99',
          quantity: 1,
          image: 'https://picsum.photos/200/200?random=2',
          checked: true
        }
      ]
    }
  },
  computed: {
    isAllSelected() {
      return this.cartList.length > 0 && this.cartList.every(item => item.checked)
    },
    selectedCount() {
      return this.cartList.filter(item => item.checked).reduce((sum, item) => sum + item.quantity, 0)
    },
    totalPrice() {
      return this.cartList
        .filter(item => item.checked)
        .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
        .toFixed(2)
    }
  },
  methods: {
    toggleSelectAll() {
      const newValue = !this.isAllSelected
      this.cartList.forEach(item => {
        item.checked = newValue
      })
    },
    increaseQuantity(item) {
      item.quantity++
    },
    decreaseQuantity(item) {
      if (item.quantity > 1) {
        item.quantity--
      }
    },
    deleteItem(item) {
      uni.showModal({
        title: '提示',
        content: '确定删除该商品吗？',
        success: (res) => {
          if (res.confirm) {
            const index = this.cartList.indexOf(item)
            if (index > -1) {
              this.cartList.splice(index, 1)
            }
          }
        }
      })
    },
    handleCheckout() {
      if (this.selectedCount === 0) {
        uni.showToast({ title: '请选择商品', icon: 'none' })
        return
      }
      uni.showToast({ title: '结算功能开发中', icon: 'none' })
    },
    goShopping() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.cart-list {
  padding: 20rpx;
}

.cart-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 20rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.checkbox {
  margin-right: 20rpx;
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.item-info {
  flex: 1;
}

.item-name {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.item-price {
  display: block;
  font-size: 32rpx;
  color: #ff5722;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.quantity-btn {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  background: #f5f5f5;
  border: none;
  font-size: 28rpx;
  line-height: 50rpx;
  padding: 0;
}

.quantity {
  font-size: 28rpx;
  min-width: 40rpx;
  text-align: center;
}

.delete-btn {
  width: 50rpx;
  height: 50rpx;
  text-align: center;
  line-height: 50rpx;
  font-size: 36rpx;
  color: #999;
}

.cart-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx;
  display: flex;
  align-items: center;
  border-top: 1rpx solid #eee;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 26rpx;
}

.total-info {
  flex: 1;
  text-align: right;
  padding-right: 20rpx;
}

.total-label {
  font-size: 26rpx;
  color: #666;
}

.total-price {
  font-size: 36rpx;
  color: #ff5722;
  font-weight: bold;
}

.checkout-btn {
  background: #409eff;
  color: #fff;
  border: none;
  font-size: 28rpx;
  padding: 16rpx 40rpx;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.go-shopping-btn {
  background: #409eff;
  color: #fff;
  border: none;
  padding: 20rpx 60rpx;
  font-size: 28rpx;
}
</style>