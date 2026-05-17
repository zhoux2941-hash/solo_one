import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/subjects'
  },
  {
    path: '/subjects',
    name: 'Subjects',
    component: () => import('../views/Subjects.vue')
  },
  {
    path: '/trainees',
    name: 'Trainees',
    component: () => import('../views/Trainees.vue')
  },
  {
    path: '/scores',
    name: 'Scores',
    component: () => import('../views/Scores.vue')
  },
  {
    path: '/comprehensive',
    name: 'Comprehensive',
    component: () => import('../views/Comprehensive.vue')
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('../views/Ranking.vue')
  },
  {
    path: '/weakness',
    name: 'Weakness',
    component: () => import('../views/Weakness.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router