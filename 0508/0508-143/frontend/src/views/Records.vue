<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据记录</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新建记录
          </el-button>
        </div>
      </template>

      <el-form :inline="true" style="margin-bottom: 20px">
        <el-form-item label="选择蜂箱">
          <el-select v-model="selectedBeehiveId" placeholder="请选择蜂箱" style="width: 200px" @change="loadRecords">
            <el-option
              v-for="beehive in beehives"
              :key="beehive.id"
              :label="beehive.hiveNumber"
              :value="beehive.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="records" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="recordDate" label="日期" width="120" />
        <el-table-column label="早晨温湿度" width="160">
          <template #default="{ row }">
            <div>{{ row.morningTemperature || '-' }}°C</div>
            <div style="font-size: 12px; color: #909399">
              {{ row.morningHumidity ? row.morningHumidity + '%' : '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="晚间温湿度" width="160">
          <template #default="{ row }">
            <div>{{ row.eveningTemperature || '-' }}°C</div>
            <div style="font-size: 12px; color: #909399">
              {{ row.eveningHumidity ? row.eveningHumidity + '%' : '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="活动强度" width="140">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.activityLevel * 10" 
              :color="getActivityColor(row.activityLevel)"
              :format="() => `等级 ${row.activityLevel}`"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column label="外界温湿度" width="140">
          <template #default="{ row }">
            <div>{{ row.outsideTemperature || '-' }}°C</div>
            <div style="font-size: 12px; color: #909399">
              {{ row.outsideHumidity ? row.outsideHumidity + '%' : '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑记录' : '新建记录'" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="蜂箱" prop="beehiveId">
              <el-select v-model="form.beehiveId" placeholder="请选择蜂箱" style="width: 100%" :disabled="isEdit">
                <el-option
                  v-for="beehive in beehives"
                  :key="beehive.id"
                  :label="beehive.hiveNumber"
                  :value="beehive.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="记录日期" prop="recordDate">
              <el-date-picker
                v-model="form.recordDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">箱内温湿度</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="早晨温度">
              <el-input-number v-model="form.morningTemperature" :precision="1" :min="-20" :max="50" style="width: 100%" placeholder="适宜：30-38°C" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="早晨湿度">
              <el-input-number v-model="form.morningHumidity" :precision="1" :min="0" :max="100" style="width: 100%" placeholder="适宜：50-80%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="晚间温度">
              <el-input-number v-model="form.eveningTemperature" :precision="1" :min="-20" :max="50" style="width: 100%" placeholder="适宜：25-35°C" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="晚间湿度">
              <el-input-number v-model="form.eveningHumidity" :precision="1" :min="0" :max="100" style="width: 100%" placeholder="适宜：50-80%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">蜂群活动</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="活动强度" prop="activityLevel">
              <el-slider v-model="form.activityLevel" :min="1" :max="10" show-input :marks="activityMarks" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">外界环境</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="外界温度">
              <el-input-number v-model="form.outsideTemperature" :precision="1" :min="-30" :max="50" style="width: 100%" placeholder="外界环境温度" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="外界湿度">
              <el-input-number v-model="form.outsideHumidity" :precision="1" :min="0" :max="100" style="width: 100%" placeholder="外界环境湿度" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" rows="2" placeholder="其他备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBeehives } from '@/api/beehive'
import { getRecordsByBeehive, createRecord, updateRecord, deleteRecord } from '@/api/record'

const beehives = ref([])
const records = ref([])
const selectedBeehiveId = ref(null)
const dialogVisible = ref(false)
const isEdit = ref(false)
const loading = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  beehiveId: null,
  recordDate: null,
  morningTemperature: null,
  eveningTemperature: null,
  morningHumidity: null,
  eveningHumidity: null,
  activityLevel: 5,
  outsideTemperature: null,
  outsideHumidity: null,
  notes: ''
})

const rules = {
  beehiveId: [{ required: true, message: '请选择蜂箱', trigger: 'change' }],
  recordDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  activityLevel: [{ required: true, message: '请输入活动强度', trigger: 'change' }]
}

const activityMarks = {
  1: '低',
  5: '中',
  10: '高'
}

function getActivityColor(level) {
  if (level >= 7) return '#67c23a'
  if (level >= 4) return '#409eff'
  return '#f56c6c'
}

async function loadBeehives() {
  try {
    beehives.value = await getBeehives()
    if (beehives.value.length > 0) {
      selectedBeehiveId.value = beehives.value[0].id
      loadRecords()
    }
  } catch (error) {
    console.error('加载蜂箱列表失败', error)
  }
}

async function loadRecords() {
  if (!selectedBeehiveId.value) return
  
  loading.value = true
  try {
    records.value = await getRecordsByBeehive(selectedBeehiveId.value)
  } catch (error) {
    console.error('加载记录失败', error)
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  if (!selectedBeehiveId.value && beehives.value.length > 0) {
    selectedBeehiveId.value = beehives.value[0].id
  }
  
  isEdit.value = false
  form.id = null
  form.beehiveId = selectedBeehiveId.value
  form.recordDate = new Date().toISOString().split('T')[0]
  form.morningTemperature = null
  form.eveningTemperature = null
  form.morningHumidity = null
  form.eveningHumidity = null
  form.activityLevel = 5
  form.outsideTemperature = null
  form.outsideHumidity = null
  form.notes = ''
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  form.id = row.id
  form.beehiveId = row.beehive?.id || selectedBeehiveId.value
  form.recordDate = row.recordDate
  form.morningTemperature = row.morningTemperature
  form.eveningTemperature = row.eveningTemperature
  form.morningHumidity = row.morningHumidity
  form.eveningHumidity = row.eveningHumidity
  form.activityLevel = row.activityLevel
  form.outsideTemperature = row.outsideTemperature
  form.outsideHumidity = row.outsideHumidity
  form.notes = row.notes || ''
  dialogVisible.value = true
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除该记录吗？`, '提示', { type: 'warning' })
    await deleteRecord(row.id)
    ElMessage.success('删除成功')
    loadRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      await updateRecord(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await createRecord(form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadRecords()
  } catch (error) {
    console.error('提交失败', error)
  }
}

onMounted(() => {
  loadBeehives()
})
</script>
