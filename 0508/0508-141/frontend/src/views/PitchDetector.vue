<template>
  <div class="pitch-detector">
    <h2>音高检测器</h2>

    <div class="instrument-selection">
      <h3>选择古琴和徽位</h3>
      <div class="selection-group">
        <div class="selection-item">
          <label>选择古琴：</label>
          <select v-model="selectedGuqin" @change="loadCurrentHuiData">
            <option :value="null">请选择古琴</option>
            <option v-for="guqin in guqins" :key="guqin.id" :value="guqin">
              {{ guqin.name }} (弦长: {{ guqin.stringLength }}mm)
            </option>
          </select>
        </div>
        <div class="selection-item">
          <label>当前徽位：</label>
          <select v-model="currentHuiNumber">
            <option v-for="hui in 13" :key="hui" :value="hui">
              {{ hui }}徽
            </option>
          </select>
        </div>
        <div class="selection-item">
          <label>散音频率（Hz）：</label>
          <input 
            type="number" 
            v-model.number="baseFrequency"
            placeholder="七徽散音频率"
            step="0.1"
          />
        </div>
      </div>
    </div>

    <div class="detection-section">
      <h3>实时音高检测</h3>
      
      <div class="detection-controls">
        <button 
          @click="startDetection" 
          :disabled="isDetecting"
          :class="{ active: isDetecting }"
        >
          {{ isDetecting ? '检测中...' : '开始录音' }}
        </button>
        <button @click="stopDetection" :disabled="!isDetecting">
          停止录音
        </button>
        <input 
          type="file" 
          ref="fileInput"
          accept="audio/*"
          @change="handleFileUpload"
          style="display: none"
        />
        <button @click="triggerFileUpload">上传音频文件</button>
      </div>

      <div class="current-reading" v-if="currentPitch">
        <div class="signal-indicator" v-if="signalQuality">
          <span class="signal-icon">{{ signalQuality.icon }}</span>
          <span class="signal-label" :style="{ color: signalQuality.color }">
            信号质量: {{ signalQuality.text }}
          </span>
          <span class="signal-confidence" v-if="currentPitch.confidence">
            置信度: {{ (currentPitch.confidence * 100).toFixed(0) }}%
          </span>
        </div>
        
        <div class="frequency-display" v-if="currentPitch.frequency">
          <span class="label">实测频率</span>
          <span class="value">{{ currentPitch.frequency }} Hz</span>
        </div>
        
        <div class="frequency-display no-frequency" v-else>
          <span class="label">状态</span>
          <span class="value warning-text">{{ currentPitch.message || '未检测到有效频率' }}</span>
        </div>
        
        <div class="note-display" v-if="noteInfo && currentPitch.frequency">
          <span class="label">音名</span>
          <span class="value">{{ noteInfo.noteName }}{{ noteInfo.octave }}</span>
          <span class="deviation" :class="{ 
            positive: noteInfo.centDeviation > 0,
            negative: noteInfo.centDeviation < 0
          }">
            {{ noteInfo.centDeviation > 0 ? '+' : '' }}{{ noteInfo.centDeviation }} 音分
          </span>
        </div>
      </div>

      <div class="theoretical-info" v-if="selectedGuqin">
        <div class="info-header">
          <h4>当前徽位理论值</h4>
          <div class="pitch-level-badge" v-if="currentPitch && pitchLevel" :style="{ backgroundColor: pitchLevel.color }">
            {{ pitchLevel.emoji }} {{ pitchLevel.displayName }}
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">徽位：</span>
            <span class="value">{{ currentHuiNumber }}徽</span>
          </div>
          <div class="info-item">
            <span class="label">理论频率：</span>
            <span class="value">{{ theoreticalFrequency.toFixed(2) }} Hz</span>
          </div>
          <div class="info-item">
            <span class="label">音分偏差：</span>
            <span 
              class="value deviation" 
              :style="{ color: pitchLevel ? pitchLevel.color : '#718096' }"
              v-if="currentPitch"
            >
              {{ currentCentDeviation > 0 ? '+' : '' }}{{ currentCentDeviation.toFixed(2) }} 音分
            </span>
            <span class="value" v-else>-</span>
          </div>
        </div>
        <div class="pitch-level-description" v-if="currentPitch && pitchLevel">
          <p>{{ pitchLevel.description }}</p>
        </div>
        <div class="tuning-advice" v-if="tuningAdvice && currentPitch && currentPitch.frequency">
          <div class="advice-header">
            <span class="advice-icon">💡</span>
            <h4>调音建议</h4>
          </div>
          <div class="advice-content">
            <p class="advice-text">{{ tuningAdvice }}</p>
            <div class="advice-tips" v-if="adviceDetail && adviceDetail.tips.length > 0">
              <div class="tip-item" v-for="(tip, index) in adviceDetail.tips.slice(0, 2)" :key="index">
                <span class="tip-bullet">◆</span>
                <span>{{ tip }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons" v-if="currentPitch">
        <button @click="recordHuiData" class="primary">
          记录当前徽位数据
        </button>
        <button @click="saveCompleteRecord" class="success" :disabled="huiDataList.length === 0">
          保存完整记录 ({{ huiDataList.length }}/13)
        </button>
      </div>
    </div>

    <div class="recorded-data" v-if="huiDataList.length > 0">
      <h3>已记录的徽位数据</h3>
      <table>
        <thead>
          <tr>
            <th>徽位</th>
            <th>理论频率 (Hz)</th>
            <th>实测频率 (Hz)</th>
            <th>音分偏差</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="data in huiDataList" :key="data.huiNumber">
            <td>{{ data.huiNumber }}徽</td>
            <td>{{ data.theoreticalFrequency.toFixed(2) }}</td>
            <td>{{ data.measuredFrequency.toFixed(2) }}</td>
            <td :class="{
              good: Math.abs(data.centDeviation) < 5,
              warning: Math.abs(data.centDeviation) >= 5 && Math.abs(data.centDeviation) < 15,
              danger: Math.abs(data.centDeviation) >= 15
            }">
              {{ data.centDeviation > 0 ? '+' : '' }}{{ data.centDeviation.toFixed(2) }}
            </td>
            <td>
              <button @click="removeHuiData(data.huiNumber)" class="danger-btn">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="history-records" v-if="selectedGuqin">
      <h3>历史调音记录</h3>
      <div v-if="historyRecords.length === 0" class="no-data">暂无历史记录</div>
      <div v-else class="record-list">
        <div v-for="record in historyRecords" :key="record.id" class="record-item">
          <div class="record-info">
            <span class="record-time">{{ formatDate(record.recordTime) }}</span>
            <span class="record-notes" v-if="record.notes">{{ record.notes }}</span>
          </div>
          <button @click="viewRecordDetail(record.id)" class="view-btn">查看详情</button>
        </div>
      </div>
    </div>

    <div v-if="recordDetail" class="modal-overlay" @click.self="recordDetail = null">
      <div class="modal">
        <div class="modal-header">
          <h3>调音记录详情</h3>
          <button @click="recordDetail = null" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <table>
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
                <td :class="{
                  good: Math.abs(detail.centDeviation) < 5,
                  warning: Math.abs(detail.centDeviation) >= 5 && Math.abs(detail.centDeviation) < 15,
                  danger: Math.abs(detail.centDeviation) >= 15
                }">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { guqinApi, tuningRecordApi } from '../api'
