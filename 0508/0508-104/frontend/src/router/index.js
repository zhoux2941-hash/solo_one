import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/register'
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/interview-list',
    name: 'InterviewList',
    component: () => import('../views/InterviewList.vue')
  },
  {
    path: '/management',
    name: 'Management',
    component: () => import('../views/Management.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router