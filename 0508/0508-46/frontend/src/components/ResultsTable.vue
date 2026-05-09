<template>
  <div class="results-table">
    <h3>模拟结果</h3>
    <div class="simulation-id">
      <span>模拟ID: {{ simulationId || '暂无' }}</span>
    </div>
    <div v-if="!safeResults || safeResults.length === 0" class="empty-data">
      <p>暂无模拟结果数据</p>
    </div>
    <table v-else>
      <thead>
        <tr>
          <th>姓名</th>
          <th>年龄</th>
          <th>是否中途离开</th>
          <th>游玩次数</th>
          <th>总等待时间 (秒)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(result, index) in safeResults" :key="index">
          <td>{{ result.name || '未知' }}</td>
          <td>{{ (result.age || 0) }}岁</td>
          <td>
            <span :class="result.leftEarly ? 'status-left' : 'status-stay'">
              {{ result.leftEarly ? '是' : '否' }}
            </span>
          </td>
          <td>{{ (result.playsCount || 0) }}次</td>
          <td>{{ (result.totalWaitTime || 0) }}秒</td>
        </tr>
      </tbody>
    </table>
    <div class="summary" v-if="safeResults && safeResults.length > 0">
      <div class="summary-item">
        <span class="label">总游玩次数:</span>
        <span class="value">{{ totalPlays }}次</span>
      </div>
      <div class="summary-item">
        <span class="label">中途离开人数:</span>
        <span class="value" :class="{ 'text-red': leftEarlyCount > 0 }">
          {{ leftEarlyCount }}人
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResultsTable',
  props: {
    simulationId: {
      type: String,
      default: ''
    },
    results: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    safeResults() {
      return (this.results || []).filter(r => r && r.name)
    },
    totalPlays() {
      return this.safeResults.reduce((sum, r) => sum + (r.playsCount || 0), 0)
    },
    leftEarlyCount() {
      return this.safeResults.filter(r => r.leftEarly).length
    }
  }
}
</script>

<style scoped>
.results-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.results-table h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.empty-data {
  text-align: center;
  padding: 40px;
  color: #999;
}

.simulation-id {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

th, td {
  padding: 12px;
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

.status-left {
  color: #f44336;
  font-weight: bold;
}

.status-stay {
  color: #4caf50;
  font-weight: bold;
}

.summary {
  display: flex;
  gap: 30px;
  justify-content: center;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-item .label {
  color: #999;
  font-size: 12px;
  margin-bottom: 4px;
}

.summary-item .value {
  color: #333;
  font-size: 20px;
  font-weight: bold;
}

.summary-item .value.text-red {
  color: #f44336;
}
</style>
