<script setup lang="ts">
import type { ColorStop } from '../types/gradient'

interface Props {
  colorStop: ColorStop
  index: number
  total: number
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update', field: keyof ColorStop, value: string | number): void
  (e: 'remove'): void
  (e: 'move-up'): void
  (e: 'move-down'): void
}>()
</script>

<template>
  <div class="color-stop-item">
    <div class="color-picker-wrapper">
      <input
        type="color"
        :value="colorStop.color"
        @input="emit('update', 'color', ($event.target as HTMLInputElement).value)"
        class="color-picker"
      />
    </div>
    
    <div class="color-info">
      <div class="hex-value">{{ colorStop.color }}</div>
      
      <div class="controls">
        <div class="control-group">
          <label>位置</label>
          <input
            type="range"
            min="0"
            max="100"
            :value="colorStop.position"
            @input="emit('update', 'position', Number(($event.target as HTMLInputElement).value))"
            class="position-slider"
          />
          <span class="position-value">{{ colorStop.position }}%</span>
        </div>
        
        <div class="control-group">
          <label>透明度</label>
          <input
            type="range"
            min="0"
            max="100"
            :value="Math.round(colorStop.opacity * 100)"
            @input="emit('update', 'opacity', Number(($event.target as HTMLInputElement).value) / 100)"
            class="opacity-slider"
          />
          <span class="opacity-value">{{ Math.round(colorStop.opacity * 100) }}%</span>
        </div>
      </div>
    </div>
    
    <div class="actions">
      <button
        class="action-btn move-up"
        :disabled="index === 0"
        @click="emit('move-up')"
        title="上移"
      >
        ↑
      </button>
      <button
        class="action-btn move-down"
        :disabled="index === total - 1"
        @click="emit('move-down')"
        title="下移"
      >
        ↓
      </button>
      <button
        class="action-btn remove"
        :disabled="total <= 2"
        @click="emit('remove')"
        title="删除"
      >
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.color-stop-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.color-stop-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.color-picker-wrapper {
  flex-shrink: 0;
}

.color-picker {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  padding: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
}

.color-info {
  flex: 1;
  min-width: 0;
}

.hex-value {
  color: #a0aec0;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.controls {
  display: flex;
  gap: 15px;
}

.control-group {
  flex: 1;
}

.control-group label {
  display: block;
  color: #718096;
  font-size: 0.75rem;
  margin-bottom: 4px;
}

.position-slider, .opacity-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
}

.position-slider::-webkit-slider-thumb,
.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.position-value, .opacity-value {
  display: block;
  color: #a0aec0;
  font-size: 0.75rem;
  text-align: right;
  margin-top: 2px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.action-btn.remove:hover:not(:disabled) {
  background: #dc2626;
}
</style>
