import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/telescopes',
    name: 'Telescopes',
    component: () => import('@/views/TelescopesView.vue')
  },
  {
    path: '/booking/:telescopeId',
    name: 'Booking',
    component: () => import('@/views/BookingView.vue')
  },
  {
    path: '/my-bookings',
    name: 'MyBookings',
    component: () => import('@/views/MyBookingsView.vue')
  },
  {
    path: '/images',
    name: 'Images',
    component: () => import('@/views/ImagesView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
