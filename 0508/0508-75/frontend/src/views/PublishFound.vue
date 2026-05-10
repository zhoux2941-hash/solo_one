<template>
  <div class="page-container" style="max-width: 800px">
    <h2 class="page-title">
      <el-icon><Found /></el-icon>
      发布捡到物品
    </h2>

    <el-card shadow="hover">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="物品名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="例如：黑色钱包、华为手机" />
        </el-form-item>
        <el-form-item label="捡到地点" prop="location">
          <el-input v-model="form.location" placeholder="例如：图书馆3楼、一食堂" />
        </el-form-item>
        <el-form-item label="捡到时间" prop="foundTime">
          <el-date-picker
            v-model="form.foundTime"
            type="datetime"
            placeholder="选择捡到时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="存放地点" prop="storageLocation">
          <el-input v-model="form.storageLocation" placeholder="例如：保卫处、3号宿舍楼下" />
        </el-form-item>
        
        <MapPicker v-model="form.position" />
        
        <el-form-item label="物品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="详细描述物品特征..."
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit">
            发布
          </el-button>
          <el-button @click="router.push('/')">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { foundApi } from '@/api'
import MapPicker from '@/components/MapPicker.vue'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  itemName: '',
  location: '',
  foundTime: null,
  storageLocation: '',
  description: '',
  position: null
})

const rules = {
  itemName: [{ required: true, message: '请输入物品名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入捡到地点', trigger: 'blur' }],
  foundTime: [{ required: true, message: '请选择捡到时间', trigger: 'change' }],
  storageLocation: [{ required: true, message: '请输入存放地点', trigger: 'blur' }]
}

const submitData = computed(() => {
  const data = { ...form }
  if (form.position) {
    data.lng = form.position.lng
    data.lat = form.position.lat
  }
  delete data.position
  return data
})

async function submit() {
  try {
    await formRef.value.validate()
    loading.value = true
    await foundApi.create(submitData.value)
    ElMessage.success('发布成功！系统会每天自动扫描匹配')
    router.push('/my-items')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
