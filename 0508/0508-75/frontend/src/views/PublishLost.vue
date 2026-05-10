<template>
  <div class="page-container" style="max-width: 600px">
    <h2 class="page-title">
      <el-icon><Lost /></el-icon>
      发布丢失物品
    </h2>

    <el-card shadow="hover">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="物品名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="例如：黑色钱包、华为手机" />
        </el-form-item>
        <el-form-item label="丢失地点" prop="location">
          <el-input v-model="form.location" placeholder="例如：图书馆3楼、一食堂" />
        </el-form-item>
        <el-form-item label="丢失时间" prop="lostTime">
          <el-date-picker
            v-model="form.lostTime"
            type="datetime"
            placeholder="选择丢失时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="物品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="详细描述物品特征、包含物品等..."
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { lostApi } from '@/api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  itemName: '',
  location: '',
  lostTime: null,
  description: ''
})

const rules = {
  itemName: [{ required: true, message: '请输入物品名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入丢失地点', trigger: 'blur' }],
  lostTime: [{ required: true, message: '请选择丢失时间', trigger: 'change' }]
}

async function submit() {
  try {
    await formRef.value.validate()
    loading.value = true
    await lostApi.create(form)
    ElMessage.success('发布成功！系统会每天自动扫描匹配')
    router.push('/my-items')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
