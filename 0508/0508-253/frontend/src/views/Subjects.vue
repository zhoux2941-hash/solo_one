<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>训练科目库管理</span>
          <el-button type="primary" @click="handleAdd">新增科目</el-button>
        </div>
      </template>

      <el-tabs v-model="activeCategory" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all"></el-tab-pane>
        <el-tab-pane label="队列" name="队列"></el-tab-pane>
        <el-tab-pane label="战术" name="战术"></el-tab-pane>
        <el-tab-pane label="体能" name="体能"></el-tab-pane>
        <el-tab-pane label="射击" name="射击"></el-tab-pane>
      </el-tabs>

      <el-table :data="tableData" border stripe style="margin-top: 20px">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="name" label="科目名称"></el-table-column>
        <el-table-column prop="category" label="分类" width="100"></el-table-column>
        <el-table-column prop="maxScore" label="满分" width="100"></el-table-column>
        <el-table-column prop="passScore" label="及格分" width="100"></el-table-column>
        <el-table-column prop="description" label="说明"></el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="科目名称">
          <el-input v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="队列" value="队列"></el-option>
            <el-option label="战术" value="战术"></el-option>
            <el-option label="体能" value="体能"></el-option>
            <el-option label="射击" value="射击"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="满分">
          <el-input-number v-model="form.maxScore" :min="0" :max="100" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="及格分">
          <el-input-number v-model="form.passScore" :min="0" :max="100" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { subjectApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Subjects',
  data() {
    return {
      activeCategory: 'all',
      tableData: [],
      allData: [],
      dialogVisible: false,
      dialogTitle: '新增科目',
      isEdit: false,
      form: {
        id: null,
        name: '',
        category: '队列',
        maxScore: 100,
        passScore: 60,
        description: ''
      }
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const res = await subjectApi.getAll()
        this.allData = res.data
        this.handleTabChange(this.activeCategory)
      } catch (e) {
        ElMessage.error('加载数据失败')
      }
    },
    handleTabChange(tab) {
      if (tab === 'all') {
        this.tableData = this.allData
      } else {
        this.tableData = this.allData.filter(item => item.category === tab)
      }
    },
    handleAdd() {
      this.isEdit = false
      this.dialogTitle = '新增科目'
      this.form = {
        id: null,
        name: '',
        category: '队列',
        maxScore: 100,
        passScore: 60,
        description: ''
      }
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.isEdit = true
      this.dialogTitle = '编辑科目'
      this.form = { ...row }
      this.dialogVisible = true
    },
    async handleSubmit() {
      try {
        if (this.isEdit) {
          await subjectApi.update(this.form.id, this.form)
          ElMessage.success('更新成功')
        } else {
          await subjectApi.create(this.form)
          ElMessage.success('创建成功')
        }
        this.dialogVisible = false
        this.loadData()
      } catch (e) {
        ElMessage.error('操作失败')
      }
    },
    handleDelete(row) {
      ElMessageBox.confirm('确定要删除该科目吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await subjectApi.delete(row.id)
          ElMessage.success('删除成功')
          this.loadData()
        } catch (e) {
          ElMessage.error('删除失败')
        }
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>