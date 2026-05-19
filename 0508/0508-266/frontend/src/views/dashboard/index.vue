<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon :size="30" color="#fff"><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">装备总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon :size="30" color="#fff"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.inStock }}</div>
              <div class="stat-label">在库装备</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon :size="30" color="#fff"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">待审批</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon :size="30" color="#fff"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.logs }}</div>
              <div class="stat-label">今日操作</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" icon="Plus" @click="$router.push('/approval/my')">申请领用</el-button>
            <el-button type="success" icon="List" @click="$router.push('/equipment/list')">装备台账</el-button>
            <el-button type="warning" icon="Tickets" @click="$router.push('/approval/pending')">待我审批</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>系统信息</span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="当前用户">{{ userStore.realName }}</el-descriptions-item>
            <el-descriptions-item label="用户角色">{{ roleName }}</el-descriptions-item>
            <el-descriptions-item label="所属部门">{{ userStore.deptName }}</el-descriptions-item>
            <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const stats = ref({
  total: 0,
  inStock: 0,
  pending: 0,
  logs: 0
})

const roleName = computed(() => {
  const map = {
    ADMIN: '系统管理员',
    WAREHOUSE_KEEPER: '库管专员',
    AUDITOR: '涉密审核员',
    OPERATOR: '一线领用人员'
  }
  return map[userStore.roleCode] || ''
})

onMounted(() => {
  stats.value = {
    total: 128,
    inStock: 96,
    pending: 8,
    logs: 56
  }
})
</script>

<style scoped>
.dashboard {
  padding: 10px 0;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.quick-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}
</style>
