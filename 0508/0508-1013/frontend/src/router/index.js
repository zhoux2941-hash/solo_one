import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Monitor',
    component: () => import('../views/Monitor.vue')
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue')
  },
  {
    path: '/abnormal',
    name: 'Abnormal',
    component: () => import('../views/Abnormal.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
