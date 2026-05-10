<template>
  <div class="home-container">
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span>搜索光谱</span>
        </div>
      </template>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="元素">
          <el-select v-model="searchForm.element" placeholder="选择元素" clearable>
            <el-option label="Na (钠)" value="Na"></el-option>
            <el-option label="Mg (镁)" value="Mg"></el-option>
            <el-option label="Fe (铁)" value="Fe"></el-option>
            <el-option label="Ca (钙)" value="Ca"></el-option>
            <el-option label="H (氢)" value="H"></el-option>
            <el-option label="O (氧)" value="O"></el-option>
            <el-option label="N (氮)" value="N"></el-option>
            <el-option label="Si (硅)" value="Si"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="最小速度 (km/s)">
          <el-input-number v-model="searchForm.minVelocity" :min="0" :max="100" :step="1" placeholder="最小速度" clearable />
        </el-form-item>
        <el-form-item label="最大速度 (km/s)">
          <el-input-number v-model="searchForm.maxVelocity" :min="0" :max="100" :step="1" placeholder="最大速度" clearable />
        </el-form-item>
        <el-form-item label="上传者">
          <el-input v-model="searchForm.uploaderName" placeholder="输入上传者名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span>光谱列表</span>
          <span class="total-count">共 {{ total }} 条</span>
        </div>
      </template>
      <div v-loading="loading" class="spectra-grid">
        <div v-for="item in spectraList" :key="item.id" class="spectra-card" @click="viewDetail(item.id)">
          <div class="thumbnail-wrapper">
            <el-image 
              :src="item.thumbnailUrl" 
              fit="cover"
              :lazy="true"
              placeholder="加载中..."
            >
              <template #error>
                <div class="image-slot">
                  <el-icon :size="30"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>
          <div class="spectra-info">
            <div class="filename" :title="item.originalFilename">{{ item.originalFilename }}</div>
            <div class="meta">
              <span v-if="item.uploaderName" class="uploader">
                <el-icon><User /></el-icon>
                {{ item.uploaderName }}
              </span>
              <span v-if="item.velocity" class="velocity">
                <el-icon><Speed /></el-icon>
                {{ item.velocity }} km/s
              </span>
            </div>
            <div class="wavelength" v-if="item.minWavelength && item.maxWavelength">
              {{ item.minWavelength.toFixed(0) }} - {{ item.maxWavelength.toFixed(0) }} Å
            </div>
            <div class="elements" v-if="item.detectedElements && item.detectedElements.length > 0">
              <el-tag 
                v-for="el in item.detectedElements.slice(0, 5)" 
                :key="el" 
                size="small" 
                type="info"
                class="element-tag"
              >
                {{ el }}
              </el-tag>
              <span v-if="item.detectedElements.length > 5" class="more-elements">
                +{{ item.detectedElements.length - 5 }}
              </span>
            </div>
            <div class="footer">
              <span class="views">
                <el-icon><View /></el-icon>
                {{ item.viewCount }}
              </span>
              <span class="date">{{ formatDate(item.uploadTime) }}</span>
            </div>
          </div>
        </div>
      </div>
      <el-pagination
        v-if="total > 0"
        class="pagination"
        background
        layout="prev, pager, next, total"
        :page-size="pageSize"
        :total="total"
        :current-page="currentPage"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Picture, User, Speed, View } from '@element-plus/icons-vue'
import { spectraApi } from '../api/spectra'

const router = useRouter()
const loading = ref(false)
const spectraList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const isSearching = ref(false)

const searchForm = ref({
  element: null,
  minVelocity: null,
  maxVelocity: null,
  uploaderName: ''
})

const fetchSpectra = async () => {
  loading.value = true
  try {
    const response = await spectraApi.getAll(currentPage.value - 1, pageSize.value)
    spectraList.value = response.data.content
    total.value = response.data.totalElements
  } catch (error) {
    ElMessage.error('获取光谱列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  isSearching.value = true
  loading.value = true
  currentPage.value = 1
  
  try {
    const searchData = {
      page: 0,
      size: pageSize.value,
      element: searchForm.value.element,
      minVelocity: searchForm.value.minVelocity,
      maxVelocity: searchForm.value.maxVelocity,
      uploaderName: searchForm.value.uploaderName || null
    }
    
    const response = await spectraApi.search(searchData)
    spectraList.value = response.data.content
    total.value = response.data.totalElements
  } catch (error) {
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.value = {
    element: null,
    minVelocity: null,
    maxVelocity: null,
    uploaderName: ''
  }
  isSearching.value = false
  currentPage.value = 1
  fetchSpectra()
}

const handlePageChange = (page) => {
  currentPage.value = page
  if (isSearching.value) {
    const searchData = {
      page: page - 1,
      size: pageSize.value,
      element: searchForm.value.element,
      minVelocity: searchForm.value.minVelocity,
      maxVelocity: searchForm.value.maxVelocity,
      uploaderName: searchForm.value.uploaderName || null
    }
    spectraApi.search(searchData).then(response => {
      spectraList.value = response.data.content
    })
  } else {
    fetchSpectra()
  }
}

const viewDetail = (id) => {
  router.push(`/spectra/${id}`)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchSpectra()
})
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.total-count {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
}

.search-form {
  flex-wrap: wrap;
}

.spectra-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  min-height: 200px;
}

.spectra-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.spectra-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.thumbnail-wrapper {
  width: 100%;
  height: 160px;
  background: #f5f7fa;
  overflow: hidden;
}

.thumbnail-wrapper :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}

.spectra-info {
  padding: 12px;
}

.filename {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #606266;
}

.meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.wavelength {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.elements {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.element-tag {
  margin-right: 0;
}

.more-elements {
  font-size: 12px;
  color: #909399;
  line-height: 24px;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  border-top: 1px solid #ebeef5;
  padding-top: 8px;
}

.footer span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
