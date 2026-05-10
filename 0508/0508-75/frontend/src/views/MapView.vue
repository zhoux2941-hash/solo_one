<template>
  <div class="map-page">
    <div class="page-container" style="max-width: 100%">
      <div class="map-header">
        <h2 class="page-title">
          <el-icon><MapLocation /></el-icon>
          拾物存放点地图
        </h2>
        <div class="map-controls">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索物品名称..."
            style="width: 220px"
            clearable
            @keyup.enter="handleSearch"
            @clear="loadData"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch">
            搜索
          </el-button>
          <el-button @click="resetMap">
            重置视图
          </el-button>
        </div>
      </div>

      <div class="map-container-wrapper">
        <div ref="mapRef" class="map-container" v-loading="mapLoading"></div>
        <div class="map-sidebar" v-if="filteredFoundItems.length > 0">
          <h3 class="sidebar-title">附近拾物 ({{ filteredFoundItems.length }})</h3>
          <div class="sidebar-list">
            <div
              v-for="item in filteredFoundItems"
              :key="item.id"
              class="sidebar-item"
              :class="{ active: highlightedId === item.id }"
              @click="focusOnItem(item)"
            >
              <div class="item-title">
                <strong>{{ item.itemName }}</strong>
                <el-tag v-if="item.status === 1" type="success" size="small">已认领</el-tag>
                <el-tag v-else type="primary" size="small">待认领</el-tag>
              </div>
              <div class="item-meta">
                <el-icon><Location /></el-icon>
                {{ item.storageLocation || item.location }}
              </div>
              <div class="item-meta">
                <el-icon><Clock /></el-icon>
                {{ formatTime(item.foundTime) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-empty
        v-if="!mapLoading && allFoundItems.length === 0"
        description="暂无拾物数据"
        style="margin-top: 80px"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { foundApi } from '@/api'
import { isMapLoaded, waitForMap, createMap, createMarker, createInfoWindow, getPositionFromEvent } from '@/utils/map'

const mapRef = ref(null)
const mapLoading = ref(false)
const searchKeyword = ref('')
const highlightedId = ref(null)

let map = null
const markers = []
let infoWindow = null

const allFoundItems = ref([])

const filteredFoundItems = computed(() => {
  if (!searchKeyword.value) return allFoundItems.value
  const kw = searchKeyword.value.toLowerCase()
  return allFoundItems.value.filter(item => {
    return (
      item.itemName?.toLowerCase().includes(kw) ||
      item.location?.toLowerCase().includes(kw) ||
      item.storageLocation?.toLowerCase().includes(kw) ||
      item.description?.toLowerCase().includes(kw)
    )
  })
})

onMounted(async () => {
  mapLoading.value = true
  try {
    if (!isMapLoaded()) {
      await waitForMap(8000)
    }
    await nextTick()
    await initMap()
    await loadData()
  } catch (e) {
    console.error(e)
    ElMessage.error('地图加载失败：' + e.message)
  } finally {
    mapLoading.value = false
  }
})

onUnmounted(() => {
  if (map) {
    map.destroy()
    map = null
  }
})

async function initMap() {
  map = createMap(mapRef.value, {
    zoom: 11,
    center: [116.397428, 39.90923]
  })
  window._testMap = map
}

async function loadData() {
  try {
    const res = await foundApi.page({ page: 1, size: 500, status: 0 })
    allFoundItems.value = res.data.records || []
    renderMarkers()
  } catch (e) {
    console.error('加载拾物数据失败', e)
  }
}

function renderMarkers() {
  if (!map) return

  markers.forEach(m => m.setMap(null))
  markers.length = 0

  const items = filteredFoundItems.value
  const validItems = items.filter(item => item.lng != null && item.lat != null)

  validItems.forEach((item, idx) => {
    const marker = createMarker(map, [item.lng, item.lat], {
      title: item.itemName,
      offset: window.AMap.Pixel(-13, -30),
      content: createMarkerContent(idx + 1, item.status === 1)
    })

    marker.on('click', () => {
      highlightedId.value = item.id
      showInfoWindow(item, marker)
    })

    markers.push(marker)
  })

  if (validItems.length > 0) {
    setTimeout(() => {
      const bounds = new window.AMap.Bounds()
      validItems.forEach(item => {
        bounds.extend([item.lng, item.lat])
      })
      map.setBounds(bounds, false, [60, 60, 260, 60])
    }, 100)
  }
}

function createMarkerContent(index, isClaimed) {
  const color = isClaimed ? '#67C23A' : '#409EFF'
  return `
    <div style="
      position: relative;
      width: 26px;
      height: 34px;
      background: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="
        color: #fff;
        font-size: 12px;
        font-weight: bold;
        transform: rotate(45deg);
        margin-bottom: 4px;
      ">${index}</span>
    </div>
  `
}

function showInfoWindow(item, marker) {
  if (infoWindow) {
    infoWindow.close()
  }

  const content = `
    <div style="
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      min-width: 240px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      position: relative;
    ">
      <div style="
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 10px solid #fff;
      "></div>
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #303133;">
        ${item.itemName}
        <span style="
          font-size: 12px;
          margin-left: 8px;
          padding: 2px 8px;
          border-radius: 4px;
          background: ${item.status === 1 ? '#f0f9eb' : '#ecf5ff'};
          color: ${item.status === 1 ? '#67C23A' : '#409EFF'};
        ">
          ${item.status === 1 ? '已认领' : '待认领'}
        </span>
      </div>
      <div style="font-size: 13px; color: #606266; margin-bottom: 4px;">
        <strong>捡到地点：</strong>${item.location}
      </div>
      <div style="font-size: 13px; color: #606266; margin-bottom: 4px;">
        <strong>存放地点：</strong>${item.storageLocation || '未知'}
      </div>
      <div style="font-size: 13px; color: #606266;">
        <strong>描述：</strong>${item.description || '暂无'}
      </div>
    </div>
  `

  infoWindow = createInfoWindow(content)
  infoWindow.open(map, marker.getPosition())
}

function focusOnItem(item) {
  if (!map || item.lng == null || item.lat == null) return
  highlightedId.value = item.id
  map.setZoomAndCenter(15, [item.lng, item.lat])

  const idx = filteredFoundItems.value.findIndex(i => i.id === item.id)
  if (idx >= 0 && markers[idx]) {
    showInfoWindow(item, markers[idx])
  }
}

function handleSearch() {
  renderMarkers()
}

function resetMap() {
  searchKeyword.value = ''
  highlightedId.value = null
  renderMarkers()
}

function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.map-page {
  min-height: calc(100vh - 124px);
}

.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
}

.map-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.map-container-wrapper {
  display: flex;
  gap: 16px;
  height: calc(100vh - 240px);
  min-height: 500px;
}

.map-container {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.map-sidebar {
  width: 240px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  padding: 14px 16px;
  border-bottom: 1px solid #ebeef5;
  margin: 0;
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sidebar-item {
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 8px;
  background: #f9fafc;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.sidebar-item:hover {
  background: #ecf5ff;
}

.sidebar-item.active {
  background: #ecf5ff;
  border-color: #409EFF;
}

.item-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 6px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}
</style>
