import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: '/products',
        name: 'Products',
        component: () => import('@/views/Products.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: '/categories',
        name: 'Categories',
        component: () => import('@/views/Categories.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: '/orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: '/group-activities',
        name: 'GroupActivities',
        component: () => import('@/views/GroupActivities.vue'),
        meta: { title: '团购活动' }
      },
      {
        path: '/stores',
        name: 'Stores',
        component: () => import('@/views/Stores.vue'),
        meta: { title: '门店管理' }
      },
      {
        path: '/delivery-routes',
        name: 'DeliveryRoutes',
        component: () => import('@/views/DeliveryRoutes.vue'),
        meta: { title: '配送路线' }
      },
      {
        path: '/refunds',
        name: 'Refunds',
        component: () => import('@/views/Refunds.vue'),
        meta: { title: '退款管理' }
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
  const token = userStore.token

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router