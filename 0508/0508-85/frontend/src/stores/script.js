import { defineStore } from 'pinia'
import { ref } from 'vue'
import { scriptApi } from '../api'

export const useScriptStore = defineStore('script', () => {
  const scripts = ref([])
  const currentScript = ref(null)

  const loadScripts = async () => {
    try {
      const res = await scriptApi.getAll()
      scripts.value = res.data
    } catch (error) {
      console.error('Failed to load scripts:', error)
    }
  }

  const loadScript = async (id) => {
    try {
      const res = await scriptApi.getById(id)
      currentScript.value = res.data
      return res.data
    } catch (error) {
      console.error('Failed to load script:', error)
    }
  }

  const setCurrentScript = (script) => {
    currentScript.value = script
  }

  return {
    scripts,
    currentScript,
    loadScripts,
    loadScript,
    setCurrentScript
  }
})
