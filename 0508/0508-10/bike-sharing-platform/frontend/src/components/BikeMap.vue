<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import L from 'leaflet'

const props = defineProps({
  parkingPoints: {
    type: Array,
    default: () => []
  },
  predictions: {
    type: Array,
    default: () => []
  },
  routePlan: {
    type: Object,
    default: null
  },
  currentStep: {
    type: Number,
    default: -1
  }
})

const mapContainer = ref(null)
let map = null
let markers = []
let heatLayer = null
let routePolyline = null
let routeMarkers = []
let stepHighlightCircle = null

const initMap = () => {
  map = L.map(mapContainer.value, {
    center: [31.2304, 121.4737],
    zoom: 11,
    minZoom: 10,
    maxZoom: 16
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  L.control.scale({ imperial: false }).addTo(map)
}

const getStatusColor = (status) => {
  switch (status) {
    case 'OVER_SATURATED':
      return '#52c41a'
    case 'SHORTAGE':
      return '#f5222d'
    default:
      return '#faad14'
  }
}

const getMarkerSize = (currentBikes, capacity) => {
  const ratio = currentBikes / capacity
  const minSize = 8
  const maxSize = 24
  return minSize + (maxSize - minSize) * ratio
}

const createCustomIcon = (color, size) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size * 0.4}px;
          height: ${size * 0.4}px;
          background-color: white;
          border-radius: 50%;
          opacity: 0.3;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

const createRouteStartIcon = (label) => {
  return L.divIcon({
    className: 'route-marker route-start',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: #f5222d;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">${label}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })
}

const createRouteEndIcon = (label) => {
  return L.divIcon({
    className: 'route-marker route-end',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: #52c41a;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">${label}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })
}

const updateMarkers = () => {
  markers.forEach(marker => map.removeLayer(marker))
  markers = []

  const pointPredictions = {}
  props.predictions.forEach(p => {
    if (!pointPredictions[p.pointId]) {
      pointPredictions[p.pointId] = []
    }
    pointPredictions[p.pointId].push(p)
  })

  props.parkingPoints.forEach(point => {
    const color = getStatusColor(point.status)
    const size = getMarkerSize(point.currentBikes, point.capacity)
    const icon = createCustomIcon(color, size)

    const preds = pointPredictions[point.pointId] || []
    const totalBorrow = preds.reduce((sum, p) => sum + p.predictedBorrowDemand, 0)
    const totalReturn = preds.reduce((sum, p) => sum + p.predictedReturnDemand, 0)

    const popupContent = `
      <div class="popup-content">
        <h4>${point.name}</h4>
        <div class="popup-row">
          <span class="label">当前车辆:</span>
          <span class="value">${point.currentBikes} / ${point.capacity}</span>
        </div>
        <div class="popup-row">
          <span class="label">使用率:</span>
          <span class="value">${(point.utilizationRate * 100).toFixed(1)}%</span>
        </div>
        <div class="popup-row">
          <span class="label">状态:</span>
          <span class="status-tag status-${point.status.toLowerCase()}">
            ${point.status === 'OVER_SATURATED' ? '富余' : point.status === 'SHORTAGE' ? '紧缺' : '正常'}
          </span>
        </div>
        ${preds.length > 0 ? `
          <div class="prediction-section">
            <strong>未来2小时预测:</strong>
            <div class="popup-row">
              <span class="label">预计借车:</span>
              <span class="value borrow">+${totalBorrow}</span>
            </div>
            <div class="popup-row">
              <span class="label">预计还车:</span>
              <span class="value return">+${totalReturn}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `

    const marker = L.marker([point.latitude, point.longitude], { icon })
      .bindPopup(popupContent, {
        className: 'custom-popup',
        maxWidth: 280
      })
      .addTo(map)

    markers.push(marker)
  })
}

const updateHeatLayer = () => {
  if (heatLayer) {
    map.removeLayer(heatLayer)
  }

  const heatPoints = props.parkingPoints.map(point => {
    const intensity = point.utilizationRate
    return [point.latitude, point.longitude, intensity]
  })

  heatLayer = L.heatLayer(heatPoints, {
    radius: 25,
    blur: 15,
    maxZoom: 14,
    gradient: {
      0.2: '#f5222d',
      0.5: '#faad14',
      0.8: '#52c41a'
    }
  }).addTo(map)
}

const clearRoute = () => {
  if (routePolyline) {
    map.removeLayer(routePolyline)
    routePolyline = null
  }
  routeMarkers.forEach(marker => map.removeLayer(marker))
  routeMarkers = []
  if (stepHighlightCircle) {
    map.removeLayer(stepHighlightCircle)
    stepHighlightCircle = null
  }
}

const updateRoute = () => {
  clearRoute()

  if (!props.routePlan || !props.routePlan.steps || props.routePlan.steps.length === 0) {
    return
  }

  const steps = props.routePlan.steps
  const allCoords = []

  steps.forEach((step, index) => {
    if (step.fromLatitude && step.fromLongitude) {
      allCoords.push([step.fromLatitude, step.fromLongitude])
    }
    if (step.toLatitude && step.toLongitude) {
      allCoords.push([step.toLatitude, step.toLongitude])
    }
  })

  const uniqueCoords = []
  const seen = new Set()
  allCoords.forEach(coord => {
    const key = `${coord[0].toFixed(4)},${coord[1].toFixed(4)}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueCoords.push(coord)
    }
  })

  if (uniqueCoords.length >= 2) {
    routePolyline = L.polyline(uniqueCoords, {
      color: '#1890ff',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map)

    map.fitBounds(routePolyline.getBounds(), {
      padding: [50, 50]
    })
  }

  steps.forEach((step, index) => {
    const isActive = index === props.currentStep

    if (step.fromLatitude && step.fromLongitude) {
      const fromMarker = L.marker([step.fromLatitude, step.fromLongitude], {
        icon: createRouteStartIcon(index + 1)
      }).addTo(map)
      
      fromMarker.bindPopup(`
        <div style="padding: 8px;">
          <strong>步骤 ${index + 1}: 取车点</strong><br>
          ${step.fromPointName}<br>
          ${step.bikeCount > 0 ? `取 ${step.bikeCount} 辆车` : '空车前往'}
        </div>
      `)
      routeMarkers.push(fromMarker)
    }

    if (step.toLatitude && step.toLongitude) {
      const endLabel = step.bikeCount > 0 ? '送' : '到'
      const toMarker = L.marker([step.toLatitude, step.toLongitude], {
        icon: createRouteEndIcon(endLabel)
      }).addTo(map)
      
      toMarker.bindPopup(`
        <div style="padding: 8px;">
          <strong>步骤 ${index + 1}: 送达点</strong><br>
          ${step.toPointName}<br>
          ${step.bikeCount > 0 ? `送达 ${step.bikeCount} 辆车` : '目的地'}<br>
          <span style="color: #1890ff;">${step.distanceKm.toFixed(2)} km, ${step.durationMinutes} 分钟</span>
        </div>
      `)
      routeMarkers.push(toMarker)
    }

    if (isActive && step.fromLatitude && step.fromLongitude) {
      stepHighlightCircle = L.circle([step.fromLatitude, step.fromLongitude], {
        radius: 300,
        color: '#1890ff',
        fillColor: '#1890ff',
        fillOpacity: 0.2,
        weight: 2
      }).addTo(map)
    }
  })
}

watch(() => props.parkingPoints, () => {
  updateMarkers()
  updateHeatLayer()
}, { deep: true })

watch(() => props.predictions, () => {
  updateMarkers()
}, { deep: true })

watch(() => props.routePlan, () => {
  updateRoute()
}, { deep: true })

watch(() => props.currentStep, () => {
  if (props.routePlan) {
    updateRoute()
  }
})

onMounted(() => {
  initMap()
  updateMarkers()
  updateHeatLayer()
})

onUnmounted(() => {
  clearRoute()
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>

<style>
.popup-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.popup-content h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}

.popup-row .label {
  color: #8c8c8c;
}

.popup-row .value {
  font-weight: 500;
  color: #262626;
}

.popup-row .value.borrow {
  color: #f5222d;
}

.popup-row .value.return {
  color: #52c41a;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.status-over_saturated {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-tag.status-shortage {
  background-color: #fff2f0;
  color: #f5222d;
  border: 1px solid #ffccc7;
}

.status-tag.status-normal {
  background-color: #fffbe6;
  color: #faad14;
  border: 1px solid #ffe58f;
}

.prediction-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
}

.prediction-section strong {
  display: block;
  margin-bottom: 8px;
  color: #1890ff;
}

.custom-marker {
  background: none !important;
  border: none !important;
}

.custom-marker .leaflet-marker-icon {
  background: none !important;
  border: none !important;
}

.route-marker {
  background: none !important;
  border: none !important;
  z-index: 1000 !important;
}

.route-marker .leaflet-marker-icon {
  background: none !important;
  border: none !important;
}

.leaflet-pane.leaflet-marker-pane .route-marker {
  z-index: 600 !important;
}
</style>
