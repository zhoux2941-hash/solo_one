<template>
  <div class="forecast-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="form-card">
          <template #header>
            <div class="card-header">
              <el-icon><Edit /></el-icon>
              <span>灾害参数设置</span>
            </div>
          </template>
          <el-form :model="form" label-width="120px" :rules="rules" ref="formRef">
            <el-form-item label="灾害类型" prop="disasterType">
              <el-select v-model="form.disasterType" placeholder="请选择灾害类型" style="width: 100%">
                <el-option label="洪水" value="FLOOD" />
                <el-option label="地震" value="EARTHQUAKE" />
                <el-option label="火灾" value="FIRE" />
                <el-option label="山体滑坡" value="LANDSLIDE" />
              </el-select>
            </el-form-item>
            <el-form-item label="灾害强度" prop="disasterIntensity">
              <el-slider v-model="form.disasterIntensity" :min="1" :max="5" :marks="intensityMarks" />
              <div class="intensity-hint">当前强度: {{ intensityText }}</div>
            </el-form-item>
            <el-form-item label="受灾人口" prop="affectedPopulation">
              <el-input-number v-model="form.affectedPopulation" :min="100" :max="1000000" :step="1000" style="width: 100%" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="calculate" :loading="loading" style="width: 100%">
                <el-icon><Search /></el-icon>
                <span>计算需求</span>
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card class="result-card" v-if="result">
          <template #header>
            <div class="card-header">
              <el-icon><DataLine /></el-icon>
              <span>预测结果</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6" v-for="item in supplyItems" :key="item.key">
              <div class="supply-item">
                <div class="supply-icon" :style="{ background: item.color }">
                  <el-icon :size="28">{{ item.icon }}</el-icon>
                </div>
                <div class="supply-info">
                  <div class="supply-label">{{ item.label }}</div>
                  <div class="supply-value">{{ result[item.key]?.toLocaleString() || 0 }}</div>
                  <div class="supply-unit">{{ item.unit }}</div>
                </div>
              </div>
            </el-col>
          </el-row>
          <el-divider />
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
        <el-card class="empty-card" v-else>
          <el-empty description="请填写灾害参数并点击计算需求">
            <el-icon :size="80" color="#909399"><DataAnalysis /></el-icon>
          </el-empty>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { calculateForecast } from '@/api'
import { ElMessage } from 'element-plus'

const formRef = ref(null)
const chartRef = ref(null)
let chartInstance = null

const form = ref({
  disasterType: '',
  disasterIntensity: 3,
  affectedPopulation: 10000
})

const result = ref(null)
const loading = ref(false)

const rules = {
  disasterType: [{ required: true, message: '请选择灾害类型', trigger: 'change' }],
  disasterIntensity: [{ required: true, message: '请选择灾害强度', trigger: 'change' }],
  affectedPopulation: [{ required: true, message: '请输入受灾人口', trigger: 'blur' }]
}

const intensityMarks = {
  1: '轻微',
  2: '中等',
  3: '严重',
  4: '重大',
  5: '特大'
}

const intensityText = computed(() => intensityMarks[form.value.disasterIntensity])

const supplyItems = [
  { key: 'tentQuantity', label: '帐篷', unit: '顶', icon: 'House', color: '#409EFF' },
  { key: 'waterQuantity', label: '饮用水', unit: '升', icon: 'CoffeeCup', color: '#67C23A' },
  { key: 'foodQuantity', label: '食物', unit: '份', icon: 'ForkSpoon', color: '#E6A23C' },
  { key: 'medicalKitQuantity', label: '医疗包', unit: '个', icon: 'FirstAidKit', color: '#F56C6C' }
]

const calculate = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const data = await calculateForecast(form.value)
        result.value = data
        await nextTick()
        renderChart()
        ElMessage.success('预测计算完成')
      } catch (error) {
        console.error('计算失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

const renderChart = () => {
  if (!chartRef.value || !result.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['需求量'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['帐篷', '饮用水', '食物', '医疗包']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value) => {
          if (value >= 10000) return (value / 10000).toFixed(1) + '万'
          return value
        }
      }
    },
    series: [{
      name: '需求量',
      type: 'bar',
      data: [
        { value: result.value.tentQuantity, itemStyle: { color: '#409EFF' } },
        { value: result.value.waterQuantity, itemStyle: { color: '#67C23A' } },
        { value: result.value.foodQuantity, itemStyle: { color: '#E6A23C' } },
        { value: result.value.medicalKitQuantity, itemStyle: { color: '#F56C6C' } }
      ],
      label: {
        show: true,
        position: 'top',
        formatter: (params) => params.value.toLocaleString()
      },
      barWidth: '50%'
    }]
  }
  
  chartInstance.setOption(option)
  
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

onMounted(() => {
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})
</script>

<style scoped>
.forecast-page {
  padding: 0;
}

.form-card, .result-card, .empty-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.intensity-hint {
  text-align: center;
  color: #909399;
  font-size: 14px;
  margin-top: 8px;
}

.supply-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.supply-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.supply-info {
  flex: 1;
}

.supply-label {
  color: #909399;
  font-size: 14px;
}

.supply-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.supply-unit {
  color: #c0c4cc;
  font-size: 12px;
}

.chart-container {
  height: 350px;
  width: 100%;
}
</style>
