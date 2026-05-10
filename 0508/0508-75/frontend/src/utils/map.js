export function isMapLoaded() {
  return typeof window !== 'undefined' && window.AMap !== undefined
}

export function waitForMap(timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (isMapLoaded()) {
      resolve(window.AMap)
      return
    }

    const start = Date.now()
    const timer = setInterval(() => {
      if (isMapLoaded()) {
        clearInterval(timer)
        resolve(window.AMap)
      } else if (Date.now() - start > timeout) {
        clearInterval(timer)
        reject(new Error('高德地图加载超时，请检查Key配置'))
      }
    }, 100)
  })
}

export function createMap(container, options = {}) {
  const AMap = window.AMap
  return new AMap.Map(container, {
    zoom: 14,
    center: [116.397428, 39.90923],
    viewMode: '2D',
    mapStyle: 'amap://styles/normal',
    ...options
  })
}

export function createMarker(map, position, options = {}) {
  const AMap = window.AMap
  const marker = new AMap.Marker({
    position,
    ...options
  })
  marker.setMap(map)
  return marker
}

export function createInfoWindow(content, options = {}) {
  const AMap = window.AMap
  return new AMap.InfoWindow({
    isCustom: true,
    content,
    offset: new AMap.Pixel(0, -30),
    ...options
  })
}

export function getPositionFromEvent(e) {
  return {
    lng: e.lnglat.getLng(),
    lat: e.lnglat.getLat()
  }
}
