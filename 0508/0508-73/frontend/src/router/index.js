import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser } from '../api/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    redirect: '/chemicals',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'chemicals',
        name: 'Chemicals',
        component: () => import('../views/Chemicals.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'applications',
        name: 'Applications',
        component: () => import('../views/Applications.vue'),
        meta: { requiresAuth: true, roles: ['LAB_TECHNICIAN'] }
      },
      {
        path: 'first-review',
        name: 'FirstReview',
        component: () => import('../views/FirstReview.vue'),
        meta: { requiresAuth: true, roles: ['SAFETY_OFFICER'] }
      },
      {
        path: 'second-review',
        name: 'SecondReview',
        component: () => import('../views/SecondReview.vue'),
        meta: { requiresAuth: true, roles: ['DIRECTOR'] }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('../views/Notifications.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'violations',
        name: 'Violations',
        component: () => import('../views/Violations.vue'),
        meta: { requiresAuth: true, roles: ['SAFETY_OFFICER', 'DIRECTOR'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const user = await getCurrentUser()
      localStorage.setItem('user', JSON.stringify(user))
      
      if (to.meta.roles && !to.meta.roles.includes(user.role)) {
        next('/chemicals')
        return
      }
      next()
    } catch (error) {
      localStorage.removeItem('user')
      next('/login')
    }
  } else {
    next()
  }
})

export default router
