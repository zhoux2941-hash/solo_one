<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 14px; color: #909399; margin-bottom: 10px">今日营收</div>
            <div style="font-size: 28px; font-weight: bold; color: #67c23a">¥ {{ dashboard.todayRevenue }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 14px; color: #909399; margin-bottom: 10px">今日工单</div>
            <div style="font-size: 28px; font-weight: bold; color: #409eff">{{ dashboard.todayOrderCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 14px; color: #909399; margin-bottom: 10px">本月营收</div>
            <div style="font-size: 28px; font-weight: bold; color: #e6a23c">¥ {{ dashboard.monthRevenue }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 14px; color: #909399; margin-bottom: 10px">本月工单</div>
            <div style="font-size: 28px; font-weight: bold; color: #f56c6c">{{ dashboard.monthOrderCount }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: bold">快捷操作</span>
          </template>
          <el-space wrap>
            <el-button type="primary" @click="$router.push('/workorder')">快速开单</el-button>
            <el-button type="success" @click="$router.push('/customer')">新增客户</el-button>
            <el-button type="warning" @click="$router.push('/part')">配件入库</el-button>
            <el-button type="info" @click="$router.push('/vehicle')">车辆登记</el-button>
          </el-space>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: bold">库存预警</span>
          </template>
          <el-table :data="warningParts" style="width: 100%" size="small">
            <el-table-column prop="name" label="配件名称" />
            <el-table-column prop="stock" label="库存数量" />
            <el-table-column prop="warningStock" label="预警值" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { statisticsApi, partApi } from '../api'

const dashboard = ref({
  todayRevenue: 0,
  todayOrderCount: 0,
  monthRevenue: 0,
  monthOrderCount: 0
})

const warningParts = ref([])

const loadData = async () => {
  const res = await statisticsApi.dashboard()
  if (res.code === 200) {
    dashboard.value = res.data
  }
  
  const partRes = await partApi.warning()
  if (partRes.code === 200) {
    warningParts.value = partRes.data
  }
}

onMounted(() => {
  loadData()
})
</script>