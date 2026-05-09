import { createRouter, createWebHistory } from 'vue-router'
import CourseList from '../views/CourseList.vue'
import MyBookings from '../views/MyBookings.vue'
import Analytics from '../views/Analytics.vue'

const routes = [
  {
    path: '/',
    name: 'CourseList',
    component: CourseList,
    meta: { title: '课程列表' }
  },
  {
    path: '/my-bookings',
    name: 'MyBookings',
    component: MyBookings,
    meta: { title: '我的预约' }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics,
    meta: { title: '数据分析看板' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 健身房团课预约系统` : '健身房团课预约系统'
  next()
})

export default router
