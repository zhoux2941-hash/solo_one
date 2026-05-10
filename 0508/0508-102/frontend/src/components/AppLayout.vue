<template>
  <el-container style="height: 100vh;">
    <el-header>
      <div class="header-title">
        <i class="el-icon-office-building" style="margin-right: 10px;"></i>
        施工进度打卡系统
      </div>
      <div class="header-user">
        <el-badge 
          :value="unreadCount" 
          :hidden="unreadCount === 0"
          :max="99"
          class="message-badge"
        >
          <el-button 
            type="text" 
            class="header-button"
            @click="$router.push('/messages')"
          >
            <i class="el-icon-bell"></i>
            消息
          </el-button>
        </el-badge>
        <el-dropdown @command="handleCommand">
          <span class="el-dropdown-link">
            <i class="el-icon-user-solid"></i>
            {{ userName }}
            <i class="el-icon-arrow-down el-icon--right"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="profile">
              <i class="el-icon-setting"></i> 个人中心
            </el-dropdown-item>
            <el-dropdown-item command="messages">
              <i class="el-icon-bell"></i> 消息中心
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <i class="el-icon-switch-button"></i> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" style="background-color: #fff;">
        <el-menu
          :default-active="activeMenu"
          router
          class="el-menu-vertical-demo"
          background-color="#fff"
          text-color="#303133"
          active-text-color="#409eff"
        >
          <el-menu-item index="/">
            <i class="el-icon-s-home"></i>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/projects">
            <i class="el-icon-notebook-2"></i>
            <span>项目列表</span>
          </el-menu-item>
          <template v-if="isOwner">
            <el-menu-item index="/create-project">
              <i class="el-icon-plus"></i>
              <span>创建项目</span>
            </el-menu-item>
          </template>
          <template v-if="isWorker">
            <el-menu-item index="/checkin">
              <i class="el-icon-edit-outline"></i>
              <span>拍照打卡</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>
      <el-main>
        <slot></slot>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { messageAPI } from '../api'

export default {
  name: 'AppLayout',
  data() {
    return {
      unreadCount: 0,
      messageTimer: null
    }
  },
  computed: {
    ...mapGetters(['userName', 'isOwner', 'isWorker']),
    activeMenu() {
      return this.$route.path
    }
  },
  async created() {
    await this.loadUnreadCount()
    this.startMessageTimer()
  },
  beforeDestroy() {
    if (this.messageTimer) {
      clearInterval(this.messageTimer)
    }
  },
  methods: {
    ...mapActions(['logout']),
    async loadUnreadCount() {
      try {
        const res = await messageAPI.getUnreadCount()
        this.unreadCount = res.data
      } catch (error) {
        console.error('加载未读消息数失败', error)
      }
    },
    startMessageTimer() {
      this.messageTimer = setInterval(() => {
        this.loadUnreadCount()
      }, 30000)
    },
    handleCommand(command) {
      if (command === 'logout') {
        this.$confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.logout()
          this.$router.push('/login')
          this.$message.success('已退出登录')
        }).catch(() => {})
      } else if (command === 'profile') {
        this.$router.push('/profile')
      } else if (command === 'messages') {
        this.$router.push('/messages')
      }
    }
  }
}
</script>

<style scoped>
.el-header {
  background-color: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-title {
  font-size: 20px;
  font-weight: 600;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.el-dropdown-link {
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.el-dropdown-link:hover {
  opacity: 0.8;
}

.el-menu-vertical-demo {
  height: 100%;
  border-right: 1px solid #e4e7ed;
}

.el-menu-item {
  font-size: 15px;
}

.header-button {
  color: #fff;
  padding: 0 10px;
}

.header-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.message-badge >>> .el-badge__content {
  top: 2px;
  right: -2px;
}
</style>
