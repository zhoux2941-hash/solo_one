import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import TransitSimulator from './views/TransitSimulator.vue'
import ShareView from './views/ShareView.vue'
import PredictionPage from './views/PredictionPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: TransitSimulator },
    { path: '/prediction', component: PredictionPage },
    { path: '/share/:token', component: ShareView }
  ]
})

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')