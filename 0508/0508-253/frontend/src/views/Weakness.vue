<template>
  <div class="page">
    <el-card>
      <template #header>
        <span>训练短板分析</span>
      </template>

      <el-form :inline="true" style="margin-bottom: 20px">
        <el-form-item label="选择人员">
          <el-select v-model="selectedTrainee" placeholder="请选择人员" style="width: 250px" @change="loadAnalysis">
            <el-option v-for="t in trainees" :key="t.id" :label="`${t.employeeId} - ${t.name}`" :value="t.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <div v-if="analysisData">
        <el-alert :title="analysisData.overallSuggestion" :type="analysisData.weakCount === 0 ? 'success' : 'warning'" :closable="false" style="margin-bottom: 20px"></el-alert>

        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="8">
            <el-statistic title="薄弱科目总数" :value="analysisData.weakCount" value-style="color: #F56C6C"></el-statistic>
          </el-col>
          <el-col :span="8">
            <el-statistic title="严重薄弱科目" :value="analysisData.severeWeakCount" value-style="color: #F56C6C; fontWeight: 'bold'"></el-statistic>
          </el-col>
        </el-row>

        <el-table :data="analysisData.weakSubjects" border stripe v-if="analysisData.weakSubjects.length > 0">
          <el-table-column prop="subjectName" label="科目名称" width="150"></el-table-column>
          <el-table-column prop="category" label="分类" width="100"></el-table-column>
          <el-table-column prop="score" label="当前成绩" width="120">
            <template #default="scope">
              <el-tag type="danger">{{ scope.row.score }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="passScore" label="及格线" width="100"></el-table-column>
          <el-table-column prop="gap" label="差距" width="100">
            <template #default="scope">
              <el-tag type="warning">+{{ scope.row.gap.toFixed(1) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="severity" label="严重程度" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.severity === '严重' ? 'danger' : scope.row.severity === '较重' ? 'warning' : 'info'" effect="dark">
                {{ scope.row.severity }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="suggestion" label="训练建议" min-width="200"></el-table-column>
        </el-table>

        <el-empty description="暂无薄弱科目，表现优秀！👏" v-else></el-empty>
      </div>

      <el-empty description="请选择人员查看短板分析" v-if="!selectedTrainee"></el-empty>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>全员薄弱科目统计</span>
      </template>
      <el-table :data="allWeakStats" border stripe>
        <el-table-column prop="subjectName" label="科目名称" width="150"></el-table-column>
        <el-table-column prop="category" label="分类" width="100"></el-table-column>
        <el-table-column prop="weakCount" label="不及格人数" width="120" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.weakCount > trainees.length * 0.3 ? 'danger' : scope.row.weakCount > trainees.length * 0.15 ? 'warning' : 'info'" effect="dark">
              {{ scope.row.weakCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weakRate" label="不及格率" width="120" sortable>
          <template #default="scope">
            <strong :style="{ color: scope.row.weakRate > 0.3 ? '#F56C6C' : scope.row.weakRate > 0.15 ? '#E6A23C' : '#67C23A' }">
              {{ (scope.row.weakRate * 100).toFixed(1) }}%
            </strong>
          </template>
        </el-table-column>
        <el-table-column label="关注等级" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.weakRate > 0.3" type="danger" effect="dark">高</el-tag>
            <el-tag v-else-if="scope.row.weakRate > 0.15" type="warning" effect="dark">中</el-tag>
            <el-tag v-else type="success" effect="dark">低</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="建议" min-width="200">
          <template #default="scope">
            <span v-if="scope.row.weakRate > 0.3" style="color: #F56C6C; font-weight: bold">
              ⚠️ 强烈建议组织集体强化训练
            </span>
            <span v-else-if="scope.row.weakRate > 0.15" style="color: #E6A23C">
              ⚡ 建议重点关注该科目，增加训练时间
            </span>
            <span v-else style="color: #67C23A">
              ✅ 整体表现良好，保持常规训练
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { comprehensiveApi, traineeApi, subjectApi, scoreApi } from '../api'
import { ElMessage } from 'element-plus'

export default {
  name: 'Weakness',
  data() {
    return {
      selectedTrainee: '',
      trainees: [],
      subjects: [],
      scores: [],
      analysisData: null
    }
  },
  computed: {
    allWeakStats() {
      const stats = {}
      this.subjects.forEach(subject => {
        stats[subject.id] = {
          subjectId: subject.id,
          subjectName: subject.name,
          category: subject.category,
          passScore: subject.passScore,
          weakCount: 0
        }
      })
      this.scores.forEach(score => {
        const subject = this.subjects.find(s => s.id === score.subjectId)
        if (subject && score.score < subject.passScore) {
          stats[score.subjectId].weakCount++
        }
      })
      return Object.values(stats).map(item => ({
        ...item,
        weakRate: this.trainees.length > 0 ? item.weakCount / this.trainees.length : 0
      })).sort((a, b) => b.weakCount - a.weakCount)
    }
  },
  mounted() {
    this.loadBaseData()
  },
  methods: {
    async loadBaseData() {
      try {
        const [traineesRes, subjectsRes, scoresRes] = await Promise.all([
          traineeApi.getAll(),
          subjectApi.getAll(),
          scoreApi.getAll()
        ])
        this.trainees = traineesRes.data
        this.subjects = subjectsRes.data
        this.scores = scoresRes.data
      } catch (e) {
        ElMessage.error('加载数据失败')
      }
    },
    async loadAnalysis() {
      if (!this.selectedTrainee) {
        this.analysisData = null
        return
      }
      try {
        const res = await comprehensiveApi.getWeakness(this.selectedTrainee)
        this.analysisData = res.data
      } catch (e) {
        ElMessage.error('加载分析数据失败')
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