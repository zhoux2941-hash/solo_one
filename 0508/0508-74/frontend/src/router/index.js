import { createRouter, createWebHistory } from 'vue-router'
import PlantList from '../views/PlantList.vue'
import OverdueList from '../views/OverdueList.vue'
import RankingList from '../views/RankingList.vue'

const routes = [
  {
    path: '/',
    name: 'PlantList',
    component: PlantList
  },
  {
    path: '/overdue',
    name: 'OverdueList',
    component: OverdueList
  },
  {
    path: '/ranking',
    name: 'RankingList',
    component: RankingList
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
