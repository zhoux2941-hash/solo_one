import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AcidReactionView from '../views/AcidReactionView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/acid-reaction',
    name: 'acid-reaction',
    component: AcidReactionView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
