import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Designer from '../views/Designer.vue'
import Gallery from '../views/Gallery.vue'
import MyDesigns from '../views/MyDesigns.vue'
import DesignDetail from '../views/DesignDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/design',
    name: 'Designer',
    component: Designer
  },
  {
    path: '/design/:id',
    name: 'DesignerEdit',
    component: Designer
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: Gallery
  },
  {
    path: '/my-designs',
    name: 'MyDesigns',
    component: MyDesigns
  },
  {
    path: '/detail/:id',
    name: 'DesignDetail',
    component: DesignDetail
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
