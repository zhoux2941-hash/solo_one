import { createRouter, createWebHistory } from 'vue-router'
import HuiPositionCalculator from '../views/HuiPositionCalculator.vue'
import PitchDetector from '../views/PitchDetector.vue'
import TuningRecords from '../views/TuningRecords.vue'
import CompareInstruments from '../views/CompareInstruments.vue'

const routes = [
  { path: '/', component: HuiPositionCalculator, name: '徽位计算' },
  { path: '/tuner', component: PitchDetector, name: '音高检测' },
  { path: '/records', component: TuningRecords, name: '音准记录' },
  { path: '/compare', component: CompareInstruments, name: '琴音对比' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
