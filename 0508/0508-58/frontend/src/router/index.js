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
    path: '/stock',
    name: 'Stock',
    component: () => import('../views/Stock.vue')
  },
  {
    path: '/expiring',
    name: 'Expiring',
    component: () => import('../views/Expiring.vue')
  },
  {
    path: '/use-vaccine',
    name: 'UseVaccine',
    component: () => import('../views/UseVaccine.vue')
  },
  {
    path: '/scrap-management',
    name: 'ScrapManagement',
    component: () => import('../views/ScrapManagement.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
