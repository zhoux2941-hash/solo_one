<template>
  <div class="create-order">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>创建订单</span>
        </div>
      </template>

      <el-form :model="orderForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model.number="orderForm.userId" placeholder="请输入用户ID" />
        </el-form-item>

        <el-form-item label="收货人" prop="receiverName">
          <el-input v-model="orderForm.receiverName" placeholder="请输入收货人姓名" />
        </el-form-item>

        <el-form-item label="手机号" prop="receiverPhone">
          <el-input v-model="orderForm.receiverPhone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="收货地址" prop="receiverAddress">
          <el-input
            v-model="orderForm.receiverAddress"
            type="textarea"
            :rows="2"
            placeholder="请输入收货地址"
          />
        </el-form-item>

        <el-form-item label="商品列表">
          <el-button type="primary" size="small" @click="addProduct">
            <el-icon><Plus /></el-icon>
            添加商品
          </el-button>
        </el-form-item>

        <el-form-item>
          <el-table :data="orderForm.items" style="width: 100%" border>
            <el-table-column label="商品ID" width="120">
              <template #default="scope">
                <el-select v-model="scope.row.productId" @change="selectProduct(scope.$index)">
                  <el-option v-for="p in products" :key="p.id" :label="p.productName" :value="p.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="商品名称" min-width="150" prop="productName" />
            <el-table-column label="单价" width="120" prop="price">
              <template #default="scope">
                ¥{{ scope.row.price }}
              </template>
            </el-table-column>
            <el-table-column label="购买数量" width="150">
              <template #default="scope">
                <el-input-number v-model="scope.row.quantity" :min="1" :max="100" @change="calculateTotal" />
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120">
              <template #default="scope">
                ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="scope">
                <el-button type="danger" size="small" link @click="removeProduct(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <el-form-item label="订单总额">
          <span style="font-size: 24px; color: #f56c6c; font-weight: bold">
            ¥{{ totalAmount.toFixed(2) }}
          </span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">提交订单</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="$router.push('/')">返回列表</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createOrder, getProduct } from '@/api/order'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)

const products = ref([
  { id: 1, productName: 'iPhone 15 Pro', price: 8999.00 },
  { id: 2, productName: 'MacBook Pro 14寸', price: 14999.00 },
  { id: 3, productName: 'AirPods Pro 2', price: 1899.00 },
  { id: 4, productName: 'iPad Air', price: 4799.00 },
  { id: 5, productName: 'Apple Watch Series 9', price: 3299.00 }
])

const orderForm = ref({
  userId: 1,
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  items: []
})

const rules = {
  userId: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  receiverName: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  receiverPhone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  receiverAddress: [{ required: true, message: '请输入收货地址', trigger: 'blur' }]
}

const totalAmount = computed(() => {
  return orderForm.value.items.reduce((sum, item) => {
    return sum + (item.price || 0) * (item.quantity || 0)
  }, 0)
})

const addProduct = () => {
  orderForm.value.items.push({
    productId: null,
    productName: '',
    price: 0,
    quantity: 1
  })
}

const removeProduct = (index) => {
  orderForm.value.items.splice(index, 1)
  calculateTotal()
}

const selectProduct = (index) => {
  const item = orderForm.value.items[index]
  const product = products.value.find(p => p.id === item.productId)
  if (product) {
    item.productName = product.productName
    item.price = product.price
    calculateTotal()
  }
}

const calculateTotal = () => {
}

const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (orderForm.value.items.length === 0) {
      ElMessage.warning('请至少添加一个商品')
      return
    }

    submitting.value = true

    const items = orderForm.value.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }))

    await createOrder({
      userId: orderForm.value.userId,
      receiverName: orderForm.value.receiverName,
      receiverPhone: orderForm.value.receiverPhone,
      receiverAddress: orderForm.value.receiverAddress,
      items
    })

    ElMessage.success('订单创建成功')
    router.push('/')
  } catch (error) {
    console.error('创建订单失败:', error)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  orderForm.value.items = []
}

onMounted(() => {
  addProduct()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>