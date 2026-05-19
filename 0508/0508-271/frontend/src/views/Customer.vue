<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>客户列表</span>
          <el-button type="primary" size="small" @click="handleAdd">新增客户</el-button>
        </div>
      </template>
      
      <div style="margin-bottom: 15px">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索客户名称或电话"
          style="width: 300px"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <el-table :data="tableData" border>
        <el-table-column prop="name" label="客户名称" />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="wechat" label="微信号" />
        <el-table-column prop="address" label="地址" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="客户信息" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="客户名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="微信号">
          <el-input v-model="form.wechat" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { customerApi } from '../api'

const searchKeyword = ref('')
const tableData = ref([])
const dialogVisible = ref(false)
const form = ref({})

const loadData = async () => {
  const res = await customerApi.list()
  if (res.code === 200) {
    tableData.value = res.data
  }
}

const handleSearch = async () => {
  if (searchKeyword.value) {
    const res = await customerApi.search(searchKeyword.value)
    if (res.code === 200) {
      tableData.value = res.data
    }
  } else {
    loadData()
  }
}

const handleAdd = () => {
  form.value = {}
  dialogVisible.value = true
}

const handleEdit = (row) => {
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSave = async () => {
  const res = await customerApi.save(form.value)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除此客户？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await customerApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>