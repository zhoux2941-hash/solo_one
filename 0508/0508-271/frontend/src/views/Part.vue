<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>配件库存</span>
          <el-button type="primary" size="small" @click="handleAdd">新增配件</el-button>
        </div>
      </template>
      
      <div style="margin-bottom: 15px">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索配件名称或编号"
          style="width: 300px"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <el-table :data="tableData" border>
        <el-table-column prop="partNo" label="配件编号" />
        <el-table-column prop="name" label="配件名称" />
        <el-table-column prop="brand" label="品牌" />
        <el-table-column prop="spec" label="规格" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="costPrice" label="进价(¥)" />
        <el-table-column prop="salePrice" label="售价(¥)" />
        <el-table-column prop="stock" label="库存数量">
          <template #default="{ row }">
            <el-tag :type="row.stock <= 10 ? 'danger' : 'success'">{{ row.stock }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放位置" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleStockIn(row)">入库</el-button>
            <el-button size="small" type="warning" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="配件编号">
              <el-input v-model="form.partNo" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配件名称">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌">
              <el-input v-model="form.brand" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格">
              <el-input v-model="form.spec" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="form.unit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放位置">
              <el-input v-model="form.location" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="进价">
              <el-input-number v-model="form.costPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="售价">
              <el-input-number v-model="form.salePrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stockInVisible" title="配件入库" width="400px">
      <el-form label-width="80px">
        <el-form-item label="配件名称">
          <span>{{ currentPart?.name }}</span>
        </el-form-item>
        <el-form-item label="当前库存">
          <span>{{ currentPart?.stock }}</span>
        </el-form-item>
        <el-form-item label="入库数量">
          <el-input-number v-model="stockInQuantity" :min="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockInVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStockIn">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { partApi } from '../api'

const searchKeyword = ref('')
const tableData = ref([])
const dialogVisible = ref(false)
const stockInVisible = ref(false)
const dialogTitle = ref('')
const form = ref({})
const currentPart = ref(null)
const stockInQuantity = ref(1)

const loadData = async () => {
  const res = await partApi.list()
  if (res.code === 200) {
    tableData.value = res.data
  }
}

const handleSearch = async () => {
  if (searchKeyword.value) {
    const res = await partApi.search(searchKeyword.value)
    if (res.code === 200) {
      tableData.value = res.data
    }
  } else {
    loadData()
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增配件'
  form.value = { stock: 0 }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑配件'
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSave = async () => {
  const res = await partApi.save(form.value)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  }
}

const handleStockIn = (row) => {
  currentPart.value = row
  stockInQuantity.value = 1
  stockInVisible.value = true
}

const confirmStockIn = async () => {
  const res = await partApi.stockIn(currentPart.value.id, stockInQuantity.value)
  if (res.code === 200) {
    ElMessage.success('入库成功')
    stockInVisible.value = false
    loadData()
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除此配件？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await partApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>