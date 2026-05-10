import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'host',
        name: 'HostPanel',
        component: () => import('../views/HostPanel.vue'),
        meta: { requiresHost: true }
      },
      {
        path: 'team',
        name: 'TeamPanel',
        component: () => import('../views/TeamPanel.vue')
      },
      {
        path: 'questions',
        name: 'QuestionManagement',
        component: () => import('../views/QuestionManagement.vue'),
        meta: { requiresHost: true }
      },
      {
        path: 'competitions',
        name: 'CompetitionManagement',
        component: () => import('../views/CompetitionManagement.vue'),
        meta: { requiresHost: true }
      },
      {
        path: 'competition/:id',
        name: 'CompetitionDetail',
        component: () => import('../views/CompetitionDetail.vue')
      },
      {
        path: 'results/:id',
        name: 'CompetitionResults',
        component: () => import('../views/CompetitionResults.vue')
      }
    ]
  },
  {
    path: '/audience',
    name: 'AudienceView',
    component: () => import('../views/AudienceView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/watch/:competitionId?',
    name: 'WatchCompetition',
    component: () => import('../views/AudienceView.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
  const isHost = authStore.user?.role === 'HOST'

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresHost && !isHost) {
    next('/')
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
