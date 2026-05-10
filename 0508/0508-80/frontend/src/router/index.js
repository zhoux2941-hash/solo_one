import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'positions',
        name: 'Positions',
        component: () => import('@/views/volunteer/Positions.vue'),
        meta: { title: '岗位申请', roles: ['VOLUNTEER'] }
      },
      {
        path: 'my-applications',
        name: 'MyApplications',
        component: () => import('@/views/volunteer/MyApplications.vue'),
        meta: { title: '我的申请', roles: ['VOLUNTEER'] }
      },
      {
        path: 'my-schedules',
        name: 'MySchedules',
        component: () => import('@/views/volunteer/MySchedules.vue'),
        meta: { title: '我的排班', roles: ['VOLUNTEER'] }
      },
      {
        path: 'checkin/:scheduleId',
        name: 'CheckIn',
        component: () => import('@/views/volunteer/CheckIn.vue'),
        meta: { title: '签到', roles: ['VOLUNTEER'] }
      },
      {
        path: 'shift-swap',
        name: 'ShiftSwap',
        component: () => import('@/views/volunteer/ShiftSwap.vue'),
        meta: { title: '换班申请', roles: ['VOLUNTEER'] }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue'),
        meta: { title: '通知中心' }
      },
      {
        path: 'leader/applications',
        name: 'LeaderApplications',
        component: () => import('@/views/leader/Applications.vue'),
        meta: { title: '申请审核', roles: ['LEADER', 'ADMIN'] }
      },
      {
        path: 'leader/schedules',
        name: 'LeaderSchedules',
        component: () => import('@/views/leader/ScheduleManage.vue'),
        meta: { title: '排班管理', roles: ['LEADER', 'ADMIN'] }
      },
      {
        path: 'admin/positions',
        name: 'AdminPositions',
        component: () => import('@/views/admin/PositionManage.vue'),
        meta: { title: '岗位管理', roles: ['ADMIN'] }
      },
      {
        path: 'admin/checkin-stats',
        name: 'CheckInStats',
        component: () => import('@/views/admin/CheckInStats.vue'),
        meta: { title: '签到统计', roles: ['ADMIN'] }
      },
      {
        path: 'admin/heat-map',
        name: 'HeatMap',
        component: () => import('@/views/admin/HeatMap.vue'),
        meta: { title: '岗位热度图', roles: ['ADMIN'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
    return
  }

  if (to.meta.guest && authStore.isLoggedIn) {
    next('/dashboard')
    return
  }

  if (to.meta.roles && authStore.user) {
    if (!to.meta.roles.includes(authStore.user.role)) {
      next('/dashboard')
      return
    }
  }

  next()
})

export default router
