<template>
  <div class="control-panel">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="参数设置" name="params">
        <div class="panel-section">
          <h4>模型参数</h4>
          
          <div class="form-item">
            <label>器型名称</label>
            <el-input 
              v-model="potteryName" 
              placeholder="请输入器型名称"
              maxlength="50"
              show-word-limit
            ></el-input>
          </div>
          
          <div class="form-item">
            <label>旋转面数</label>
            <div class="slider-container">
              <el-slider
                v-model="localRotationSegments"
                :min="4"
                :max="256"
                :step="4"
                show-input
                @change="updateRotationSegments"
              ></el-slider>
            </div>
          </div>
          
          <div class="form-item">
            <label>平滑度</label>
            <div class="slider-container">
              <el-slider
                v-model="localSmoothness"
                :min="0"
                :max="1"
                :step="0.05"
                show-input
                format-tooltip
                @change="updateSmoothness"
              ></el-slider>
            </div>
          </div>
          
          <div class="form-item">
            <label>釉色类型</label>
            <div class="glaze-selector">
              <div 
                v-for="glaze in glazeOptions" 
                :key="glaze.value"
                class="glaze-item"
                :class="{ active: glazeType === glaze.value }"
                @click="updateGlazeType(glaze.value)"
              >
                <div 
                  class="glaze-color"
                  :style="{ background: glaze.color }"
                ></div>
                <div class="glaze-name">{{ glaze.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="经典器型" name="classic">
        <div class="panel-section">
          <h4>选择器型类型</h4>
          <el-select 
            v-model="selectedType" 
            placeholder="全部类型" 
            style="width: 100%; margin-bottom: 15px;"
            @change="loadClassicList"
            clearable
          >
            <el-option label="盏" value="盏"></el-option>
            <el-option label="碗" value="碗"></el-option>
            <el-option label="瓶" value="瓶"></el-option>
          </el-select>
          
          <div class="classic-list">
            <div 
              v-for="pottery in classicList" 
              :key="pottery.id" 
              class="classic-item"
            >
              <div class="classic-info">
                <div class="classic-name">{{ pottery.name }}</div>
                <div class="classic-type">{{ pottery.type }}</div>
                <div class="classic-desc" v-if="pottery.description">
                  {{ pottery.description }}
                </div>
              </div>
              <div class="classic-actions">
                <el-button size="small" @click="loadClassic(pottery)">加载</el-button>
                <el-button size="small" type="success" @click="compareClassic(pottery)">比对</el-button>
              </div>
            </div>
            
            <el-empty v-if="classicList.length === 0" description="暂无数据"></el-empty>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="操作" name="actions">
        <div class="panel-section">
          <h4>保存创作</h4>
          <div class="action-buttons">
            <el-button 
              type="primary" 
              style="width: 100%; margin-bottom: 10px;"
              :disabled="profilePoints.length < 2 || !potteryName"
              @click="savePottery"
            >
              保存到数据库
            </el-button>
            
            <el-button 
              type="warning" 
              style="width: 100%; margin-bottom: 10px;"
              :disabled="!canShare"
              @click="showShareDialog = true"
            >
              生成分享链接
            </el-button>
            
            <el-button 
              type="danger" 
              style="width: 100%;"
              @click="clearAll"
            >
              重置所有
            </el-button>
          </div>
          
          <div class="compare-section" v-if="compareMode">
            <h4>比对模式</h4>
            <el-alert 
              title="当前处于比对模式" 
              type="success" 
              show-icon
              style="margin-bottom: 10px;"
            >
              绿色虚线轮廓为参考器型
            </el-alert>
            <el-button 
              type="warning" 
              style="width: 100%;"
              @click="exitCompareMode"
            >
              退出比对模式
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog
      v-model="showShareDialog"
      title="生成分享链接"
      width="400px"
    >
      <div class="share-form">
        <div class="form-item">
          <label>有效期</label>
          <el-radio-group v-model="shareValidDays">
            <el-radio :label="null">永久</el-radio>
            <el-radio :label="7">7天</el-radio>
            <el-radio :label="30">30天</el-radio>
          </el-radio-group>
        </div>
        
        <div class="form-item" v-if="shareLink">
          <label>分享链接</label>
          <el-input 
            v-model="shareLink" 
            readonly
            style="margin-bottom: 10px;"
          ></el-input>
          <el-button type="primary" @click="copyShareLink">复制链接</el-button>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showShareDialog = false">关闭</el-button>
        <el-button 
          type="primary" 
          @click="generateShareLink"
          :disabled="isGeneratingShare"
        >
          {{ isGeneratingShare ? '生成中...' : '生成链接' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePotteryStore } from '@/store/pottery'
import { storeToRefs } from 'pinia'
import { getClassicList, saveUserPottery, createShare } from '@/utils/api'

const potteryStore = usePotteryStore()
const { 
  profilePoints, 
  rotationSegments, 
  smoothness,
  compareMode,
  currentPotteryName,
  glazeType
} = storeToRefs(potteryStore)

const activeTab = ref('params')
const potteryName = ref(currentPotteryName.value || '')
const localRotationSegments = ref(rotationSegments.value)
const localSmoothness = ref(smoothness.value)

const glazeOptions = [
  { value: 'celadon', label: '青釉', color: 'linear-gradient(135deg, #8FBC8F 0%, #2F4F4F 100%)' },
  { value: 'black', label: '黑釉', color: 'linear-gradient(135deg, #2C3E50 0%, #1A1A2E 100%)' },
  { value: 'white', label: '白釉', color: 'linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%)' },
  { value: 'red', label: '红釉', color: 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)' },
  { value: 'blue', label: '蓝釉', color: 'linear-gradient(135deg, #3498DB 0%, #1E3A8A 100%)' },
  { value: 'yellow', label: '黄釉', color: 'linear-gradient(135deg, #F39C12 0%, #D68910 100%)' }
]

const selectedType = ref('')
const classicList = ref([])

const showShareDialog = ref(false)
const shareValidDays = ref(null)
const shareLink = ref('')
const isGeneratingShare = ref(false)
const savedPotteryId = ref(null)

const canShare = computed(() => {
  return savedPotteryId.value !== null
})

watch(currentPotteryName, (newVal) => {
  if (newVal) {
    potteryName.value = newVal
  }
})

onMounted(() => {
  loadClassicList()
})

const loadClassicList = async () => {
  try {
    const list = await getClassicList(selectedType.value || undefined)
    classicList.value = list || []
  } catch (error) {
    console.error('加载经典器型失败:', error)
    classicList.value = []
  }
}

const updateRotationSegments = (val) => {
  potteryStore.setRotationSegments(val)
}

const updateSmoothness = (val) => {
  potteryStore.setSmoothness(val)
}

const updateGlazeType = (type) => {
  potteryStore.setGlazeType(type)
}

const loadClassic = (pottery) => {
  try {
    const points = JSON.parse(pottery.profilePoints)
    potteryStore.setProfilePoints(points)
    potteryStore.setCurrentPotteryName(pottery.name)
    potteryName.value = pottery.name
    activeTab.value = 'params'
    ElMessage.success('已加载 ' + pottery.name)
  } catch (error) {
    console.error('解析器型数据失败:', error)
    ElMessage.error('加载失败')
  }
}

const compareClassic = (pottery) => {
  try {
    const points = JSON.parse(pottery.profilePoints)
    potteryStore.setCompareProfilePoints(points)
    ElMessage.success('已进入比对模式，参考器型：' + pottery.name)
  } catch (error) {
    console.error('解析器型数据失败:', error)
    ElMessage.error('比对失败')
  }
}

const exitCompareMode = () => {
  potteryStore.clearCompare()
  ElMessage.info('已退出比对模式')
}

const savePottery = async () => {
  if (profilePoints.value.length < 2) {
    ElMessage.warning('请先绘制轮廓')
    return
  }
  
  if (!potteryName.value.trim()) {
    ElMessage.warning('请输入器型名称')
    return
  }
  
  try {
    const data = {
      name: potteryName.value.trim(),
      profilePoints: JSON.stringify(profilePoints.value),
      rotationSegments: rotationSegments.value,
      smoothness: smoothness.value,
      userId: 1
    }
    
    savedPotteryId.value = await saveUserPottery(data)
    ElMessage.success('保存成功，ID: ' + savedPotteryId.value)
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

const generateShareLink = async () => {
  if (!savedPotteryId.value) {
    ElMessage.warning('请先保存器型')
    return
  }
  
  isGeneratingShare.value = true
  
  try {
    const shareCode = await createShare({
      potteryId: savedPotteryId.value,
      potteryType: 'user',
      validDays: shareValidDays.value
    })
    
    const baseUrl = window.location.origin
    shareLink.value = `${baseUrl}/share/${shareCode}`
    
    ElMessage.success('分享链接已生成')
  } catch (error) {
    console.error('生成分享链接失败:', error)
    ElMessage.error('生成失败')
  } finally {
    isGeneratingShare.value = false
  }
}

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

const clearAll = async () => {
  try {
    await ElMessageBox.confirm('确定要重置所有数据吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    potteryStore.clearProfilePoints()
    potteryStore.clearCompare()
    potteryStore.setCurrentPotteryName('')
    potteryName.value = ''
    savedPotteryId.value = null
    shareLink.value = ''
    localRotationSegments.value = 64
    localSmoothness.value = 0.5
    
    potteryStore.setRotationSegments(64)
    potteryStore.setSmoothness(0.5)
    potteryStore.setGlazeType('celadon')
    
    ElMessage.success('已重置')
  } catch {
  }
}
</script>

<style scoped>
.control-panel {
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
}

:deep(.el-tab-pane) {
  height: 100%;
}

.panel-section {
  padding: 20px;
}

.panel-section h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}

.slider-container {
  padding: 0 10px;
}

.classic-list {
  max-height: 400px;
  overflow-y: auto;
}

.classic-item {
  padding: 12px;
  margin-bottom: 10px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #eee;
}

.classic-info {
  margin-bottom: 10px;
}

.classic-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.classic-type {
  display: inline-block;
  padding: 2px 8px;
  background: #e8f4ff;
  color: #409EFF;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 4px;
}

.classic-desc {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.classic-actions {
  display: flex;
  gap: 10px;
}

.action-buttons {
  margin-bottom: 20px;
}

.compare-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.share-form {
  padding: 10px 0;
}

.glaze-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.glaze-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.glaze-item:hover {
  border-color: #409EFF;
  transform: translateY(-2px);
}

.glaze-item.active {
  border-color: #409EFF;
  background: rgba(64, 158, 255, 0.05);
}

.glaze-color {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #ddd;
  margin-bottom: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.glaze-name {
  font-size: 12px;
  color: #666;
}

.glaze-item.active .glaze-name {
  color: #409EFF;
  font-weight: bold;
}
</style>
