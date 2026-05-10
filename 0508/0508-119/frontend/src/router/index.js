import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/piles'
  },
  {
    path: '/piles',
    name: 'Piles',
    component: () => import('@/views/Piles.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reservations',
    name: 'Reservations',
    component: () => import('@/views/Reservations.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/fault-reports',
    name: 'FaultReports',
    component: () => import('@/views/FaultReports.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.requiresAdmin && userStore.currentUser?.role !== 'ADMIN') {
    next('/piles')
  } else if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn) {
    next('/piles')
  } else {
    next()
  }
})

export default router
