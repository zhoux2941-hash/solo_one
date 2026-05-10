<template>
  <div class="valuation-panel">
    <div class="panel-header">
      <h4>价格参考</h4>
    </div>
    
    <div class="stats-row" v-if="valuationStats">
      <div class="stat-card" v-if="valuationStats.count > 0">
        <div class="stat-label">用户估价平均</div>
        <div class="stat-value">¥{{ valuationStats.averagePrice || '-' }}</div>
        <div class="stat-desc">共 {{ valuationStats.count }} 人估价</div>
      </div>
      <div class="stat-card" v-if="valuationStats.seriesCount > 0">
        <div class="stat-label">同款式平均</div>
        <div class="stat-value">¥{{ valuationStats.seriesAveragePrice || '-' }}</div>
        <div class="stat-desc">{{ valuationStats.seriesName }} - {{ valuationStats.styleName }}</div>
      </div>
    </div>
    
    <el-divider v-if="isLoggedIn"></el-divider>
    
    <div v-if="isLoggedIn" class="valuation-form">
      <div class="form-header">
        <span>我的估价</span>
        <span class="tip" v-if="myValuation">
          上次估价: ¥{{ myValuation.price }}
        </span>
      </div>
      <el-form :model="form" class="inline-form">
        <el-form-item class="price-input">
          <el-input-number 
            v-model="form.price" 
            :min="0" 
            :precision="2"
            :step="10"
            size="large"
            placeholder="输入估价"
            style="width: 180px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitValuation" :loading="submitting">
            {{ myValuation ? '更新估价' : '提交估价' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-alert v-else type="info" :closable="false" show-icon>
      登录后可以参与估价
    </el-alert>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { submitValuation, getMyValuation, getBoxValuationStats } from '@/api/price'

const props = defineProps({
  boxId: { type: [String, Number], required: true }
})

const isLoggedIn = ref(!!localStorage.getItem('token'))
const myValuation = ref(null)
const valuationStats = ref(null)
const submitting = ref(false)
const form = reactive({
  price: null
})

const loadMyValuation = async () => {
  if (!isLoggedIn.value) return
  try {
    const res = await getMyValuation(props.boxId)
    myValuation.value = res.data
    if (res.data) {
      form.price = Number(res.data.price)
    }
  } catch (e) {
    console.error('加载我的估价失败', e)
  }
}

const loadStats = async () => {
  try {
    const res = await getBoxValuationStats(props.boxId)
    valuationStats.value = res.data
  } catch (e) {
    console.error('加载估价统计失败', e)
  }
}

const submitValuation = async () => {
  if (!form.price || form.price <= 0) {
    ElMessage.warning('请输入有效的估价')
    return
  }
  
  submitting.value = true
  try {
    await submitValuation({
      boxId: Number(props.boxId),
      price: form.price
    })
    ElMessage.success('估价已提交')
    await Promise.all([loadMyValuation(), loadStats()])
  } catch (e) {
    console.error('提交估价失败', e)
  } finally {
    submitting.value = false
  }
}

watch(() => props.boxId, () => {
  myValuation.value = null
  valuationStats.value = null
  form.price = null
  loadMyValuation()
  loadStats()
})

onMounted(() => {
  loadMyValuation()
  loadStats()
})
</script>

<style scoped>
.valuation-panel {
  padding: 4px;
}
.panel-header h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #303133;
}
.stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stat-card {
  flex: 1;
  min-width: 140px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: #fff;
}
.stat-card:last-child {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.stat-label {
  font-size: 12px;
  opacity: 0.85;
}
.stat-value {
  font-size: 22px;
  font-weight: 600;
  margin: 4px 0;
}
.stat-desc {
  font-size: 11px;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}
.form-header .tip {
  font-size: 12px;
  color: #909399;
}
.inline-form {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
}
.inline-form .el-form-item {
  margin-bottom: 0;
}
.price-input {
  display: flex;
  align-items: center;
  gap: 8px;
}
.unit {
  color: #606266;
}
</style>
