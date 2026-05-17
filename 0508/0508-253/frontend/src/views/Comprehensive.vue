<template>
  <div class="page">
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>综合素养评分</span>
          <div>
            <el-button @click="showRuleDialog = true">评分标准</el-button>
            <el-button type="primary" @click="calculate" :loading="calculating">重新计算</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="4" v-for="(count, level) in levelStats" :key="level">
          <el-card shadow="hover" :body-style="{ padding: '15px', textAlign: 'center' }">
            <div :style="{ fontSize: '28px', fontWeight: 'bold', color: getLevelColor(level) }">
              {{ count }}
            </div>
            <div style="color: #909399; margin-top: 5px">{{ level }}</div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <el-table :data="tableData" border stripe>
        <el-table-column prop="rank" label="排名" width="90" sortable fixed>
          <template #default="scope">
            <el-tag v-if="scope.row.rank === 1" type="warning" effect="dark">🥇 第1名</el-tag>
            <el-tag v-else-if="scope.row.rank === 2" type="info" effect="dark">🥈 第2名</el-tag>
            <el-tag v-else-if="scope.row.rank === 3" type="danger" effect="dark">🥉 第3名</el-tag>
            <span v-else>第{{ scope.row.rank }}名</span>
          </template>
        </el-table-column>
        <el-table-column label="人员" width="150">
          <template #default="scope">
            {{ getTraineeName(scope.row.traineeId) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalScore" label="加权总分" width="120" sortable>
          <template #default="scope">
            <strong :style="{ color: getScoreColor(scope.row.totalScore) }">
              {{ scope.row.totalScore.toFixed(1) }}
            </strong>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="等级" width="100">
          <template #default="scope">
            <el-tag :type="getLevelType(scope.row.level)" :effect="getLevelEffect(scope.row.level)">
              {{ scope.row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类得分" min-width="300">
          <template #default="scope">
            <div style="display: flex; gap: 10px; flex-wrap: wrap">
              <el-tag v-for="(score, cat) in getCategoryScores(scope.row.traineeId)" :key="cat" size="small">
                {{ cat }}: {{ score.toFixed(1) }}%
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="calculateTime" label="计算时间" width="180"></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showRuleDialog" title="综合评分标准" width="700px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="科目权重">
          <el-tag style="margin-right: 8px">队列 25%</el-tag>
          <el-tag style="margin-right: 8px">战术 30%</el-tag>
          <el-tag style="margin-right: 8px">体能 30%</el-tag>
          <el-tag>射击 15%</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="加分规则">
          <div>• 2个及以上科目满分 → +3分</div>
          <div>• 1个科目满分 → +1.5分</div>
        </el-descriptions-item>
        <el-descriptions-item label="减分规则">
          <div>• 及格率 < 60% → -5分</div>
          <div>• 60% ≤ 及格率 < 80% → -2分</div>
        </el-descriptions-item>
        <el-descriptions-item label="等级评定">
          <el-tag type="success" effect="dark" style="margin-right: 8px">特优</el-tag>
          <span>≥95分，及格率≥95%，无薄弱分类</span>
          <br><br>
          <el-tag type="success" style="margin-right: 8px">优秀</el-tag>
          <span>≥90分，及格率≥90%，无薄弱分类</span>
          <br><br>
          <el-tag type="warning" style="margin-right: 8px">良好</el-tag>
          <span>≥80分，及格率≥80%</span>
          <br><br>
          <el-tag type="info" style="margin-right: 8px">中等</el-tag>
          <span>≥70分，及格率≥70%</span>
          <br><br>
          <el-tag style="margin-right: 8px">及格</el-tag>
          <span>≥60分，及格率≥60%</span>
          <br><br>
          <el-tag type="warning" style="margin-right: 8px">待提高</el-tag>
          <span>50-59分</span>
          <br><br>
          <el-tag type="danger" style="margin-right: 8px">不及格</el-tag>
          <span><50分</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import { comprehensiveApi, traineeApi } from '../api'
import { ElMessage } from 'element-plus'

export default {
  name: 'Comprehensive',
  data() {
    return {
      tableData: [],
      trainees: [],
      scoreDetails: [],
      levelStats: {},
      showRuleDialog: false,
      calculating: false
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const [res, traineesRes] = await Promise.all([
          comprehensiveApi.getRanking(),
          traineeApi.getAll()
        ])
        this.tableData = res.data
        this.trainees = traineesRes.data
        this.calculateLevelStats()
      } catch (e) {
        ElMessage.error('加载数据失败')
      }
    },
    async calculate() {
      this.calculating = true
      try {
        const res = await comprehensiveApi.calculate()
        this.scoreDetails = res.data.details
        this.levelStats = res.data.levelStats
        ElMessage.success(`计算完成，共 ${res.data.totalCount} 人`)
        await this.loadData()
      } catch (e) {
        ElMessage.error('计算失败')
      } finally {
        this.calculating = false
      }
    },
    calculateLevelStats() {
      const stats = {}
      this.tableData.forEach(s => {
        stats[s.level] = (stats[s.level] || 0) + 1
      })
      this.levelStats = stats
    },
    getTraineeName(id) {
      const t = this.trainees.find(item => item.id === id)
      return t ? `${t.employeeId} - ${t.name}` : id
    },
    getCategoryScores(traineeId) {
      const detail = this.scoreDetails.find(d => d.traineeId === traineeId)
      return detail ? detail.categoryScores : {}
    },
    getLevelType(level) {
      const map = {
        '特优': 'success',
        '优秀': 'success',
        '良好': 'warning',
        '中等': 'info',
        '及格': '',
        '待提高': 'warning',
        '不及格': 'danger'
      }
      return map[level] || ''
    },
    getLevelEffect(level) {
      if (level === '特优') return 'dark'
      if (level === '不及格') return 'dark'
      return 'light'
    },
    getLevelColor(level) {
      const map = {
        '特优': '#67C23A',
        '优秀': '#85CE61',
        '良好': '#E6A23C',
        '中等': '#909399',
        '及格': '#606266',
        '待提高': '#F56C6C',
        '不及格': '#F56C6C'
      }
      return map[level] || '#909399'
    },
    getScoreColor(score) {
      if (score >= 90) return '#67C23A'
      if (score >= 80) return '#85CE61'
      if (score >= 70) return '#E6A23C'
      if (score >= 60) return '#909399'
      return '#F56C6C'
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