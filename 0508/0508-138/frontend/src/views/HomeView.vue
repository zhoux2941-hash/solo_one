<template>
  <div class="page-container">
    <div class="hero-section">
      <h1>🔬 在线矿物鉴定辅助工具</h1>
      <p>输入矿物特征，AI 帮您快速识别可能的矿物种类</p>
    </div>

    <div class="nav-tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="矿物鉴定" name="identification">
          <template #label>
            <span class="tab-label">
              <el-icon><Search /></el-icon>
              矿物鉴定
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="酸碱反应" name="acid-reaction">
          <template #label>
            <span class="tab-label">
              <el-icon><Experiment /></el-icon>
              酸碱反应模拟
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :md="10">
        <div class="card-container" style="padding: 24px;">
          <h3 class="section-title">输入矿物特征</h3>
          
          <el-form :model="form" label-width="80px">
            <el-form-item label="摩氏硬度">
              <div class="slider-label">
                <span>硬度等级 (1-10)</span>
                <span class="slider-value">{{ form.hardness }}</span>
              </div>
              <el-slider
                v-model="form.hardness"
                :min="1"
                :max="10"
                :step="0.5"
                :marks="hardnessMarks"
                show-input
                show-input-controls
                input-size="small"
              />
            </el-form-item>

            <el-form-item label="条痕色">
              <el-select
                v-model="form.streak"
                placeholder="请选择条痕色"
                style="width: 100%;"
                clearable
              >
                <el-option
                  v-for="(label, value) in featureOptions?.streaks"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="光泽">
              <el-select
                v-model="form.luster"
                placeholder="请选择光泽类型"
                style="width: 100%;"
                clearable
              >
                <el-option
                  v-for="(label, value) in featureOptions?.lusters"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="解理">
              <el-select
                v-model="form.cleavage"
                placeholder="请选择解理类型"
                style="width: 100%;"
                clearable
              >
                <el-option
                  v-for="(label, value) in featureOptions?.cleavages"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>

            <el-alert
              v-if="filledFeaturesCount < 2"
              :title="filledFeaturesCount === 0 ? '💡 请填写特征参数开始鉴定' : '⚠️ 特征参数较少，建议补充更多特征'"
              :type="filledFeaturesCount === 0 ? 'info' : 'warning'"
              show-icon
              :closable="false"
              style="margin-bottom: 16px;"
            >
              <template #default>
                <span v-if="filledFeaturesCount === 0">
                  填写摩氏硬度、条痕色、光泽、解理等特征，系统将为您推荐最匹配的矿物。
                </span>
                <span v-else>
                  已填写 {{ filledFeaturesCount }} 个特征。建议填写至少2-3个特征以获得更准确的鉴定结果。
                  <br>
                  <strong>最佳组合</strong>：硬度 + 条痕色 + 光泽（准确率最高）
                </span>
              </template>
            </el-alert>

            <el-form-item>
              <el-button
                type="primary"
                @click="handleIdentify"
                :loading="mineralStore.loading"
                style="width: 100%;"
                size="large"
                class="confirm-btn"
              >
                <el-icon style="margin-right: 5px;"><Search /></el-icon>
                开始鉴定
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <el-col :xs="24" :md="14">
        <div class="card-container" style="padding: 24px;">
          <h3 class="section-title">鉴定结果</h3>
          
          <template v-if="mineralStore.loading">
            <el-skeleton :rows="10" animated />
          </template>

          <template v-else-if="mineralStore.identificationResults.length === 0">
            <el-empty description="请输入特征参数进行鉴定">
              <template #image>
                <el-icon :size="60" style="color: #c0c4cc;">
                  <Search />
                </el-icon>
              </template>
            </el-empty>
          </template>

          <template v-else>
            <el-alert
              v-if="mineralStore.lastQuery && filledFeaturesCount < 3"
              title="鉴定结果说明"
              type="info"
              show-icon
              :closable="false"
              style="margin-bottom: 16px;"
            >
              <template #default>
                您填写了 {{ filledFeaturesCount }} 个特征，鉴定结果的置信度可能有限。
                <br>
                <strong>建议</strong>：补充条痕色、光泽或解理等特征，可以显著提高鉴定准确性。
              </template>
            </el-alert>
            <div v-for="(mineral, index) in mineralStore.identificationResults" :key="mineral.id">
              <el-card class="result-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span style="font-weight: bold; font-size: 16px;">
                      <el-tag :type="getRankType(index)" style="margin-right: 8px;">
                        {{ index + 1 }}
                      </el-tag>
                      {{ mineral.nameCn }} ({{ mineral.name }})
                    </span>
                    <span style="color: #667eea; font-weight: bold;">
                      {{ mineral.matchPercentage }}
                    </span>
                  </div>
                </template>

                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-image
                      class="mineral-image"
                      :src="mineral.imageUrl"
                      fit="cover"
                      :preview-src-list="[mineral.imageUrl]"
                    >
                      <template #error>
                        <div class="image-slot">
                          <el-icon :size="30"><Picture /></el-icon>
                        </div>
                      </template>
                    </el-image>
                  </el-col>

                  <el-col :span="16">
                    <el-descriptions :column="1" border size="small">
                      <el-descriptions-item label="化学式">
                        {{ mineral.chemicalFormula || '-' }}
                      </el-descriptions-item>
                      <el-descriptions-item label="典型产地">
                        {{ mineral.typicalLocation || '-' }}
                      </el-descriptions-item>
                      <el-descriptions-item label="描述">
                        {{ mineral.description || '-' }}
                      </el-descriptions-item>
                    </el-descriptions>

                    <div style="margin-top: 12px;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 12px; color: #909399;">匹配度</span>
                        <span style="font-size: 12px; color: #667eea;">{{ mineral.matchPercentage }}</span>
                      </div>
                      <div style="background: #f0f2f5; border-radius: 4px; height: 8px; overflow: hidden;">
                        <div 
                          class="match-bar" 
                          :style="{ width: Math.min(mineral.matchScore, 100) + '%' }"
                        ></div>
                      </div>
                    </div>

                    <el-button
                      type="primary"
                      size="small"
                      @click="handleConfirm(mineral.id)"
                      style="margin-top: 12px;"
                      class="confirm-btn"
                    >
                      <el-icon style="margin-right: 5px;"><Check /></el-icon>
                      确认是这种矿物
                    </el-button>
                  </el-col>
                </el-row>
              </el-card>
            </div>
          </template>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="showTips" title="使用说明" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="摩氏硬度">
          1-10 级，1为最软（滑石），10为最硬（金刚石）。可使用指甲（约2.5）、铜片（约3）、钢刀（约5.5）、玻璃（约6）来测试。
        </el-descriptions-item>
        <el-descriptions-item label="条痕色">
          矿物在未上釉的瓷板上摩擦留下的粉末颜色，比矿物本身颜色更稳定。
        </el-descriptions-item>
        <el-descriptions-item label="光泽">
          矿物表面对可见光反射的能力，常见的有金属光泽、玻璃光泽、油脂光泽等。
        </el-descriptions-item>
        <el-descriptions-item label="解理">
          矿物受外力作用后沿一定结晶方向破裂成光滑平面的性质。
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="showTips = false">知道了</el-button>
      </template>
    </el-dialog>

    <el-float-button
      icon="QuestionFilled"
      @click="showTips = true"
      style="right: 20px; bottom: 20px;"
      type="primary"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMineralStore } from '../store/mineral'

