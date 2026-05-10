<template>
  <div class="resident-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>居民列表</span>
          <el-button type="primary" @click="showDialog = true">
            <el-icon><Plus /></el-icon>
            添加居民
          </el-button>
        </div>
      </template>
      
      <el-table :data="residents" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="roomNumber" label="房号" width="120" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="points" label="积分" width="100" />
        <el-table-column prop="createTime" label="注册时间">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewRecords(scope.row)">
              投递记录
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" title="添加居民" width="400px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="房号" prop="roomNumber">
          <el-input v-model="form.roomNumber" placeholder="请输入房号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recordsDialog" title="投递记录" width="600px">
      <el-table :data="garbageRecords" border v-if="garbageRecords.length > 0">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="garbageType" label="类型" width="120">
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
      <el-empty v-else description="暂无投递记录" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { residentApi, garbageApi } from '@/api'

const residents = ref([])
const showDialog = ref(false)
const recordsDialog = ref(false)
const garbageRecords = ref([])
const formRef = ref(null)

const form = ref({
  roomNumber: '',
  name: ''
})

const rules = {
  roomNumber: [{ required: true, message: '请输入房号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const getResidents = async () => {
  const res = await residentApi.list()
  residents.value = res.data
}

const handleSubmit = async () => {
  await formRef.value.validate()
  await residentApi.register(form.value)
  ElMessage.success('注册成功')
  showDialog.value = false
  form.value = { roomNumber: '', name: '' }
  getResidents()
}

const viewRecords = async (row) => {
  const res = await garbageApi.getRecords(row.id)
  garbageRecords.value = res.data
  recordsDialog.value = true
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

onMounted(() => {
  getResidents()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
