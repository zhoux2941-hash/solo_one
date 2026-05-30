<script setup lang="ts">
import { inject } from 'vue'
import { usePresets } from '@/composables/usePresets'
import { Sparkles } from 'lucide-vue-next'
import type { useLissajous } from '@/composables/useLissajous'

type LissajousInstance = ReturnType<typeof useLissajous>

const lissajous = inject<LissajousInstance>('lissajous')

const { getAllPresets, currentPresetId, applyPreset: applyPresetToStore } = usePresets()
const { applyPreset: applyPresetToLissajous } = lissajous!

const presets = getAllPresets()

function handlePresetClick(presetId: string) {
  applyPresetToStore(presetId, applyPresetToLissajous)
}
</script>

<template>
  <div class="preset-selector">
    <div class="flex items-center gap-2 mb-4">
      <Sparkles class="w-5 h-5 text-amber-400" />
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">预置图形</h2>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="preset in presets"
        :key="preset.id"
        @click="handlePresetClick(preset.id)"
        class="preset-card group"
        :class="{ 'preset-card-active': currentPresetId === preset.id }"
      >
        <div class="text-3xl mb-2">{{ preset.icon }}</div>
        <div class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ preset.name }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ preset.description }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.preset-card {
  @apply flex flex-col items-center justify-center p-4 rounded-xl bg-white dark:bg-gray-800;
  @apply border-2 border-gray-200 dark:border-gray-700;
  @apply transition-all duration-300 ease-out cursor-pointer;
  @apply hover:scale-105 hover:border-indigo-400 dark:hover:border-indigo-500;
  @apply hover:shadow-lg hover:shadow-indigo-500/20;
}

.preset-card-active {
  @apply border-indigo-500 dark:border-indigo-400;
  @apply shadow-lg shadow-indigo-500/40;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.4), 0 0 20px rgba(99, 102, 241, 0.2);
  }
  50% {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.6), 0 0 40px rgba(99, 102, 241, 0.3);
  }
}
</style>
