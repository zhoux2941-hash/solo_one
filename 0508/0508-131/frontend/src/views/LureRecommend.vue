<template>
  <div class="page-container">
    <div class="card">
      <h3 class="card-title">拟饵推荐</h3>
      <el-form :inline="true" class="filter-form">
        <el-form-item label="当前水温(°C)">
          <el-input-number v-model="waterTemp" :min="0" :max="40" :step="0.1" />
        </el-form-item>
        <el-form-item label="当前气温(°C)">
          <el-input-number v-model="airTemp" :min="-10" :max="50" :step="0.1" />
        </el-form-item>
        <el-form-item label="目标鱼种">
          <el-select v-model="targetSpecies" placeholder="全部鱼种" clearable style="width: 150px">
            <el-option
              v-for="species in speciesList"
              :key="species.id"
              :label="species.name"
              :value="species.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="getRecommendations">
            <el-icon><Search /></el-icon>
            获取推荐
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card mt-20">
      <h3 class="card-title">
        <el-icon><Trophy /></el-icon>
        推荐拟饵 Top 3
      </h3>
      <el-row :gutter="20" v-if="recommendations.length > 0">
        <el-col :span="8" v-for="(item, index) in recommendations" :key="item.lureId">
          <div class="recommend-card" :class="`rank-${index + 1}`">
            <div class="rank-badge">{{ index + 1 }}</div>
            <div class="lure-info">
              <h4>{{ item.brand || '未知品牌' }}</h4>
              <p class="model">{{ item.model }}</p>
              <p class="color">颜色: {{ item.color }}</p>
              <p v-if="item.ecoBadge" class="eco-badge">
                {{ item.ecoBadge }}
              </p>
              <div class="stats">
                <div class="stat-item">
                  <span class="label">使用次数</span>
                  <span class="value">{{ item.usageCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">钓获数量</span>
                  <span class="value">{{ item.catchCount }}</span>
                </div>
                <div class="stat-item" v-if="item.releaseCount > 0">
                  <span class="label">放流数量</span>
                  <span class="value" style="color: #43e97b">{{ item.releaseCount }}</span>
                </div>
                <div class="stat-item success-rate">
                  <span class="label">综合评分</span>
                  <span class="value">{{ item.successRate?.toFixed(1) }}%</span>
                </div>
              </div>
              <div v-if="item.ecoScore > 0" class="eco-info">
                🌱 生态评分: {{ item.ecoScore?.toFixed(1) }}% (放流率越高，推荐越优先)
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-empty v-else description="暂无推荐数据，请先添加钓鱼记录" />
    </div>

    <div class="card mt-20">
      <h3 class="card-title">推荐说明</h3>
      <el-alert
        type="info"
        :closable="false"
        title="推荐逻辑"
        description="系统根据当前水温、气温条件，在历史数据中筛选相似条件（±2°C范围）的记录。综合评分包含：钓获成功率（70%权重）+ 样本量奖励（10%）+ 生态评分加成（最高30%）。放流率高的拟饵将获得额外推荐优先级，鼓励路亚放流生态理念！"
      />
      <div class="mt-16">
        <h4 style="margin-bottom: 12px; color: #303133;">🌱 生态徽章体系</h4>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="badge-desc"><strong>🌍 生态卫士</strong> 放流率 ≥ 80%</div>
          </el-col>
          <el-col :span="6">
            <div class="badge-desc"><strong>🐟 放流达人</strong> 放流率 ≥ 50%</div>
          </el-col>
          <el-col :span="6">
            <div class="badge-desc"><strong>🌱 环保先锋</strong> 放流率 ≥ 30%</div>
          </el-col>
          <el-col :span="6">
            <div class="badge-desc"><strong>💧 开始放流</strong> 放流率 > 0%</div>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Trophy } from '@element-plus/icons-vue'
import { getLureRecommendations, getAllSpecies } from '@/api/fishing'

const waterTemp = ref(18)
const airTemp = ref(20)
const targetSpecies = ref(null)
const loading = ref(false)
const speciesList = ref([])
const recommendations = ref([])

const loadSpecies = async () => {
  try {
    const res = await getAllSpecies()
    speciesList.value = res.data
  } catch (error) {
    console.error('加载鱼种失败:', error)
  }
}

const getRecommendations = async () => {
  loading.value = true
  try {
    const params = {
      waterTemp: waterTemp.value,
      airTemp: airTemp.value
    }
    if (targetSpecies.value) {
      params.speciesId = targetSpecies.value
    }
    const res = await getLureRecommendations(params)
    recommendations.value = res.data || []
    if (recommendations.value.length === 0) {
      ElMessage.warning('当前条件下暂无推荐数据')
    }
  } catch (error) {
    console.error('获取推荐失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSpecies()
  getRecommendations()
})
</script>

<style scoped>
.filter-form {
  margin-bottom: 0;
}

.recommend-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: #fff;
  position: relative;
  min-height: 200px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.recommend-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.recommend-card.rank-1 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.recommend-card.rank-2 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.recommend-card.rank-3 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.rank-badge {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}

.lure-info h4 {
  margin: 0 0 8px;
  font-size: 16px;
  opacity: 0.9;
}

.lure-info .model {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
}

.lure-info .color {
  margin: 0 0 16px;
  opacity: 0.85;
}

.stats {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  text-align: center;
}

.stat-item .label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 18px;
  font-weight: 600;
}

.stat-item.success-rate .value {
  color: #ffd700;
}

.eco-badge {
  display: inline-block;
  background: rgba(67, 233, 123, 0.3);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  margin-bottom: 12px;
  border: 1px solid rgba(67, 233, 123, 0.5);
}

.eco-info {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 13px;
  opacity: 0.9;
}

.badge-desc {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}
</style>
