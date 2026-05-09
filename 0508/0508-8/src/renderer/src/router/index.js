import { createRouter, createWebHashHistory } from 'vue-router'
import MaterialsView from '../views/MaterialsView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import TagsView from '../views/TagsView.vue'

const routes = [
  {
    path: '/',
    redirect: '/materials'
  },
  {
    path: '/materials',
    name: 'materials',
    component: MaterialsView
  },
  {
    path: '/categories',
    name: 'categories',
    component: CategoriesView
  },
  {
    path: '/tags',
    name: 'tags',
    component: TagsView
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
