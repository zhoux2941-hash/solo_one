import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/analysis/:id?',
    name: 'Analysis',
    component: () => import('@/views/Analysis.vue')
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/History.vue')
  },
  {
    path: '/cartridge',
    name: 'CartridgeComparison',
    component: () => import('@/views/CartridgeComparison.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
