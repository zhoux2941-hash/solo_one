<template>
  <view class="login-page">
    <view class="logo-section">
      <view class="logo">🛒</view>
      <text class="app-name">社区团购</text>
      <text class="app-slogan">新鲜直达 品质保障</text>
    </view>

    <view class="form-section">
      <view class="form-item">
        <text class="label">用户名</text>
        <input class="input" v-model="form.username" placeholder="请输入用户名" />
      </view>
      <view class="form-item">
        <text class="label">密码</text>
        <input class="input" v-model="form.password" type="password" placeholder="请输入密码" />
      </view>

      <button class="login-btn" @click="handleLogin" :loading="loading">登录</button>

      <view class="register-tip">
        <text>还没有账号？</text>
        <text class="register-link" @click="handleRegister">立即注册</text>
      </view>
    </view>

    <view class="test-accounts">
      <text class="title">测试账号：</text>
      <view class="account-item">用户：user / 123456</view>
      <view class="account-item">团长：leader / 123456</view>
      <view class="account-item">管理员：admin / 123456</view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      form: {
        username: '',
        password: ''
      }
    }
  },
  methods: {
    async handleLogin() {
      if (!this.form.username || !this.form.password) {
        uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
        return
      }

      this.loading = true
      try {
        const res = await uni.request({
          url: '/api/auth/login',
          method: 'POST',
          data: this.form
        })

        if (res.data.code === 200) {
          uni.setStorageSync('token', res.data.data.token)
          uni.setStorageSync('userInfo', {
            userId: res.data.data.userId,
            username: res.data.data.username,
            nickname: res.data.data.nickname,
            role: res.data.data.role
          })

          uni.showToast({ title: '登录成功', icon: 'success' })

          setTimeout(() => {
            uni.switchTab({ url: '/pages/index/index' })
          }, 1000)
        } else {
          uni.showToast({ title: res.data.message || '登录失败', icon: 'none' })
        }
      } catch (error) {
        if (this.form.username === 'user' || this.form.username === 'leader' || this.form.username === 'admin') {
          uni.setStorageSync('token', 'mock-token-' + this.form.username)
          uni.setStorageSync('userInfo', {
            username: this.form.username,
            nickname: this.form.username === 'user' ? '李用户' : this.form.username === 'leader' ? '张团长' : '管理员',
            role: this.form.username.toUpperCase()
          })
          uni.showToast({ title: '模拟登录成功', icon: 'success' })
          setTimeout(() => {
            uni.switchTab({ url: '/pages/index/index' })
          }, 1000)
        } else {
          uni.showToast({ title: '登录失败，请检查网络', icon: 'none' })
        }
      } finally {
        this.loading = false
      }
    },
    handleRegister() {
      uni.showToast({ title: '注册功能开发中', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 80rpx 60rpx;
  background: #fff;
}

.logo-section {
  text-align: center;
  margin-bottom: 80rpx;
}

.logo {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.app-name {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.app-slogan {
  font-size: 24rpx;
  color: #999;
}

.form-section {
  margin-bottom: 60rpx;
}

.form-item {
  margin-bottom: 40rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 32rpx;
  margin-top: 20rpx;
}

.register-tip {
  text-align: center;
  margin-top: 40rpx;
  font-size: 26rpx;
  color: #666;
}

.register-link {
  color: #409eff;
  margin-left: 10rpx;
}

.test-accounts {
  background: #f5f7fa;
  padding: 30rpx;
  border-radius: 16rpx;
}

.test-accounts .title {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.account-item {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 10rpx;
}
</style>