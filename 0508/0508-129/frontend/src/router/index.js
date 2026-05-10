import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/stars'
  },
  {
    path: '/stars',
    name: 'Stars',
    component: () => import('@/views/StarList.vue')
  },
  {
    path: '/observation',
    name: 'Observation',
    component: () => import('@/views/Observation.vue')
  },
  {
    path: '/lightcurve',
    name: 'LightCurve',
    component: () => import('@/views/LightCurve.vue')
  },
  {
    path: '/export',
    name: 'Export',
    component: () => import('@/views/Export.vue')
  },
  {
    path: '/period-detection',
    name: 'PeriodDetection',
    component: () => import('@/views/PeriodDetection.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
