<template>
  <AppLayout>
    <div>
      <h2 class="page-title">拍照打卡</h2>

      <el-card v-loading="loading" class="card">
        <el-form :model="checkInForm" :rules="rules" ref="checkInFormRef" label-width="100px">
          <el-form-item label="选择项目" prop="projectId">
            <el-select 
              v-model="checkInForm.projectId" 
              placeholder="请选择要打卡的项目"
              style="width: 100%;"
              @change="handleProjectChange"
            >
              <el-option
                v-for="project in projects"
                :key="project.id"
                :label="`${project.ownerName} - ${project.address}`"
                :value="project.id"
                :disabled="project.status !== 'ACTIVE'"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="当前工序">
            <el-input 
              v-model="currentStageInfo" 
              disabled
            ></el-input>
          </el-form-item>

          <el-form-item label="今日进度" prop="dailyProgress">
            <el-input-number
              v-model="checkInForm.dailyProgress"
              :min="0"
              :max="100"
              :precision="2"
              :step="5"
              style="width: 100%;"
            ></el-input-number>
            <div style="font-size: 12px; color: #909399; margin-top: 5px;">
              今日完成百分比（0-100），累计进度将自动计算
            </div>
            <div v-if="currentStage" style="font-size: 13px; color: #606266; margin-top: 8px;">
              当前工序已完成: <strong>{{ getProgressNumber(currentStage.progress) }}%</strong>
              <span v-if="getProgressNumber(currentStage.progress) < 100">
                ，剩余: <strong style="color: #409eff;">{{ (100 - getProgressNumber(currentStage.progress)).toFixed(2) }}%</strong>
              </span>
            </div>
          </el-form-item>

          <el-form-item label="工作描述">
            <el-input
              v-model="checkInForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入今天的工作内容描述"
            ></el-input>
          </el-form-item>

          <el-form-item label="上传照片">
            <el-upload
              class="avatar-uploader"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileChange"
              accept="image/*"
            >
              <img v-if="imageUrl" :src="imageUrl" class="avatar">
              <i v-else class="el-icon-plus avatar-uploader-icon"></i>
            </el-upload>
            <div style="font-size: 12px; color: #909399; margin-top: 10px;">
              点击上传施工现场照片（模拟上传）
            </div>
          </el-form-item>

          <el-form-item>
            <el-button 
              type="primary" 
              :loading="submitting"
              size="large"
              style="width: 100%;"
              @click="submitCheckIn"
            >
              <i class="el-icon-camera"></i> 确认打卡
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <h3 class="page-title" style="margin-top: 30px;">我的打卡记录</h3>
      <el-card v-loading="loadingHistory" class="card">
        <div v-if="myCheckIns.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <div>暂无打卡记录</div>
        </div>
        <el-table v-else :data="myCheckIns" style="width: 100%;">
          <el-table-column prop="stageName" label="工序" width="100">
            <template slot-scope="scope">
              <el-tag size="small" type="primary">{{ scope.row.stageName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="projectId" label="项目" width="150">
            <template slot-scope="scope">
              {{ getProjectName(scope.row.projectId) }}
            </template>
          </el-table-column>
          <el-table-column prop="dailyProgress" label="今日进度" width="100">
            <template slot-scope="scope">
              <span style="color: #67c23a; font-weight: 600;">+{{ scope.row.dailyProgress }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="工作描述"></el-table-column>
          <el-table-column prop="imageUrl" label="照片" width="80">
            <template slot-scope="scope">
              <i v-if="scope.row.imageUrl" class="el-icon-picture" style="color: #409eff; cursor: pointer;" @click="previewImage(scope.row.imageUrl)"></i>
              <span v-else style="color: #c0c4cc;">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="打卡时间" width="180">
            <template slot-scope="scope">
              {{ formatTime(scope.row.createTime) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '../components/AppLayout'
import { projectAPI, checkInAPI } from '../api'

export default {
  name: 'CheckIn',
  components: { AppLayout },
  data() {
    return {
      loading: false,
      loadingHistory: false,
      submitting: false,
      projects: [],
      myCheckIns: [],
      imageUrl: '',
      checkInForm: {
        projectId: null,
        dailyProgress: 5,
        description: '',
        imageUrl: ''
      },
      currentStage: null,
      rules: {
        projectId: [
          { required: true, message: '请选择项目', trigger: 'change' }
        ],
        dailyProgress: [
          { required: true, message: '请输入今日进度', trigger: 'change' },
          { type: 'number', min: 0, max: 100, message: '进度需在0-100之间', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    currentStageInfo() {
      if (!this.currentStage) return '请先选择项目'
      const progress = this.getProgressNumber(this.currentStage.progress)
      return `${this.currentStage.stageName}（当前进度: ${progress}%）`
    }
  },
  async created() {
    await this.loadProjects()
    await this.loadMyCheckIns()
  },
  methods: {
    async loadProjects() {
      this.loading = true
      try {
        const res = await projectAPI.getProjects()
        this.projects = res.data.filter(p => p.status === 'ACTIVE')
      } catch (error) {
        console.error('加载项目失败', error)
      } finally {
        this.loading = false
      }
    },
    async loadMyCheckIns() {
      this.loadingHistory = true
      try {
        const res = await checkInAPI.getMyCheckIns()
        this.myCheckIns = res.data
      } catch (error) {
        console.error('加载打卡记录失败', error)
      } finally {
        this.loadingHistory = false
      }
    },
    async handleProjectChange(projectId) {
      this.currentStage = null
      try {
        const res = await projectAPI.getProjectStages(projectId)
        const stages = res.data
        this.currentStage = stages.find(s => !s.isCompleted) || stages[stages.length - 1]
      } catch (error) {
        console.error('加载工序信息失败', error)
      }
    },
    handleFileChange(file) {
      const isImage = file.raw.type.indexOf('image/') !== -1
      if (!isImage) {
        this.$message.error('请上传图片文件')
        return
      }
      this.imageUrl = URL.createObjectURL(file.raw)
      this.checkInForm.imageUrl = `https://picsum.photos/800/600?random=${Date.now()}`
    },
    async submitCheckIn() {
      this.$refs.checkInFormRef.validate(async valid => {
        if (!valid) return
        
        if (this.currentStage && this.currentStage.isCompleted) {
          this.$message.warning('当前工序已完成，请等待切换到下一工序')
          return
        }

        this.submitting = true
        try {
          await checkInAPI.createCheckIn({
            projectId: this.checkInForm.projectId,
            dailyProgress: this.checkInForm.dailyProgress,
            description: this.checkInForm.description,
            imageUrl: this.checkInForm.imageUrl
          })
          this.$message.success('打卡成功！')
          this.resetForm()
          await this.loadProjects()
          await this.loadMyCheckIns()
        } catch (error) {
          console.error('打卡失败', error)
        } finally {
          this.submitting = false
        }
      })
    },
    resetForm() {
      this.$refs.checkInFormRef.resetFields()
      this.checkInForm = {
        projectId: null,
        dailyProgress: 5,
        description: '',
        imageUrl: ''
      }
      this.imageUrl = ''
      this.currentStage = null
    },
    getProjectName(projectId) {
      const project = this.projects.find(p => p.id === projectId)
      return project ? project.ownerName : '未知项目'
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
    getProgressNumber(progress) {
      if (progress === null || progress === undefined) return 0
      if (typeof progress === 'number') return progress
      return parseFloat(progress) || 0
    }
  }
}
</script>

<style scoped>
.avatar-uploader >>> .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader >>> .el-upload:hover {
  border-color: #409eff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}
.avatar {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}
</style>
