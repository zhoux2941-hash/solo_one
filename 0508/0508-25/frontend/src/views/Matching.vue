<template>
  <div class="page-container">
    <div class="page-title">🎯 智能匹配推荐</div>

    <el-card class="card-shadow mb-20">
      <el-form :inline="true" :model="matchForm" label-width="80px">
        <el-form-item label="选择宠物">
          <el-select v-model="matchForm.petId" placeholder="请选择宠物" style="width: 200px" @change="resetRecommendations">
            <el-option
              v-for="pet in pets"
              :key="pet.petId"
              :label="`${pet.name} (${pet.type === 'DOG' ? '狗' : '猫'})`"
              :value="pet.petId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入住日期">
          <el-date-picker
            v-model="matchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="入住日期"
            end-placeholder="离开日期"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="findRecommendations" :loading="loading">
            <el-icon><Search /></el-icon>
            开始匹配
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="matchForm.petId" class="mb-20">
      <el-card class="card-shadow">
        <div slot="header">
          <span>🐾 宠物信息</span>
        </div>
        <el-descriptions :column="4" border v-if="selectedPet">
          <el-descriptions-item label="名称">{{ selectedPet.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="selectedPet.type === 'DOG' ? 'success' : 'warning'">
              {{ selectedPet.type === 'DOG' ? '狗' : '猫' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="体型">{{ sizeMap[selectedPet.size] }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ selectedPet.age || '-' }} 岁</el-descriptions-item>
          <el-descriptions-item label="品种" :span="2">{{ selectedPet.breed || '-' }}</el-descriptions-item>
          <el-descriptions-item label="特殊需求" :span="2">
            <el-tag v-if="selectedPet.specialNeeds" type="warning">
              {{ selectedPet.specialNeeds }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <div v-if="recommendations.length > 0">
      <el-divider content-position="left">
        <span class="divider-text">推荐结果（共 {{ recommendations.length }} 个匹配）</span>
      </el-divider>

      <el-row :gutter="20">
        <el-col :span="12" v-for="(rec, index) in recommendations" :key="rec.room.roomId">
          <el-card class="card-shadow recommendation-card mb-20" :border="false">
            <div class="recommendation-header">
              <div class="rank-badge">Top {{ index + 1 }}</div>
              <div class="match-score">
                <el-progress
                  type="circle"
                  :percentage="Math.round(rec.matchScore)"
                  :width="80"
                  :color="getScoreColor(rec.matchScore)"
                />
              </div>
            </div>

            <h3 class="room-name">{{ rec.room.name }}</h3>
            <p class="center-name">{{ rec.center?.name }}</p>

            <el-row :gutter="10" class="room-info">
              <el-col :span="8">
                <div class="info-item">
                  <span class="info-label">价格</span>
                  <span class="info-value">¥{{ rec.room.pricePerDay }}/天</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="info-item">
                  <span class="info-label">容量</span>
                  <span class="info-value">{{ rec.room.capacity }}只</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="info-item">
                  <span class="info-label">房型</span>
                  <span class="info-value">{{ roomTypeMap[rec.room.roomType] }}</span>
                </div>
              </el-col>
            </el-row>

            <div v-if="rec.matchReasons && rec.matchReasons.length > 0" class="match-reasons">
              <el-tag v-for="reason in rec.matchReasons" :key="reason" type="success" effect="light" class="mr-5 mb-5">
                ✓ {{ reason }}
              </el-tag>
            </div>

            <div class="room-desc">{{ rec.room.description }}</div>

            <div class="action-buttons mt-20">
              <el-button type="primary" @click="quickBook(rec)">
                <el-icon><Tickets /></el-icon>
                立即预约
              </el-button>
              <el-button>查看详情</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-empty v-else-if="!loading && matchForm.petId && matchForm.dateRange" description="没有找到匹配的房间">
      <el-button type="primary">调整条件重试</el-button>
    </el-empty>

    <el-empty v-else-if="!matchForm.petId" description="请先选择宠物和日期">
      <div class="empty-tips">
        <p>选择您的宠物和入住日期，我们将为您智能推荐最合适的寄养房间</p>
      </div>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { petApi, matchingApi, bookingApi } from '@/api'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const pets = ref([])
const recommendations = ref([])
const loading = ref(false)

const matchForm = ref({
  petId: null,
  dateRange: []
})

const sizeMap = {
  SMALL: '小型',
  MEDIUM: '中型',
  LARGE: '大型'
}

const roomTypeMap = {
  SMALL_DOG_ROOM: '小型犬房',
  MEDIUM_DOG_ROOM: '中型犬房',
  LARGE_DOG_ROOM: '大型犬房',
  CAT_CAVE: '猫咪城堡',
  CAT_LOFT: '猫咪阁楼',
  DELUXE_CAT_ROOM: '豪华猫房',
  SMALL_PET_SUITE: '小型宠物套房'
}

const selectedPet = computed(() => {
  return pets.value.find(p => p.petId === matchForm.value.petId)
})

const loadPets = async () => {
  try {
    pets.value = await petApi.getByOwner(appStore.currentOwnerId)
  } catch (e) {
    console.error(e)
  }
}

const resetRecommendations = () => {
  recommendations.value = []
}

const getScoreColor = (score) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const findRecommendations = async () => {
  if (!matchForm.value.petId) {
    ElMessage.warning('请选择宠物')
    return
  }
  if (!matchForm.value.dateRange || matchForm.value.dateRange.length !== 2) {
    ElMessage.warning('请选择入住和离开日期')
    return
  }

  loading.value = true
  try {
    const startDate = dayjs(matchForm.value.dateRange[0]).format('YYYY-MM-DD')
    const endDate = dayjs(matchForm.value.dateRange[1]).format('YYYY-MM-DD')

    recommendations.value = await matchingApi.getRecommendations(
      matchForm.value.petId,
      startDate,
      endDate
    )

    if (recommendations.value.length === 0) {
      ElMessage.info('没有找到匹配的房间')
    }
  } catch (e) {
    ElMessage.error('匹配失败')
  } finally {
    loading.value = false
  }
}

const quickBook = async (rec) => {
  try {
    const startDate = dayjs(matchForm.value.dateRange[0]).format('YYYY-MM-DD')
    const endDate = dayjs(matchForm.value.dateRange[1]).format('YYYY-MM-DD')

    await bookingApi.create({
      petId: matchForm.value.petId,
      roomId: rec.room.roomId,
      startDate,
      endDate,
      specialRequirements: selectedPet.value?.specialNeeds || ''
    })

    ElMessage.success('预约创建成功！')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '预约失败')
  }
}

onMounted(() => {
  loadPets()
})
</script>

<style scoped>
.divider-text {
  font-size: 16px;
  font-weight: 600;
}

.recommendation-card {
  position: relative;
  overflow: visible;
}

.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.rank-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.match-score {
  text-align: center;
}

.room-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
}

.center-name {
  color: #909399;
  font-size: 14px;
  margin-bottom: 15px;
}

.room-info {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.info-item {
  text-align: center;
}

.info-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.info-value {
  font-weight: 600;
  color: #303133;
}

.match-reasons {
  margin-bottom: 15px;
}

.room-desc {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.empty-tips {
  color: #909399;
}

.mr-5 {
  margin-right: 5px;
}

.mb-5 {
  margin-bottom: 5px;
}
</style>