import { pitchDetector, frequencyToNoteName, getSignalQualityDescription } from '../utils/pitchDetector'
import { 
  calculateTheoreticalFrequency, 
  calculateCentDeviation, 
  generateTuningAdvice,
  generateTuningAdviceDetail,
  getPitchLevelDescription
} from '../utils/huiPositionCalculator'

const guqins = ref([])
const selectedGuqin = ref(null)
const currentHuiNumber = ref(7)
const baseFrequency = ref(220)
const isDetecting = ref(false)
const currentPitch = ref(null)
const noteInfo = ref(null)
const detectionInterval = ref(null)
const huiDataList = ref([])
const historyRecords = ref([])
const recordDetail = ref(null)
const fileInput = ref(null)

const signalQuality = computed(() => {
  if (!currentPitch.value) return null
  return getSignalQualityDescription(currentPitch.value.signalQuality)
})

const theoreticalFrequency = computed(() => {
  return calculateTheoreticalFrequency(baseFrequency.value, currentHuiNumber.value) || 0
})

const currentCentDeviation = computed(() => {
  if (!currentPitch.value) return 0
  return calculateCentDeviation(currentPitch.value.frequency, theoreticalFrequency.value)
})

const pitchLevel = computed(() => {
  if (!currentPitch.value || !currentPitch.value.frequency) return null
  return getPitchLevelDescription(currentCentDeviation.value)
})

