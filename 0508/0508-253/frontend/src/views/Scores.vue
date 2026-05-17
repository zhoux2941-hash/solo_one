<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>单项科目成绩录入</span>
          <el-button type="primary" @click="handleAdd">录入成绩</el-button>
        </div>
      </template>

      <el-form :inline="true" style="margin-bottom: 20px">
        <el-form-item label="选择人员">
          <el-select v-model="selectedTrainee" placeholder="请选择" style="width: 200px" @change="loadTraineeScores">
            <el-option v-for="t in trainees" :key="t.id" :label="`${t.employeeId} - ${t.name}`" :value="t.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="选择科目">
          <el-select v-model="selectedSubject" placeholder="请选择" style="width: 200px" @change="loadSubjectScores">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column label="人员" width="150">
          <template #default="scope">
            {{ getTraineeName(scope.row.traineeId) }}
          </template>
        </el-table-column>
        <el-table-column label="科目" width="120">
          <template #default="scope">
            {{ getSubjectName(scope.row.subjectId) }}
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="100">
          <template #default="scope">
            <el-tag :type="getScoreLevel(scope.row.subjectId, scope.row.score)">{{ scope.row.score }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="examDate" label="考核日期" width="120"></el-table-column>
        <el-table-column prop="examiner" label="考官" width="100"></el-table-column>
        <el-table-column prop="remarks" label="备注"></el-table-column>
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
        <el-form-item label="选择人员">
          <el-select v-model="form.traineeId" style="width: 100%" :disabled="isEdit">
            <el-option v-for="t in trainees" :key="t.id" :label="`${t.employeeId} - ${t.name}`" :value="t.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="选择科目">
          <el-select v-model="form.subjectId" style="width: 100%" :disabled="isEdit">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="成绩">
          <el-input-number v-model="form.score" :min="0" :max="100" style="width: 100%"></el-input-number>
        </el-form-item>
        <el-form-item label="考核日期">
          <el-date-picker v-model="form.examDate" type="date" value-format="YYYY-MM-DD" style="width: 100%"></el-date-picker>
        </el-form-item>
        <el-form-item label="考官">
          <el-input v-model="form.examiner"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remarks" type="textarea"></el-input>
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
import { scoreApi, traineeApi, subjectApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Scores',
  data() {
    return {
      selectedTrainee: '',
      selectedSubject: '',
      tableData: [],
      allData: [],
      trainees: [],
      subjects: [],
      dialogVisible: false,
      dialogTitle: '录入成绩',
      isEdit: false,
      form: {
        id: null,
        traineeId: '',
        subjectId: '',
        score: 0,
        examDate: '',
        examiner: '',
        remarks: ''
      }
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const [scoresRes, traineesRes, subjectsRes] = await Promise.all([
          scoreApi.getAll(),
          traineeApi.getAll(),
          subjectApi.getAll()
        ])
        this.allData = scoresRes.data
        this.trainees = traineesRes.data
        this.subjects = subjectsRes.data
        this.filterData()
      } catch (e) {
        ElMessage.error('加载数据失败')
      }
    },
    filterData() {
      let data = [...this.allData]
      if (this.selectedTrainee) {
        data = data.filter(item => item.traineeId === this.selectedTrainee)
      }
      if (this.selectedSubject) {
        data = data.filter(item => item.subjectId === this.selectedSubject)
      }
      this.tableData = data
    },
    loadTraineeScores() {
      this.filterData()
    },
    loadSubjectScores() {
      this.filterData()
    },
    resetFilter() {
      this.selectedTrainee = ''
      this.selectedSubject = ''
      this.filterData()
    },
    getTraineeName(id) {
      const t = this.trainees.find(item => item.id === id)
      return t ? `${t.employeeId} - ${t.name}` : id
    },
    getSubjectName(id) {
      const s = this.subjects.find(item => item.id === id)
      return s ? s.name : id
    },
    getScoreLevel(subjectId, score) {
      const s = this.subjects.find(item => item.id === subjectId)
      if (!s) return 'info'
      if (score >= s.maxScore * 0.9) return 'success'
      if (score >= s.passScore) return 'warning'
      return 'danger'
    },
    handleAdd() {
      this.isEdit = false
      this.dialogTitle = '录入成绩'
      this.form = {
        id: null,
        traineeId: '',
        subjectId: '',
        score: 0,
        examDate: '',
        examiner: '',
        remarks: ''
      }
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.isEdit = true
      this.dialogTitle = '编辑成绩'
      this.form = { ...row }
      this.dialogVisible = true
    },
    async handleSubmit() {
      try {
        if (this.isEdit) {
          await scoreApi.update(this.form.id, this.form)
          ElMessage.success('更新成功')
        } else {
          await scoreApi.create(this.form)
          ElMessage.success('录入成功')
        }
        this.dialogVisible = false
        this.loadData()
      } catch (e) {
        ElMessage.error('操作失败，该人员该科目成绩可能已存在')
      }
    },
    handleDelete(row) {
      ElMessageBox.confirm('确定要删除该成绩记录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await scoreApi.delete(row.id)
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