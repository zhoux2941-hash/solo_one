<template>
  <div class="page-container">
    <div class="card">
      <h3 class="card-title">记录钓鱼</h3>
      <el-form :model="form" ref="formRef" label-width="100px" @submit.prevent="handleSubmit">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="钓鱼日期" prop="fishDate">
              <el-date-picker
                v-model="form.fishDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="鱼种" prop="fishSpeciesId">
              <el-select v-model="form.fishSpeciesId" placeholder="选择鱼种" style="width: 100%">
                <el-option
                  v-for="species in speciesList"
                  :key="species.id"
                  :label="species.name"
                  :value="species.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="拟饵" prop="lureId">
              <el-select v-model="form.lureId" placeholder="选择拟饵" style="width: 100%">
                <el-option
                  v-for="lure in lureList"
                  :key="lure.id"
                  :label="`${lure.model} - ${lure.color}`"
                  :value="lure.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="钓获数量" prop="catchCount">
              <el-input-number v-model="form.catchCount" :min="1" :max="100" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="放流数量" prop="releaseCount">
              <el-input-number v-model="form.releaseCount" :min="0" :max="form.catchCount" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-alert
              v-if="form.releaseCount > 0"
              type="success"
              :closable="false"
              show-icon
            >
              🌍 感谢您放流 {{ form.releaseCount }} 尾鱼！将获得 {{ form.releaseCount * 10 }} 生态积分，您使用的拟饵在推荐时将获得生态加成！
            </el-alert>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="气温(°C)" prop="airTemp">
              <el-input-number v-model="form.airTemp" :min="-10" :max="50" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="水温(°C)" prop="waterTemp">
              <el-input-number v-model="form.waterTemp" :min="0" :max="40" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="气压(hPa)" prop="airPressure">
              <el-input-number v-model="form.airPressure" :min="900" :max="1100" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="天气" prop="weather">
              <el-select v-model="form.weather" placeholder="选择天气" style="width: 100%">
                <el-option label="晴天" value="晴天" />
                <el-option label="多云" value="多云" />
                <el-option label="阴天" value="阴天" />
                <el-option label="小雨" value="小雨" />
                <el-option label="中雨" value="中雨" />
                <el-option label="雷阵雨" value="雷阵雨" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="水体能见度" prop="waterVisibility">
              <el-select v-model="form.waterVisibility" placeholder="选择能见度" style="width: 100%">
                <el-option label="清澈" value="清澈" />
                <el-option label="较好" value="较好" />
                <el-option label="一般" value="一般" />
                <el-option label="浑浊" value="浑浊" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="notes">
          <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="输入备注信息..." />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            保存记录
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card mt-20">
      <h3 class="card-title">我的钓鱼记录</h3>
      <el-table :data="recordList" style="width: 100%">
        <el-table-column prop="fishDate" label="日期" width="120" />
        <el-table-column prop="fishSpecies.name" label="鱼种" width="100" />
        <el-table-column label="拟饵" width="180">
          <template #default="scope">
            {{ scope.row.lure?.model }} - {{ scope.row.lure?.color }}
          </template>
        </el-table-column>
        <el-table-column prop="catchCount" label="数量" width="80" />
        <el-table-column prop="airTemp" label="气温" width="80">
          <template #default="scope">
            {{ scope.row.airTemp }}°C
          </template>
        </el-table-column>
        <el-table-column prop="waterTemp" label="水温" width="80">
          <template #default="scope">
            {{ scope.row.waterTemp }}°C
          </template>
        </el-table-column>
        <el-table-column prop="airPressure" label="气压" width="100">
          <template #default="scope">
            {{ scope.row.airPressure }}hPa
          </template>
        </el-table-column>
        <el-table-column prop="weather" label="天气" width="80" />
        <el-table-column prop="notes" label="备注" />
      </el-table>
      <el-empty v-if="recordList.length === 0" description="暂无记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createRecord, getRecordsByUser, getAllSpecies, getAllLures } from '@/api/fishing'

const formRef = ref(null)
const loading = ref(false)
const speciesList = ref([])
const lureList = ref([])
const recordList = ref([])

const form = reactive({
  userId: 1,
  fishDate: new Date().toISOString().split('T')[0],
  fishSpeciesId: null,
  lureId: null,
  catchCount: 1,
  airTemp: 20,
  waterTemp: 18,
  airPressure: 1013,
  weather: '',
  waterVisibility: '',
  releaseCount: 0,
  notes: ''
})

const loadSpecies = async () => {
  try {
    const res = await getAllSpecies()
    speciesList.value = res.data
  } catch (error) {
    console.error('加载鱼种失败:', error)
  }
}

const loadLures = async () => {
  try {
    const res = await getAllLures()
    lureList.value = res.data
  } catch (error) {
    console.error('加载拟饵失败:', error)
  }
}

const loadRecords = async () => {
  try {
    const res = await getRecordsByUser(1)
    recordList.value = res.data
  } catch (error) {
    console.error('加载记录失败:', error)
  }
}

const handleSubmit = async () => {
  if (!form.fishSpeciesId || !form.lureId) {
    ElMessage.warning('请选择鱼种和拟饵')
    return
  }
  
  loading.value = true
  try {
    await createRecord(form)
    ElMessage.success('记录保存成功')
    resetForm()
    loadRecords()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.fishSpeciesId = null
  form.lureId = null
  form.catchCount = 1
  form.releaseCount = 0
  form.airTemp = 20
  form.waterTemp = 18
  form.airPressure = 1013
  form.weather = ''
  form.waterVisibility = ''
  form.notes = ''
}

onMounted(() => {
  loadSpecies()
  loadLures()
  loadRecords()
})
</script>
