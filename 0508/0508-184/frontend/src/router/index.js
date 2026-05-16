import Vue from 'vue'
import Router from 'vue-router'
import RepairOrders from '../views/RepairOrders.vue'
import PurchaseRequests from '../views/PurchaseRequests.vue'
import Reports from '../views/Reports.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/orders'
    },
    {
      path: '/orders',
      name: 'RepairOrders',
      component: RepairOrders
    },
    {
      path: '/purchase-requests',
      name: 'PurchaseRequests',
      component: PurchaseRequests
    },
    {
      path: '/reports',
      name: 'Reports',
      component: Reports
    }
  ]
})
