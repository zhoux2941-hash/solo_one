<template>
  <div class="home">
    <h2>欢迎使用医院管理系统</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>床位总数</h3>
        <p class="number">{{ stats.totalBeds }}</p>
      </div>
      <div class="stat-card">
        <h3>已占用</h3>
        <p class="number occupied">{{ stats.occupiedBeds }}</p>
      </div>
      <div class="stat-card">
        <h3>ICU 病人</h3>
        <p class="number icu">{{ stats.icuPatients }}</p>
      </div>
      <div class="stat-card">
        <h3>护士总数</h3>
        <p class="number">{{ stats.totalNurses }}</p>
      </div>
    </div>

    <div class="icu-alert" v-if="icuAlert">
      ⚠️ {{ icuAlert }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bedApi, nurseApi, scheduleApi } from '../api'

const stats = ref({
  totalBeds: 0,
  occupiedBeds: 0,
  icuPatients: 0,
  totalNurses: 0
})

const icuAlert = ref('')

onMounted(async () => {
  const [bedsRes, nursesRes, icuRes] = await Promise.all([
    bedApi.getAll(),
    nurseApi.getAll(),
    bedApi.getIcuOccupiedCount(),
    scheduleApi.validateIcuCoverage(new Date().toISOString().split('T')[0])
  ])

  const beds = bedsRes.data
  stats.value.totalBeds = beds.length
  stats.value.occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length
  stats.value.icuPatients = icuRes.data
  stats.value.totalNurses = nursesRes.data.length

  const validation = icuRes.data
  if (!validation.valid) {
    icuAlert.value = `ICU护士人力不足! 当前ICU病人: ${validation.occupiedIcuBeds}人, 
      在岗ICU护士: ${validation.icuNursesOnDuty}人, 
      需要: ${validation.requiredNurses}人`
  }
})
</script>

<style scoped>
.home h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  color: #666;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #667eea;
}

.number.occupied {
  color: #f59e0b;
}

.number.icu {
  color: #ef4444;
}

.icu-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-size: 1.1rem;
}
</style>
