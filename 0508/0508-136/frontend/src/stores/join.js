import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getFavorites, createFavorite, updateFavorite, deleteFavorite } from '@/api/favorite'
import { ElMessage } from 'element-plus'

export const useJoinStore = defineStore('join', () => {
  const joinTypes = ref([])
  const currentType = ref('DOVETAIL')
  
  const woodParams = ref({
    length: 200,
    width: 100,
    height: 30
  })
  
  const tenonParams = ref({
    length: 30,
    width: 20,
    height: 20
  })
  
  const margin = ref(5)
  
  const calculationResult = ref(null)
  const isCalculating = ref(false)
  
  const favorites = ref([])
  
  const currentParams = computed(() => ({
    joinType: currentType.value,
    woodLength: woodParams.value.length,
    woodWidth: woodParams.value.width,
    woodHeight: woodParams.value.height,
    tenonLength: tenonParams.value.length,
    tenonWidth: tenonParams.value.width,
    tenonHeight: tenonParams.value.height,
    margin: margin.value
  }))
  
  function setJoinType(type) {
    currentType.value = type
  }
  
  function updateWoodParams(params) {
    woodParams.value = { ...woodParams.value, ...params }
  }
  
  function updateTenonParams(params) {
    tenonParams.value = { ...tenonParams.value, ...params }
  }
  
  function setMargin(value) {
    margin.value = value
  }
  
  function setCalculationResult(result) {
    calculationResult.value = result
  }
  
  function setCalculating(val) {
    isCalculating.value = val
  }
  
  async function loadFavorites() {
    try {
      const data = await getFavorites()
      favorites.value = data
    } catch (e) {
      console.error('加载收藏失败:', e)
    }
  }
  
  async function addFavorite(name, description = '') {
    try {
      const data = await createFavorite({
        name,
        description,
        ...currentParams.value
      })
      favorites.value.unshift(data)
      ElMessage.success('收藏成功')
      return data
    } catch (e) {
      ElMessage.error('收藏失败')
      throw e
    }
  }
  
  async function removeFavorite(id) {
    try {
      await deleteFavorite(id)
      favorites.value = favorites.value.filter(f => f.id !== id)
      ElMessage.success('删除成功')
    } catch (e) {
      ElMessage.error('删除失败')
      throw e
    }
  }
  
  function applyFavorite(favorite) {
    currentType.value = favorite.joinType
    woodParams.value = {
      length: favorite.woodLength,
      width: favorite.woodWidth,
      height: favorite.woodHeight
    }
    tenonParams.value = {
      length: favorite.tenonLength,
      width: favorite.tenonWidth,
      height: favorite.tenonHeight
    }
    margin.value = favorite.margin
  }
  
  return {
    joinTypes,
    currentType,
    woodParams,
    tenonParams,
    margin,
    calculationResult,
    isCalculating,
    favorites,
    currentParams,
    setJoinType,
    updateWoodParams,
    updateTenonParams,
    setMargin,
    setCalculationResult,
    setCalculating,
    loadFavorites,
    addFavorite,
    removeFavorite,
    applyFavorite
  }
})