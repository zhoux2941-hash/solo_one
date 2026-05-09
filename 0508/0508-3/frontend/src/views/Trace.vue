<template>
  <div class="page-container">
    <div class="page-card">
      <h3 class="page-title">领用记录溯源查询</h3>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="溯源查询" name="trace">
          <div class="search-bar">
            <el-form :inline="true" :model="searchForm">
              <el-form-item label="试剂分类">
                <el-select v-model="searchForm.category" placeholder="选择分类" clearable style="width: 160px">
                  <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
                </el-select>
              </el-form-item>
              <el-form-item label="申请日期">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
              <el-form-item label="申请人" v-if="user.role === 'admin'">
                <el-select v-model="searchForm.userId" placeholder="选择申请人" clearable style="width: 160px">
                  <el-option v-for="u in teachers" :key="u.id" :label="u.name" :value="u.id" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSearch" :loading="searching">查询</el-button>
                <el-button @click="resetSearch">重置</el-button>
                <el-button type="success" @click="exportTraceData">导出</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="records" border stripe :row-key="row => row.id" v-loading="searching">
            <el-table-column prop="id" label="记录编号" width="100" />
            <el-table-column prop="requisitionId" label="申请编号" width="100" />
            <el-table-column prop="userName" label="申请人" width="100" />
            <el-table-column prop="department" label="部门" width="120" />
            <el-table-column prop="reagentName" label="试剂名称" width="150" />
            <el-table-column prop="quantity" label="领用数量" width="100" />
            <el-table-column prop="purpose" label="用途" show-overflow-tooltip />
            <el-table-column prop="operationType" label="操作类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.operationType === 'approved' ? 'success' : 'danger'" size="small">
                  {{ row.operationType === 'approved' ? '领用' : '驳回' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operationTime" label="操作时间" width="180" />
            <el-table-column prop="operatorName" label="操作人" width="100" />
          </el-table>

          <div style="margin-top: 20px; text-align: center;">
            <el-empty v-if="records.length === 0 && !searching" description="暂无数据" />
            <span v-if="records.length > 0">共 {{ records.length }} 条记录</span>
          </div>
        </el-tab-pane>

        <el-tab-pane label="月度统计台账" name="stats">
          <div class="search-bar">
            <el-form :inline="true">
              <el-form-item label="选择月份">
                <el-date-picker
                  v-model="statsMonth"
                  type="month"
                  placeholder="选择月份"
                  value-format="YYYY-MM"
                  style="width: 200px;"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadMonthlyStats" :loading="statsLoading">查询</el-button>
                <el-button type="success" @click="exportMonthlyStats">导出台账</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="monthlyStats" border stripe :row-key="row => row.reagentId" v-loading="statsLoading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="reagentName" label="试剂名称" width="180" />
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column prop="specification" label="规格" />
            <el-table-column prop="unit" label="单位" width="60" />
            <el-table-column prop="totalQuantity" label="领用总量" width="100">
              <template #default="{ row }">
                <span style="font-weight: bold; color: #409EFF;">{{ row.totalQuantity || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="approvalCount" label="领用次数" width="100" />
          </el-table>

          <div v-if="monthlyStats.length > 0" style="margin-top: 15px; padding: 15px; background: #f5f7fa; border-radius: 4px;">
            <el-row :gutter="20">
              <el-col :span="8">
                <div style="text-align: center;">
                  <div style="font-size: 28px; font-weight: bold; color: #409EFF;">
                    {{ totalStats.totalQuantity }}
                  </div>
                  <div style="color: #909399; font-size: 12px;">本月领用总量</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div style="text-align: center;">
                  <div style="font-size: 28px; font-weight: bold; color: #67C23A;">
                    {{ totalStats.approvalCount }}
                  </div>
                  <div style="color: #909399; font-size: 12px;">本月领用次数</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div style="text-align: center;">
                  <div style="font-size: 28px; font-weight: bold; color: #E6A23C;">
                    {{ totalStats.reagentCount }}
                  </div>
                  <div style="color: #909399; font-size: 12px;">领用试剂种类</div>
                </div>
              </el-col>
            </el-row>
          </div>

          <div style="margin-top: 20px; text-align: center;">
            <el-empty v-if="monthlyStats.length === 0 && !statsLoading" description="该月暂无领用记录" />
            <span v-if="monthlyStats.length > 0">共 {{ monthlyStats.length }} 种试剂</span>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import request from '../utils/request'

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const activeTab = ref('trace')
const records = ref([])
const categories = ref([])
const teachers = ref([])
const searching = ref(false)
const dateRange = ref([])
let requestCount = 0

const monthlyStats = ref([])
const statsLoading = ref(false)
const statsMonth = ref(new Date().toISOString().slice(0, 7))

const searchForm = reactive({
  category: '',
  startDate: '',
  endDate: '',
  userId: null
})

const totalStats = computed(() => {
  const stats = { totalQuantity: 0, approvalCount: 0, reagentCount: 0 }
  monthlyStats.value.forEach(r => {
    stats.totalQuantity += r.totalQuantity || 0
    stats.approvalCount += r.approvalCount || 0
    stats.reagentCount++
  })
  return stats
})

const loadCategories = async () => {
  const res = await request.get('/reagent/categories')
  categories.value = res.data
}

const loadTeachers = async () => {
  const res = await request.get('/user/teachers')
  teachers.value = res.data
}

const handleSearch = async () => {
  requestCount++
  const currentRequest = requestCount

  const params = {
    category: searchForm.category || undefined,
    startDate: undefined,
    endDate: undefined
  }

  if (user.value.role === 'admin') {
    params.userId = searchForm.userId || undefined
  } else {
    params.userId = user.value.id
  }

  if (dateRange.value && dateRange.value.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }

  searching.value = true
  try {
    const res = await request.get('/requisition/search', { params })
    if (currentRequest === requestCount) {
      records.value = []
      await nextTick()
      records.value = res.data || []
    }
  } finally {
    if (currentRequest === requestCount) {
      searching.value = false
    }
  }
}

const resetSearch = () => {
  searchForm.category = ''
  searchForm.userId = null
  dateRange.value = []
  handleSearch()
}

const loadMonthlyStats = async () => {
  statsLoading.value = true
  try {
    const res = await request.get('/requisition/monthly-stats', {
      params: { yearMonth: statsMonth.value }
    })
    monthlyStats.value = res.data || []
  } finally {
    statsLoading.value = false
  }
}

const handleTabChange = (tab) => {
  if (tab === 'stats' && monthlyStats.value.length === 0) {
    loadMonthlyStats()
  }
}

const exportTraceData = () => {
  if (records.value.length === 0) {
    return
  }
  const headers = ['记录编号', '申请编号', '申请人', '部门', '试剂名称', '数量', '用途', '操作类型', '操作时间', '操作人']
  const rows = records.value.map(r => [
    r.id, r.requisitionId, r.userName, r.department, r.reagentName,
    r.quantity, r.purpose, r.operationType === 'approved' ? '领用' : '驳回',
    r.operationTime, r.operatorName
  ])
  
  const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v || ''}"`).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `领用记录_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}

const exportMonthlyStats = () => {
  if (monthlyStats.value.length === 0) {
    return
  }
  const monthText = statsMonth.value || new Date().toISOString().slice(0, 7)
  const headers = ['序号', '试剂名称', '分类', '规格', '单位', '领用总量', '领用次数']
  const rows = monthlyStats.value.map((r, i) => [
    i + 1, r.reagentName, r.category, r.specification, r.unit,
    r.totalQuantity || 0, r.approvalCount || 0
  ])
  
  const summary = [
    '', '', '', '', '',
    totalStats.value.totalQuantity,
    totalStats.value.approvalCount
  ]
  rows.push(['合计', '', '', '', '', ...summary.slice(5)])
  
  const csvContent = [
    `月度领用统计台账 - ${monthText}`,
    '',
    headers.join(','),
    ...rows.map(r => r.map(v => `"${v || ''}"`).join(','))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `月度领用台账_${monthText}.csv`
  link.click()
}

onMounted(async () => {
  await Promise.all([
    loadCategories(),
    user.value.role === 'admin' ? loadTeachers() : Promise.resolve()
  ])
  handleSearch()
})
</script>