const tuningAdvice = computed(() => {
  if (!currentPitch.value || !currentPitch.value.frequency) return null
  return generateTuningAdvice(currentCentDeviation.value, currentHuiNumber.value)
})

const adviceDetail = computed(() => {
  if (!currentPitch.value || !currentPitch.value.frequency) return null
  return generateTuningAdviceDetail(currentCentDeviation.value, currentHuiNumber.value)
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

const loadCurrentHuiData = async () => {
  huiDataList.value = []
  historyRecords.value = []
  
  if (selectedGuqin.value) {
    try {
      const response = await tuningRecordApi.getByGuqinId(selectedGuqin.value.id)
      if (response.success) {
        historyRecords.value = response.data
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  }
}

const startDetection = async () => {
  try {
    await pitchDetector.startRecording()
    isDetecting.value = true
    
    detectionInterval.value = setInterval(() => {
      const pitch = pitchDetector.detectPitch()
      if (pitch) {
        currentPitch.value = pitch
        noteInfo.value = frequencyToNoteName(pitch.frequency)
      }
    }, 100)
  } catch (error) {
    console.error('开始录音失败:', error)
    alert('无法访问麦克风，请检查权限设置')
  }
}

const stopDetection = () => {
  pitchDetector.stopRecording()
  isDetecting.value = false
  if (detectionInterval.value) {
    clearInterval(detectionInterval.value)
    detectionInterval.value = null
  }
}

const triggerFileUpload = () => {
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    const result = await pitchDetector.detectPitchFromFile(file)
    if (result && result.frequency) {
      currentPitch.value = { frequency: result.frequency, rms: 0 }
      noteInfo.value = frequencyToNoteName(result.frequency)
    } else {
      alert('无法检测到有效音高')
    }
  } catch (error) {
    console.error('分析音频文件失败:', error)
    alert('分析音频文件失败')
  }
  
  event.target.value = ''
}

const recordHuiData = () => {
  if (!currentPitch.value || !selectedGuqin.value) return
  
  const existingIndex = huiDataList.value.findIndex(d => d.huiNumber === currentHuiNumber.value)
  const data = {
    huiNumber: currentHuiNumber.value,
    theoreticalFrequency: theoreticalFrequency.value,
    measuredFrequency: currentPitch.value.frequency,
    centDeviation: currentCentDeviation.value
  }
  
  if (existingIndex >= 0) {
    huiDataList.value[existingIndex] = data
  } else {
    huiDataList.value.push(data)
  }
  
  huiDataList.value.sort((a, b) => a.huiNumber - b.huiNumber)
}

const removeHuiData = (huiNumber) => {
  huiDataList.value = huiDataList.value.filter(d => d.huiNumber !== huiNumber)
}

const saveCompleteRecord = async () => {
  if (!selectedGuqin.value || huiDataList.value.length === 0) return
  
  try {
    const notes = prompt('请输入备注（可选）：', '')
    const response = await tuningRecordApi.create({
      guqinId: selectedGuqin.value.id,
      notes: notes || null,
      huiDetails: huiDataList.value.map(d => ({
        ...d,
        theoreticalFrequency: d.theoreticalFrequency.toFixed(4),
        measuredFrequency: d.measuredFrequency.toFixed(4),
        centDeviation: d.centDeviation.toFixed(4)
      }))
    })
    
    if (response.success) {
      alert('保存成功！')
      huiDataList.value = []
      await loadCurrentHuiData()
    } else {
      alert('保存失败: ' + response.message)
    }
  } catch (error) {
    console.error('保存记录失败:', error)
    alert('保存失败')
  }
}

const viewRecordDetail = async (recordId) => {
  try {
    const response = await tuningRecordApi.getById(recordId)
    if (response.success) {
      recordDetail.value = response.data
    }
  } catch (error) {
    console.error('加载记录详情失败:', error)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadGuqins()
})

onUnmounted(() => {
  stopDetection()
})
</script>

<style scoped>
.pitch-detector {
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
  margin: 1.5rem 0 1rem;
  font-size: 1.2rem;
}

h4 {
  color: #4a5568;
  margin: 1rem 0 0.5rem;
  font-size: 1rem;
}

.instrument-selection {
  background: #f7fafc;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.selection-group {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.selection-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selection-item label {
  font-weight: 500;
  color: #4a5568;
  font-size: 0.9rem;
}

.selection-item select,
.selection-item input {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  min-width: 180px;
}

.detection-section {
  margin-bottom: 2rem;
}

.detection-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.detection-controls button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: #e2e8f0;
  color: #4a5568;
}

.detection-controls button:hover:not(:disabled) {
  background: #cbd5e0;
}

.detection-controls button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.detection-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-reading {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  color: white;
}

.signal-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
}

.signal-icon {
  font-size: 1.5rem;
}

.signal-label {
  font-weight: bold;
  font-size: 1.1rem;
}

.signal-confidence {
  margin-left: auto;
  font-size: 0.95rem;
  opacity: 0.9;
}

.frequency-display,
.note-display {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 1rem;
}

.frequency-display .label,
.note-display .label {
  font-size: 1rem;
  opacity: 0.8;
}

.frequency-display .value {
  font-size: 2.5rem;
  font-weight: bold;
}

.frequency-display.no-frequency .value {
  font-size: 1.2rem;
  font-weight: normal;
  opacity: 0.9;
}

.frequency-display.no-frequency .value.warning-text {
  color: #ffd700;
}

.note-display .value {
  font-size: 2rem;
  font-weight: bold;
}

.note-display .deviation {
  font-size: 1.2rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
}

.note-display .deviation.positive {
  background: rgba(72, 187, 120, 0.8);
}

.note-display .deviation.negative {
  background: rgba(245, 101, 101, 0.8);
}

.theoretical-info {
  background: #f7fafc;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.info-header h4 {
  margin: 0;
}

.pitch-level-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
}

