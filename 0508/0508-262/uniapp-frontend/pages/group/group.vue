<template>
  <view class="group-page">
    <view class="banner">
      <view class="banner-text">
        <text class="title">限时拼团</text>
        <text class="subtitle">邀请好友一起拼，更划算</text>
      </view>
    </view>

    <view class="group-list">
      <view class="group-item" v-for="item in groupList" :key="item.id">
        <view class="item-header">
          <image :src="item.image" class="item-image" mode="aspectFill" />
          <view class="item-tag">
            <text class="tag-text">{{ item.minGroupSize }}人团</text>
          </view>
        </view>
        <view class="item-info">
          <text class="item-name">{{ item.name }}</text>
          <text class="item-desc">{{ item.desc }}</text>
          <view class="item-bottom">
            <view class="price-section">
              <text class="group-price">¥{{ item.groupPrice }}</text>
              <text class="original-price">¥{{ item.originalPrice }}</text>
            </view>
            <button class="join-btn" size="mini">去拼团</button>
          </view>
          <view class="group-progress">
            <text>已拼{{ item.joinedCount }}件</text>
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: (item.joinedCount / item.totalCount * 100) + '%' }"></view>
            </view>
            <text>还差{{ item.totalCount - item.joinedCount }}件成团</text>
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
      groupList: [
        {
          id: 1,
          name: '红富士苹果',
          desc: '山东烟台红富士，脆甜多汁',
          groupPrice: '8.99',
          originalPrice: '12.99',
          minGroupSize: 2,
          joinedCount: 156,
          totalCount: 200,
          image: 'https://picsum.photos/400/300?random=21'
        },
        {
          id: 2,
          name: '新鲜草莓',
          desc: '双流冬草莓，香甜可口',
          groupPrice: '19.99',
          originalPrice: '29.99',
          minGroupSize: 3,
          joinedCount: 88,
          totalCount: 100,
          image: 'https://picsum.photos/400/300?random=22'
        },
        {
          id: 3,
          name: '土鸡蛋30枚装',
          desc: '农家散养土鸡蛋，营养丰富',
          groupPrice: '29.90',
          originalPrice: '45.00',
          minGroupSize: 2,
          joinedCount: 120,
          totalCount: 150,
          image: 'https://picsum.photos/400/300?random=23'
        }
      ]
    }
  }
}
</script>

<style scoped>
.group-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

.banner {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  padding: 60rpx 40rpx;
  text-align: center;
}

.banner-text .title {
  display: block;
  font-size: 48rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.banner-text .subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.group-list {
  padding: 20rpx;
}

.group-item {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.item-header {
  position: relative;
}

.item-image {
  width: 100%;
  height: 300rpx;
}

.item-tag {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  background: #ff5722;
  color: #fff;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.tag-text {
  font-size: 24rpx;
}

.item-info {
  padding: 20rpx;
}

.item-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.item-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}

.group-price {
  font-size: 40rpx;
  color: #ff5722;
  font-weight: bold;
}

.original-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
}

.join-btn {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  color: #fff;
  border: none;
  font-size: 26rpx;
  padding: 12rpx 30rpx;
}

.group-progress {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 22rpx;
  color: #999;
}

.progress-bar {
  flex: 1;
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9a9e, #fecfef);
  border-radius: 6rpx;
}
</style>