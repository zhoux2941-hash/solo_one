import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import HeatmapView from '../views/HeatmapView.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/heatmap',
    name: 'Heatmap',
    component: HeatmapView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
