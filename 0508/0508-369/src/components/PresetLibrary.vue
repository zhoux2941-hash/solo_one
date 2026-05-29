<script setup lang="ts">
import type { PresetGradient, GradientConfig } from '../types/gradient'

interface Props {
  presets: PresetGradient[]
  hoveredPreset: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'hover', name: string | null): void
  (e: 'select', config: GradientConfig): void
}>()

const getGradientStyle = (config: GradientConfig) => {
  const stops = [...config.colorStops]
    .sort((a, b) => a.position - b.position)
    .map(stop => {
      const hex = stop.color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${stop.opacity}) ${stop.position}%`
    })
    .join(', ')

  if (config.type === 'linear') {
    const direction = config.linearDirection === 'angle'
      ? `${config.angle}deg`
      : config.linearDirection
    return `linear-gradient(${direction}, ${stops})`
  } else {
    const shape = config.radialShape
    const size = config.radialSize
    return `radial-gradient(${shape} ${size}, ${stops})`
  }
}
</script>

<template>
  <div class="preset-library">
    <div class="preset-grid">
      <div
        v-for="preset in presets"
        :key="preset.name"
        class="preset-item"
        :class="{ active: hoveredPreset === preset.name }"
        @mouseenter="emit('hover', preset.name)"
        @mouseleave="emit('hover', null)"
        @click="emit('select', preset.config)"
      >
        <div 
          class="preset-preview" 
          :style="{ background: getGradientStyle(preset.config) }"
        ></div>
        <div class="preset-name">{{ preset.name }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preset-library {
  margin-top: 10px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.preset-item {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.preset-item:hover {
  transform: translateY(-3px);
}

.preset-item.active .preset-preview {
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
}

.preset-preview {
  height: 40px;
  border-radius: 8px;
  margin-bottom: 6px;
  transition: box-shadow 0.2s ease;
}

.preset-name {
  color: #a0aec0;
  font-size: 0.8rem;
  text-align: center;
}
</style>
