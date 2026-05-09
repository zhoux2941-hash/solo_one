import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/document/:id',
    name: 'Document',
    component: () => import('@/views/Document.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
