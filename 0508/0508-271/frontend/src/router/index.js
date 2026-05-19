import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/customer',
    name: 'Customer',
    component: () => import('../views/Customer.vue')
  },
  {
    path: '/vehicle',
    name: 'Vehicle',
    component: () => import('../views/Vehicle.vue')
  },
  {
    path: '/workorder',
    name: 'WorkOrder',
    component: () => import('../views/WorkOrder.vue')
  },
  {
    path: '/part',
    name: 'Part',
    component: () => import('../views/Part.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router