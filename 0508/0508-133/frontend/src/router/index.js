import { createRouter, createWebHistory } from 'vue-router'
import PassPrediction from '@/views/PassPrediction.vue'
import IridiumFlare from '@/views/IridiumFlare.vue'
import Heatmap from '@/views/Heatmap.vue'

const routes = [
  {
    path: '/',
    name: 'PassPrediction',
    component: PassPrediction
  },
  {
    path: '/iridium',
    name: 'IridiumFlare',
    component: IridiumFlare
  },
  {
    path: '/heatmap',
    name: 'Heatmap',
    component: Heatmap
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
