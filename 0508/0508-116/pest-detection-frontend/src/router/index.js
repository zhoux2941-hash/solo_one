import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/farmer',
    name: 'Farmer',
    component: () => import('@/views/Farmer.vue'),
    meta: { requiresAuth: true, role: 'FARMER' }
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('@/views/Report.vue'),
    meta: { requiresAuth: true, role: 'FARMER' }
  },
  {
    path: '/expert',
    name: 'Expert',
    component: () => import('@/views/Expert.vue'),
    meta: { requiresAuth: true, role: 'EXPERT' }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/views/Stats.vue')
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: () => import('@/views/Knowledge.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (to.meta.requiresAuth) {
    if (!user) {
      next('/login')
    } else if (to.meta.role && user.role !== to.meta.role) {
      next('/home')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router