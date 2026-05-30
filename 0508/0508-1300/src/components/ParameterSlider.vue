<script setup lang="ts">
interface Props {
  modelValue: number
  label: string
  min?: number
  max?: number
  step?: number
  unit?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 1,
  max: 20,
  step: 1,
  unit: 'Hz'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', Number(target.value))
}
</script>

<template>
  <div class="parameter-slider-container">
    <div class="flex justify-between items-center mb-2">
      <label class="text-sm font-medium text-gray-300">{{ label }}</label>
      <span class="text-sm font-semibold text-cyan-400">
        {{ modelValue }}<span class="text-gray-500 ml-1">{{ unit }}</span>
      </span>
    </div>
    <input
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      @input="handleInput"
      class="slider-track w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
    />
  </div>
</template>

<style scoped>
.parameter-slider-container {
  --slider-thumb-size: 20px;
  --slider-thumb-color: #22d3ee;
  --slider-thumb-glow: 0 0 12px rgba(34, 211, 238, 0.6);
  --slider-thumb-hover-glow: 0 0 20px rgba(34, 211, 238, 0.9);
  --slider-track-height: 8px;
  --slider-track-radius: 9999px;
}

.slider-track {
  height: var(--slider-track-height);
  border-radius: var(--slider-track-radius);
  background: linear-gradient(90deg, #374151 0%, #4b5563 50%, #374151 100%);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider-track::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: var(--slider-thumb-size);
  height: var(--slider-thumb-size);
  border-radius: 50%;
  background: var(--slider-thumb-color);
  cursor: pointer;
  box-shadow: var(--slider-thumb-glow);
  transition: all 0.2s ease;
  border: 2px solid #1e293b;
}

.slider-track::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: var(--slider-thumb-hover-glow);
}

.slider-track::-moz-range-thumb {
  width: var(--slider-thumb-size);
  height: var(--slider-thumb-size);
  border-radius: 50%;
  background: var(--slider-thumb-color);
  cursor: pointer;
  box-shadow: var(--slider-thumb-glow);
  transition: all 0.2s ease;
  border: 2px solid #1e293b;
}

.slider-track::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: var(--slider-thumb-hover-glow);
}

.slider-track::-ms-thumb {
  width: var(--slider-thumb-size);
  height: var(--slider-thumb-size);
  border-radius: 50%;
  background: var(--slider-thumb-color);
  cursor: pointer;
  box-shadow: var(--slider-thumb-glow);
  transition: all 0.2s ease;
  border: 2px solid #1e293b;
}

.slider-track::-ms-thumb:hover {
  transform: scale(1.1);
  box-shadow: var(--slider-thumb-hover-glow);
}

.slider-track::-moz-range-track {
  height: var(--slider-track-height);
  border-radius: var(--slider-track-radius);
  background: linear-gradient(90deg, #374151 0%, #4b5563 50%, #374151 100%);
}

.slider-track::-ms-track {
  height: var(--slider-track-height);
  border-radius: var(--slider-track-radius);
  background: linear-gradient(90deg, #374151 0%, #4b5563 50%, #374151 100%);
  border-color: transparent;
  color: transparent;
}

@media (max-width: 640px) {
  .parameter-slider-container {
    --slider-thumb-size: 24px;
  }
  
  .slider-track {
    height: 10px;
  }
}
</style>
