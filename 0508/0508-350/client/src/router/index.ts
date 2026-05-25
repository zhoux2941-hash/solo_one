import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/verification'
  },
  {
    path: '/verification',
    name: 'Verification',
    component: () => import('../views/VerificationStation.vue'),
    meta: { title: '归并校核台' }
  },
  {
    path: '/team-check',
    name: 'TeamCheck',
    component: () => import('../views/TeamCheck.vue'),
    meta: { title: '班组核对' }
  },
  {
    path: '/daily-settlement',
    name: 'DailySettlement',
    component: () => import('../views/DailySettlement.vue'),
    meta: { title: '日结清单' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '渔港加冰站'} - 归并校核台`
  next()
})

export default router
