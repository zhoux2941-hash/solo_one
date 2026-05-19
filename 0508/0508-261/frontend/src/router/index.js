import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'OrderList',
    component: () => import('@/views/OrderList.vue')
  },
  {
    path: '/create',
    name: 'CreateOrder',
    component: () => import('@/views/CreateOrder.vue')
  },
  {
    path: '/order/:orderNo',
    name: 'OrderDetail',
    component: () => import('@/views/OrderDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router