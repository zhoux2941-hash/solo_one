<script setup lang="ts">
import { computed, inject } from 'vue'
import { Sliders, Activity, Sparkles, Grid3x3, Target } from 'lucide-vue-next'
import ParameterSlider from './ParameterSlider.vue'
import type { useLissajous } from '@/composables/useLissajous'

type LissajousInstance = ReturnType<typeof useLissajous>

const lissajous = inject<LissajousInstance>('lissajous')

const {
  params,
  drawingOptions,
  tracerOptions,
  frequencyRatio,
  setParams,
  setDrawingOptions,
  setTracerOptions
} = lissajous!

const ratioDisplay = computed(() => frequencyRatio.value.string)
</script>

<template>
  <div class="glass-panel rounded-2xl p-6 w-80">
    <div class="flex items-center gap-3 mb-6">
      <div class="p-2 bg-cyan-500/20 rounded-xl">
        <Sliders class="w-5 h-5 text-cyan-500" />
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">参数控制</h2>
    </div>

    <div class="flex items-center justify-center gap-3 mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20">
      <Activity class="w-6 h-6 text-cyan-500" />
      <span class="text-4xl font-black bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
        {{ ratioDisplay }}
      </span>
    </div>

    <div class="space-y-5 mb-6">
      <ParameterSlider
        label="X轴频率 (fx)"
        :model-value="params.fx"
        :min="1"
        :max="20"
        :step="1"
        @update:model-value="(v) => setParams({ fx: v })"
      />
      <ParameterSlider
        label="Y轴频率 (fy)"
        :model-value="params.fy"
        :min="1"
        :max="20"
        :step="1"
        @update:model-value="(v) => setParams({ fy: v })"
      />
      <ParameterSlider
        label="相位 (phase)"
        :model-value="params.phase"
        :min="0"
        :max="360"
        :step="1"
        unit="°"
        @update:model-value="(v) => setParams({ phase: v })"
      />
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
        <div class="flex items-center gap-2">
          <Target class="w-4 h-4 text-orange-500" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">描点模式</span>
        </div>
        <button
          type="button"
          @click="setTracerOptions({ enabled: !tracerOptions.enabled })"
          :class="[
            'relative w-11 h-6 rounded-full transition-colors duration-200',
            tracerOptions.enabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
          ]"
        >
          <span
            :class="[
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
              tracerOptions.enabled ? 'translate-x-5' : 'translate-x-0'
            ]"
          />
        </button>
      </div>

      <div v-if="tracerOptions.enabled" class="space-y-3 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">拖尾长度</span>
          <span class="text-xs text-orange-500 font-mono">{{ tracerOptions.trailLength }}</span>
        </div>
        <input
          type="range"
          :value="tracerOptions.trailLength"
          min="20"
          max="300"
          step="10"
          class="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full appearance-none cursor-pointer"
          @input="(e) => setTracerOptions({ trailLength: parseInt((e.target as HTMLInputElement).value) })"
        />
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">点大小</span>
          <span class="text-xs text-orange-500 font-mono">{{ tracerOptions.pointSize }}px</span>
        </div>
        <input
          type="range"
          :value="tracerOptions.pointSize"
          min="2"
          max="15"
          step="1"
          class="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full appearance-none cursor-pointer"
          @input="(e) => setTracerOptions({ pointSize: parseInt((e.target as HTMLInputElement).value) })"
        />
      </div>

      <div class="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
        <div class="flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-purple-500" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">发光效果</span>
        </div>
        <button
          type="button"
          @click="setDrawingOptions({ glowEffect: !drawingOptions.glowEffect })"
          :class="[
            'relative w-11 h-6 rounded-full transition-colors duration-200',
            drawingOptions.glowEffect ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
          ]"
        >
          <span
            :class="[
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
              drawingOptions.glowEffect ? 'translate-x-5' : 'translate-x-0'
            ]"
          />
        </button>
      </div>

      <div class="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
        <div class="flex items-center gap-2">
          <Grid3x3 class="w-4 h-4 text-cyan-500" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">网格/坐标轴</span>
        </div>
        <button
          type="button"
          @click="setDrawingOptions({ showGrid: !drawingOptions.showGrid, showAxes: !drawingOptions.showAxes })"
          :class="[
            'relative w-11 h-6 rounded-full transition-colors duration-200',
            drawingOptions.showGrid ? 'bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
          ]"
        >
          <span
            :class="[
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
              drawingOptions.showGrid ? 'translate-x-5' : 'translate-x-0'
            ]"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

:global(.dark) .glass-panel {
  background: rgba(17, 24, 39, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);
  transition: transform 0.2s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);
}

input[type="range"].w-full::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316, #ef4444);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;
}

input[type="range"].w-full::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 12px rgba(249, 115, 22, 0.8);
}

input[type="range"].w-full::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316, #ef4444);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;
}

input[type="range"].w-full::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 12px rgba(249, 115, 22, 0.8);
}
</style>
