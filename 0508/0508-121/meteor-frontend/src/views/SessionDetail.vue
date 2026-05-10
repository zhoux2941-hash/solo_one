<template>
  <div class="session-detail" v-if="sessionDetail">
    <div class="header-card card">
      <div>
        <h1>🔭 {{ sessionDetail.session.meteorShowerName }}</h1>
        <div class="session-meta">
          <span><strong>地点：</strong>{{ sessionDetail.session.location }}</span>
          <span v-if="sessionDetail.session.userName"><strong>观测者：</strong>{{ sessionDetail.session.userName }}</span>
          <span><strong>状态：</strong>
            <span :class="['badge', sessionDetail.session.status === 'ACTIVE' ? 'badge-success' : 'badge-info']">
              {{ sessionDetail.session.status === 'ACTIVE' ? '进行中' : '已结束' }}
            </span>
          </span>
        </div>
        <div class="session-times">
          <span><strong>开始时间：</strong>{{ formatDate(sessionDetail.session.startTime) }}</span>
          <span v-if="sessionDetail.session.endTime">
            <strong>结束时间：</strong>{{ formatDate(sessionDetail.session.endTime) }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="$router.back()">← 返回</button>
        <button v-if="sessionDetail.session.status === 'ACTIVE'" 
                class="btn btn-danger" @click="endSession">
          ⏹ 结束观测
        </button>
      </div>
    </div>

    <div v-if="sessionDetail.radiantPoint" class="radiant-card card">
      <h2>🌟 计算出的辐射点</h2>
      <div class="radiant-info">
        <div class="radiant-stat">
          <span class="stat-label">星座</span>
          <span class="stat-value big">{{ sessionDetail.radiantPoint.constellation }}</span>
        </div>
        <div class="radiant-stat">
          <span class="stat-label">赤经 (RA)</span>
          <span class="stat-value">{{ sessionDetail.radiantPoint.ra?.toFixed(2) }}°</span>
        </div>
        <div class="radiant-stat">
          <span class="stat-label">赤纬 (Dec)</span>
          <span class="stat-value">{{ sessionDetail.radiantPoint.dec?.toFixed(2) }}°</span>
        </div>
        <div class="radiant-stat">
          <span class="stat-label">置信度</span>
          <span class="stat-value">{{ (sessionDetail.radiantPoint.confidence * 100).toFixed(1) }}%</span>
        </div>
        <div class="radiant-stat">
          <span class="stat-label">有效记录数</span>
          <span class="stat-value">{{ sessionDetail.radiantPoint.recordCount }}</span>
        </div>
      </div>
    </div>

    <div v-else class="card">
      <h2>📊 辐射点计算状态</h2>
      <p v-if="sessionDetail.records.length < 3" class="warning-text">
        ⚠️ 需要至少记录 <strong>3 颗</strong> 流星的轨迹才能计算辐射点
      </p>
      <p v-else class="warning-text">
        ⚠️ 已有 {{ sessionDetail.records.length }} 条记录，但部分记录缺少轨迹坐标
      </p>
      <p class="note">
        流星轨迹坐标包括：起点 RA/Dec 和 终点 RA/Dec
      </p>
    </div>

    <div v-if="sessionDetail.zhrResult && sessionDetail.zhrResult.meteorCount > 0" class="zhr-card card">
      <h2>☄️ ZHR（天顶每小时出现率）估算</h2>
      
      <div class="zhr-main">
        <div class="zhr-value-section">
          <div class="zhr-label">计算 ZHR</div>
          <div class="zhr-value">{{ sessionDetail.zhrResult.zhr?.toFixed(0) }}</div>
          <div class="zhr-confidence">
            置信度: {{ (sessionDetail.zhrResult.confidence * 100).toFixed(0) }}%
          </div>
        </div>
        
        <div v-if="sessionDetail.predictedZHR" class="zhr-comparison">
          <div class="comparison-label">与预报值对比</div>
          <div class="comparison-values">
            <div class="comparison-item">
              <span class="comparison-title">预报 ZHR</span>
              <span class="comparison-value predicted">{{ sessionDetail.predictedZHR }}</span>
            </div>
            <div class="comparison-arrow">→</div>
            <div class="comparison-item">
              <span class="comparison-title">实际 ZHR</span>
              <span class="comparison-value actual">{{ sessionDetail.zhrResult.zhr?.toFixed(0) }}</span>
            </div>
            <div class="comparison-percent">
              <span :class="getComparisonClass(sessionDetail.zhrComparison)">
                {{ formatComparison(sessionDetail.zhrComparison) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="zhr-breakdown">
        <div class="breakdown-title">📋 计算细节</div>
        <div class="breakdown-grid">
          <div class="breakdown-item">
            <span class="bd-label">观测流星数</span>
            <span class="bd-value">{{ sessionDetail.zhrResult.meteorCount }}</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">观测时长</span>
            <span class="bd-value">{{ sessionDetail.zhrResult.durationHours?.toFixed(1) }} 小时</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">原始出现率</span>
            <span class="bd-value">{{ sessionDetail.zhrResult.rawRate?.toFixed(1) }} / 小时</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">云层修正</span>
            <span class="bd-value">× {{ sessionDetail.zhrResult.cloudCorrection?.toFixed(2) }}</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">极限星等修正</span>
            <span class="bd-value">× {{ sessionDetail.zhrResult.lmCorrection?.toFixed(2) }}</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">天顶修正</span>
            <span class="bd-value">× {{ sessionDetail.zhrResult.zenithCorrection?.toFixed(2) }}</span>
          </div>
        </div>
        <p class="zhr-notes" v-if="sessionDetail.zhrResult.notes">
          💡 {{ sessionDetail.zhrResult.notes }}
        </p>
      </div>
    </div>

    <div class="starmap-section card">
      <h2>🌌 星图可视化</h2>
      <StarMap 
        :records="sessionDetail.records"
        :radiantPoint="sessionDetail.radiantPoint"
        :showExtended="showExtended" />
      <div class="starmap-controls">
        <label>
          <input type="checkbox" v-model="showExtended" />
          显示延长线（用于寻找辐射点）
        </label>
      </div>
    </div>

    <div class="records-section card">
      <h2>✨ 流星记录 ({{ sessionDetail.records.length }})</h2>
      <div v-if="sessionDetail.records.length" class="records-table-container">
        <table class="records-table">
          <thead>
            <tr>
              <th>#</th>
              <th>星座</th>
              <th>亮度</th>
              <th>颜色</th>
              <th>轨迹起点</th>
              <th>轨迹终点</th>
              <th>观测时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in sessionDetail.records" :key="r.id">
              <td>{{ i + 1 }}</td>
              <td>{{ r.constellation }}</td>
              <td>
                <span v-if="r.brightness != null">
                  {{ r.brightness >= 0 ? '+' : '' }}{{ r.brightness }}等
                </span>
                <span v-else>-</span>
              </td>
              <td>{{ r.color || '-' }}</td>
              <td>
                <span v-if="r.trajectoryStartRA != null">
                  {{ r.trajectoryStartRA?.toFixed(1) }}° / {{ r.trajectoryStartDec?.toFixed(1) }}°
                </span>
                <span v-else class="missing">-</span>
              </td>
              <td>
                <span v-if="r.trajectoryEndRA != null">
                  {{ r.trajectoryEndRA?.toFixed(1) }}° / {{ r.trajectoryEndDec?.toFixed(1) }}°
                </span>
                <span v-else class="missing">-</span>
              </td>
              <td>{{ formatTime(r.observedTime) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">暂无流星记录</p>
    </div>
  </div>

  <div v-else class="loading">
    <p>⏳ 加载中...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sessionAPI } from '../api'
import StarMap from '../components/StarMap.vue'

const route = useRoute()
const router = useRouter()

const sessionDetail = ref(null)
const showExtended = ref(true)

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const formatComparison = (percent) => {
  if (percent == null) return ''
  if (percent >= 100) {
    return `+${(percent - 100).toFixed(0)}% (高于预报)`
  } else {
    return `-${(100 - percent).toFixed(0)}% (低于预报)`
  }
}

const getComparisonClass = (percent) => {
  if (percent == null) return ''
  if (percent >= 90 && percent <= 110) return 'comparison-normal'
  if (percent > 110) return 'comparison-high'
  return 'comparison-low'
}

const endSession = async () => {
  if (!confirm('确定要结束本次观测吗？')) return
  try {
    await sessionAPI.end(route.params.id)
    loadData()
  } catch (error) {
    alert('结束失败：' + (error.response?.data?.error || error.message))
  }
}

const loadData = async () => {
  try {
    const res = await sessionAPI.getDetail(route.params.id)
    sessionDetail.value = res.data
  } catch (error) {
    console.error('加载失败:', error)
  }
}

onMounted(loadData)
</script>

<style scoped>
.session-detail {
  padding-bottom: 2rem;
}

.header-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.header-card h1 {
  margin-bottom: 0.5rem;
}

.session-meta, .session-times {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 0.5rem;
  color: #a0aec0;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.radiant-card {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
  border-color: rgba(239, 68, 68, 0.3);
  margin-bottom: 1.5rem;
}

.radiant-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.radiant-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  color: #718096;
  font-size: 0.875rem;
}

.stat-value {
  color: #e2e8f0;
  font-size: 1.25rem;
  font-weight: 600;
}

.stat-value.big {
  font-size: 1.5rem;
  color: #f87171;
}

.warning-text {
  color: #facc15;
  margin: 0.5rem 0;
}

.note {
  color: #718096;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.starmap-section {
  margin-bottom: 1.5rem;
}

.starmap-section h2 {
  margin-bottom: 1rem;
}

.starmap-controls {
  margin-top: 1rem;
  color: #a0aec0;
}

.starmap-controls label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.records-section h2 {
  margin-bottom: 1rem;
}

.records-table-container {
  overflow-x: auto;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.records-table th, .records-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #2a2a5a;
}

.records-table th {
  background: rgba(124, 58, 237, 0.1);
  color: #a78bfa;
  font-weight: 600;
}

.records-table td {
  color: #cbd5e0;
}

.records-table tr:hover td {
  background: rgba(124, 58, 237, 0.05);
}

.missing {
  color: #718096;
  font-style: italic;
}

.loading, .empty {
  text-align: center;
  color: #718096;
  padding: 3rem;
}

.zhr-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
  border-color: rgba(59, 130, 246, 0.3);
  margin-bottom: 1.5rem;
}

.zhr-main {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.zhr-value-section {
  text-align: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.zhr-label {
  color: #718096;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.zhr-value {
  font-size: 4rem;
  font-weight: bold;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.zhr-confidence {
  color: #a0aec0;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.zhr-comparison {
  flex: 1;
  min-width: 280px;
}

.comparison-label {
  color: #a0aec0;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.comparison-values {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.comparison-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1.25rem;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.comparison-title {
  font-size: 0.75rem;
  color: #718096;
}

.comparison-value {
  font-size: 1.5rem;
  font-weight: 600;
}

.comparison-value.predicted {
  color: #a78bfa;
}

.comparison-value.actual {
  color: #60a5fa;
}

.comparison-arrow {
  font-size: 1.5rem;
  color: #718096;
}

.comparison-percent {
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.2);
}

.comparison-normal {
  color: #4ade80;
}

.comparison-high {
  color: #f87171;
}

.comparison-low {
  color: #60a5fa;
}

.zhr-breakdown {
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.breakdown-title {
  color: #e2e8f0;
  font-weight: 600;
  margin-bottom: 1rem;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.bd-label {
  font-size: 0.75rem;
  color: #718096;
}

.bd-value {
  font-weight: 600;
  color: #e2e8f0;
}

.zhr-notes {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  color: #a0aec0;
  font-size: 0.875rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .header-card {
    flex-direction: column;
  }
  
  .session-meta, .session-times {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .zhr-main {
    flex-direction: column;
  }
  
  .comparison-values {
    justify-content: center;
  }
}
</style>
