<template>
  <div class="garbage-page">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>垃圾投递</span>
          </template>
          
          <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
            <el-form-item label="选择居民" prop="residentId">
              <el-select v-model="form.residentId" placeholder="请选择居民" style="width: 100%">
                <el-option
                  v-for="item in residents"
                  :key="item.id"
                  :label="`${item.roomNumber} - ${item.name}`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="垃圾类型" prop="garbageType">
              <el-radio-group v-model="form.garbageType">
                <el-radio-button label="RECYCLABLE">可回收 (1kg=2分)</el-radio-button>
                <el-radio-button label="KITCHEN">厨余 (1kg=1分)</el-radio-button>
                <el-radio-button label="HARMFUL">有害 (不加分)</el-radio-button>
                <el-radio-button label="OTHER">其他 (不加分)</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="重量(kg)" prop="weight">
              <el-input-number 
                v-model="form.weight" 
                :min="0.01" 
                :step="0.1"
                :precision="2"
                style="width: 100%" 
                placeholder="请输入重量"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleThrow" :loading="loading">
                <el-icon><Upload /></el-icon>
                投递并计算积分
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>积分规则说明</span>
          </template>
          
          <el-descriptions :column="1" border>
            <el-descriptions-item label="可回收垃圾">
              <el-tag type="success">1kg = 2积分</el-tag>
              <span class="desc">如废纸、塑料、玻璃、金属和布料等</span>
            </el-descriptions-item>
            <el-descriptions-item label="厨余垃圾">
              <el-tag type="warning">1kg = 1积分</el-tag>
              <span class="desc">如剩菜剩饭、骨头、菜根菜叶等</span>
            </el-descriptions-item>
            <el-descriptions-item label="有害垃圾">
              <el-tag type="danger">不加分</el-tag>
              <span class="desc">如废电池、废灯管、废药品等</span>
            </el-descriptions-item>
            <el-descriptions-item label="其他垃圾">
              <el-tag type="info">不加分</el-tag>
              <span class="desc">如砖瓦陶瓷、渣土、卫生间废纸等</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>最近投递记录</span>
          <el-button type="primary" @click="refreshRecords">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <el-table :data="records" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="居民" width="150">
          <template #default="scope">
            {{ getResidentName(scope.row.residentId) }}
          </template>
        </el-table-column>
        <el-table-column prop="garbageType" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.garbageType)">
              {{ getTypeName(scope.row.garbageType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="重量(kg)" width="100" />
        <el-table-column prop="pointsEarned" label="获得积分" width="100" />
        <el-table-column prop="createTime" label="时间">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { residentApi, garbageApi } from '@/api'

const generateRequestId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const residents = ref([])
const records = ref([])
const loading = ref(false)
const formRef = ref(null)
const lastRequestTime = ref(0)
const requestCooldown = 1000

const form = ref({
  residentId: null,
  garbageType: 'RECYCLABLE',
  weight: 1
})

const rules = {
  residentId: [{ required: true, message: '请选择居民', trigger: 'change' }],
  garbageType: [{ required: true, message: '请选择垃圾类型', trigger: 'change' }],
  weight: [{ required: true, message: '请输入重量', trigger: 'blur' }]
}

const estimatedPoints = computed(() => {
  const type = form.value.garbageType
  const weight = form.value.weight || 0
  const map = {
    RECYCLABLE: 2,
    KITCHEN: 1,
    HARMFUL: 0,
    OTHER: 0
  }
  return Math.floor(weight * (map[type] || 0))
})

const getResidents = async () => {
  const res = await residentApi.list()
  residents.value = res.data
}

const getRecords = async () => {
  const allRecords = []
  for (const r of residents.value) {
    const res = await garbageApi.getRecords(r.id)
    allRecords.push(...res.data)
  }
  records.value = allRecords
    .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    .slice(0, 20)
}

const refreshRecords = async () => {
  await getResidents()
  await getRecords()
}

const handleThrow = async () => {
  const now = Date.now()
  
  if (loading.value) return
  if (now - lastRequestTime.value < requestCooldown) {
    ElMessage.warning('操作过于频繁，请稍后再试')
    return
  }
  
  loading.value = true
  lastRequestTime.value = now
  
  try {
    await formRef.value.validate()
    
    const requestData = {
      ...form.value,
      requestId: generateRequestId()
    }
    
    const res = await garbageApi.throw(requestData)
    ElMessage.success(`投递成功！获得 ${res.data} 积分`)
    await getResidents()
    await getRecords()
    form.value.weight = 1
  } finally {
    loading.value = false
  }
}

const getResidentName = (id) => {
  const resident = residents.value.find(r => r.id === id)
  return resident ? `${resident.roomNumber} - ${resident.name}` : '未知'
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const getTypeName = (type) => {
  const map = {
    RECYCLABLE: '可回收',
    KITCHEN: '厨余',
    HARMFUL: '有害',
    OTHER: '其他'
  }
  return map[type] || type
}

const getTypeTag = (type) => {
  const map = {
    RECYCLABLE: 'success',
    KITCHEN: 'warning',
    HARMFUL: 'danger',
    OTHER: 'info'
  }
  return map[type] || 'info'
}

onMounted(async () => {
  await getResidents()
  await getRecords()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.desc {
  margin-left: 10px;
  color: #909399;
  font-size: 14px;
}
</style>
