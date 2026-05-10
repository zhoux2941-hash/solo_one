import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import Observation from './views/Observation.vue'
import SessionDetail from './views/SessionDetail.vue'
import Consensus from './views/Consensus.vue'

const routes = [
  { path: '/', component: Home, name: 'home' },
  { path: '/observation', component: Observation, name: 'observation' },
  { path: '/session/:id', component: SessionDetail, name: 'session-detail' },
  { path: '/consensus', component: Consensus, name: 'consensus' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
