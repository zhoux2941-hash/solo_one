<template>
  <div>
    <div class="grid-2 mb-4">
      <div v-if="result" class="card">
        <div class="card-title">
          📋 分配结果
          <span v-if="result.batchId" class="text-sm" style="color: #6b7280; font-weight: normal;">
            (批次: {{ result.batchId.substring(0, 8) }}...)
          </span>
        </div>

        <div :class="['alert', result.success ? 'alert-success' : 'alert-error']">
          {{ result.message }}
        </div>

        <div class="summary grid" style="grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0;">
          <div class="summary-item">
            <div class="summary-label">输入包裹</div>
            <div class="summary-value">{{ result.parcels.length }} 件</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">分配成功</div>
            <div class="summary-value success">
              {{ result.parcels.filter(p => p.allocated).length }} 件
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">总体积</div>
            <div class="summary-value">{{ result.totalVolumeM3.toFixed(4) }} m³</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">利用率</div>
            <div class="summary-value" :style="{ color: getColor(result.utilizationRate) }">
              {{ (result.utilizationRate * 100).toFixed(2) }}%
            </div>
          </div>
        </div>

        <div v-if="result.unallocatedParcels && result.unallocatedParcels.length > 0">
          <h4 style="margin-bottom: 12px; color: #374151;">未分配包裹</h4>
          <div class="unallocated-list">
            <span 
              v-for="p in result.unallocatedParcels" 
              :key="p"
              class="unallocated-tag"
            >
              {{ p }}
            </span>
          </div>
          <p class="text-sm mt-4" style="color: #6b7280;">
            提示：单个格子容量为 0.1 m³ (100,000 cm³)，超出此体积的包裹无法分配。
            请尝试拆分包裹或增大格子容量。
          </p>
        </div>
      </div>

      <div v-else class="card text-center" style="padding: 60px;">
        <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
        <p style="color: #9ca3af;">添加包裹并点击"开始分配"查看结果</p>
      </div>

      <div class="card">
        <div class="card-title flex justify-between items-center">
          <span>🎫 取件码管理</span>
          <button 
            class="btn btn-secondary text-sm" 
            @click="loadPickupList"
            :disabled="loading"
            type="button"
          >
            {{ loading ? '刷新中...' : '🔄 刷新列表' }}
          </button>
        </div>

        <div class="input-group">
          <label>输入取件码取件</label>
          <div class="flex gap-2">
            <input 
              v-model="pickupCodeInput" 
              placeholder="输入 6 位取件码，如: 123456"
              maxlength="6"
              style="flex: 1;"
              @keyup.enter="doPickup"
            />
            <button 
              class="btn btn-success" 
              @click="doPickup"
              :disabled="loading || !pickupCodeInput || pickupCodeInput.length !== 6"
              type="button"
            >
              领取
            </button>
          </div>
        </div>

        <div v-if="pickupMessage" :class="['alert mt-4', pickupMessageType]">
          {{ pickupMessage }}
        </div>

        <div v-if="pickupList.length > 0" class="mt-4">
          <h4 style="margin-bottom: 12px; color: #374151;">待取包裹列表 ({{ pickupList.length }})</h4>
          <div class="pickup-table">
            <table class="table">
              <thead>
                <tr>
                  <th>包裹编号</th>
                  <th>格子位置</th>
                  <th>取件码</th>
                  <th>体积 (m³)</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in pickupList" :key="p.id">
                  <td><strong>{{ p.parcelNo }}</strong></td>
                  <td>
                    <span class="location-tag">
                      {{ p.shelfRow }}-{{ String(p.shelfCol).padStart(2, '0') }}
                    </span>
                  </td>
                  <td>
                    <span class="pickup-code">{{ p.pickupCode }}</span>
                  </td>
                  <td>{{ p.volumeM3.toFixed(6) }}</td>
                  <td>
                    <button 
                      class="btn btn-success text-sm" 
                      @click="pickupParcel(p)"
                      :disabled="loading"
                      type="button"
                    >
                      模拟取件
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="text-center" style="padding: 30px; color: #9ca3af;">
          暂无待取包裹
        </div>
      </div>
    </div>

    <div v-if="result && result.parcels.length > 0" class="card">
      <div class="card-title">
        📦 包裹分配详情
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>包裹编号</th>
            <th>体积 (m³)</th>
            <th>体积 (cm³)</th>
            <th>分配位置</th>
            <th>取件码</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in result.parcels" :key="p.parcelNo">
            <td><strong>{{ p.parcelNo }}</strong></td>
            <td>{{ p.volumeM3.toFixed(6) }}</td>
            <td>{{ p.volumeCm3.toFixed(2) }}</td>
            <td>
              <span v-if="p.allocated" class="location-tag">
                {{ p.cellCode || (p.shelfRow + '-' + String(p.shelfCol).padStart(2, '0')) }}
              </span>
              <span v-else style="color: #ef4444;">未分配</span>
            </td>
            <td>
              <span v-if="p.allocated" class="pickup-code">{{ p.pickupCode }}</span>
              <span v-else style="color: #9ca3af;">-</span>
            </td>
            <td>
              <span :class="['status-tag', p.allocated ? 'success' : 'failed']">
                {{ p.allocated ? '✓ 已分配' : '✗ 失败' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { parcelAPI } from '../api.js'

const emit = defineEmits(['pickedUp'])

const props = defineProps({
  result: {
    type: Object,
    default: null
  }
})

const pickupList = ref([])
const pickupCodeInput = ref('')
const pickupMessage = ref('')
const pickupMessageType = ref('alert-info')
const loading = ref(false)

function getColor(rate) {
  if (rate < 0.33) return '#10b981'
  if (rate < 0.66) return '#f59e0b'
  return '#ef4444'
}

function showPickupMessage(msg, type = 'info') {
  pickupMessage.value = msg
  pickupMessageType.value = 'alert-' + type
  setTimeout(() => {
    pickupMessage.value = ''
  }, 5000)
}

async function loadPickupList() {
  loading.value = true
  try {
    const res = await parcelAPI.getPickupList()
    pickupList.value = res.data
  } catch (error) {
    console.error('加载取件列表失败:', error)
    showPickupMessage('加载取件列表失败: ' + error.message, 'error')
  } finally {
    loading.value = false
  }
}

async function doPickup() {
  if (!pickupCodeInput.value || pickupCodeInput.value.length !== 6) {
    showPickupMessage('请输入 6 位取件码', 'error')
    return
  }

  loading.value = true
  try {
    const res = await parcelAPI.pickupByCode(pickupCodeInput.value)
    showPickupMessage(res.data.message, 'success')
    pickupCodeInput.value = ''
    await loadPickupList()
    emit('pickedUp')
  } catch (error) {
    console.error('取件失败:', error)
    const errMsg = error.response?.data?.message || error.message
    showPickupMessage('取件失败: ' + errMsg, 'error')
  } finally {
    loading.value = false
  }
}

async function pickupParcel(p) {
  if (!confirm(`确定要取走包裹 ${p.parcelNo} 吗？`)) {
    return
  }

  loading.value = true
  try {
    const res = await parcelAPI.pickupByCode(p.pickupCode)
    showPickupMessage(res.data.message, 'success')
    await loadPickupList()
    emit('pickedUp')
  } catch (error) {
    console.error('取件失败:', error)
    const errMsg = error.response?.data?.message || error.message
    showPickupMessage('取件失败: ' + errMsg, 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPickupList()
})
</script>

<style scoped>
.summary-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.summary-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.summary-value.success {
  color: #10b981;
}

.location-tag {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.pickup-code {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  font-family: monospace;
  letter-spacing: 2px;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-tag.success {
  background: #d1fae5;
  color: #065f46;
}

.status-tag.failed {
  background: #fee2e2;
  color: #991b1b;
}

.unallocated-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.unallocated-tag {
  background: #fee2e2;
  color: #991b1b;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.pickup-table {
  max-height: 300px;
  overflow-y: auto;
}
</style>
