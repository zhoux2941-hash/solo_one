import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/booking'
  },
  {
    path: '/booking',
    name: 'Booking',
    component: () => import('@/views/Booking.vue'),
    meta: { title: '工位预订' }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/views/Analytics.vue'),
    meta: { title: '数据分析' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '共享工位预订系统'
  next()
})

export default router
