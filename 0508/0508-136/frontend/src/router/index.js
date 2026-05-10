import { createRouter, createWebHistory } from 'vue-router'
import JoinDesign from '@/views/JoinDesign.vue'
import Favorites from '@/views/Favorites.vue'

const routes = [
  {
    path: '/',
    name: 'JoinDesign',
    component: JoinDesign
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: Favorites
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router