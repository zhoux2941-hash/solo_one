<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>参训人员信息建档</span>
          <div>
            <el-button @click="handleBatchAdd">批量导入</el-button>
            <el-button type="primary" @click="handleAdd">新增人员</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" style="margin-bottom: 20px">
        <el-form-item label="排">
          <el-input v-model="searchPlatoon" placeholder="输入排号" style="width: 150px" @input="handleSearch"></el-input>
        </el-form-item>
        <el-form-item label="班">
          <el-input v-model="searchSquad" placeholder="输入班号" style="width: 150px" @input="handleSearch"></el-input>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="employeeId" label="编号" width="120"></el-table-column>
        <el-table-column prop="name" label="姓名" width="100"></el-table-column>
        <el-table-column prop="gender" label="性别" width="80"></el-table-column>
        <el-table-column prop="age" label="年龄" width="80"></el-table-column>
        <el-table-column prop="platoon" label="排" width="80"></el-table-column>
        <el-table-column prop="squad" label="班" width="80"></el-table-column>
        <el-table-column prop="enrollmentDate" label="入伍日期" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '参训' ? 'success' : 'info'">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
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
        <el-form-item label="编号">
          <el-input v-model="form.employeeId"></el-input>
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="form.gender" style="width: 100%">
            <el-option label="男" value="男"></el-option>
            <el-option label="女" value="女"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="form.age" :min="16" :max="30" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="排">
          <el-input v-model="form.platoon"></el-input>
        </el-form-item>
        <el-form-item label="班">
          <el-input v-model="form.squad"></el-input>
        </el-form-item>
        <el-form-item label="入伍日期">
          <el-date-picker v-model="form.enrollmentDate" type="date" value-format="YYYY-MM-DD" style="width: 100%"></el-date-picker>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="参训" value="参训"></el-option>
            <el-option label="休假" value="休假"></el-option>
            <el-option label="退役" value="退役"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量导入" width="700px" :close-on-click-modal="false">
      <el-alert type="info" description="每行一个人员信息，格式: 编号,姓名,性别,年龄,排,班" show-icon style="margin-bottom: 20px"></el-alert>
      <el-input v-model="batchText" type="textarea" :rows="10" placeholder="例如:&#10;001,张三,男,20,1,1&#10;002,李四,男,21,1,1" :disabled="batchLoading"></el-input>

      <div v-if="batchErrors.length > 0" style="margin-top: 20px">
        <el-alert :title="'发现 ' + batchErrors.length + ' 条错误'" type="error" :closable="false">
          <ul>
            <li v-for="(error, index) in batchErrors" :key="index" style="font-size: 12px">
              第 {{ error.row }} 行: {{ error.message }}
            </li>
          </ul>
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="closeBatchDialog" :disabled="batchLoading">取消</el-button>
        <el-button type="primary" @click="handleBatchSubmit" :loading="batchLoading">
          {{ batchLoading ? '正在导入...' : '开始导入' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { traineeApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Trainees',
  data() {
    return {
      searchPlatoon: '',
      searchSquad: '',
      tableData: [],
      allData: [],
      dialogVisible: false,
      batchDialogVisible: false,
      batchLoading: false,
      batchErrors: [],
      dialogTitle: '新增人员',
      isEdit: false,
      batchText: '',
      form: {
        id: null,
        employeeId: '',
        name: '',
        gender: '男',
        age: 20,
        platoon: '',
        squad: '',
        enrollmentDate: '',
        status: '参训'
      }
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const res = await traineeApi.getAll()
        this.allData = res.data
        this.handleSearch()
      } catch (e) {
        ElMessage.error('加载数据失败')
      }
    },
    handleSearch() {
      let data = [...this.allData]
      if (this.searchPlatoon) {
        data = data.filter(item => item.platoon && item.platoon.includes(this.searchPlatoon))
      }
      if (this.searchSquad) {
        data = data.filter(item => item.squad && item.squad.includes(this.searchSquad))
      }
      this.tableData = data
    },
    handleAdd() {
      this.isEdit = false
      this.dialogTitle = '新增人员'
      this.form = {
        id: null,
        employeeId: '',
        name: '',
        gender: '男',
        age: 20,
        platoon: '',
        squad: '',
        enrollmentDate: '',
        status: '参训'
      }
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.isEdit = true
      this.dialogTitle = '编辑人员'
      this.form = { ...row }
      this.dialogVisible = true
    },
    async handleSubmit() {
      try {
        if (this.isEdit) {
          await traineeApi.update(this.form.id, this.form)
          ElMessage.success('更新成功')
        } else {
          await traineeApi.create(this.form)
          ElMessage.success('创建成功')
        }
        this.dialogVisible = false
        this.loadData()
      } catch (e) {
        ElMessage.error('操作失败')
      }
    },
    handleDelete(row) {
      ElMessageBox.confirm('确定要删除该人员吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await traineeApi.delete(row.id)
          ElMessage.success('删除成功')
          this.loadData()
        } catch (e) {
          ElMessage.error('删除失败')
        }
      }).catch(() => {})
    },
    handleBatchAdd() {
      this.batchText = ''
      this.batchErrors = []
      this.batchDialogVisible = true
    },
    closeBatchDialog() {
      if (this.batchLoading) return
      this.batchDialogVisible = false
    },
    async handleBatchSubmit() {
      if (!this.batchText.trim()) {
        ElMessage.warning('请输入要导入的数据')
        return
      }

      this.batchLoading = true
      this.batchErrors = []

      try {
        const lines = this.batchText.trim().split('\n').filter(line => line.trim())
        const trainees = lines.map(line => {
          const parts = line.split(',')
          return {
            employeeId: parts[0]?.trim(),
            name: parts[1]?.trim(),
            gender: parts[2]?.trim() || '男',
            age: parseInt(parts[3]) || 20,
            platoon: parts[4]?.trim() || '',
            squad: parts[5]?.trim() || '',
            status: '参训'
          }
        })

        const res = await traineeApi.batchCreate(trainees)
        const result = res.data

        if (result.failed > 0) {
          this.batchErrors = result.errors
          ElMessage.warning(`成功导入 ${result.success} 条，失败 ${result.failed} 条，请查看错误信息`)
        } else {
          ElMessage.success(`成功导入 ${result.success} 条数据`)
          this.batchDialogVisible = false
          this.loadData()
        }
      } catch (e) {
        ElMessage.error('导入失败：' + (e.response?.data?.message || e.message))
      } finally {
        this.batchLoading = false
      }
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