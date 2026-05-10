<template>
  <div class="groups-container">
    <h2>
      <el-icon><ChatDotRound /></el-icon>
      我的拼车小组
    </h2>

    <el-empty v-if="groups.length === 0" description="暂无拼车小组，找到匹配的行程并申请吧" />

    <div v-else class="group-list">
      <el-card 
        v-for="group in groups" 
        :key="group.id" 
        class="group-card" 
        shadow="hover"
        @click="goToGroup(group.id)"
      >
        <div class="group-header">
          <div class="route">
            <span class="city">{{ group.departureCity }}</span>
            <el-icon class="arrow"><Right /></el-icon>
            <span class="city">{{ group.destinationCity }}</span>
          </div>
          <el-tag :type="statusType(group.status)" size="small">
            {{ statusText(group.status) }}
          </el-tag>
        </div>

        <div class="group-info">
          <div class="info-item">
            <el-icon><Clock /></el-icon>
            <span>{{ formatTime(group.departureTime) }}</span>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span>组长：{{ group.leaderName }}</span>
          </div>
          <div class="info-item">
            <el-icon><UserFilled /></el-icon>
            <span>{{ group.members?.length || 0 }}人</span>
          </div>
        </div>

        <div class="group-members">
          <el-avatar 
            v-for="member in group.members?.slice(0, 5) || []" 
            :key="member.id"
            :size="32"
            class="member-avatar"
          >
            {{ member.realName?.charAt(0) }}
          </el-avatar>
          <span v-if="group.members?.length > 5" class="more-members">
            +{{ group.members.length - 5 }}
          </span>
        </div>

        <div class="group-footer">
          <el-button type="primary" size="small">
            <el-icon><ChatDotRound /></el-icon>
            进入聊天
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useGroupApi } from '@/api/group'

const router = useRouter()
const groupApi = useGroupApi()

const groups = ref([])

onMounted(() => {
  loadGroups()
})

const loadGroups = async () => {
  try {
    const res = await groupApi.getMyGroups()
    if (res.success) {
      groups.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const statusType = (status) => {
  if (status === 'ACTIVE') return 'success'
  if (status === 'COMPLETED') return 'primary'
  if (status === 'CANCELED') return 'danger'
  return 'info'
}

const statusText = (status) => {
  if (status === 'ACTIVE') return '进行中'
  if (status === 'COMPLETED') return '已完成'
  if (status === 'CANCELED') return '已取消'
  return status
}

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const goToGroup = (id) => {
  router.push(`/groups/${id}`)
}
</script>

<style scoped>
.groups-container h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.group-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.group-card {
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.group-card:hover {
  transform: translateY(-2px);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.route {
  display: flex;
  align-items: center;
  gap: 8px;
}

.city {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}

.arrow {
  color: #909399;
}

.group-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 13px;
}

.group-members {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.member-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: bold;
}

.more-members {
  color: #909399;
  font-size: 13px;
}

.group-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
