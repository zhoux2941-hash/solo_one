<template>
  <div class="observation-page">
    <el-card class="page-header-card">
      <div class="header-content">
        <h2>观测记录</h2>
        <p>记录变星观测，使用参考星进行亮度估计</p>
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="observation-form-card">
          <template #header>
            <div class="card-header">
              <span>新建观测记录</span>
            </div>
          </template>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="120px"
          >
            <el-form-item label="选择变星" prop="variableStarId">
              <el-select
                v-model="form.variableStarId"
                placeholder="请选择要观测的变星"
                style="width: 100%"
                @change="handleStarChange"
              >
                <el-option
                  v-for="star in starList"
                  :key="star.id"
                  :label="`${star.name} (${star.constellation})`"
                  :value="star.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="观测时间" prop="observationTime">
              <el-date-picker
                v-model="form.observationTime"
                type="datetime"
                placeholder="选择观测时间"
                style="width: 100%"
                :default-time="new Date()"
              />
            </el-form-item>

            <el-form-item label="观测者" prop="observerName">
              <el-input
                v-model="form.observerName"
                placeholder="输入观测者名称"
              />
            </el-form-item>

            <el-divider content-position="left">亮度比较（插值法）</el-divider>

            <el-alert
              title="亮度比较说明"
              type="info"
              :closable="false"
              show-icon
              class="info-alert"
            >
              <template #default>
                <p>与参考星A比较：正值表示比A暗（星等更大），负值表示比A亮</p>
                <p>与参考星B比较：正值表示比B暗，负值表示比B亮</p>
                <p>例如："比A暗0.3等，比B亮0.2等" 应输入 comparisonA=0.3, comparisonB=-0.2</p>
              </template>
            </el-alert>

            <el-form-item label="参考星A" prop="referenceStarAId">
              <el-select
                v-model="form.referenceStarAId"
                placeholder="选择参考星A"
                style="width: 100%"
                :disabled="!form.variableStarId"
              >
                <el-option
                  v-for="ref in referenceStars"
                  :key="ref.id"
                  :label="`${ref.name} (V=${ref.magnitude})`"
                  :value="ref.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="与A比较(等)" prop="comparisonA">
              <el-input-number
                v-model="form.comparisonA"
                :min="-5"
                :max="5"
                :step="0.1"
                :precision="2"
                style="width: 100%"
                placeholder="正值：比A暗；负值：比A亮"
              />
            </el-form-item>

            <el-form-item label="参考星B" prop="referenceStarBId">
              <el-select
                v-model="form.referenceStarBId"
                placeholder="选择参考星B"
                style="width: 100%"
                :disabled="!form.variableStarId"
              >
                <el-option
                  v-for="ref in referenceStars"
                  :key="ref.id"
                  :label="`${ref.name} (V=${ref.magnitude})`"
                  :value="ref.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="与B比较(等)" prop="comparisonB">
              <el-input-number
                v-model="form.comparisonB"
                :min="-5"
                :max="5"
                :step="0.1"
                :precision="2"
                style="width: 100%"
                placeholder="正值：比B暗；负值：比B亮"
              />
            </el-form-item>

            <el-divider content-position="left">其他信息</el-divider>

            <el-form-item label="观测方法" prop="observationMethod">
              <el-select
                v-model="form.observationMethod"
                placeholder="选择观测方法"
                style="width: 100%"
              >
                <el-option label="肉眼估计" value="目视" />
                <el-option label="单反摄影" value="单反" />
                <el-option label="CCD摄影" value="CCD" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>

            <el-form-item label="使用仪器" prop="instrument">
              <el-input
                v-model="form.instrument"
                placeholder="如：8寸望远镜、Canon 6D等"
              />
            </el-form-item>

            <el-form-item label="天空条件" prop="skyConditions">
              <el-select
                v-model="form.skyConditions"
                placeholder="选择天空条件"
                style="width: 100%"
              >
                <el-option label="极好 (透明+无云)" value="极好" />
                <el-option label="良好 (少云)" value="良好" />
                <el-option label="一般 (有薄云)" value="一般" />
                <el-option label="较差 (多云或有月光)" value="较差" />
              </el-select>
            </el-form-item>

            <el-form-item label="备注" prop="notes">
              <el-input
                v-model="form.notes"
                type="textarea"
                :rows="3"
                placeholder="输入观测备注"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitForm" :loading="submitting">
                <el-icon><Check /></el-icon>
                提交观测
              </el-button>
              <el-button @click="resetForm">
                <el-icon><RefreshRight /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="preview-card" v-if="form.variableStarId">
          <template #header>
            <div class="card-header">
              <span>估算预览</span>
              <el-tag type="warning" v-if="canPreview">实时计算</el-tag>
            </div>
          </template>

          <div v-if="canPreview" class="preview-content">
            <el-alert
              v-if="consistencyLevel !== '极好' && consistencyLevel !== '良好'"
              :title="consistencyWarning"
              :type="consistencyAlertType"
              :closable="false"
              show-icon
              class="consistency-alert"
            >
              <template #default>
                <p v-if="consistencySuggestion">{{ consistencySuggestion }}</p>
                <p class="consistency-detail">
                  参考星A估算: <strong>{{ estimateFromA.toFixed(2) }}</strong> 等 | 
                  参考星B估算: <strong>{{ estimateFromB.toFixed(2) }}</strong> 等 | 
                  差异: <strong>{{ estimateDifference.toFixed(3) }}</strong> 等
                </p>
              </template>
            </el-alert>

            <el-descriptions :column="1" border>
              <el-descriptions-item label="变星">
                {{ selectedStarInfo?.name }}
              </el-descriptions-item>
              <el-descriptions-item label="一致性评估">
                <el-tag :type="consistencyTagType" size="large">
                  {{ consistencyLevel }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="参考星A">
                {{ refAInfo?.name }} (V={{ refAInfo?.magnitude }})
              </el-descriptions-item>
              <el-descriptions-item label="基于A的估算">
                <span class="estimate-value">{{ estimateFromA.toFixed(2) }} 等</span>
                <span class="weight-info" v-if="weightA < 0.8">
                  (权重: {{ (weightA * 100).toFixed(0) }}%)
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="参考星B">
                {{ refBInfo?.name }} (V={{ refBInfo?.magnitude }})
              </el-descriptions-item>
              <el-descriptions-item label="基于B的估算">
                <span class="estimate-value">{{ estimateFromB.toFixed(2) }} 等</span>
                <span class="weight-info" v-if="weightB < 0.8">
                  (权重: {{ (weightB * 100).toFixed(0) }}%)
                </span>
              </el-descriptions-item>
            </el-descriptions>

            <div class="magnitude-result">
              <div class="result-box">
                <div class="result-label">加权估算星等</div>
                <div class="result-value">{{ estimatedMagnitude.toFixed(2) }}</div>
                <div class="result-unit">mag</div>
              </div>
              <div class="result-box" :class="'error-box ' + consistencyBoxClass">
                <div class="result-label">估算误差</div>
                <div class="result-value">±{{ estimatedError.toFixed(2) }}</div>
                <div class="result-unit">mag</div>
              </div>
            </div>

            <div class="analysis-notes">
              <el-tag :type="consistencyTagType" effect="dark" class="level-tag">
                {{ consistencyLevel }}
              </el-tag>
              <p class="analysis-text">{{ consistencyDescription }}</p>
              <p v-if="weightA < 0.7 || weightB < 0.7" class="warning-text">
                ⚠️ 注意：某一参考星的估算可信度较低，可能存在星等数据问题或比较值偏大
              </p>
            </div>
          </div>

          <el-empty v-else description="请选择变星和参考星，输入比较值以预览估算结果" />
        </el-card>

        <el-card class="history-card">
          <template #header>
            <div class="card-header">
              <span>历史观测记录</span>
              <el-select
                v-model="historyStarFilter"
                placeholder="筛选变星"
                clearable
                style="width: 200px"
                size="small"
                @change="loadHistory"
              >
                <el-option
                  v-for="star in starList"
                  :key="star.id"
                  :label="star.name"
                  :value="star.id"
                />
              </el-select>
            </div>
          </template>

          <el-table :data="historyRecords" stripe style="max-height: 400px; overflow-y: auto;">
            <el-table-column prop="starName" label="变星" width="120" />
            <el-table-column label="观测时间" width="150">
              <template #default="{ row }">
                {{ formatDate(row.observationTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="estimatedMagnitude" label="估算星等" width="100">
              <template #default="{ row }">
                <span class="mag-value">{{ row.estimatedMagnitude }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="phase" label="相位" width="80" />
            <el-table-column prop="observerName" label="观测者" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getStarList, getStarDetail } from '@/api/stars'
import { createObservation, getObservationsByStar } from '@/api/observations'

const formRef = ref(null)
const submitting = ref(false)
const starList = ref([])
const referenceStars = ref([])
const selectedStarInfo = ref(null)
const historyRecords = ref([])
const historyStarFilter = ref(null)

const form = ref({
  variableStarId: null,
  observationTime: new Date(),
  observerName: '',
  referenceStarAId: null,
  referenceStarBId: null,
  comparisonA: 0,
  comparisonB: 0,
  observationMethod: '',
  instrument: '',
  skyConditions: '',
  notes: ''
})

const rules = {
  variableStarId: [{ required: true, message: '请选择变星', trigger: 'change' }],
  observationTime: [{ required: true, message: '请选择观测时间', trigger: 'change' }],
  referenceStarAId: [{ required: true, message: '请选择参考星A', trigger: 'change' }],
  referenceStarBId: [{ required: true, message: '请选择参考星B', trigger: 'change' }],
  comparisonA: [
    { required: true, message: '请输入与参考星A的比较值', trigger: 'blur' }
  ],
  comparisonB: [
    { required: true, message: '请输入与参考星B的比较值', trigger: 'blur' }
  ]
}

const refAInfo = computed(() => {
  return referenceStars.value.find(r => r.id === form.value.referenceStarAId)
})

const refBInfo = computed(() => {
  return referenceStars.value.find(r => r.id === form.value.referenceStarBId)
})

const canPreview = computed(() => {
  return refAInfo.value && refBInfo.value && 
         form.value.comparisonA !== null && 
         form.value.comparisonB !== null
})

const estimateFromA = computed(() => {
  if (!canPreview.value) return 0
  return refAInfo.value.magnitude + form.value.comparisonA
})

const estimateFromB = computed(() => {
  if (!canPreview.value) return 0
  return refBInfo.value.magnitude - form.value.comparisonB
})

const estimateDifference = computed(() => {
  return Math.abs(estimateFromA.value - estimateFromB.value)
})

const weightA = computed(() => {
  if (!canPreview.value) return 0.5
  
  let weight = 1.0
  const absCompA = Math.abs(form.value.comparisonA)
  const maxReliable = 1.0
  
  if (absCompA > maxReliable) {
    const excess = absCompA - maxReliable
    weight *= Math.exp(-0.3 * excess)
  }
  
  if (selectedStarInfo.value && 
      selectedStarInfo.value.maxMagnitude !== null && 
      selectedStarInfo.value.minMagnitude !== null) {
    const maxMag = selectedStarInfo.value.maxMagnitude
    const minMag = selectedStarInfo.value.minMagnitude
    
    if (estimateFromA.value < maxMag - 0.3) {
      const deviation = (maxMag - 0.3) - estimateFromA.value
      weight *= Math.exp(-0.5 * deviation)
    } else if (estimateFromA.value > minMag + 0.3) {
      const deviation = estimateFromA.value - (minMag + 0.3)
      weight *= Math.exp(-0.5 * deviation)
    }
  }
  
  return Math.max(weight, 0.1)
})

const weightB = computed(() => {
  if (!canPreview.value) return 0.5
  
  let weight = 1.0
  const absCompB = Math.abs(form.value.comparisonB)
  const maxReliable = 1.0
  
  if (absCompB > maxReliable) {
    const excess = absCompB - maxReliable
    weight *= Math.exp(-0.3 * excess)
  }
  
  if (selectedStarInfo.value && 
      selectedStarInfo.value.maxMagnitude !== null && 
      selectedStarInfo.value.minMagnitude !== null) {
    const maxMag = selectedStarInfo.value.maxMagnitude
    const minMag = selectedStarInfo.value.minMagnitude
    
    if (estimateFromB.value < maxMag - 0.3) {
      const deviation = (maxMag - 0.3) - estimateFromB.value
      weight *= Math.exp(-0.5 * deviation)
    } else if (estimateFromB.value > minMag + 0.3) {
      const deviation = estimateFromB.value - (minMag + 0.3)
      weight *= Math.exp(-0.5 * deviation)
    }
  }
  
  return Math.max(weight, 0.1)
})

const estimatedMagnitude = computed(() => {
  if (!canPreview.value) return 0
  
  const totalWeight = weightA.value + weightB.value
  const normWeightA = weightA.value / totalWeight
  const normWeightB = weightB.value / totalWeight
  
  return estimateFromA.value * normWeightA + estimateFromB.value * normWeightB
})

const estimatedError = computed(() => {
  if (!canPreview.value) return 0
  
  const cA = Math.abs(form.value.comparisonA)
  const cB = Math.abs(form.value.comparisonB)
  const diff = estimateDifference.value
  
  const visualError = 0.15
  const comparisonError = (cA + cB) * 0.1
  const baseError = Math.sqrt(visualError * visualError + comparisonError * comparisonError)
  
  let consistencyPenalty = 0
  if (diff > 0.4) {
    consistencyPenalty = Math.min(0.3 + (diff - 0.4) * 0.5, 0.5)
  } else if (diff > 0.2) {
    consistencyPenalty = 0.15
  } else if (diff > 0.1) {
    consistencyPenalty = 0.05
  }
  
  let rangePenalty = 0
  if (selectedStarInfo.value && 
      selectedStarInfo.value.maxMagnitude !== null && 
      selectedStarInfo.value.minMagnitude !== null) {
    const maxMag = selectedStarInfo.value.maxMagnitude
    const minMag = selectedStarInfo.value.minMagnitude
    const estimate = estimatedMagnitude.value
    
    if (estimate > minMag + 0.5) {
      rangePenalty += (estimate - minMag - 0.5) * 0.3
    }
    if (estimate < maxMag - 0.5) {
      rangePenalty += (maxMag - 0.5 - estimate) * 0.3
    }
  }
  
  const totalError = Math.sqrt(
    baseError * baseError + 
    consistencyPenalty * consistencyPenalty + 
    Math.max(0, rangePenalty) * Math.max(0, rangePenalty)
  )
  
  return Math.min(totalError, 0.8)
})

const consistencyLevel = computed(() => {
  if (!canPreview.value) return '未评估'
  
  const diff = estimateDifference.value
  if (diff <= 0.10) return '极好'
  if (diff <= 0.20) return '良好'
  if (diff <= 0.40) return '一般'
  return '较差'
})

const consistencyDescription = computed(() => {
  switch (consistencyLevel.value) {
    case '极好': return '两个参考星的估算结果高度一致'
    case '良好': return '估算结果在合理范围内'
    case '一般': return '存在一定偏差，建议复核'
    case '较差': return '偏差较大，请检查参考星选择'
    default: return ''
  }
})

const consistencyTagType = computed(() => {
  switch (consistencyLevel.value) {
    case '极好': return 'success'
    case '良好': return 'primary'
    case '一般': return 'warning'
    case '较差': return 'danger'
    default: return 'info'
  }
})

const consistencyAlertType = computed(() => {
  switch (consistencyLevel.value) {
    case '一般': return 'warning'
    case '较差': return 'error'
    default: return 'info'
  }
})

const consistencyBoxClass = computed(() => {
  switch (consistencyLevel.value) {
    case '较差': return 'error-box-danger'
    case '一般': return 'error-box-warning'
    default: return ''
  }
})

const consistencyWarning = computed(() => {
  switch (consistencyLevel.value) {
    case '一般':
      return `估算结果差异为 ${estimateDifference.value.toFixed(2)} 等，可能存在参考星数据问题`
    case '较差':
      return `警告：两个参考星的估算结果差异较大 (${estimateDifference.value.toFixed(2)} 等)，请检查参考星选择或星等数据`
    default:
      return ''
  }
})

const consistencySuggestion = computed(() => {
  if (consistencyLevel.value === '极好' || consistencyLevel.value === '良好') {
    return '估算结果一致性良好，可以信任'
  }
  
  let suggestion = ''
  
  if (weightA.value < weightB.value * 0.7) {
    suggestion += `基于参考星A的估算 (${estimateFromA.value.toFixed(2)}) 可信度较低，建议复核与参考星A的比较。`
  } else if (weightB.value < weightA.value * 0.7) {
    suggestion += `基于参考星B的估算 (${estimateFromB.value.toFixed(2)}) 可信度较低，建议复核与参考星B的比较。`
  }
  
  if (consistencyLevel.value === '较差') {
    suggestion += ' 建议：1) 检查两颗参考星的星表数据是否准确；2) 重新进行亮度比较；3) 考虑选择其他参考星进行交叉验证。'
  } else if (consistencyLevel.value === '一般') {
    suggestion += ' 建议复核观测记录，或增加更多参考星进行验证。'
  }
  
  return suggestion
})

const loadStars = async () => {
  try {
    starList.value = await getStarList({})
  } catch (e) {
    console.error('加载变星列表失败')
  }
}

const handleStarChange = async (starId) => {
  if (starId) {
    try {
      const detail = await getStarDetail(starId)
      selectedStarInfo.value = detail.variableStar
      referenceStars.value = detail.referenceStars
    } catch (e) {
      ElMessage.error('加载参考星失败')
    }
  }
}

const loadHistory = async () => {
  try {
    let records = []
    if (historyStarFilter.value) {
      records = await getObservationsByStar(historyStarFilter.value)
    } else {
      for (const star of starList.value) {
        const starRecords = await getObservationsByStar(star.id)
        records = [...records, ...starRecords]
      }
    }
    historyRecords.value = records
      .sort((a, b) => new Date(b.observationTime) - new Date(a.observationTime))
      .slice(0, 20)
  } catch (e) {
    console.error('加载历史记录失败')
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const data = {
      ...form.value,
      observationTime: form.value.observationTime.toISOString()
    }
    
    const result = await createObservation(data)
    
    ElMessage.success({
      message: `观测记录已保存！估算星等: ${result.estimatedMagnitude} ± ${result.magnitudeError} mag`,
      duration: 5000
    })
    
    loadHistory()
    resetForm()
    
  } catch (e) {
    if (e !== false) {
      ElMessage.error('提交观测记录失败')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  form.value.observationTime = new Date()
  form.value.comparisonA = 0
  form.value.comparisonB = 0
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadStars()
  loadHistory()
})

watch([() => form.value.variableStarId], () => {
  form.value.referenceStarAId = null
  form.value.referenceStarBId = null
})
</script>

<style scoped>
.observation-page {
  padding: 10px;
}

.page-header-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
  border: none;
}

.page-header-card :deep(.el-card__body) {
  padding: 20px;
}

.page-header-card h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.page-header-card p {
  margin: 0;
  opacity: 0.9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.observation-form-card,
.preview-card,
.history-card {
  margin-bottom: 20px;
}

.info-alert {
  margin-bottom: 20px;
}

.info-alert p {
  margin: 4px 0;
  font-size: 12px;
}

.preview-content {
  margin-top: 10px;
}

.magnitude-result {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.result-box {
  flex: 1;
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: #fff;
}

.error-box {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.error-box-warning {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%) !important;
}

.error-box-danger {
  background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%) !important;
}

.result-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.result-value {
  font-size: 36px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.result-unit {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 4px;
}

.mag-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #667eea;
}

.consistency-alert {
  margin-bottom: 15px;
}

.consistency-detail {
  margin-top: 8px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.3);
  padding: 8px;
  border-radius: 4px;
}

.consistency-detail strong {
  font-family: 'Courier New', monospace;
}

.estimate-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #667eea;
  font-size: 15px;
}

.weight-info {
  font-size: 12px;
  color: #f56c6c;
  margin-left: 8px;
  font-style: italic;
}

.analysis-notes {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.level-tag {
  margin-bottom: 10px;
}

.analysis-text {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #606266;
}

.warning-text {
  margin: 0;
  font-size: 12px;
  color: #f56c6c;
  font-weight: 500;
}
</style>
