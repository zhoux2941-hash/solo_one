import { ref, computed } from 'vue'
import { presets } from '@/utils/presets'
import type { Preset } from '@/types'

export function usePresets() {
  const currentPresetId = ref<string | null>(null)

  const getPresetById = (id: string): Preset | undefined => {
    return presets.find(preset => preset.id === id)
  }

  const getAllPresets = (): Preset[] => {
    return presets
  }

  const currentPreset = computed(() => {
    if (!currentPresetId.value) return null
    return getPresetById(currentPresetId.value) || null
  })

  const applyPreset = (id: string, applyFn: (preset: Preset) => void) => {
    const preset = getPresetById(id)
    if (preset) {
      applyFn(preset)
      currentPresetId.value = id
    }
  }

  return {
    currentPresetId,
    currentPreset,
    getPresetById,
    getAllPresets,
    applyPreset,
  }
}
