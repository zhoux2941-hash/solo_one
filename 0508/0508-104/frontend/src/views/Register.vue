<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <el-icon><Edit /></el-icon>
          社团招新报名表
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>

        <el-form-item label="学号" prop="studentId">
          <el-input v-model="form.studentId" placeholder="请输入学号" />
        </el-form-item>

        <el-form-item label="意向部门" prop="preferredDepartments">
          <el-select
            v-model="form.preferredDepartments"
            multiple
            filterable
            placeholder="请选择意向部门（最多3个）"
            :max="3"
            style="width: 100%"
          >
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.name"
            />
          </el-select>
          <div class="tip">
            <el-icon><InfoFilled /></el-icon>
            最多可选择3个意向部门，按优先级排序
          </div>
        </el-form-item>

        <el-form-item label="接受调剂" prop="acceptAdjustment">
          <el-radio-group v-model="form.acceptAdjustment">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
          <div class="tip">
            <el-icon><InfoFilled /></el-icon>
            若第一志愿无法安排，是否接受调剂到其他部门
          </div>
        </el-form-item>

        <el-form-item label="空闲时间段" prop="freeSlots">
          <el-checkbox-group v-model="form.freeSlots">
            <el-checkbox label="周一9-12" />
            <el-checkbox label="周一14-17" />
            <el-checkbox label="周一19-21" />
            <el-checkbox label="周二9-12" />
            <el-checkbox label="周二14-17" />
            <el-checkbox label="周二19-21" />
            <el-checkbox label="周三9-12" />
            <el-checkbox label="周三14-17" />
            <el-checkbox label="周三19-21" />
            <el-checkbox label="周四9-12" />
            <el-checkbox label="周四14-17" />
            <el-checkbox label="周四19-21" />
            <el-checkbox label="周五9-12" />
            <el-checkbox label="周五14-17" />
            <el-checkbox label="周五19-21" />
            <el-checkbox label="周六9-12" />
            <el-checkbox label="周六14-17" />
          </el-checkbox-group>
          <div class="tip">
            <el-icon><InfoFilled /></el-icon>
            请选择你可参加面试的所有空闲时间段
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">
            <el-icon><Check /></el-icon>
            提交报名
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const formRef = ref(null)
const loading = ref(false)
const departments = ref([])

const form = reactive({
  name: '',
  studentId: '',
  preferredDepartments: [],
  acceptAdjustment: true,
  freeSlots: []
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  preferredDepartments: [
    { required: true, message: '请至少选择一个意向部门', trigger: 'change' }
  ],
  acceptAdjustment: [
    { required: true, message: '请选择是否接受调剂', trigger: 'change' }
  ],
  freeSlots: [
    { 
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少选择一个空闲时间段'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

const fetchDepartments = async () => {
  try {
    const res = await request.get('/departments')
    departments.value = res.data
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await request.post('/applicants', form)
        ElMessage.success('报名成功！面试时间将自动分配，请关注面试名单页面')
        resetForm()
      } catch (error) {
        console.error('提交失败:', error)
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

onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 700px;
}

.card-header {
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #667eea;
}

.tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.el-checkbox) {
  margin-right: 0;
  width: 100px;
}
</style>