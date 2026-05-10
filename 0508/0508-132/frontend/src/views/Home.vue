<template>
  <div class="home-page">
    <div class="welcome-section">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card class="welcome-card">
            <div class="welcome-content">
              <div class="welcome-text">
                <h2>欢迎使用移液枪路径优化工具</h2>
                <p>帮助您优化移液枪移液路径，提高实验效率，减少操作时间。</p>
              </div>
              <div class="welcome-stats">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <div class="stat-item">
                      <el-icon :size="40" color="#409eff"><Grid /></el-icon>
                      <div class="stat-info">
                        <div class="stat-label">试管架布局</div>
                        <div class="stat-desc">自定义6x8或行列</div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item">
                      <el-icon :size="40" color="#67c23a"><Connection /></el-icon>
                      <div class="stat-info">
                        <div class="stat-label">路径优化</div>
                        <div class="stat-desc">TSP智能算法</div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item">
                      <el-icon :size="40" color="#e6a23c"><Share /></el-icon>
                      <div class="stat-info">
                        <div class="stat-label">方案分享</div>
                        <div class="stat-desc">一键分享给同事</div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="quick-actions">
      <h3 class="section-title">快速开始</h3>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="action-card" hoverable>
            <div class="action-icon" style="background: #409eff">
              <el-icon :size="32"><Grid /></el-icon>
            </div>
            <h4>创建试管架</h4>
            <p>自定义行数和列数，标记试剂类型</p>
            <router-link to="/tube-racks">
              <el-button type="primary" block>开始创建</el-button>
            </router-link>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="action-card" hoverable>
            <div class="action-icon" style="background: #67c23a">
              <el-icon :size="32"><Document /></el-icon>
            </div>
            <h4>创建实验方案</h4>
            <p>输入移液任务，设置移液参数</p>
            <router-link to="/experiments">
              <el-button type="success" block>开始创建</el-button>
            </router-link>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="action-card" hoverable>
            <div class="action-icon" style="background: #e6a23c">
              <el-icon :size="32"><MagicStick /></el-icon>
            </div>
            <h4>路径优化</h4>
            <p>系统计算最短移液路径</p>
            <router-link to="/optimize">
              <el-button type="warning" block>开始优化</el-button>
            </router-link>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="action-card" hoverable>
            <div class="action-icon" style="background: #909399">
              <el-icon :size="32"><Share /></el-icon>
            </div>
            <h4>查看分享</h4>
            <p>输入分享码查看他人方案</p>
            <el-button type="info" block @click="showShareDialog = true">
              输入分享码
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="recent-section">
      <h3 class="section-title">最近实验方案</h3>
      <el-card v-loading="loading">
        <el-table :data="recentExperiments" style="width: 100%">
          <el-table-column prop="name" label="实验名称" min-width="200" />
          <el-table-column prop="createdBy" label="创建者" width="120" />
          <el-table-column label="任务数" width="100">
            <template #default="{ row }">
              {{ row.tasks?.length || 0 }}
            </template>
          </el-table-column>
          <el-table-column prop="isShared" label="状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.isShared" type="success">已分享</el-tag>
              <el-tag v-else type="info">私有</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="180" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewExperiment(row.id)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && recentExperiments.length === 0" description="暂无实验方案" />
      </el-card>
    </div>

    <el-dialog v-model="showShareDialog" title="输入分享码" width="400px">
      <el-form>
        <el-form-item label="分享码">
          <el-input v-model="shareCodeInput" placeholder="请输入8位分享码" maxlength="8" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button type="primary" @click="goToSharedExperiment">查看</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const store = useAppStore()

const loading = ref(false)
const recentExperiments = ref([])
const showShareDialog = ref(false)
const shareCodeInput = ref('')

onMounted(async () => {
  await loadRecentExperiments()
})

const loadRecentExperiments = async () => {
  loading.value = true
  try {
    const response = await store.loadExperiments()
    if (response.success) {
      recentExperiments.value = response.data.slice(0, 5)
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
}

const viewExperiment = (id) => {
  router.push(`/experiments/${id}`)
}

const goToSharedExperiment = () => {
  if (shareCodeInput.value.trim()) {
    router.push(`/share/${shareCodeInput.value.trim().toUpperCase()}`)
    showShareDialog.value = false
  } else {
    ElMessage.warning('请输入分享码')
  }
}
</script>

<style scoped lang="scss">
.home-page {
  padding: 10px 0;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  
  .welcome-content {
    padding: 20px 0;
  }
  
  .welcome-text {
    text-align: center;
    margin-bottom: 30px;
    
    h2 {
      font-size: 28px;
      margin: 0 0 10px 0;
    }
    
    p {
      font-size: 16px;
      opacity: 0.9;
      margin: 0;
    }
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 15px;
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 8px;
    
    .stat-info {
      .stat-label {
        font-size: 18px;
        font-weight: 600;
      }
      .stat-desc {
        font-size: 13px;
        opacity: 0.8;
        margin-top: 4px;
      }
    }
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 30px 0 15px 0;
  color: #303133;
}

.action-card {
  text-align: center;
  height: 100%;
  
  .action-icon {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    margin: 0 auto 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  
  h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #303133;
  }
  
  p {
    font-size: 13px;
    color: #909399;
    margin: 0 0 15px 0;
  }
}

.recent-section {
  margin-top: 30px;
}
</style>