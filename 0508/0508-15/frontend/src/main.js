import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Analytics from './views/Analytics.vue'
import './styles.css'

const routes = [
  { path: '/', component: Dashboard },
  { path: '/analytics', component: Analytics }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
