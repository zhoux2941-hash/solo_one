<template>
  <div class="card">
    <div class="card-title flex justify-between items-center">
      <span>📦 包裹输入</span>
      <button 
        class="btn btn-secondary text-sm" 
        @click="addSampleParcels"
        type="button"
      >
        加载示例
      </button>
    </div>

    <div v-if="message" :class="['alert', messageType]">
      {{ message }}
    </div>

    <div class="grid" style="grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 16px;">
      <div class="input-group">
        <label>包裹编号</label>
        <input 
          v-model="newParcel.parcelNo" 
          placeholder="如: P001"
          @keyup.enter="addParcel"
        />
      </div>
      <div class="input-group">
        <label>长 (cm)</label>
        <input 
          v-model.number="newParcel.length" 
          type="number" 
          placeholder="10"
          @keyup.enter="addParcel"
        />
      </div>
      <div class="input-group">
        <label>宽 (cm)</label>
        <input 
          v-model.number="newParcel.width" 
          type="number" 
          placeholder="10"
          @keyup.enter="addParcel"
        />
      </div>
      <div class="input-group">
        <label>高 (cm)</label>
        <input 
          v-model.number="newParcel.height" 
          type="number" 
          placeholder="10"
          @keyup.enter="addParcel"
        />
      </div>
      <div class="flex items-center" style="margin-top: 26px;">
        <button class="btn btn-primary" @click="addParcel" type="button">
          ➕ 添加
        </button>
      </div>
    </div>

    <div v-if="parcels.length > 0" class="mb-4">
      <table class="table">
        <thead>
          <tr>
            <th>序号</th>
            <th>包裹编号</th>
            <th>尺寸 (cm)</th>
            <th>体积 (cm³)</th>
            <th>体积 (m³)</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, index) in parcels" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ p.parcelNo }}</td>
            <td>{{ p.length }} × {{ p.width }} × {{ p.height }}</td>
            <td>{{ formatNumber(getVolumeCm3(p)) }}</td>
            <td>{{ formatNumber(getVolumeM3(p)) }}</td>
            <td>
              <button class="btn btn-danger text-sm" @click="removeParcel(index)" type="button">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="parcels.length === 0" class="text-center" style="padding: 40px; color: #9ca3af;">
      暂无包裹，请添加或点击"加载示例"按钮
    </div>

    <div v-if="parcels.length > 0" class="flex justify-between items-center mt-4">
      <div class="text-sm" style="color: #6b7280;">
        共 <strong>{{ parcels.length }}</strong> 个包裹，
        总体积: <strong style="color: #667eea;">{{ formatNumber(totalVolumeM3) }} m³</strong>
        ({{ formatNumber(totalVolumeCm3) }} cm³)
      </div>
      <div class="flex gap-2">
        <button class="btn btn-danger" @click="clearParcels" type="button">
          清空
        </button>
        <button 
          class="btn btn-success" 
          @click="submitAllocation" 
          :disabled="loading"
          type="button"
        >
          {{ loading ? '分配中...' : '🚀 开始分配' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { parcelAPI } from '../api.js'

const emit = defineEmits(['allocated'])

const parcels = ref([])
const loading = ref(false)
const message = ref('')
const messageType = ref('alert-info')

const newParcel = ref({
  parcelNo: '',
  length: null,
  width: null,
  height: null
})

const totalVolumeCm3 = computed(() => {
  return parcels.value.reduce((sum, p) => sum + getVolumeCm3(p), 0)
})

const totalVolumeM3 = computed(() => {
  return totalVolumeCm3.value / 1000000
})

function getVolumeCm3(p) {
  return p.length * p.width * p.height
}

function getVolumeM3(p) {
  return getVolumeCm3(p) / 1000000
}

function formatNumber(num) {
  return num.toFixed(6)
}

function showMessage(msg, type = 'info') {
  message.value = msg
  messageType.value = 'alert-' + type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

function addParcel() {
  if (!newParcel.value.parcelNo.trim()) {
    showMessage('请输入包裹编号', 'error')
    return
  }
  if (!newParcel.value.length || !newParcel.value.width || !newParcel.value.height) {
    showMessage('请输入完整的尺寸信息', 'error')
    return
  }
  if (newParcel.value.length <= 0 || newParcel.value.width <= 0 || newParcel.value.height <= 0) {
    showMessage('尺寸必须大于0', 'error')
    return
  }

  const exists = parcels.value.some(p => p.parcelNo === newParcel.value.parcelNo)
  if (exists) {
    showMessage('包裹编号已存在', 'error')
    return
  }

  parcels.value.push({ ...newParcel.value })
  
  const maxNo = Math.max(0, ...parcels.value
    .map(p => {
      const m = p.parcelNo.match(/P(\d+)/)
      return m ? parseInt(m[1]) : 0
    }))
  newParcel.value = {
    parcelNo: 'P' + String(maxNo + 1).padStart(3, '0'),
    length: null,
    width: null,
    height: null
  }

  showMessage('包裹添加成功', 'success')
}

function removeParcel(index) {
  parcels.value.splice(index, 1)
}

function clearParcels() {
  parcels.value = []
  showMessage('已清空所有包裹', 'info')
}

function addSampleParcels() {
  parcels.value = [
    { parcelNo: 'P001', length: 30, width: 25, height: 20 },
    { parcelNo: 'P002', length: 20, width: 20, height: 20 },
    { parcelNo: 'P003', length: 40, width: 30, height: 25 },
    { parcelNo: 'P004', length: 15, width: 15, height: 15 },
    { parcelNo: 'P005', length: 25, width: 25, height: 25 },
    { parcelNo: 'P006', length: 35, width: 20, height: 15 },
    { parcelNo: 'P007', length: 18, width: 18, height: 18 },
    { parcelNo: 'P008', length: 28, width: 22, height: 18 }
  ]
  showMessage('已加载 8 个示例包裹', 'success')
}

async function submitAllocation() {
  if (parcels.value.length === 0) {
    showMessage('请先添加包裹', 'error')
    return
  }

  loading.value = true
  try {
    const res = await parcelAPI.allocate(parcels.value)
    emit('allocated', res.data)
    if (res.data.success) {
      showMessage('分配成功！', 'success')
    } else {
      showMessage(res.data.message, 'error')
    }
  } catch (error) {
    console.error('分配失败:', error)
    showMessage('分配失败: ' + (error.response?.data?.message || error.message), 'error')
  } finally {
    loading.value = false
  }
}
</script>
