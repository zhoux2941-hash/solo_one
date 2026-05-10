<template>
  <div class="records-container">
    <el-row :gutter="20">
      <el-col :span="10">
        <el-card class="card">
          <template #header>
            <div class="card-header">
              <span>📝 新建嫁接记录</span>
            </div>
          </template>
          
          <el-form :model="form" label-width="100px">
            <el-form-item label="砧木">
              <el-select v-model="form.rootstockId" placeholder="选择砧木" style="width: 100%">
                <el-option
                  v-for="item in rootstocks"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="接穗">
              <el-select v-model="form.scionId" placeholder="选择接穗" style="width: 100%">
                <el-option
                  v-for="item in scions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="嫁接日期">
              <el-date-picker
                v-model="form.graftingDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="嫁接方法">
              <el-select v-model="form.method" placeholder="选择方法" style="width: 100%">
                <el-option label="劈接" value="SPLICE" />
                <el-option label="芽接" value="BUDDING" />
                <el-option label="楔接" value="WEDGE" />
                <el-option label="靠接" value="APPROACH" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="嫁接数量">
              <el-input-number v-model="form.totalCount" :min="1" style="width: 100%" />
            </el-form-item>
            
            <el-form-item label="备注">
              <el-input
                v-model="form.notes"
                type="textarea"
                :rows="2"
                placeholder="请输入备注"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="createRecord" :loading="creating">
                创建记录
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <el-col :span="14">
        <el-card class="card">
          <template #header>
            <div class="card-header">
              <span>📋 嫁接记录列表</span>
            </div>
          </template>
          
          <el-table :data="records" stripe style="width: 100%">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column label="砧木" prop="rootstock.name" />
            <el-table-column label="接穗" prop="scion.name" />
            <el-table-column label="日期" prop="graftingDate" width="110" />
            <el-table-column label="方法" width="80">
              <template #default="{ row }">
                <el-tag :type="getMethodTagType(row.method)">
                  {{ getMethodLabel(row.method) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="数量" prop="totalCount" width="60" />
            <el-table-column label="成活率" width="90">
              <template #default="{ row }">
                <span v-if="row.isCompleted">{{ row.survivalRate }}%</span>
                <span v-else class="pending">待更新</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.isCompleted ? 'success' : 'warning'">
                  {{ row.isCompleted ? '已完成' : '进行中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="!row.isCompleted"
                  type="primary"
                  size="small"
                  @click="showUpdateDialog(row)"
                >
                  更新成活
                </el-button>
                <el-button v-else type="success" size="small" disabled>
                  已更新
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    
    <el-dialog
      v-model="updateDialogVisible"
      title="更新成活情况"
      width="400px"
    >
      <el-form label-width="100px">
        <el-form-item label="嫁接总数">
          <el-input :value="currentRecord?.totalCount" disabled />
        </el-form-item>
        <el-form-item label="成活数量">
          <el-input-number
            v-model="survivalCount"
            :min="0"
            :max="currentRecord?.totalCount || 0"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="updateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateSurvival" :loading="updating">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getRootstocks,
  getScions,
  createRecord,
  getAllRecords,
  updateSurvival
} from '../api'

const rootstocks = ref([])
const scions = ref([])
const records = ref([])
const creating = ref(false)
const updating = ref(false)

const form = ref({
  rootstockId: null,
  scionId: null,
  graftingDate: null,
  method: 'SPLICE',
  totalCount: 1,
  notes: ''
})

const updateDialogVisible = ref(false)
const currentRecord = ref(null)
const survivalCount = ref(0)

const methodLabels = {
  SPLICE: '劈接',
  BUDDING: '芽接',
  WEDGE: '楔接',
  APPROACH: '靠接'
}

const getMethodLabel = (method) => methodLabels[method] || method

const getMethodTagType = (method) => {
  const types = {
    SPLICE: 'primary',
    BUDDING: 'success',
    WEDGE: 'warning',
    APPROACH: 'info'
  }
  return types[method] || ''
}

const loadRecords = async () => {
  try {
    const res = await getAllRecords()
    records.value = res.data
  } catch (error) {
    ElMessage.error('加载记录失败')
  }
}

const createRecord = async () => {
  if (!form.value.rootstockId || !form.value.scionId || !form.value.graftingDate) {
    ElMessage.warning('请填写必要信息')
    return
  }
  
  creating.value = true
  try {
    await createRecord(form.value)
    ElMessage.success('创建成功')
    form.value = {
      rootstockId: null,
      scionId: null,
      graftingDate: null,
      method: 'SPLICE',
      totalCount: 1,
      notes: ''
    }
    await loadRecords()
  } catch (error) {
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}

const showUpdateDialog = (row) => {
  currentRecord.value = row
  survivalCount.value = 0
  updateDialogVisible.value = true
}

const updateSurvival = async () => {
  if (!currentRecord.value) return
  
  updating.value = true
  try {
    await updateSurvival(currentRecord.value.id, survivalCount.value)
    ElMessage.success('更新成功')
    updateDialogVisible.value = false
    await loadRecords()
  } catch (error) {
    ElMessage.error('更新失败')
  } finally {
    updating.value = false
  }
}

onMounted(async () => {
  try {
    const [rootstockRes, scionRes] = await Promise.all([
      getRootstocks(),
      getScions()
    ])
    rootstocks.value = rootstockRes.data
    scions.value = scionRes.data
    await loadRecords()
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
})
</script>

<style scoped>
.records-container {
  margin-top: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.pending {
  color: #e6a23c;
}
</style>
