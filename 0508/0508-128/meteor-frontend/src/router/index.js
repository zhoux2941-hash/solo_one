import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Upload from '../views/Upload.vue'
import SpectraDetail from '../views/SpectraDetail.vue'
import VelocityEstimator from '../views/VelocityEstimator.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/upload',
    name: 'Upload',
    component: Upload
  },
  {
    path: '/velocity',
    name: 'VelocityEstimator',
    component: VelocityEstimator
  },
  {
    path: '/spectra/:id',
    name: 'SpectraDetail',
    component: SpectraDetail
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
