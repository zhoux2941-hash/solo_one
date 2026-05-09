import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/student/exams',
    name: 'StudentExams',
    component: () => import('@/views/student/ExamList.vue'),
    meta: { requiresAuth: true, role: 'STUDENT' }
  },
  {
    path: '/student/exam/:examId',
    name: 'StudentExam',
    component: () => import('@/views/student/ExamPage.vue'),
    meta: { requiresAuth: true, role: 'STUDENT' }
  },
  {
    path: '/teacher/exams',
    name: 'TeacherExams',
    component: () => import('@/views/teacher/ExamManagement.vue'),
    meta: { requiresAuth: true, role: 'TEACHER' }
  },
  {
    path: '/teacher/exam/:examId/create',
    name: 'CreateExam',
    component: () => import('@/views/teacher/CreateExam.vue'),
    meta: { requiresAuth: true, role: 'TEACHER' }
  },
  {
    path: '/teacher/exam/:examId/questions',
    name: 'ManageQuestions',
    component: () => import('@/views/teacher/QuestionManagement.vue'),
    meta: { requiresAuth: true, role: 'TEACHER' }
  },
  {
    path: '/teacher/monitor',
    name: 'TeacherMonitor',
    component: () => import('@/views/teacher/MonitorPanel.vue'),
    meta: { requiresAuth: true, role: 'TEACHER' }
  },
  {
    path: '/teacher/report/:examId',
    name: 'ExamReport',
    component: () => import('@/views/teacher/ExamReport.vue'),
    meta: { requiresAuth: true, role: 'TEACHER' }
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
  } else if (to.meta.role && userStore.currentUser?.role !== to.meta.role) {
    next('/login')
  } else {
    next()
  }
})

export default router
