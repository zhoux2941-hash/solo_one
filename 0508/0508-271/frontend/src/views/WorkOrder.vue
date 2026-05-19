<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>维修工单</span>
          <el-button type="primary" size="small" @click="handleCreate">快速开单</el-button>
        </div>
      </template>
      
      <div style="margin-bottom: 15px">
        <el-space wrap>
          <el-radio-group v-model="statusFilter" @change="handleStatusFilter">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="CREATED">已创建</el-radio-button>
            <el-radio-button label="ASSIGNED">已派工</el-radio-button>
            <el-radio-button label="WORKING">施工中</el-radio-button>
            <el-radio-button label="COMPLETED">已完工</el-radio-button>
            <el-radio-button label="SETTLED">已结算</el-radio-button>
          </el-radio-group>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索车牌号或工单号"
            style="width: 250px"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </el-space>
      </div>

      <el-table :data="tableData" border>
        <el-table-column prop="orderNo" label="工单号" width="150" />
        <el-table-column prop="plateNumber" label="车牌号" />
        <el-table-column prop="customerName" label="客户" />
        <el-table-column prop="brandModel" label="车型" />
        <el-table-column prop="faultDescription" label="故障描述" show-overflow-tooltip />
        <el-table-column prop="laborCost" label="工时费(¥)" />
        <el-table-column prop="partsCost" label="配件费(¥)" />
        <el-table-column prop="totalAmount" label="总计(¥)" />
        <el-table-column prop="assignTo" label="维修技师" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button size="small" @click="handleDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'CREATED'" size="small" type="primary" @click="handleAssign(row)">派工</el-button>
            <el-button v-if="row.status === 'ASSIGNED'" size="small" type="success" @click="handleStart(row)">开工</el-button>
            <el-button v-if="row.status === 'WORKING'" size="small" type="warning" @click="handleComplete(row)">完工</el-button>
            <el-button v-if="row.status === 'COMPLETED'" size="small" type="success" @click="handleSettle(row)">结算</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建工单对话框 -->
    <el-dialog v-model="createVisible" title="创建维修工单" width="700px">
      <el-form :model="orderForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户">
              <el-select v-model="orderForm.customerId" placeholder="请选择客户" style="width: 100%" @change="handleCustomerChange">
                <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆">
              <el-select v-model="orderForm.vehicleId" placeholder="请选择车辆" style="width: 100%" @change="handleVehicleChange">
                <el-option v-for="vehicle in customerVehicles" :key="vehicle.id" :label="vehicle.plateNumber" :value="vehicle.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="故障描述">
          <el-input type="textarea" v-model="orderForm.faultDescription" :rows="3" />
        </el-form-item>
        <el-form-item label="维修项目">
          <el-input type="textarea" v-model="orderForm.serviceItems" :rows="2" />
        </el-form-item>
        <el-form-item label="工时费">
          <el-input-number v-model="orderForm.laborCost" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate">创建工单</el-button>
      </template>
    </el-dialog>

    <!-- 派工对话框 -->
    <el-dialog v-model="assignVisible" title="派工" width="400px">
      <el-form label-width="80px">
        <el-form-item label="工单号">
          <span>{{ currentOrder?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="维修技师">
          <el-input v-model="assignTo" placeholder="请输入技师姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认派工</el-button>
      </template>
    </el-dialog>

    <!-- 结算对话框 -->
    <el-dialog v-model="settleVisible" title="工单结算" width="450px">
      <el-form label-width="80px">
        <el-form-item label="工单号">
          <span>{{ currentOrder?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="工时费">
          <span>¥ {{ currentOrder?.laborCost || 0 }}</span>
        </el-form-item>
        <el-form-item label="配件费">
          <span>¥ {{ currentOrder?.partsCost || 0 }}</span>
        </el-form-item>
        <el-form-item label="原价">
          <span style="color: #909399; text-decoration: line-through">¥ {{ originalAmount }}</span>
        </el-form-item>
        <el-form-item label="优惠金额">
          <el-input-number v-model="discountAmount" :min="0" :max="originalAmount" :precision="2" style="width: 100%" @change="calculateTotal" />
        </el-form-item>
        <el-form-item label="应收金额">
          <span style="color: #f56c6c; font-weight: bold; font-size: 20px">¥ {{ actualAmount }}</span>
        </el-form-item>
        <el-form-item label="实收金额">
          <el-input-number v-model="paidAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settleVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSettle">确认结算</el-button>
      </template>
    </el-dialog>

    <!-- 工单详情对话框 -->
    <el-dialog v-model="detailVisible" title="工单详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="工单号">{{ currentOrder?.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ currentOrder?.plateNumber }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ currentOrder?.customerName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrder?.customerPhone }}</el-descriptions-item>
        <el-descriptions-item label="维修技师">{{ currentOrder?.assignTo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentOrder?.status)">{{ getStatusText(currentOrder?.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="故障描述" :span="2">{{ currentOrder?.faultDescription }}</el-descriptions-item>
        <el-descriptions-item label="维修项目" :span="2">{{ currentOrder?.serviceItems }}</el-descriptions-item>
        <el-descriptions-item label="工时费">¥ {{ currentOrder?.laborCost || 0 }}</el-descriptions-item>
        <el-descriptions-item label="配件费">¥ {{ currentOrder?.partsCost || 0 }}</el-descriptions-item>
        <el-descriptions-item v-if="currentOrder?.discountAmount > 0" label="优惠金额">
          <span style="color: #f56c6c">-¥ {{ currentOrder?.discountAmount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="总计">¥ {{ currentOrder?.totalAmount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="已收">¥ {{ currentOrder?.paidAmount || 0 }}</el-descriptions-item>
      </el-descriptions>
      
      <div style="margin-top: 20px">
        <h4 style="margin-bottom: 10px">施工记录</h4>
        <el-table :data="workRecords" size="small" border>
          <el-table-column prop="operation" label="操作" />
          <el-table-column prop="operator" label="操作人" />
          <el-table-column prop="operateTime" label="操作时间" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { workOrderApi, customerApi, vehicleApi } from '../api'

const searchKeyword = ref('')
const statusFilter = ref('')
const tableData = ref([])
const createVisible = ref(false)
const assignVisible = ref(false)
const settleVisible = ref(false)
const detailVisible = ref(false)
const orderForm = ref({})
const currentOrder = ref(null)
const customers = ref([])
const customerVehicles = ref([])
const assignTo = ref('')
const paidAmount = ref(0)
const discountAmount = ref(0)
const originalAmount = ref(0)
const actualAmount = ref(0)
const workRecords = ref([])

const statusMap = {
  CREATED: '已创建',
  ASSIGNED: '已派工',
  WORKING: '施工中',
  COMPLETED: '已完工',
  SETTLED: '已结算'
}

const getStatusText = (status) => statusMap[status] || status
const getStatusType = (status) => {
  const types = {
    CREATED: 'info',
    ASSIGNED: 'primary',
    WORKING: 'warning',
    COMPLETED: 'success',
    SETTLED: 'success'
  }
  return types[status] || 'info'
}

const loadData = async () => {
  let res
  if (statusFilter.value) {
    res = await workOrderApi.byStatus(statusFilter.value)
  } else {
    res = await workOrderApi.list()
  }
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
    const res = await workOrderApi.search(searchKeyword.value)
    if (res.code === 200) {
      tableData.value = res.data
    }
  } else {
    loadData()
  }
}

const handleStatusFilter = () => {
  loadData()
}

const handleCreate = () => {
  orderForm.value = {}
  customerVehicles.value = []
  createVisible.value = true
}

const handleCustomerChange = async (customerId) => {
  const customer = customers.value.find(c => c.id === customerId)
  if (customer) {
    orderForm.value.customerName = customer.name
    orderForm.value.customerPhone = customer.phone
    const res = await vehicleApi.byCustomer(customerId)
    if (res.code === 200) {
      customerVehicles.value = res.data
    }
  }
}

const handleVehicleChange = (vehicleId) => {
  const vehicle = customerVehicles.value.find(v => v.id === vehicleId)
  if (vehicle) {
    orderForm.value.plateNumber = vehicle.plateNumber
    orderForm.value.vin = vehicle.vin
    orderForm.value.brandModel = vehicle.brand + ' ' + vehicle.model
    orderForm.value.mileage = vehicle.mileage
  }
  const hasActiveOrder = tableData.value.some(
    order => order.vehicleId === vehicleId && 
    ['CREATED', 'ASSIGNED', 'WORKING'].includes(order.status)
  )
  if (hasActiveOrder) {
    ElMessage.warning('该车辆当前已有在修工单，请先完成或结算现有工单')
  }
}

const confirmCreate = async () => {
  const res = await workOrderApi.create(orderForm.value)
  if (res.code === 200) {
    ElMessage.success('工单创建成功')
    createVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.message || '工单创建失败')
  }
}

const handleAssign = (row) => {
  currentOrder.value = row
  assignTo.value = ''
  assignVisible.value = true
}

const confirmAssign = async () => {
  const res = await workOrderApi.assign(currentOrder.value.id, assignTo.value)
  if (res.code === 200) {
    ElMessage.success('派工成功')
    assignVisible.value = false
    loadData()
  }
}

const handleStart = async (row) => {
  const res = await workOrderApi.start(row.id)
  if (res.code === 200) {
    ElMessage.success('开始施工')
    loadData()
  }
}

const handleComplete = async (row) => {
  const res = await workOrderApi.complete(row.id)
  if (res.code === 200) {
    ElMessage.success('施工完成')
    loadData()
  }
}

const handleSettle = (row) => {
  currentOrder.value = row
  originalAmount.value = row.totalAmount || 0
  discountAmount.value = row.discountAmount || 0
  actualAmount.value = originalAmount.value - discountAmount.value
  paidAmount.value = actualAmount.value
  settleVisible.value = true
}

const calculateTotal = () => {
  actualAmount.value = Math.max(0, originalAmount.value - discountAmount.value)
  if (paidAmount.value > actualAmount.value) {
    paidAmount.value = actualAmount.value
  }
}

const confirmSettle = async () => {
  const res = await workOrderApi.settle(currentOrder.value.id, discountAmount.value, paidAmount.value)
  if (res.code === 200) {
    ElMessage.success('结算完成')
    settleVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.message || '结算失败')
  }
}

const handleDetail = async (row) => {
  currentOrder.value = row
  const res = await workOrderApi.getRecords(row.id)
  if (res.code === 200) {
    workRecords.value = res.data
  }
  detailVisible.value = true
}

onMounted(() => {
  loadData()
  loadCustomers()
})
</script>