const mineralStore = useMineralStore()
const router = useRouter()

const activeTab = ref('identification')
const showTips = ref(false)
const showFeatureWarning = ref(false)

const handleTabChange = (tabName) => {
  if (tabName === 'acid-reaction') {
    router.push('/acid-reaction')
  }
}

const form = reactive({
  hardness: 5,
  streak: '',
  luster: '',
  cleavage: ''
})

const featureOptions = ref(null)

const hardnessMarks = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10'
}

const filledFeaturesCount = computed(() => {
  let count = 0
  if (form.hardness != null) count++
  if (form.streak) count++
  if (form.luster) count++
  if (form.cleavage) count++
  return count
})

const getRankType = (index) => {
  if (index === 0) return 'danger'
  if (index === 1) return 'warning'
  if (index === 2) return 'success'
  return 'info'
}

const getFeatureWarningText = () => {
  const count = filledFeaturesCount.value
  if (count === 1) {
    return '⚠️ 建议填写至少2-3个特征以获得更准确的鉴定结果。目前只填写了1个特征，匹配结果可能不够精确。'
  } else if (count === 2) {
    return '💡 填写更多特征（如光泽、解理）可以进一步提高鉴定的准确性。'
  }
  return ''
}

const handleIdentify = async () => {
  try {
    const params = {}
    
    if (form.hardness != null) {
      params.hardness = form.hardness
    }
    if (form.streak) {
      params.streak = form.streak
    }
    if (form.luster) {
      params.luster = form.luster
    }
    if (form.cleavage) {
      params.cleavage = form.cleavage
    }
    
    if (Object.keys(params).length === 0) {
      ElMessage.warning('请至少输入一个特征参数')
      return
    }
    
    if (Object.keys(params).length < 2) {
      const shouldContinue = await ElMessageBox.confirm(
        '您只填写了1个特征参数，鉴定结果可能不够准确。建议填写至少2-3个特征（如硬度+条痕色+光泽）。\n\n是否继续鉴定？',
        '特征参数不足',
        {
          confirmButtonText: '继续鉴定',
          cancelButtonText: '补充特征',
          type: 'warning',
          distinguishCancelAndClose: true
        }
      ).catch(() => null)
      
      if (shouldContinue !== 'confirm') {
        return
      }
    }
    
    await mineralStore.identifyMinerals(params)
    
    if (mineralStore.identificationResults.length === 0) {
      ElMessage.info('没有找到匹配的矿物，请尝试调整参数')
    } else {
      ElMessage.success(`找到 ${mineralStore.identificationResults.length} 种可能的矿物`)
    }
  } catch (error) {
    console.error('鉴定失败:', error)
  }
}

const handleConfirm = async (mineralId) => {
  const mineral = mineralStore.identificationResults.find(m => m.id === mineralId)
  if (!mineral) return
  
  try {
    await ElMessageBox.confirm(
      `您确认这是「${mineral.nameCn}」吗？确认后将帮助系统改进未来的鉴定结果。`,
      '确认鉴定',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await mineralStore.confirmIdentification(mineralId)
    ElMessage.success('感谢您的反馈！系统已记录您的确认信息')
  } catch (action) {
    if (action !== 'cancel') {
      console.error('确认失败:', action)
    }
  }
}

onMounted(async () => {
  try {
    featureOptions.value = await mineralStore.getFeatureOptions()
  } catch (error) {
    console.error('加载选项失败:', error)
    ElMessage.error('加载特征选项失败，请刷新页面重试')
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 150px;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
  border-radius: 8px;
}
</style>
