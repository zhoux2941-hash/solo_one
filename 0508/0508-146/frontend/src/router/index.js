import { createRouter, createWebHistory } from 'vue-router'
import CompatibilityView from '../views/CompatibilityView.vue'
import RecordsView from '../views/RecordsView.vue'
import SeasonView from '../views/SeasonView.vue'
import RemindersView from '../views/RemindersView.vue'

const routes = [
  {
    path: '/',
    redirect: '/compatibility'
  },
  {
    path: '/compatibility',
    name: 'Compatibility',
    component: CompatibilityView
  },
  {
    path: '/records',
    name: 'Records',
    component: RecordsView
  },
  {
    path: '/season',
    name: 'Season',
    component: SeasonView
  },
  {
    path: '/reminders',
    name: 'Reminders',
    component: RemindersView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
