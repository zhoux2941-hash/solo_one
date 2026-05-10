<template>
  <div class="tuning-records">
    <h2>古琴管理与音准记录</h2>

    <div class="guqin-management">
      <div class="section-header">
        <h3>古琴列表</h3>
        <button @click="showAddModal = true" class="add-btn">
          + 添加新琴
        </button>
      </div>

      <div class="guqin-grid">
        <div v-for="guqin in guqins" :key="guqin.id" class="guqin-card">
          <div class="guqin-header">
            <h4>{{ guqin.name }}</h4>
            <div class="actions">
              <button @click="editGuqin(guqin)" class="edit-btn">编辑</button>
              <button @click="deleteGuqin(guqin.id)" class="delete-btn">删除</button>
            </div>
          </div>
          <div class="guqin-info">
            <p><strong>有效弦长：</strong>{{ guqin.stringLength }} mm</p>
            <p><strong>描述：</strong>{{ guqin.description || '暂无描述' }}</p>
            <p><strong>创建时间：</strong>{{ formatDate(guqin.createdAt) }}</p>
          </div>
          <div class="guqin-actions">
            <button @click="viewRecords(guqin.id)" class="view-records-btn">
              查看调音记录
            </button>
          </div>
        </div>

        <div v-if="guqins.length === 0" class="empty-state">
          <p>暂无古琴数据，请添加一张古琴开始使用</p>
        </div>
      </div>
    </div>

    <div class="records-section" v-if="selectedGuqinId">
      <div class="section-header">
        <h3>调音记录</h3>
        <button @click="selectedGuqinId = null" class="back-btn">
          返回古琴列表
        </button>
      </div>

      <div class="records-list">
        <div v-for="record in records" :key="record.id" class="record-card">
          <div class="record-header">
            <h4>{{ formatDate(record.recordTime) }}</h4>
            <button @click="deleteRecord(record.id)" class="delete-btn">删除</button>
          </div>
          <div class="record-info">
            <p v-if="record.notes"><strong>备注：</strong>{{ record.notes }}</p>
            <p><strong>记录时间：</strong>{{ formatDate(record.createdAt) }}</p>
          </div>
          <button @click="viewRecordDetail(record.id)" class="view-detail-btn">
            查看详细偏差曲线
          </button>
        </div>

        <div v-if="records.length === 0" class="empty-state">
          <p>该琴暂无调音记录</p>
        </div>
      </div>
    </div>

    <!-- 添加/编辑古琴弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingGuqin ? '编辑古琴' : '添加新琴' }}</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveGuqin">
            <div class="form-group">
              <label for="guqinName">琴名 *</label>
              <input 
                type="text" 
                id="guqinName" 
                v-model="guqinForm.name"
                placeholder="例如：九霄环佩"
                required
              />
            </div>
            <div class="form-group">
              <label for="stringLength">有效弦长（mm）*</label>
              <input 
                type="number" 
                id="stringLength" 
                v-model.number="guqinForm.stringLength"
                placeholder="例如：1080"
                step="0.1"
                min="100"
                required
              />
            </div>
            <div class="form-group">
              <label for="description">描述</label>
              <textarea 
                id="description" 
                v-model="guqinForm.description"
                placeholder="可选：琴的材质、年代、特点等"
                rows="3"
              ></textarea>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeModal" class="cancel-btn">取消</button>
              <button type="submit" class="submit-btn">保存</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 记录详情弹窗 -->
    <div v-if="recordDetail" class="modal-overlay" @click.self="recordDetail = null">
      <div class="modal detail-modal">
        <div class="modal-header">
          <h3>音准偏差曲线详情</h3>
          <button @click="recordDetail = null" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="chart-container" ref="chartRef"></div>
          <div class="stats-summary">
            <div class="stat-item">
              <span class="stat-label">平均偏差</span>
              <span class="stat-value" :class="getDeviationClass(averageDeviation)">
                {{ averageDeviation > 0 ? '+' : '' }}{{ averageDeviation.toFixed(2) }} 音分
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大偏差</span>
              <span class="stat-value" :class="getDeviationClass(maxDeviation)">
                {{ maxDeviation > 0 ? '+' : '' }}{{ maxDeviation.toFixed(2) }} 音分
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最小偏差</span>
              <span class="stat-value" :class="getDeviationClass(minDeviation)">
                {{ minDeviation > 0 ? '+' : '' }}{{ minDeviation.toFixed(2) }} 音分
              </span>
            </div>
          </div>
          <table class="detail-table">
            <thead>
              <tr>
                <th>徽位</th>
                <th>理论频率 (Hz)</th>
                <th>实测频率 (Hz)</th>
                <th>音分偏差</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="detail in recordDetail.details" :key="detail.huiNumber">
                <td>{{ detail.huiNumber }}徽</td>
                <td>{{ detail.theoreticalFrequency }}</td>
                <td>{{ detail.measuredFrequency }}</td>
                <td :class="getDeviationClass(detail.centDeviation)">
                  {{ detail.centDeviation > 0 ? '+' : '' }}{{ detail.centDeviation }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { guqinApi, tuningRecordApi } from '../api'

const guqins = ref([])
const selectedGuqinId = ref(null)
const records = ref([])
const recordDetail = ref(null)
const showAddModal = ref(false)
const editingGuqin = ref(null)
const guqinForm = ref({
  name: '',
  stringLength: 1080,
  description: ''
})
const chartRef = ref(null)
let chartInstance = null

const averageDeviation = computed(() => {
  if (!recordDetail.value || !recordDetail.value.details) return 0
  const details = recordDetail.value.details
  const sum = details.reduce((acc, d) => acc + parseFloat(d.centDeviation), 0)
  return sum / details.length
})

const maxDeviation = computed(() => {
  if (!recordDetail.value || !recordDetail.value.details) return 0
  return Math.max(...recordDetail.value.details.map(d => parseFloat(d.centDeviation)))
})

const minDeviation = computed(() => {
  if (!recordDetail.value || !recordDetail.value.details) return 0
  return Math.min(...recordDetail.value.details.map(d => parseFloat(d.centDeviation)))
})

const loadGuqins = async () => {
  try {
    const response = await guqinApi.getList()
    if (response.success) {
      guqins.value = response.data
    }
  } catch (error) {
    console.error('加载古琴列表失败:', error)
  }
}

const viewRecords = async (guqinId) => {
  selectedGuqinId.value = guqinId
  try {
    const response = await tuningRecordApi.getByGuqinId(guqinId)
    if (response.success) {
      records.value = response.data
    }
  } catch (error) {
    console.error('加载记录失败:', error)
  }
}

const viewRecordDetail = async (recordId) => {
  try {
    const response = await tuningRecordApi.getById(recordId)
    if (response.success) {
      recordDetail.value = response.data
      await nextTick()
      initChart()
    }
  } catch (error) {
    console.error('加载记录详情失败:', error)
  }
}

const initChart = () => {
  if (!chartRef.value || !recordDetail.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  
  const details = recordDetail.value.details.sort((a, b) => a.huiNumber - b.huiNumber)
  
  const option = {
    title: {
      text: '音准偏差曲线',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: details.map(d => d.huiNumber + '徽'),
      name: '徽位'
    },
    yAxis: {
      type: 'value',
      name: '音分偏差',
      min: value => Math.min(value.min, -50),
      max: value => Math.max(value.max, 50)
    },
    series: [{
      data: details.map(d => parseFloat(d.centDeviation)),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(102, 126, 234, 0.5)' },
          { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
        ])
      },
      lineStyle: {
        color: '#667eea',
        width: 2
      },
      markLine: {
        data: [{ yAxis: 0, lineStyle: { color: '#48bb78', type: 'dashed' } }]
      }
    }]
  }
  
  chartInstance.setOption(option)
  
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

const editGuqin = (guqin) => {
  editingGuqin.value = guqin
  guqinForm.value = {
    name: guqin.name,
    stringLength: parseFloat(guqin.stringLength),
    description: guqin.description || ''
  }
  showAddModal.value = true
}

const deleteGuqin = async (id) => {
  if (!confirm('确定要删除这张琴吗？所有相关的调音记录也会被删除。')) return
  
  try {
    const response = await guqinApi.delete(id)
    if (response.success) {
      await loadGuqins()
      if (selectedGuqinId.value === id) {
        selectedGuqinId.value = null
        records.value = []
      }
    }
  } catch (error) {
    console.error('删除古琴失败:', error)
  }
}

const deleteRecord = async (id) => {
  if (!confirm('确定要删除这条记录吗？')) return
  
  try {
    const response = await tuningRecordApi.delete(id)
    if (response.success) {
      await viewRecords(selectedGuqinId.value)
    }
  } catch (error) {
    console.error('删除记录失败:', error)
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingGuqin.value = null
  guqinForm.value = {
    name: '',
    stringLength: 1080,
    description: ''
  }
}

const saveGuqin = async () => {
  try {
    if (editingGuqin.value) {
      const response = await guqinApi.update(editingGuqin.value.id, guqinForm.value)
      if (response.success) {
        await loadGuqins()
        closeModal()
      }
    } else {
      const response = await guqinApi.create(guqinForm.value)
      if (response.success) {
        await loadGuqins()
        closeModal()
      }
    }
  } catch (error) {
    console.error('保存古琴失败:', error)
  }
}

const getDeviationClass = (deviation) => {
  const val = parseFloat(deviation)
  if (Math.abs(val) < 5) return 'good'
  if (Math.abs(val) < 15) return 'warning'
  return 'danger'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

watch(recordDetail, (newVal) => {
  if (!newVal && chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

onMounted(() => {
  loadGuqins()
})
</script>

<style scoped>
.tuning-records {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #667eea;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

h3 {
  color: #4a5568;
  margin: 0;
  font-size: 1.2rem;
}

h4 {
  color: #4a5568;
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.add-btn, .add-guqin-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.guqin-management, .records-section {
  margin-bottom: 2rem;
}

.guqin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.guqin-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.guqin-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.guqin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn {
  padding: 0.25rem 0.75rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.delete-btn {
  padding: 0.25rem 0.75rem;
  background: #f56565;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.guqin-info {
  margin-bottom: 1rem;
}

.guqin-info p {
  margin: 0.5rem 0;
  color: #4a5568;
  font-size: 0.9rem;
}

.guqin-actions {
  display: flex;
  gap: 0.5rem;
}

.view-records-btn {
  flex: 1;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.view-records-btn:hover {
  background: #5a67d8;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #718096;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.record-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.record-info p {
  margin: 0.25rem 0;
  color: #718096;
  font-size: 0.9rem;
}

.view-detail-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal.detail-modal {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #718096;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.chart-container {
  height: 300px;
  margin-bottom: 1.5rem;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: #718096;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
}

.stat-value.good {
  color: #48bb78;
}

.stat-value.warning {
  color: #ed8936;
}

.stat-value.danger {
  color: #f56565;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem;
  text-align: left;
}

.detail-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.detail-table td.good {
  color: #48bb78;
  font-weight: bold;
}

.detail-table td.warning {
  color: #ed8936;
  font-weight: bold;
}

.detail-table td.danger {
  color: #f56565;
  font-weight: bold;
}
</style>
