<template>
  <div class="upload-container">
    <el-card v-if="!currentSpectra" class="upload-card">
      <template #header>
        <div class="card-header">
          <span>上传流星光谱图片</span>
        </div>
      </template>
      <el-upload
        class="upload-demo"
        drag
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        accept="image/jpeg,image/jpg"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          拖拽图片到此处或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持 JPG/JPEG 格式的流星光谱图片
          </div>
        </template>
      </el-upload>
      
      <el-form :model="uploadForm" label-width="100px" class="upload-form" v-if="selectedFile">
        <el-form-item label="上传者">
          <el-input v-model="uploadForm.uploaderName" placeholder="请输入您的名称" maxlength="50" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="uploadFile" :loading="uploading">
            上传图片
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="currentSpectra && !isCalibrated" class="calibrate-card">
      <template #header>
        <div class="card-header">
          <span>波长校准</span>
          <el-button type="text" @click="resetUpload">重新上传</el-button>
        </div>
      </template>
      
      <div class="calibrate-content">
        <div class="image-container" ref="imageContainer">
          <el-image 
            :src="imageUrl" 
            fit="contain"
            @load="onImageLoad"
            class="calibrate-image"
          />
          <svg 
            v-if="imageLoaded"
            class="overlay-svg"
            :viewBox="`0 0 ${imageDimensions.width} ${imageDimensions.height}`"
            @click="handleImageClick"
            @mousemove="handleMouseMove"
          >
            <line 
              v-if="startPoint && !endPoint"
              :x1="startPoint.x" 
              :y1="startPoint.y"
              :x2="currentPoint.x"
              :y2="currentPoint.y"
              stroke="#667eea"
              stroke-width="2"
              stroke-dasharray="5,5"
            />
            <line 
              v-if="startPoint && endPoint"
              :x1="startPoint.x" 
              :y1="startPoint.y"
              :x2="endPoint.x"
              :y2="endPoint.y"
              stroke="#667eea"
              stroke-width="3"
            />
            <circle 
              v-if="startPoint"
              :cx="startPoint.x" 
              :cy="startPoint.y" 
              r="8"
              fill="#667eea"
              stroke="white"
              stroke-width="2"
            />
            <circle 
              v-if="endPoint"
              :cx="endPoint.x" 
              :cy="endPoint.y" 
              r="8"
              fill="#764ba2"
              stroke="white"
              stroke-width="2"
            />
            <text 
              v-if="startPoint"
              :x="startPoint.x + 15" 
              :y="startPoint.y - 15"
              fill="#667eea"
              font-size="14"
              font-weight="bold"
            >
              起点 ({{ calibrationForm.minWavelength || '?' }} Å)
            </text>
            <text 
              v-if="endPoint"
              :x="endPoint.x + 15" 
              :y="endPoint.y - 15"
              fill="#764ba2"
              font-size="14"
              font-weight="bold"
            >
              终点 ({{ calibrationForm.maxWavelength || '?' }} Å)
            </text>
          </svg>
        </div>
        
        <div class="calibrate-form-container">
          <el-alert 
            :title="instructionText" 
            type="info" 
            :closable="false"
            class="instruction"
            show-icon
          />
          
          <el-form :model="calibrationForm" label-width="120px" class="calibrate-form">
            <el-form-item label="起点波长 (Å)">
              <el-input-number 
                v-model="calibrationForm.minWavelength" 
                :min="1000" 
                :max="10000"
                :step="10"
                placeholder="例如: 4000"
              />
            </el-form-item>
            <el-form-item label="终点波长 (Å)">
              <el-input-number 
                v-model="calibrationForm.maxWavelength" 
                :min="1000" 
                :max="10000"
                :step="10"
                placeholder="例如: 7000"
              />
            </el-form-item>
            <el-form-item label="起点坐标">
              <span>X: {{ startPoint?.x || '-' }}, Y: {{ startPoint?.y || '-' }}</span>
            </el-form-item>
            <el-form-item label="终点坐标">
              <span>X: {{ endPoint?.x || '-' }}, Y: {{ endPoint?.y || '-' }}</span>
            </el-form-item>
            
            <el-form-item>
              <el-button @click="clearPoints" type="warning">
                清除标注
              </el-button>
              <el-button 
                type="primary" 
                @click="calibrateWavelength" 
                :loading="calibrating"
                :disabled="!canCalibrate"
              >
                提取光谱
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>

    <el-card v-if="isCalibrated" class="result-card">
      <template #header>
        <div class="card-header">
          <span>光谱分析结果</span>
          <el-button type="primary" @click="gotoDetail">
            查看详情
          </el-button>
        </div>
      </template>
      
      <el-alert title="光谱提取成功！" type="success" :closable="false" show-icon class="success-alert" />
      
      <el-form :model="updateForm" label-width="120px" class="result-form">
        <el-form-item label="流星速度 (km/s)">
          <el-input-number 
            v-model="updateForm.velocity" 
            :min="0" 
            :max="100"
            :step="0.1"
            placeholder="可选：估算流星速度"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="updateForm.notes" 
            type="textarea" 
            :rows="3"
            placeholder="添加您的分析备注"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveUpdate" :loading="saving">
            保存信息
          </el-button>
          <el-button @click="uploadNew">
            上传新图片
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { spectraApi } from '../api/spectra'

