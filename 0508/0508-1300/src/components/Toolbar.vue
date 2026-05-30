<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { Play, Pause, RotateCcw, Download, Circle } from 'lucide-vue-next'
import type { useLissajous } from '@/composables/useLissajous'

type LissajousInstance = ReturnType<typeof useLissajous>

interface Props {
  onExport?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  onExport: () => {},
})

const lissajous = inject<LissajousInstance>('lissajous')

const { isPlaying, togglePlay, resetTime, currentTime, animationSpeed, tracerOptions } = lissajous!

const ripples = ref<{ id: number; x: number; y: number }[]>([])
let rippleId = 0

function createRipple(event: MouseEvent) {
  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const id = rippleId++
  ripples.value.push({ id, x, y })
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== id)
  }, 600)
}

const progress = computed(() => {
  const { fx, fy } = lissajous!.params.value
  const a = Math.round(fx)
  const b = Math.round(fy)
  const cycle = lcm(a, b) / (a * b) || 1
  return ((currentTime.value % cycle) / cycle) * 100
})

function formatTime(time: number): string {
  return `${time.toFixed(2)} s`
}

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return Math.abs(a * b) / gcd(a, b)
}

function updateSpeed(event: Event) {
  const target = event.target as HTMLInputElement
  animationSpeed.value = parseFloat(target.value)
}

function toggleTracer() {
  tracerOptions.value.enabled = !tracerOptions.value.enabled
}
</script>

<template>
  <div class="toolbar-wrapper">
    <div class="toolbar">
      <div class="toolbar-left">
        <button
          class="toolbar-btn"
          :class="{ active: isPlaying }"
          @click="togglePlay"
          @mousedown="createRipple"
        >
          <Play v-if="!isPlaying" :size="20" />
          <Pause v-else :size="20" />
          <span
            v-for="ripple in ripples"
            :key="ripple.id"
            class="ripple"
            :style="{ left: ripple.x + 'px', top: ripple.y + 'px' }"
          ></span>
        </button>

        <button
          class="toolbar-btn"
          @click="resetTime"
          @mousedown="createRipple"
        >
          <RotateCcw :size="20" />
          <span
            v-for="ripple in ripples"
            :key="ripple.id"
            class="ripple"
            :style="{ left: ripple.x + 'px', top: ripple.y + 'px' }"
          ></span>
        </button>

        <button
          class="toolbar-btn"
          :class="{ active: tracerOptions.enabled }"
          @click="toggleTracer"
          @mousedown="createRipple"
        >
          <Circle :size="20" />
          <span
            v-for="ripple in ripples"
            :key="ripple.id"
            class="ripple"
            :style="{ left: ripple.x + 'px', top: ripple.y + 'px' }"
          ></span>
        </button>

        <button
          class="toolbar-btn"
          @click="props.onExport"
          @mousedown="createRipple"
        >
          <Download :size="20" />
          <span
            v-for="ripple in ripples"
            :key="ripple.id"
            class="ripple"
            :style="{ left: ripple.x + 'px', top: ripple.y + 'px' }"
          ></span>
        </button>
      </div>

      <div class="toolbar-center">
        <div class="progress-container">
          <div class="progress-label">
            <span>{{ formatTime(currentTime) }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="toolbar-right">
        <div class="speed-control">
          <span class="speed-label">{{ animationSpeed.toFixed(1) }}x</span>
          <input
            type="range"
            class="speed-slider"
            min="0.1"
            max="2"
            step="0.1"
            :value="animationSpeed"
            @input="updateSpeed"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-wrapper {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

:global(.dark) .toolbar {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-center {
  flex: 1;
  min-width: 200px;
}

.toolbar-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #333;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
}

:global(.dark) .toolbar-btn {
  color: #e5e5e5;
}

.toolbar-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  box-shadow: 
    0 0 20px rgba(99, 102, 241, 0.4),
    0 0 40px rgba(99, 102, 241, 0.2);
  transform: translateY(-1px);
}

.toolbar-btn:active {
  transform: translateY(0);
}

.toolbar-btn.active {
  background: rgba(99, 102, 241, 0.3);
  color: #6366f1;
}

:global(.dark) .toolbar-btn.active {
  color: #818cf8;
}

.ripple {
  position: absolute;
  width: 20px;
  height: 20px;
  background: rgba(99, 102, 241, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-animation {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-label {
  font-size: 12px;
  color: #666;
  text-align: center;
}

:global(.dark) .progress-label {
  color: #999;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

:global(.dark) .progress-bar {
  background: rgba(255, 255, 255, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 2px;
  transition: width 0.05s linear;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.speed-label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  min-width: 36px;
  text-align: center;
}

:global(.dark) .speed-label {
  color: #e5e5e5;
}

.speed-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100px;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  outline: none;
}

:global(.dark) .speed-slider {
  background: rgba(255, 255, 255, 0.1);
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #6366f1;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
  transition: all 0.2s ease;
}

.speed-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 
    0 2px 10px rgba(99, 102, 241, 0.6),
    0 0 20px rgba(99, 102, 241, 0.3);
}

.speed-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #6366f1;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
  transition: all 0.2s ease;
}

.speed-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 
    0 2px 10px rgba(99, 102, 241, 0.6),
    0 0 20px rgba(99, 102, 241, 0.3);
}
</style>
