<template>
  <div class="container">
    <div class="header">
      <h1>🔋 共享电单车电池衰减模拟器</h1>
      <p>模拟不同骑行时间和环境温度对四块电池的衰减情况</p>
    </div>

    <div class="tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'single' }"
        @click="activeTab = 'single'"
      >
        单次骑行模拟
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'multi' }"
        @click="activeTab = 'multi'"
      >
        多日循环模拟
      </button>
    </div>

    <div v-if="activeTab === 'single'">
      <div class="grid grid-2">
        <div class="card">
          <h2 class="card-title">模拟参数</h2>
          
          <div class="form-group">
            <label>骑行时间（分钟）: {{ rideTime }} 分钟</label>
            <input 
              type="range" 
              v-model.number="rideTime" 
              min="1" 
              max="120"
              step="1"
            />
            <input 
              type="number" 
              v-model.number="rideTime" 
              min="1" 
              max="120"
            />
          </div>

          <div class="form-group">
            <label>环境温度（℃）: {{ temperature }} ℃</label>
            <input 
              type="range" 
              v-model.number="temperature" 
              min="-20" 
              max="50"
              step="1"
            />
            <input 
              type="number" 
              v-model.number="temperature" 
              min="-20" 
              max="50"
            />
          </div>

          <button 
            class="btn btn-primary" 
            :disabled="loading"
            @click="handleSimulate"
          >
            {{ loading ? '模拟中...' : '开始模拟' }}
          </button>
        </div>

        <div class="card">
          <h2 class="card-title">电池说明</h2>
          <table>
            <thead>
              <tr>
                <th>电池</th>
                <th>差异系数</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>B1</strong></td>
                <td>0.85</td>
                <td>性能最优</td>
              </tr>
              <tr>
                <td><strong>B2</strong></td>
                <td>1.00</td>
                <td>标准性能</td>
              </tr>
              <tr>
                <td><strong>B3</strong></td>
                <td>1.15</td>
                <td>性能一般</td>
              </tr>
              <tr>
                <td><strong>B4</strong></td>
                <td>1.30</td>
                <td>老化较严重</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 15px; color: #666; font-size: 0.9rem;">
            💡 提示：温度低于 25℃ 时，温度每降低 10℃，放电率增加约 15%
          </p>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">电池电量仪表盘</h2>
        <div class="grid grid-4">
          <BatteryGauge 
            v-for="battery in batteryResults" 
            :key="battery.batteryId"
            :battery="battery"
          />
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">模拟前后对比</h2>
        <BatteryChart :batteryResults="batteryResults" />
      </div>

      <div class="card" v-if="history.length > 0">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 class="card-title" style="flex: 1;">历史记录（最近{{ history.length }}次）</h2>
          <button class="btn btn-secondary" @click="handleClearHistory">清空</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>骑行时间</th>
                <th>环境温度</th>
                <th>B1</th>
                <th>B2</th>
                <th>B3</th>
                <th>B4</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in history" :key="record.simulationId">
                <td>{{ formatTime(record.timestamp) }}</td>
                <td>{{ record.rideTime }} 分钟</td>
                <td>{{ record.temperature }} ℃</td>
                <td :style="{ color: getBatteryColor(record.batteryResults[0]) }">
                  {{ record.batteryResults[0].remainingBattery }}%
                </td>
                <td :style="{ color: getBatteryColor(record.batteryResults[1]) }">
                  {{ record.batteryResults[1].remainingBattery }}%
                </td>
                <td :style="{ color: getBatteryColor(record.batteryResults[2]) }">
                  {{ record.batteryResults[2].remainingBattery }}%
                </td>
                <td :style="{ color: getBatteryColor(record.batteryResults[3]) }">
                  {{ record.batteryResults[3].remainingBattery }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'multi'">
      <div class="grid grid-2">
        <div class="card">
          <h2 class="card-title">多日模拟参数</h2>
          
          <div class="form-group">
            <label>模拟天数: {{ multiDays }} 天</label>
            <input 
              type="range" 
              v-model.number="multiDays" 
              min="1" 
              max="30"
              step="1"
            />
            <input 
              type="number" 
              v-model.number="multiDays" 
              min="1" 
              max="30"
            />
          </div>

          <div class="form-group">
            <label>每日骑行次数: {{ multiRidesPerDay }} 次</label>
            <input 
              type="range" 
              v-model.number="multiRidesPerDay" 
              min="1" 
              max="10"
              step="1"
            />
            <input 
              type="number" 
              v-model.number="multiRidesPerDay" 
              min="1" 
              max="10"
            />
          </div>

          <div class="form-group">
            <label>单次骑行时间: {{ multiRideTime }} 分钟</label>
            <input 
              type="range" 
              v-model.number="multiRideTime" 
              min="1" 
              max="120"
              step="1"
            />
            <input 
              type="number" 
              v-model.number="multiRideTime" 
              min="1" 
              max="120"
            />
          </div>

          <div class="form-group">
            <label>环境温度: {{ multiTemperature }} ℃</label>
            <input 
              type="range" 
              v-model.number="multiTemperature" 
              min="-20" 
              max="50"
              step="1"
            />
            <input 
              type="number" 
              v-model.number="multiTemperature" 
              min="-20" 
              max="50"
            />
          </div>

          <div class="form-group">
            <label>充电策略: 每天充电至 {{ multiChargeTarget }}%</label>
            <div style="display: flex; gap: 10px;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input 
                  type="radio" 
                  v-model.number="multiChargeTarget" 
                  :value="80"
                  style="margin-right: 5px;"
                />
                80%（延长电池寿命）
              </label>
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input 
                  type="radio" 
                  v-model.number="multiChargeTarget" 
                  :value="100"
                  style="margin-right: 5px;"
                />
                100%（满电）
              </label>
            </div>
          </div>

          <button 
            class="btn btn-primary" 
            :disabled="multiLoading"
            @click="handleMultiDaySimulate"
          >
            {{ multiLoading ? '模拟中...' : '开始多日模拟' }}
          </button>
        </div>

        <div class="card">
          <h2 class="card-title">模拟说明</h2>
          <div style="line-height: 1.8; color: #555;">
            <p><strong>📊 模拟流程：</strong></p>
            <ul style="margin-left: 20px; margin-bottom: 15px;">
              <li>第1天：所有电池从 100% 开始</li>
              <li>每天执行指定次数的骑行</li>
              <li>每天结束后充电至目标电量（80% 或 100%）</li>
              <li>次日从充电后的电量继续</li>
            </ul>
            
            <p><strong>🔋 电池说明：</strong></p>
            <ul style="margin-left: 20px; margin-bottom: 15px;">
              <li><span style="color:#52c41a">●</span> <strong>B1 (0.85)</strong> - 性能最优</li>
              <li><span style="color:#1890ff">●</span> <strong>B2 (1.00)</strong> - 标准性能</li>
              <li><span style="color:#faad14">●</span> <strong>B3 (1.15)</strong> - 性能一般</li>
              <li><span style="color:#f5222d">●</span> <strong>B4 (1.30)</strong> - 老化较严重</li>
            </ul>

            <p><strong>⚡ 电压范围：</strong></p>
            <ul style="margin-left: 20px;">
              <li>满电 100% ≈ <strong>4.2V</strong></li>
              <li>空电 0% ≈ <strong>3.0V</strong></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="card" v-if="multiDayData.dailyData && Object.keys(multiDayData.dailyData).length > 0">
        <h2 class="card-title">电压变化趋势</h2>
        <VoltageTrendChart 
          :dailyData="multiDayData.dailyData" 
          :batteryIds="multiDayData.batteryIds"
        />
      </div>

      <div class="card" v-if="multiDayData.dailyData && Object.keys(multiDayData.dailyData).length > 0">
        <h2 class="card-title">每日详细数据（骑行后）</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>天数</th>
                <th>B1 (%)</th>
                <th>B1 (V)</th>
                <th>B2 (%)</th>
                <th>B2 (V)</th>
                <th>B3 (%)</th>
                <th>B3 (V)</th>
                <th>B4 (%)</th>
                <th>B4 (V)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in multiDays" :key="day">
                <td><strong>第{{ day }}天</strong></td>
                <td :style="{ color: getMultiBatteryColor(getBatteryDayData('B1', day - 1).batteryPercent) }">
                  {{ getBatteryDayData('B1', day - 1).batteryPercent }}%
                </td>
                <td>{{ getBatteryDayData('B1', day - 1).voltage }}V</td>
                <td :style="{ color: getMultiBatteryColor(getBatteryDayData('B2', day - 1).batteryPercent) }">
                  {{ getBatteryDayData('B2', day - 1).batteryPercent }}%
                </td>
                <td>{{ getBatteryDayData('B2', day - 1).voltage }}V</td>
                <td :style="{ color: getMultiBatteryColor(getBatteryDayData('B3', day - 1).batteryPercent) }">
                  {{ getBatteryDayData('B3', day - 1).batteryPercent }}%
                </td>
                <td>{{ getBatteryDayData('B3', day - 1).voltage }}V</td>
                <td :style="{ color: getMultiBatteryColor(getBatteryDayData('B4', day - 1).batteryPercent) }">
                  {{ getBatteryDayData('B4', day - 1).batteryPercent }}%
                </td>
                <td>{{ getBatteryDayData('B4', day - 1).voltage }}V</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import BatteryGauge from './components/BatteryGauge.vue'
import BatteryChart from './components/BatteryChart.vue'
import VoltageTrendChart from './components/VoltageTrendChart.vue'
import { simulateBattery, simulateMultiDay, getHistory, clearHistory } from './api/battery'

const activeTab = ref('single')

const rideTime = ref(30)
const temperature = ref(25)
const loading = ref(false)
const history = ref([])

const defaultBatteries = [
  { batteryId: 'B1', initialBattery: 100, remainingBattery: 100, dischargeRate: 0, differentialCoefficient: 0.85 },
  { batteryId: 'B2', initialBattery: 100, remainingBattery: 100, dischargeRate: 0, differentialCoefficient: 1.0 },
  { batteryId: 'B3', initialBattery: 100, remainingBattery: 100, dischargeRate: 0, differentialCoefficient: 1.15 },
  { batteryId: 'B4', initialBattery: 100, remainingBattery: 100, dischargeRate: 0, differentialCoefficient: 1.3 }
]

const batteryResults = ref([...defaultBatteries])

const multiDays = ref(7)
const multiRidesPerDay = ref(2)
const multiRideTime = ref(30)
const multiTemperature = ref(25)
const multiChargeTarget = ref(80)
const multiLoading = ref(false)

const multiDayData = reactive({
  dailyData: {},
  batteryIds: ['B1', 'B2', 'B3', 'B4']
})

const handleSimulate = async () => {
  loading.value = true
  try {
    const res = await simulateBattery(rideTime.value, temperature.value)
    if (res.data.code === 200) {
      batteryResults.value = res.data.data.batteryResults
      await loadHistory()
    }
  } catch (err) {
    alert('模拟失败，请检查后端服务是否启动')
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleMultiDaySimulate = async () => {
  multiLoading.value = true
  try {
    const params = {
      ridesPerDay: multiRidesPerDay.value,
      rideTime: multiRideTime.value,
      temperature: multiTemperature.value,
      chargeTarget: multiChargeTarget.value,
      days: multiDays.value
    }
    const res = await simulateMultiDay(params)
    if (res.data.code === 200) {
      multiDayData.dailyData = res.data.data.dailyData
      multiDayData.batteryIds = res.data.data.batteryIds
    }
  } catch (err) {
    alert('多日模拟失败，请检查后端服务是否启动')
    console.error(err)
  } finally {
    multiLoading.value = false
  }
}

const loadHistory = async () => {
  try {
    const res = await getHistory()
    if (res.data.code === 200) {
      history.value = res.data.data || []
    }
  } catch (err) {
    console.error('加载历史记录失败:', err)
  }
}

const handleClearHistory = async () => {
  if (confirm('确定要清空历史记录吗？')) {
    try {
      await clearHistory()
      history.value = []
    } catch (err) {
      console.error('清空历史记录失败:', err)
    }
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getBatteryColor = (battery) => {
  const value = battery.remainingBattery
  if (value >= 60) return '#52c41a'
  if (value >= 30) return '#faad14'
  return '#f5222d'
}

const getMultiBatteryColor = (percent) => {
  if (percent >= 60) return '#52c41a'
  if (percent >= 30) return '#faad14'
  return '#f5222d'
}

const getBatteryDayData = (batteryId, dayIndex) => {
  const data = multiDayData.dailyData[batteryId]
  if (data && data[dayIndex]) {
    return data[dayIndex]
  }
  return { batteryPercent: 0, voltage: 0 }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.tab-btn {
  padding: 12px 32px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.tab-btn.active {
  background: #fff;
  color: #667eea;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}
</style>