<script setup lang="ts">
import { computed } from 'vue'
import type { GradientConfig } from '../types/gradient'

interface Props {
  config: GradientConfig
}

const props = defineProps<Props>()

const gradientStyle = computed(() => {
  const stops = [...props.config.colorStops]
    .sort((a, b) => a.position - b.position)
    .map(stop => {
      const hex = stop.color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${stop.opacity}) ${stop.position}%`
    })
    .join(', ')

  if (props.config.type === 'linear') {
    const direction = props.config.linearDirection === 'angle'
      ? `${props.config.angle}deg`
      : props.config.linearDirection
    return {
      background: `linear-gradient(${direction}, ${stops})`
    }
  } else {
    const shape = props.config.radialShape
    const size = props.config.radialSize
    return {
      background: `radial-gradient(${shape} ${size}, ${stops})`
    }
  }
})
</script>

<template>
  <div class="gradient-preview">
    <div class="preview-header">
      <h2>实时预览</h2>
    </div>
    <div class="preview-area">
      <div class="preview-box" :style="gradientStyle"></div>
      <div class="preview-shapes">
        <div class="shape-item" :style="gradientStyle">方形</div>
        <div class="shape-item rounded" :style="gradientStyle">圆角</div>
        <div class="shape-item circle" :style="gradientStyle">圆形</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gradient-preview {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-header h2 {
  color: #fff;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.preview-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-box {
  height: 200px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.preview-shapes {
  display: flex;
  justify-content: space-around;
  gap: 15px;
}

.shape-item {
  flex: 1;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.shape-item:hover {
  transform: scale(1.05);
}

.shape-item.rounded {
  border-radius: 20px;
}

.shape-item.circle {
  border-radius: 50%;
}
</style>
