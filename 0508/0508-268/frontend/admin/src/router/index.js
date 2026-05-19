import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/parking-lots',
    name: 'ParkingLots',
    component: () => import('../views/ParkingLots.vue')
  },
  {
    path: '/parking-spaces',
    name: 'ParkingSpaces',
    component: () => import('../views/ParkingSpaces.vue')
  },
  {
    path: '/vehicles',
    name: 'Vehicles',
    component: () => import('../views/Vehicles.vue')
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/Orders.vue')
  },
  {
    path: '/rates',
    name: 'Rates',
    component: () => import('../views/Rates.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
