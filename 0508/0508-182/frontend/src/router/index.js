import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/beds',
    name: 'Beds',
    component: () => import('../views/BedManagement.vue')
  },
  {
    path: '/schedules',
    name: 'Schedules',
    component: () => import('../views/ScheduleManagement.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
