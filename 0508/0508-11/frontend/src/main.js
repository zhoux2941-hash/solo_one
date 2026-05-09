import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import CustomerView from './views/CustomerView.vue'
import MerchantView from './views/MerchantView.vue'
import AnalyticsView from './views/AnalyticsView.vue'
import CorrelationView from './views/CorrelationView.vue'
import './style.css'

const routes = [
  { path: '/', redirect: '/customer' },
  { path: '/customer', component: CustomerView },
  { path: '/merchant', component: MerchantView },
  { path: '/analytics', component: AnalyticsView },
  { path: '/correlation', component: CorrelationView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')
