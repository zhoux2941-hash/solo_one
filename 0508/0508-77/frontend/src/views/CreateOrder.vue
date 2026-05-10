<template>
  <div class="create-order">
    <el-card>
      <template #header>
        <h2>发起拼单</h2>
      </template>
      
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="商家" prop="merchant">
          <el-select v-model="form.merchant" placeholder="选择商家" style="width: 100%">
            <el-option
              v-for="merchant in merchants"
              :key="merchant.id"
              :label="merchant.name"
              :value="merchant.name"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="满减门槛" prop="minAmount">
          <el-input-number 
            v-model="form.minAmount" 
            :min="0.01" 
            :precision="2" 
            :step="10"
            style="width: 200px"
          />
          <span style="margin-left: 10px">元</span>
        </el-form-item>
        
        <el-form-item label="满减金额" prop="discountAmount">
          <el-input-number 
            v-model="form.discountAmount" 
            :min="0.01" 
            :precision="2" 
            :step="5"
            style="width: 200px"
          />
          <span style="margin-left: 10px">元</span>
        </el-form-item>
        
        <el-form-item label="目标链接" prop="targetUrl">
          <el-input 
            v-model="form.targetUrl" 
            placeholder="手动输入商品链接（可选）"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">
            发起拼单
          </el-button>
          <el-button @click="goBack">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { merchantApi, orderApi } from '../api'

const router = useRouter()
const formRef = ref(null)
const merchants = ref([])
const currentUser = ref(null)

const form = reactive({
  merchant: '',
  minAmount: 100,
  discountAmount: 20,
  targetUrl: ''
})

const rules = {
  merchant: [{ required: true, message: '请选择商家', trigger: 'change' }],
  minAmount: [{ required: true, message: '请输入满减门槛', trigger: 'blur' }],
  discountAmount: [{ required: true, message: '请输入满减金额', trigger: 'blur' }]
}

onMounted(() => {
  const savedUser = localStorage.getItem('group-order-user')
  if (savedUser) {
    currentUser.value = JSON.parse(savedUser)
  }
  loadMerchants()
})

const loadMerchants = async () => {
  try {
    merchants.value = await merchantApi.getAll()
  } catch (e) {
    console.error(e)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (!currentUser.value) {
      ElMessage.warning('请先登录')
      return
    }
    
    const data = {
      ...form,
      initiatorName: currentUser.value.name,
      initiatorUserId: currentUser.value.userId
    }
    
    const order = await orderApi.create(data)
    ElMessage.success('拼单创建成功')
    router.push(`/order/${order.id}`)
  } catch (e) {
    if (e.response?.data?.message) {
      ElMessage.error(e.response.data.message)
    }
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.create-order {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 0;
}

h2 {
  margin: 0;
}
</style>
