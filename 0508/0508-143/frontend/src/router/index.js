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
    meta: { title: '首页' }
  },
  {
    path: '/beehives',
    name: 'Beehives',
    component: () => import('@/views/Beehives.vue'),
    meta: { title: '蜂箱管理' }
  },
  {
    path: '/records',
    name: 'Records',
    component: () => import('@/views/Records.vue'),
    meta: { title: '数据记录' }
  },
  {
    path: '/health',
    name: 'Health',
    component: () => import('@/views/Health.vue'),
    meta: { title: '健康评分' }
  },
  {
    path: '/blooming',
    name: 'Blooming',
    component: () => import('@/views/Blooming.vue'),
    meta: { title: '花期预测' }
  },
  {
    path: '/comparison',
    name: 'Comparison',
    component: () => import('@/views/Comparison.vue'),
    meta: { title: '蜂箱对比' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 养蜂场管理系统` : '养蜂场管理系统'
  next()
})

export default router
