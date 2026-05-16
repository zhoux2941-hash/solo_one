import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/manager/pools'
  },
  {
    path: '/manager/pools',
    name: 'BonusPools',
    component: () => import('@/views/manager/BonusPools.vue')
  },
  {
    path: '/manager/pool/:id',
    name: 'PoolDetail',
    component: () => import('@/views/manager/PoolDetail.vue')
  },
  {
    path: '/manager/appeals',
    name: 'AppealManage',
    component: () => import('@/views/manager/AppealManage.vue')
  },
  {
    path: '/employee/bonus',
    name: 'MyBonus',
    component: () => import('@/views/employee/MyBonus.vue')
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/Reports.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
