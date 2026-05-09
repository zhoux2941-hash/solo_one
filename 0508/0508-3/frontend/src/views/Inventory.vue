<template>
  <div class="page-container">
    <div class="page-card">
      <h3 class="page-title">试剂库存管理</h3>

      <el-alert
        v-if="expiringReagents.length > 0"
        :title="`警告：有 ${expiringReagents.length} 个试剂已过期或即将过期`"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #default>
          <div v-for="item in expiringReagents.slice(0, 3)" :key="item.id" style="margin-top: 8px;">
            <el-tag :type="getExpireTagType(item.expireStatus)" size="small" style="margin-right: 8px;">
              {{ getExpireText(item.expireStatus) }}
            </el-tag>
            {{ item.name }} - 规格: {{ item.specification }}
          </div>
          <div v-if="expiringReagents.length > 3" style="margin-top: 8px; color: #909399;">
            ...还有 {{ expiringReagents.length - 3 }} 个试剂需要关注
          </div>
        </template>
      </el-alert>
      
      <div class="search-bar">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-select v-model="searchForm.category" placeholder="选择分类" clearable style="width: 100%">
              <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input v-model="searchForm.keyword" placeholder="搜索试剂名称" clearable @keyup.enter="handleSearch">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
          <el-col :span="6" style="text-align: right;" v-if="user.role === 'admin'">
            <el-button type="success" @click="openAddDialog">新增试剂</el-button>
          </el-col>
        </el-row>
      </div>

      <div class="table-container">
        <el-table :data="filteredReagents" border stripe :row-key="row => row.id">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="试剂名称" width="150" />
          <el-table-column prop="category" label="分类" width="100" />
          <el-table-column prop="specification" label="规格" />
          <el-table-column prop="unit" label="单位" width="60" />
          <el-table-column prop="quantity" label="库存量" width="80">
            <template #default="{ row }">
              <span :class="row.quantity < 10 ? 'low-stock' : ''">{{ row.quantity }}</span>
            </template>
          </el-table-column>
          <el-table-column label="过期状态" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.expireStatus != null" :type="getExpireTagType(row.expireStatus)" size="small">
                {{ getExpireText(row.expireStatus) }}
              </el-tag>
              <span v-else style="color: #909399;">正常</span>
            </template>
          </el-table-column>
          <el-table-column prop="expiryDate" label="过期日期" width="110">
            <template #default="{ row }">
              {{ formatDate(row.expiryDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="location" label="存放位置" width="100" />
          <el-table-column prop="description" label="描述" show-overflow-tooltip min-width="100" />
          <el-table-column label="操作" width="180" v-if="user.role === 'admin'">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="openStockDialog(row)">入库</el-button>
              <el-button type="warning" size="small" link @click="openEditDialog(row)">编辑</el-button>
              <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="addDialogVisible" title="新增试剂" width="520px">
      <el-form :model="reagentForm" label-width="80px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="试剂名称">
              <el-input v-model="reagentForm.name" placeholder="请输入试剂名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-input v-model="reagentForm.category" placeholder="如：酸类、碱类" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="规格">
              <el-input v-model="reagentForm.specification" placeholder="如：分析纯 500ml" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="reagentForm.unit" placeholder="如：瓶、袋" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="数量">
              <el-input-number v-model="reagentForm.quantity" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期日期">
              <el-date-picker
                v-model="reagentForm.expiryDate"
                type="datetime"
                placeholder="选择过期日期"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="存放位置">
          <el-input v-model="reagentForm.location" placeholder="如：A-01-01" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="reagentForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd" :loading="loading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑试剂" width="520px">
      <el-form :model="reagentForm" label-width="80px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="试剂名称">
              <el-input v-model="reagentForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-input v-model="reagentForm.category" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="规格">
              <el-input v-model="reagentForm.specification" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="reagentForm.unit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="过期日期">
          <el-date-picker
            v-model="reagentForm.expiryDate"
            type="datetime"
            placeholder="选择过期日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="存放位置">
          <el-input v-model="reagentForm.location" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="reagentForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEdit" :loading="loading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stockDialogVisible" title="试剂入库" width="400px">
      <el-form label-width="80px">
        <el-form-item label="试剂名称">
          <el-input :value="currentReagent?.name" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :value="currentReagent?.quantity" disabled />
        </el-form-item>
        <el-form-item label="入库数量">
          <el-input-number v-model="stockQuantity" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button type="success" @click="handleAddStock" :loading="loading">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import request from '../utils/request'

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const reagents = ref([])
const categories = ref([])
const loading = ref(false)
const addDialogVisible = ref(false)
const editDialogVisible = ref(false)
const stockDialogVisible = ref(false)
const currentReagent = ref(null)
const stockQuantity = ref(1)

const searchForm = reactive({
  category: '',
  keyword: ''
})

const reagentForm = reactive({
  id: null,
  name: '',
  category: '',
  specification: '',
  unit: '瓶',
  quantity: 0,
  location: '',
  description: '',
  expiryDate: ''
})

const filteredReagents = computed(() => {
  return reagents.value.filter(r => {
    const matchCategory = !searchForm.category || r.category === searchForm.category
    const matchKeyword = !searchForm.keyword || r.name.includes(searchForm.keyword)
    return matchCategory && matchKeyword
  })
})

const expiringReagents = computed(() => {
  return reagents.value.filter(r => r.expireStatus != null)
})

const formatDate = (date) => {
  if (!date) return '-'
  if (typeof date === 'string') {
    return date.substring(0, 10)
  }
  return new Date(date).toLocaleDateString('zh-CN')
}

const getExpireTagType = (status) => {
  if (status === -1) return 'danger'
  if (status <= 7) return 'danger'
  if (status <= 30) return 'warning'
  return 'success'
}

const getExpireText = (status) => {
  if (status === -1) return '已过期'
  if (status === 0) return '今天过期'
  return `剩${status}天`
}

const loadReagents = async () => {
  const res = await request.get('/reagent/list')
  reagents.value = res.data
}

const loadCategories = async () => {
  const res = await request.get('/reagent/categories')
  categories.value = res.data
}

const handleSearch = () => {}

const resetSearch = () => {
  searchForm.category = ''
  searchForm.keyword = ''
}

const openAddDialog = () => {
  Object.assign(reagentForm, {
    id: null,
    name: '',
    category: '',
    specification: '',
    unit: '瓶',
    quantity: 0,
    location: '',
    description: '',
    expiryDate: ''
  })
  addDialogVisible.value = true
}

const openEditDialog = (row) => {
  Object.assign(reagentForm, row)
  if (row.expiryDate && typeof row.expiryDate === 'string') {
    reagentForm.expiryDate = row.expiryDate.substring(0, 19)
  }
  editDialogVisible.value = true
}

const openStockDialog = (row) => {
  currentReagent.value = row
  stockQuantity.value = 1
  stockDialogVisible.value = true
}

const handleAdd = async () => {
  if (!reagentForm.name) {
    ElMessage.warning('请输入试剂名称')
    return
  }
  loading.value = true
  try {
    await request.post('/reagent/add', reagentForm)
    ElMessage.success('添加成功')
    addDialogVisible.value = false
    loadReagents()
    loadCategories()
  } finally {
    loading.value = false
  }
}

const handleEdit = async () => {
  loading.value = true
  try {
    await request.put('/reagent/update', reagentForm)
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    loadReagents()
  } finally {
    loading.value = false
  }
}

const handleAddStock = async () => {
  loading.value = true
  try {
    await request.post('/reagent/add-stock', {
      id: currentReagent.value.id,
      quantity: stockQuantity.value
    })
    ElMessage.success('入库成功')
    stockDialogVisible.value = false
    loadReagents()
  } finally {
    loading.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除试剂【${row.name}】？`, '提示', {
    type: 'warning'
  }).then(async () => {
    await request.delete(`/reagent/${row.id}`)
    ElMessage.success('删除成功')
    loadReagents()
  }).catch(() => {})
}

onMounted(() => {
  loadReagents()
  loadCategories()
})
</script>
