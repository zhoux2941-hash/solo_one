<template>
  <div class="page-container">
    <div class="card">
      <div class="flex justify-between items-center mb-24">
        <h2 class="card-title" style="margin: 0;">
          考试报告：{{ exam?.title || '加载中...' }}
        </h2>
        <button class="btn btn-outline" @click="goBack">
          返回
        </button>
      </div>
      
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{{ statistics.totalEvents || 0 }}</div>
          <div class="stat-label">总异常事件</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statistics.affectedUsers || 0 }}</div>
          <div class="stat-label">涉及学生数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ highRiskStudents.length }}</div>
          <div class="stat-label">高风险学生</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ Object.keys(statistics.typeBreakdown || {}).length }}
          </div>
          <div class="stat-label">异常类型</div>
        </div>
      </div>
      
      <div v-if="Object.keys(statistics.typeBreakdown || {}).length > 0" class="card" style="background: #fafafa;">
        <h3 class="chart-title">异常类型分布</h3>
        <div class="flex" style="flex-wrap: wrap; gap: 16px;">
          <div 
            v-for="(count, type) in statistics.typeBreakdown" 
            :key="type"
            class="status-badge"
            style="padding: 12px 20px; font-size: 14px;"
          >
            {{ getActionLabel(type) }}: <strong>{{ count }}</strong> 次
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h3 class="card-title">全班作弊趋势</h3>
      <TrendChart :data="trendData" />
    </div>
    
    <div class="chart-grid">
      <div class="card">
        <h3 class="card-title">高风险学生排行榜</h3>
        <RankingChart :students="highRiskStudents" />
      </div>
      
      <div class="card">
        <h3 class="card-title">学生作弊热力图</h3>
        <div class="mb-16">
          <label class="form-label">选择学生：</label>
          <select v-model="selectedStudentId" class="form-input" @change="loadHeatMapData">
            <option value="">请选择学生</option>
            <option 
              v-for="student in highRiskStudents" 
              :key="student.userId" 
              :value="student.userId"
            >
              {{ student.userName }} (风险分: {{ student.riskScore }})
            </option>
          </select>
        </div>
        <div v-if="selectedStudentId && heatMapData.xAxis?.length > 0">
          <HeatMapChart 
            :xAxis="heatMapData.xAxis" 
            :yAxis="heatMapData.yAxis" 
            :data="heatMapData.data" 
          />
        </div>
        <div v-else class="empty-state" style="padding: 40px;">
          <div class="empty-text">请选择学生查看详细热力图</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="flex justify-between items-center mb-24">
        <h3 class="card-title" style="margin: 0;">智能作弊模式分析</h3>
        <div class="flex gap-12">
          <button 
            :class="['btn', activePatternTab === 'graph' ? 'btn-primary' : 'btn-outline']"
            @click="activePatternTab = 'graph'"
          >
            关联图
          </button>
          <button 
            :class="['btn', activePatternTab === 'rules' ? 'btn-primary' : 'btn-outline']"
            @click="activePatternTab = 'rules'"
          >
            关联规则
          </button>
          <button 
            :class="['btn', activePatternTab === 'sequences' ? 'btn-primary' : 'btn-outline']"
            @click="activePatternTab = 'sequences'"
          >
            行为序列
          </button>
        </div>
      </div>
      
      <div v-if="loadingPatterns" class="empty-state" style="padding: 60px;">
        <div class="empty-icon">⏳</div>
        <div class="empty-text">正在分析作弊模式...</div>
      </div>
      
      <div v-else>
        <div v-if="patternData.summary.totalCheatEvents === 0" class="empty-state" style="padding: 60px;">
          <div class="empty-icon">📊</div>
          <div class="empty-text">暂无足够的作弊数据进行模式分析</div>
        </div>
        
        <div v-else>
          <div class="stat-grid" style="margin-bottom: 24px;">
            <div class="stat-card">
              <div class="stat-value">{{ patternData.summary.totalCheatEvents || 0 }}</div>
              <div class="stat-label">分析的作弊事件</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ patternData.summary.uniqueUsers || 0 }}</div>
              <div class="stat-label">涉及用户数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ patternData.associationRules.length }}</div>
              <div class="stat-label">关联规则数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ patternData.sequencePatterns.length }}</div>
              <div class="stat-label">序列模式数</div>
            </div>
          </div>
          
          <div v-if="activePatternTab === 'graph'">
            <ForceDirectedGraph :graphData="patternData.graphData" />
            <div class="mt-16" style="margin-top: 16px; font-size: 13px; color: #666;">
              <strong>说明：</strong>节点大小表示该作弊行为的发生频率，连线粗细表示两种行为的关联强度，连线上的数字表示置信度百分比
            </div>
          </div>
          
          <div v-else-if="activePatternTab === 'rules'">
            <div v-if="patternData.associationRules.length === 0" class="empty-state" style="padding: 40px;">
              <div class="empty-text">暂无高置信度的关联规则</div>
            </div>
            <div v-else class="log-list">
              <div 
                v-for="(rule, index) in patternData.associationRules.slice(0, 15)" 
                :key="index"
                class="log-item"
                style="flex-direction: column; align-items: flex-start;"
              >
                <div style="margin-bottom: 8px; font-weight: 500;">
                  <span style="color: #667eea;">{{ rule.antecedentLabels?.join(' + ') }}</span>
                  <span style="margin: 0 8px; color: #999;">→</span>
                  <span style="color: #ff4d4f;">{{ rule.consequentLabels?.join(' + ') }}</span>
                </div>
                <div class="flex" style="gap: 24px; font-size: 12px; color: #666;">
                  <span>置信度: <strong style="color: #333;">{{ formatPercentage(rule.confidence) }}</strong></span>
                  <span>支持度: <strong style="color: #333;">{{ formatPercentage(rule.support) }}</strong></span>
                  <span>提升度: <strong style="color: #333;">{{ rule.lift?.toFixed(2) }}</strong></span>
                  <span>关联强度: <strong style="color: #ff4d4f;">{{ rule.strength?.toFixed(1) }}%</strong></span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else-if="activePatternTab === 'sequences'">
            <div v-if="patternData.sequencePatterns.length === 0" class="empty-state" style="padding: 40px;">
              <div class="empty-text">暂无常见的行为序列模式</div>
            </div>
            <div v-else class="log-list">
              <div 
                v-for="(pattern, index) in patternData.sequencePatterns.slice(0, 20)" 
                :key="index"
                class="log-item"
                style="flex-direction: column; align-items: flex-start;"
              >
                <div style="margin-bottom: 8px;">
                  <span class="status-badge status-draft" style="margin-right: 8px;">#{{ index + 1 }}</span>
                  <span style="color: #667eea;">{{ pattern.fromLabel }}</span>
                  <span style="margin: 0 8px; color: #999;">→</span>
                  <span style="color: #ff4d4f;">{{ pattern.toLabel }}</span>
                </div>
                <div class="flex" style="gap: 24px; font-size: 12px; color: #666;">
                  <span>发生次数: <strong style="color: #333;">{{ pattern.count }}</strong></span>
                  <span>置信度: <strong style="color: #333;">{{ formatPercentage(pattern.confidence) }}</strong></span>
                  <span>支持度: <strong style="color: #333;">{{ formatPercentage(pattern.support) }}</strong></span>
                  <span>关联强度: <strong style="color: #ff4d4f;">{{ pattern.strength?.toFixed(1) }}%</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/utils/axios'
