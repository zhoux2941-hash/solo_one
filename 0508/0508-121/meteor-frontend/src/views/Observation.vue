<template>
  <div class="observation">
    <div v-if="!currentSession">
      <div class="card">
        <h2>🎯 创建新观测会话</h2>
        <form @submit.prevent="createSession" class="session-form">
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">流星雨名称 *</label>
              <select v-model="sessionForm.meteorShowerName" class="form-select" required>
                <option value="">请选择流星雨</option>
                <optgroup label="热门流星雨">
                  <option v-for="s in hotShowers" :key="s.name" :value="s.name">
                    {{ s.chineseName || s.name }} ({{ s.name }})
                  </option>
                </optgroup>
                <optgroup label="其他流星雨">
                  <option v-for="s in allShowers.filter(x => !x.isHot)" :key="s.name" :value="s.name">
                    {{ s.chineseName || s.name }} ({{ s.name }})
                  </option>
                </optgroup>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">观测地点 *</label>
              <input v-model="sessionForm.location" type="text" class="form-input" 
                     placeholder="例如：北京市海淀区" required>
            </div>

            <div class="form-group">
              <label class="form-label">纬度</label>
              <input v-model.number="sessionForm.latitude" type="number" step="0.0001" 
                     class="form-input" placeholder="39.9042">
            </div>

            <div class="form-group">
              <label class="form-label">经度</label>
              <input v-model.number="sessionForm.longitude" type="number" step="0.0001" 
                     class="form-input" placeholder="116.4074">
            </div>

            <div class="form-group">
              <label class="form-label">观测者昵称</label>
              <input v-model="sessionForm.userName" type="text" class="form-input" 
                     placeholder="输入你的昵称">
            </div>

            <div class="form-group">
              <label class="form-label">开始时间</label>
              <input v-model="sessionForm.startTime" type="datetime-local" class="form-input">
            </div>

            <div class="form-group">
              <label class="form-label">云量遮挡 (0-100%)</label>
              <input v-model.number="sessionForm.cloudCover" type="number" 
                     min="0" max="100" step="5" class="form-input" placeholder="0">
              <div class="cloud-slider">
                <input type="range" v-model.number="sessionForm.cloudCover" 
                       min="0" max="100" step="5" class="slider">
                <span class="cloud-value">{{ sessionForm.cloudCover ?? 0 }}%</span>
              </div>
              <small class="form-hint">0% = 晴朗，100% = 完全阴天</small>
            </div>

            <div class="form-group">
              <label class="form-label">极限星等</label>
              <input v-model.number="sessionForm.limitingMagnitude" type="number" 
                     min="3" max="8" step="0.5" class="form-input" placeholder="6.5">
              <div class="lm-slider">
                <input type="range" v-model.number="sessionForm.limitingMagnitude" 
                       min="3" max="8" step="0.5" class="slider">
                <span class="lm-value">{{ sessionForm.limitingMagnitude ?? 6.5 }} 等</span>
              </div>
              <small class="form-hint">裸眼能看到的最暗星的亮度，城市约4-5等，乡村可达6-7等</small>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="sessionForm.description" class="form-textarea" rows="3"
                      placeholder="观测条件、天气等..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="creating">
            {{ creating ? '创建中...' : '🚀 开始观测' }}
          </button>
        </form>
      </div>
    </div>

    <div v-else class="active-session">
      <div class="session-header card">
        <div>
          <h2>🔭 {{ currentSession.meteorShowerName }}</h2>
          <p><strong>地点：</strong>{{ currentSession.location }} | 
             <strong>开始时间：</strong>{{ formatDate(currentSession.startTime) }}</p>
          <p><strong>已记录流星：</strong>{{ records.length }} 颗</p>
        </div>
        <div class="session-actions">
          <button class="btn btn-secondary" @click="endSession" :disabled="ending">
            {{ ending ? '结束中...' : '⏹ 结束观测' }}
          </button>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <h3>✨ 记录一颗流星</h3>
          <form @submit.prevent="addRecord" class="record-form">
            <div class="form-group">
              <label class="form-label">划过的星座区域 *</label>
              <select v-model="recordForm.constellation" class="form-select" required>
                <option value="">请选择星座</option>
                <option v-for="c in constellations" :key="c.name" :value="c.name">
                  {{ c.chineseName }} ({{ c.name }})
                </option>
              </select>
            </div>

            <div class="grid grid-2">
              <div class="form-group">
                <label class="form-label">亮度等级 (-2 到 +4)</label>
                <input v-model.number="recordForm.brightness" type="number" 
                       step="0.5" min="-2" max="4" class="form-input" placeholder="0">
                <div class="brightness-slider">
                  <input type="range" v-model.number="recordForm.brightness" 
                         min="-2" max="4" step="0.5" class="slider">
                  <span class="brightness-value">{{ recordForm.brightness || 0 }}</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">颜色</label>
                <div class="color-options">
                  <label v-for="color in colors" :key="color" class="color-option">
                    <input type="radio" v-model="recordForm.color" :value="color">
                    <span :class="['color-dot', 'color-' + color.toLowerCase()]"></span>
                    {{ color }}
                  </label>
                </div>
              </div>
            </div>

            <h4 class="trajectory-title">📐 轨迹坐标（用于计算辐射点）</h4>
            <div class="grid grid-2">
              <div class="form-group">
                <label class="form-label">起点 RA (°)</label>
                <input v-model.number="recordForm.trajectoryStartRA" type="number" 
                       step="0.5" min="0" max="360" class="form-input" placeholder="0-360">
              </div>
              <div class="form-group">
                <label class="form-label">起点 Dec (°)</label>
                <input v-model.number="recordForm.trajectoryStartDec" type="number" 
                       step="0.5" min="-90" max="90" class="form-input" placeholder="-90 到 90">
              </div>
              <div class="form-group">
                <label class="form-label">终点 RA (°)</label>
                <input v-model.number="recordForm.trajectoryEndRA" type="number" 
                       step="0.5" min="0" max="360" class="form-input" placeholder="0-360">
              </div>
              <div class="form-group">
                <label class="form-label">终点 Dec (°)</label>
                <input v-model.number="recordForm.trajectoryEndDec" type="number" 
                       step="0.5" min="-90" max="90" class="form-input" placeholder="-90 到 90">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">备注</label>
              <textarea v-model="recordForm.notes" class="form-textarea" rows="2"
                        placeholder="其他观察细节..."></textarea>
            </div>

            <button type="submit" class="btn btn-primary" :disabled="adding">
              {{ adding ? '记录中...' : '💫 记录流星' }}
            </button>
          </form>
        </div>

        <div>
          <div class="card">
            <h3>🌌 已记录的流星</h3>
            <div class="records-list" v-if="records.length">
              <div class="record-item" v-for="(r, i) in records.slice().reverse()" :key="r.id">
                <span class="record-index">#{{ records.length - i }}</span>
                <div class="record-info">
                  <span class="record-constellation">{{ r.constellation }}</span>
                  <span class="record-brightness" v-if="r.brightness != null">
                    {{ r.brightness >= 0 ? '+' : '' }}{{ r.brightness }}等
                  </span>
                  <span class="record-color" v-if="r.color">{{ r.color }}</span>
                </div>
                <span class="record-time">{{ formatTime(r.observedTime) }}</span>
              </div>
            </div>
            <p v-else class="empty">还没有记录流星，开始记录吧！</p>
          </div>

          <div class="card">
            <h3>📊 快速提示</h3>
            <ul class="tips">
              <li>记录至少 <strong>3 颗</strong> 流星的轨迹才能计算辐射点</li>
              <li>亮度：数值越小越亮（-2 最亮，+4 最暗）</li>
              <li>RA = 赤经 (0-360°)，Dec = 赤纬 (-90° 到 +90°)</li>
              <li>轨迹坐标从流星<strong>开始出现</strong>的位置到<strong>消失</strong>的位置</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showerAPI, sessionAPI, recordAPI } from '../api'

