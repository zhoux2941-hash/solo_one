<template>
  <div class="use-vaccine-page">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Edit /></el-icon>
        使用疫苗
      </h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>疫苗使用</span>
          </template>
          <el-form :model="useForm" label-width="100px">
            <el-form-item label="选择疫苗" required>
              <el-select
                v-model="useForm.vaccineId"
                placeholder="请选择疫苗"
                style="width: 100%"
                @change="onVaccineChange"
              >
                <el-option
                  v-for="vaccine in availableVaccines"
                  :key="vaccine.vaccineId"
                  :label="vaccine.vaccineName"
                  :value="vaccine.vaccineId"
                >
                  <span style="float: left">{{ vaccine.vaccineName }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    库存: {{ vaccine.totalQuantity }}
                    <el-tag
                      v-if="getExpiringCount(vaccine) > 0"
                      type="danger"
                      size="small"
                      style="margin-left: 10px"
                    >
                      近效期: {{ getExpiringCount(vaccine) }} 个批次
                    </el-tag>
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item
              v-if="selectedVaccine"
              label="可用库存"
            >
              <el-input
                v-model="selectedVaccine.totalQuantity"
                disabled
              >
                <template #append>支</template>
              </el-input>
            </el-form-item>

            <el-form-item
              v-if="selectedVaccine"
              label="使用数量"
              required
              :rules="[
                { required: true, message: '请输入使用数量', trigger: 'blur' },
                { type: 'number', min: 1, message: '使用数量必须大于0', trigger: 'blur' }
              ]"
            >
              <el-input-number
                v-model="useForm.quantity"
                :min="1"
                :max="selectedVaccine.totalQuantity"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item v-if="selectedVaccine">
              <el-button
                type="primary"
                @click="handleUse"
                :loading="loading"
                :disabled="!useForm.quantity || useForm.quantity <= 0"
              >
                <el-icon><Check /></el-icon>
                确认使用
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="selectedVaccine" class="mt-20">
          <template #header>
            <div class="card-header">
              <span>该疫苗批次详情（按有效期排序，优先使用近效期）</span>
              <el-tag type="warning">系统自动优先使用近效期批次</el-tag>
            </div>
          </template>
          <el-table
            :data="selectedVaccine.batches"
            style="width: 100%"
            :row-class-name="batchRowClassName"
            border
          >
            <el-table-column type="index" label="使用顺序" width="80" align="center">
              <template #default="scope">
                <el-tag v-if="scope.row.quantity > 0" type="success">
                  第 {{ scope.$index + 1 }} 优先
                </el-tag>
                <el-tag v-else type="info">
                  已用完
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="batchNumber" label="批号" width="150" />
            <el-table-column prop="expiryDate" label="有效期" width="120" />
            <el-table-column prop="quantity" label="库存数量" width="100" align="center" />
            <el-table-column label="距离过期" width="120" align="center">
              <template #default="scope">
                <el-tag
                  v-if="scope.row.daysUntilExpiry <= 7"
                  type="danger"
                  effect="dark"
                >
                  {{ scope.row.daysUntilExpiry }} 天
                </el-tag>
                <el-tag
                  v-else-if="scope.row.daysUntilExpiry <= 30"
                  type="warning"
                >
                  {{ scope.row.daysUntilExpiry }} 天
                </el-tag>
                <el-tag v-else type="success">
                  {{ scope.row.daysUntilExpiry }} 天
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>使用结果</span>
          </template>
          <div v-if="!useResult" class="result-empty">
            <el-empty description="请选择疫苗并输入使用数量" />
          </div>
          <div v-else>
            <el-alert
              :type="useResult.success ? 'success' : 'error'"
              :title="useResult.message"
              show-icon
              class="mb-20"
            />

            <div v-if="useResult.success">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="疫苗名称">
                  {{ useResult.vaccineName }}
                </el-descriptions-item>
                <el-descriptions-item label="使用数量">
                  <el-tag type="primary">{{ useResult.totalUsed }} 支</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="剩余库存">
                  <el-tag :type="useResult.remainingQuantity > 0 ? 'success' : 'danger'">
                    {{ useResult.remainingQuantity }} 支
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="使用批次">
                  {{ useResult.usedBatches.length }} 个批次
                </el-descriptions-item>
              </el-descriptions>

              <el-card class="mt-20">
                <template #header>
                  <span>扣减明细</span>
                </template>
                <el-table :data="useResult.usedBatches" style="width: 100%" border>
                  <el-table-column prop="batchNumber" label="批号" width="150" />
                  <el-table-column label="扣减数量" width="120" align="center">
                    <template #default="scope">
                      <el-tag type="danger">-{{ scope.row.usedQuantity }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="剩余数量" width="120" align="center">
                    <template #default="scope">
                      <el-tag
                        :type="scope.row.remainingQuantity > 0 ? 'success' : 'info'"
                      >
                        {{ scope.row.remainingQuantity }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="expiryDate" label="有效期" width="120" />
                  <el-table-column label="状态" width="120" align="center">
                    <template #default="scope">
                      <el-tag
                        v-if="scope.row.remainingQuantity <= 0"
                        type="info"
                      >
                        已用完
                      </el-tag>
                      <el-tag v-else type="success">
                        剩余 {{ scope.row.remainingQuantity }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getVaccineStock, useVaccine } from '../api/vaccine'

const vaccineStock = ref([])
const loading = ref(false)
const useResult = ref(null)

const useForm = ref({
  vaccineId: null,
  quantity: 1
})

const availableVaccines = computed(() => {
  return vaccineStock.value.filter(vaccine => vaccine.totalQuantity > 0)
})

const selectedVaccine = computed(() => {
  if (!useForm.value.vaccineId) return null
  return vaccineStock.value.find(v => v.vaccineId === useForm.value.vaccineId)
})

const fetchData = async () => {
  try {
    const data = await getVaccineStock()
    vaccineStock.value = data
  } catch (error) {
    console.error('获取疫苗库存失败:', error)
  }
}

const onVaccineChange = () => {
  useForm.value.quantity = 1
  useResult.value = null
}

const getExpiringCount = (vaccine) => {
  return vaccine.batches.filter(batch => batch.isExpiring).length
}

const handleUse = async () => {
  if (!useForm.value.vaccineId) {
    ElMessage.warning('请先选择疫苗')
    return
  }
  if (!useForm.value.quantity || useForm.value.quantity <= 0) {
    ElMessage.warning('请输入有效的使用数量')
    return
  }

  loading.value = true
  try {
    const result = await useVaccine({
      vaccineId: useForm.value.vaccineId,
      quantity: useForm.value.quantity
    })

    useResult.value = result

    if (result.success) {
      ElMessage.success(result.message)
      fetchData()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('使用疫苗失败:', error)
    useResult.value = {
      success: false,
      message: '使用疫苗失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  useForm.value = {
    vaccineId: null,
    quantity: 1
  }
  useResult.value = null
}

const batchRowClassName = ({ row }) => {
  if (row.daysUntilExpiry <= 30 && row.daysUntilExpiry >= 0 && row.quantity > 0) {
    return 'expiring-row'
  }
  return ''
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.use-vaccine-page {
  padding: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.result-empty {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
