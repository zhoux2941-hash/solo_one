import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'
import orderStatus from './utils/orderStatus'

Vue.config.productionTip = false
Vue.use(ElementUI)

axios.defaults.baseURL = 'http://localhost:8080'
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})
Vue.prototype.$http = axios
Vue.prototype.$baseURL = 'http://localhost:8080'
Vue.prototype.$orderStatus = orderStatus

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
