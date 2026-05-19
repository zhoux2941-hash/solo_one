<template>
  <div class="exit">
    <el-card>
      <template #header>
        <span>
          <el-icon size="18" color="#F56C6C"><ArrowUp /></el-icon>
          车辆离场结算
        </span>
      </template>
      
      <el-form :model="form" label-width="100px" size="large">
        <el-form-item label="车牌号">
          <el-input v-model="form.plateNumber" placeholder="请输入车牌号" style="width: 300px" />
          <el-button type="primary" @click="recognizePlate" style="margin-left: 10px">
            <el-icon><Camera /></el-icon>
            车牌识别
          </el-button>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" size="large" @click="calculateFee">
            <el-icon><Calculator /></el-icon>
            计算费用
          </el-button>
        </el-form-item>
      </el-form>

      <div class="fee-info" v-if="feeInfo">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="车牌号">{{ feeInfo.plateNumber }}</el-descriptions-item>
          <el-descriptions-item label="入场时间">{{ feeInfo.entryTime }}</el-descriptions-item>
          <el-descriptions-item label="离场时间">{{ feeInfo.exitTime }}</el-descriptions-item>
          <el-descriptions-item label="停车时长">{{ feeInfo.duration }}</el-descriptions-item>
          <el-descriptions-item label="计费规则">{{ feeInfo.rule }}</el-descriptions-item>
          <el-descriptions-item label="应收金额">
            <span style="color: #F56C6C; font-size: 24px; font-weight: bold">¥{{ feeInfo.amount }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="action-buttons">
          <el-button type="success" size="large" @click="confirmPay">
            <el-icon><Money /></el-icon>
            确认支付并放行
          </el-button>
          <el-button type="warning" size="large" @click="manualRelease">
            <el-icon><Unlock /></el-icon>
            手动放行
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const form = reactive({
  plateNumber: ''
})

const feeInfo = ref(null)

const recognizePlate = () => {
  ElMessageBox.prompt('模拟车牌识别，请输入车牌号', '车牌识别', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(({ value }) => {
    form.plateNumber = value.toUpperCase()
  }).catch(() => {})
}

const calculateFee = async () => {
  if (!form.plateNumber) {
    ElMessage.warning('请输入车牌号')
    return
  }
  
  feeInfo.value = {
    plateNumber: form.plateNumber,
    entryTime: '2026-05-18 09:30:00',
    exitTime: '2026-05-18 12:30:00',
    duration: '3小时0分钟',
    rule: '日间计费 ¥5/小时 (首30分钟免费)',
    amount: '15.00'
  }
  
  ElMessage.success('费用计算完成')
}

const confirmPay = async () => {
  try {
    const res = await request.post('/parking/exit', null, {
      params: { plateNumber: form.plateNumber }
    })
    
    if (res.code === 200) {
      ElMessage.success('支付成功，已放行')
      feeInfo.value = null
      form.plateNumber = ''
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const manualRelease = () => {
  ElMessageBox.prompt('请输入放行原因', '手动放行', {
    confirmButtonText: '确认放行',
    cancelButtonText: '取消'
  }).then(async ({ value }) => {
    const res = await request.post('/parking/manual-release', null, {
      params: { entryId: 1, remark: value }
    })
    
    if (res.code === 200) {
      ElMessage.success('已手动放行')
      feeInfo.value = null
      form.plateNumber = ''
    }
  }).catch(() => {})
}
</script>

<style scoped>
.exit {
  max-width: 700px;
}

:deep(.el-card) {
  background: #16213e;
  border: 1px solid #0f3460;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #0f3460;
  color: #fff;
}

:deep(.el-form-item__label) {
  color: #ccc;
}

.fee-info {
  margin-top: 30px;
}

:deep(.el-descriptions__label) {
  background: #0f3460 !important;
  color: #fff;
}

:deep(.el-descriptions__content) {
  background: #16213e !important;
  color: #ccc;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 15px;
  justify-content: center;
}
</style>