const router = useRouter()

const selectedFile = ref(null)
const currentSpectra = ref(null)
const isCalibrated = ref(false)
const uploading = ref(false)
const calibrating = ref(false)
const saving = ref(false)
const imageLoaded = ref(false)
const imageContainer = ref(null)

const imageUrl = computed(() => {
  if (currentSpectra.value) {
    return `/api/spectra/${currentSpectra.value.id}/image`
  }
  return ''
})

const uploadForm = ref({
  uploaderName: ''
})

const calibrationForm = ref({
  minWavelength: 4000,
  maxWavelength: 7000
})

const updateForm = ref({
  velocity: null,
  notes: ''
})

const startPoint = ref(null)
const endPoint = ref(null)
const currentPoint = ref({ x: 0, y: 0 })
const imageDimensions = ref({ width: 0, height: 0 })

const instructionText = computed(() => {
  if (!startPoint.value) {
    return '第一步：在图片上点击选择流星轨迹的起点（对应较短的波长）'
  } else if (!endPoint.value) {
    return '第二步：点击选择流星轨迹的终点（对应较长的波长）'
  }
  return '标注完成！确认波长范围后点击"提取光谱"按钮'
})

const canCalibrate = computed(() => {
  return startPoint.value && endPoint.value &&
         calibrationForm.value.minWavelength &&
         calibrationForm.value.maxWavelength &&
         calibrationForm.value.minWavelength < calibrationForm.value.maxWavelength
})

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const handleFileRemove = () => {
  selectedFile.value = null
}

const uploadFile = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择要上传的图片')
    return
  }
  
  uploading.value = true
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  if (uploadForm.value.uploaderName) {
    formData.append('uploaderName', uploadForm.value.uploaderName)
  }
  
  try {
    const response = await spectraApi.upload(formData)
    currentSpectra.value = response.data
    ElMessage.success('图片上传成功')
  } catch (error) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

const onImageLoad = async () => {
  await nextTick()
  if (imageContainer.value) {
    const img = imageContainer.value.querySelector('img')
    if (img) {
      imageDimensions.value = {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
    }
  }
  imageLoaded.value = true
}

const getImageCoordinates = (event) => {
  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width * imageDimensions.value.width
  const y = (event.clientY - rect.top) / rect.height * imageDimensions.value.height
  return { x: Math.round(x), y: Math.round(y) }
}

const handleImageClick = (event) => {
  const coords = getImageCoordinates(event)
  
  if (!startPoint.value) {
    startPoint.value = coords
  } else if (!endPoint.value) {
    endPoint.value = coords
  }
}

const handleMouseMove = (event) => {
  if (startPoint.value && !endPoint.value) {
    currentPoint.value = getImageCoordinates(event)
  }
}

const clearPoints = () => {
  startPoint.value = null
  endPoint.value = null
}

const calibrateWavelength = async () => {
  if (!canCalibrate.value) return
  
  calibrating.value = true
  
  const data = {
    minWavelength: calibrationForm.value.minWavelength,
    maxWavelength: calibrationForm.value.maxWavelength,
    startPixelX: startPoint.value.x,
    startPixelY: startPoint.value.y,
    endPixelX: endPoint.value.x,
    endPixelY: endPoint.value.y
  }
  
  try {
    await spectraApi.calibrate(currentSpectra.value.id, data)
    isCalibrated.value = true
    ElMessage.success('光谱提取成功！')
  } catch (error) {
    ElMessage.error('光谱提取失败')
  } finally {
    calibrating.value = false
  }
}

const saveUpdate = async () => {
  if (!updateForm.value.velocity && !updateForm.value.notes) {
    ElMessage.warning('请填写速度或备注信息')
    return
  }
  
  saving.value = true
  try {
    await spectraApi.update(currentSpectra.value.id, updateForm.value)
    ElMessage.success('信息保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const gotoDetail = () => {
  router.push(`/spectra/${currentSpectra.value.id}`)
}

const resetUpload = () => {
  currentSpectra.value = null
  isCalibrated.value = false
  selectedFile.value = null
  startPoint.value = null
  endPoint.value = null
  uploadForm.value.uploaderName = ''
}

const uploadNew = () => {
  resetUpload()
}
</script>

<style scoped>
.upload-container {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.upload-demo {
  margin-bottom: 20px;
}

.upload-form {
  max-width: 400px;
}

.calibrate-card, .result-card {
  margin-top: 20px;
}

.calibrate-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.image-container {
  position: relative;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calibrate-image {
  max-width: 100%;
  max-height: 600px;
  display: block;
}

.overlay-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.calibrate-form-container {
  padding: 10px;
}

.instruction {
  margin-bottom: 20px;
}

.calibrate-form .el-form-item {
  margin-bottom: 20px;
}

.success-alert {
  margin-bottom: 20px;
}

.result-form {
  max-width: 500px;
}

@media (max-width: 900px) {
  .calibrate-content {
    grid-template-columns: 1fr;
  }
}
</style>
