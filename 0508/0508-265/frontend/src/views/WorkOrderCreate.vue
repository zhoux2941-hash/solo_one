<template>
  <div class="workorder-create">
    <el-card>
      <template #header>
        <span>创建工单</span>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备" prop="deviceId">
              <el-select v-model="form.deviceId" placeholder="请选择设备" style="width: 100%">
                <el-option 
                  v-for="device in devices" 
                  :key="device.id" 
                  :label="device.deviceName" 
                  :value="device.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option label="高" value="HIGH" />
                <el-option label="中" value="MEDIUM" />
                <el-option label="低" value="LOW" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="工单标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入工单标题" />
        </el-form-item>

        <el-form-item label="故障类型" prop="faultType">
          <el-select v-model="form.faultType" placeholder="请选择故障类型" style="width: 100%">
            <el-option label="机械故障" value="MECHANICAL" />
            <el-option label="电气故障" value="ELECTRICAL" />
            <el-option label="软件故障" value="SOFTWARE" />
            <el-option label="其他故障" value="OTHER" />
          </el-select>
        </el-form-item>

        <el-form-item label="故障描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请详细描述故障情况"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store'
import { workOrderApi, deviceApi } from '../api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const devices = ref([])

const form = reactive({
  deviceId: null,
  title: '',
  description: '',
  faultType: '',
  priority: 'MEDIUM',
  creatorId: null
})

const rules = {
  deviceId: [
    { required: true, message: '请选择设备', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入工单标题', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入故障描述', trigger: 'blur' }
  ]
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        form.creatorId = userStore.user.id
        await workOrderApi.create(form)
        ElMessage.success('工单创建成功，等待审批')
        router.push('/workorders')
      } catch (error) {
        ElMessage.error('创建失败，请重试')
      } finally {
        loading.value = false
      }
    }
  })
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

onMounted(async () => {
  devices.value = await deviceApi.getAll()
})
</script>

<style scoped>
</style>
