<template>
  <div class="cartridge-comparison-page">
    <el-row :gutter="20" class="main-row">
      <el-col :span="8" class="left-panel">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="panel-header">
              <span>数据库样本</span>
              <el-tag :type="samples.length > 0 ? 'success' : 'info'" size="small">
                {{ samples.length }} 个样本
              </el-tag>
            </div>
          </template>
          
          <div class="sample-actions">
            <el-button type="primary" size="small" @click="showCreateSample = true" :icon="Plus">
              添加样本
            </el-button>
            <el-button size="small" @click="loadSamples" :icon="Refresh">
              刷新
            </el-button>
          </div>
          
          <div class="sample-list" v-loading="loadingSamples">
            <el-empty v-if="samples.length === 0" description="暂无样本" />
            
            <div 
              v-for="sample in samples" 
              :key="sample.id"
              class="sample-item"
              :class="{ active: currentSample?.id === sample.id }"
              @click="selectSample(sample)"
            >
              <div class="sample-info">
                <div class="sample-name">{{ sample.sample_name }}</div>
                <div class="sample-details">
                  <el-tag size="small" type="info">{{ sample.firearm_type }}</el-tag>
                  <span v-if="sample.caliber" class="sample-caliber">{{ sample.caliber }}</span>
                </div>
              </div>
              <el-button 
                type="danger" 
                size="small" 
                text 
                @click.stop="deleteSample(sample)"
                :icon="Delete"
              />
            </div>
          </div>
        </el-card>
        
        <el-card shadow="never" class="panel-card" style="margin-top: 16px;" v-if="currentSample">
          <template #header>
            <span>样本详情</span>
          </template>
          
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="样本名称">
              {{ currentSample.sample_name }}
            </el-descriptions-item>
            <el-descriptions-item label="枪支类型">
              {{ currentSample.firearm_type }}
            </el-descriptions-item>
            <el-descriptions-item label="制造商" v-if="currentSample.manufacturer">
              {{ currentSample.manufacturer }}
            </el-descriptions-item>
            <el-descriptions-item label="型号" v-if="currentSample.model">
              {{ currentSample.model }}
            </el-descriptions-item>
            <el-descriptions-item label="口径" v-if="currentSample.caliber">
              {{ currentSample.caliber }}
            </el-descriptions-item>
            <el-descriptions-item label="案件编号" v-if="currentSample.case_number">
              {{ currentSample.case_number }}
            </el-descriptions-item>
          </el-descriptions>
          
          <el-divider content-position="left">图像列表</el-divider>
          
          <div class="sample-images">
            <div 
              v-for="img in sampleImages" 
              :key="img.id"
              class="sample-image-item"
              @click="viewSampleImage(img)"
            >
              <img :src="getImageUrl(img.id, true)" :alt="img.image_type" />
              <div class="image-type-tag">{{ img.image_type }}</div>
            </div>
            
            <div class="add-image-item" @click="showUploadImage = true">
              <el-icon :size="24"><Plus /></el-icon>
              <span>添加图像</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16" class="main-content">
        <el-card shadow="never" class="upload-card">
          <template #header>
            <div class="panel-header">
              <span>查询图像</span>
              <el-tag v-if="queryImage" type="success" size="small">已上传</el-tag>
            </div>
          </template>
          
          <div class="upload-area">
            <el-upload
              class="image-uploader"
              drag
              :auto-upload="false"
              :on-change="handleFileSelect"
              :limit="1"
              :on-exceed="handleExceed"
              accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                将弹壳底部显微图像拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持格式：JPG, PNG, BMP, TIFF
                </div>
              </template>
            </el-upload>
            
            <div class="query-image-preview" v-if="queryImageUrl">
              <img :src="queryImageUrl" alt="Query Image" />
              <div class="image-actions">
                <el-button size="small" type="danger" @click="clearQueryImage" :icon="Delete">
                  移除
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="compare-actions" v-if="queryImage">
            <el-divider />
            
            <div class="compare-options">
              <el-form-item label="匹配数量">
                <el-select v-model="topN" size="small" style="width: 120px;">
                  <el-option :value="3" label="Top 3" />
                  <el-option :value="5" label="Top 5" />
                  <el-option :value="10" label="Top 10" />
                </el-select>
              </el-form-item>
              
              <el-button 
                type="primary" 
                size="large"
                :loading="isComparing"
                :disabled="samples.length === 0"
                @click="runComparison"
                :icon="Search"
              >
                {{ isComparing ? '比对中...' : '开始比对' }}
              </el-button>
            </div>
          </div>
        </el-card>
        
        <el-card shadow="never" class="results-card" v-if="comparisonResults.length > 0">
          <template #header>
            <div class="panel-header">
              <span>比对结果</span>
              <el-tag v-if="comparisonTime" type="info" size="small">
                耗时: {{ comparisonTime.toFixed(2) }}s
              </el-tag>
            </div>
          </template>
          
          <div class="results-list">
            <div 
              v-for="(result, index) in comparisonResults" 
              :key="index"
              class="result-item"
              :class="{ active: selectedResultIndex === index }"
              @click="selectResult(result, index)"
            >
              <div class="result-rank">
                <el-tag :type="getRankType(index)" size="large">
                  #{{ result.rank }}
                </el-tag>
              </div>
              
              <div class="result-info">
                <div class="result-name">{{ result.sample_name || `样本 #${result.sample_id}` }}</div>
                <div class="result-details">
                  <span class="detail-item">
                    <strong>整体相似度:</strong>
                    <el-progress 
                      :percentage="result.overall_similarity * 100" 
                      :color="getProgressColor(result.overall_similarity)"
                      :stroke-width="10"
                      :text-inside="true"
                      style="width: 150px; display: inline-block; vertical-align: middle;"
                    />
                  </span>
                </div>
                
                <div class="similarity-breakdown" v-if="result.primer_similarity !== undefined">
                  <span class="breakdown-item">
                    底火: {{ (result.primer_similarity * 100).toFixed(1) }}%
                  </span>
                  <span class="breakdown-item" v-if="result.firing_pin_similarity !== undefined">
                    撞针痕: {{ (result.firing_pin_similarity * 100).toFixed(1) }}%
                  </span>
                  <span class="breakdown-item" v-if="result.ejector_similarity !== undefined">
                    抛壳挺: {{ (result.ejector_similarity * 100).toFixed(1) }}%
                  </span>
                </div>
                
                <div class="inlier-info">
                  <el-tag size="small" type="success">
                    内点: {{ result.inlier_count }}
                  </el-tag>
                  <el-tag size="small" :type="getConfidenceType(result.confidence)">
                    置信度: {{ getConfidenceText(result.confidence) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
        
        <el-card shadow="never" class="comparison-card" v-if="selectedResult">
          <template #header>
            <div class="panel-header">
              <span>图像对比</span>
              <el-tag type="info" size="small">
                相似度: {{ (selectedResult.overall_similarity * 100).toFixed(1) }}%
              </el-tag>
            </div>
          </template>
          
          <div class="comparison-viewer" v-if="queryImageUrl && selectedSampleImageUrl">
            <ImageComparisonViewer
              :left-image="queryImageUrl"
              :right-image="selectedSampleImageUrl"
              :left-label="'查询图像'"
              :right-label="`样本: ${selectedResult.sample_name || '未知'}`"
              :matched-points="selectedResult.matched_points || []"
              mode="slider"
            />
          </div>
          
          <el-empty v-else description="请选择一个比对结果查看对比" />
        </el-card>
      </el-col>
    </el-row>
    
    <el-dialog
      v-model="showCreateSample"
      title="添加新样本"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="newSample" label-width="100px">
        <el-form-item label="样本名称" required>
          <el-input v-model="newSample.sample_name" placeholder="请输入样本名称" />
        </el-form-item>
        <el-form-item label="枪支类型" required>
          <el-select v-model="newSample.firearm_type" placeholder="请选择枪支类型" style="width: 100%;">
            <el-option label="手枪" value="pistol" />
            <el-option label="步枪" value="rifle" />
            <el-option label="霰弹枪" value="shotgun" />
            <el-option label="冲锋枪" value="submachine_gun" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="制造商">
          <el-input v-model="newSample.manufacturer" placeholder="请输入制造商" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="newSample.model" placeholder="请输入型号" />
        </el-form-item>
        <el-form-item label="口径">
          <el-input v-model="newSample.caliber" placeholder="如: 9mm, .45 ACP" />
        </el-form-item>
        <el-form-item label="案件编号">
          <el-input v-model="newSample.case_number" placeholder="请输入案件编号" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="newSample.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateSample = false">取消</el-button>
        <el-button type="primary" @click="createSample" :loading="creatingSample">
          创建
        </el-button>
      </template>
    </el-dialog>
    
    <el-dialog
      v-model="showUploadImage"
      title="上传样本图像"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-upload
        class="image-uploader-dialog"
        drag
        :auto-upload="false"
        :on-change="handleSampleImageSelect"
        :limit="1"
        :on-exceed="handleExceed"
        accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将弹壳底部图像拖到此处，或<em>点击上传</em>
        </div>
      </el-upload>
      
      <el-form label-width="100px" style="margin-top: 20px;">
        <el-form-item label="图像类型">
          <el-select v-model="selectedImageType" style="width: 100%;">
            <el-option label="底火区域" value="primer" />
            <el-option label="撞针痕" value="firing_pin" />
            <el-option label="抛壳挺痕" value="ejector" />
            <el-option label="拉壳钩痕" value="extractor" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showUploadImage = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="uploadSampleImage" 
          :loading="uploadingImage"
          :disabled="!selectedSampleImageFile"
        >
          上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Refresh, Delete, UploadFilled, Search, 
  ArrowRight, ArrowLeft 
} from '@element-plus/icons-vue'
import { cartridgeApi } from '@/api'
import { useCartridgeStore } from '@/stores/cartridge'
import ImageComparisonViewer from '@/components/ImageComparisonViewer.vue'

const router = useRouter()
const store = useCartridgeStore()

const samples = computed(() => store.samples)
const totalSamples = computed(() => store.totalSamples)
const currentSample = computed(() => store.currentSample)
const sampleImages = computed(() => store.sampleImages)
const queryImage = computed(() => store.queryImage)
const queryImageUrl = computed(() => store.queryImageUrl)
const queryImageFeatures = computed(() => store.queryImageFeatures)
const comparisonResults = computed(() => store.comparisonResults)
const currentComparison = computed(() => store.currentComparison)
const isComparing = computed(() => store.isComparing)
const comparisonTime = computed(() => store.comparisonTime)
const matchedPoints = computed(() => store.matchedPoints)

const loadingSamples = ref(false)
const showCreateSample = ref(false)
const showUploadImage = ref(false)
const creatingSample = ref(false)
const uploadingImage = ref(false)

const newSample = ref({
  sample_name: '',
  firearm_type: 'pistol',
  manufacturer: '',
  model: '',
  caliber: '',
  case_number: '',
  description: ''
})

const selectedImageType = ref('primer')
const selectedSampleImageFile = ref(null)
const topN = ref(5)

const selectedResultIndex = ref(-1)
const selectedResult = ref(null)
const selectedSampleImageUrl = ref('')

function getImageUrl(imageId, thumbnail = false) {
  return `/api/cartridge/images/${imageId}?thumbnail=${thumbnail}`
}

async function loadSamples() {
  loadingSamples.value = true
  try {
    const response = await cartridgeApi.getSamples()
    store.setSamples(response.data.samples)
    store.setTotalSamples(response.data.total)
  } catch (error) {
    console.error('Load samples error:', error)
    ElMessage.error('加载样本失败')
  } finally {
    loadingSamples.value = false
  }
}

async function selectSample(sample) {
  store.setCurrentSample(sample)
  try {
    const response = await cartridgeApi.getSampleImages(sample.id)
    store.setSampleImages(response.data.images)
  } catch (error) {
    console.error('Load sample images error:', error)
    store.setSampleImages([])
  }
}

async function createSample() {
  if (!newSample.value.sample_name) {
    ElMessage.warning('请输入样本名称')
    return
  }
  if (!newSample.value.firearm_type) {
    ElMessage.warning('请选择枪支类型')
    return
  }
  
  creatingSample.value = true
  try {
    const response = await cartridgeApi.createSample(newSample.value)
    store.addSample(response.data)
    ElMessage.success('样本创建成功')
    showCreateSample.value = false
    newSample.value = {
      sample_name: '',
      firearm_type: 'pistol',
      manufacturer: '',
      model: '',
      caliber: '',
      case_number: '',
      description: ''
    }
  } catch (error) {
    console.error('Create sample error:', error)
    ElMessage.error(error.response?.data?.detail || '创建样本失败')
  } finally {
    creatingSample.value = false
  }
}

async function deleteSample(sample) {
  try {
    await ElMessageBox.confirm(
      `确定要删除样本 "${sample.sample_name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await cartridgeApi.deleteSample(sample.id)
    store.removeSample(sample.id)
    
    if (currentSample.value?.id === sample.id) {
      store.setCurrentSample(null)
      store.setSampleImages([])
    }
    
    ElMessage.success('样本已删除')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete sample error:', error)
      ElMessage.error('删除样本失败')
    }
  }
}

function handleFileSelect(file) {
  const fileObj = file.raw
  if (!fileObj) return
  
  const validTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff']
  if (!validTypes.includes(fileObj.type) && 
      !fileObj.name.toLowerCase().match(/\.(jpg|jpeg|png|bmp|tiff|tif)$/)) {
    ElMessage.error('不支持的文件格式')
    return
  }
  
  store.setQueryImage(fileObj)
  
  const url = URL.createObjectURL(fileObj)
  store.setQueryImageUrl(url)
}

function handleSampleImageSelect(file) {
  selectedSampleImageFile.value = file.raw
}

function handleExceed(files, fileList) {
  ElMessage.warning('只能上传一个文件')
}

async function uploadSampleImage() {
  if (!selectedSampleImageFile.value || !currentSample.value) return
  
  uploadingImage.value = true
  try {
    const response = await cartridgeApi.uploadSampleImage(
      currentSample.value.id,
      selectedSampleImageFile.value,
      selectedImageType.value
    )
    store.addSampleImage(response.data)
    ElMessage.success('图像上传成功，特征提取中...')
    showUploadImage.value = false
    selectedSampleImageFile.value = null
  } catch (error) {
    console.error('Upload image error:', error)
    ElMessage.error(error.response?.data?.detail || '上传失败')
  } finally {
    uploadingImage.value = false
  }
}

function clearQueryImage() {
  store.clearQuery()
  store.clearComparison()
  selectedResult.value = null
  selectedResultIndex.value = -1
  selectedSampleImageUrl.value = ''
}

async function runComparison() {
  if (!queryImage.value) {
    ElMessage.warning('请先上传查询图像')
    return
  }
  
  if (samples.value.length === 0) {
    ElMessage.warning('数据库中没有样本，请先添加样本')
    return
  }
  
  store.setIsComparing(true)
  store.clearComparison()
  
  try {
    const uploadResponse = await cartridgeApi.uploadQueryImage(queryImage.value)
    const imageId = uploadResponse.data.id
    
    const response = await cartridgeApi.compareWithDatabase(imageId, topN.value)
    
    store.setComparisonResults(response.data.results, response.data.comparison_time)
    
    if (response.data.results.length > 0) {
      ElMessage.success(`比对完成，找到 ${response.data.results.length} 个匹配结果`)
    } else {
      ElMessage.info('比对完成，未找到匹配结果')
    }
    
  } catch (error) {
    console.error('Comparison error:', error)
    ElMessage.error(error.response?.data?.detail || '比对失败')
  } finally {
    store.setIsComparing(false)
  }
}

function selectResult(result, index) {
  selectedResult.value = result
  selectedResultIndex.value = index
  
  if (result.sample_id && sampleImages.value.length > 0) {
    const sampleImg = sampleImages.value.find(img => img.id === result.image_id)
    if (sampleImg) {
      selectedSampleImageUrl.value = getImageUrl(sampleImg.id, false)
    } else if (sampleImages.value.length > 0) {
      selectedSampleImageUrl.value = getImageUrl(sampleImages.value[0].id, false)
    }
  }
}

function viewSampleImage(img) {
  ElMessage.info(`查看图像 ID: ${img.id}`)
}

function getRankType(index) {
  if (index === 0) return 'success'
  if (index === 1) return 'warning'
  if (index === 2) return 'info'
  return ''
}

function getProgressColor(similarity) {
  if (similarity >= 0.7) return '#67c23a'
  if (similarity >= 0.4) return '#e6a23c'
  return '#909399'
}

function getConfidenceType(confidence) {
  if (confidence === 'high') return 'success'
  if (confidence === 'medium') return 'warning'
  return 'info'
}

function getConfidenceText(confidence) {
  if (confidence === 'high') return '高'
  if (confidence === 'medium') return '中'
  return '低'
}

onMounted(() => {
  loadSamples()
})
</script>

<style scoped>
.cartridge-comparison-page {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

.main-row {
  min-height: 100%;
}

.left-panel {
  display: flex;
  flex-direction: column;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-card {
  flex: 0 0 auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sample-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.sample-list {
  max-height: 400px;
  overflow-y: auto;
}

.sample-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.sample-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.sample-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.sample-info {
  flex: 1;
}

.sample-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.sample-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sample-caliber {
  font-size: 12px;
  color: #909399;
}

.sample-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.sample-image-item {
  position: relative;
  aspect-ratio: 1;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.sample-image-item:hover {
  border-color: #409eff;
}

.sample-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-type-tag {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.add-image-item {
  aspect-ratio: 1;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #909399;
}

.add-image-item:hover {
  border-color: #409eff;
  color: #409eff;
}

.add-image-item span {
  font-size: 12px;
  margin-top: 4px;
}

.upload-card {
  flex: 0 0 auto;
}

.upload-area {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.image-uploader {
  flex: 1;
}

.image-uploader :deep(.el-upload-dragger) {
  width: 100%;
}

.query-image-preview {
  position: relative;
  width: 200px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px;
}

.query-image-preview img {
  width: 100%;
  height: auto;
  border-radius: 4px;
}

.image-actions {
  margin-top: 8px;
  display: flex;
  justify-content: center;
}

.compare-actions {
  margin-top: 16px;
}

.compare-options {
  display: flex;
  align-items: center;
  gap: 20px;
}

.compare-options .el-form-item {
  margin-bottom: 0;
}

.results-card {
  flex: 0 0 auto;
}

.results-list {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  border-color: #409eff;
  background: #fafafa;
}

.result-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.result-rank {
  display: flex;
  align-items: center;
}

.result-info {
  flex: 1;
}

.result-name {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 8px;
}

.result-details {
  margin-bottom: 8px;
}

.detail-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.similarity-breakdown {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #606266;
}

.inlier-info {
  display: flex;
  gap: 8px;
}

.comparison-card {
  flex: 0 0 auto;
}

.comparison-viewer {
  width: 100%;
}

.image-uploader-dialog :deep(.el-upload-dragger) {
  width: 100%;
}
</style>
