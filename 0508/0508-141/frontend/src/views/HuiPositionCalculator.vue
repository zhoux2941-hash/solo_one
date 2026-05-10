<template>
  <div class="hui-calculator">
    <h2>徽位位置计算器</h2>
    
    <div class="input-section">
      <label for="stringLength">有效弦长（mm）:</label>
      <input 
        type="number" 
        id="stringLength" 
        v-model.number="stringLength" 
        @input="calculatePositions"
        placeholder="例如: 1080"
        step="1"
        min="100"
      />
      <button @click="calculatePositions">计算</button>
    </div>

    <div class="visualization" v-if="huiPositions.length > 0">
      <h3>弦长可视化</h3>
      <div class="string-container">
        <div class="string">
          <div class="yueshan">岳山</div>
          <div 
            v-for="pos in huiPositions" 
            :key="pos.huiNumber"
            class="hui-marker"
            :style="{ left: (pos.ratioValue * 100) + '%' }"
          >
            <div class="hui-dot"></div>
            <div class="hui-label">{{ pos.huiNumber }}</div>
          </div>
          <div class="longyin">龙龈</div>
        </div>
      </div>
    </div>

    <div class="results" v-if="huiPositions.length > 0">
      <h3>计算结果</h3>
      <table>
        <thead>
          <tr>
            <th>徽位</th>
            <th>名称</th>
            <th>理论比例</th>
            <th>距岳山（mm）</th>
            <th>距龙龈（mm）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pos in huiPositions" :key="pos.huiNumber">
            <td>{{ pos.huiNumber }}</td>
            <td>{{ pos.name }}</td>
            <td>{{ pos.ratio }}</td>
            <td>{{ pos.positionFromYueshan }}</td>
            <td>{{ pos.positionFromLongyin }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="explanation">
      <h3>古琴徽位理论说明</h3>
      <p>古琴有13个徽位，每个徽位对应特定的弦长比例：</p>
      <ul>
        <li>一徽：1/8 - 全弦长的八分之一</li>
        <li>二徽：1/6 - 全弦长的六分之一</li>
        <li>三徽：1/5 - 全弦长的五分之一</li>
        <li>四徽：1/4 - 全弦长的四分之一</li>
        <li>五徽：1/3 - 全弦长的三分之一</li>
        <li>六徽：2/5 - 全弦长的五分之二</li>
        <li>七徽：1/2 - 全弦长的中点</li>
        <li>八徽：3/5 - 全弦长的五分之三</li>
        <li>九徽：2/3 - 全弦长的三分之二</li>
        <li>十徽：3/4 - 全弦长的四分之三</li>
        <li>十一徽：4/5 - 全弦长的五分之四</li>
        <li>十二徽：5/6 - 全弦长的六分之五</li>
        <li>十三徽：7/8 - 全弦长的八分之七</li>
      </ul>
      <p class="note">注：实际制琴时，徽位位置会根据木材特性、漆艺等因素进行微调。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { calculateHuiPositions } from '../utils/huiPositionCalculator'

const stringLength = ref(1080)
const huiPositions = ref([])

const calculatePositions = () => {
  if (stringLength.value > 0) {
    huiPositions.value = calculateHuiPositions(stringLength.value)
  }
}

onMounted(() => {
  calculatePositions()
})
</script>

<style scoped>
.hui-calculator {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #667eea;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

h3 {
  color: #4a5568;
  margin: 1.5rem 0 1rem;
  font-size: 1.2rem;
}

.input-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.input-section label {
  font-weight: 500;
  color: #4a5568;
}

.input-section input {
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 200px;
  transition: border-color 0.3s;
}

.input-section input:focus {
  outline: none;
  border-color: #667eea;
}

.input-section button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.input-section button:hover {
  transform: translateY(-2px);
}

.visualization {
  margin-bottom: 2rem;
}

.string-container {
  padding: 2rem 1rem;
}

.string {
  position: relative;
  height: 80px;
  background: linear-gradient(90deg, #8b4513, #d2691e, #8b4513);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.yueshan, .longyin {
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.hui-marker {
  position: absolute;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hui-dot {
  width: 12px;
  height: 12px;
  background: #ffd700;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
}

.hui-label {
  font-size: 0.75rem;
  color: white;
  margin-top: 4px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.results {
  margin-bottom: 2rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

tbody tr:hover {
  background: #f7fafc;
}

.explanation {
  background: #f7fafc;
  border-radius: 8px;
  padding: 1.5rem;
  border-left: 4px solid #667eea;
}

.explanation ul {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.explanation li {
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  font-size: 0.9rem;
}

.explanation .note {
  margin-top: 1rem;
  font-style: italic;
  color: #718096;
  font-size: 0.9rem;
}
</style>
