<template>
  <div class="compatibility-container">
    <el-card class="card">
      <template #header>
        <div class="card-header">
          <span>🎯 嫁接亲和度预测</span>
        </div>
      </template>
      
      <el-form :model="form" label-width="100px" class="form">
        <el-form-item label="砧木种类">
          <el-select v-model="form.rootstockId" placeholder="请选择砧木" style="width: 100%">
            <el-option
              v-for="item in rootstocks"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="接穗种类">
          <el-select v-model="form.scionId" placeholder="请选择接穗" style="width: 100%">
            <el-option
              v-for="item in scions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="predict" :loading="loading">
            预测亲和度
          </el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="result" class="result-card">
        <el-result
          :icon="resultIcon"
          :title="`亲和度评分: ${result.score}`"
          :sub-title="`亲和度等级: ${result.level}`"
        >
          <template #extra>
            <el-progress 
              :percentage="result.score" 
              :color="progressColor"
              :stroke-width="20"
            />
          </template>
        </el-result>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRootstocks, getScions, getCompatibilityScore } from '../api'

const rootstocks = ref([])
const scions = ref([])
const loading = ref(false)
const result = ref(null)

const form = ref({
  rootstockId: null,
  scionId: null
})

const resultIcon = computed(() => {
  if (!result.value) return 'info'
  if (result.value.score >= 80) return 'success'
  if (result.value.score >= 60) return 'success'
  if (result.value.score >= 40) return 'warning'
  return 'error'
})

const progressColor = computed(() => {
  if (!result.value) return '#67c23a'
  if (result.value.score >= 80) return '#67c23a'
  if (result.value.score >= 60) return '#409eff'
  if (result.value.score >= 40) return '#e6a23c'
  return '#f56c6c'
})

const predict = async () => {
  if (!form.value.rootstockId || !form.value.scionId) {
    ElMessage.warning('请选择砧木和接穗')
    return
  }
  
  loading.value = true
  try {
    const res = await getCompatibilityScore(form.value.rootstockId, form.value.scionId)
    result.value = res.data
  } catch (error) {
    ElMessage.error('预测失败，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const [rootstockRes, scionRes] = await Promise.all([
      getRootstocks(),
      getScions()
    ])
    rootstocks.value = rootstockRes.data
    scions.value = scionRes.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
})
</script>

<style scoped>
.compatibility-container {
  max-width: 800px;
  margin: 0 auto;
}

.card {
  margin-top: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.form {
  max-width: 500px;
  margin: 0 auto;
}

.result-card {
  margin-top: 30px;
}
</style>
