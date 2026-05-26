import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../views/Login.vue'
import LeaderLayout from '../views/leader/LeaderLayout.vue'
import ActivityList from '../views/leader/ActivityList.vue'
import CreateActivity from '../views/leader/CreateActivity.vue'
import SortingList from '../views/leader/SortingList.vue'
import PickupVerify from '../views/leader/PickupVerify.vue'
import CommissionList from '../views/leader/CommissionList.vue'
import MemberLayout from '../views/member/MemberLayout.vue'
import ProductList from '../views/member/ProductList.vue'
import OrderList from '../views/member/OrderList.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/leader',
    component: LeaderLayout,
    children: [
      {
        path: '',
        redirect: 'activity'
      },
      {
        path: 'activity',
        name: 'LeaderActivity',
        component: ActivityList
      },
      {
        path: 'activity/create',
        name: 'CreateActivity',
        component: CreateActivity
      },
      {
        path: 'sorting/:activityId',
        name: 'SortingList',
        component: SortingList
      },
      {
        path: 'verify/:activityId',
        name: 'PickupVerify',
        component: PickupVerify
      },
      {
        path: 'commission',
        name: 'CommissionList',
        component: CommissionList
      }
    ]
  },
  {
    path: '/member',
    component: MemberLayout,
    children: [
      {
        path: '',
        redirect: 'product'
      },
      {
        path: 'product',
        name: 'MemberProduct',
        component: ProductList
      },
      {
        path: 'order',
        name: 'MemberOrder',
        component: OrderList
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  if (to.path === '/login') {
    next()
  } else if (!token) {
    next('/login')
  } else if (to.path.startsWith('/leader') && user.role !== 'LEADER') {
    next('/member')
  } else if (to.path.startsWith('/member') && user.role !== 'MEMBER') {
    next('/leader')
  } else {
    next()
  }
})

export default router
