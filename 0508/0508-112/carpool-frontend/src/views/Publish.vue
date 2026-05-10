<template>
  <div class="publish-container">
    <el-card class="publish-card">
      <template #header>
        <div class="card-header">
          <el-icon><Edit /></el-icon>
          发布拼车行程
        </div>
      </template>

      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef" 
        label-width="120px"
        class="publish-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出发城市" prop="departureCity">
              <el-input v-model="form.departureCity" placeholder="如：北京大学" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的城市" prop="destinationCity">
              <el-input v-model="form.destinationCity" placeholder="如：上海" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="途经城市">
          <el-select
            v-model="waypointInput"
            filterable
            allow-create
            default-first-option
            multiple
            collapse-tags
            placeholder="输入途经城市，多个用逗号分隔"
            style="width: 100%"
            @change="onWaypointsChange"
          >
            <el-option
              v-for="item in waypointOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <div class="waypoint-tip">
            <el-icon><InfoFilled /></el-icon>
            途经点可让其他用户拼一段行程（如：北京→上海，途经南京→用户可只坐北京→南京段）
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出发时间" prop="departureTime">
              <el-date-picker
                v-model="form.departureTime"
                type="datetime"
                placeholder="选择出发时间"
                value-format="YYYY-MM-DDTHH:mm:ss"
                :disabled-date="disabledDate"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可带人数" prop="totalSeats">
              <el-input-number 
                v-model="form.totalSeats" 
                :min="1" 
                :max="10"
                :step="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="人均费用(元)" prop="costPerPerson">
              <el-input-number 
                v-model="form.costPerPerson" 
                :min="0" 
                :precision="2"
                :step="10"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="行程说明">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="补充说明（如：集合地点、行李要求等，可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" size="large" @click="handleSubmit">
            <el-icon><Check /></el-icon>
            发布行程
          </el-button>
          <el-button size="large" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="tips-card">
      <template #header>
        <div class="tips-header">
          <el-icon><InfoFilled /></el-icon>
          发布须知
        </div>
      </template>
      <el-alert
        title="守信指数说明"
        type="info"
        :closable="false"
        show-icon
      >
        完成拼车后守信指数+5，爽约取消-10。守信指数影响他人是否愿意与你拼车。
      </el-alert>
      <el-divider />
      <el-alert
        title="时间匹配规则"
        type="success"
        :closable="false"
        show-icon
      >
        系统会自动匹配同一目的城市且出发时间相差±1小时的行程。
      </el-alert>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useTripApi } from '@/api/trip'

const router = useRouter()
const tripApi = useTripApi()

const formRef = ref(null)
const loading = ref(false)
const waypointInput = ref([])
const waypointOptions = ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '南京', '西安', '重庆', '天津', '苏州', '郑州', '长沙', '青岛']

const form = reactive({
  departureCity: '',
  destinationCity: '',
  waypoints: '',
  departureTime: '',
  totalSeats: 3,
  costPerPerson: 50,
  description: ''
})

const onWaypointsChange = (value) => {
  if (value && value.length > 0) {
    form.waypoints = value.join(',')
  } else {
    form.waypoints = ''
  }
}

const rules = {
  departureCity: [{ required: true, message: '请输入出发城市', trigger: 'blur' }],
  destinationCity: [{ required: true, message: '请输入目的城市', trigger: 'blur' }],
  departureTime: [{ required: true, message: '请选择出发时间', trigger: 'change' }],
  totalSeats: [{ required: true, message: '请输入可带人数', trigger: 'change' }],
  costPerPerson: [{ required: true, message: '请输入人均费用', trigger: 'change' }]
}

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 86400000
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await tripApi.createTrip(form)
        if (res.success) {
          ElMessage.success('行程发布成功！')
          router.push('/my-trips')
        }
      } catch (e) {
      } finally {
        loading.value = false
      }
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
}
</script>

<style scoped>
.publish-container {
  display: flex;
  gap: 24px;
}

.publish-card {
  flex: 1;
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
}

.publish-form {
  max-width: 800px;
}

.tips-card {
  width: 320px;
  border-radius: 12px;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.waypoint-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
