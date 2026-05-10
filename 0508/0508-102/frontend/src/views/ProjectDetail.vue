<template>
  <AppLayout>
    <div v-loading="loading">
      <el-button 
        type="text" 
        style="margin-bottom: 20px;"
        @click="$router.push('/projects')"
      >
        <i class="el-icon-arrow-left"></i> 返回列表
      </el-button>

      <div v-if="project">
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="margin: 0 0 10px 0;">
                <i class="el-icon-office-building" style="margin-right: 10px; color: #409eff;"></i>
                {{ project.ownerName }} - 施工项目
              </h2>
              <div style="color: #909399; font-size: 14px; margin-bottom: 5px;">
                <i class="el-icon-location-outline"></i> {{ project.address }}
              </div>
              <div style="color: #909399; font-size: 14px;">
                <i class="el-icon-rank"></i> 建筑面积: {{ project.area }} ㎡
              </div>
            </div>
            <div>
              <el-tag :type="project.status === 'ACTIVE' ? 'success' : 'info'" size="medium">
                {{ project.status === 'ACTIVE' ? '进行中' : '已完成' }}
              </el-tag>
            </div>
          </div>

          <div style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
              <span>总体进度</span>
              <span style="font-weight: 600;">{{ project.totalProgress }}%</span>
            </div>
            <el-progress :percentage="Math.round(project.totalProgress)" :stroke-width="12"></el-progress>
          </div>
        </div>

        <el-tabs v-model="activeTab" style="margin-top: 20px;">
          <el-tab-pane label="工序进度" name="stages">
            <div class="card">
              <div 
                v-for="(stage, index) in project.stages" 
                :key="index"
                class="stage-card"
                :class="{ 
                  active: isStageInProgress(stage, index), 
                  completed: stage.isCompleted 
                }"
              >
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <div>
                    <h4 style="margin: 0;">
                      <i 
                        class="el-icon"
                        :class="getStageIcon(stage, index)"
                        :style="{ color: getStageIconColor(stage, index) }"
                        style="margin-right: 8px;"
                      ></i>
                      第{{ index + 1 }}阶段: {{ stage.stageName }}
                      <el-tag 
                        v-if="isStageOverdue(stage)" 
                        type="danger" 
                        size="small"
                        style="margin-left: 10px;"
                      >
                        <i class="el-icon-warning"></i> 逾期{{ getOverdueDays(stage) }}天
                      </el-tag>
                    </h4>
                  </div>
                  <div>
                    <span 
                      v-if="stage.isCompleted"
                      style="color: #67c23a; font-weight: 600;"
                    >
                      已完成
                    </span>
                    <span 
                      v-else-if="isStageInProgress(stage, index)"
                      style="color: #409eff; font-weight: 600;"
                    >
                      进行中
                    </span>
                    <span 
                      v-else
                      style="color: #909399;"
                    >
                      未开始
                    </span>
                  </div>
                </div>
                <div class="progress-item">
                  <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
                    <span>完成进度</span>
                    <span>{{ stage.progress }}%</span>
                  </div>
                  <div class="progress-bar-container">
                    <div 
                      class="progress-bar-fill"
                      :class="{ active: !stage.isCompleted, completed: stage.isCompleted }"
                      :style="{ width: stage.progress + '%' }"
                    ></div>
                  </div>
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                  <div style="font-size: 12px; color: #909399;">
                    <span v-if="stage.plannedDays > 0">
                      计划天数: <strong>{{ stage.plannedDays }}</strong> 天
                    </span>
                    <span v-else style="color: #e6a23c;">
                      计划天数: 未设置
                    </span>
                    <span v-if="stage.startTime" style="margin-left: 20px;">
                      开始时间: {{ formatTime(stage.startTime) }}
                    </span>
                    <span v-if="stage.completedTime" style="margin-left: 20px;">
                      完成时间: {{ formatTime(stage.completedTime) }}
                    </span>
                  </div>
                  <el-button 
                    v-if="isOwner && !stage.isCompleted" 
                    type="text" 
                    size="small"
                    @click="editPlannedDays(stage, index)"
                  >
                    <i class="el-icon-edit"></i> 设置计划天数
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="打卡记录" name="timeline">
            <div class="card">
              <div v-if="timeline.length === 0" class="empty-state">
                <div class="empty-icon">📷</div>
                <div>暂无打卡记录</div>
              </div>
              <div v-else>
                <div 
                  v-for="item in timeline" 
                  :key="item.id"
                  class="timeline-item"
                >
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div>
                      <el-tag size="small" type="primary">{{ item.stageName }}</el-tag>
                      <span style="margin-left: 10px; font-weight: 600;">
                        +{{ item.dailyProgress }}%
                      </span>
                    </div>
                    <div style="color: #909399; font-size: 13px;">
                      {{ formatTime(item.createTime) }}
                    </div>
                  </div>
                  <div v-if="item.description" style="margin-bottom: 10px;">
                    {{ item.description }}
                  </div>
                  <img 
                    v-if="item.imageUrl" 
                    :src="item.imageUrl" 
                    class="timeline-image"
                    @click="previewImage(item.imageUrl)"
                  />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="留言板" name="comments">
            <div class="card">
              <div v-if="isOwner" style="margin-bottom: 20px;">
                <el-input
                  v-model="commentContent"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入留言内容，或点击下方按钮催进度"
                ></el-input>
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                  <el-button type="primary" @click="submitComment('MESSAGE')">
                    <i class="el-icon-chat-dot-round"></i> 发送留言
                  </el-button>
                  <el-button type="danger" @click="submitComment('URGE')">
                    <i class="el-icon-warning"></i> 催进度
                  </el-button>
                </div>
              </div>

              <el-divider v-if="comments.length > 0"></el-divider>

              <div v-if="comments.length === 0" class="empty-state">
                <div class="empty-icon">💬</div>
                <div>暂无留言</div>
              </div>

              <div v-else>
                <div 
                  v-for="comment in comments" 
                  :key="comment.id"
                  class="comment-item"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 600;">
                      房主
                      <span v-if="comment.type === 'URGE'" class="urge-badge">催进度</span>
                    </div>
                    <div style="color: #909399; font-size: 12px;">
                      {{ formatTime(comment.createTime) }}
                    </div>
                  </div>
                  <div style="color: #606266;">{{ comment.content }}</div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <el-dialog
          title="设置计划天数"
          :visible.sync="showEditDialog"
          width="400px"
          :close-on-click-modal="false"
        >
          <div v-if="editingStage">
            <el-form label-width="100px">
              <el-form-item label="工序名称">
                <el-input :value="editingStage.stageName" disabled></el-input>
              </el-form-item>
              <el-form-item label="当前进度">
                <el-input :value="`${getStageProgress(editingStage)}%`" disabled></el-input>
              </el-form-item>
              <el-form-item label="计划天数" required>
                <el-input-number
                  v-model="newPlannedDays"
                  :min="1"
                  :max="365"
                  style="width: 100%;"
                ></el-input-number>
              </el-form-item>
              <el-form-item>
                <div style="font-size: 12px; color: #909399;">
                  提示：如果实际天数超过计划天数且进度低于90%，系统将自动发送预警消息
                </div>
              </el-form-item>
            </el-form>
          </div>
          <span slot="footer" class="dialog-footer">
            <el-button @click="showEditDialog = false">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="savePlannedDays">
              保存
            </el-button>
          </span>
        </el-dialog>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '../components/AppLayout'
