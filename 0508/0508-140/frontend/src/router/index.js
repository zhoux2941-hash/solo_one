import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/share/:shareCode',
    name: 'Share',
    component: () => import('@/views/Share.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
