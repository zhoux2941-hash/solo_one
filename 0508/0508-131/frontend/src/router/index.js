import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/record',
    name: 'Record',
    component: () => import('@/views/FishingRecord.vue')
  },
  {
    path: '/recommend',
    name: 'Recommend',
    component: () => import('@/views/LureRecommend.vue')
  },
  {
    path: '/heatmap',
    name: 'Heatmap',
    component: () => import('@/views/Heatmap.vue')
  },
  {
    path: '/spots',
    name: 'Spots',
    component: () => import('@/views/FishingSpots.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
