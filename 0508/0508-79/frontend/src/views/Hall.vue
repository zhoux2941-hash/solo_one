<template>
  <div class="hall-page">
    <div class="page-header">
      <h2 class="page-title">匹配大厅</h2>
      <p>搜索你感兴趣的盲盒，主动发起交换请求</p>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="系列名称">
          <el-input v-model="searchForm.seriesName" placeholder="搜索系列" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="款式">
          <el-input v-model="searchForm.styleName" placeholder="搜索款式" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="mt-20">
      <el-empty v-if="loading && !boxes.length" description="加载中..." />
      <el-empty v-else-if="!boxes.length" description="没有找到符合条件的盲盒" />
      <div v-else class="grid-4">
        <el-card v-for="box in boxes" :key="box.id" shadow="hover" class="box-card">
          <div class="box-image" @click="viewBoxDetail(box)">
            <img v-if="box.imageUrl" :src="box.imageUrl" />
            <span v-else>{{ box.seriesName }}</span>
          </div>
          <div class="box-content">
            <p class="series">{{ box.seriesName }}</p>
            <p class="style">{{ box.styleName }}</p>
            <p class="model">型号: {{ box.modelNumber }}</p>
            <div class="flex space-between items-center mt-10">
              <el-tag type="success">可交换</el-tag>
              <el-tag type="info">{{ box.condition }}</el-tag>
            </div>
            <el-button 
              type="primary" 
              size="small" 
              style="width: 100%; margin-top: 12px"
              @click="openRequestDialog(box)"
            >
              发起交换
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="search"
      />
    </div>

    <el-dialog v-model="showDetailDialog" :title="selectedBox?.seriesName" width="650px">
      <div v-if="selectedBox" class="box-detail">
        <div class="detail-image">
          <img v-if="selectedBox.imageUrl" :src="selectedBox.imageUrl" />
          <span v-else>{{ selectedBox.seriesName }}</span>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="系列">{{ selectedBox.seriesName }}</el-descriptions-item>
          <el-descriptions-item label="款式">{{ selectedBox.styleName }}</el-descriptions-item>
          <el-descriptions-item label="型号">{{ selectedBox.modelNumber }}</el-descriptions-item>
          <el-descriptions-item label="新旧程度">{{ selectedBox.condition }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag type="success">可交换</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">
            {{ formatTime(selectedBox.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
        <p v-if="selectedBox.description" class="description">
          <strong>描述：</strong>{{ selectedBox.description }}
        </p>
        
        <el-divider>价格参考</el-divider>
        
        <ValuationPanel :boxId="selectedBox.id" />
        
        <el-divider>成交价趋势（近3个月）</el-divider>
        
        <div class="chart-section">
          <PriceChart 
            :seriesName="selectedBox.seriesName" 
            :styleName="selectedBox.styleName" 
            :months="3"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="openRequestDialog(selectedBox)">发起交换</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRequestDialog" title="发起交换请求" width="500px">
      <el-form ref="requestFormRef" :model="requestForm" :rules="requestRules" label-width="100px">
        <el-form-item label="对方盲盒">
          <div class="target-box">
            <div class="mini-image">
              <img v-if="targetBox?.imageUrl" :src="targetBox.imageUrl" />
              <span v-else>{{ targetBox?.seriesName }}</span>
            </div>
            <span>{{ targetBox?.seriesName }} - {{ targetBox?.styleName }}</span>
          </div>
        </el-form-item>
        <el-form-item label="我提供" prop="offerBoxId">
          <el-select v-model="requestForm.offerBoxId" placeholder="选择你要交换的盲盒" style="width: 100%" filterable>
            <el-option 
              v-for="box in myAvailableBoxes" 
              :key="box.id" 
              :label="`${box.seriesName} - ${box.styleName}`"
              :value="box.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="留言">
          <el-input v-model="requestForm.message" type="textarea" :rows="3" placeholder="想说的话（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRequestDialog = false">取消</el-button>
        <el-button type="primary" @click="sendRequest" :loading="requestLoading">发送请求</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { searchBoxes, getBoxDetail, getMyAvailableBoxes } from '@/api/box'
import { createRequest } from '@/api/exchange'
import ValuationPanel from '@/components/ValuationPanel.vue'
import PriceChart from '@/components/PriceChart.vue'

const route = useRoute()
const boxes = ref([])
const loading = ref(false)
const searchForm = reactive({
  seriesName: '',
  styleName: ''
})
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const totalPages = ref(0)

const selectedBox = ref(null)
const targetBox = ref(null)
const showDetailDialog = ref(false)
const showRequestDialog = ref(false)
const myAvailableBoxes = ref([])
const requestFormRef = ref()
const requestLoading = ref(false)
const requestForm = reactive({
  offerBoxId: null,
  message: ''
})

const requestRules = {
  offerBoxId: [{ required: true, message: '请选择要交换的盲盒', trigger: 'change' }]
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const search = async () => {
  loading.value = true
  try {
    const res = await searchBoxes({
      seriesName: searchForm.seriesName || undefined,
      styleName: searchForm.styleName || undefined,
      page: currentPage.value - 1,
      size: pageSize.value
    })
    boxes.value = res.data.content
    total.value = res.data.totalElements
    totalPages.value = res.data.totalPages
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.seriesName = ''
  searchForm.styleName = ''
  currentPage.value = 1
  search()
}

const fetchMyAvailableBoxes = async () => {
  try {
    const res = await getMyAvailableBoxes()
    myAvailableBoxes.value = res.data
  } catch (e) {
  }
}

const viewBoxDetail = async (box) => {
  try {
    const res = await getBoxDetail(box.id)
    selectedBox.value = res.data
    showDetailDialog.value = true
  } catch (e) {
  }
}

const openRequestDialog = async (box) => {
  targetBox.value = box
  showDetailDialog.value = false
  requestForm.offerBoxId = null
  requestForm.message = ''
  await fetchMyAvailableBoxes()
  if (myAvailableBoxes.value.length === 0) {
    ElMessage.warning('你没有可交换的盲盒，请先添加盲盒')
    return
  }
  showRequestDialog.value = true
}

const sendRequest = async () => {
  try {
    await requestFormRef.value.validate()
    requestLoading.value = true
    await createRequest({
      offerBoxId: requestForm.offerBoxId,
      requestBoxId: targetBox.value.id,
      message: requestForm.message
    })
    ElMessage.success('交换请求已发送，等待对方回复')
    showRequestDialog.value = false
    search()
  } finally {
    requestLoading.value = false
  }
}

onMounted(() => {
  search()
  fetchMyAvailableBoxes()
})

watch(() => route.query.boxId, (boxId) => {
  if (boxId) {
    getBoxDetail(boxId).then(res => {
      selectedBox.value = res.data
      showDetailDialog.value = true
    })
  }
}, { immediate: true })
</script>

<style scoped>
.hall-page {
  max-width: 1400px;
  margin: 0 auto;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.box-card {
  cursor: pointer;
}

.box-card :deep(.el-card__body) {
  padding: 0;
}

.box-content {
  padding: 12px;
}

.box-content .series {
  font-size: 14px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.box-content .style {
  font-size: 12px;
  color: #666;
  margin: 0 0 4px 0;
}

.box-content .model {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.mt-10 {
  margin-top: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.box-detail .detail-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 20px;
  overflow: hidden;
}

.box-detail .detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.box-detail .description {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.target-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.mini-image {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  overflow: hidden;
}

.mini-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chart-section {
  margin-top: 8px;
}
</style>
