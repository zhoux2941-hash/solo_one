<template>
  <div class="map-picker">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="地图选点">
          <div class="picker-header">
            <el-input
              v-model="searchText"
              placeholder="输入地址搜索..."
              style="flex: 1"
              @keyup.enter="searchLocation"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="searchLocation">搜索</el-button>
          </div>
          <div class="picker-tip">
            提示：在地图上点击可以选择存放点位置
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="已选位置">
          <div class="selected-info">
            <div v-if="selectedPosition">
              <el-tag type="success" size="large">
                经度: {{ selectedPosition.lng.toFixed(6) }}
              </el-tag>
              <el-tag type="success" size="large" style="margin-left: 8px">
                纬度: {{ selectedPosition.lat.toFixed(6) }}
              </el-tag>
              <el-button type="danger" text size="small" style="margin-left: 8px" @click="clearPosition">
                清除
              </el-button>
            </div>
            <div v-else class="empty-text">
              请在地图上点击选择存放位置
            </div>
          </div>
        </el-form-item>
      </el-col>
    </el-row>

    <div ref="mapRef" class="picker-map" v-loading="mapLoading"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { isMapLoaded, waitForMap, createMap, createMarker, getPositionFromEvent } from '@/utils/map'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const mapRef = ref(null)
const mapLoading = ref(false)
const searchText = ref('')
const selectedPosition = ref(props.modelValue)

let map = null
let marker = null
let geocoder = null

watch(selectedPosition, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.modelValue, (val) => {
  if (val && (!selectedPosition.value || 
      val.lng !== selectedPosition.value.lng || 
      val.lat !== selectedPosition.value.lat)) {
    selectedPosition.value = val
    updateMarker(val)
  }
})

onMounted(async () => {
  mapLoading.value = true
  try {
    if (!isMapLoaded()) {
      await waitForMap(8000)
    }
    await nextTick()
    initMap()
    if (props.modelValue) {
      updateMarker(props.modelValue)
    }
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

function initMap() {
  map = createMap(mapRef.value, {
    zoom: 13,
    center: [116.397428, 39.90923]
  })

  const AMap = window.AMap
  geocoder = new AMap.Geocoder()

  map.on('click', (e) => {
    if (props.disabled) return
    const pos = getPositionFromEvent(e)
    selectedPosition.value = pos
    updateMarker(pos)
  })
}

function updateMarker(pos) {
  if (!map || !pos) return

  if (marker) {
    marker.setPosition([pos.lng, pos.lat])
  } else {
    marker = createMarker(map, [pos.lng, pos.lat], {
      offset: window.AMap.Pixel(-13, -30),
      content: createMarkerContent()
    })
  }

  map.setZoomAndCenter(16, [pos.lng, pos.lat])
}

function createMarkerContent() {
  return `
    <div style="
      position: relative;
      width: 26px;
      height: 34px;
      background: #409EFF;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>
  `
}

async function searchLocation() {
  if (!searchText.value.trim() || !geocoder) return

  geocoder.getLocation(searchText.value, (status, result) => {
    if (status === 'complete' && result.geocodes.length) {
      const loc = result.geocodes[0].location
      const pos = { lng: loc.getLng(), lat: loc.getLat() }
      selectedPosition.value = pos
      updateMarker(pos)
      ElMessage.success('位置搜索成功')
    } else {
      ElMessage.error('未找到该地址，请尝试在地图上直接点击选择')
    }
  })
}

function clearPosition() {
  selectedPosition.value = null
  if (marker) {
    marker.setMap(null)
    marker = null
  }
}
</script>

<style scoped>
.picker-header {
  display: flex;
  gap: 8px;
}

.picker-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.selected-info {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  min-height: 60px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.empty-text {
  color: #909399;
  font-size: 13px;
}

.picker-map {
  height: 320px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
}
</style>
