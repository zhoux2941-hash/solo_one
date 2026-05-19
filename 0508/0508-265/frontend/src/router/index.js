import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'workorders',
        name: 'WorkOrders',
        component: () => import('../views/WorkOrders.vue')
      },
      {
        path: 'workorder-create',
        name: 'WorkOrderCreate',
        component: () => import('../views/WorkOrderCreate.vue')
      },
      {
        path: 'workorder-detail/:id',
        name: 'WorkOrderDetail',
        component: () => import('../views/WorkOrderDetail.vue')
      },
      {
        path: 'devices',
        name: 'Devices',
        component: () => import('../views/Devices.vue')
      },
      {
        path: 'approvals',
        name: 'Approvals',
        component: () => import('../views/Approvals.vue')
      },
      {
        path: 'schedules',
        name: 'Schedules',
        component: () => import('../views/Schedules.vue')
      },
      {
        path: 'alerts',
        name: 'Alerts',
        component: () => import('../views/Alerts.vue')
      },
      {
        path: 'maintenance',
        name: 'Maintenance',
        component: () => import('../views/Maintenance.vue')
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('../views/Statistics.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  userStore.loadUser()
  
  if (to.path !== '/login' && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
