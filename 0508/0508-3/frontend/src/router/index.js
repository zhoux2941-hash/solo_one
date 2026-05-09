import { createRouter, createWebHistory } from 'vue-router'

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
    redirect: '/inventory',
    children: [
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('../views/Inventory.vue')
      },
      {
        path: 'requisition',
        name: 'Requisition',
        component: () => import('../views/Requisition.vue')
      },
      {
        path: 'approval',
        name: 'Approval',
        component: () => import('../views/Approval.vue')
      },
      {
        path: 'trace',
        name: 'Trace',
        component: () => import('../views/Trace.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const user = localStorage.getItem('user')
  if (to.path === '/login') {
    next()
  } else {
    if (!user) {
      next('/login')
    } else {
      next()
    }
  }
})

export default router
