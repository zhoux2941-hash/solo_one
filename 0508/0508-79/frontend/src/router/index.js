import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
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
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-boxes',
    name: 'MyBoxes',
    component: () => import('@/views/MyBoxes.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/intents',
    name: 'Intents',
    component: () => import('@/views/Intents.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/exchange-requests',
    name: 'ExchangeRequests',
    component: () => import('@/views/ExchangeRequests.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/hall',
    name: 'Hall',
    component: () => import('@/views/Hall.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/Messages.vue'),
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
    next('/home')
  } else {
    next()
  }
})

export default router
