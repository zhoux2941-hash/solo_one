import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '数据分析' }
  },
  {
    path: '/pets',
    name: 'Pets',
    component: () => import('@/views/Pets.vue'),
    meta: { title: '宠物管理' }
  },
  {
    path: '/booking',
    name: 'Booking',
    component: () => import('@/views/Booking.vue'),
    meta: { title: '预约管理' }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('@/views/Calendar.vue'),
    meta: { title: '预约日历' }
  },
  {
    path: '/matching',
    name: 'Matching',
    component: () => import('@/views/Matching.vue'),
    meta: { title: '智能匹配' }
  },
  {
    path: '/centers',
    name: 'Centers',
    component: () => import('@/views/Centers.vue'),
    meta: { title: '寄养中心' }
  },
  {
    path: '/price-suggestion',
    name: 'PriceSuggestion',
    component: () => import('@/views/PriceSuggestion.vue'),
    meta: { title: '价格调整建议' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 宠物寄养系统` : '宠物寄养系统'
  next()
})

export default router
