import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/admin'
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/admin/resident'
      },
      {
        path: 'resident',
        name: 'AdminResident',
        component: () => import('@/views/admin/Resident.vue')
      },
      {
        path: 'garbage',
        name: 'AdminGarbage',
        component: () => import('@/views/admin/Garbage.vue')
      },
      {
        path: 'product',
        name: 'AdminProduct',
        component: () => import('@/views/admin/Product.vue')
      },
      {
        path: 'order',
        name: 'AdminOrder',
        component: () => import('@/views/admin/Order.vue')
      },
      {
        path: 'ranking',
        name: 'AdminRanking',
        component: () => import('@/views/admin/Ranking.vue')
      }
    ]
  },
  {
    path: '/mini',
    component: () => import('@/layouts/MiniLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/mini/home'
      },
      {
        path: 'home',
        name: 'MiniHome',
        component: () => import('@/views/mini/Home.vue')
      },
      {
        path: 'exchange',
        name: 'MiniExchange',
        component: () => import('@/views/mini/Exchange.vue')
      },
      {
        path: 'records',
        name: 'MiniRecords',
        component: () => import('@/views/mini/Records.vue')
      },
      {
        path: 'ranking',
        name: 'MiniRanking',
        component: () => import('@/views/mini/Ranking.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
