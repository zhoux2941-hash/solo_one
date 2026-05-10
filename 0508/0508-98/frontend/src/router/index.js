import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    redirect: '/student/coaches'
  },
  {
    path: '/student',
    component: () => import('@/views/student/StudentLayout.vue'),
    meta: { role: 'STUDENT' },
    children: [
      {
        path: 'coaches',
        name: 'StudentCoaches',
        component: () => import('@/views/student/CoachList.vue'),
        meta: { title: '教练列表' }
      },
      {
        path: 'bookings',
        name: 'StudentBookings',
        component: () => import('@/views/student/BookingList.vue'),
        meta: { title: '我的预约' }
      }
    ]
  },
  {
    path: '/coach',
    component: () => import('@/views/coach/CoachLayout.vue'),
    meta: { role: 'COACH' },
    children: [
      {
        path: 'schedule',
        name: 'CoachSchedule',
        component: () => import('@/views/coach/Schedule.vue'),
        meta: { title: '我的排班' }
      },
      {
        path: 'bookings',
        name: 'CoachBookings',
        component: () => import('@/views/coach/BookingList.vue'),
        meta: { title: '学员预约' }
      },
      {
        path: 'ratings',
        name: 'CoachRatings',
        component: () => import('@/views/coach/Ratings.vue'),
        meta: { title: '评分记录' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 驾校约车系统` : '驾校约车系统'
  
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn
  const userRole = userStore.userInfo?.role

  if (to.path === '/login') {
    if (isLoggedIn) {
      if (userRole === 'STUDENT') {
        next('/student/coaches')
      } else {
        next('/coach/schedule')
      }
    } else {
      next()
    }
    return
  }

  if (!isLoggedIn) {
    next('/login')
    return
  }

  if (to.meta.role && to.meta.role !== userRole) {
    if (userRole === 'STUDENT') {
      next('/student/coaches')
    } else {
      next('/coach/schedule')
    }
    return
  }

  next()
})

export default router