const router = useRouter()

const hotShowers = ref([])
const allShowers = ref([])
const constellations = ref([])
const colors = ['白', '黄', '蓝', '红']

const currentSession = ref(null)
const records = ref([])

const creating = ref(false)
const adding = ref(false)
const ending = ref(false)

const sessionForm = ref({
  meteorShowerName: '',
  location: '',
  latitude: null,
  longitude: null,
  startTime: '',
  userName: '',
  description: '',
  cloudCover: 0,
  limitingMagnitude: 6.5
})

const recordForm = ref({
  constellation: '',
  brightness: 0,
  color: null,
  trajectoryStartRA: null,
  trajectoryStartDec: null,
  trajectoryEndRA: null,
  trajectoryEndDec: null,
  notes: ''
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const setDefaultStartTime = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  sessionForm.value.startTime = now.toISOString().slice(0, 16)
}

const createSession = async () => {
  creating.value = true
  try {
    const formData = { ...sessionForm.value }
    if (!formData.startTime) {
      formData.startTime = new Date()
    }
    const res = await sessionAPI.create(formData)
    currentSession.value = res.data
    records.value = []
  } catch (error) {
    alert('创建会话失败：' + (error.response?.data?.error || error.message))
  } finally {
    creating.value = false
  }
}

const addRecord = async () => {
  if (!recordForm.value.constellation) {
    alert('请选择星座区域')
    return
  }
  
  adding.value = true
  try {
    const res = await recordAPI.add(currentSession.value.id, recordForm.value)
    records.value.push(res.data)
    recordForm.value = {
      constellation: '',
      brightness: 0,
      color: null,
      trajectoryStartRA: null,
      trajectoryStartDec: null,
      trajectoryEndRA: null,
      trajectoryEndDec: null,
      notes: ''
    }
  } catch (error) {
    alert('记录失败：' + (error.response?.data?.error || error.message))
  } finally {
    adding.value = false
  }
}

const endSession = async () => {
  if (!confirm('确定要结束本次观测吗？结束后将计算辐射点。')) {
    return
  }
  
  ending.value = true
  try {
    await sessionAPI.end(currentSession.value.id)
    router.push(`/session/${currentSession.value.id}`)
  } catch (error) {
    alert('结束会话失败：' + (error.response?.data?.error || error.message))
  } finally {
    ending.value = false
  }
}

onMounted(async () => {
  setDefaultStartTime()
  try {
    const [hotRes, allRes, constRes] = await Promise.all([
      showerAPI.getHot(),
      showerAPI.getAll(),
      showerAPI.getConstellations()
    ])
    hotShowers.value = hotRes.data
    allShowers.value = allRes.data
    constellations.value = constRes.data
  } catch (error) {
    console.error('加载数据失败:', error)
  }
})
</script>

<style scoped>
.observation {
  padding-bottom: 2rem;
}

.session-form {
  margin-top: 1rem;
}

.active-session {
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.session-header h2 {
  margin-bottom: 0.5rem;
}

.session-header p {
  margin: 0.25rem 0;
  color: #a0aec0;
}

.session-actions {
  display: flex;
  gap: 0.5rem;
}

.record-form {
  margin-top: 1rem;
}

.trajectory-title {
  margin: 1.5rem 0 1rem;
  color: #a78bfa;
}

.brightness-slider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  background: #2d3748;
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #7c3aed;
  border-radius: 50%;
  cursor: pointer;
}

.brightness-value {
  font-weight: bold;
  min-width: 40px;
  text-align: center;
  color: #a78bfa;
}

.cloud-slider, .lm-slider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.cloud-value {
  font-weight: bold;
  min-width: 50px;
  text-align: center;
  color: #60a5fa;
}

.lm-value {
  font-weight: bold;
  min-width: 60px;
  text-align: center;
  color: #10b981;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  color: #718096;
  font-size: 0.8rem;
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}

.color-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-block;
  border: 2px solid transparent;
}

.color-白 { background: #ffffff; }
.color-黄 { background: #facc15; }
.color-蓝 { background: #60a5fa; }
.color-红 { background: #f87171; }

.color-option input:checked + .color-dot {
  border-color: #fff;
  box-shadow: 0 0 0 2px #7c3aed;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.record-index {
  font-weight: bold;
  color: #7c3aed;
  min-width: 40px;
}

.record-info {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.record-constellation {
  font-weight: 600;
  color: #e2e8f0;
}

.record-brightness {
  font-size: 0.875rem;
  color: #facc15;
}

.record-color {
  font-size: 0.875rem;
  color: #a0aec0;
}

.record-time {
  font-size: 0.875rem;
  color: #718096;
}

.tips {
  list-style: none;
  padding: 0;
}

.tips li {
  padding: 0.5rem 0;
  color: #a0aec0;
  border-bottom: 1px solid #2a2a5a;
}

.tips li:last-child {
  border-bottom: none;
}

.empty {
  text-align: center;
  color: #718096;
  padding: 2rem;
}

@media (max-width: 768px) {
  .session-header {
    flex-direction: column;
  }
}
</style>
