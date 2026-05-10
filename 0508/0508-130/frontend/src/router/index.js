import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/forecast'
  },
  {
    path: '/forecast',
    name: 'Forecast',
    component: () => import('@/views/Forecast.vue')
  },
  {
    path: '/allocation',
    name: 'Allocation',
    component: () => import('@/views/Allocation.vue')
  },
  {
    path: '/consumption',
    name: 'Consumption',
    component: () => import('@/views/Consumption.vue')
  },
  {
    path: '/compare',
    name: 'Compare',
    component: () => import('@/views/Compare.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
