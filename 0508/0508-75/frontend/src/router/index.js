import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/',
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
    path: '/lost',
    name: 'LostList',
    component: () => import('@/views/LostList.vue')
  },
  {
    path: '/found',
    name: 'FoundList',
    component: () => import('@/views/FoundList.vue')
  },
  {
    path: '/map',
    name: 'MapView',
    component: () => import('@/views/MapView.vue')
  },
  {
    path: '/publish-lost',
    name: 'PublishLost',
    component: () => import('@/views/PublishLost.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/publish-found',
    name: 'PublishFound',
    component: () => import('@/views/PublishFound.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-items',
    name: 'MyItems',
    component: () => import('@/views/MyItems.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/matches',
    name: 'Matches',
    component: () => import('@/views/Matches.vue'),
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
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
