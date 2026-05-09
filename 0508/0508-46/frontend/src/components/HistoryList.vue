<template>
  <div class="history-list">
    <div class="header">
      <h3>模拟历史记录</h3>
      <button @click="refresh" class="btn-refresh">刷新</button>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="history.length === 0" class="empty">
      暂无历史记录
    </div>
    <table v-else>
      <thead>
        <tr>
          <th>模拟ID</th>
          <th>孩子数量</th>
          <th>耐心系数</th>
          <th>滑梯时间</th>
          <th>模拟时长</th>
          <th>中途离开</th>
          <th>总游玩次数</th>
          <th>平均等待</th>
          <th>模拟时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in safeHistory" :key="index">
          <td class="id-cell">{{ item.simulationId || '-' }}</td>
          <td>{{ (item.totalChildren || 0) }}人</td>
          <td>{{ (item.patienceCoefficient || 0) }}s</td>
          <td>{{ (item.slideUsageTime || 0) }}s</td>
          <td>{{ (item.totalSimulationTime || 0) }}s</td>
          <td>
            <span :class="(item.childrenWhoLeftEarly || 0) > 0 ? 'text-red' : 'text-green'">
              {{ (item.childrenWhoLeftEarly || 0) }}人
            </span>
          </td>
          <td>{{ (item.totalPlays || 0) }}次</td>
          <td>{{ (item.averageWaitTime || 0) }}s</td>
          <td>{{ formatTime(item.simulationTime) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { simulationService } from '../api/simulationService'

export default {
  name: 'HistoryList',
  data() {
    return {
      history: [],
      loading: false
    }
  },
  mounted() {
    this.refresh()
  },
  computed: {
    safeHistory() {
      return (this.history || []).filter(item => item && item.simulationId)
    }
  },
  methods: {
    async refresh() {
      this.loading = true
      try {
        const response = await simulationService.getHistory()
        if (response.success) {
          this.history = response.data
        }
      } catch (error) {
        console.error('获取历史记录失败:', error)
      } finally {
        this.loading = false
      }
    },
    formatTime(timeStr) {
      if (!timeStr) return '-'
      try {
        const date = new Date(timeStr)
        return date.toLocaleString('zh-CN')
      } catch {
        return timeStr
      }
    }
  }
}
</script>

<style scoped>
.history-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header h3 {
  margin: 0;
  color: #333;
}

.btn-refresh {
  padding: 6px 16px;
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh:hover {
  opacity: 0.8;
}

.loading, .empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th, td {
  padding: 10px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

th {
  background: #fafafa;
  color: #333;
  font-weight: 600;
}

td {
  color: #666;
}

.id-cell {
  font-family: monospace;
  color: #1976d2;
}

.text-red {
  color: #f44336;
  font-weight: bold;
}

.text-green {
  color: #4caf50;
  font-weight: bold;
}
</style>
