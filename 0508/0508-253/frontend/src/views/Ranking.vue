<template>
  <div class="page">
    <el-card>
      <template #header>
        <span>训练成绩排名统计</span>
      </template>

      <el-row :gutter="12" style="margin-bottom: 20px">
        <el-col :span="4" v-for="(item, index) in levelStats" :key="index">
          <el-card shadow="hover" :body-style="{ padding: '12px', textAlign: 'center' }">
            <div :style="{ fontSize: '24px', fontWeight: 'bold', color: item.color }">
              {{ item.count }}
            </div>
            <div style="color: #909399; margin-top: 3px; fontSize: '13px'">{{ item.name }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="总分排名" name="total">
          <el-table :data="rankingData" border stripe>
            <el-table-column prop="rank" label="排名" width="80">
              <template #default="scope">
                <el-tag v-if="scope.$index === 0" type="warning" effect="dark">🥇 冠</el-tag>
                <el-tag v-else-if="scope.$index === 1" type="info" effect="dark">🥈 亚</el-tag>
                <el-tag v-else-if="scope.$index === 2" type="danger" effect="dark">🥉 季</el-tag>
                <span v-else>{{ scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="人员" width="150">
              <template #default="scope">
                {{ getTraineeName(scope.row.traineeId) }}
              </template>
            </el-table-column>
            <el-table-column prop="totalScore" label="总分" width="120" sortable>
              <template #default="scope">
                <strong>{{ scope.row.totalScore.toFixed(1) }}</strong>
              </template>
            </el-table-column>
            <el-table-column prop="averageScore" label="平均分" width="120">
              <template #default="scope">
                {{ scope.row.averageScore.toFixed(1) }}
              </template>
            </el-table-column>
            <el-table-column prop="level" label="等级" width="100">
              <template #default="scope">
                <el-tag :type="getLevelType(scope.row.level)">{{ scope.row.level }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="按排统计" name="platoon">
          <el-table :data="platoonStats" border stripe>
            <el-table-column prop="platoon" label="排" width="100"></el-table-column>
            <el-table-column prop="count" label="人数" width="100"></el-table-column>
            <el-table-column prop="avgTotal" label="平均总分" width="120">
              <template #default="scope">
                {{ scope.row.avgTotal.toFixed(1) }}
              </template>
            </el-table-column>
            <el-table-column prop="maxTotal" label="最高总分" width="120">
              <template #default="scope">
                {{ scope.row.maxTotal.toFixed(1) }}
              </template>
            </el-table-column>
            <el-table-column prop="excellentRate" label="优秀率" width="120">
              <template #default="scope">
                {{ (scope.row.excellentRate * 100).toFixed(1) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { comprehensiveApi, traineeApi } from '../api'
import { ElMessage } from 'element-plus'

export default {
  name: 'Ranking',
  data() {
    return {
      activeTab: 'total',
      rankingData: [],
      trainees: [],
      levelStats: []
    }
  },
  computed: {
    platoonStats() {
      const map = {}
      this.rankingData.forEach(score => {
        const trainee = this.trainees.find(t => t.id === score.traineeId)
        if (!trainee) return
        const platoon = trainee.platoon || '未知'
        if (!map[platoon]) {
          map[platoon] = { platoon, count: 0, totalSum: 0, maxTotal: 0, excellentCount: 0 }
        }
        map[platoon].count++
        map[platoon].totalSum += score.totalScore
        map[platoon].maxTotal = Math.max(map[platoon].maxTotal, score.totalScore)
        if (score.level === '特优' || score.level === '优秀') map[platoon].excellentCount++
      })
      return Object.values(map).map(item => ({
        ...item,
        avgTotal: item.totalSum / item.count,
        excellentRate: item.excellentCount / item.count
      })).sort((a, b) => b.avgTotal - a.avgTotal)
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
        this.rankingData = res.data
        this.trainees = traineesRes.data
        this.calculateLevelStats()
      } catch (e) {
        ElMessage.error('加载数据失败')
      }
    },
    calculateLevelStats() {
      const levels = [
        { name: '特优', color: '#67C23A' },
        { name: '优秀', color: '#85CE61' },
        { name: '良好', color: '#E6A23C' },
        { name: '中等', color: '#909399' },
        { name: '及格', color: '#606266' },
        { name: '待提高', color: '#F56C6C' },
        { name: '不及格', color: '#F56C6C' }
      ]
      this.levelStats = levels.map(l => ({
        ...l,
        count: this.rankingData.filter(s => s.level === l.name).length
      }))
    },
    getTraineeName(id) {
      const t = this.trainees.find(item => item.id === id)
      return t ? `${t.employeeId} - ${t.name}` : id
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