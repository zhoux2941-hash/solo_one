<template>
  <div class="bed-management">
    <h2>床位管理</h2>
    
    <div class="filters">
      <button @click="filterType = 'ALL'" :class="{ active: filterType === 'ALL' }">全部</button>
      <button @click="filterType = 'NORMAL'" :class="{ active: filterType === 'NORMAL' }">普通病房</button>
      <button @click="filterType = 'ICU'" :class="{ active: filterType === 'ICU' }">ICU</button>
    </div>

    <div class="beds-grid">
      <div v-for="bed in filteredBeds" :key="bed.id" class="bed-card" :class="bedClass(bed)">
        <div class="bed-number">{{ bed.bedNumber }}</div>
        <div class="bed-type">{{ bed.type === 'ICU' ? 'ICU病房' : '普通病房' }}</div>
        <div class="bed-status">{{ bed.status === 'OCCUPIED' ? '已占用' : '空闲' }}</div>
        
        <div v-if="bed.patientName" class="patient-info">
          <p>病人: {{ bed.patientName }}</p>
        </div>

        <div class="bed-actions">
          <button v-if="bed.status === 'AVAILABLE'" @click="showAssignModal(bed)" class="btn-assign">
            安排病人
          </button>
          <button v-else @click="releaseBed(bed.id)" class="btn-release">
            释放床位
          </button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>安排病人</h3>
        <input v-model="patientForm.name" placeholder="病人姓名" />
        <input v-model="patientForm.id" placeholder="病人ID" />
        <div class="modal-actions">
          <button @click="showModal = false" class="btn-cancel">取消</button>
          <button @click="assignPatient" class="btn-confirm">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { bedApi } from '../api'

const beds = ref([])
const filterType = ref('ALL')
const showModal = ref(false)
const selectedBed = ref(null)
const patientForm = ref({ name: '', id: '' })

const filteredBeds = computed(() => {
  if (filterType.value === 'ALL') return beds.value
  return beds.value.filter(b => b.type === filterType.value)
})

const bedClass = (bed) => {
  return {
    'icu': bed.type === 'ICU',
    'occupied': bed.status === 'OCCUPIED'
  }
}

onMounted(async () => {
  const res = await bedApi.getAll()
  beds.value = res.data
})

const showAssignModal = (bed) => {
  selectedBed.value = bed
  patientForm.value = { name: '', id: '' }
  showModal.value = true
}

const assignPatient = async () => {
  if (!patientForm.value.name || !patientForm.value.id) return
  await bedApi.assignPatient(selectedBed.value.id, {
    patientName: patientForm.value.name,
    patientId: patientForm.value.id
  })
  const res = await bedApi.getAll()
  beds.value = res.data
  showModal.value = false
}

const releaseBed = async (id) => {
  await bedApi.release(id)
  const res = await bedApi.getAll()
  beds.value = res.data
}
</script>

<style scoped>
.bed-management h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.filters {
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.5rem;
}

.filters button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.filters button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.beds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.bed-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-left: 4px solid #10b981;
}

.bed-card.icu {
  border-left-color: #ef4444;
}

.bed-card.occupied {
  background: #fef3c7;
}

.bed-number {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.bed-type {
  color: #666;
  font-size: 0.9rem;
  margin: 0.3rem 0;
}

.bed-status {
  font-size: 0.85rem;
  padding: 0.2rem 0.5rem;
  background: #d1fae5;
  color: #059669;
  border-radius: 4px;
  display: inline-block;
}

.bed-card.occupied .bed-status {
  background: #fecaca;
  color: #dc2626;
}

.patient-info {
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 0.9rem;
}

.bed-actions {
  margin-top: 0.8rem;
}

.btn-assign, .btn-release {
  width: 100%;
  padding: 0.4rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-assign {
  background: #667eea;
  color: white;
}

.btn-release {
  background: #f59e0b;
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
}

.modal h3 {
  margin-bottom: 1rem;
}

.modal input {
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel {
  background: #e5e7eb;
}

.btn-confirm {
  background: #667eea;
  color: white;
}
</style>
