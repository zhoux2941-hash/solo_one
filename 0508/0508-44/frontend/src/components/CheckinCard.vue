<template>
  <div class="checkin-card">
    <h2 class="card-title">光盘行动打卡</h2>
    
    <div class="employee-info" v-if="currentEmployee">
      <div class="info-item">
        <span class="label">工号：</span>
        <span class="value">{{ currentEmployee.employeeNo }}</span>
      </div>
      <div class="info-item">
        <span class="label">姓名：</span>
        <span class="value">{{ currentEmployee.name }}</span>
      </div>
      <div class="info-item">
        <span class="label">部门：</span>
        <span class="value">{{ currentEmployee.department }}</span>
      </div>
      <div class="info-item">
        <span class="label">总积分：</span>
        <span class="value points">{{ currentEmployee.totalPoints }}</span>
      </div>
    </div>

    <div class="upload-section">
      <div class="file-input-wrapper">
        <input 
          type="file" 
          id="imageInput" 
          accept="image/*" 
          @change="handleFileSelect"
          class="file-input"
        />
        <label for="imageInput" class="upload-btn">
          <span v-if="!imagePreview">选择图片</span>
          <span v-else>重新选择</span>
        </label>
      </div>

      <div class="image-preview" v-if="imagePreview">
        <img :src="imagePreview" alt="预览图片" />
      </div>
    </div>

    <button 
      class="checkin-btn" 
      @click="handleCheckin" 
      :disabled="loading || !imagePreview"
    >
      <span v-if="loading">打卡中...</span>
      <span v-else>立即打卡</span>
    </button>

    <div class="result-section" v-if="checkinResult">
      <div class="result-card" :class="{ success: checkinResult.isSuccess, fail: !checkinResult.isSuccess }">
        <div class="result-title">
          {{ checkinResult.isSuccess ? '打卡成功！' : '打卡失败' }}
        </div>
        <div class="result-details">
          <div class="detail-item">
            <span class="label">光盘概率：</span>
            <span class="value">{{ (checkinResult.plateProbability * 100).toFixed(1) }}%</span>
          </div>
          <div class="detail-item" v-if="checkinResult.isSuccess">
            <span class="label">获得积分：</span>
            <span class="value points">+{{ checkinResult.pointsEarned }}</span>
          </div>
          <div class="detail-item" v-if="checkinResult.isSuccess">
            <span class="label">连续打卡：</span>
            <span class="value">{{ checkinResult.consecutiveDays }}天</span>
          </div>
          <div class="detail-item">
            <span class="label">提示：</span>
            <span class="value">{{ checkinResult.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="error-message" v-if="errorMessage">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import checkinService from '../api/checkinService.js'

const props = defineProps({
  employeeNo: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['checkin-success'])

const currentEmployee = ref(null)
const imagePreview = ref(null)
const imageBase64 = ref(null)
const imageFileName = ref(null)
const loading = ref(false)
const checkinResult = ref(null)
const errorMessage = ref(null)

const loadEmployeeInfo = async () => {
  try {
    const result = await checkinService.getEmployeeInfo(props.employeeNo)
    if (result.code === 200) {
      currentEmployee.value = result.data
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '获取员工信息失败'
    console.error('获取员工信息失败:', error)
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    errorMessage.value = '请选择图片文件'
    return
  }

  errorMessage.value = null
  checkinResult.value = null
  imageFileName.value = file.name

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
    imageBase64.value = e.target.result.split(',')[1]
  }
  reader.readAsDataURL(file)
}

const handleCheckin = async () => {
  if (!imageBase64.value) {
    errorMessage.value = '请先选择图片'
    return
  }

  loading.value = true
  errorMessage.value = null
  checkinResult.value = null

  try {
    const result = await checkinService.checkin(props.employeeNo, imageBase64.value, imageFileName.value)
    
    if (result.code === 200) {
      checkinResult.value = result.data
      await loadEmployeeInfo()
      
      if (result.data.isSuccess) {
        emit('checkin-success')
      }
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = '打卡失败，请稍后重试'
    console.error('打卡失败:', error)
  } finally {
    loading.value = false
  }
}

loadEmployeeInfo()

defineExpose({
  refresh: loadEmployeeInfo
})
</script>

<style scoped>
.checkin-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 0 auto;
}

.card-title {
  text-align: center;
  color: #333;
  margin-bottom: 24px;
  font-size: 24px;
}

.employee-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 600;
}

.value.points {
  color: #4CAF50;
  font-size: 18px;
}

.upload-section {
  text-align: center;
  margin-bottom: 24px;
}

.file-input-wrapper {
  margin-bottom: 16px;
}

.file-input {
  display: none;
}

.upload-btn {
  display: inline-block;
  padding: 12px 24px;
  background: #2196F3;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
  font-weight: 500;
}

.upload-btn:hover {
  background: #1976D2;
}

.image-preview {
  margin-top: 16px;
}

.image-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.checkin-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.checkin-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.checkin-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result-section {
  margin-top: 24px;
}

.result-card {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.result-card.success {
  background: #e8f5e9;
  border: 2px solid #4CAF50;
}

.result-card.fail {
  background: #ffebee;
  border: 2px solid #f44336;
}

.result-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}

.result-card.success .result-title {
  color: #4CAF50;
}

.result-card.fail .result-title {
  color: #f44336;
}

.result-details {
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.detail-item .value.points {
  color: #4CAF50;
  font-size: 20px;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 6px;
  text-align: center;
}
</style>
