import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/scripts/:id',
    name: 'ScriptEditor',
    component: () => import('../views/ScriptEditor.vue')
  },
  {
    path: '/scripts/:id/test',
    name: 'TestViewer',
    component: () => import('../views/TestViewer.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
