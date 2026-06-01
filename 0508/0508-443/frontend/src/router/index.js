import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Monitor',
    component: () => import('../views/Monitor.vue')
  },
  {
    path: '/recordings',
    name: 'Recordings',
    component: () => import('../views/Recordings.vue')
  },
  {
    path: '/analyze',
    name: 'Analyze',
    component: () => import('../views/Analyze.vue')
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('../views/Alerts.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
