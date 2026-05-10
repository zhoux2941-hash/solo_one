<template>
  <div id="app">
    <div class="header">
      <div class="container">
        <div class="logo" @click="$router.push('/')">
          😂 表情包大赛
        </div>
        <div class="nav">
          <router-link to="/">首页</router-link>
          <router-link to="/pk">随机PK</router-link>
          <router-link to="/ranking">排行榜</router-link>
          <router-link v-if="isAdmin" to="/admin">管理后台</router-link>
          <router-link v-if="isLoggedIn" to="/upload">上传作品</router-link>
        </div>
        <div class="user-info">
          <span v-if="isLoggedIn" class="remaining-votes">
            今日剩余票数: {{ remainingVotes }}
          </span>
          <template v-if="isLoggedIn">
            <span class="username">{{ userInfo.nickname }}</span>
            <el-button type="text" @click="logout">退出</el-button>
          </template>
          <template v-else>
            <router-link to="/login">登录</router-link>
            <router-link to="/register">注册</router-link>
          </template>
        </div>
      </div>
    </div>
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn
    },
    isAdmin() {
      return this.$store.getters.isAdmin
    },
    userInfo() {
      return this.$store.getters.userInfo
    },
    remainingVotes() {
      return this.$store.getters.remainingVotes
    }
  },
  created() {
    const token = localStorage.getItem('token')
    if (token) {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      this.$store.commit('SET_USER_INFO', userInfo)
      this.$store.commit('SET_TOKEN', token)
      this.fetchRemainingVotes()
    }
  },
  watch: {
    isLoggedIn(newVal) {
      if (newVal) {
        this.fetchRemainingVotes()
      }
    }
  },
  methods: {
    logout() {
      this.$store.dispatch('logout')
      this.$router.push('/login')
    },
    fetchRemainingVotes() {
      this.$store.dispatch('fetchRemainingVotes')
    }
  }
}
</script>
