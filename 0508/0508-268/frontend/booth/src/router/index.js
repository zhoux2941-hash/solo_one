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
    path: '/entry',
    name: 'Entry',
    component: () => import('../views/Entry.vue')
  },
  {
    path: '/exit',
    name: 'Exit',
    component: () => import('../views/Exit.vue')
  },
  {
    path: '/release',
    name: 'Release',
    component: () => import('../views/Release.vue')
  },
  {
    path: '/visitor',
    name: 'Visitor',
    component: () => import('../views/Visitor.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
