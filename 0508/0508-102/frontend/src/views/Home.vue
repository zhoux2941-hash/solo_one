<template>
  <AppLayout>
    <div>
      <h2 class="page-title">欢迎回来，{{ userName }}！</h2>

      <el-alert
        v-if="warningProjects.length > 0"
        :title="`注意：有 ${warningProjects.length} 个项目存在逾期工序！`"
        type="error"
        show-icon
        style="margin-bottom: 20px;"
      >
        <template slot-scope="scope">
          <div v-for="wp in warningProjects" :key="wp.id" style="margin-top: 10px;">
            <el-link 
              type="danger" 
              @click="goToProject(wp.id)"
              style="font-weight: 600;"
            >
              <i class="el-icon-warning"></i>
              {{ wp.ownerName }} - {{ wp.address }}
            </el-link>
            <div style="margin-left: 25px; color: #909399; font-size: 13px;">
              <span v-for="ws in wp.warningStages" :key="ws.stageIndex" style="margin-right: 15px;">
                {{ ws.stageName }}：逾期{{ ws.overdueDays }}天，进度{{ ws.progress }}%
              </span>
            </div>
          </div>
        </template>
      </el-alert>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stats-card">
            <div class="stats-number">{{ stats.totalProjects }}</div>
            <div class="stats-label">项目总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stats-card">
            <div class="stats-number" style="color: #67c23a;">{{ stats.activeProjects }}</div>
            <div class="stats-label">进行中</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stats-card">
            <div class="stats-number" style="color: #e6a23c;">{{ stats.completedStages }}</div>
            <div class="stats-label">已完成工序</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stats-card" v-if="stats.warningCount > 0" @click="refreshWarnings">
            <div class="stats-number" style="color: #f56c6c; cursor: pointer;">{{ stats.warningCount }}</div>
            <div class="stats-label" style="cursor: pointer;">逾期预警</div>
          </div>
          <div class="stats-card" v-else>
            <div class="stats-number" style="color: #f56c6c;">{{ stats.totalCheckIns }}</div>
            <div class="stats-label">打卡记录</div>
          </div>
        </el-col>
      </el-row>

      <h3 class="page-title" style="margin-top: 30px;">我的项目</h3>
      
      <div v-if="projects.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <div>暂无项目</div>
        <el-button 
          type="primary" 
          style="margin-top: 20px;"
          v-if="isOwner"
          @click="$router.push('/projects')"
        >
          创建第一个项目
        </el-button>
      </div>

      <el-row :gutter="20" v-else>
        <el-col :span="8" v-for="project in projects" :key="project.id">
          <div class="card project-card" @click="goToProject(project.id)">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h4 style="margin: 0;">{{ project.ownerName }}</h4>
              <el-tag :type="project.status === 'ACTIVE' ? 'success' : 'info'" size="small">
                {{ project.status === 'ACTIVE' ? '进行中' : '已完成' }}
              </el-tag>
            </div>
            <div style="margin-top: 10px; color: #909399; font-size: 13px;">
              <i class="el-icon-location-outline"></i> {{ project.address }}
            </div>
            <div style="margin-top: 5px; color: #909399; font-size: 13px;">
              <i class="el-icon-rank"></i> 建筑面积: {{ project.area }} ㎡
            </div>
            <div style="margin-top: 15px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
                <span>当前工序: {{ project.currentStageName }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <h3 class="page-title" style="margin-top: 30px;">快速操作</h3>
      <el-row :gutter="20">
        <el-col :span="8" v-if="isWorker">
          <div class="card project-card" @click="$router.push('/checkin')">
            <div style="text-align: center; padding: 20px;">
              <i class="el-icon-camera" style="font-size: 48px; color: #409eff;"></i>
              <h4 style="margin-top: 15px;">拍照打卡</h4>
              <p style="color: #909399; margin-top: 5px;">记录今天的施工进度</p>
            </div>
          </div>
        </el-col>
        <el-col :span="8" v-if="isOwner">
          <div class="card project-card" @click="$router.push('/projects')">
            <div style="text-align: center; padding: 20px;">
              <i class="el-icon-plus" style="font-size: 48px; color: #67c23a;"></i>
              <h4 style="margin-top: 15px;">新建项目</h4>
              <p style="color: #909399; margin-top: 5px;">创建新的施工项目</p>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="card project-card" @click="$router.push('/projects')">
            <div style="text-align: center; padding: 20px;">
              <i class="el-icon-document" style="font-size: 48px; color: #e6a23c;"></i>
              <h4 style="margin-top: 15px;">查看全部</h4>
              <p style="color: #909399; margin-top: 5px;">浏览所有项目详情</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '../components/AppLayout'
import { projectAPI, checkInAPI, messageAPI } from '../api'
import { mapGetters } from 'vuex'

export default {
  name: 'Home',
  components: { AppLayout },
  data() {
    return {
      projects: [],
      warningProjects: [],
      stats: {
        totalProjects: 0,
        activeProjects: 0,
        completedStages: 0,
        totalCheckIns: 0,
        warningCount: 0
      }
    }
  },
  computed: {
    ...mapGetters(['userName', 'isOwner', 'isWorker'])
  },
  async created() {
    await Promise.all([
      this.loadProjects(),
      this.loadWarningProjects()
    ])
    await this.loadStats()
  },
  methods: {
    async loadProjects() {
      try {
        const res = await projectAPI.getProjects()
        this.projects = res.data.slice(0, 6)
      } catch (error) {
        console.error('加载项目失败', error)
      }
    },
    async loadWarningProjects() {
      try {
        const res = await messageAPI.getWarningProjects()
        this.warningProjects = res.data
        this.stats.warningCount = res.data.length
      } catch (error) {
        console.error('加载预警项目失败', error)
      }
    },
    async refreshWarnings() {
      this.$message.info('正在刷新预警数据...')
      await this.loadWarningProjects()
      this.$message.success('已刷新')
    },
    async loadStats() {
      try {
        const projectsRes = await projectAPI.getProjects()
        const projects = projectsRes.data
        
        let totalCheckIns = 0
        let completedStages = 0
        
        for (const project of projects) {
          try {
            const detail = await projectAPI.getProjectDetail(project.id)
            if (detail.data && detail.data.stages) {
              completedStages += detail.data.stages.filter(s => s.isCompleted).length
            }
            const timeline = await checkInAPI.getProjectTimeline(project.id)
            totalCheckIns += timeline.data.length
          } catch (e) {
            console.error(e)
          }
        }
        
        this.stats = {
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
          completedStages,
          totalCheckIns
        }
      } catch (error) {
        console.error('加载统计数据失败', error)
      }
    },
    goToProject(projectId) {
      this.$router.push(`/projects/${projectId}`)
    }
  }
}
</script>
