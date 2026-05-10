<template>
  <AppLayout>
    <div>
      <h2 class="page-title">个人中心</h2>

      <el-card class="card">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户名">
            {{ user.username }}
          </el-descriptions-item>
          <el-descriptions-item label="姓名">
            {{ user.name }}
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="user.role === 'OWNER' ? 'success' : 'primary'" size="medium">
              {{ user.role === 'OWNER' ? '房主' : '施工员' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ user.phone || '未设置' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="card" style="margin-top: 20px;">
        <div slot="header">
          <span>快捷操作</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="card project-card" @click="$router.push('/projects')">
              <div style="text-align: center; padding: 20px;">
                <i class="el-icon-notebook-2" style="font-size: 36px; color: #409eff;"></i>
                <h4 style="margin-top: 10px;">项目管理</h4>
              </div>
            </div>
          </el-col>
          <el-col :span="8" v-if="isWorker">
            <div class="card project-card" @click="$router.push('/checkin')">
              <div style="text-align: center; padding: 20px;">
                <i class="el-icon-camera" style="font-size: 36px; color: #67c23a;"></i>
                <h4 style="margin-top: 10px;">拍照打卡</h4>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="card project-card" @click="handleLogout">
              <div style="text-align: center; padding: 20px;">
                <i class="el-icon-switch-button" style="font-size: 36px; color: #f56c6c;"></i>
                <h4 style="margin-top: 10px;">退出登录</h4>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '../components/AppLayout'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Profile',
  components: { AppLayout },
  computed: {
    ...mapGetters(['user', 'isWorker']),
  },
  methods: {
    ...mapActions(['logout']),
    handleLogout() {
      this.$confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.logout()
        this.$router.push('/login')
        this.$message.success('已退出登录')
      }).catch(() => {})
    }
  }
}
</script>
