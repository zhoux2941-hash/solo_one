<template>
  <div class="page-container">
    <h2 class="page-title">
      <el-icon><Connection /></el-icon>
      匹配建议
      <el-tag type="info" size="small" style="margin-left: 8px">
        系统每天凌晨2点自动扫描匹配，匹配度高于80%会自动推荐
      </el-tag>
    </h2>

    <div v-if="loading" class="loading-container">
      <el-loading />
    </div>

    <div v-else-if="matches.length > 0" class="match-list">
      <el-card
        v-for="item in matches"
        :key="item.record.id"
        class="match-card"
        shadow="hover"
      >
        <div class="match-header">
          <el-tag type="warning" size="large">待确认</el-tag>
          <span class="match-score">
            匹配度
            <el-progress
              :percentage="Math.round(item.record.matchScore * 100)"
              :color="getScoreColor(item.record.matchScore)"
              :stroke-width="10"
              :width="120"
              style="display: inline-block; margin-left: 8px; vertical-align: middle"
            />
          </span>
        </div>

        <div class="match-compare">
          <div class="match-side lost">
            <div class="side-label">
              <el-icon><Lost /></el-icon>
              您丢失的物品
            </div>
            <div class="item-name">{{ item.lostItem?.itemName }}</div>
            <div class="item-info">
              <el-icon><Location /></el-icon>
              {{ item.lostItem?.location }}
            </div>
            <div class="item-info">
              <el-icon><Clock /></el-icon>
              {{ formatDateTime(item.lostItem?.lostTime) }}
            </div>
          </div>

          <div class="match-arrow">
            <el-icon><RefreshRight /></el-icon>
          </div>

          <div class="match-side found">
            <div class="side-label">
              <el-icon><Found /></el-icon>
              可能匹配的拾物
            </div>
            <div class="item-name">{{ item.foundItem?.itemName }}</div>
            <div class="item-info">
              <el-icon><Location /></el-icon>
              {{ item.foundItem?.location }}
            </div>
            <div class="item-info" v-if="item.foundItem?.storageLocation">
              <el-icon><OfficeBuilding /></el-icon>
              存放于: {{ item.foundItem?.storageLocation }}
            </div>
            <div class="item-info">
              <el-icon><Clock /></el-icon>
              {{ formatDateTime(item.foundItem?.foundTime) }}
            </div>
          </div>
        </div>

        <div class="match-actions">
          <el-button type="danger" plain>忽略</el-button>
          <el-button type="primary" :loading="confirming === item.record.id" @click="confirmMatch(item.record.id)">
            确认匹配
          </el-button>
        </div>
      </el-card>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无匹配建议">
        <template #image>
          <el-icon size="80" color="#c0c4cc"><Connection /></el-icon>
        </template>
        <p>系统会在每天凌晨自动扫描匹配，请耐心等待</p>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { matchApi } from '@/api'

const loading = ref(false)
const confirming = ref(null)
const matches = ref([])

onMounted(() => loadMatches())

async function loadMatches() {
  loading.value = true
  try {
    const res = await matchApi.mySuggestions()
    matches.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function confirmMatch(id) {
  try {
    await ElMessageBox.confirm('确认匹配后，该物品状态将变为"已认领"，确定吗？', '确认匹配', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    confirming.value = id
    await matchApi.confirm(id)
    ElMessage.success('匹配成功！物品已标记为已认领')
    loadMatches()
  } catch (e) {
    console.error(e)
  } finally {
    confirming.value = null
  }
}

function getScoreColor(score) {
  const s = parseFloat(score)
  if (s >= 0.95) return '#67C23A'
  if (s >= 0.9) return '#409EFF'
  if (s >= 0.85) return '#E6A23C'
  return '#F56C6C'
}

function formatDateTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.match-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.match-card {
  border-left: 4px solid #E6A23C;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.match-score {
  display: flex;
  align-items: center;
  color: #606266;
}

.match-compare {
  display: flex;
  align-items: stretch;
  gap: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
}

.match-side {
  flex: 1;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
}

.match-side.lost {
  border: 2px solid #fef0f0;
}

.match-side.found {
  border: 2px solid #ecf5ff;
}

.side-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.item-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}

.match-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #409EFF;
  padding: 0 10px;
}

.match-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
</style>
