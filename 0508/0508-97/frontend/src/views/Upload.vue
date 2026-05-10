<template>
  <div class="form-container">
    <h2 class="page-title" style="text-align: center; margin-bottom: 30px;">上传表情包</h2>
    <el-form :model="form" :rules="rules" ref="form" label-width="80px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="给你的表情包起个名字" maxlength="100"></el-input>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input 
          v-model="form.description" 
          type="textarea" 
          :rows="3"
          placeholder="介绍一下这个表情包（可选）"
          maxlength="500"
        ></el-input>
      </el-form-item>
      <el-form-item label="标签">
        <div>
          <el-select 
            v-model="selectedTags" 
            multiple 
            filterable 
            allow-create 
            default-first-option
            placeholder="选择或创建标签（如：搞笑、打工人）"
            style="width: 100%;"
          >
            <el-option 
              v-for="tag in allTags" 
              :key="tag" 
              :label="tag" 
              :value="tag"
            ></el-option>
          </el-select>
          <div style="margin-top: 10px; color: #999; font-size: 12px;">
            提示：输入标签后按回车可创建新标签，多个标签用逗号分隔
          </div>
        </div>
      </el-form-item>
      <el-form-item label="图片" prop="file">
        <el-upload
          ref="upload"
          :auto-upload="false"
          :limit="1"
          :file-list="fileList"
          accept=".png,.jpg,.jpeg"
          :on-change="handleFileChange"
          :on-exceed="handleExceed"
          drag
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <div class="el-upload__tip" slot="tip">
            仅支持 PNG / JPG 格式，大小不超过 2MB
          </div>
        </el-upload>
      </el-form-item>
      <el-form-item>
        <el-button 
          type="primary" 
          style="width: 100%;" 
          @click="handleUpload"
          :loading="loading"
        >
          提交审核
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import api from '../api'

export default {
  name: 'Upload',
  data() {
    return {
      form: {
        title: '',
        description: ''
      },
      selectedTags: [],
      allTags: [],
      fileList: [],
      selectedFile: null,
      rules: {
        title: [
          { required: true, message: '请输入标题', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  created() {
    this.fetchAllTags()
  },
  methods: {
    async fetchAllTags() {
      try {
        const response = await api.get('/memes/tags')
        if (response.data.code === 200) {
          this.allTags = response.data.data
        }
      } catch (e) {
        console.error('获取标签失败:', e)
      }
    },
    handleFileChange(file, fileList) {
      const isImage = file.raw.type === 'image/png' || 
                      file.raw.type === 'image/jpg' || 
                      file.raw.type === 'image/jpeg'
      if (!isImage) {
        this.$message.error('只能上传 PNG 或 JPG 格式的图片')
        this.fileList = []
        return
      }
      
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        this.$message.error('图片大小不能超过 2MB')
        this.fileList = []
        return
      }

      this.fileList = fileList.slice(-1)
      this.selectedFile = file.raw
    },
    handleExceed() {
      this.$message.warning('只能上传一个文件')
    },
    async handleUpload() {
      this.$refs.form.validate(async valid => {
        if (!valid) return

        if (!this.selectedFile) {
          this.$message.warning('请选择要上传的图片')
          return
        }

        this.loading = true
        try {
          const formData = new FormData()
          formData.append('file', this.selectedFile)
          formData.append('title', this.form.title)
          if (this.form.description) {
            formData.append('description', this.form.description)
          }
          if (this.selectedTags && this.selectedTags.length > 0) {
            formData.append('tags', this.selectedTags.join(','))
          }

          const response = await api.post('/memes/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })

          if (response.data.code === 200) {
            this.$message.success('上传成功，等待管理员审核')
            this.$router.push('/')
          } else {
            this.$message.error(response.data.message)
          }
        } catch (e) {
          this.$message.error('上传失败，请重试')
        } finally {
          this.loading = false
        }
      })
    }
  }
}
</script>