import HeatMapChart from '@/components/HeatMapChart.vue'
import TrendChart from '@/components/TrendChart.vue'
import RankingChart from '@/components/RankingChart.vue'
import ForceDirectedGraph from '@/components/ForceDirectedGraph.vue'

const route = useRoute()
const router = useRouter()

const examId = route.params.examId
const exam = ref(null)
const statistics = ref({})
const trendData = ref([])
const highRiskStudents = ref([])
const selectedStudentId = ref('')
const heatMapData = ref({
  xAxis: [],
  yAxis: [],
  data: []
})

const patternData = ref({
  graphData: { nodes: [], links: [], categories: [] },
  associationRules: [],
  sequencePatterns: [],
  summary: {}
})
const loadingPatterns = ref(false)
const activePatternTab = ref('graph')

const actionLabels = {
  'VISIBILITY_CHANGE': '切出窗口',
  'MOUSE_LEAVE': '鼠标离开',
  'COPY': '复制',
  'PASTE': '粘贴',
  'RIGHT_CLICK': '右键',
  'KEYBOARD_SHORTCUT': '快捷键'
}

function getActionLabel(type) {
  return actionLabels[type] || type
}

async function loadExam() {
  try {
    const response = await axios.get(`/exam/${examId}`)
    if (response.code === 200) {
      exam.value = response.data
    }
  } catch (error) {
    console.error('Failed to load exam:', error)
  }
}

async function loadStatistics() {
  try {
    const response = await axios.get(`/cheat/statistics/${examId}`)
    if (response.code === 200) {
      statistics.value = response.data
    }
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

async function loadTrendData() {
  try {
    const response = await axios.get(`/cheat/trend/${examId}`)
    if (response.code === 200) {
      trendData.value = response.data
    }
  } catch (error) {
    console.error('Failed to load trend data:', error)
  }
}

async function loadHighRiskStudents() {
  try {
    const response = await axios.get(`/cheat/risk/${examId}`)
    if (response.code === 200) {
      highRiskStudents.value = response.data
    }
  } catch (error) {
    console.error('Failed to load high risk students:', error)
  }
}

async function loadHeatMapData() {
  if (!selectedStudentId.value) {
    heatMapData.value = { xAxis: [], yAxis: [], data: [] }
    return
  }
  
  try {
    const response = await axios.get(`/cheat/heatmap/${examId}/${selectedStudentId.value}`)
    if (response.code === 200) {
      heatMapData.value = response.data
    }
  } catch (error) {
    console.error('Failed to load heatmap data:', error)
  }
}

async function loadPatternData() {
  loadingPatterns.value = true
  try {
    const response = await axios.get(`/cheat/patterns?examId=${examId}`)
    if (response.code === 200) {
      patternData.value = {
        graphData: response.data.graphData || { nodes: [], links: [], categories: [] },
        associationRules: response.data.associationRules || [],
        sequencePatterns: response.data.sequencePatterns || [],
        summary: response.data.summary || {}
      }
    }
  } catch (error) {
    console.error('Failed to load pattern data:', error)
  } finally {
    loadingPatterns.value = false
  }
}

function formatPercentage(value) {
  return (value * 100).toFixed(1) + '%'
}

function goBack() {
  router.push('/teacher/exams')
}

onMounted(() => {
  loadExam()
  loadStatistics()
  loadTrendData()
  loadHighRiskStudents()
  loadPatternData()
})
</script>
