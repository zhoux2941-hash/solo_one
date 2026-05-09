import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'leaflet/dist/leaflet.css'
import './style.css'
import App from './App.vue'
import PackageList from './views/PackageList.vue'
import PackageTrack from './views/PackageTrack.vue'
import Dashboard from './views/Dashboard.vue'
import StuckHeatmap from './views/StuckHeatmap.vue'
import SankeyFlow from './views/SankeyFlow.vue'
import AggregationMap from './views/AggregationMap.vue'
import BatchTrackView from './views/BatchTrackView.vue'
import AnomalyMonitor from './views/AnomalyMonitor.vue'

const routes = [
  { path: '/', redirect: '/packages' },
  { path: '/packages', name: 'PackageList', component: PackageList },
  { path: '/packages/:id', name: 'PackageTrack', component: PackageTrack },
  { path: '/anomaly', name: 'AnomalyMonitor', component: AnomalyMonitor },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/heatmap', name: 'StuckHeatmap', component: StuckHeatmap },
  { path: '/sankey', name: 'SankeyFlow', component: SankeyFlow },
  { path: '/aggregation', name: 'AggregationMap', component: AggregationMap },
  { path: '/batch-tracks', name: 'BatchTrackView', component: BatchTrackView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
