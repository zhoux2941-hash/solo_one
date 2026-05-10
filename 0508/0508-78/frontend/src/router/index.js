import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/director',
    name: 'Director',
    component: () => import('../views/Director.vue'),
    meta: { requiresAuth: true, role: 'DIRECTOR' }
  },
  {
    path: '/actor',
    name: 'Actor',
    component: () => import('../views/Actor.vue'),
    meta: { requiresAuth: true, role: 'ACTOR' }
  },
  {
    path: '/production',
    name: 'Production',
    component: () => import('../views/Production.vue'),
    meta: { requiresAuth: true, role: 'PRODUCTION_ASSISTANT' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  
  if (to.meta.requiresAuth && !token) {
    ElMessage.warning('请先登录')
    next('/login')
  } else if (to.meta.role && user && user.role !== to.meta.role) {
    ElMessage.error('无权限访问该页面')
    next('/dashboard')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router