.info-item .label {
  font-weight: 500;
  color: #4a5568;
}

.info-item .value {
  font-weight: bold;
  color: #667eea;
}

.info-item .value.deviation.good {
  color: #48bb78;
}

.info-item .value.deviation.warning {
  color: #ed8936;
}

.info-item .value.deviation.danger {
  color: #f56565;
}

.pitch-level-description {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 6px;
}

.pitch-level-description p {
  margin: 0;
  color: #4a5568;
  font-size: 0.95rem;
  line-height: 1.5;
}

.tuning-advice {
  margin-top: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #ffffff 0%, #f7fafc 100%);
  border-left: 4px solid #4299e1;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.advice-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.advice-header h4 {
  margin: 0;
  color: #2b6cb0;
}

.advice-icon {
  font-size: 1.25rem;
}

.advice-content {
}

.advice-text {
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-weight: 500;
  line-height: 1.6;
  font-size: 1rem;
}

.advice-tips {
  margin-top: 0.75rem;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.4rem 0;
  color: #4a5568;
  font-size: 0.9rem;
}

.tip-bullet {
  color: #4299e1;
  font-size: 0.75rem;
  margin-top: 0.2rem;
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.action-buttons button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-buttons button.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-buttons button.success {
  background: #48bb78;
  color: white;
}

.action-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

tbody tr:hover {
  background: #f7fafc;
}

td.good {
  color: #48bb78;
  font-weight: bold;
}

td.warning {
  color: #ed8936;
  font-weight: bold;
}

td.danger {
  color: #f56565;
  font-weight: bold;
}

button.danger-btn {
  padding: 0.5rem 1rem;
  background: #f56565;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button.view-btn {
  padding: 0.5rem 1rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.history-records {
  margin-top: 2rem;
}

.no-data {
  color: #718096;
  font-style: italic;
  padding: 1rem;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.record-time {
  font-weight: 500;
  color: #4a5568;
}

.record-notes {
  font-size: 0.9rem;
  color: #718096;
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
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
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
</style>
