import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    name: 'Map',
    component: () => import('@/views/Map.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-observations',
    name: 'MyObservations',
    component: () => import('@/views/MyObservations.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/challenges',
    name: 'Challenges',
    component: () => import('@/views/Challenges.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.guest && token) {
    next('/')
  } else {
    next()
  }
})

export default router
