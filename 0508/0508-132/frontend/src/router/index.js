import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/tube-racks',
    name: 'TubeRacks',
    component: () => import('@/views/TubeRacks.vue')
  },
  {
    path: '/tube-racks/:id',
    name: 'TubeRackDetail',
    component: () => import('@/views/TubeRackDetail.vue')
  },
  {
    path: '/experiments',
    name: 'Experiments',
    component: () => import('@/views/Experiments.vue')
  },
  {
    path: '/experiments/:id',
    name: 'ExperimentDetail',
    component: () => import('@/views/ExperimentDetail.vue')
  },
  {
    path: '/optimize',
    name: 'Optimize',
    component: () => import('@/views/Optimize.vue')
  },
  {
    path: '/share/:code',
    name: 'SharedExperiment',
    component: () => import('@/views/SharedExperiment.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router