<template>
  <div class="my">
    <div class="user-header">
      <van-image
        round
        src="https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg"
      />
      <div class="user-info">
        <h3>车主用户</h3>
        <p>普通会员</p>
      </div>
    </div>

    <van-cell-group inset class="menu-group">
      <van-cell title="我的车辆" is-link>
        <template #icon>
          <van-icon name="orders-o" color="#409EFF" />
        </template>
      </van-cell>
      <van-cell title="欠费补缴" is-link>
        <template #icon>
          <van-icon name="underway-o" color="#F56C6C" />
        </template>
        <template #right-icon>
          <van-badge :content="3" />
        </template>
      </van-cell>
      <van-cell title="电子发票" is-link>
        <template #icon>
          <van-icon name="invoice" color="#67C23A" />
        </template>
      </van-cell>
      <van-cell title="停车记录" is-link>
        <template #icon>
          <van-icon name="clock-o" color="#E6A23C" />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset class="menu-group">
      <van-cell title="优惠券" is-link>
        <template #icon>
          <van-icon name="coupon-o" color="#FF7D00" />
        </template>
      </van-cell>
      <van-cell title="帮助中心" is-link>
        <template #icon>
          <van-icon name="service-o" color="#07C160" />
        </template>
      </van-cell>
      <van-cell title="设置" is-link>
        <template #icon>
          <van-icon name="setting-o" color="#909399" />
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup>
</script>

<style scoped>
.user-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info h3 {
  color: #fff;
  margin: 0 0 5px 0;
  font-size: 18px;
}

.user-info p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-size: 14px;
}

.menu-group {
  margin: 10px 0;
}
</style>
