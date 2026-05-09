import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const currentOwnerId = ref(1)
  const sidebarCollapsed = ref(false)
  
  const setCurrentOwner = (ownerId) => {
    currentOwnerId.value = ownerId
  }
  
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  return {
    currentOwnerId,
    sidebarCollapsed,
    setCurrentOwner,
    toggleSidebar
  }
})
