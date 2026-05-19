<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>车辆档案</span>
          <el-button type="primary" size="small" @click="handleAdd">新增车辆</el-button>
        </div>
      </template>
      
      <div style="margin-bottom: 15px">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索车牌号或车架号"
          style="width: 300px"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <el-table :data="tableData" border>
        <el-table-column prop="plateNumber" label="车牌号" />
        <el-table-column prop="vin" label="车架号" />
        <el-table-column prop="brand" label="品牌" />
        <el-table-column prop="model" label="型号" />
        <el-table-column prop="color" label="颜色" />
        <el-table-column prop="mileage" label="行驶里程(km)" />
        <el-table-column prop="customerName" label="车主" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="车辆信息" width="600px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号" prop="plateNumber">
              <el-input v-model="form.plateNumber" placeholder="请输入车牌号，如：京A12345" maxlength="10" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车架号">
              <el-input v-model="form.vin" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌">
              <el-input v-model="form.brand" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号">
              <el-input v-model="form.model" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="颜色">
              <el-input v-model="form.color" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="行驶里程">
              <el-input-number v-model="form.mileage" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="车主">
          <el-select v-model="form.customerId" placeholder="请选择客户" style="width: 100%" @change="handleCustomerChange">
            <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="发动机号">
          <el-input v-model="form.engineNumber" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { vehicleApi, customerApi } from '../api'

const searchKeyword = ref('')
const tableData = ref([])
const dialogVisible = ref(false)
const form = ref({})
const formRef = ref(null)
const customers = ref([])

const validatePlateNumber = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入车牌号'))
  } else {
    const plateNumberRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/
    if (plateNumberRegex.test(value)) {
      callback()
    } else {
      callback(new Error('请输入正确的车牌号格式，如：京A12345'))
    }
  }
}

const formRules = {
  plateNumber: [
    { required: true, validator: validatePlateNumber, trigger: 'blur' }
  ]
}

const loadData = async () => {
  const res = await vehicleApi.list()
  if (res.code === 200) {
    tableData.value = res.data
  }
}

const loadCustomers = async () => {
  const res = await customerApi.list()
  if (res.code === 200) {
    customers.value = res.data
  }
}

const handleSearch = async () => {
  if (searchKeyword.value) {
    const res = await vehicleApi.search(searchKeyword.value)
    if (res.code === 200) {
      tableData.value = res.data
    }
  } else {
    loadData()
  }
}

const handleCustomerChange = (customerId) => {
  const customer = customers.value.find(c => c.id === customerId)
  if (customer) {
    form.value.customerName = customer.name
  }
}

const handleAdd = () => {
  form.value = {}
  dialogVisible.value = true
}

const handleEdit = (row) => {
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const res = await vehicleApi.save(form.value)
      if (res.code === 200) {
        ElMessage.success('保存成功')
        dialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(res.message || '保存失败')
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除此车辆？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await vehicleApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

onMounted(() => {
  loadData()
  loadCustomers()
})
</script>