import { projectAPI, checkInAPI, commentAPI, messageAPI } from '../api'
import { mapGetters } from 'vuex'

export default {
  name: 'ProjectDetail',
  components: { AppLayout },
  data() {
    return {
      loading: false,
      project: null,
      timeline: [],
      comments: [],
      activeTab: 'stages',
      commentContent: '',
      submitting: false,
      showEditDialog: false,
      editingStage: null,
      editingStageIndex: null,
      newPlannedDays: 7
    }
  },
  computed: {
    ...mapGetters(['isOwner'])
  },
  async created() {
    await this.loadAllData()
  },
  methods: {
    async loadAllData() {
      this.loading = true
      try {
        const projectId = this.$route.params.id
        await Promise.all([
          this.loadProject(projectId),
          this.loadTimeline(projectId),
          this.loadComments(projectId)
        ])
      } catch (error) {
        console.error('加载数据失败', error)
      } finally {
        this.loading = false
      }
    },
    async loadProject(projectId) {
      const res = await projectAPI.getProjectDetail(projectId)
      this.project = res.data
    },
    async loadTimeline(projectId) {
      const res = await checkInAPI.getProjectTimeline(projectId)
      this.timeline = res.data
    },
    async loadComments(projectId) {
      const res = await commentAPI.getProjectComments(projectId)
      this.comments = res.data
    },
    async submitComment(type) {
      if (!this.commentContent.trim()) {
        this.$message.warning('请输入留言内容')
        return
      }
      this.submitting = true
      try {
        await commentAPI.createComment({
          projectId: this.$route.params.id,
          content: this.commentContent,
          type: type
        })
        this.$message.success(type === 'URGE' ? '催进度成功' : '留言成功')
        this.commentContent = ''
        await this.loadComments(this.$route.params.id)
      } catch (error) {
        console.error('发送留言失败', error)
      } finally {
        this.submitting = false
      }
    },
    previewImage(url) {
      this.$alert(`<img src="${url}" style="max-width: 100%;" />`, '图片预览', {
        dangerouslyUseHTMLString: true,
        showConfirmButton: false,
        closeOnClickModal: true
      })
    },
    formatTime(time) {
      if (!time) return '-'
      const date = new Date(time)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    getStageProgress(stage) {
      if (!stage) return 0
      if (typeof stage.progress === 'number') {
        return stage.progress
      }
      return parseFloat(stage.progress) || 0
    },
    isStageInProgress(stage, index) {
      if (stage.isCompleted) return false
      if (index !== this.project.currentStage) return false
      return this.getStageProgress(stage) > 0
    },
    getStageIcon(stage, index) {
      if (stage.isCompleted) {
        return 'el-icon-circle-check'
      }
      if (this.isStageInProgress(stage, index)) {
        return 'el-icon-loading'
      }
      return 'el-icon-time'
    },
    getStageIconColor(stage, index) {
      if (stage.isCompleted) {
        return '#67c23a'
      }
      if (this.isStageInProgress(stage, index)) {
        return '#409eff'
      }
      return '#909399'
    },
    getDaysDiff(startTime) {
      if (!startTime) return 0
      const start = new Date(startTime)
      const now = new Date()
      const diffTime = now - start
      return Math.floor(diffTime / (1000 * 60 * 60 * 24))
    },
    isStageOverdue(stage) {
      if (stage.isCompleted) return false
      if (!stage.plannedDays || stage.plannedDays <= 0) return false
      if (!stage.startTime) return false
      const daysElapsed = this.getDaysDiff(stage.startTime)
      const progress = this.getStageProgress(stage)
      return daysElapsed > stage.plannedDays && progress < 90
    },
    getOverdueDays(stage) {
      if (!this.isStageOverdue(stage)) return 0
      const daysElapsed = this.getDaysDiff(stage.startTime)
      return daysElapsed - stage.plannedDays
    },
    editPlannedDays(stage, index) {
      this.editingStage = stage
      this.editingStageIndex = index
      this.newPlannedDays = stage.plannedDays > 0 ? stage.plannedDays : 7
      this.showEditDialog = true
    },
    async savePlannedDays() {
      if (this.newPlannedDays < 1) {
        this.$message.warning('计划天数必须大于0')
        return
      }
      this.submitting = true
      try {
        await projectAPI.updatePlannedDays({
          projectId: this.project.id,
          stageIndex: this.editingStageIndex,
          plannedDays: this.newPlannedDays
        })
        this.$message.success('计划天数更新成功')
        this.showEditDialog = false
        await this.loadProject(this.$route.params.id)
      } catch (error) {
        console.error('更新计划天数失败', error)
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>
