<template>
  <AppLayout>
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 class="page-title" style="margin: 0;">项目列表</h2>
        <el-button 
          type="primary" 
          v-if="isOwner"
          @click="showCreateDialog = true"
        >
          <i class="el-icon-plus"></i> 新建项目
        </el-button>
      </div>

      <div v-if="projects.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <div>暂无项目</div>
        <el-button 
          type="primary" 
          style="margin-top: 20px;"
          v-if="isOwner"
          @click="showCreateDialog = true"
        >
          创建第一个项目
        </el-button>
      </div>

      <el-card 
        v-for="project in projects" 
        :key="project.id" 
        class="project-card"
        style="margin-bottom: 20px;"
        @click.native="goToProject(project.id)"
        :body-style="{ padding: '0' }"
      >
        <div style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="margin: 0 0 10px 0;">
                <i class="el-icon-office-building" style="margin-right: 10px; color: #409eff;"></i>
                {{ project.ownerName }}
              </h3>
              <div style="color: #909399; font-size: 14px; margin-bottom: 5px;">
                <i class="el-icon-location-outline"></i> {{ project.address }}
              </div>
              <div style="color: #909399; font-size: 14px;">
                <i class="el-icon-rank"></i> 建筑面积: {{ project.area }} ㎡
              </div>
            </div>
            <div style="text-align: right;">
              <el-tag :type="project.status === 'ACTIVE' ? 'success' : 'info'" size="medium">
                {{ project.status === 'ACTIVE' ? '进行中' : '已完成' }}
              </el-tag>
            </div>
          </div>

          <div style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
              <span>当前工序</span>
              <span style="font-weight: 600; color: #409eff;">
                {{ project.currentStageName }}
              </span>
            </div>
            <el-progress 
              :percentage="project.status === 'COMPLETED' ? 100 : Math.round((project.currentStage / 5) * 100)" 
              :status="project.status === 'COMPLETED' ? 'success' : ''"
            ></el-progress>
          </div>
        </div>
      </el-card>

      <el-dialog
        title="创建新项目"
        :visible.sync="showCreateDialog"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form :model="projectForm" :rules="rules" ref="projectFormRef" label-width="100px">
          <el-form-item label="房主姓名" prop="ownerName">
            <el-input v-model="projectForm.ownerName" placeholder="请输入房主姓名"></el-input>
          </el-form-item>
          <el-form-item label="地址" prop="address">
            <el-input v-model="projectForm.address" placeholder="请输入施工地址"></el-input>
          </el-form-item>
          <el-form-item label="建筑面积" prop="area">
            <el-input-number 
              v-model="projectForm.area" 
              :min="1" 
              :precision="2"
              :step="10"
              style="width: 100%;"
              placeholder="请输入建筑面积（㎡）"
            ></el-input-number>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="createProject">创建</el-button>
        </span>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '../components/AppLayout'
import { projectAPI } from '../api'
import { mapGetters } from 'vuex'

export default {
  name: 'Projects',
  components: { AppLayout },
  data() {
    return {
      projects: [],
      showCreateDialog: false,
      submitting: false,
      projectForm: {
        ownerName: '',
        address: '',
        area: null
      },
      rules: {
        ownerName: [
          { required: true, message: '请输入房主姓名', trigger: 'blur' }
        ],
        address: [
          { required: true, message: '请输入施工地址', trigger: 'blur' }
        ],
        area: [
          { required: true, message: '请输入建筑面积', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['isOwner'])
  },
  async created() {
    await this.loadProjects()
  },
  methods: {
    async loadProjects() {
      try {
        const res = await projectAPI.getProjects()
        this.projects = res.data
      } catch (error) {
        console.error('加载项目失败', error)
      }
    },
    goToProject(projectId) {
      this.$router.push(`/projects/${projectId}`)
    },
    async createProject() {
      this.$refs.projectFormRef.validate(async valid => {
        if (!valid) return
        this.submitting = true
        try {
          await projectAPI.createProject(this.projectForm)
          this.$message.success('项目创建成功')
          this.showCreateDialog = false
          this.resetForm()
          await this.loadProjects()
        } catch (error) {
          console.error('创建项目失败', error)
        } finally {
          this.submitting = false
        }
      })
    },
    resetForm() {
      this.$refs.projectFormRef.resetFields()
      this.projectForm = {
        ownerName: '',
        address: '',
        area: null
      }
    }
  }
}
</script>
