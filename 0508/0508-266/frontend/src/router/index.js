import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      }
    ]
  }
]

export const asyncRoutes = [
  {
    path: '/equipment',
    component: Layout,
    redirect: '/equipment/list',
    name: 'Equipment',
    meta: { title: '装备管理', icon: 'Box' },
    children: [
      {
        path: 'list',
        name: 'EquipmentList',
        component: () => import('@/views/equipment/list.vue'),
        meta: { title: '装备台账', roles: ['ADMIN', 'WAREHOUSE_KEEPER', 'AUDITOR', 'OPERATOR'] }
      }
    ]
  },
  {
    path: '/approval',
    component: Layout,
    redirect: '/approval/my',
    name: 'Approval',
    meta: { title: '审批管理', icon: 'Tickets' },
    children: [
      {
        path: 'my',
        name: 'MyApproval',
        component: () => import('@/views/approval/my.vue'),
        meta: { title: '我的申请', roles: ['ADMIN', 'WAREHOUSE_KEEPER', 'AUDITOR', 'OPERATOR'] }
      },
      {
        path: 'pending',
        name: 'PendingApproval',
        component: () => import('@/views/approval/pending.vue'),
        meta: { title: '待我审批', roles: ['ADMIN', 'WAREHOUSE_KEEPER', 'AUDITOR'] }
      },
      {
        path: 'history',
        name: 'HistoryApproval',
        component: () => import('@/views/approval/history.vue'),
        meta: { title: '审批记录', roles: ['ADMIN', 'WAREHOUSE_KEEPER', 'AUDITOR', 'OPERATOR'] }
      }
    ]
  },
  {
    path: '/log',
    component: Layout,
    redirect: '/log/operation',
    name: 'Log',
    meta: { title: '日志审计', icon: 'Document' },
    children: [
      {
        path: 'operation',
        name: 'OperationLog',
        component: () => import('@/views/log/operation.vue'),
        meta: { title: '操作日志', roles: ['ADMIN', 'AUDITOR'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes
})

export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHistory(),
    routes: constantRoutes
  })
  router.matcher = newRouter.matcher
}

export default router
