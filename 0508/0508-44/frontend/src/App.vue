<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">🍽️ 员工食堂光盘行动</h1>
        <p class="app-subtitle">打卡积分榜 & 团队挑战赛 - 节约粮食，从我做起</p>
      </div>
    </header>

    <main class="main-content">
      <div class="employee-selector">
        <label for="employeeSelect">选择员工：</label>
        <select 
          id="employeeSelect" 
          v-model="currentEmployeeNo" 
          @change="handleEmployeeChange"
          class="employee-select"
        >
          <option value="">请选择员工</option>
          <option v-for="emp in testEmployees" :key="emp.employeeNo" :value="emp.employeeNo">
            {{ emp.employeeNo }} - {{ emp.name }} ({{ emp.department }})
          </option>
        </select>
      </div>

      <div class="tabs" v-if="currentEmployeeNo">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </div>

      <div class="tab-content" v-if="currentEmployeeNo">
        <div v-show="activeTab === 'checkin'" class="checkin-section">
          <div class="left-section">
            <CheckinCard 
              :employeeNo="currentEmployeeNo" 
              @checkin-success="handleCheckinSuccess"
              ref="checkinCardRef"
            />
            
            <CheckinTrend
              :employeeNo="currentEmployeeNo" 
              :refreshTrigger="refreshTrigger"
              ref="trendRef"
            />
            
            <CheckinRecords 
              :employeeNo="currentEmployeeNo" 
              :refreshTrigger="refreshTrigger"
              ref="recordsRef"
            />
          </div>
          
          <div class="right-section">
            <Leaderboard 
              :refreshTrigger="refreshTrigger"
              ref="leaderboardRef"
            />
          </div>
        </div>

        <div v-show="activeTab === 'team'" class="team-section">
          <div class="left-section">
            <TeamContribution
              :employeeNo="currentEmployeeNo" 
              :refreshTrigger="refreshTrigger"
              ref="contributionRef"
            />
          </div>
          
          <div class="right-section">
            <TeamLeaderboard 
              :refreshTrigger="refreshTrigger"
              ref="teamLeaderboardRef"
            />
          </div>
        </div>
      </div>

      <div class="welcome-section" v-else>
        <div class="welcome-content">
          <div class="welcome-icon">👋</div>
          <h2>欢迎参与光盘行动</h2>
          <p>请在上方选择您的员工账号开始打卡</p>
          <div class="rules">
            <h3>📋 活动规则</h3>
            <ul>
              <li>每日上传光盘照片，系统自动识别是否光盘</li>
              <li>打卡成功可得 <strong>10分</strong> 基础分</li>
              <li>连续打卡可获得额外奖励（第2天+1，第3天+2，以此类推，最多+5）</li>
              <li>每周一排行榜自动清零，重新开始</li>
              <li>加入团队参与团队挑战赛，团队平均积分参与全公司排名</li>
            </ul>
          </div>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <p>© 2024 员工食堂光盘行动打卡系统</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CheckinCard from './components/CheckinCard.vue'
import Leaderboard from './components/Leaderboard.vue'
import CheckinRecords from './components/CheckinRecords.vue'
import CheckinTrend from './components/CheckinTrend.vue'
import TeamLeaderboard from './components/TeamLeaderboard.vue'
import TeamContribution from './components/TeamContribution.vue'

const currentEmployeeNo = ref('')
const refreshTrigger = ref(0)
const activeTab = ref('checkin')

const checkinCardRef = ref(null)
const leaderboardRef = ref(null)
const recordsRef = ref(null)
const trendRef = ref(null)
const teamLeaderboardRef = ref(null)
const contributionRef = ref(null)

const tabs = [
  { id: 'checkin', name: '📝 个人打卡' },
  { id: 'team', name: '🎯 团队挑战赛' }
]

const testEmployees = [
  { employeeNo: 'E001', name: '张三', department: '技术部' },
  { employeeNo: 'E002', name: '李四', department: '市场部' },
  { employeeNo: 'E003', name: '王五', department: '人事部' },
  { employeeNo: 'E004', name: '赵六', department: '财务部' },
  { employeeNo: 'E005', name: '孙七', department: '技术部' },
  { employeeNo: 'E006', name: '周八', department: '市场部' },
  { employeeNo: 'E007', name: '吴九', department: '人事部' },
  { employeeNo: 'E008', name: '郑十', department: '财务部' },
  { employeeNo: 'E009', name: '钱十一', department: '技术部' },
  { employeeNo: 'E010', name: '冯十二', department: '市场部' }
]

const handleEmployeeChange = () => {
  refreshTrigger.value++
}

const handleCheckinSuccess = () => {
  refreshTrigger.value++
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 24px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  text-align: center;
}

.app-title {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.app-subtitle {
  font-size: 14px;
  color: #666;
}

.main-content {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
}

.employee-selector {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.employee-selector label {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.employee-select {
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 250px;
  cursor: pointer;
  transition: border-color 0.3s;
  background: white;
}

.employee-select:focus {
  outline: none;
  border-color: #667eea;
}

.tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 12px 24px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.tab-content {
  min-height: 600px;
}

.checkin-section,
.team-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.right-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-section {
  background: white;
  border-radius: 12px;
  padding: 60px 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.welcome-content {
  text-align: center;
}

.welcome-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.welcome-content h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 12px;
}

.welcome-content p {
  font-size: 16px;
  color: #666;
  margin-bottom: 32px;
}

.rules {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 12px;
  padding: 24px;
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}

.rules h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.rules ul {
  list-style: none;
}

.rules li {
  font-size: 14px;
  color: #555;
  margin-bottom: 10px;
  padding-left: 24px;
  position: relative;
}

.rules li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #4CAF50;
  font-weight: 700;
}

.app-footer {
  background: rgba(0, 0, 0, 0.1);
  padding: 16px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

@media (max-width: 1024px) {
  .checkin-section,
  .team-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .app-title {
    font-size: 22px;
  }
  
  .employee-selector {
    flex-direction: column;
    align-items: stretch;
  }
  
  .employee-select {
    min-width: auto;
    width: 100%;
  }

  .tabs {
    flex-direction: column;
  }

  .tab-btn {
    text-align: center;
  }
  
  .welcome-section {
    padding: 40px 20px;
  }
}
</style>
