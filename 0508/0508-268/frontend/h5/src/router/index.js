import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/parking',
    name: 'Parking',
    component: () => import('../views/Parking.vue')
  },
  {
    path: '/my',
    name: 'My',
    component: () => import('../views/My.vue')
  },
  {
    path: '/payment',
    name: 'Payment',
    component: () => import('../views/Payment.vue')
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/Orders.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
