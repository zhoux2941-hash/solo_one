<template>
  <div class="image-comparison" ref="containerRef">
    <div class="comparison-header">
      <span class="left-label">{{ leftLabel }}</span>
      <span class="right-label">{{ rightLabel }}</span>
    </div>
    
    <div class="comparison-wrapper" ref="wrapperRef" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
      <div class="image-container left-image">
        <img :src="leftImage" alt="Left" ref="leftImgRef" @load="onImageLoad" />
        
        <svg class="markers-svg" v-if="showMarkers && matchedPoints.length > 0">
          <line
            v-for="(point, index) in matchedPoints"
            :key="index"
            :x1="point.query_point.x"
            :y1="point.query_point.y"
            :x2="point.sample_point.x + wrapperWidth"
            :y2="point.sample_point.y"
            :class="`match-line ${point.inlier ? 'inlier' : 'outlier'}`"
            :style="{ opacity: highlightedIndex === index ? 1 : 0.6 }"
          />
          
          <circle
            v-for="(point, index) in matchedPoints"
            :key="'q-' + index"
            :cx="point.query_point.x"
            :cy="point.query_point.y"
            :r="highlightedIndex === index ? 8 : 5"
            :class="`marker ${point.inlier ? 'inlier' : 'outlier'}`"
            @mouseenter="highlightedIndex = index"
            @mouseleave="highlightedIndex = -1"
          />
          
          <circle
            v-for="(point, index) in matchedPoints"
            :key="'s-' + index"
            :cx="point.sample_point.x"
            :cy="point.sample_point.y"
            :r="highlightedIndex === index ? 8 : 5"
            :class="`marker ${point.inlier ? 'inlier' : 'outlier'}`"
            @mouseenter="highlightedIndex = index"
            @mouseleave="highlightedIndex = -1"
          />
        </svg>
        
        <div 
          v-if="regions && regions.left && showRegions" 
          class="region-overlay"
          :style="getRegionStyle(regions.left)"
        >
          <span class="region-label">底火区域</span>
        </div>
      </div>
      
      <div class="image-container right-image">
        <img :src="rightImage" alt="Right" ref="rightImgRef" @load="onImageLoad" />
        
        <div 
          v-if="regions && regions.right && showRegions" 
          class="region-overlay"
          :style="getRegionStyle(regions.right)"
        >
          <span class="region-label">底火区域</span>
        </div>
      </div>
      
      <div 
        v-if="mode === 'slider'" 
        class="slider-handle"
        :style="{ left: sliderPosition + '%' }"
      >
        <div class="slider-line"></div>
        <div class="slider-button">
          <el-icon><ArrowRight /></el-icon>
          <el-icon><ArrowLeft /></el-icon>
        </div>
      </div>
      
      <div 
        v-if="mode === 'slider'" 
        class="slider-overlay"
        :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }"
      >
        <img :src="rightImage" alt="Overlay" />
      </div>
    </div>
    
    <div class="comparison-toolbar">
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="slider">滑动对比</el-radio-button>
        <el-radio-button value="side-by-side">并列显示</el-radio-button>
      </el-radio-group>
      
      <div class="toolbar-right">
        <el-checkbox v-model="showMarkers" size="small">显示匹配点</el-checkbox>
        <el-checkbox v-model="showRegions" size="small" style="margin-left: 12px;">显示区域</el-checkbox>
      </div>
    </div>
    
    <div v-if="matchStats" class="match-stats">
      <div class="stat-item">
        <span class="stat-label">匹配点数</span>
        <span class="stat-value">{{ matchStats.total }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">内点数量</span>
        <span class="stat-value inlier">{{ matchStats.inliers }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">外点数量</span>
        <span class="stat-value outlier">{{ matchStats.outliers }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  leftImage: {
    type: String,
    required: true
  },
  rightImage: {
    type: String,
    required: true
  },
  leftLabel: {
    type: String,
    default: '查询图像'
  },
  rightLabel: {
    type: String,
    default: '样本图像'
  },
  matchedPoints: {
    type: Array,
    default: () => []
  },
  regions: {
    type: Object,
    default: null
  },
  mode: {
    type: String,
    default: 'slider'
  }
})

const containerRef = ref(null)
const wrapperRef = ref(null)
const leftImgRef = ref(null)
const rightImgRef = ref(null)

const sliderPosition = ref(50)
const showMarkers = ref(true)
const showRegions = ref(false)
const highlightedIndex = ref(-1)
const wrapperWidth = ref(0)
const imagesLoaded = ref(0)

const matchStats = computed(() => {
  if (props.matchedPoints.length === 0) return null
  
  const inliers = props.matchedPoints.filter(p => p.inlier).length
  const outliers = props.matchedPoints.length - inliers
  
  return {
    total: props.matchedPoints.length,
    inliers,
    outliers
  }
})

function onImageLoad() {
  imagesLoaded.value++
  if (imagesLoaded.value >= 2) {
    updateWrapperWidth()
  }
}

function updateWrapperWidth() {
  nextTick(() => {
    if (wrapperRef.value) {
      const rect = wrapperRef.value.getBoundingClientRect()
      wrapperWidth.value = rect.width / 2
    }
  })
}

function onMouseMove(event) {
  if (props.mode !== 'slider' || !wrapperRef.value) return
  
  const rect = wrapperRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = (x / rect.width) * 100
  sliderPosition.value = Math.max(0, Math.min(100, percentage))
}

function onMouseLeave() {
}

function getRegionStyle(region) {
  if (!region) return {}
  
  const style = {
    position: 'absolute',
    border: '2px dashed #409eff',
    borderRadius: '50%',
    pointerEvents: 'none',
    background: 'rgba(64, 158, 255, 0.1)'
  }
  
  if (region.radius) {
    style.left = region.center.x - region.radius + 'px'
    style.top = region.center.y - region.radius + 'px'
    style.width = region.radius * 2 + 'px'
    style.height = region.radius * 2 + 'px'
  } else if (region.width && region.height) {
    style.left = region.center.x - region.width / 2 + 'px'
    style.top = region.center.y - region.height / 2 + 'px'
    style.width = region.width + 'px'
    style.height = region.height + 'px'
    style.borderRadius = '4px'
  }
  
  return style
}

watch([() => props.leftImage, () => props.rightImage], () => {
  imagesLoaded.value = 0
})

onMounted(() => {
  window.addEventListener('resize', updateWrapperWidth)
})
</script>

<style scoped>
.image-comparison {
  width: 100%;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.left-label, .right-label {
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.comparison-wrapper {
  position: relative;
  width: 100%;
  min-height: 300px;
  display: flex;
  cursor: col-resize;
  background: #0d0d1a;
}

.image-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.left-image {
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.markers-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.match-line {
  stroke-width: 1;
  stroke: #67c23a;
  opacity: 0.6;
}

.match-line.outlier {
  stroke: #e6a23c;
  opacity: 0.3;
}

.match-line:hover {
  stroke-width: 2;
  opacity: 1;
}

.marker {
  fill: #67c23a;
  stroke: #fff;
  stroke-width: 2;
  pointer-events: all;
  cursor: pointer;
}

.marker.outlier {
  fill: #e6a23c;
}

.region-overlay {
  position: absolute;
  border: 2px dashed #409eff;
  border-radius: 50%;
  pointer-events: none;
  background: rgba(64, 158, 255, 0.1);
}

.region-label {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: #409eff;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
}

.slider-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #fff;
  z-index: 20;
  pointer-events: none;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.slider-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -1px;
  width: 4px;
  background: linear-gradient(180deg, #409eff, #67c23a);
}

.slider-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  color: #fff;
}

.slider-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 5;
}

.slider-overlay img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.comparison-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.match-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  font-family: monospace;
}

.stat-value.inlier {
  color: #67c23a;
}

.stat-value.outlier {
  color: #e6a23c;
}
</style>
